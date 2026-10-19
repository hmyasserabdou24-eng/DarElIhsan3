-- =====================================================================
--  دار الإحسان — 04: تحصين صغير يعالج تنبيهات Supabase Security Advisor
--  آمن لإعادة التشغيل. لا يحذف ولا يغيّر أي بيانات ولا أي سياسة RLS.
--  شغّله في SQL Editor (يُفضَّل على فرع تجريبي أولًا).
-- =====================================================================

-- 1) دالتا المشغّلات كانتا بلا search_path ثابت (تنبيه function_search_path_mutable)
alter function public.touch_updated_at() set search_path = public;
alter function public.reports_state()    set search_path = public;

-- 2) دوال المشغّلات لا يُراد استدعاؤها كـ RPC من أحد
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.reports_state()    from public, anon, authenticated;
-- (المشغّلات تعمل كما هي: لا تحتاج صلاحية execute من المستخدم)

-- ملاحظات (لا تحتاج إجراء):
--  • rls_enabled_no_policy على admins / admin_audit / rate_limits مقصود: لا وصول مباشر إطلاقًا
--    (القراءة عبر دوال SECURITY DEFINER التي تتحقق من الصلاحية، والكتابة بمفتاح الخدمة داخل الدالة الخلفية).
--  • is_admin() قابلة للاستدعاء من anon بقصد: تُرجع false للزائر ولا تكشف شيئًا.
--  • «Leaked password protection» إعداد من لوحة Supabase ▸ Authentication (متاح في الخطط المدفوعة).
