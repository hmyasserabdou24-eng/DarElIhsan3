-- =====================================================================
--  اختياري وموصى به: إلزام المصادقة الثنائية (TOTP) لكل عمليات الإدارة على مستوى قاعدة البيانات.
--  ⚠️ لا تشغّله قبل أن يفعّل **كل** مدير المصادقة الثنائية (لوحة الإدارة ▸ النشر والأمان)،
--     وإلا سيُقفل المدير غير المفعّل عن حسابه. يمكن التراجع بإعادة تشغيل تعريف is_admin من 02-families-portal.sql.
--  بعد تفعيله: rls-tests.mjs لا يستطيع تسجيل دخول المدير بكلمة مرور فقط (يحتاج aal2) — شغّل الاختبارات قبله.
-- =====================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.admins where user_id = auth.uid() and not disabled);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.can_manage_families()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.admins where user_id = auth.uid() and not disabled and role = 'admin');
$$;
revoke all on function public.can_manage_families() from public, anon;
grant execute on function public.can_manage_families() to authenticated;
