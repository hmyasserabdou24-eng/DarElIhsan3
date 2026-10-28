-- ══════════════════════════════════════════════════════════════════════════════
-- DAR EL IHSAN — WEB PUSH NOTIFICATIONS & REAL-TIME ALERTS SYSTEM
-- الملف: 13-web-push-notifications.sql
-- المركز النفسي البيداغوجي دار الإحسان — العطف، ولاية غرداية
-- ══════════════════════════════════════════════════════════════════════════════
-- يتضمن:
-- 1. جدول اشتراكات الإشعارات push_subscriptions للأجهزة والهواتف المحمولة.
-- 2. جدول طابور الإرسال notification_outbox للأحداث المعلقة والمجدولة.
-- 3. جدول سجل تسليم الإشعارات notification_logs للمتابعة والتدقيق والتقارير.
-- 4. سياسات الأمان RLS الصارمة لعزل بيانات الأولياء ومنع أي تسريب.
-- 5. مشغلات قاعدة البيانات التلقائية عند نشر الرسائل والتقارير والتقييمات.
-- 6. احترام خصوصية شاشة القفل وعدم إظهار بيانات طبية حساسة.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. جدول اشتراكات الإشعارات (Push Subscriptions)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  device_type text DEFAULT 'mobile' CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_sub_parent ON public.push_subscriptions(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_push_sub_child ON public.push_subscriptions(child_id);
CREATE INDEX IF NOT EXISTS idx_push_sub_active ON public.push_subscriptions(is_active) WHERE is_active = true;

-- 2. جدول طابور الإشعارات الصادرة (Notification Outbox)
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL DEFAULT 'single_parent' CHECK (target_type IN ('single_parent', 'all_parents', 'section_parents', 'broadcast')),
  target_child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  target_parent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('new_message', 'new_report', 'new_evaluation', 'announcement', 'reminder', 'system_alert')),
  title text NOT NULL,
  body text NOT NULL,
  url text DEFAULT './parent.html',
  tag text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  retry_count int DEFAULT 0,
  scheduled_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_outbox_status ON public.notification_outbox(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notif_outbox_child ON public.notification_outbox(target_child_id);
CREATE INDEX IF NOT EXISTS idx_notif_outbox_parent ON public.notification_outbox(target_parent_id);

-- 3. جدول سجلات تسليم الإشعارات (Notification Delivery Logs)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id uuid REFERENCES public.notification_outbox(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  status_code int,
  response_body text,
  success boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_outbox ON public.notification_logs(outbox_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_sub ON public.notification_logs(subscription_id);

-- 4. تفعيل أمان مستوى الصفوف (Row Level Security - RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- دوال مساعدة للتحقق من صلاحية الإدارة العامة
CREATE OR REPLACE FUNCTION public.de_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE auth_id = auth.uid()
        AND active = true
    ) OR
    (auth.jwt() ->> 'email' = 'edu.0550647516@darelihsan.org') OR
    (auth.jwt() ->> 'role' = 'service_role')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- سياسات push_subscriptions
DROP POLICY IF EXISTS "parents_manage_own_subscriptions" ON public.push_subscriptions;
CREATE POLICY "parents_manage_own_subscriptions"
ON public.push_subscriptions
FOR ALL
TO authenticated
USING (
  parent_user_id = auth.uid() OR public.de_is_admin()
)
WITH CHECK (
  parent_user_id = auth.uid() OR public.de_is_admin()
);

-- سياسات notification_outbox
DROP POLICY IF EXISTS "parents_view_own_outbox" ON public.notification_outbox;
CREATE POLICY "parents_view_own_outbox"
ON public.notification_outbox
FOR SELECT
TO authenticated
USING (
  target_parent_id = auth.uid() OR
  target_child_id IN (
    SELECT child_id FROM public.parent_children WHERE parent_id = auth.uid()
  ) OR
  target_type IN ('broadcast', 'all_parents') OR
  public.de_is_admin()
);

DROP POLICY IF EXISTS "admins_manage_outbox" ON public.notification_outbox;
CREATE POLICY "admins_manage_outbox"
ON public.notification_outbox
FOR ALL
TO authenticated
USING (public.de_is_admin())
WITH CHECK (public.de_is_admin());

-- سياسات notification_logs
DROP POLICY IF EXISTS "admins_view_logs" ON public.notification_logs;
CREATE POLICY "admins_view_logs"
ON public.notification_logs
FOR ALL
TO authenticated
USING (public.de_is_admin())
WITH CHECK (public.de_is_admin());

-- 5. مشغل تلقائي لإرسال إشعار عند إضافة رسالة جديدة للأولياء
CREATE OR REPLACE FUNCTION public.de_notify_on_new_message()
RETURNS trigger AS $$
BEGIN
  -- إشعار الولي مع ضمان الخصوصية الكاملة على شاشة القفل
  INSERT INTO public.notification_outbox (
    target_type,
    target_child_id,
    target_parent_id,
    event_type,
    title,
    body,
    url,
    tag
  ) VALUES (
    CASE WHEN NEW.child_id IS NOT NULL THEN 'single_parent' ELSE 'broadcast' END,
    NEW.child_id,
    NEW.parent_id,
    'new_message',
    'رسالة جديدة من إدارة دار الإحسان',
    'لديك رسالة وإشعار جديد خاص بملف طفلك في فضاء الأولياء.',
    './parent.html#msgs',
    'de-msg-' || NEW.id::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_new_message ON public.messages;
CREATE TRIGGER trg_notify_on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.de_notify_on_new_message();

-- 6. مشغل تلقائي لإرسال إشعار عند نشر تقرير دوري أو استمارة تقييم
CREATE OR REPLACE FUNCTION public.de_notify_on_new_report()
RETURNS trigger AS $$
DECLARE
  is_eval boolean;
  n_title text;
  n_body text;
  n_event text;
BEGIN
  -- يتم إرسال الإشعار فقط عندما تصبح حالة التقرير "منشور" (published)
  IF (NEW.status = 'published' AND (OLD IS NULL OR OLD.status <> 'published')) THEN
    is_eval := (NEW.title ILIKE '%تقييم%' OR NEW.title ILIKE '%évaluation%' OR NEW.content ILIKE '%scorecard%');
    
    IF is_eval THEN
      n_event := 'new_evaluation';
      n_title := 'تمت إضافة استمارة تقييم بيداغوجي جديدة';
      n_body := 'أصدرت الإدارة استمارة التقييم والنتائج البيداغوجية لطفلك؛ اضغط للمعاينة والتحميل.';
    ELSE
      n_event := 'new_report';
      n_title := 'تم نشر تقرير دوري جديد';
      n_body := 'أضافت المربية المشرفة تقرير متابعة جديداً يخص طفلك في فضاء الأولياء.';
    END IF;

    INSERT INTO public.notification_outbox (
      target_type,
      target_child_id,
      event_type,
      title,
      body,
      url,
      tag
    ) VALUES (
      'single_parent',
      NEW.child_id,
      n_event,
      n_title,
      n_body,
      CASE WHEN is_eval THEN './parent.html#evaluations' ELSE './parent.html#reports' END,
      'de-rep-' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_new_report ON public.progress_reports;
CREATE TRIGGER trg_notify_on_new_report
AFTER INSERT OR UPDATE OF status ON public.progress_reports
FOR EACH ROW
EXECUTE FUNCTION public.de_notify_on_new_report();

COMMENT ON TABLE public.push_subscriptions IS 'اشتراكات هواتف وأجهزة الأولياء لتلقي إشعارات Web Push حتى عند إغلاق التطبيق';
COMMENT ON TABLE public.notification_outbox IS 'طابور الإشعارات التلقائية واليدوية الصادرة من إدارة دار الإحسان';
COMMENT ON TABLE public.notification_logs IS 'سجل عمليات إرسال الإشعارات وحالة الاستجابة لكل جهاز';
