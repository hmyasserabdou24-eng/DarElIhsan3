/* الصفحة الرئيسية تفتح لوحة تسجيل الدخول مباشرة (manage.html).
   نحافظ على ?query و#hash كما هما حتى لا تضيع روابط الدعوة/استعادة كلمة المرور القادمة من Supabase. */
(function () {
  'use strict';
  location.replace('manage.html' + location.search + location.hash);
})();
