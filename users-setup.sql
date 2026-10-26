-- =====================================================================
--  إدارة المستخدمين + سجل العمليات + سياسة كلمات المرور — شغّله في SQL Editor
--  (آمن لإعادة التشغيل أكثر من مرة)
--  (لا يحتاج Edge Functions ولا أي مفتاح سري)
--  صلاحية الإضافة/الحذف/تغيير الكود: للمالك فقط = أقدم مدير في جدول admins.
--  يتطلب تشغيل schema.sql أولًا.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- حذف مستخدم لا يجب أن يفشل لأنه عدّل المسودة سابقًا
alter table public.site_content drop constraint if exists site_content_updated_by_fkey;
alter table public.site_content
  add constraint site_content_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null;

-- سجل العمليات الحساسة (لا يُقرأ ولا يُكتب إلا عبر الدوال)
create table if not exists public.admin_audit (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor       uuid,
  actor_email text,
  action      text not null,
  target      text
);
alter table public.admin_audit enable row level security;   -- بلا سياسات = مغلق أمام الـ API
revoke all on public.admin_audit from anon, authenticated;

create or replace function public.audit_log(p_action text, p_target text default null)
returns void
language plpgsql security definer
set search_path = public, auth
as $$
begin
  insert into public.admin_audit (actor, actor_email, action, target)
    values (auth.uid(), (select u.email from auth.users u where u.id = auth.uid()), p_action, left(p_target, 200));
  delete from public.admin_audit where id <= (select max(x.id) from public.admin_audit x) - 1000;  -- نحتفظ بآخر 1000 عملية
end $$;
revoke all on function public.audit_log(text, text) from public, anon, authenticated;

-- هل المتصل هو المالك؟
create or replace function public.is_owner()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_admin()
     and auth.uid() = (select a.user_id from public.admins a order by a.created_at asc, a.user_id asc limit 1);
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- قائمة المديرين (متاحة لأي مدير)
create or replace function public.admin_list()
returns jsonb
language plpgsql stable security definer
set search_path = public, auth
as $$
declare v_owner uuid; v_out jsonb;
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select a.user_id into v_owner from public.admins a order by a.created_at asc, a.user_id asc limit 1;
  select jsonb_build_object(
           'can_manage', auth.uid() = v_owner,
           'admins', coalesce(jsonb_agg(jsonb_build_object(
               'id', a.user_id, 'email', u.email, 'created_at', a.created_at,
               'last_sign_in_at', u.last_sign_in_at,
               'is_owner', a.user_id = v_owner, 'is_me', a.user_id = auth.uid())
             order by a.created_at asc, a.user_id asc), '[]'::jsonb))
    into v_out
    from public.admins a join auth.users u on u.id = a.user_id;
  return v_out;
end $$;
revoke all on function public.admin_list() from public, anon;
grant execute on function public.admin_list() to authenticated;

-- إضافة مستخدم (أو تحديث كود مستخدم موجود) ومنحه صلاحية الإدارة
create or replace function public.admin_add_user(p_email text, p_password text)
returns jsonb
language plpgsql security definer
set search_path = public, auth, extensions
as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_id uuid; v_existed boolean := false;
begin
  if not public.is_owner() then
    raise exception 'هذه العملية للمالك فقط' using errcode = '42501';
  end if;
  if length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    raise exception 'البريد الإلكتروني غير صالح' using errcode = '22023';
  end if;
  if p_password is null or length(p_password) < 8 or p_password !~ '[A-Z]' or p_password !~ '[0-9]' then
    raise exception 'الكود: 8 أحرف على الأقل مع حرف كبير (A-Z) ورقم واحد على الأقل' using errcode = '22023';
  end if;
  if octet_length(p_password) > 72 then
    raise exception 'الكود طويل جدًا (الحد 72 بايت)' using errcode = '22023';
  end if;

  select u.id into v_id from auth.users u where lower(u.email) = v_email limit 1;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id,
            jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
            'email', v_id::text, now(), now(), now());
  else
    v_existed := true;
    update auth.users
       set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_id;
  end if;

  insert into public.admins (user_id) values (v_id) on conflict (user_id) do nothing;
  perform public.audit_log(case when v_existed then 'update_user' else 'add_user' end, v_email);
  return jsonb_build_object('id', v_id, 'email', v_email, 'existed', v_existed);
end $$;
revoke all on function public.admin_add_user(text, text) from public, anon;
grant execute on function public.admin_add_user(text, text) to authenticated;

-- تغيير كود مدير (ويُسجَّل خروجه من أجهزته)
create or replace function public.admin_reset_password(p_user_id uuid, p_password text)
returns jsonb
language plpgsql security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_owner() then
    raise exception 'هذه العملية للمالك فقط' using errcode = '42501';
  end if;
  if not exists (select 1 from public.admins a where a.user_id = p_user_id) then
    raise exception 'المستخدم غير موجود بين المديرين' using errcode = '22023';
  end if;
  if p_password is null or length(p_password) < 8 or p_password !~ '[A-Z]' or p_password !~ '[0-9]' then
    raise exception 'الكود: 8 أحرف على الأقل مع حرف كبير (A-Z) ورقم واحد على الأقل' using errcode = '22023';
  end if;
  if octet_length(p_password) > 72 then
    raise exception 'الكود طويل جدًا (الحد 72 بايت)' using errcode = '22023';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
   where id = p_user_id;
  delete from auth.sessions where user_id = p_user_id;
  perform public.audit_log('reset_password', (select u.email from auth.users u where u.id = p_user_id));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_reset_password(uuid, text) from public, anon;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;

-- حذف مدير نهائيًا (الصلاحية تسقط فورًا)
create or replace function public.admin_remove_user(p_user_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public, auth
as $$
declare v_mail text;
begin
  if not public.is_owner() then
    raise exception 'هذه العملية للمالك فقط' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'لا يمكنك حذف حسابك أنت (المالك)' using errcode = '22023';
  end if;
  if not exists (select 1 from public.admins a where a.user_id = p_user_id) then
    raise exception 'المستخدم غير موجود بين المديرين' using errcode = '22023';
  end if;
  select u.email into v_mail from auth.users u where u.id = p_user_id;
  delete from public.admins where user_id = p_user_id;
  delete from auth.users where id = p_user_id;
  perform public.audit_log('remove_user', v_mail);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_remove_user(uuid) from public, anon;
grant execute on function public.admin_remove_user(uuid) to authenticated;

-- قراءة سجل العمليات (لأي مدير)
create or replace function public.admin_audit_list(p_limit int default 30)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('at', t.at, 'actor_email', t.actor_email, 'action', t.action, 'target', t.target) order by t.id desc)
      from (select * from public.admin_audit order by id desc limit least(greatest(coalesce(p_limit, 30), 1), 100)) t
  ), '[]'::jsonb);
end $$;
revoke all on function public.admin_audit_list(int) from public, anon;
grant execute on function public.admin_audit_list(int) to authenticated;

-- إعادة تعريف النشر وتحميل نسخة قديمة مع تسجيلهما في السجل
create or replace function public.publish_content()
returns timestamptz
language plpgsql security definer
set search_path = public
as $$
declare d jsonb; t timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select (data - '_portal_meta') into d from public.site_content where id = 'draft';
  if d is null then raise exception 'لا توجد مسودة'; end if;

  insert into public.site_content_history (data, published_by)
    select data, auth.uid() from public.site_content where id = 'published' and data <> '{}'::jsonb;

  insert into public.site_content (id, data, updated_at, updated_by)
    values ('published', d, t, auth.uid())
  on conflict (id) do update
    set data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by;

  delete from public.site_content_history
   where id not in (select id from public.site_content_history order by id desc limit 30);
  perform public.audit_log('publish');
  return t;
end $$;
revoke all on function public.publish_content() from public, anon;
grant execute on function public.publish_content() to authenticated;

create or replace function public.load_version_to_draft(p_id bigint)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  update public.site_content
     set data = (select data from public.site_content_history where id = p_id),
         updated_at = now(), updated_by = auth.uid()
   where id = 'draft'
     and exists (select 1 from public.site_content_history where id = p_id);
  perform public.audit_log('load_version', p_id::text);
end $$;
revoke all on function public.load_version_to_draft(bigint) from public, anon;
grant execute on function public.load_version_to_draft(bigint) to authenticated;

notify pgrst, 'reload schema';
