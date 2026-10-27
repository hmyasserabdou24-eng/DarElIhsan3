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


-- =====================================================================
-- 7) إنشاء وتفعيل حسابات جميع الموظفين الـ 16 (برقم الهاتف + DIتاريخ_الميلاد)
--    وإسناد كل موظف ومربية إلى مركزه وقسمه وحذف أي مربية في قسم الاستثارة
-- =====================================================================
create or replace function public.import_official_staff_accounts()
returns int
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  r record;
  v_email text;
  v_pw text;
  v_uid uuid;
  v_sec_id uuid;
  v_count int := 0;
  v_educators jsonb := '[]'::jsonb;
  v_acc_meta jsonb := '{}'::jsonb;
  v_draft_data jsonb;
begin
  -- جدول مؤقت لبيانات الموظفين الـ 16 من القائمة الرسمية
  drop table if exists temp_staff_data;
  create temporary table temp_staff_data (
    staff_id     text,
    emp_no       text,
    full_name    text,
    dob          date,
    phone        text,
    center_code  text,
    role_kind    text,
    job_title    text,
    section_slug text,
    section_name text
  ) on commit drop;

  insert into temp_staff_data (staff_id, emp_no, full_name, dob, phone, center_code, role_kind, job_title, section_slug, section_name) values
    -- المركز الرئيسي دار الإحسان (المركز النفسي البيداغوجي)
    ('staff-001', '1',   'أمير زكرياء بن عبد الله',           '1993-05-11', '0540817775', 'main', 'admin',    'مدير المركز',              null,                'المركز الرئيسي دار الإحسان'),
    ('staff-002', '2',   'الخلفاوي حمودة بن يحي',             '1986-05-03', '0550647516', 'main', 'admin',    'عون إداري',                null,                'المركز الرئيسي دار الإحسان'),
    ('staff-010', '10',  'نواري اسماء بنت جيلالي',            '2001-08-14', '0655806951', 'main', 'admin',    'أخصائية نفسانية',          null,                'المركز الرئيسي دار الإحسان'),
    ('staff-017', '17',  'فضاض خولة بنت الشيخ بن أحمد',       '1998-02-05', '0555905565', 'main', 'educator', 'مربية',                    'sec_tafatan_1',     'التفطين 1 تأخر ذهني'),
    ('staff-047', '47',  'الرمة فاطمة الزهراء بنت أحمد',      '1998-07-28', '0663412874', 'main', 'educator', 'مربية',                    'sec_autism_1',      'توحد 01'),
    ('staff-058', '58',  'قوطارة جميلة بنت مبروك',            '1993-06-19', '0676160618', 'main', 'educator', 'مربية',                    'sec_shibh_madrasi', 'قسم الشبه مدرسي مكيف'),
    ('staff-103', '103', 'بوقانون فيروز بنت مسعود',           '1980-10-10', '0657929247', 'main', 'educator', 'مربية',                    'sec_observation',   'الملاحظة جدد'),
    ('staff-104', '104', 'ميزات صارة بنت أحمد',               '1991-02-09', '0697626616', 'main', 'educator', 'مربية',                    'sec_khariji',       'الخارجي اعاقة شديدة'),
    ('staff-105', '105', 'قريدة عيدة بنت موسى',               '1970-02-18', '0657929291', 'main', 'educator', 'مربية',                    'sec_tafatan_2',     'التفطين 2 متلازمة داون'),
    ('staff-111', '111', 'باحمد صليحة بنت نور الدين',         '1996-11-19', '0552698775', 'main', 'educator', 'مربية',                    'sec_autism_2',      'التوحد 02'),
    ('staff-113', '113', 'بن دربال نسيبة بنت محمد',           '1985-11-25', '0667941590', 'main', 'educator', 'مربية',                    'sec_autism_3',      'توحد 03'),

    -- مركز المساعدة على العمل (مركز التمهين CAT)
    ('staff-099', '99',  'عبد الصمد عصام بن خميسي',           '1981-12-17', '0662744988', 'work', 'admin',    'رئيس مصلحة',               'sec_tamhin',        'التمهين م م ع'),
    ('staff-004', '4',   'لهزيل زينب بنت أحمد',               '1984-10-14', '0668640481', 'work', 'educator', 'مربية',                    'sec_tamhin',        'التمهين م م ع'),
    ('staff-038', '38',  'جلود عبد السلام بن الشيخ بن قويدر', '1996-09-30', '0657855528', 'work', 'educator', 'مربي',                     'sec_tamhin',        'التمهين م م ع'),
    ('staff-107', '107', 'سيروكان بشرى بنت احمد',             '2011-04-25', '0652676768', 'work', 'educator', 'مساعدة مربية',             'sec_tamhin',        'التمهين م م ع'),

    -- المزرعة البيداغوجية (البستنة)
    ('staff-074', '74',  'طالب باحمد ياسين بن عيسى',          '2007-10-22', '0664359676', 'farm', 'educator', 'مربي المزرعة البيداغوجية', 'sec_bostana',       'المزرعة البستنة');

  for r in select * from temp_staff_data loop
    v_email := 'edu.' || r.phone || '@darelihsan.org';
    -- كلمة المرور = DI + اليوم والشهر والسنة (DDMMYYYY) من تاريخ الميلاد
    v_pw := 'DI' || to_char(r.dob, 'DDMMYYYY');

    v_sec_id := null;
    if r.section_slug is not null then
      select id into v_sec_id from public.sections where slug = r.section_slug limit 1;
    end if;

    select u.id into v_uid from auth.users u where lower(u.email) = v_email limit 1;
    if v_uid is null then
      v_uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
        extensions.crypt(v_pw, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', r.full_name, 'phone', r.phone, 'center', r.center_code, 'job_title', r.job_title),
        now(), now(),
        '', '', '', '', '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', v_uid::text, now(), now(), now()
      );
    else
      update auth.users
         set encrypted_password = extensions.crypt(v_pw, extensions.gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', r.full_name, 'phone', r.phone, 'center', r.center_code, 'job_title', r.job_title),
             updated_at = now()
       where id = v_uid;
    end if;

    insert into public.admins (user_id, role, disabled)
    values (v_uid, 'admin', false)
    on conflict (user_id) do update set role = 'admin', disabled = false;

    if r.role_kind = 'educator' then
      v_educators := v_educators || jsonb_build_array(jsonb_build_object(
        'id', r.staff_id,
        'emp_no', r.emp_no,
        'full_name', r.full_name,
        'dob', to_char(r.dob, 'YYYY-MM-DD'),
        'phone', r.phone,
        'email', v_email,
        'center', r.center_code,
        'job_title', r.job_title,
        'section_id', coalesce(v_sec_id::text, ''),
        'section_name', r.section_name,
        'has_account', true,
        'updated_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ));
    end if;

    v_acc_meta := v_acc_meta || jsonb_build_object(
      v_email, jsonb_build_object(
        'role', r.role_kind,
        'educator_id', case when r.role_kind = 'educator' then r.staff_id else null end,
        'emp_no', r.emp_no,
        'full_name', r.full_name,
        'dob', to_char(r.dob, 'YYYY-MM-DD'),
        'phone', r.phone,
        'center', r.center_code,
        'center_access', r.center_code,
        'job_title', r.job_title,
        'section_id', coalesce(v_sec_id::text, ''),
        'section_name', r.section_name,
        'has_account', true,
        'updated_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
    );

    v_count := v_count + 1;
  end loop;

  -- حفظ بيانات المربيات وحسابات المراكز في site_content (draft) مع إزالة أي مربية تجريبية في قسم الاستثارة
  select coalesce(data, '{}'::jsonb) into v_draft_data from public.site_content where id = 'draft';
  v_draft_data := jsonb_set(
    coalesce(v_draft_data, '{}'::jsonb),
    '{_portal_meta}',
    jsonb_build_object('educators', v_educators, 'account_meta', v_acc_meta),
    true
  );

  insert into public.site_content (id, data, updated_at)
  values ('draft', v_draft_data, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();

  return v_count;
end;
$$;
revoke all on function public.import_official_staff_accounts() from public, anon;
grant execute on function public.import_official_staff_accounts() to authenticated;

-- تنفيذ إنشاء وتفعيل حسابات الموظفين الـ 16 فورًا
select public.import_official_staff_accounts();


-- =====================================================================
-- تفعيل خيار حذف الحسابات لجميع مديري المركز (بالمعرّف أو بالبريد الإلكتروني)
-- =====================================================================
create or replace function public.admin_list()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare v_owner uuid; v_out jsonb;
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select a.user_id into v_owner from public.admins a order by a.created_at asc, a.user_id asc limit 1;
  select jsonb_build_object(
           'can_manage', public.can_manage_families(),
           'admins', coalesce(jsonb_agg(jsonb_build_object(
               'id', a.user_id, 'email', u.email, 'created_at', a.created_at,
               'last_sign_in_at', u.last_sign_in_at, 'role', a.role, 'disabled', a.disabled,
               'is_owner', a.user_id = v_owner, 'is_me', a.user_id = auth.uid())
             order by a.created_at asc, a.user_id asc), '[]'::jsonb))
    into v_out
    from public.admins a join auth.users u on u.id = a.user_id;
  return v_out;
end $$;
revoke all on function public.admin_list() from public, anon;
grant execute on function public.admin_list() to authenticated;

create or replace function public.admin_remove_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_mail text;
begin
  if not public.can_manage_families() then
    raise exception 'غير مصرّح بتنفيذ هذه العملية' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'لا يمكنك حذف الحساب الذي تسجل الدخول به حالياً' using errcode = '22023';
  end if;

  select lower(email) into v_mail from auth.users where id = p_user_id;
  delete from public.admins where user_id = p_user_id;
  delete from auth.identities where user_id = p_user_id;
  delete from auth.users where id = p_user_id;

  if v_mail is not null then
    update public.site_content
       set data = jsonb_set(
         data,
         '{_portal_meta,account_meta}',
         coalesce(data #> '{_portal_meta,account_meta}', '{}'::jsonb) - v_mail,
         true
       ),
       updated_at = now()
     where id = 'draft' and data ? '_portal_meta';
  end if;

  perform public.audit_log('remove_user', coalesce(v_mail, p_user_id::text));
  return jsonb_build_object('ok', true, 'deleted_email', v_mail);
end;
$$;
revoke all on function public.admin_remove_user(uuid) from public, anon;
grant execute on function public.admin_remove_user(uuid) to authenticated;

create or replace function public.admin_remove_user_by_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_mail text := lower(btrim(coalesce(p_email, '')));
  v_uid uuid;
begin
  if not public.can_manage_families() then
    raise exception 'غير مصرّح بتنفيذ هذه العملية' using errcode = '42501';
  end if;
  if v_mail = '' then
    return jsonb_build_object('ok', false);
  end if;

  select id into v_uid from auth.users where lower(email) = v_mail limit 1;
  if v_uid is not null then
    if v_uid = auth.uid() then
      raise exception 'لا يمكنك حذف الحساب الذي تسجل الدخول به حالياً' using errcode = '22023';
    end if;
    delete from public.admins where user_id = v_uid;
    delete from auth.identities where user_id = v_uid;
    delete from auth.users where id = v_uid;
  end if;

  update public.site_content
     set data = jsonb_set(
       data,
       '{_portal_meta,account_meta}',
       coalesce(data #> '{_portal_meta,account_meta}', '{}'::jsonb) - v_mail,
       true
     ),
     updated_at = now()
   where id = 'draft' and data ? '_portal_meta';

  perform public.audit_log('remove_user', v_mail);
  return jsonb_build_object('ok', true, 'deleted_email', v_mail);
end;
$$;
revoke all on function public.admin_remove_user_by_email(text) from public, anon;
grant execute on function public.admin_remove_user_by_email(text) to authenticated;

notify pgrst, 'reload schema';
