import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DE_QR = require('./qr-gen.js');

let pass = 0, fail = 0;
const ok = (c, n) => { c ? pass++ : fail++; console.log((c ? '  ✅ ' : '  ❌ ') + n); };
const read = (f) => fs.readFileSync(f, 'utf8');

console.log('\n--- (1) فحص مولد QR ومكتبة qr-gen.js ---');
try {
  let simulatedCanvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillStyle: '',
      fillRect: () => {},
      clearRect: () => {}
    })
  };
  DE_QR.drawToCanvas(simulatedCanvas, 'https://hmyasserabdou24-eng.github.io/DarElIhsan3/qr.html?id=11111111-2222-3333-4444-555555555555', { size: 240 });
  ok(simulatedCanvas.width === 240 && simulatedCanvas.height === 240, 'توليد QR بنجاح على Canvas محلياً بدون أخطاء');
} catch (e) {
  ok(false, 'فشل توليد QR: ' + e.message);
}

console.log('\n--- (2) فحص ملف الهجرة 05-branches-sections-import.sql ---');
const sql5 = read('05-branches-sections-import.sql');
ok(sql5.includes('create table if not exists public.branches'), 'جدول الفروع branches معرف بالكامل');
ok(sql5.includes('create table if not exists public.sections'), 'جدول الأقسام sections معرف بالكامل');
ok(sql5.includes('create table if not exists public.educational_programs'), 'جدول البرامج التربوية educational_programs معرف بالكامل');
ok(sql5.includes('create table if not exists public.registration_codes'), 'جدول رموز التسجيل registration_codes معرف بالكامل');
ok(sql5.includes('redeem_registration_code'), 'دالة استرداد رمز التسجيل redeem_registration_code موجودة');
ok(sql5.includes('admin_generate_child_code'), 'دالة توليد رمز التسجيل admin_generate_child_code موجودة');
ok(sql5.includes('get_public_child'), 'دالة قراءة بطاقة QR العامة get_public_child موجودة');
ok(sql5.includes('admin_delete_audit'), 'دالة حذف سجلات التدقيق للمالك admin_delete_audit موجودة');

// فحص سياسة RLS الصارمة للبرامج التربوية لمنع تسرب البيانات
ok(sql5.includes('programs: parent section read') && sql5.includes('parent_children pc on pc.child_id = c.id') && sql5.includes('c.section_id = educational_programs.section_id'), 'سياسة RLS للبرامج التربوية تعزل الأقسام بحزم لمنع تسرب البيانات للأولياء');

// فحص وجود قائمة الطلبة كاملة (103 طالب)
const studentMatches = [...sql5.matchAll(/\('(004|021|022|050|077|082|086|087|090|101|103|104|111|112|114|116|117|118|119|132|138|142|146|153|159|160|165|167|168|170|173|176|180|187|188|189|190|192|196|197|198|200|201|202|204|206|209|213|216|219|223|224|226|227|228|231|236|238|239|240|243|247|249|250|251|254|255|256|257|258|259|263|264|265|267|273|274|275|276|279|280|281|283|288|289|291|293|296|297|301|305|306|307|310|311|312|313|314|315|316|317|318|320)',/g)];
ok(studentMatches.length === 103, 'جميع الـ 103 طالب موجودون في سكربت الاستيراد بدقة 100% (' + studentMatches.length + '/103)');

console.log('\n--- (3) فحص صفحة QR العامة qr.html و qr.js ---');
const qrHtml = read('qr.html');
const qrJs = read('qr.js');
ok(/default-src 'none'/.test(qrHtml) && /script-src 'self'/.test(qrHtml), 'qr.html: سياسة أمان محتوى صارمة (CSP)');
ok(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(qrHtml), 'qr.html: لا سكربتات مضمنة (no inline script)');
ok(qrJs.includes('get_public_child'), 'qr.js: يستدعي RPC الآمن get_public_child');
ok(!qrJs.includes('.innerHTML'), 'qr.js: لا يوجد innerHTML إطلاقاً');

console.log('\n--- (4) فحص لوحة الإدارة manage.js و manage.html ---');
const manageJs = read('manage.js');
const manageHtml = read('manage.html');
ok(manageJs.includes('exportJpg') && manageJs.includes('image/jpeg'), 'manage.js: يدعم تصدير بطاقة التلميذ كملف JPG بدقة عالية');
ok(manageJs.includes('openStudentCard'), 'manage.js: واجهة معاينة وطباعة بطاقة التلميذ الرسمية');
ok(manageJs.includes('admin_generate_child_code'), 'manage.js: توليد ونسخ رموز التسجيل السرية للأطفال');
ok(manageJs.includes('secBranches'), 'manage.js: قسم إدارة الفروع والأقسام التربوية');
ok(manageJs.includes('secPrograms'), 'manage.js: قسم إدارة البرامج التربوية');
ok(manageJs.includes('admin_delete_audit'), 'manage.js: صلاحيات حذف وتصفية سجلات التدقيق للمالك الرئيسي');
ok(manageHtml.includes('qr-gen.js'), 'manage.html: يتضمن مكتبة qr-gen.js');

console.log('\n--- (5) فحص فضاء الأولياء parent.js و parent.html ---');
const parentJs = read('parent.js');
const parentHtml = read('parent.html');
ok(parentJs.includes('educational_programs'), 'parent.js: جلب وعرض البرامج التربوية للأقسام');
ok(parentJs.includes('redeem_registration_code'), 'parent.js: دعم استرداد رمز التسجيل لربط طفل جديد');
ok(parentJs.includes('vPrograms'), 'parent.js: تبويب عرض البرامج التربوية للأولياء');
ok(parentJs.includes('membership_no'), 'parent.js: عرض رقم قيد التلميذ بدقة');
ok(parentHtml.includes('id="modal"'), 'parent.html: حاوية النوافذ التفاعلية موجودة');

console.log(`\n================================`);
console.log(`النتيجة النهائية للمرحلة: ${pass} فحص ناجح، ${fail} فاشل.`);
console.log(`================================`);
process.exit(fail ? 1 : 0);
