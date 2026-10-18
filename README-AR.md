# المرحلة 2 — فضاء الأولياء: الخلفية، الحماية، والاختبارات

> البنية مسطّحة: كل الملفات في المجلد الرئيسي (عدا `.github/` الذي يشترطه GitHub).

## نتيجة فحص المشروع (المرحلة 1)
- **التقنية:** HTML/CSS/JS ثابت على GitHub Pages + Supabase (Auth/DB/Storage) عبر `fetch` مباشر، بلا npm ولا React. أُبقيت البنية كما هي.
- **موجود ويعمل:** لوحة إدارة (مسودة ← معاينة ← نشر)، جدول `admins` + `is_admin()`، `site_content` (draft/published)، سجل `admin_audit`، حاوية `media` العامة (صور/فيديو ≤ 50MB)، CSP عبر meta، SVG ممنوع، أسماء ملفات عشوائية.
- **غير موجود إطلاقًا:** أي جداول للأولياء/الأطفال/التقارير/المواعيد/الرسائل، حاوية خاصة، صفحة للأولياء.
- **ملاحظات أمنية على الموجود (لم أغيّرها تلقائيًا):**
  1. `admin_add_user` / `admin_reset_password` يكتبان مباشرة في `auth.users` و`auth.identities` ويمرّ الكود من المتصفح. يعمل، لكنه هشّ مع تحديثات Supabase ويتجاوز GoTrue. **البديل الآمن:** الدالة الخلفية `admin-users` (دعوة بريدية). بعد نشرها واختبارها يُنصح بسحب `execute` من هاتين الدالتين.
  2. جلسة المدير في `localStorage` عند «البقاء متصلاً» — مقبول مع CSP صارمة، لكنه يُسرق إن وُجدت ثغرة XSS. أبقِ الخيار غير مفعّل على الأجهزة المشتركة.
  3. `script.js` يبني `newsGrid` بـ `innerHTML` من مصفوفة `posts`؛ هي فارغة ولا تُملأ اليوم (خامل)، لكن يجب تنظيفها قبل ربطها بأي مصدر.
  4. المصادقة الثنائية للمدير غير مُلزَمة على مستوى القاعدة (القسم 9 في `schema.sql` اختياري).
  5. لا يوجد `.gitignore` — أُضيف الآن.
  6. فحص الأسرار: لا `service_role` ولا كلمات مرور في الملفات؛ فقط المفتاح العام `sb_publishable_…` (مقصود). **لم أستطع فحص سجل Git** لأن الأرشيف لا يحتوي مجلد `.git` — شغّل على جهازك: `git log -p | grep -iE "service_role|sb_secret"`.

## ما أُضيف في هذه الدفعة
| الملف | الغرض |
|---|---|
| `02-families-portal.sql` | جداول `children`, `parent_profiles`, `parent_children`, `progress_reports`, `appointments`, `messages`, `message_reads`, `documents`, `rate_limits` + RLS + حاوية `private-docs` الخاصة + مشغّلات التدقيق + أدوار الإدارة (`admin`/`editor`) |
| `index.ts` | الدالة الخلفية `admin-users`: دعوة ولي/مدير بالبريد، تعطيل/تفعيل حساب، تحقق Zod، فحص هوية وصلاحية المتصل، تحديد معدل في قاعدة البيانات، CORS مقيّد |
| `rls-tests.mjs` | اختبارات صلاحيات فعلية (زائر، وليّان، مدير، ملفات) |
| `.gitignore`, `.env.example` | حماية الأسرار |

لم يُعدَّل أي ملف من ملفات الموقع الحالية (`index.html`, `style.css`, `admin.*`, `cms.*`).

## مخطط العلاقات
```
auth.users ─┬─ admins (role: admin|editor, disabled)
            └─ parent_profiles ──< parent_children >── children
                                                         ├──< progress_reports (draft|published, مرفق اختياري)
                                                         ├──< appointments (all|child)
                                                         ├──< documents ──► storage: private-docs
                                                         └──< messages (all|parent|child) ──< message_reads
```
- الولي يصل فقط عبر `parent_children` (يتحقق منه `is_parent_of()` من `auth.uid()`، لا من معرّف يرسله المتصفح).
- الولي **قراءة فقط**، عدا تسجيل قراءة رسالة تخصه. المحرّر (`editor`) لا يرى بيانات الأولياء والأطفال.
- تعطيل الولي (`disabled`) يُسقط وصوله فورًا في كل السياسات، ثم تحظر الدالة الخلفية تسجيل دخوله.

## خطوات الإعداد (بالترتيب)
1. جرّب أولًا على **فرع Supabase أو مشروع تجريبي**: SQL Editor ← الصق `02-families-portal.sql` ← Run.
2. Authentication ← أنشئ 3 حسابات **تجريبية** (مدير + وليّان) للاختبار، وأضف المدير الاختباري بدور `admin` في `admins`.
3. انشر الدالة من لوحة Supabase (لا يلزم CLI): **Edge Functions ← Deploy a new function ← Via Editor** ← سمِّها `admin-users` ← الصق محتوى `index.ts` ← Deploy.  
   ثم Edge Functions ← Secrets وأضف: `ALLOWED_ORIGINS` = `https://<user>.github.io` و`SITE_URL` = `https://<user>.github.io/<repo>`.  
   وتأكد أن SMTP مضبوط (الدعوات تحتاج بريدًا يعمل) وأن Redirect URLs في Authentication تضمّ `SITE_URL`.
4. شغّل الاختبارات من جهازك: انسخ `.env.example` إلى `.env` واملأه، ثم  
   `node --env-file=.env rls-tests.mjs`
5. لا تنشر على الإنتاج إلا إذا نجحت كل الاختبارات.

## ما نُفِّذ فعليًا وما لم يُنفَّذ — بصدق
| البند | الحالة |
|---|---|
| فحص ملفات المشروع والأسرار | ✅ نُفّذ (ما عدا سجل Git: غير متاح في الأرشيف) |
| فحص صياغة `rls-tests.mjs` (`node --check`) | ✅ نُفّذ |
| تشغيل `02-families-portal.sql` على PostgreSQL | ❌ **لم يُنفَّذ** (لا قاعدة ولا شبكة في بيئتي) — كُتب بعناية لكنه غير مُجرَّب |
| نشر/تشغيل `admin-users` | ❌ لم يُنفَّذ (لا Deno ولا شبكة) — لم يُفحص حتى نحويًا |
| تشغيل اختبارات RLS على Supabase | ❌ لم يُنفَّذ — جاهزة للتشغيل عندك |
| الخلاصة | **لا أصف المشروع بأنه آمن أو جاهز للإنتاج** قبل نجاح الاختبارات على مشروعك |

## المتبقي (الدفعات التالية)
- صفحة الأولياء `parent.html` (دخول، أبناء، تقارير، مواعيد، رسائل، وثائق).
- أقسام اللوحة الجديدة: الأطفال، الأولياء (دعوة/تعطيل)، التقارير، المواعيد، الرسائل، الوثائق، والواجهة بقائمة جانبية.
- ترويسات HTTP (X-Frame-Options, HSTS, Permissions-Policy) لا يمكن ضبطها على GitHub Pages؛ تتطلب Cloudflare Pages/Netlify.
- حدود Auth (Rate Limits)، كلمات المرور، تعطيل التسجيل العام، والنسخ الاحتياطي: إعدادات من لوحة Supabase (مفصّلة في `SECURITY-AR.md`).
