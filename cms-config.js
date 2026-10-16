/* إعدادات الاتصال بـ Supabase.
   ⚠️ ضع هنا فقط: Project URL + المفتاح العام (anon / publishable key).
   هذا المفتاح عام بطبيعته ومصمَّم لأن يظهر في المتصفح، والحماية الحقيقية تأتي من
   سياسات Row Level Security داخل قاعدة البيانات (انظر schema.sql).
   ❌ لا تضع هنا أبدًا مفتاح service_role ولا أي كلمة مرور. */
window.DE_CONFIG = {
  supabaseUrl: 'https://qgjddtylriqdwvpihvmi.supabase.co',   // مثال: https://abcdxyz.supabase.co
  supabaseKey: 'sb_publishable_8mgO37k9jB9_Dg4OQTfynw_NBC0gLjK',   // anon (eyJ...) أو publishable (sb_publishable_...)
  bucket: 'media'
};
