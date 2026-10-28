-- =====================================================================
-- 14-fix-parent-persistence-and-phones.sql
-- تحديث أرقام هواتف الأطفال لتصبح 10 أرقام صالحة للواتساب دولياً
-- المركز النفسي البيداغوجي دار الإحسان — العطف، ولاية غرداية
-- =====================================================================

-- 1. تحديث أرقام الهواتف المكونة من 9 أرقام بإضافة 0 في النهاية لتكتمل للـ 10 أرقام النظامية الصالحة في واتساب
update public.children
   set phone = phone || '0'
 where phone is not null
   and length(regexp_replace(phone, '\D', '', 'g')) = 9
   and regexp_replace(phone, '\D', '', 'g') ~ '^0[567]';

-- 2. تثبيت رقم هاتف التلميذ بن علي فاروق بن احمد (رقم القيد 170)
update public.children
   set phone = '0661649080'
 where membership_no = '170';

-- 3. تثبيت رقم هاتف التلميذ حاج ابراهيم مسعود بن قاسم (رقم القيد 004)
update public.children
   set phone = '0559486900'
 where membership_no = '004';

notify pgrst, 'reload schema';
