-- =====================================================================
-- 08) إصلاح حذف سجل التدقيق من لوحة الإدارة
-- السبب: قاعدة الإنتاج تحتوي ثلاث نسخ متعارضة من الدالة admin_delete_audit
-- (بدون معاملات، ومعامل واحد، ومعاملان)، فيرفض Supabase استدعاءها بالخطأ
-- "could not choose the best candidate function".
-- الحل: حذف النسخ القديمة وإنشاء نسخة واحدة بالتوقيع الصحيح.
-- آمن على البيانات: لا يحذف أي سجل تدقيق، ويعيد تعريف الدالة فقط.
-- شغّله مرة واحدة: Supabase ▸ SQL Editor ▸ الصق الملف كاملًا ▸ Run.
-- =====================================================================

drop function if exists public.admin_delete_audit();
drop function if exists public.admin_delete_audit(timestamptz);
drop function if exists public.admin_delete_audit(bigint, timestamptz);

create or replace function public.admin_delete_audit(
  p_id bigint default null,
  p_older_than timestamptz default null
)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count int := 0;
begin
  if not public.is_owner() then
    raise exception 'فقط المدير الرئيسي (المالك) يملك صلاحية حذف سجلات العمليات والتدقيق' using errcode = '42501';
  end if;

  if p_id is not null then
    delete from public.admin_audit where id = p_id;
    get diagnostics v_count = row_count;
  elsif p_older_than is not null then
    delete from public.admin_audit where at < p_older_than;
    get diagnostics v_count = row_count;
  else
    delete from public.admin_audit;
    get diagnostics v_count = row_count;
  end if;

  -- توثيق هذا الإجراء الميتا-رقابي في السجل فوراً
  insert into public.admin_audit (actor, actor_email, action, target)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'audit:delete',
    'حذف ' || v_count || ' سجل(ات) تدقيق'
  );

  return v_count;
end;
$$;
revoke all on function public.admin_delete_audit(bigint, timestamptz) from public, anon;
grant execute on function public.admin_delete_audit(bigint, timestamptz) to authenticated;

-- إعلام PostgREST بتحديث كاش الدوال فورًا
notify pgrst, 'reload schema';

