-- =====================================================================
-- 08) إصلاح مسح سجلات التدقيق + تفعيل حذف المديرين نهائيًا للمالك
-- شغل هذا الملف في Supabase -> SQL Editor لحل خطأ (400) فوراً
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1) دالة التصفية الشاملة لسجلات التدقيق (بدون وسائط - تحل خطأ 400)
create or replace function public.admin_delete_audit()
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count int := 0;
begin
  if not public.is_owner() then
    raise exception 'فقط المدير الرئيسي (المالك) يملك صلاحية حذف وتصفية سجلات التدقيق' using errcode = '42501';
  end if;

  delete from public.admin_audit;
  get diagnostics v_count = row_count;

  -- توثيق عملية التصفية الشاملة كسجل تدقيق جديد
  insert into public.admin_audit (actor, actor_email, action, target)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'audit:delete',
    'تصفية شاملة: حذف ' || v_count || ' سجل تدقيق'
  );

  return v_count;
end;
$$;

-- 2) دالة حذف السجلات الأقدم من تاريخ معين
create or replace function public.admin_delete_audit(p_older_than timestamptz)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count int := 0;
begin
  if not public.is_owner() then
    raise exception 'فقط المدير الرئيسي (المالك) يملك صلاحية حذف وتصفية سجلات التدقيق' using errcode = '42501';
  end if;

  if p_older_than is not null then
    delete from public.admin_audit where at < p_older_than;
    get diagnostics v_count = row_count;
  else
    delete from public.admin_audit;
    get diagnostics v_count = row_count;
  end if;

  insert into public.admin_audit (actor, actor_email, action, target)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'audit:delete',
    'حذف أقدم من ' || to_char(coalesce(p_older_than, now()), 'YYYY-MM-DD') || ': حذف ' || v_count || ' سجل'
  );

  return v_count;
end;
$$;

-- 3) دالة حذف مدير نهائيًا للمالك وسحب صلاحياته من auth.users وجدول admins
create or replace function public.admin_remove_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_mail text;
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

  select email into v_mail from auth.users where id = p_user_id;
  delete from public.admins where user_id = p_user_id;
  delete from auth.users where id = p_user_id;

  perform public.audit_log('remove_user', coalesce(v_mail, p_user_id::text));
  return jsonb_build_object('ok', true, 'deleted_email', v_mail);
end;
$$;

-- منح الصلاحيات للمستخدمين الموثقين
revoke all on function public.admin_delete_audit() from public, anon;
grant execute on function public.admin_delete_audit() to authenticated;

revoke all on function public.admin_delete_audit(timestamptz) from public, anon;
grant execute on function public.admin_delete_audit(timestamptz) to authenticated;

revoke all on function public.admin_remove_user(uuid) from public, anon;
grant execute on function public.admin_remove_user(uuid) to authenticated;

notify pgrst, 'reload schema';

-- 4) دالة إنشاء أو تحديث حساب مدير أو مربية بكلمة مرور مباشرة (بدون الحاجة لـ Edge Function)
create or replace function public.admin_add_user(p_email text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id uuid;
  v_existed boolean := false;
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  if length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    raise exception 'البريد الإلكتروني غير صالح' using errcode = '22023';
  end if;
  if p_password is null or length(p_password) < 8 or p_password !~ '[A-Z]' or p_password !~ '[0-9]' then
    raise exception 'كلمة المرور: 8 أحرف على الأقل مع حرف كبير ورقم' using errcode = '22023';
  end if;
  if octet_length(p_password) > 72 then
    raise exception 'كلمة المرور طويلة جدًا (الحد 72 بايت)' using errcode = '22023';
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

  insert into public.admins (user_id, role, disabled)
  values (v_id, 'admin', false)
  on conflict (user_id) do update set disabled = false;

  perform public.audit_log(case when v_existed then 'update_user' else 'add_user' end, v_email);
  return jsonb_build_object('id', v_id, 'email', v_email, 'existed', v_existed);
end;
$$;

revoke all on function public.admin_add_user(text, text) from public, anon;
grant execute on function public.admin_add_user(text, text) to authenticated;

notify pgrst, 'reload schema';
