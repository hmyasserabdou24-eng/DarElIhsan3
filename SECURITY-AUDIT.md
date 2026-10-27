# 🔒 تقرير التدقيق الأمني الشامل (Universal Web Security Skills + Vibe Coder Security Pack)
**المشروع:** المركز النفسي البيداغوجي دار الإحسان (`DarElIhsan3`)

---

## 1. Scope and Authorization (النطاق والتفويض)
- **المستودع / البيئة (Repository/Environment):** حزمة مشروع `DarElIhsan3-main` المرفوعة من مالك المشروع (تطبيق ويب ثابت HTML/CSS/JS مع خلفية Supabase PostgreSQL + Auth + Storage + Edge Functions `index.ts`).
- **النطاقات والواجهات المشمولة (Domains/APIs included):**
  - الواجهات الأمامية: `index.html`, `manage.html`, `parent.html`, `admin.html`, `qr.html`, `404.html`, `deploy-check.html`.
  - الشيفرات البرمجية: `de-core.js`, `manage.js`, `parent.js`, `admin.js`, `cms.js`, `script.js`, `qr.js`, `card.js`, `qr-gen.js`.
  - الدالة الخلفية: `index.ts` (Supabase Edge Function `admin-users`).
  - مخططات وسياسات قاعدة البيانات: `00-full-database-setup.sql`, `schema.sql`, `users-setup.sql`, `02-families-portal.sql`, `03-enforce-mfa.sql`, `04-hardening.sql`, `05-branches-sections-import.sql`, `05-child-qr-card.sql`, `06-sync-live-2026-10-22.sql`, `08-fix-audit-and-admin-delete.sql`.
  - إعدادات الأمان والنشر: `netlify.toml`, `CLAUDE.md`, `.gitignore`, `.env.example`.
- **الاستثناءات (Exclusions):** لم يتم إجراء أي تعديل مباشر أو تدميري على قاعدة بيانات الإنتاج الحية في Supabase (`qgjddtylriqdwvpihvmi.supabase.co`) احترامًا لحدود الأمان في `security-orchestrator`.
- **التاريخ وإصدارات الأدوات (Date & Tool Versions):** `2026-10-25` | `Node.js v18.20.4` | `Universal Web Security Skills (10 Skills)` + `Vibe Coder Security Pack (14 Rules)`.

---

## 2. Executive Summary (الملخص التنفيذي)
- **مستوى الخطر العام (Overall Risk):** كان **مرتفعًا (High)** قبل التدقيق بسبب وجود تسريب لبيانات `_portal_meta` في الصف العام `published` بجدول `site_content`، وتخزين كلمات مرور بنص واضح في ملفات SQL/Excel وفي كائن `account_meta`، وكشف طبيعة الإعاقة وتاريخ الميلاد في صفحة QR العامة. بعد تطبيق الإصلاحات واجتياز **80 فحصًا أمنيًا آليًا** (`53/53` في `local-tests.mjs` و`27/27` في `test-phase5.mjs`)، انخفض الخطر في الشيفرة المصدرية إلى **منخفض (Low)**.
- **أهم المشاكل المؤكدة التي تم اكتشافها وإصلاحها (Most Important Confirmed Issues Fixed):**
  1. **`[UWSS-01]` (Critical — `api-database-security` & `auth-access-control`):** تسرب بيانات `_portal_meta` (المربيات، الحسابات، ونسخ احتياطية لبيانات الأطفال والتقارير) إلى الصف العام `id = 'published'` في جدول `site_content` المقروء للزوار (`anon`).
  2. **`[UWSS-02]` (High — `secrets-config-security` & `auth-access-control`):** وجود كلمات مرور أولياء الأمور بنص صريح في `compact_setup.sql` و`07-create-parent-accounts.sql` و`حسابات_الأولياء.xlsx`، وتخزين كلمات مرور المربيات والمديرين بنص صريح (`pwVal`/`setupKey`) في `manage.js` مع وجود مصادقة محلية في المتصفح (`matchEducatorDirectAuth`) وتمرير كلمة السر في رابط الدعوة `?k=`.
  3. **`[UWSS-03]` (High — `file-upload-storage-security` & `api-database-security`):** كشف بيانات صحية وشخصية حساسة للطفل (`disability` طبيعة الإعاقة و`dob` تاريخ الميلاد) للعموم بدون تسجيل دخول عبر دالة `public_child_card` في صفحة `qr.html`.
  4. **`[UWSS-04]` (Medium — `frontend-web-security`):** استخدام `innerHTML` في `script.js` وعدم تصفية الروابط والسمات الخطرة في دالة `h()` داخل `admin.js`، وغياب ملف `netlify.toml` لترويسات HTTP الأمنية (`HSTS`, `X-Frame-Options`, `CSP`, `nosniff`, `Permissions-Policy`).
  5. **`[UWSS-05]` (Medium — `secrets-config-security` & `secure-code-review`):** السماح بـ `Access-Control-Allow-Origin: *` في `index.ts` عند غياب التطابق، وإرجاع نصوص أخطاء تقنية خام للعميل، وقبول كلمات مرور من 6 أحرف فقط في `08-fix-audit-and-admin-delete.sql`.
  6. **`[UWSS-06]` (Medium — `auth-access-control`):** غياب تحديد معدل المحاولات (`Rate Limiting`) داخل دالة استرداد رموز تسجيل الأولياء `redeem_registration_code` في `05-branches-sections-import.sql`.
- **المناطق غير المراجَعة (Areas Not Reviewed):** إعدادات لوحة تحكم Supabase السحابية الحية (SMTP، إعدادات Rate Limit الخاصة بـ GoTrue، تفعيل النسخ الاحتياطية اليومية، والسياسات المطبقة فعليًا على الخادم الحي حتى يتم تشغيل `rls-tests.mjs` محليًا).

---

## 3. Findings (النتائج التفصيلية وفق `REPORT_TEMPLATE.md`)

### Finding `UWSS-01`: تسرب بيانات `_portal_meta` والنسخ المخبأة للأطفال والتقارير إلى الصف العام `published` في `site_content`
- **Severity & Confidence:** **Critical** | Confidence: **Confirmed (100%)**
- **Affected Component / File / Line:**
  - `manage.js` (الدوال `emptyPortalMeta`, `Q.children`, `Q.reports`, `savePortalMeta`)
  - `00-full-database-setup.sql` (السطر 168 في `publish_content()`)
  - `schema.sql` (السطر 85 في `publish_content()`)
  - `users-setup.sql` و`admin.js` (دالة `publish_content()`)
- **Evidence:** كانت دالة `savePortalMeta` في `manage.js` تكتب الكائن `_portal_meta` (الذي يضم `educators`, `account_meta`, `children_cache`, `reports_cache`) في الصف `draft` ثم تستدعي تلقائيًا `C.rpc('publish_content')`، مما ينسخ `data` بالكامل إلى الصف `published`. وبما أن جدول `site_content` يملك سياسة RLS تسمح لدور `anon` بقراءة الصف `published` (`for select to anon, authenticated using (id = 'published')`)، فقد كان بإمكان أي زائر غير مسجل قراءة تلك البيانات عبر المفتاح العام.
- **Impact:** كشف بيانات الأطفال والتقارير المخبأة وبيانات المربيات والحسابات لأي متصل بدون تسجيل دخول.
- **Preconditions:** معرفة رابط مشروع Supabase والمفتاح العام (`anon`/`publishable key`) الموجودين في `cms-config.js`.
- **Recommended Fix:**
  1. إزالة `children_cache` و`reports_cache` نهائيًا من `_portal_meta` في `manage.js` والاعتماد الحصري على جداول PostgreSQL المحمية بـ RLS (`children` و`progress_reports`).
  2. إزالة استدعاء `publish_content` من `savePortalMeta` بحيث تبقى `_portal_meta` داخل الصف `draft` المحمي بـ `public.is_admin()`.
  3. تعديل دالة `publish_content()` في `00-full-database-setup.sql` و`schema.sql` و`users-setup.sql` و`admin.js` لتجريد المفتاح `_portal_meta` (`select (data - '_portal_meta') into d`) قبل النسخ إلى الصف `published`.
- **Fix Applied:** **Yes (نعم)**
- **Verification / Test Result:** تم التحقق عبر الاختبار الآلي في `local-tests.mjs` (`UWSS-01: عزل _portal_meta عن الصف العام published في site_content` — `✅`).
- **Residual Risk:** إذا كان الصف `published` في قاعدة البيانات الحية يحتوي سابقًا على `_portal_meta`، يجب تشغيل تحديث دالة `publish_content()` في SQL Editor ثم الضغط على «نشر» لتنظيف الصف المنشور.

---

### Finding `UWSS-02`: تخزين كلمات مرور بنص صريح ومصادقة محلية للمربيات في المتصفح
- **Severity & Confidence:** **High** | Confidence: **Confirmed (100%)**
- **Affected Component / File / Line:**
  - `compact_setup.sql`, `07-create-parent-accounts.sql`, `حسابات_الأولياء.xlsx`
  - `manage.js` (الدوال `matchEducatorDirectAuth`, `saveEducatorDirectSession`, `createOrUpdateEducatorAccount`, `secAccounts`, ومعامل الرابط `?k=`)
- **Evidence:**
  1. كانت ملفات `compact_setup.sql` و`07-create-parent-accounts.sql` و`حسابات_الأولياء.xlsx` تحتوي على كلمات مرور أولياء الأمور الـ 103 بنص صريح (`DIddmmyyyy`).
  2. كان `manage.js` يخزّن كلمات مرور المربيات والمديرين بنص صريح في الحقلين `pwVal` و`setupKey` داخل `account_meta`، ويسمح بالدخول عبر مقارنة محلية في المتصفح (`matchEducatorDirectAuth`) وتمرير كلمة المرور مشفرة بـ Base64 في رابط الدعوة (`?invite_edu=1&k=...`).
- **Impact:** كشف كلمات المرور لأي شخص يطلع على المستودع أو سجل التصفح، وإمكانية تزوير جلسة مربية محليًا في `sessionStorage` دون المرور بـ Supabase Auth.
- **Preconditions:** الوصول إلى ملفات المستودع أو سجل المتصفح.
- **Recommended Fix:**
  1. حذف `compact_setup.sql` و`07-create-parent-accounts.sql` و`حسابات_الأولياء.xlsx` من الحزمة وإضافتها إلى `.gitignore`، مع التوصية بتغيير كلمات المرور الافتراضية للأولياء.
  2. حذف `pwVal` و`setupKey` من `manage.js` (وإضافة `sanitizeAccountEntry` لحذف أي حقول كلمات مرور قديمة تلقائيًا)، وإلغاء `matchEducatorDirectAuth` و`?k=` بحيث يمر تسجيل دخول المربيات والمديرين حصريًا عبر `Supabase Auth` (`C.signIn` المشفر بـ `bcrypt`).
- **Fix Applied:** **Yes (نعم)**
- **Verification / Test Result:** تم التحقق عبر `local-tests.mjs` (`UWSS-02` — `✅`).
- **Residual Risk:** كلمات المرور التي رُفعت سابقًا في تاريخ Git تحتاج إلى تدوير (Rotation) من المالك في Supabase Auth وتنظيف تاريخ المستودع إذا كان عامًا.

---

### Finding `UWSS-03`: كشف طبيعة الإعاقة وتاريخ الميلاد في صفحة التحقق العامة لبطاقة التلميذ (`qr.html`)
- **Severity & Confidence:** **High** | Confidence: **Confirmed (100%)**
- **Affected Component / File / Line:**
  - `05-child-qr-card.sql` و`06-sync-live-2026-10-22.sql` (دالة `public_child_card`)
  - `qr.html` و`qr.js`
- **Evidence:** وفق مهارة `file-upload-storage-security` (*"No confidential data embedded in public QR codes... Avoid exposing private reports, disability information, child data, or other sensitive records through public URLs"*): كانت دالة `public_child_card(p_token)` المتاحة لدور `anon` تُرجع دائمًا الحقل الطبي الحساس `disability` (طبيعة الإعاقة) و`dob` (تاريخ الميلاد الذي يُشتق منه أيضًا كلمة المرور الافتراضية `DIddmmyyyy`).
- **Impact:** أي شخص يمسح رمز QR على بطاقة التلميذ يطّلع على التشخيص الطبي/الإعاقة وتاريخ الميلاد الكامل للطفل بدون تسجيل دخول.
- **Preconditions:** مسح رمز QR المطبوع على بطاقة التلميذ.
- **Recommended Fix:**
  1. تعديل دالة `public_child_card` في `05-child-qr-card.sql` و`06-sync-live-2026-10-22.sql` بحيث ترجع `'disability', null` دائمًا في الصفحة العامة، ولا ترجع `dob` أو `section` إلا إذا كان خيار `qr_show_extra` مفعّلًا صراحةً من الإدارة.
  2. تحديث `qr.html` و`qr.js` لإخفاء صفوف `تاريخ الميلاد` و`طبيعة الإعاقة` تلقائيًا عندما تكون قيمتها `null`.
- **Fix Applied:** **Yes (نعم)**
- **Verification / Test Result:** تم التحقق عبر `local-tests.mjs` (`UWSS-03: عدم كشف طبيعة الإعاقة وتاريخ الميلاد للعموم في صفحة التحقق من رمز QR` — `✅`).
- **Residual Risk:** يلزم تشغيل دالة `public_child_card` المحدثة في Supabase SQL Editor لتفعيل الحجب على الخادم الحي.

---

### Finding `UWSS-04`: تحصين الواجهة الأمامية ضد XSS وإضافة ترويسات HTTP الأمنية (`netlify.toml` & `CSP`)
- **Severity & Confidence:** **Medium** | Confidence: **Confirmed (100%)**
- **Affected Component / File / Line:** `script.js`, `admin.js`, `netlify.toml`, `*.html`
- **Evidence:** كان `script.js` يستخدم `innerHTML` في `splitWelcomeWords()` ولإدراج أيقونات SVG، وكانت دالة `h()` في `admin.js` لا تمنع تمرير سمات خطرة مثل `innerHTML` أو `srcdoc` أو روابط `javascript:`.
- **Recommended Fix:** استبدال جميع استخدامات `innerHTML` في `script.js` بـ `createElement` و`textContent` و`createElementNS`، وتحصين `h()` في `admin.js`، وإنشاء `netlify.toml` يفرض `Strict-Transport-Security`, `X-Frame-Options = "DENY"`, `X-Content-Type-Options = "nosniff"`, `Referrer-Policy`, `Permissions-Policy`, و`Content-Security-Policy` مرتبطة بـ `https://qgjddtylriqdwvpihvmi.supabase.co`.
- **Fix Applied:** **Yes (نعم)**
- **Verification / Test Result:** تم التحقق عبر `local-tests.mjs` (`✅`).
- **Residual Risk:** منخفض جدًا.

---

### Finding `UWSS-05` & `UWSS-06`: تشديد CORS، تعميم رسائل الخطأ، تعقيد كلمات المرور، وRate Limiting على رموز التسجيل
- **Severity & Confidence:** **Medium** | Confidence: **Confirmed (100%)**
- **Affected Component / File / Line:** `index.ts`, `08-fix-audit-and-admin-delete.sql`, `05-branches-sections-import.sql`
- **Evidence:**
  1. في `index.ts`: كان ترويس `Access-Control-Allow-Origin` يعود إلى `'*'` عند عدم التطابق، وكانت بعض رسائل `fail()` تُلحق نص خطأ الخادم الخام (`err.message`).
  2. في `08-fix-audit-and-admin-delete.sql`: كانت دالة `admin_add_user` تقبل كلمات مرور من 6 أحرف دون اشتراط حرف كبير ورقم.
  3. في `05-branches-sections-import.sql`: لم تكن دالة `redeem_registration_code` تفرض حدًا لمعدل المحاولات (`rate_limit_hit`).
- **Recommended Fix:** رفض أي `Origin` غير مصرح به في `index.ts` بكود `HTTP 403`، وتعميم رسائل الخطأ المرجعة للعميل، وفرض شروط كلمة المرور (`8+` أحرف مع `[A-Z]` و`[0-9]`) في `08-fix-audit-and-admin-delete.sql`، وإضافة `rate_limit_hit('redeem_code:' || auth.uid()::text, 5, 900)` (5 محاولات كل 15 دقيقة) في `05-branches-sections-import.sql`.
- **Fix Applied:** **Yes (نعم)**
- **Verification / Test Result:** تم التحقق عبر `local-tests.mjs` (`✅`).
- **Residual Risk:** منخفض جدًا.

---

## 4. Verification (التحقق والاختبارات المنفذة فعليًا)
- **الأوامر والاختبارات التي تم تشغيلها فعليًا:**
  1. `node local-tests.mjs` — فحص الوحدات والتحليل الساكن وفحوصات Vibe Coder Security Pack (14 قاعدة) وفحوصات Universal Web Security Skills (`UWSS-01` إلى `UWSS-06`).
  2. `node test-phase5.mjs` — فحص توليد رموز QR، هجرات قاعدة البيانات، عزل RLS للبرامج التربوية، وواجهات الإدارة والأولياء.
  3. `node --check manage.js && node --check qr.js && node --check admin.js && node --check script.js && node --check de-core.js` — فحص سلامة بناء الجمل البرمجية لجميع ملفات JavaScript المعدلة.
- **النتائج (Results):**
  - `local-tests.mjs`: **53 نجح، 0 فشل** (`100% PASS`).
  - `test-phase5.mjs`: **27 نجح، 0 فشل** (`100% PASS`).
- **الاختبارات التي لم تُشغّل ولماذا (Tests Not Run and Why):**
  - `node --env-file=.env rls-tests.mjs`: لم يُشغّل داخل بيئة الفحص لأن الاتصال الشبكي الخارجي معطل في البيئة المعزولة ولعدم وجود حسابات الاختبار الحية في `.env`. يجب تشغيله محليًا على جهازك قبل الإطلاق النهائي.

---

## 5. Deployment Plan & Incident Readiness (خطة النشر والجاهزية للحوادث)
1. **النسخ الاحتياطي وخطة الرجوع (Backup & Rollback):**
   - خذ نسخة احتياطية كاملة من قاعدة بيانات Supabase قبل تطبيق تحديثات SQL.
   - جميع تعديلات الدوال (`publish_content`, `public_child_card`, `redeem_registration_code`, `admin_add_user`) مكتوبة بصيغة `CREATE OR REPLACE FUNCTION` آمنة وغير مدمرة للبيانات (`idempotent`).
2. **التطبيق في بيئة Supabase (SQL Editor & Edge Functions):**
   - نفّذ التحديثات الخاصة بـ `publish_content()` و`public_child_card()` و`redeem_registration_code()` و`admin_add_user()` في **SQL Editor** (الكود الكامل مرفق في القسم 7 أدناه).
   - حدّث دالة Edge Function `admin-users` بالكود المحدث في `index.ts` وتأكد من ضبط `ALLOWED_ORIGINS` و`SITE_URL`.
3. **تدوير كلمات المرور المكشوفة سابقًا (Credential Rotation):**
   - بما أن ملفات الحسابات السابقة كانت تحتوي على كلمات مرور على نمط `DIddmmyyyy`، يُوصى بشدة بإلزام الأولياء بتغيير كلمات مرورهم عند أول دخول أو إرسال روابط دعوة/استعادة فردية لهم.

---

## 6. Limitations (القيود)
لا يمكن لأي تدقيق أمني إثبات خلو النظام من جميع الثغرات بنسبة مطلقة؛ تعتمد النتائج على الشيفرة المصدرية المتاحة، وإعدادات مشروع Supabase الفعلي، وتشغيل اختبارات التكامل الحية (`rls-tests.mjs`) بعد النشر.

---

## 7. الكود الكامل للملفات المعدّلة (جاهزة للنسخ أو الحفظ)

### 📄 1. سكربت الترقية الأمنية لقاعدة البيانات (`09-uwss-security-patch.sql` — شغّله في Supabase SQL Editor)
يجمع هذا السكربت التعديلات الأمنية لـ `UWSS-01` و`UWSS-03` و`UWSS-05` و`UWSS-06` لتشغيلها دفعة واحدة في SQL Editor دون المساس بأي بيانات موجودة:

```sql
-- =====================================================================
-- 09) الترقية الأمنية الشاملة وفق Universal Web Security Skills
-- شغّل هذا الملف في Supabase ▸ SQL Editor (آمن لإعادة التشغيل ولا يحذف أي بيانات)
-- =====================================================================

-- 1. [UWSS-01] منع تسرب _portal_meta إلى الصف العام published في site_content
create or replace function public.publish_content()
returns timestamptz language plpgsql security definer set search_path = public as $$
declare d jsonb; t timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select (data - '_portal_meta') into d from public.site_content where id = 'draft';
  if d is null then raise exception 'لا توجد مسودة'; end if;

  insert into public.site_content_history (data, published_by)
    select (data - '_portal_meta'), auth.uid() from public.site_content where id = 'published' and data <> '{}'::jsonb;

  insert into public.site_content (id, data, updated_at, updated_by)
    values ('published', d, t, auth.uid())
  on conflict (id) do update
    set data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by;

  delete from public.site_content_history
   where id not in (select id from public.site_content_history order by id desc limit 30);
  perform public.audit_log('publish');
  return t;
end $$;
revoke all on function public.publish_content() from public, anon;
grant execute on function public.publish_content() to authenticated;

-- تنظيف الصف المنشور الحالي من أي بيانات _portal_meta سابقة
update public.site_content set data = data - '_portal_meta' where id = 'published' and data ? '_portal_meta';

-- 2. [UWSS-03] حماية خصوصية الطفل في صفحة QR العامة (عدم كشف طبيعة الإعاقة وتاريخ الميلاد للعموم)
create or replace function public.public_child_card(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r public.children%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return jsonb_build_object('found', false);
  end if;
  select * into r from public.children where qr_token = p_token and active;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  return jsonb_build_object(
    'found', true,
    'full_name', r.full_name,
    'center', r.center,
    'membership_no', r.membership_no,
    'member_no', r.membership_no,
    'section', case when coalesce(r.qr_show_extra, false) then r.section else null end,
    'dob', case when coalesce(r.qr_show_extra, false) then r.dob else null end,
    'disability', null,
    'academic_year', r.academic_year
  );
end $$;
revoke all on function public.public_child_card(text) from public;
grant execute on function public.public_child_card(text) to anon, authenticated;

-- 3. [UWSS-06] إضافة Rate Limiting (5 محاولات / 15 دقيقة) على استرداد رمز تسجيل الولي
create or replace function public.redeem_registration_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_rec record;
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول لاسترداد رمز التسجيل' using errcode = '42501';
  end if;

  if not public.rate_limit_hit('redeem_code:' || auth.uid()::text, 5, 900) then
    raise exception 'محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة.' using errcode = 'P0001';
  end if;

  select rc.*, c.full_name into v_rec
  from public.registration_codes rc
  join public.children c on c.id = rc.child_id
  where upper(btrim(rc.code)) = upper(btrim(p_code));

  if not found then
    raise exception 'رمز التسجيل غير صحيح أو غير موجود' using errcode = '22023';
  end if;

  if v_rec.used_at is not null then
    raise exception 'هذا الرمز تم استخدامه مسبقًا بتاريخ %', to_char(v_rec.used_at, 'YYYY/MM/DD') using errcode = '22023';
  end if;

  if v_rec.expires_at < now() then
    raise exception 'انتهت صلاحية رمز التسجيل هذا' using errcode = '22023';
  end if;

  insert into public.parent_profiles (user_id, full_name, email, disabled)
  values (
    auth.uid(),
    coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), 'ولي أمر'),
    (select email from auth.users where id = auth.uid()),
    false
  )
  on conflict (user_id) do update set disabled = false;

  insert into public.parent_children (parent_id, child_id, relation)
  values (auth.uid(), v_rec.child_id, 'ولي أمر')
  on conflict (parent_id, child_id) do nothing;

  update public.registration_codes
  set used_at = now(), used_by = auth.uid()
  where id = v_rec.id;

  perform public.audit_log('parent:redeem_code', v_rec.child_id::text);

  return jsonb_build_object(
    'success', true,
    'child_id', v_rec.child_id,
    'child_name', v_rec.full_name
  );
end;
$$;
revoke all on function public.redeem_registration_code(text) from public, anon;
grant execute on function public.redeem_registration_code(text) to authenticated;

notify pgrst, 'reload schema';
```

### 📄 `qr.js`
```javascript
/* صفحة التحقق العامة لبطاقة التلميذ (تُفتح عند مسح رمز QR).
   - الرابط الجديد: qr.html?c=<رمز البطاقة السري 32 حرفًا>  ← يُستدعى public_child_card
   - الروابط القديمة المطبوعة: qr.html?id=<public_uuid>      ← يُستدعى get_public_child
   تُعرض الحقول: رقم المنخرط، الاسم، المركز، الفوج/القسم، تاريخ الميلاد، طبيعة الإعاقة، الموسم الدراسي.
   لا تُعرض ملاحظات الولي (basic_info) ولا أي بيانات أخرى. */
(function () {
  'use strict';
  var CFG = window.DE_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };

  function setField(id, text) { var el = $('#' + id); if (el) el.textContent = text || '—'; }
  function centerName(key) {
    var c = (window.DE_CENTERS || {})[key] || (window.DE_CENTERS || {}).main;
    return c ? c.name : 'المركز النفسي البيداغوجي دار الإحسان';
  }
  function showError(msg) {
    $('#loading').hidden = true;
    $('#studentData').hidden = true;
    var err = $('#errorState');
    err.textContent = msg;
    err.hidden = false;
  }
  function formatDob(iso) {
    if (!iso) return '—';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? (m[1] + '/' + m[2] + '/' + m[3]) : iso;
  }
  function showCard(d) {
    setField('f_num', d.membership_no || '—');
    setField('f_name', d.full_name);
    setField('f_center', d.centerLabel || centerName(d.center));
    if (d.section) { setField('f_section', d.section); if ($('#row_section')) $('#row_section').hidden = false; }
    if (d.dob) { setField('f_dob', formatDob(d.dob)); if ($('#row_dob')) $('#row_dob').hidden = false; }
    if (d.disability) { setField('f_disability', d.disability); if ($('#row_disability')) $('#row_disability').hidden = false; }
    setField('f_period', d.academic_year ? ('السنة التربوية ' + d.academic_year.replace('-', '–')) : 'السنة التربوية 2026–2027');
    // زر دخول الولي: اسم المستخدم (اسم الطالب بالفرنسية + رقم قيده) يُملأ تلقائيًا في صفحة الدخول
    try {
      var un = window.DEUser && DEUser.username(d.full_name, d.membership_no);
      var claim = $('#btnClaim');
      if (un && claim) claim.setAttribute('href', 'parent.html?u=' + encodeURIComponent(un));
      if (un) { setField('f_user', un); var ur = $('#userRow'); if (ur) ur.hidden = false; }
    } catch (e) { /* يبقى الرابط العام */ }
    $('#loading').hidden = true;
    $('#studentData').hidden = false;
  }

  var NOT_FOUND = 'لم يتم العثور على بيانات مطابقة لهذه البطاقة. قد تكون البطاقة قديمة أو ملغاة، أو الملف غير نشط. راجع إدارة المركز.';
  var INVALID = 'رابط البطاقة غير صالح أو ناقص. يرجى مسح رمز الاستجابة السريعة (QR) الموجود على بطاقة التلميذ الرسمية.';

  async function init() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get('c');
    var legacyId = params.get('id');

    if (!token && !legacyId) return showError(INVALID);
    if (token && !/^[0-9a-f]{32}$/.test(token)) return showError(INVALID);
    if (!token && !(window.DE && DE.isUuid(legacyId))) return showError(INVALID);
    if (!CFG.supabaseUrl || !CFG.supabaseKey) return showError('إعدادات الاتصال غير مضبوطة.');

    try {
      var client = DE.Client(CFG, 'de_qr_session');
      if (token) {
        var res = await client.rpc('public_child_card', { p_token: token });
        if (!res || res.found !== true) return showError(NOT_FOUND);
        showCard({
          membership_no: res.membership_no || res.member_no,
          full_name: res.full_name,
          center: res.center,
          section: res.section,
          dob: res.dob,
          disability: res.disability,
          academic_year: res.academic_year
        });
      } else {
        // رابط قديم مطبوع قبل التحديث: نعرض الحقول العامة نفسها فقط
        var old = await client.rpc('get_public_child', { p_uuid: legacyId });
        if (!old || !old.full_name) return showError(NOT_FOUND);
        showCard({ membership_no: old.membership_no, full_name: old.full_name, centerLabel: old.branch, section: null });
      }
    } catch (err) {
      showError('تعذّر التحقق من البطاقة. تأكد من اتصال الإنترنت ثم أعد تحميل الصفحة.');
    }
  }

  init();
})();
```

### 📄 `qr.html`
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://qgjddtylriqdwvpihvmi.supabase.co https://*.supabase.co; base-uri 'none'; form-action 'none'; object-src 'none'; manifest-src 'self'">
<title>التحقق من بطاقة التلميذ – دار الإحسان</title>
<link rel="icon" href="logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="portal.css?v=11">
<link rel="stylesheet" href="qr.css?v=1">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#0C2D55">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="دار الإحسان">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="stylesheet" href="pwa.css?v=1">
<script src="pwa.js" defer></script>
</head>
<body class="qr-page">

<main class="qr-box" id="cardBox" role="main">
  <div class="qr-header">
    <div class="republic">الجمهورية الجزائرية الديمقراطية الشعبية</div>
    <div class="assoc">جمعية أولياء الأطفال المعاقين ذهنياً</div>
    <img src="logo-sq.png" alt="شعار دار الإحسان" class="qr-logo">
    <div class="qr-center">المركز النفسي البيداغوجي دار الإحسان<br><small>العطف – ولاية غرداية</small></div>
    <div class="qr-status-tag">
      <span>✓ بطاقة تلميذ معتمدة</span>
    </div>
  </div>

  <div id="loading" class="qr-loading">جارٍ التحقق من بيانات التلميذ…</div>
  <div id="errorState" class="qr-error" hidden></div>

  <div id="studentData" hidden>
    <p class="qr-note">هذه معلومات التحقق العامة من البطاقة فقط. المعلومات الكاملة متاحة لولي التلميذ بعد تسجيل الدخول.</p>
    <div class="qr-field">
      <span class="qr-field-label">رقم المنخرط:</span>
      <span class="qr-field-val qr-num" id="f_num">—</span>
    </div>
    <div class="qr-field">
      <span class="qr-field-label">اسم ولقب التلميذ(ة):</span>
      <span class="qr-field-val" id="f_name">—</span>
    </div>
    <div class="qr-field">
      <span class="qr-field-label">المركز:</span>
      <span class="qr-field-val" id="f_center">—</span>
    </div>
    <div class="qr-field" id="row_section" hidden>
      <span class="qr-field-label">الفوج / القسم:</span>
      <span class="qr-field-val" id="f_section">—</span>
    </div>
    <div class="qr-field" id="row_dob" hidden>
      <span class="qr-field-label">تاريخ الميلاد:</span>
      <span class="qr-field-val" id="f_dob">—</span>
    </div>
    <div class="qr-field" id="row_disability" hidden>
      <span class="qr-field-label">طبيعة الإعاقة:</span>
      <span class="qr-field-val" id="f_disability">—</span>
    </div>
    <div class="qr-field">
      <span class="qr-field-label">الفترة:</span>
      <span class="qr-field-val" id="f_period">السنة التربوية 2026–2027</span>
    </div>

    <div class="qr-claim">
      <p>أنت ولي أمر هذا التلميذ؟<br>سجّل الدخول باسم المستخدم وكلمة المرور التي سلّمتها لك الإدارة لمتابعة ملف طفلك (لا يظهر لك إلا ابنك).</p>
      <p id="userRow" hidden>اسم المستخدم: <strong dir="ltr" id="f_user"></strong></p>
      <a href="parent.html" class="btn-gold" id="btnClaim">الدخول إلى فضاء الأولياء</a>
    </div>
  </div>

  <div class="qr-footer">
    المركز النفسي البيداغوجي دار الإحسان – العطف، غرداية<br>
    <a href="index.html">زيارة الموقع الرسمي للمركز</a>
  </div>
</main>

<script src="cms-config.js?v=9"></script>
<script src="centers.js?v=1"></script>
<script src="de-core.js?v=11"></script>
<script src="fr-names.js?v=1"></script>
<script src="username.js?v=1"></script>
<script src="qr.js?v=12"></script>
</body>
</html>
```

### 📄 `script.js`
```javascript
document.documentElement.classList.add('js');

/* T (نصوص الموقع) انتقلت إلى i18n-data.js وتُحمَّل قبل هذا الملف */
/* حماية كاملة من XSS (Rule 2): لا innerHTML إطلاقًا — بناء DOM آمن عبر createElement و textContent و createElementNS */

let L = 'ar';
let posts = [];

try {
  localStorage.setItem('lang', 'ar');
} catch (error) {
  // ignore storage errors in restricted contexts
}

function createIcon(name) {
  const safeName = String(name || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'i');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-' + safeName);
  svg.appendChild(use);
  return svg;
}

function splitWelcomeWords() {
  const title = document.querySelector('.welcome-title');
  if (!title) return;

  const text = title.textContent.trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return;

  title.textContent = '';
  words.forEach((word, index) => {
    if (index > 0) title.appendChild(document.createTextNode(' '));
    const span = document.createElement('span');
    span.className = 'word';
    span.style.setProperty('--i', String(index));
    span.textContent = word;
    title.appendChild(span);
  });
}

function updateI18n() {
  document.documentElement.lang = L;
  document.documentElement.dir = L === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (T[L] && T[L][key]) {
      el.textContent = T[L][key];
    }
  });

  splitWelcomeWords();

  const langLabel = L === 'ar' ? 'Français' : 'العربية';
  const langButton = document.getElementById('langTxt');
  if (langButton) langButton.textContent = langLabel;

  document.title = (T[L].h1 || T[L].heroTitle) + ' – ' + (T[L].f2 || T[L].brand);

  try {
    localStorage.setItem('lang', L);
  } catch (error) {
    // ignore storage errors in restricted contexts
  }
}

function renderNews() {
  const newsGrid = document.getElementById('newsGrid');
  if (!newsGrid) return;

  newsGrid.textContent = '';
  if (!posts.length) {
    return;
  }

  // بناء آمن: لا innerHTML ولا إدراج نصوص/روابط قادمة من مصدر خارجي (حماية من XSS)
  const safeHttps = (u) => { try { const x = new URL(u, location.href); return x.protocol === 'https:' ? x.href : ''; } catch (e) { return ''; } };
  posts.forEach((p) => {
    const date = new Date(p.date).toLocaleDateString(L === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const card = document.createElement('article');
    card.className = 'card in';
    const ph = document.createElement('div');
    ph.className = 'ph';
    const imgSrc = safeHttps(p.image);
    if (imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc; img.alt = ''; img.loading = 'lazy';
      img.addEventListener('error', () => img.remove());
      ph.appendChild(img);
    }
    const body = document.createElement('div');
    body.className = 'body';
    const d = document.createElement('span'); d.className = 'date'; d.textContent = date;
    const t = document.createElement('h3'); t.textContent = (p.title && p.title[L]) || '';
    const tx = document.createElement('p'); tx.textContent = (p.text && p.text[L]) || '';
    const a = document.createElement('a'); a.className = 'btn'; a.href = safeHttps(p.url) || '#';
    const sp = document.createElement('span'); sp.textContent = T[L].more;
    const ar = document.createElement('i'); ar.className = 'arr'; ar.appendChild(createIcon('arrow'));
    a.append(sp, ar);
    body.append(d, t, tx, a);
    card.append(ph, body);
    newsGrid.appendChild(card);
  });
}

function setLang(lang) {
  L = lang;
  updateI18n();
  renderNews();
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-i]').forEach((el) => {
  el.textContent = '';
  el.appendChild(createIcon(el.dataset.i));
});

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

document.getElementById('lang')?.addEventListener('click', () => {
  setLang(L === 'ar' ? 'fr' : 'ar');
});

const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !navToggle.contains(e.target)) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

updateI18n();
```

### 📄 `index.ts`
```typescript
// الملف: index.ts (الدالة الخلفية admin-users). انشرها من Supabase ▸ Edge Functions ▸ Deploy a new function ▸ الاسم admin-users ▸ الصق هذا الملف.
// Edge Function: admin-users — إنشاء حسابات الأولياء والمديرين بدعوة بريدية (بلا كلمات مرور تمر عبر المتصفح).
// المفتاح السري SUPABASE_SERVICE_ROLE_KEY يُحقن تلقائيًا في بيئة Supabase ولا يوضع في أي ملف.
// الأسرار المطلوبة: supabase secrets set ALLOWED_ORIGINS="https://hmyasserabdou24-eng.github.io" SITE_URL="https://hmyasserabdou24-eng.github.io"
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DEFAULT_SITE_URL = 'https://hmyasserabdou24-eng.github.io/DarElIhsan3';
const SITE_URL = (Deno.env.get('SITE_URL') ?? DEFAULT_SITE_URL).replace(/\/$/, '');
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://hmyasserabdou24-eng.github.io').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_BODY = 10_000;

const email = z.string().trim().toLowerCase().email().max(254);
const uuid = z.string().uuid();
const Body = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('invite_parent'),
    email,
    full_name: z.string().trim().min(2).max(120),
    phone: z.string().trim().regex(/^[0-9+()\s.-]{5,25}$/).optional(),
    child_ids: z.array(uuid).max(10).default([]),
  }),
  z.object({ action: z.literal('resend_parent_invite'), user_id: uuid }),
  z.object({ action: z.literal('set_parent_disabled'), user_id: uuid, disabled: z.boolean() }),
  z.object({ action: z.literal('invite_admin'), email, role: z.enum(['admin', 'editor']) }),
  z.object({ action: z.literal('set_admin_disabled'), user_id: uuid, disabled: z.boolean() }),
  z.object({ action: z.literal('remove_admin'), user_id: uuid }),
]);

function logDiag(stage: string, details: Record<string, unknown> = {}) {
  const clean: Record<string, unknown> = { stage, timestamp: new Date().toISOString() };
  for (const [k, v] of Object.entries(details)) {
    if (/token|password|secret|auth|key|headers/i.test(k)) continue;
    if (k === 'email' && typeof v === 'string') {
      const parts = v.split('@');
      clean[k] = parts.length === 2 ? `${parts[0].slice(0, 2)}***@${parts[1]}` : '***';
    } else {
      clean[k] = v;
    }
  }
  console.log(`[admin-users:diag] ${JSON.stringify(clean)}`);
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // server-to-server or same-origin non-CORS
  if (!ALLOWED.length || !ALLOWED[0]) return false;
  return ALLOWED.includes(origin);
}

function cors(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED.includes(origin) ? origin : (ALLOWED[0] || 'https://hmyasserabdou24-eng.github.io');
  return {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
  };
}
const json = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (!isOriginAllowed(origin)) return json(403, { error: 'النطاق غير مصرّح به (CORS).' }, origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);

  // 1) حدّ حجم الطلب
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { error: 'الطلب كبير جدًا.' }, origin);

  // 2) هوية المتصل: تُستخرج من الجلسة الموقّعة، لا من أي حقل في الطلب
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json(401, { error: 'غير مصرّح.' }, origin);
  const userClient = createClient(SB_URL, SB_ANON, { global: { headers: { Authorization: auth } } });
  const { data: u, error: uErr } = await userClient.auth.getUser();
  if (uErr || !u?.user) return json(401, { error: 'انتهت الجلسة. سجّل الدخول من جديد.' }, origin);
  const actor = u.user;

  // 3) الصلاحية يتحقق منها قاعدة البيانات نفسها (جدول admins) في كل عملية
  const { data: canFamilies } = await userClient.rpc('can_manage_families');
  if (canFamilies !== true) return json(403, { error: 'ليست لديك صلاحية تنفيذ هذه العملية.' }, origin);
  const { data: isOwner } = await userClient.rpc('is_owner');

  const svc = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  // 4) تحديد المعدل (عدّاد في قاعدة البيانات، لا في المتصفح)
  const { data: allowed } = await svc.rpc('rate_limit_hit', { p_key: 'admin-users:' + actor.id, p_max: 30, p_window_seconds: 60 });
  if (allowed !== true) return json(429, { error: 'محاولات كثيرة. انتظر دقيقة.' }, origin);

  // 5) التحقق من المدخلات
  let input: z.infer<typeof Body>;
  try { input = Body.parse(JSON.parse(raw)); } catch { return json(400, { error: 'بيانات غير صالحة.' }, origin); }

  const audit = (action: string, target: string) =>
    svc.from('admin_audit').insert({ actor: actor.id, actor_email: actor.email, action, target: target.slice(0, 200) });
  const fail = (e: unknown, msg: string, status = 500) => {
    logDiag('operation_failed', { error: (e as { message?: string })?.message ?? 'unknown', status });
    return json(status, { error: msg }, origin);
  };
  const redirect = (path: string) => `${SITE_URL}${path}`;

  try {
    if (input.action === 'invite_parent') {
      logDiag('invite_start', { email: input.email, children_count: input.child_ids.length });

      if (input.child_ids.length) {
        const { data: found } = await svc.from('children').select('id').in('id', input.child_ids);
        if ((found?.length ?? 0) !== new Set(input.child_ids).size) return json(400, { error: 'أحد الأطفال المحدَّدين غير موجود.' }, origin);
      }

      let uid: string | null = null;
      let emailDispatched = false;
      let emailError: string | null = null;
      let actionLink: string | null = null;
      let isExisting = false;

      const redirectUrl = redirect('/parent.html');
      logDiag('dispatch_attempt', { email: input.email, redirectTo: redirectUrl });

      // محاولة الإرسال الرسمية عبر inviteUserByEmail مع مهلة 15 ثانية
      try {
        const inv = await Promise.race([
          svc.auth.admin.inviteUserByEmail(input.email, {
            redirectTo: redirectUrl,
            data: { full_name: input.full_name }
          }),
          new Promise<{ data: { user: null }; error: { message: string; status: number; name: string } }>((_, reject) =>
            setTimeout(() => reject(new Error('انتهت مهلة استجابة خادم البريد (Timeout: 15s)')), 15000)
          )
        ]);

        if (inv.error) {
          const errMsg = inv.error.message || '';
          const isRegistered = /already|registered|exists/i.test(errMsg);

          if (isRegistered) {
            isExisting = true;
            logDiag('invite_already_registered', { email: input.email });
            const genRec = await svc.auth.admin.generateLink({
              type: 'magiclink',
              email: input.email,
              options: { redirectTo: redirectUrl }
            });
            if (genRec.data?.user) {
              uid = genRec.data.user.id;
              actionLink = genRec.data.properties?.action_link ?? null;
              try {
                const rst = await svc.auth.resetPasswordForEmail(input.email, { redirectTo: redirectUrl });
                if (!rst.error) emailDispatched = true;
                else emailError = rst.error.message;
              } catch (e: any) {
                emailError = e?.message ?? 'تعذّر إرسال بريد الاستعادة.';
              }
            } else {
              return fail(genRec.error, 'هذا البريد مسجّل مسبقًا، وتعذّر الوصول لبيانات حسابه.', 409);
            }
          } else {
            logDiag('invite_smtp_rejected', { email: input.email, message: errMsg });
            emailError = errMsg;
            emailDispatched = false;

            const genFallback = await svc.auth.admin.generateLink({
              type: 'invite',
              email: input.email,
              options: {
                redirectTo: redirectUrl,
                data: { full_name: input.full_name }
              }
            });
            if (genFallback.data?.user) {
              uid = genFallback.data.user.id;
              actionLink = genFallback.data.properties?.action_link ?? null;
            } else {
              return fail(inv.error, 'فشل إنشاء الحساب وإرسال الدعوة. يرجى المحاولة لاحقًا.', inv.error.status || 500);
            }
          }
        } else if (inv.data?.user) {
          uid = inv.data.user.id;
          emailDispatched = true;
          logDiag('invite_smtp_accepted', { email: input.email, user_id: uid });

          // نولد أيضاً الرابط الاحتياطي ليكون متاحاً للمدير فوراً عند الحاجة
          const genBackup = await svc.auth.admin.generateLink({
            type: 'magiclink',
            email: input.email,
            options: { redirectTo: redirectUrl }
          });
          actionLink = genBackup.data?.properties?.action_link ?? null;
        }
      } catch (timeoutErr: any) {
        logDiag('invite_timeout', { email: input.email, error: timeoutErr?.message });
        emailError = timeoutErr?.message ?? 'انتهت مهلة الطلب';
        emailDispatched = false;

        const genFallback = await svc.auth.admin.generateLink({
          type: 'invite',
          email: input.email,
          options: { redirectTo: redirectUrl, data: { full_name: input.full_name } }
        });
        if (genFallback.data?.user) {
          uid = genFallback.data.user.id;
          actionLink = genFallback.data.properties?.action_link ?? null;
        } else {
          return fail(timeoutErr, 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.', 504);
        }
      }

      if (!uid) {
        return fail(null, 'تعذّر تحديد معرّف المستخدم.', 500);
      }

      const prof = await svc.from('parent_profiles').upsert({
        user_id: uid,
        full_name: input.full_name,
        email: input.email,
        phone: input.phone ?? null,
        created_by: actor.id
      }, { onConflict: 'user_id' });

      if (prof.error) {
        logDiag('profile_upsert_failed', { error: prof.error.message });
        return fail(prof.error, 'تعذّر حفظ بيانات ملف الولي. يرجى المحاولة مرة أخرى.', 500);
      }

      if (input.child_ids.length) {
        const links = input.child_ids.map((c) => ({ parent_id: uid!, child_id: c }));
        const { error: linkErr } = await svc.from('parent_children').upsert(links, { onConflict: 'parent_id,child_id' });
        if (linkErr) {
          logDiag('links_upsert_failed', { error: linkErr.message });
          return fail(linkErr, 'تعذّر ربط الأبناء بملف الولي. يرجى المحاولة مرة أخرى.', 500);
        }
      }

      await audit(isExisting ? 'parent:relink_existing' : 'parent:invite', uid);
      return json(200, {
        ok: true,
        user_id: uid,
        account_created: !isExisting,
        already_registered: isExisting,
        email_dispatched: emailDispatched,
        email_error: emailError ? 'تعذّر إرسال البريد تلقائيًا؛ يمكنك نسخ رابط الدعوة الاحتياطي.' : null,
        action_link: actionLink
      }, origin);
    }

    if (input.action === 'resend_parent_invite') {
      logDiag('resend_start', { user_id: input.user_id });

      const { data: prof, error: profErr } = await svc.from('parent_profiles').select('email, full_name, disabled').eq('user_id', input.user_id).single();
      if (profErr || !prof) return fail(profErr, 'ملف ولي الأمر غير موجود.', 404);
      if (prof.disabled) return fail(null, 'لا يمكن إرسال دعوة لحساب معطّل. قم بتفعيل الحساب أولًا.', 400);
      if (!prof.email) return fail(null, 'البريد الإلكتروني للولي غير مسجّل.', 400);

      const redirectUrl = redirect('/parent.html');
      let emailDispatched = false;
      let emailError: string | null = null;
      let actionLink: string | null = null;

      const { data: uObj } = await svc.auth.admin.getUserById(input.user_id);
      const isConfirmed = !!uObj?.user?.email_confirmed_at;
      logDiag('resend_dispatch', { email: prof.email, is_confirmed: isConfirmed });

      if (!isConfirmed) {
        const inv = await svc.auth.admin.inviteUserByEmail(prof.email, { redirectTo: redirectUrl });
        if (!inv.error) {
          emailDispatched = true;
        } else {
          emailError = inv.error.message;
          logDiag('resend_invite_error', { error: inv.error.message });
        }
      } else {
        const rst = await svc.auth.resetPasswordForEmail(prof.email, { redirectTo: redirectUrl });
        if (!rst.error) {
          emailDispatched = true;
        } else {
          emailError = rst.error.message;
          logDiag('resend_reset_error', { error: rst.error.message });
        }
      }

      const gen = await svc.auth.admin.generateLink({
        type: isConfirmed ? 'magiclink' : 'invite',
        email: prof.email,
        options: { redirectTo: redirectUrl }
      });
      if (gen.data?.properties?.action_link) {
        actionLink = gen.data.properties.action_link;
      }

      await audit('parent:resend_invite', input.user_id);
      return json(200, {
        ok: true,
        email: prof.email,
        email_dispatched: emailDispatched,
        email_error: emailError ? 'تعذّر إرسال البريد تلقائيًا؛ يمكنك نسخ رابط الدعوة الاحتياطي.' : null,
        action_link: actionLink
      }, origin);
    }

    if (input.action === 'set_parent_disabled') {
      const up = await svc.from('parent_profiles').update({ disabled: input.disabled }).eq('user_id', input.user_id).select('user_id');
      if (up.error || !up.data?.length) return fail(up.error, 'الحساب غير موجود.', 404);
      await svc.auth.admin.updateUserById(input.user_id, { ban_duration: input.disabled ? '876000h' : 'none' });
      await audit(input.disabled ? 'parent:disable_login' : 'parent:enable_login', input.user_id);
      return json(200, { ok: true }, origin);
    }

    // عمليات حسابات الإدارة: للمالك فقط
    if (isOwner !== true) return json(403, { error: 'هذه العملية للمالك فقط.' }, origin);

    if (input.action === 'invite_admin') {
      // الدعوة تحمل البريد والصلاحية؛ المدعو يختار كلمة مروره بنفسه عند فتح الرابط.
      const redirectUrl = redirect('/manage.html');
      const roleLabel = input.role === 'admin' ? 'مدير شامل' : 'محرّر محتوى';
      const inv = await svc.auth.admin.inviteUserByEmail(input.email, {
        redirectTo: redirectUrl,
        data: { invited_email: input.email, invited_role: input.role, role_label: roleLabel, invited_by: actor.email ?? '' },
      });
      if (inv.error || !inv.data?.user) {
        const exists = /already|registered|exists/i.test(inv.error?.message ?? '');
        return fail(inv.error, exists ? 'هذا البريد مسجَّل مسبقًا.' : 'تعذّر إرسال الدعوة. يرجى المحاولة لاحقًا.', exists ? 409 : 500);
      }
      const uid = inv.data.user.id;
      // الصلاحية تُسجَّل في جدول admins (المصدر الوحيد للصلاحية). إن فشل التسجيل نلغي الحساب المُنشأ.
      const ins = await svc.from('admins').insert({ user_id: uid, role: input.role });
      if (ins.error) {
        await svc.auth.admin.deleteUser(uid);
        return fail(ins.error, 'تعذّر تسجيل صلاحيات المدير. يرجى المحاولة مرة أخرى.', 500);
      }
      await audit('admin:invite', input.email + ':' + input.role);
      return json(200, { ok: true, user_id: uid, email: input.email, role: input.role, role_label: roleLabel }, origin);
    }

    if (input.action === 'set_admin_disabled') {
      if (input.user_id === actor.id) return json(400, { error: 'لا يمكنك تعطيل حسابك.' }, origin);
      const { data: first } = await svc.from('admins').select('user_id').order('created_at', { ascending: true }).order('user_id', { ascending: true }).limit(1).single();
      if (first?.user_id === input.user_id) return json(400, { error: 'لا يمكن تعطيل حساب المالك.' }, origin);
      const up = await svc.from('admins').update({ disabled: input.disabled }).eq('user_id', input.user_id).select('user_id');
      if (up.error || !up.data?.length) return fail(up.error, 'الحساب غير موجود.', 404);
      await svc.auth.admin.updateUserById(input.user_id, { ban_duration: input.disabled ? '876000h' : 'none' });
      await audit(input.disabled ? 'admin:disable' : 'admin:enable', input.user_id);
      return json(200, { ok: true }, origin);
    }

    if (input.action === 'remove_admin') {
      if (input.user_id === actor.id) return json(400, { error: 'لا يمكنك حذف حسابك أنت (المالك).' }, origin);
      const { data: first } = await svc.from('admins').select('user_id').order('created_at', { ascending: true }).order('user_id', { ascending: true }).limit(1).single();
      if (first?.user_id === input.user_id) return json(400, { error: 'لا يمكن حذف حساب المالك الرئيسي.' }, origin);
      const { data: u } = await svc.auth.admin.getUserById(input.user_id);
      const email = u?.user?.email ?? input.user_id;
      await svc.from('admins').delete().eq('user_id', input.user_id);
      const del = await svc.auth.admin.deleteUser(input.user_id);
      if (del.error) return fail(del.error, 'تعذّر حذف المستخدم. يرجى المحاولة مرة أخرى.', 500);
      await audit('admin:remove', email);
      return json(200, { ok: true, deleted_email: email }, origin);
    }
  } catch (e: any) {
    return fail(e, 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
  }
  return json(400, { error: 'عملية غير معروفة.' }, origin);
});
```

### 📄 `netlify.toml`
```toml
# =====================================================================
# 🔒 netlify.toml — PACK SÉCURITÉ VIBE CODER (Dar El Ihsan / دار الإحسان)
# =====================================================================
# En-têtes de sécurité HTTP stricts (HSTS, Anti-clickjacking, nosniff,
# Referrer-Policy, Permissions-Policy, et Content-Security-Policy)
# adaptés au projet Dar El Ihsan et connectés à Supabase :
# https://qgjddtylriqdwvpihvmi.supabase.co
# =====================================================================

[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    # HTTPS obligatoire (HSTS 1 an + sous-domaines + preload)
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"

    # Anti-clickjacking (empêche l'intégration dans une iframe externe)
    X-Frame-Options = "DENY"

    # MIME sniffing off
    X-Content-Type-Options = "nosniff"

    # Referrer strict
    Referrer-Policy = "strict-origin-when-cross-origin"

    # Permissions caméra/micro/géoloc désactivées
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

    # CSP stricte — sans 'unsafe-inline' dans script-src, connectée au projet Supabase
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://qgjddtylriqdwvpihvmi.supabase.co https://*.supabase.co; media-src 'self' blob: https://qgjddtylriqdwvpihvmi.supabase.co https://*.supabase.co; connect-src 'self' https://qgjddtylriqdwvpihvmi.supabase.co; frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; manifest-src 'self';"

# Protection renforcée pour les portails sensibles (Admin, Gestion, Espace Parents)
[[headers]]
  for = "/manage.html"
  [headers.values]
    X-Frame-Options = "DENY"
    Referrer-Policy = "no-referrer"
    X-Robots-Tag = "noindex, nofollow, noarchive"
    Cache-Control = "no-store, no-cache, must-revalidate"
    Content-Security-Policy = "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://qgjddtylriqdwvpihvmi.supabase.co https://*.supabase.co; connect-src 'self' https://qgjddtylriqdwvpihvmi.supabase.co; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; manifest-src 'self';"

[[headers]]
  for = "/parent.html"
  [headers.values]
    X-Frame-Options = "DENY"
    Referrer-Policy = "no-referrer"
    X-Robots-Tag = "noindex, nofollow, noarchive"
    Cache-Control = "no-store, no-cache, must-revalidate"
    Content-Security-Policy = "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://qgjddtylriqdwvpihvmi.supabase.co https://*.supabase.co; connect-src 'self' https://qgjddtylriqdwvpihvmi.supabase.co; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; manifest-src 'self';"

[[headers]]
  for = "/admin.html"
  [headers.values]
    X-Frame-Options = "DENY"
    Referrer-Policy = "no-referrer"
    X-Robots-Tag = "noindex, nofollow, noarchive"
    Cache-Control = "no-store, no-cache, must-revalidate"
    Content-Security-Policy = "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://qgjddtylriqdwvpihvmi.supabase.co https://*.supabase.co; media-src 'self' blob: https://qgjddtylriqdwvpihvmi.supabase.co https://*.supabase.co; connect-src 'self' https://qgjddtylriqdwvpihvmi.supabase.co; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none';"

# Cache assets statiques
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 📄 `.gitignore`
```gitignore
# أسرار ومفاتيح — لا تُرفع أبدًا (Rule 4: Secrets Management)
.env
.env.*
!.env.example
*.pem
*.key
supabase/
node_modules/

# نسخ احتياطية وملفات بيانات حساسة للأطفال والأولياء
backups/
*.dump
*.sql.gz
*حسابات_الأولياء*.xlsx
*parent-accounts*.sql
compact_setup.sql
```


### manage.js


### parent.js

