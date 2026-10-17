-- =====================================================================
--  إدارة المستخدمين من لوحة الإدارة — شغّله مرة واحدة في SQL Editor
--  (لا يحتاج Edge Functions ولا أي مفتاح سري)
--  صلاحية الإضافة/الحذف/تغيير الكود: للمالك فقط = أقدم مدير في جدول admins.
--  يتطلب تشغيل schema.sql أولًا.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- حذف مستخدم لا يجب أن يفشل لأنه عدّل المسودة سابقًا
alter table public.site_content drop constraint if exists site_content_updated_by_fkey;
alter table public.site_content
  add constraint site_content_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null;

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
  if p_password is null or length(p_password) < 8 then
    raise exception 'الكود قصير: 8 أحرف على الأقل' using errcode = '22023';
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
  if p_password is null or length(p_password) < 8 then
    raise exception 'الكود قصير: 8 أحرف على الأقل' using errcode = '22023';
  end if;
  if octet_length(p_password) > 72 then
    raise exception 'الكود طويل جدًا (الحد 72 بايت)' using errcode = '22023';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
   where id = p_user_id;
  delete from auth.sessions where user_id = p_user_id;
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
  delete from public.admins where user_id = p_user_id;
  delete from auth.users where id = p_user_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_remove_user(uuid) from public, anon;
grant execute on function public.admin_remove_user(uuid) to authenticated;

notify pgrst, 'reload schema';
