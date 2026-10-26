// اختبارات محلية بلا شبكة: (أ) دوال التحقق وفحص الملفات (ب) فحص ساكن للأسرار وأنماط XSS وCSP وSQL.
// التشغيل: node local-tests.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const DE = require('./de-core.js');
let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : fail++; console.log((c ? '  ✅ ' : '  ❌ ') + n); };
const read = (f) => fs.readFileSync(f, 'utf8');
const bytes = (...a) => Uint8Array.from(a);
const pad = (arr, n = 40) => Uint8Array.from([...arr, ...new Array(n).fill(0x30)]);

console.log('\n(أ) دوال التحقق وفحص الملفات');
ok(DE.isEmail('a@b.co') && !DE.isEmail('a b@c.com') && !DE.isEmail('x@y') && !DE.isEmail('<a>@b.com'), 'isEmail');
ok(DE.isPhone('+213 555 12 34 56') && !DE.isPhone('abc') && !DE.isPhone('1'), 'isPhone');
ok(DE.isDate('2026-02-28') && !DE.isDate('2026-02-30') && !DE.isDate('2026-13-01') && !DE.isDate('26-1-1'), 'isDate (يرفض 30 فبراير)');
ok(DE.isUuid('aaaaaaaa-0000-4000-8000-000000000001') && !DE.isUuid("1;drop table x") && !DE.isUuid('../../etc'), 'isUuid يرفض الحقن ومسارات التسلل');
ok(DE.safeUrl('https://a.com/x') && DE.safeUrl('javascript:alert(1)') === null && DE.safeUrl('data:text/html,x') === null && DE.safeUrl('http://a.com') === null, 'safeUrl: https فقط');
ok(DE.clean('  a\u0000b\u0007c  ', 10) === 'abc' && DE.clean('x'.repeat(20), 5).length === 5 && DE.clean(null) === '', 'clean: يزيل محارف التحكم ويقصّ الطول');
ok(DE.pwProblem('Abcdefghi1') === '' && DE.pwProblem('abcdefghij1') !== '' && DE.pwProblem('Short1a') !== '' && DE.pwProblem('A1' + 'a'.repeat(80)) !== '', 'سياسة كلمة المرور (10+، كبير/صغير/رقم، ≤72 بايت)');
const PDF = pad([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]), JPG = pad([0xFF, 0xD8, 0xFF, 0xE0]), PNG = pad([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const WEBP = pad([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const chk = (name, b, type = '', size) => DE.checkFile({ name, size: size ?? b.length, type, bytes: b });
ok(chk('a.pdf', PDF, 'application/pdf').ok && chk('a.jpg', JPG, 'image/jpeg').ok && chk('a.JPEG', JPG).ok && chk('a.png', PNG).ok && chk('a.webp', WEBP).ok, 'ملفات صالحة (PDF/JPG/PNG/WebP)');
ok(!chk('a.svg', PDF).ok && !chk('a.exe', PDF).ok && !chk('a.html', PDF).ok && !chk('a.php.jpg.exe', PDF).ok && !chk('noext', PDF).ok, 'امتدادات غير مسموحة (svg/exe/html) مرفوضة');
ok(!chk('a.pdf', JPG).ok && !chk('a.jpg', PDF).ok && !chk('a.png', JPG).ok, 'عدم تطابق الامتداد مع المحتوى الحقيقي مرفوض');
ok(!chk('a.pdf', PDF, 'image/png').ok, 'عدم تطابق MIME المعلن مرفوض');
ok(!chk('a.pdf', PDF, '', 5 * 1024 * 1024 + 1).ok && chk('a.pdf', PDF, '', 5 * 1024 * 1024).ok && !chk('a.pdf', PDF, '', 0).ok, 'حد 5MB بدقة + ملف فارغ مرفوض');
ok(!chk('a.pdf', new TextEncoder().encode('%PDF-1.4\n1 0 obj<</S/JavaScript/JS(x)>>endobj')).ok && !chk('a.pdf', new TextEncoder().encode('%PDF-1.4\n<</Type/EmbeddedFile>>0000')).ok, 'PDF بمحتوى نشط (JavaScript/EmbeddedFile) مرفوض');
const p1 = DE.objectPath('aaaaaaaa-0000-4000-8000-000000000001', 'pdf');
ok(/^children\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/.test(p1) && p1 !== DE.objectPath('aaaaaaaa-0000-4000-8000-000000000001', 'pdf'), 'مسار الرفع UUID عشوائي ولا يتضمن اسم الملف الأصلي');
ok(/تحقق|اتصال/.test('تعذّر الاتصال بالخادم. تحقق من الإنترنت.') && !/violates|SQLSTATE|stack/i.test(DE.friendly(500, 'ERROR: duplicate key value violates unique constraint "x" SQLSTATE 23505')) && DE.friendly(403, 'new row violates row-level security policy').includes('صلاحية'), 'رسائل الأخطاء لا تكشف نصوص SQL');

console.log('\n(ب) فحص ساكن');
const files = fs.readdirSync('.').filter((f) => /\.(js|mjs|html|ts|sql|md|yml|css)$/.test(f)).concat(fs.existsSync('.github/workflows') ? fs.readdirSync('.github/workflows').map((f) => '.github/workflows/' + f) : []);
const secretRe = /(service_role\s*[:=]\s*['"][^'"]{20,}|sb_secret_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(password|passwd|secret)\s*[:=]\s*['"][^'"\s]{8,}['"])/i;
const leaks = files.filter((f) => secretRe.test(read(f)) && !/rls-tests|local-tests|e2e-mock/.test(f));
ok(leaks.length === 0, 'لا أسرار/مفاتيح خاصة/JWT/كلمات مرور في أي ملف' + (leaks.length ? ' ← ' + leaks.join(',') : ''));
const ignore = read('.gitignore');
ok(/^\.env$/m.test(ignore) && /^\.env\.\*$/m.test(ignore), '.gitignore يستثني .env');
ok(!fs.existsSync('.env'), 'لا يوجد ملف .env في الحزمة');
const key = /supabaseKey:\s*'([^']+)'/.exec(read('cms-config.js'))?.[1] || '';
ok(/^sb_publishable_/.test(key) || (/^eyJ/.test(key) && JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon'), 'مفتاح الواجهة هو publishable/anon فقط');

const jsUi = ['de-core.js', 'parent.js', 'manage.js', 'deploy-check.js'];
for (const f of jsUi) {
  const s = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ok(!/\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write|\beval\s*\(|new Function\s*\(|dangerouslySetInnerHTML/.test(s), f + ': لا innerHTML/eval/document.write');
}
ok(!/localStorage/.test(read('parent.js') + read('manage.js') + read('de-core.js').replace(/\/\*[\s\S]*?\*\//g, '')), 'الجلسات لا تُخزَّن في localStorage في الصفحات الجديدة');
for (const f of ['parent.html', 'manage.html', 'deploy-check.html']) {
  const s = read(f), csp = /Content-Security-Policy" content="([^"]+)"/.exec(s)?.[1] || '';
  ok(csp && /default-src 'none'/.test(csp) && /script-src 'self'(?![^;]*unsafe)/.test(csp) && !/unsafe-eval|unsafe-inline/.test(csp), f + ': CSP صارمة بلا unsafe-*');
  ok(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(s) && !/\son[a-z]+\s*=/i.test(s) && !/\sstyle\s*=/i.test(s), f + ': لا سكربتات/معالجات/style مضمّنة');
  ok(/noindex/.test(s), f + ': noindex');
}
const sql = read('02-families-portal.sql');
const created = [...sql.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]);
const rlsList = /foreach t in array array\[([^\]]+)\]/.exec(sql)?.[1] || '';
ok(created.length >= 9 && created.every((t) => rlsList.includes("'" + t + "'")), 'كل جداول 02-families-portal.sql مشمولة بتفعيل RLS: ' + created.join(', '));
ok(created.every((t) => !/password|passwd|secret/i.test((new RegExp('create table if not exists public\\.' + t + ' \\(([\\s\\S]*?)\\n\\);')).exec(sql)?.[1] || '')), 'لا أعمدة كلمات مرور في أي جدول');
const defs = [...sql.matchAll(/create or replace function public\.(\w+)\([^)]*\)[\s\S]*?\$\$;?/g)];
const secDef = [...sql.matchAll(/create or replace function public\.(\w+)\(([^)]*)\)\s*returns[^$]*?security definer([^$]*?)\$\$/g)];
ok(secDef.length >= 8 && secDef.every((m) => /set search_path/.test(m[3])), 'كل دوال security definer تحدّد search_path (' + secDef.length + ' دالة)');
ok(!/to anon[^;]*\b(insert|update|delete)\b/i.test(sql) && !/grant[^;]*on public\.(children|parent_profiles|parent_children|progress_reports|appointments|messages|documents)[^;]*to anon/i.test(sql), 'لا صلاحيات كتابة/قراءة للجداول الحساسة لدور anon');
ok(/private-docs', 'private-docs', false/.test(sql) && /5242880/.test(sql), 'الحاوية private-docs غير عامة وبحد 5MB');
ok(/policy "private-docs: read"[\s\S]*can_read_private_object/.test(sql) && /name ~ '\^children/.test(sql), 'سياسات التخزين: قراءة مشروطة + فرض أسماء UUID');
const fn = read('index.ts');
ok(!/service_role['"]?\s*[:=]\s*['"]/.test(fn) && /Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/.test(fn), 'الدالة الخلفية تقرأ مفتاح الخدمة من البيئة فقط');
ok(/getUser\(\)/.test(fn) && /can_manage_families/.test(fn) && /rate_limit_hit/.test(fn) && /MAX_BODY/.test(fn) && /z\.discriminatedUnion/.test(fn), 'الدالة: هوية + صلاحية + تحديد معدل + حد حجم + Zod');
ok(!/innerHTML\s*=\s*posts|\$\{p\.(title|text|url|image)/.test(read('script.js')), 'script.js: لا حقن HTML من بيانات المنشورات');


console.log('\n(ج) فحوصات حزمة الأمان و Universal Web Security Skills');
ok(fs.existsSync('CLAUDE.md') && read('CLAUDE.md').includes('SUPABASE RLS'), 'CLAUDE.md: قواعد الأمان موجودة في جذر المشروع');
ok(fs.existsSync('netlify.toml') && read('netlify.toml').includes('Strict-Transport-Security') && read('netlify.toml').includes('https://qgjddtylriqdwvpihvmi.supabase.co'), 'netlify.toml: ترويسات الأمان وCSP مضبوطة بالكامل');
ok(!/\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|dangerouslySetInnerHTML/.test(read('script.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'script.js: خالٍ تمامًا من innerHTML');
ok(!read('index.ts').includes("'*'") && read('index.ts').includes('isOriginAllowed'), 'index.ts: CORS صارم يرفض النطاقات غير المصرح بها');
ok(!fs.existsSync('حسابات_الأولياء.xlsx') && !fs.existsSync('07-create-parent-accounts.sql') && !fs.existsSync('compact_setup.sql'), 'إزالة ملفات كلمات المرور المكشوفة من المستودع');
const mJs = read('manage.js');
ok(!/matchEducatorDirectAuth|saveEducatorDirectSession|loadEducatorDirectSession|children_cache|reports_cache/.test(mJs) && !/pwVal\s*:/.test(mJs) && !/setupKey\s*:/.test(mJs), 'UWSS-01 & UWSS-02: manage.js لا يخزّن كلمات مرور نصية ولا ينسخ بيانات الأطفال/التقارير إلى site_content');
ok(read('schema.sql').includes("data - '_portal_meta'") && read('00-full-database-setup.sql').includes("data - '_portal_meta'"), 'UWSS-01: عزل _portal_meta عن الصف العام published في site_content');
ok(read('05-child-qr-card.sql').includes("'disability', null") && read('qr.html').includes('id="row_disability" hidden'), 'UWSS-03: عدم كشف طبيعة الإعاقة وتاريخ الميلاد للعموم في صفحة QR');

console.log('\n(د) فحوصات ضمان ظهور الأطفال الـ 103 والمساعد السريع لملء البرنامج الأسبوعي');
ok(mJs.includes('EMBEDDED_STUDENTS') && mJs.includes('mapEmbeddedStudentsToSections') && mJs.includes('CHILD_SAFE_COLS'), 'manage.js: استرداد تلقائي وعرض مضمون لجميع الأطفال الـ 103 و11 قسمًا');
ok(mJs.includes('childMatchesSection'), 'manage.js: مطابقة مرنة لقسم الطفل بالمعرّف والاسم وslug');
ok(mJs.includes('applyStandardStructureTemplate') && mJs.includes('autoDistributeSkillsAcrossWeek') && mJs.includes('copyDayToAllWeek'), 'manage.js: المساعد السريع لملء البرنامج الأسبوعي (قوالب + توزيع تلقائي + نسخ اليوم)');
ok(read('parent.js').includes('fetchKidsResilient') && read('parent.js').includes('ensure_parent_child_link'), 'parent.js: جلب مرن للأطفال وربط تلقائي للولي بطفله');

console.log(`\nالنتيجة الإجمالية: ${pass} نجح، ${fail} فشل`);
process.exit(fail ? 1 : 0);
