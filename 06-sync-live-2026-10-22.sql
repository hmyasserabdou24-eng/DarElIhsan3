-- =====================================================================
-- 06) مزامنة ملفات الإعداد مع قاعدة البيانات الحية (2026-10-22)
-- آمن لإعادة التشغيل أكثر من مرة (idempotent). لا يحذف أي بيانات.
-- يُطبَّق بعد 00/02/05. يوثّق تعديلات أُجريت مباشرة على القاعدة:
--   1) عمود اسم المستخدم لحسابات الأولياء + فهرسه الفريد.
--   2) دالة QR العامة تُرجع: الاسم، المركز، رقم القيد، القسم، تاريخ الميلاد،
--      طبيعة الإعاقة، الموسم الدراسي. (ملاحظات الولي basic_info لا تُعاد أبدًا.)
--   3) دالة get_public_child كما هي حاليًا.
--   4) دالة سجل العمليات بتوقيعها الحالي (مع الفلترة والإزاحة).
-- ملاحظة: حسابات الأولياء تُنشأ عبر الدالة الخلفية parent-accounts (الإصدار 2)
--         وليس عبر SQL؛ ملفها في مجلد supabase-functions/parent-accounts.
-- =====================================================================

-- 1) اسم المستخدم لحساب الولي
alter table public.parent_profiles add column if not exists username text;
create unique index if not exists parent_profiles_username_uq
  on public.parent_profiles (lower(username)) where username is not null;

-- 2) دالة QR العامة (بطاقة التلميذ)
create or replace function public.public_child_card(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare r public.children%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return jsonb_build_object('found', false);
  end if;
  select * into r from public.children where qr_token = p_token and active;
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
end $function$;
revoke all on function public.public_child_card(text) from public;
grant execute on function public.public_child_card(text) to anon, authenticated;

-- 3) get_public_child (للروابط القديمة المطبوعة)
create or replace function public.get_public_child(p_uuid uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select jsonb_build_object(
    'membership_no', coalesce(c.membership_no, '—'),
    'full_name', c.full_name,
    'branch', coalesce(b.name, 'المركز الرئيسي لدار الإحسان')
  )
  from public.children c
  left join public.sections s on s.id = c.section_id
  left join public.branches b on b.id = coalesce(c.branch_id, s.branch_id)
  where c.public_uuid = p_uuid and c.active;
$function$;

-- 4) سجل العمليات بتوقيعه الحالي
create or replace function public.admin_audit_list(
  p_limit integer default 100, p_action_filter text default null, p_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'غير مصرّح' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('at', t.at, 'actor_email', t.actor_email, 'action', t.action, 'target', t.target) order by t.id desc)
    from (select * from public.admin_audit
           where (p_action_filter is null or action like p_action_filter || '%')
           order by id desc
           limit least(greatest(coalesce(p_limit, 100), 1), 500)
           offset greatest(coalesce(p_offset, 0), 0)) t
  ), '[]'::jsonb);
end $function$;

notify pgrst, 'reload schema';
