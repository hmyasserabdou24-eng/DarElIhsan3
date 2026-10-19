# متغيرات البيئة والإعدادات المطلوبة — دار الإحسان

> لا يحتوي هذا الملف أي أسرار. القيم الحقيقية تُكتب في أماكنها المذكورة فقط، ولا تُرفع إلى GitHub.

## 1) في الواجهة (ملف عام، مفتاحه عام بطبيعته)
| الملف | المتغير | القيمة | سرّي؟ |
|---|---|---|---|
| `cms-config.js` | `supabaseUrl` | عنوان مشروع Supabase (`https://<ref>.supabase.co`) | لا |
| `cms-config.js` | `supabaseKey` | المفتاح العام `sb_publishable_…` | لا (مصمَّم ليظهر في المتصفح؛ الحماية في RLS) |
| `cms-config.js` | `bucket` | `media` | لا |

❌ لا تضع هنا أبدًا `service_role` أو `sb_secret_…` أو أي كلمة مرور.

## 2) أسرار الدالة الخلفية `admin-users` (Supabase ▸ Edge Functions ▸ Secrets)
| الاسم | القيمة | ملاحظة |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://<USER>.github.io` | **بدونها يمنع المتصفح كل طلبات الدعوة (CORS)**. يمكن وضع أكثر من أصل بفاصلة |
| `SITE_URL` | `https://<USER>.github.io/<REPO>` | وجهة رابط الدعوة/الاستعادة في البريد |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | تُحقن تلقائيًا | **لا تكتبها في أي مكان** |

## 3) اختبارات الصلاحيات على جهازك (`rls-tests.mjs`) — ملف `.env` محلي غير مرفوع
انسخ `.env.example` إلى `.env` واملأه بحسابات **تجريبية** فقط. الملف مُستثنى في `.gitignore`.

## 4) أسرار GitHub Actions (اختياري — `keep-supabase-alive.yml`)
`SUPABASE_URL` و`SUPABASE_KEY` (المفتاح العام فقط) من Settings ▸ Secrets and variables ▸ Actions.

## 5) إعدادات لوحة Supabase (ليست ملفات)
- Authentication ▸ Sign In / Providers: تعطيل التسجيل العام، حدّ أدنى 10 أحرف لكلمة المرور.
- Authentication ▸ URL Configuration: `Site URL` و`Redirect URLs` (`…/parent.html`, `…/admin.html`).
- Authentication ▸ SMTP: **بريد حقيقي إلزامي** — بدونه لا تصل دعوات الأولياء إلى غير أعضاء فريق Supabase.
- Authentication ▸ Rate Limits، وLeaked password protection إن كانت خطتك تدعمها.
