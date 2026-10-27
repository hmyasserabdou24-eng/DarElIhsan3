-- =====================================================================
-- 09) الترقية الأمنية الشاملة + استعادة وإظهار جميع الأطفال الـ 103 وربط الأولياء
-- شغّل هذا الكود بالكامل في Supabase ▸ SQL Editor دفعة واحدة
-- آمن لإعادة التشغيل (Idempotent) ولا يحذف أي بيانات
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1) إعادة منح صلاحيات قراءة جميع الأعمدة غير السرية لجدول الأطفال (لحل مشكلة عدم ظهور الأطفال بعد 05-child-qr-card.sql)
grant select (
  id, membership_no, full_name, dob, disability, phone, center,
  branch_id, section_id, section, academic_year, basic_info,
  photo_consent, active, created_by, created_at, updated_at,
  member_no, enrolled_on, qr_show_extra, public_uuid
) on public.children to authenticated;

-- 2) السماح للمدير باستدعاء import_official_students() من لوحة الإدارة لمزامنة الـ 103 طالب في أي وقت
grant execute on function public.import_official_students() to authenticated;

-- تنفيذ الاستيراد الآن لضمان وجود الـ 103 طالب وربطهم بالأقسام الـ 11 والفروع الـ 3
select public.import_official_students();

-- 3) دالة الربط التلقائي للولي بطفله عند الدخول باسم المستخدم (مثل hadj.brahim.004)
create or replace function public.ensure_parent_child_link()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_mem text;
  v_cid uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null then
    return false;
  end if;

  -- استخراج رقم القيد المكون من 3 أرقام من البريد/اسم المستخدم (مثال: hadj.brahim.004@parents.darelihsan.invalid)
  v_mem := substring(v_email from '\.([0-9]{3})@');
  if v_mem is null then
    return false;
  end if;

  select id into v_cid from public.children where membership_no = v_mem limit 1;
  if v_cid is null then
    return false;
  end if;

  insert into public.parent_profiles (user_id, full_name, email, disabled)
  values (
    auth.uid(),
    coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), 'ولي أمر'),
    v_email,
    false
  )
  on conflict (user_id) do update set disabled = false;

  insert into public.parent_children (parent_id, child_id, relation)
  values (auth.uid(), v_cid, 'ولي أمر')
  on conflict (parent_id, child_id) do nothing;

  return true;
end;
$$;
revoke all on function public.ensure_parent_child_link() from public, anon;
grant execute on function public.ensure_parent_child_link() to authenticated;

-- 4) [UWSS-01] منع تسرب _portal_meta إلى الصف العام published في site_content
create or replace function public.publish_content()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
  t timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;

  select (data - '_portal_meta') into d
  from public.site_content
  where id = 'draft';

  if d is null then
    raise exception 'لا توجد مسودة';
  end if;

  insert into public.site_content_history (data, published_by)
    select (data - '_portal_meta'), auth.uid()
    from public.site_content
    where id = 'published' and data <> '{}'::jsonb;

  insert into public.site_content (id, data, updated_at, updated_by)
    values ('published', d, t, auth.uid())
  on conflict (id) do update
    set data = excluded.data,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;

  delete from public.site_content_history
   where id not in (
     select id from public.site_content_history order by id desc limit 30
   );

  perform public.audit_log('publish');
  return t;
end $$;
revoke all on function public.publish_content() from public, anon;
grant execute on function public.publish_content() to authenticated;

update public.site_content
   set data = data - '_portal_meta'
 where id = 'published' and data ? '_portal_meta';

-- 5) [UWSS-03] حماية خصوصية الطفل في صفحة QR العامة (عدم كشف طبيعة الإعاقة وتاريخ الميلاد للعموم)
create or replace function public.public_child_card(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.children%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return jsonb_build_object('found', false);
  end if;

  select * into r
  from public.children
  where qr_token = p_token and active;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'full_name', r.full_name,
    'center', r.center,
    'membership_no', r.membership_no,
    'member_no', r.membership_no,
    'section', case when coalesce(r.qr_show_extra, false) then r.section else null end,
    'dob', case when coalesce(r.qr_show_extra, false) then r.dob else null end,
    'disability', null,
    'academic_year', r.academic_year
  );
end $$;
revoke all on function public.public_child_card(text) from public;
grant execute on function public.public_child_card(text) to anon, authenticated;

-- 6) [UWSS-06] إضافة Rate Limiting (5 محاولات كل 15 دقيقة) على استرداد رمز تسجيل الولي
create or replace function public.redeem_registration_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_rec record;
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول لاسترداد رمز التسجيل' using errcode = '42501';
  end if;

  if not public.rate_limit_hit('redeem_code:' || auth.uid()::text, 5, 900) then
    raise exception 'محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة.' using errcode = 'P0001';
  end if;

  select rc.*, c.full_name into v_rec
  from public.registration_codes rc
  join public.children c on c.id = rc.child_id
  where upper(btrim(rc.code)) = upper(btrim(p_code));

  if not found then
    raise exception 'رمز التسجيل غير صحيح أو غير موجود' using errcode = '22023';
  end if;

  if v_rec.used_at is not null then
    raise exception 'هذا الرمز تم استخدامه مسبقًا بتاريخ %', to_char(v_rec.used_at, 'YYYY/MM/DD') using errcode = '22023';
  end if;

  if v_rec.expires_at < now() then
    raise exception 'انتهت صلاحية رمز التسجيل هذا' using errcode = '22023';
  end if;

  insert into public.parent_profiles (user_id, full_name, email, disabled)
  values (
    auth.uid(),
    coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), 'ولي أمر'),
    (select email from auth.users where id = auth.uid()),
    false
  )
  on conflict (user_id) do update set disabled = false;

  insert into public.parent_children (parent_id, child_id, relation)
  values (auth.uid(), v_rec.child_id, 'ولي أمر')
  on conflict (parent_id, child_id) do nothing;

  update public.registration_codes
  set used_at = now(), used_by = auth.uid()
  where id = v_rec.id;

  perform public.audit_log('parent:redeem_code', v_rec.child_id::text);

  return jsonb_build_object(
    'success', true,
    'child_id', v_rec.child_id,
    'child_name', v_rec.full_name
  );
end;
$$;
revoke all on function public.redeem_registration_code(text) from public, anon;
grant execute on function public.redeem_registration_code(text) to authenticated;

notify pgrst, 'reload schema';
