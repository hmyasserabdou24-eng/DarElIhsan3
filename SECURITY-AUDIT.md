<!-- تقرير مراجعة الأمان — دار الإحسان — أكتوبر 2026 -->
# مراجعة الأمان الكاملة لمشروع دار الإحسان

## ✅ نقاط القوة الموجودة

### المصادقة والجلسة
- ✅ Supabase Auth لإدارة المستخدمين وكلمات المرور
- ✅ المفاتيح السرية لا توجد في أي ملف HTML أو JS (يُستخدم فقط المفتاح العام)
- ✅ SUPABASE_SERVICE_ROLE_KEY يُحقن تلقائيًا في Edge Functions
- ✅ خروج تلقائي بعد 30 دقيقة خمول
- ✅ منع تضمين الصفحات في iframes (iframe busting)
- ✅ دعم MFA (TOTP) للمديرين
- ✅ رابط الدعوة يُنشأ عبر Edge Function (لا كلمات مرور تمر من المتصفح)

### Row Level Security
- ✅ RLS مُفعَّل على جميع الجداول
- ✅ الولي لا يرى إلا أطفاله المرتبطين بحسابه
- ✅ المدير لا يستطيع ترقية صلاحياته ذاتيًا
- ✅ جدول `admins` مغلق أمام الـ API (بلا سياسات = رفض)
- ✅ جدول `admin_audit` مغلق أمام الـ API
- ✅ عمليات حساسة عبر دوال `security definer`

### التحقق من المدخلات
- ✅ `de-core.js`: `clean()`, `isEmail()`, `isPhone()`, `isDate()`, `isUuid()`
- ✅ فحص امتداد الملف + النوع الحقيقي (magic bytes) + حجم الملف
- ✅ كشف JavaScript في ملفات PDF
- ✅ أسماء ملفات عشوائية UUID (منع تخمين المسارات)
- ✅ حد حجم الطلب في Edge Function (10KB)
- ✅ تحديد معدل الطلبات (rate limiting) في Edge Function

### سياسة المحتوى
- ✅ CSP صارم في جميع الصفحات
- ✅ `noindex,nofollow,noarchive` للصفحات الإدارية
- ✅ `referrer: no-referrer` للصفحات الإدارية
- ✅ لا innerHTML في أي من الملفات الجديدة (de-core, parent.js, manage.js)

---

## ⚠️ نقاط تحتاج انتباهًا

### (1) admin.js — لوحة إدارة المحتوى
**الوضع**: `admin.js` (953 سطر) يستخدم دالة `h()` محلية تختلف عن `DE.h` في de-core.js.
- الفرق: `admin.js:h()` تقبل href أي نوع من الروابط، بينما `DE.h` تتحقق من `https:` أو `blob:` أو `#`
- **الخطر المحتمل**: منخفض — البيانات تأتي من Supabase عبر المدير نفسه، وليس من مستخدمين عشوائيين
- **التوصية**: مراجعة وإعادة كتابة `admin.js` على المدى البعيد لاستخدام `DE.h`

### (2) مفتاح supabaseKey العام في cms-config.js
**الوضع**: `sb_publishable_8mgO37k9jB9_Dg4OQTfynw_NBC0gLjK` في ملف عام
- هذا **مقبول ومتعمَّد** للمفاتيح العامة (publishable/anon)
- **الشرط الضروري**: تفعيل RLS على جميع الجداول ✅

### (3) Storage Bucket 'media' عام
**الوضع**: الحاوية `media` عامة للقراءة (للصور العامة للموقع)
- **مقبول** لصور الموقع العام
- **تحذير**: لا تضع في هذه الحاوية أي صور خاصة بالأطفال
- الصور الخاصة تذهب إلى `private-docs` (غير عامة) ✅

### (4) دوال admin_add_user و admin_reset_password
**الوضع**: تعمل مع auth.users مباشرة (legacy approach)
- **التوصية**: استخدام Edge Function للدعوات بدلًا من كلمات المرور المباشرة
- النظام الجديد يستخدم `invite_parent` و `invite_admin` عبر Edge Function ✅

---

## 🔴 ما يجب فعله يدويًا (قائمة واجبات)

### إلزامي قبل الإطلاق

| # | المهمة | المكان |
|---|--------|--------|
| 1 | تشغيل `schema.sql` في SQL Editor | Supabase Dashboard |
| 2 | تشغيل `users-setup.sql` | Supabase Dashboard |
| 3 | تشغيل `02-families-portal.sql` | Supabase Dashboard |
| 4 | تشغيل `04-fixes-improvements.sql` | Supabase Dashboard |
| 5 | إنشاء حساب المدير من Authentication → Users | Supabase Dashboard |
| 6 | منح صلاحية admin بـ SQL: `INSERT INTO public.admins(user_id) SELECT id FROM auth.users WHERE email='...'` | SQL Editor |
| 7 | نشر Edge Function `admin-users` من `index.ts` | Dashboard → Edge Functions |
| 8 | ضبط سر `ALLOWED_ORIGINS` و `SITE_URL` | Dashboard → Edge Functions → Secrets |
| 9 | إعداد SMTP في Supabase Authentication | Dashboard → Auth → Email |
| 10 | ضبط Redirect URLs في Authentication | Dashboard → Auth → URL Config |

### موصى به بعد الإطلاق

| # | المهمة |
|---|--------|
| A | تفعيل MFA لجميع المديرين ثم تشغيل `03-enforce-mfa.sql` |
| B | اختبار رسالة دعوة حقيقية تصل إلى بريد تجريبي |
| C | اختبار منع الوصول لطفل آخر (محاولة قراءة UUID غير مرتبط) |
| D | مراجعة دورية لسجل العمليات `admin_audit` |

---

## 📊 ملخص البنية التقنية

```
GitHub Pages (الاستضافة)
├── index.html          ← الموقع العام (لا يتغير)
├── style.css           ← تنسيق الموقع العام
├── script.js           ← سلوك الموقع العام
├── i18n-data.js        ← ترجمات عربي/فرنسي
├── cms-config.js       ← إعدادات Supabase (anon key فقط)
├── cms.js              ← تحميل المحتوى من Supabase لعرضه
├── cms.css             ← أنماط إضافية
├── de-core.js          ← مكتبة مشتركة (Client + أدوات)
│
├── parent.html         ← فضاء الأولياء (noindex)
├── parent.js           ← منطق فضاء الأولياء
│
├── manage.html         ← لوحة إدارة الأطفال والأولياء (noindex)
├── manage.js           ← منطق لوحة الإدارة
│
├── admin.html          ← لوحة إدارة محتوى الموقع (noindex)
├── admin.js            ← منطق إدارة المحتوى
├── admin.css           ← تنسيق لوحة المحتوى
├── portal.css          ← تنسيق مشترك (parent + manage)
│
Supabase (الخلفية)
├── Auth               ← مصادقة المستخدمين
├── Database           ← PostgreSQL + RLS
│   ├── admins         ← المديرون (مغلق للـ API)
│   ├── parent_profiles← ملفات الأولياء
│   ├── children       ← ملفات الأطفال
│   ├── parent_children← علاقات ولي-طفل
│   ├── progress_reports← التقارير التربوية
│   ├── appointments   ← المواعيد والأنشطة
│   ├── messages       ← الرسائل والإعلانات
│   ├── documents      ← الوثائق الخاصة
│   ├── admin_audit    ← سجل العمليات
│   └── site_content   ← محتوى الموقع
├── Storage
│   ├── media/         ← وسائط الموقع العام (عامة)
│   └── private-docs/  ← وثائق الأطفال (خاصة + RLS)
└── Edge Functions
    └── admin-users    ← دعوة الأولياء والمديرين
```

---

## 🔗 الروابط النهائية (بعد نشر GitHub)

| الصفحة | الرابط |
|--------|--------|
| الموقع العام | `https://hmyasserabdou24-eng.github.io/[REPO]/` |
| فضاء الأولياء | `https://hmyasserabdou24-eng.github.io/[REPO]/parent.html` |
| لوحة الأطفال والأولياء | `https://hmyasserabdou24-eng.github.io/[REPO]/manage.html` |
| لوحة إدارة المحتوى | `https://hmyasserabdou24-eng.github.io/[REPO]/admin.html` |

> **ملاحظة**: استبدل `[REPO]` باسم المستودع الفعلي في GitHub.
