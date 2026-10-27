-- =====================================================================
-- 10) السماح لكل مدير شامل (role = admin) بحذف الحسابات — مع حماية المالك
-- آمن لإعادة التشغيل (CREATE OR REPLACE). لا يغيّر الصلاحيات الأخرى:
-- إضافة الحسابات وتعطيلها وتعديل إذن المراكز تبقى للمالك فقط.
-- الضمانات: لا يمكن حذف المالك الرئيسي، ولا حذف الحساب الذي تدخل به.
-- كل عملية تُسجَّل في admin_audit.
-- =====================================================================
create or replace function public.admin_remove_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  v_mail text;
  v_owner uuid;
begin
  if not public.can_manage_families() then
    raise exception 'هذه العملية للمديرين الشاملين فقط' using errcode = '42501';
  end if;
  select a.user_id into v_owner from public.admins a order by a.created_at asc, a.user_id asc limit 1;
  if p_user_id = v_owner then
    raise exception 'لا يمكن حذف حساب المالك الرئيسي' using errcode = '22023';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'لا يمكنك حذف الحساب الذي تدخل به' using errcode = '22023';
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

create or replace function public.admin_list()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'auth'
as $$
declare v_owner uuid; v_out jsonb;
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select a.user_id into v_owner from public.admins a order by a.created_at asc, a.user_id asc limit 1;
  select jsonb_build_object(
           'can_manage', auth.uid() = v_owner,
           'can_delete', public.can_manage_families(),
           'admins', coalesce(jsonb_agg(jsonb_build_object(
               'id', a.user_id, 'email', u.email, 'created_at', a.created_at,
               'last_sign_in_at', u.last_sign_in_at, 'role', a.role, 'disabled', a.disabled,
               'is_owner', a.user_id = v_owner, 'is_me', a.user_id = auth.uid())
             order by a.created_at asc, a.user_id asc), '[]'::jsonb))
    into v_out
    from public.admins a join auth.users u on u.id = a.user_id;
  return v_out;
end $$;
