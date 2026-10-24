/* لوحة إدارة دار الإحسان المتطورة
   تتضمن:
   1. إدارة الأطفال والطلبة (رقم القيد، تاريخ الميلاد، الإعاقة، الفرع، القسم، المعرف العام)
   2. توليد وتحميل بطاقة التلميذ بصيغة JPG عالية الدقة عبر HTML5 Canvas مع رمز QR للتحقق
   3. إدارة رموز التسجيل السرية أحادية الاستخدام للأولياء (Registration Codes)
   4. إدارة الفروع والأقسام التربوية الرسمية الـ 11
   5. إدارة البرامج التربوية للأقسام مع عزل RLS صارم لمنع تسرب البيانات
   6. إدارة حسابات الأولياء والتقارير والمواعيد والرسائل والوثائق
   7. سجل العمليات والتدقيق مع صلاحيات الحذف والتصفية للمدير العام (is_owner)
   لا innerHTML: حماية تامة من XSS باستخدام DE.h و textContent حصراً. */
(function () {
  'use strict';
  var FILE_BUILD = '2026-10-20.1';
  if (window.top !== window.self) { document.body.textContent = ''; return; }

  var CFG = window.DE_CONFIG || {}, h = DE.h;
  var $ = function (s) { return document.querySelector(s); };
  var C = DE.Client(CFG, 'de_manage_session');

  /* الدليل البيداغوجي الرسمي المعتمد (8 مجالات و195 مهارة) مدمج مباشرة لمنع أي اعتماد على ملفات خارجية */
  var EMBEDDED_CURRICULUM = {"مجال الاستقلالية (الحياة اليومية والعناية بالذات)":["غسل اليدين بالماء بشكل صحيح","غسل اليدين بالماء والصابون بشكل صحيح","غسل الوجه بالماء بشكل صحيح","تجفيف اليدين والوجه باستخدام الفوطة بشكل صحيح","استخدام المنديل بشكل صحيح","تنظيف الأنف","خلع السروال بشكل صحيح","خلع المئزر بشكل صحيح","خلع القميص (فك الأزرار) بشكل صحيح","خلع الجوارب بشكل صحيح","خلع الحذاء بشكل صحيح","لبس السروال بشكل صحيح","لبس المئزر بشكل صحيح","لبس القميص (فك الأزرار) بشكل صحيح","لبس الجوارب بشكل صحيح","لبس الحذاء بشكل صحيح","التعرف على أدوات الأكل (ملعقة، كوب، صحن، شوكة)","مسك أدوات الطعام بشكل صحيح","الشرب بكوب الماء أو العصير بشكل صحيح","الأكل بطريقة صحيحة","طلب الذهاب إلى الحمام عند الحاجة إليه (صورة / كلمة)","التعرف على مكان الحمام","استخدام الحمام باستقلالية","التعرف على أدوات تنظيف الأسنان (المعجون، الفرشاة، الماء)","القيام بتنظيف الأسنان باستقلالية"],"مجال المهارات الحركية الدقيقة":["القبض على الأشياء باستخدام قبضة اليد","الضغط على كرة إسفنجية بقبضة اليد بالتناوب بين اليدين","الضغط على مادة الصلصال","طي أو ثني ورقة عدة مرات بشكل عشوائي","مسك مقبض الباب وتدويره","يستطيع فتح قارورة","التقاط خرز (حجم صغير)","التقاط خرز (حجم كبير)","نقل خمس خرزات (حجم صغير) من صحن لآخر","نقل خمس خرزات (حجم كبير) من صحن لآخر","تقليب صفحات كتاب","ترتيب مجموعة من الأوراق فوق بعضها","تنظيم خمس خرزات (حجم صغير) بخيط","تنظيم خمس خرزات (حجم كبير) بخيط","يستطيع إغلاق قارورة","مسك القلم بشكل صحيح","التلوين بشكل عشوائي على الورقة","التلوين داخل حيز","توصيل خطوط منقطة مرسومة على ورقة بشكل أفقي","توصيل خطوط منقطة مرسومة على ورقة بشكل منحني","مسك المقص بشكل صحيح","قص الورقة بشكل عشوائي","قص الورقة على خطوط مستقيمة عريضة","قص الورقة على خطوط مستقيمة رفيعة","قص الورقة على خطوط منحنية عريضة","قص الورقة على خطوط منحنية رفيعة"],"مجال المهارات الحركية الكبرى":["الوقوف بطريقة صحيحة","الجلوس بطريقة صحيحة","المشي بطريقة صحيحة","الجري بطريقة صحيحة","التدحرج بشكل صحيح","رمي الكرة بطريقة صحيحة","ركل الكرة بطريقة صحيحة","الحجل بطريقة صحيحة","سحب الحبل بطريقة صحيحة","دفع جهاز متحرك لمسافة 2 م بطريقة صحيحة","يرفع ثقل (2 كغم) عن الأرض","يحمل ثقل (2 كغم) لمسافة 10 م","رفع الذراعين، أماماً، عالياً، جانباً بطريقة صحيحة","صعود ونزول السلم (الدرج) بطريقة صحيحة","يثني الجذع أماماً أسفل بطريقة صحيحة (مرونة)","رمي الكرة باتجاه هدف على الحائط من مسافة 2 م بطريقة صحيحة (توازن)","تنطيط الكرة من الثبات خمس مرات (توافق)","يجري بشكل متعرج لمسافة 10 م (رشاقة)","رمي ثقل (1 كغم) لمسافة 5 م (قوة)"],"مجال ما قبل الأكاديمي":["الوصل بين مجموعة عناصر من نفس الفئة","رسم لوحات بسيطة","تسلسل الأرقام والحروف","التعرف على الأشكال","التعرف على الألوان","المطابقة بين الأشياء المتماثلة","المطابقة بين الألوان","المطابقة بين الأشكال","المطابقة بين أنواع الفواكه (البرتقال، الموز، التفاح، العنب، البطيخ)","المطابقة بين أنواع الخضر (طماطم، بطاطا، فلفل..)","مطابقة أعضاء الحواس الخمسة (يد، عين، أذن، لسان، أنف)","المطابقة بين صور الحيوانات الأليفة (جمل، حصان، بقرة، قطة، أرنب، ماعز)","مطابقة فئات النقود الورقية والمعدنية","مطابقة الحروف الهجائية بالبطاقات","أن يكتب خطوطاً مستقيمة عن نموذج (استعداد للكتابة)","أن يكتب خطوطاً منحنية عن نموذج (استعداد للكتابة)","العد بشكل آلي من 1 إلى 10","يشير إلى الأرقام من 1 إلى 10","التعرف على مدلول الأرقام من 1 إلى 10"],"المجال الأكاديمي":["التعرف على أشكال الحروف داخل الكلمة (البداية، الوسط، النهاية)","التعرف إلى أشكال الحروف مع المد بالألف","التعرف إلى أشكال الحروف مع المد بالواو","التعرف إلى أشكال الحروف مع المد بالياء","التعرف إلى أشكال الحروف مع الحركات (الفتحة)","التعرف إلى أشكال الحروف مع الحركات (الضمة)","التعرف إلى أشكال الحروف مع الحركات (الكسرة)","التعرف إلى أشكال الحروف مع الحركات (السكون)","يقرأ كلمة من حرفين","يقرأ كلمة من 3 حروف","يقرأ كلمة من 4 حروف فأكثر","يقرأ جملة من كلمتين","يقرأ جملة من 3 كلمات","يقرأ جملة من 4 كلمات","يقرأ جملة من 5 كلمات فأكثر","يقرأ فقرة من درس مختار","يكتب الحرف فوق نقط","يكتب الحروف عن نموذج","يكتب أشكال حروف داخل الكلمة فوق نقط","يكتب أشكال الحروف داخل الكلمة عن نموذج","يكتب مقاطع عن نموذج","يكتب كلمة من 3 حروف","يكتب كلمة من 4 حروف فأكثر","يكتب جملاً مختارة عن نموذج","التعرف إلى إشارة (+)","التعرف إلى إشارة (-)","التعرف إلى إشارة (=)","التعرف إلى مفهوم الجمع","حل مسائل على الجمع ضمن الرقم 10","التعرف على مفهوم الطرح","حل مسائل على الطرح ضمن الرقم 10","يتعرف الطالب على مفاهيم الأحجام (كبير، صغير)","يصنف أشياء حسب حجمها (كبير، صغير)","يتعرف الطالب على مفاهيم الأطوال (طويل، قصير)","يصنف أشياء حسب طولها (طويل، قصير)","يتعرف الطالب على مفاهيم ظروف المكان (أمام، خلف، فوق، تحت، داخل، خارج)","يتعرف الطالب على مفاهيم ظروف الزمان (صباح، مساء، ليل، نهار، قبل، بعد)","يتعرف الطالب على المفاهيم (حار، بارد)","يتعرف الطالب على المفاهيم (ناعم، خشن)","يطابق الطالب أسماء أيام الأسبوع (بطاقات)","يتعرف الطالب على شكل أيام الأسبوع (بطاقات)","يذكر الطالب أيام الأسبوع بالتدرج (من السبت إلى الجمعة)","يميز الطالب بين اليوم والأمس وغداً","يربط الطالب اليوم مع أيام الأسبوع (معرفة اليوم الراهن)","يطابق الطالب فصول السنة الأربعة","يتعرف الطالب على فصول السنة الأربعة","يميز الطالب فصول السنة الأربعة","يربط الطالب الفصل الحالي مع فصول السنة الأربعة","يطابق الطالب أحرف اسمه بشكل صحيح (بطاقات)","يشير إلى أحرف اسمه بشكل صحيح","يتعرف الطالب على أحرف اسمه بشكل صحيح"],"مجال التقليد":["تقليد التصفيق","تقليد رفع اليدين إلى الأعلى معاً","تقليد ضرب الطاولة باليد","تقليد فتح وغلق اليدين","تشبيك اليدين معاً","الإشارة إلى أجزاء الجسم","رن الجرس باستخدام الأشياء","دحرجة لعبة باستخدام الأشياء","القفز من وضع الوقوف","الجري من وضع الوقوف","الدوران من وضع الوقوف","تقليد عدد تكرار الحركات","تقليد حركات حركية دون مساعدة لفظية","تقليد أصوات بسيطة (تقليد لفظي)","تقليد أصوات أولية للكلمات","تقليد مقاطع صوتية منفصلة","تقليد الكلمات","تقليد العبارات","تقليد تلقائي للكلمات","تقليد تلقائي للعبارات"],"مجال مهارات الحضور والانتباه":["الاستماع لصوت الجرس عند قرعه","الالتفات عند مناداته باسمه","الاتصال البصري أثناء المحادثة","الاتصال البصري أثناء التعليم الجماعي","الاستجابة للتعليمات اللفظية (أمر واحد)","الاستجابة للتعليمات اللفظية (أمران متسلسلان)","الاستجابة للتعليمات اللفظية (أمران غير متسلسلين)","إدارة رأسه من مصدر صوت إلى مصدر آخر","تذكر مكان إخفاء الشيء","متابعة لهب شمعة فترة من الوقت","الجلوس على المقعد بشكل صحيح أثناء أداء المهمة التعليمية"],"مجال التواصل":["يستجيب الطفل عند مناداته باسمه","يصرخ للحصول على ما يريد","يحدث ضجة بدل الكلام","يتكلم كلاماً غير مفهوم","يشير عن بعد إلى الأشياء التي يريدها","يستخدم كلمة واحدة للتعبير عن كلمات أو عبارات","يستجيب للأوامر البسيطة (أمر واحد)","يستجيب للأوامر المتسلسلة (أكثر من أمر)","يوجد لديه مصاداة، يكرر الأصوات أو الكلام كالببغاء","يبدو أنه أصم لا يسمع","يستجيب لأصوات الأشياء المألوفة","يعبر لفظياً عن حاجته للأكل أو الشرب أو استخدام الحمام","يستخدم كلمة (نعم) أو (لا) فقط","يسمي الأشياء المألوفة في البيئة","ينطق كلمة واحدة","ينطق جملة مكونة من كلمتين","ينطق جملة مكونة من ثلاث كلمات أو أكثر","يتلفظ بمقاطع لا معنى لها، أو يتمتم مع نفسه","يسحب الآخرين بيده لجلب شيء","يستجيب للإشارات الإيمائية","يصغي إلى التعليمات اللفظية","يستجيب الطفل للمس الجسدي","يفهم أحرف الجر","يستخدم الضمائر"]};
  window.DE_CURRICULUM = EMBEDDED_CURRICULUM;

  function normAr(s) {
    return String(s || '').toLowerCase()
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/[ى]/g, 'ي')
      .replace(/[ة]/g, 'ه')
      .replace(/[\u064B-\u065F\u0670]/g, '');
  }

  var CENTERS = { main: 'المركز الرئيسي لدار الإحسان', work: 'مركز المساعدة على العمل', farm: 'المزرعة البيداغوجية' };
  var CENTER_OPTS = Object.keys(CENTERS).map(function (k) { return [k, CENTERS[k]]; });

  var S = { sec: 'dash', cache: {}, nav: 0, me: null, isOwner: false, stopIdle: null };

  var TITLES = {
    dash: 'لوحة التحكم',
    children: 'الأطفال والطلبة',
    branches: 'الفروع والأقسام التربوية',
    programs: 'البرامج التربوية للأقسام',
    reports: 'التقارير التربوية',
    appts: 'المواعيد والأنشطة',
    msgs: 'الرسائل والإعلانات',
    docs: 'الوثائق الخاصة',
    accounts: 'حسابات الإدارة',
    audit: 'سجل العمليات والتدقيق',
    settings: 'الأمان والإعدادات'
  };

  var AUDIT = {
    publish: 'نشر محتوى الموقع', load_version: 'تحميل نسخة سابقة', add_user: 'إضافة مدير', update_user: 'تحديث كود مدير', reset_password: 'تغيير كود مدير', remove_user: 'حذف مدير',
    'children:insert': 'إنشاء ملف طفل', 'children:delete': 'حذف ملف طفل', 'parent_profiles:insert': 'إنشاء ملف ولي', 'parent_profiles:delete': 'حذف ملف ولي',
    'parent:disable': 'تعطيل ولي', 'parent:enable': 'تفعيل ولي', 'parent:invite': 'دعوة ولي', 'parent:resend_invite': 'إعادة إرسال دعوة ولي', 'parent:disable_login': 'حظر دخول ولي', 'parent:enable_login': 'رفع حظر ولي',
    'parent_children:insert': 'ربط ولي بطفل', 'parent_children:delete': 'فك ربط ولي بطفل', 'progress_reports:insert': 'إنشاء تقرير', 'progress_reports:delete': 'حذف تقرير',
    'report:publish': 'نشر تقرير', 'report:unpublish': 'إلغاء نشر تقرير', 'appointments:insert': 'إضافة موعد', 'appointments:update': 'تعديل موعد', 'appointments:delete': 'حذف موعد',
    'messages:insert': 'إنشاء رسالة/إعلان', 'messages:delete': 'حذف رسالة/إعلان', 'documents:insert': 'رفع وثيقة', 'documents:delete': 'حذف وثيقة',
    'admin:invite': 'دعوة مدير', 'admin:create': 'إنشاء مدير بكلمة مرور', 'admin:disable': 'تعطيل مدير', 'admin:enable': 'تفعيل مدير',
    'branches:insert': 'إضافة فرع', 'sections:insert': 'إضافة قسم', 'educational_programs:insert': 'إضافة برنامج تربوي',
    'educational_programs:delete': 'حذف برنامج تربوي', 'registration_code:generate': 'توليد رمز تسجيل طفل',
    'parent:redeem_code': 'استرداد رمز تسجيل من ولي', 'audit:delete': 'حذف سجلات التدقيق'
  };

  /* ---------- أدوات المساعدة ---------- */
  function fmt(v, t) { if (!v) return '—'; try { return new Date(v).toLocaleString('ar-DZ-u-nu-latn', t ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }); } catch (e) { return '—'; } }
  function toast(msg, kind) { var t = $('#toast'); t.textContent = msg; t.className = 'toast ' + (kind || ''); t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 4200); }
  function show(id) { ['boot', 'login', 'app'].forEach(function (x) { $('#' + x).hidden = x !== id; }); }
  function msg(el, m) { el.textContent = m || ''; el.hidden = !m; }
  function lock(btn, fn) {
    if (btn.disabled) return Promise.resolve();
    btn.disabled = true;
    return Promise.resolve().then(fn).then(function (r) { btn.disabled = false; return r; }, function (e) { btn.disabled = false; throw e; });
  }
  function act(btn, fn, okMsg) {
    return lock(btn, fn).then(function (r) { if (okMsg) toast(okMsg, 'ok'); return r; }, function (e) { toast(e.message, 'bad'); });
  }
  function bust() { S.cache = {}; }
  function uid(id) { if (!DE.isUuid(id)) throw new Error('معرّف غير صالح.'); return id; }
  function toLocalInput(iso) {
    if (!iso) return ''; var d = new Date(iso), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function isoFromLocal(v) { var d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); }
  function badge(text, kind) { return h('span', { class: 'badge ' + (kind || ''), text: text }); }
  function size(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function readBytes(file) { return file.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }

  /* استعلامات REST */
  var Q = {
    children: function () { return C.rest('GET', '/children?select=*&order=membership_no.asc,full_name.asc'); },
    parents: function () { return C.rest('GET', '/parent_profiles?select=*&order=full_name'); },
    links: function () { return C.rest('GET', '/parent_children?select=parent_id,child_id'); },
    branches: function () { return C.rest('GET', '/branches?select=*&order=name'); },
    sections: function () { return C.rest('GET', '/sections?select=*&order=name'); },
    programs: function () { return C.rest('GET', '/educational_programs?select=*&order=created_at.desc'); },
    codes: function () { return C.rest('GET', '/registration_codes?select=*&order=created_at.desc'); },
    reports: function () { return C.rest('GET', '/progress_reports?select=*&order=report_date.desc'); },
    appts: function () { return C.rest('GET', '/appointments?select=*&order=starts_at.desc'); },
    msgs: function () { return C.rest('GET', '/messages?select=*&order=created_at.desc'); },
    reads: function () { return C.rest('GET', '/message_reads?select=message_id'); },
    docs: function () { return C.rest('GET', '/documents?select=*&order=created_at.desc'); }
  };

  async function get(k) { if (!S.cache[k]) S.cache[k] = await Q[k](); return S.cache[k]; }
  async function getMany() { var r = await Promise.all([].map.call(arguments, get)); return r; }
  function nameOf(list, id, key) { var x = list.filter(function (r) { return (r.id || r.user_id) === id; })[0]; return x ? x[key || 'full_name'] : '—'; }

  /* ---------- نوافذ الحوار ---------- */
  function openModal(card) {
    var m = $('#modal'), c = $('#modalCard'); c.textContent = ''; c.appendChild(card); m.hidden = false; document.body.style.overflow = 'hidden';
    var first = c.querySelector('input,select,textarea,button'); if (first) first.focus();
  }
  function closeModal() { $('#modal').hidden = true; $('#modalCard').textContent = ''; document.body.style.overflow = ''; }
  function ask(o) {
    return new Promise(function (res) {
      var done = function (v) { closeModal(); res(v); };
      openModal(h('div', { class: 'modal-body' }, h('h2', { text: o.title }), h('p', { text: o.msg || '' }),
        h('div', { class: 'modal-actions' },
          h('button', { class: 'btn light', type: 'button', text: 'تراجع', onclick: function () { done(false); } }),
          h('button', { class: 'btn' + (o.danger ? ' danger' : ''), type: 'button', text: o.ok || 'تأكيد', onclick: function () { done(true); } }))));
    });
  }
  function info(title, node) {
    openModal(h('div', { class: 'modal-body' }, h('h2', { text: title }), node, h('div', { class: 'modal-actions' }, h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }))));
  }

  /* نماذج الإدخال العامة */
  function fieldEl(f, val) {
    var id = 'f_' + f.k, input, getv;
    var hint = h('small', { class: 'hint', text: f.hint || '' });
    if (f.type === 'textarea') {
      input = h('textarea', { id: id, maxlength: f.max || 2000, rows: 4 }); input.value = val || '';
      getv = function () { return DE.clean(input.value, f.max || 2000); };
    } else if (f.type === 'select') {
      var allOpts = (f.opts || []).slice();
      input = h('select', { id: id }, h('option', { value: '', text: '— اختر —' }), allOpts.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
      input.value = val == null ? '' : val; getv = function () { return input.value; };
      var searchIn = null;
      if (f.searchable) {
        searchIn = h('input', { type: 'search', class: 'fld-search', placeholder: '🔍 بحث سريع في القائمة...', autocomplete: 'off' });
        searchIn.addEventListener('input', function () {
          var q = normAr(searchIn.value.trim());
          var curVal = input.value;
          var opts = f.opts || allOpts;
          while (input.firstChild) input.removeChild(input.firstChild);
          input.appendChild(h('option', { value: '', text: '— اختر —' }));
          opts.forEach(function (o) {
            if (!q || normAr(o[1]).indexOf(q) >= 0 || normAr(o[0]).indexOf(q) >= 0) {
              input.appendChild(h('option', { value: o[0], text: o[1] }));
            }
          });
          if (curVal && opts.some(function (o) { return o[0] === curVal; })) input.value = curVal;
        });
      }
    } else if (f.type === 'checkbox') {
      input = h('input', { id: id, type: 'checkbox' }); input.checked = !!val;
      getv = function () { return input.checked; };
    } else if (f.type === 'multi') {
      var set = {}; (val || []).forEach(function (x) { set[x] = true; });
      var boxes = (f.opts || []).map(function (o) { var cb = h('input', { type: 'checkbox', value: o[0] }); cb.checked = !!set[o[0]]; return { cb: cb, label: h('label', { class: 'chk' }, cb, o[1]) }; });
      input = h('div', { class: 'multi', id: id }, boxes.map(function (b) { return b.label; }));
      if (!boxes.length) input.appendChild(h('span', { class: 'muted small', text: 'لا توجد خيارات.' }));
      getv = function () { return boxes.filter(function (b) { return b.cb.checked; }).map(function (b) { return b.cb.value; }); };
    } else if (f.type === 'file') {
      input = h('input', { id: id, type: 'file', accept: f.accept || '' });
      getv = function () { return input.files && input.files[0] || null; };
    } else {
      var t = f.type === 'datetime' ? 'datetime-local' : (f.type === 'date' ? 'date' : f.type || 'text');
      input = h('input', { id: id, type: t, maxlength: f.max || 200, dir: (t === 'email' || t === 'tel') ? 'ltr' : null, autocomplete: 'off' });
      input.value = val || '';
      getv = function () { return t === 'datetime' ? isoFromLocal(input.value) : DE.clean(input.value, f.max || 200); };
    }
    var genBtn = null;
    if (f.gen) {
      genBtn = h('button', { class: 'btn light small', type: 'button', text: 'توليد كود قوي', onclick: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        input.value = f.gen(); input.dispatchEvent(new Event('input', { bubbles: true }));
      } });
    }
    var row = h('label', { class: 'fld', for: id }, h('span', { text: f.label + (f.req ? ' *' : '') }), searchIn, input, genBtn, f.hint ? hint : null);
    return { row: row, input: input, get: getv, def: f };
  }

  function openForm(cfg) {
    var vals = cfg.values || {};
    var pairs = cfg.fields.map(function (f) {
      var v = vals[f.k];
      if (f.type === 'datetime' && v) v = toLocalInput(v);
      return fieldEl(f, v);
    });
    var noteEls = { pick: h('div', { class: 'form-note muted small' }), file: h('div', { class: 'form-note small' }) };
    var byKey = {}; pairs.forEach(function (p) { byKey[p.def.k] = p; });
    var api = {
      input: function (k) { return byKey[k] ? byKey[k].input : null; },
      setOpts: function (k, opts) {
        var p = byKey[k]; if (!p) return;
        var sel = p.input; if (!sel) return;
        p.def.opts = (opts || []).slice();
        var parentLabel = sel.parentElement;
        var sIn = parentLabel ? parentLabel.querySelector('.fld-search') : null;
        if (sIn) sIn.value = '';
        var keep = sel.value;
        while (sel.firstChild) sel.removeChild(sel.firstChild);
        sel.appendChild(h('option', { value: '', text: '— اختر —' }));
        (opts || []).forEach(function (o) { sel.appendChild(h('option', { value: o[0], text: o[1] })); });
        sel.value = (opts || []).some(function (o) { return o[0] === keep; }) ? keep : '';
      },
      note: function (slot, content) {
        var el = noteEls[slot]; while (el.firstChild) el.removeChild(el.firstChild);
        if (typeof content === 'string') el.textContent = content; else if (content) el.appendChild(content);
        el.hidden = !el.firstChild;
      },
      refresh: function () { syncVisibility('file'); }
    };
    function syncVisibility(changed) {
      var cur = {}; pairs.forEach(function (p) { cur[p.def.k] = p.get(); });
      pairs.forEach(function (p) { if (p.def.showIf) p.row.hidden = !p.def.showIf(cur); });
      if (cfg.onChange) cfg.onChange(changed, cur, api);
    }
    pairs.forEach(function (p) {
      var k = p.def.k;
      p.input.addEventListener('change', function () { syncVisibility(k); });
      p.input.addEventListener('input', function () { syncVisibility(k); });
    });
    syncVisibility(null);

    var errEl = h('p', { class: 'err', role: 'alert' }); errEl.hidden = true;
    var submits = cfg.submits || [{ key: 'save', label: 'حفظ' }];
    var btns = submits.map(function (s) {
      var b = h('button', { class: 'btn' + (s.danger ? ' danger' : s.light ? ' light' : ''), type: 'button', text: s.label });
      b.addEventListener('click', function () {
        act(b, async function () {
          msg(errEl, '');
          var data = {};
          for (var i = 0; i < pairs.length; i++) {
            var p = pairs[i], f = p.def;
            if (f.showIf && p.row.hidden) continue;
            var v = p.get();
            if (f.req && (v === '' || v === null || (Array.isArray(v) && !v.length))) throw new Error('يرجى ملء الحقل المطلوب: ' + f.label);
            if (f.kind === 'email' && v && !DE.isEmail(v)) throw new Error('البريد الإلكتروني غير صحيح.');
            if (f.kind === 'phone' && v && !DE.isPhone(v)) throw new Error('رقم الهاتف غير صحيح.');
            data[f.k] = v;
          }
          await cfg.onSubmit(data, s.key);
          closeModal();
        });
      });
      return b;
    });

    var card = h('div', { class: 'modal-body' },
      h('h2', { text: cfg.title }),
      pairs.map(function (p) { return p.row; }),
      noteEls.pick, noteEls.file,
      errEl,
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn light', type: 'button', text: 'إلغاء', onclick: closeModal }),
        btns
      )
    );
    openModal(card);
  }

  /* قوائم العرض والجداول المتجاوبة
     o.sheet: وضع «الجدول الإلكتروني» — رأس ثابت أثناء التمرير، فرز بالنقر على العمود،
              وتمرير أفقي على الهاتف والحاسوب معًا (بدون تحويل الجدول إلى بطاقات).
     o.details(r): محتوى يُظهره أو يُخفيه زر مستقل لكل سجل.
     o.exportXlsx: { file, sheet, widths, cols:[{label, value(r)}] } لتصدير السجلات المعروضة فقط بصيغة XLSX. */
  function listView(v, o) {
    var searchVal = '', curFilters = {}, sortIdx = -1, sortDir = 1, openRows = {}, visible = [];
    var bar = h('div', { class: 'bar-sub' }, h('h2', { text: o.title }));
    var barBtns = h('div', { class: 'row-actions' });
    if (o.exportXlsx) barBtns.appendChild(h('button', { class: 'btn small light', type: 'button', text: '📊 تصدير Excel (XLSX)', onclick: exportNow }));
    (o.extra || []).forEach(function (x) { barBtns.appendChild(h('button', { class: 'btn light', type: 'button', text: x.label, onclick: x.onclick })); });
    if (o.addLabel && o.onAdd) barBtns.appendChild(h('button', { class: 'btn', type: 'button', text: o.addLabel, onclick: o.onAdd }));
    bar.appendChild(barBtns);
    v.appendChild(bar);

    var fwrap = h('div', { class: 'filter-bar' });
    if (o.search) {
      var sIn = h('input', { type: 'search', placeholder: o.searchPlaceholder || 'بحث بالاسم، رقم القيد، أو القسم…', 'aria-label': 'بحث' });
      sIn.addEventListener('input', function () { searchVal = DE.clean(sIn.value, 80).toLowerCase(); render(); });
      fwrap.appendChild(sIn);
    }
    (o.filters || []).forEach(function (f, idx) {
      var sel = h('select', { 'aria-label': f.label }, h('option', { value: '', text: '— كل ' + f.label + ' —' }), f.opts.map(function (op) { return h('option', { value: op[0], text: op[1] }); }));
      sel.addEventListener('change', function () { curFilters[idx] = sel.value; render(); });
      fwrap.appendChild(sel);
    });
    if (o.search || (o.filters && o.filters.length)) v.appendChild(fwrap);

    var countBadge = h('div', { class: 'muted small', style: 'margin-bottom:8px;' });
    v.appendChild(countBadge);

    var listBox = h('div');
    v.appendChild(listBox);

    function filtered() {
      return (o.rows || []).filter(function (r) {
        if (searchVal && o.search && (o.search(r) || '').toLowerCase().indexOf(searchVal) === -1) return false;
        for (var k in curFilters) {
          var val = curFilters[k];
          if (val !== '' && o.filters[k] && !o.filters[k].test(r, val)) return false;
        }
        return true;
      });
    }

    function sortList(list) {
      if (sortIdx < 0 || !o.cols[sortIdx] || typeof o.cols[sortIdx].sort !== 'function') return list;
      var key = o.cols[sortIdx].sort;
      return list.slice().sort(function (a, b) {
        var x = key(a), y = key(b);
        if (x == null) x = ''; if (y == null) y = '';
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * sortDir;
        return String(x).localeCompare(String(y), 'ar', { numeric: true, sensitivity: 'base' }) * sortDir;
      });
    }

    function render() {
      var prevWrap = listBox.querySelector('.table-wrap');
      var pos = prevWrap ? [prevWrap.scrollTop, prevWrap.scrollLeft] : null;
      listBox.textContent = '';

      var list = sortList(filtered());
      visible = list;
      countBadge.textContent = 'إجمالي السجلات المعروضة: ' + list.length + ' من ' + (o.rows ? o.rows.length : 0);

      if (!list.length) {
        listBox.appendChild(h('div', { class: 'empty', text: o.empty || 'لا توجد عناصر مطابقة.' }));
        return;
      }

      var hasActs = !!(o.actions || o.details);
      var headRow = h('tr');
      o.cols.forEach(function (c, ci) {
        var sortable = typeof c.sort === 'function';
        var label = c.label + (sortable && sortIdx === ci ? (sortDir > 0 ? ' ▲' : ' ▼') : '');
        var th = h('th', { text: label, class: sortable ? 'sortable' : null, title: sortable ? 'اضغط للفرز' : null });
        if (sortable) {
          th.setAttribute('aria-sort', sortIdx === ci ? (sortDir > 0 ? 'ascending' : 'descending') : 'none');
          th.addEventListener('click', function () {
            if (sortIdx === ci) sortDir = -sortDir; else { sortIdx = ci; sortDir = 1; }
            render();
          });
        }
        headRow.appendChild(th);
      });
      if (hasActs) headRow.appendChild(h('th', { text: 'الإجراءات' }));
      var table = h('table', { class: 'tbl' + (o.sheet ? ' tbl-sheet' : '') },
        h('thead', {}, headRow));
      var tbody = h('tbody');

      list.forEach(function (r) {
        var tr = h('tr');
        o.cols.forEach(function (c) {
          var val = c.get(r);
          var td = h('td', { 'data-label': c.label });
          if (val instanceof Node) td.appendChild(val); else td.textContent = val == null ? '—' : String(val);
          tr.appendChild(td);
        });
        if (hasActs) {
          var acts = [];
          if (o.details) {
            var open = !!openRows[r.id];
            acts.push(h('button', {
              class: 'btn small ' + (open ? 'gold' : 'light'), type: 'button',
              text: open ? '🙈 إخفاء التفاصيل' : '👁 عرض التفاصيل',
              'aria-expanded': open ? 'true' : 'false',
              onclick: function () { openRows[r.id] = !open; render(); }
            }));
          }
          if (o.actions) acts = acts.concat(o.actions(r) || []);
          tr.appendChild(h('td', { class: 'actions-cell' }, acts.filter(Boolean)));
        }
        tbody.appendChild(tr);
        if (o.details && openRows[r.id]) {
          tbody.appendChild(h('tr', { class: 'detail-row' },
            h('td', { colspan: String(o.cols.length + (hasActs ? 1 : 0)) }, o.details(r))));
        }
      });

      table.appendChild(tbody);
      var wrap = h('div', { class: 'table-wrap' + (o.sheet ? ' sheet-wrap' : '') }, table);
      listBox.appendChild(wrap);
      if (pos) { wrap.scrollTop = pos[0]; wrap.scrollLeft = pos[1]; }
    }

    function exportNow() {
      var x = o.exportXlsx;
      if (!x || !visible.length) return toast('لا توجد سجلات معروضة للتصدير.', 'bad');
      if (!window.DE_XLSX) return toast('مكتبة التصدير غير محمّلة. حدّث الصفحة.', 'bad');
      var headers = x.cols.map(function (c) { return c.label; });
      var rows = visible.map(function (r) {
        return x.cols.map(function (c) { var val = c.value(r); return val == null ? '' : String(val); });
      });
      var stamp = new Date().toISOString().slice(0, 10);
      DE_XLSX.download(x.file + '_' + stamp + '.xlsx', x.sheet || 'Sheet1', headers, rows, x.widths);
      toast('تم تصدير ' + rows.length + ' سجل إلى ملف Excel (XLSX).', 'ok');
    }

    render();
  }

  function rbtn(label, fn, kind) {
    var b = h('button', { class: 'btn small ' + (kind || 'light'), type: 'button', text: label });
    b.addEventListener('click', function () { act(b, fn); });
    return b;
  }

  /* فحص ورفع الملفات */
  async function uploadChecked(file, childId) {
    if (!file) throw new Error('اختر ملفًا.');
    if (file.size > 5242880) throw new Error('حجم الملف يتجاوز 5 ميغابايت.');
    var bytes = await readBytes(file);
    var head = Array.from(bytes.slice(0, 8)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    var mime = null, ext = null;
    if (head.startsWith('25504446')) { mime = 'application/pdf'; ext = 'pdf'; }
    else if (head.startsWith('ffd8ff')) { mime = 'image/jpeg'; ext = 'jpg'; }
    else if (head.startsWith('89504e47')) { mime = 'image/png'; ext = 'png'; }
    else if (head.startsWith('52494646') && bytes.length > 12 && String.fromCharCode.apply(null, bytes.slice(8, 12)) === 'WEBP') { mime = 'image/webp'; ext = 'webp'; }
    if (!mime) throw new Error('نوع الملف غير مدعوم. المسموح: PDF, JPG, PNG, WebP فقط.');

    var path = 'children/' + uid(childId) + '/' + crypto.randomUUID() + '.' + ext;
    await C.upload('private-docs', path, bytes, mime);
    return { path: path, mime: mime, size: file.size };
  }

  /* =====================================================================
     1. لوحة التحكم والإحصاءات الحية (Dashboard)
     ===================================================================== */
  async function secDash(v) {
    var c = await C.rpc('admin_family_counts');
    var items = [
      ['children', 'أطفال نشطون بالمركز'],
      ['children_all', 'إجمالي الطلبة بالقائمة'],
      ['reports_published', 'تقارير تربوية معتمدة'],
      ['reports_draft', 'مسودات تقارير قيد المراجعة'],
      ['appointments_upcoming', 'مواعيد وأنشطة قادمة'],
      ['messages_published', 'إعلانات ورسائل منشورة'],
      ['documents_total', 'إجمالي الوثائق والملفات الرسمية']
    ];
    v.appendChild(h('div', { class: 'stats' }, items.map(function (i) {
      return h('div', { class: 'stat' },
        h('b', { text: String(c[i[0]] == null ? 0 : c[i[0]]) }),
        h('span', { text: i[1] })
      );
    })));

    v.appendChild(h('div', { class: 'card' },
      h('h2', { text: 'منظومة إدارة دار الإحسان — روابط سريعة' }),
      h('p', { class: 'muted', text: 'الإحصاءات دقيقة ومستخرجة مباشرة من قاعدة بيانات Supabase. اختر قسماً للبدء:' }),
      h('div', { class: 'row-actions' }, [
        ['children', 'قائمة الطلبة والبطاقات'],
        ['branches', 'الفروع والأقسام الرسمية'],
        ['programs', 'البرامج التربوية للأقسام'],
        ['reports', 'التقارير والمتابعة'],
        ['appts', 'المواعيد والأنشطة'],
        ['audit', 'سجل العمليات والتدقيق']
      ].map(function (x) {
        return h('button', { class: 'btn small', type: 'button', text: x[1], onclick: function () { go(x[0]); } });
      }))
    ));
  }

  /* =====================================================================
     2. إدارة الأطفال والطلبة + بطاقة الانخراط الرسمية + رمز التسجيل
     ===================================================================== */
  async function secChildren(v) {
    var d = await getMany('children', 'branches', 'sections', 'codes');
    var rows = d[0], branches = d[1], sections = d[2], codes = d[3];

    var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
    var secOpts = sections.map(function (s) { return [s.id, s.name]; });

    function getCodeForChild(childId) {
      var active = codes.filter(function (c) { return c.child_id === childId && !c.used_at && new Date(c.expires_at) > new Date(); })[0];
      return active ? active.code : null;
    }

    function editChild(c) {
      return openForm({
        title: c ? 'تعديل بيانات تلميذ' : 'إضافة تلميذ جديد إلى المركز',
        values: c ? Object.assign({}, c, { created_at: c.created_at ? String(c.created_at).slice(0, 10) : '' }) : { active: true, academic_year: '2026-2027' },
        fields: [
          { k: 'membership_no', label: 'رقم القيد / العضوية (مثال: 004، 082)', max: 20, hint: 'الرقم المعتمد بالقائمة الرسمية (مع الحفاظ على الأصفار الأولى).' },
          { k: 'full_name', label: 'اسم ولقب التلميذ(ة)', req: true, min: 2, max: 120 },
          { k: 'dob', label: 'تاريخ الميلاد', type: 'date', hint: 'تاريخ الميلاد الرسمي للطفل' },
          { k: 'disability', label: 'طبيعة الإعاقة', max: 120, hint: 'مثال: التأخر الذهني R.M، اضطراب طيف التوحد TSA، متلازمة داون T.21' },
          { k: 'phone', label: 'رقم هاتف الاتصال', type: 'tel', kind: 'phone', max: 25 },
          { k: 'branch_id', label: 'الفرع / المركز', type: 'select', opts: branchOpts },
          { k: 'section_id', label: 'الفوج / القسم التربوي', type: 'select', opts: secOpts },
          { k: 'academic_year', label: 'الموسم الدراسي', max: 20, hint: 'افتراضي: 2026-2027' },
          { k: 'basic_info', label: 'معلومات وتوجيهات خاصة بالولي', type: 'textarea', max: 1000 },
          { k: 'created_at', label: 'تاريخ إنشاء الملف', type: 'date', hint: 'يمكن تعديله عند الحاجة (مثلًا لتصحيح تاريخ إدخال قديم).' },
          { k: 'active', label: 'الملف نشط (إلغاء التحديد يؤرشف الملف)', type: 'checkbox' }
        ],
        onSubmit: async function (x) {
          var branchName = nameOf(branches, x.branch_id, 'name');
          var secName = nameOf(sections, x.section_id, 'name');
          var centerKey = 'main';
          if (branchName.indexOf('المساعدة') >= 0 || branchName.indexOf('التمهين') >= 0) centerKey = 'work';
          else if (branchName.indexOf('المزرعة') >= 0 || branchName.indexOf('البستنة') >= 0) centerKey = 'farm';

          var body = {
            membership_no: x.membership_no || null,
            full_name: x.full_name,
            dob: x.dob || null,
            disability: x.disability || null,
            phone: x.phone || null,
            branch_id: x.branch_id || null,
            section_id: x.section_id || null,
            section: secName || null,
            center: centerKey,
            academic_year: x.academic_year || '2026-2027',
            basic_info: x.basic_info || null,
            active: !!x.active
          };
          if (x.created_at) body.created_at = x.created_at + 'T12:00:00Z';

          if (c) {
            await C.rest('PATCH', '/children?id=eq.' + uid(c.id), body);
          } else {
            await C.rest('POST', '/children', body);
          }
          bust();
          toast('تم حفظ ملف التلميذ بنجاح.', 'ok');
          go('children');
        }
      });
    }

    /* رابط صفحة التلميذ العامة: يُبنى من عنوان الموقع المنشور نفسه (GitHub Pages أو النطاق)،
       ويحمل الرمز السري لبطاقة الطفل فقط، دون أي معرّف داخلي أو بيانات شخصية */
    function publicCardUrl(token) {
      if (!/^[0-9a-f]{32}$/.test(String(token || ''))) throw new Error('رمز QR غير موجود لهذا الطفل. أعد تحميل القائمة.');
      var u = new URL('qr.html', window.location.href);
      u.search = ''; u.hash = '';
      u.searchParams.set('c', token);
      if (u.protocol !== 'https:') throw new Error('الموقع غير منشور عبر HTTPS؛ لا يمكن إنشاء رمز QR قابل للمسح. انشر الموقع أولًا.');
      if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(u.hostname)) throw new Error('رابط QR محلي؛ انشر الموقع أولًا.');
      return u.href;
    }

    /* بطاقة الانخراط: معاينة + تنزيل PDF + طباعة + فتح صفحة التلميذ (كلها من الرابط نفسه المشفَّر في QR) */
    function openStudentCard(child) {
      var status = h('p', { class: 'muted small', text: 'جارٍ إنشاء البطاقة…' });
      var preview = h('img', { class: 'card-preview', alt: 'معاينة بطاقة انخراط التلميذ ' + (child.full_name || ''), hidden: true });
      var jpgBtn = h('button', { class: 'btn gold', type: 'button', text: '🖼️ تنزيل JPG', disabled: true });
      var printBtn = h('button', { class: 'btn', type: 'button', text: '🖨️ طباعة البطاقة', disabled: true });
      var openLink = h('a', { class: 'btn light', target: '_blank', rel: 'noopener', text: '🔗 فتح صفحة التلميذ' });
      var warn = !child.membership_no ? h('p', { class: 'err small', text: 'تنبيه: لا يوجد رقم قيد رسمي لهذا الطفل؛ أكمله في ملف الطفل قبل طباعة البطاقة.' }) : null;

      openModal(h('div', { class: 'modal-body card-modal' },
        h('h2', { text: 'بطاقة انخراط التلميذ' }),
        warn,
        preview,
        status,
        h('div', { class: 'modal-actions', style: 'margin-top:12px;' },
          h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }),
          openLink, jpgBtn, printBtn)
      ));

      var url;
      try { url = publicCardUrl(child.qr_token); }
      catch (e) { status.textContent = e.message; status.className = 'err small'; return; }
      openLink.setAttribute('href', url);

      var card = null;
      DECARD.render({ full_name: child.full_name, membership_no: child.membership_no, dob: child.dob, center: child.center, url: url })
        .then(function (c) {
          card = c;
          preview.src = c.url; preview.hidden = false;
          status.textContent = 'رمز QR يفتح: صفحة التلميذ العامة (بدون بيانات حساسة).';
          jpgBtn.disabled = false; printBtn.disabled = false;
        })
        .catch(function (e) { status.textContent = e.message; status.className = 'err small'; });

      function exportJpg(c, filename) {
        // exportJpg (image/jpeg)
        DECARD.download(c.jpeg, filename);
      }
      jpgBtn.addEventListener('click', function () {
        if (!card) return;
        var safe = String(child.full_name || 'تلميذ').replace(/\s+/g, '_');
        exportJpg(card, 'بطاقة_انخراط_' + (child.membership_no || child.id) + '_' + safe + '.jpg');
        toast('تم تنزيل صورة البطاقة بصيغة JPG.', 'ok');
      });

      printBtn.addEventListener('click', function () {
        if (!card) return;
        DECARD.print(card.url).catch(function (e) { toast(e.message, 'bad'); });
      });
    }

    /* توليد أو نسخ رمز التسجيل للطفل */
    async function manageChildCode(child) {
      var activeCode = getCodeForChild(child.id);
      if (activeCode) {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(activeCode);
          toast('تم نسخ رمز التسجيل السري للطفل (' + activeCode + ')', 'ok');
        } else {
          info('رمز تسجيل الطفل', h('div', null,
            h('p', { text: 'رمز التسجيل السري أحادي الاستخدام الخاص بالطفل: ' + child.full_name }),
            h('div', { class: 'link-box', text: activeCode })
          ));
        }
      } else {
        var code = await C.rpc('admin_generate_child_code', { p_child_id: uid(child.id) });
        bust();
        toast('تم توليد رمز تسجيل جديد بنجاح: ' + code, 'ok');
        go('children');
      }
    }

    listView(v, {
      title: 'قائمة الطلبة والأطفال (الموسم 2026–2027)',
      addLabel: '➕ إضافة طالب جديد',
      onAdd: function () { editChild(null); },
      rows: rows,
      sheet: true,
      searchPlaceholder: 'بحث بالاسم، رقم القيد، الفرع، أو القسم…',
      empty: 'لا توجد بيانات مسجلة للأطفال.',
      search: function (r) {
        return [r.membership_no, r.full_name, nameOf(branches, r.branch_id, 'name'), nameOf(sections, r.section_id, 'name'), r.section, r.disability]
          .filter(Boolean).join(' ');
      },
      details: function (r) {
        var items = [
          ['تاريخ الميلاد', r.dob ? fmt(r.dob) : '—'],
          ['رقم هاتف الاتصال', r.phone || '—'],
          ['طبيعة الإعاقة', r.disability || '—'],
          ['الموسم الدراسي', r.academic_year || '—'],
          ['تاريخ إنشاء الملف', fmt(r.created_at)],
          ['معلومات وتوجيهات خاصة بالولي', r.basic_info || '—', true]
        ];
        return h('div', { class: 'child-details' }, items.map(function (it) {
          return h('div', { class: 'cd-item' + (it[2] ? ' wide' : '') }, h('span', { text: it[0] }), h('b', { text: it[1] }));
        }));
      },
      exportXlsx: {
        file: 'قائمة_الأطفال_دار_الإحسان',
        sheet: 'الأطفال',
        widths: [14, 30, 14, 30, 30, 28, 18, 16, 12, 40],
        cols: [
          { label: 'رقم القيد', value: function (r) { return r.membership_no || ''; } },
          { label: 'اسم ولقب التلميذ', value: function (r) { return r.full_name || ''; } },
          { label: 'تاريخ الميلاد', value: function (r) { return r.dob || ''; } },
          { label: 'الفرع', value: function (r) { return nameOf(branches, r.branch_id, 'name') || CENTERS[r.center] || ''; } },
          { label: 'الفوج / القسم', value: function (r) { return nameOf(sections, r.section_id, 'name') || r.section || ''; } },
          { label: 'طبيعة الإعاقة', value: function (r) { return r.disability || ''; } },
          { label: 'رقم الهاتف', value: function (r) { return r.phone || ''; } },
          { label: 'الموسم الدراسي', value: function (r) { return r.academic_year || ''; } },
          { label: 'الحالة', value: function (r) { return r.active ? 'نشط' : 'مؤرشف'; } },
          { label: 'توجيهات الولي', value: function (r) { return r.basic_info || ''; } }
        ]
      },
      filters: [
        { label: 'الفرع', opts: branchOpts, test: function (r, x) { return r.branch_id === x; } },
        { label: 'القسم', opts: secOpts, test: function (r, x) { return r.section_id === x; } },
        { label: 'الحالة', opts: [['1', 'نشط'], ['0', 'مؤرشف']], test: function (r, x) { return String(+r.active) === x; } }
      ],
      cols: [
        {
          label: 'رقم القيد',
          get: function (r) {
            return h('span', { class: 'sic-num', text: r.membership_no ? ('N° ' + r.membership_no) : '—' });
          },
          sort: function (r) { return r.membership_no || ''; }
        },
        { label: 'اسم ولقب التلميذ', get: function (r) { return r.full_name; }, sort: function (r) { return r.full_name; } },
        { label: 'تاريخ الميلاد', get: function (r) { return r.dob ? fmt(r.dob) : '—'; }, sort: function (r) { return r.dob; } },
        { label: 'الفرع', get: function (r) { return nameOf(branches, r.branch_id, 'name') || CENTERS[r.center] || '—'; }, sort: function (r) { return nameOf(branches, r.branch_id, 'name') || CENTERS[r.center] || ''; } },
        { label: 'الفوج / القسم', get: function (r) { return nameOf(sections, r.section_id, 'name') || r.section || '—'; }, sort: function (r) { return nameOf(sections, r.section_id, 'name') || r.section || ''; } },
        { label: 'الإعاقة', get: function (r) { return r.disability || '—'; }, sort: function (r) { return r.disability || ''; } },
        { label: 'الحالة', get: function (r) { return badge(r.active ? 'نشط' : 'مؤرشف', r.active ? 'ok' : 'gray'); }, sort: function (r) { return r.active ? 1 : 0; } }
      ],
      actions: function (r) {
        return [
          rbtn('🪪 البطاقة', function () { openStudentCard(r); }, 'gold'),
          rbtn('تعديل', function () { editChild(r); }),
          rbtn(r.active ? 'أرشفة' : 'استعادة', async function () {
            await C.rest('PATCH', '/children?id=eq.' + uid(r.id), { active: !r.active });
            bust(); toast(r.active ? 'تم نقل الملف إلى الأرشيف.' : 'تمت استعادة الملف إلى الحالة النشطة.', 'ok');
            go('children');
          }, r.active ? 'light' : 'gold'),
          rbtn('حذف', async function () {
            if (!(await ask({
              title: 'تنبيه بشأن حذف ملف الطالب',
              msg: 'سيُحذف الملف وروابطه نهائيًا. وفق سياسة المركز: يُفضَّل دائمًا «أرشفة الملف» بدلًا من حذفه للحفاظ على السجلات التاريخية. هل تريد الحذف النهائي رغم ذلك؟',
              ok: 'حذف نهائي', danger: true
            }))) return;
            await C.rest('DELETE', '/children?id=eq.' + uid(r.id));
            bust(); toast('تم حذف الملف.', 'ok'); go('children');
          }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     3. إدارة الفروع والأقسام التربوية (Branches & Sections)
     ===================================================================== */
  async function secBranches(v) {
    var d;
    try {
      d = await getMany('branches', 'sections', 'children');
    } catch (e) {
      var is404 = (e.status === 404) || (e.message && (e.message.indexOf('404') >= 0 || e.message.indexOf('Not Found') >= 0 || e.message.indexOf('relation') >= 0));
      if (is404) {
        v.appendChild(h('div', { class: 'card' },
          h('h2', { text: '⚠️ يجب تنفيذ ترقية قاعدة البيانات أولاً' }),
          h('p', { text: 'جداول الفروع والأقسام غير موجودة في قاعدة البيانات بعد.' }),
          h('p', { class: 'muted', text: 'لإصلاح هذا: في Supabase Dashboard → SQL Editor، شغّل محتوى ملف 05-branches-sections-import.sql الموجود في مجلد المشروع.' }),
          h('p', { class: 'muted small', text: 'بعد تنفيذ السكريبت، أعد تشغيل PostgREST عبر إرسال الأمر: notify pgrst, \'reload schema\';' })
        ));
        return;
      }
      throw e;
    }
    var branches = d[0], sections = d[1], kids = d[2];

    function kidsCountInBranch(bid) { return kids.filter(function (k) { return k.branch_id === bid && k.active; }).length; }
    function kidsCountInSection(sid) { return kids.filter(function (k) { return k.section_id === sid && k.active; }).length; }

    function addSection() {
      var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
      return openForm({
        title: 'إضافة قسم / فوج تربوي جديد',
        fields: [
          { k: 'branch_id', label: 'الفرع التابع له', type: 'select', opts: branchOpts, req: true },
          { k: 'name', label: 'اسم القسم / الفوج', req: true, min: 2, max: 80 },
          { k: 'slug', label: 'المعرّف التقني (Slug)', req: true, min: 2, max: 40, hint: 'أحرف إنجليزية وأرقام وشرطة فقط (مثال: sec_autism_4)' },
          { k: 'description', label: 'وصف القسم وأهدافه', type: 'textarea', max: 500 }
        ],
        onSubmit: async function (x) {
          await C.rest('POST', '/sections', {
            branch_id: x.branch_id,
            name: x.name,
            slug: x.slug.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            description: x.description || null,
            active: true
          });
          bust(); toast('تم إنشاء القسم التربوي بنجاح.', 'ok'); go('branches');
        }
      });
    }

    v.appendChild(h('div', { class: 'bar-sub' },
      h('h2', { text: 'فروع المؤسسة المعتمدة' })
    ));

    var branchCards = branches.map(function (b) {
      return h('div', { class: 'card', style: 'margin-bottom:12px; border-right:4px solid var(--gold);' },
        h('h3', { text: b.name }),
        h('div', { class: 'meta' },
          h('span', { text: 'المعرّف: ' + b.slug }),
          h('span', { text: 'عدد الطلبة المسجلين: ' + kidsCountInBranch(b.id) }),
          badge(b.active ? 'نشط' : 'معطّل', b.active ? 'ok' : 'gray')
        )
      );
    });
    v.appendChild(h('div', null, branchCards));

    v.appendChild(h('div', { class: 'bar-sub', style: 'margin-top:24px;' },
      h('h2', { text: 'الأقسام والأفواج التربوية (11 فوج رسمي)' }),
      h('button', { class: 'btn', type: 'button', text: '➕ إضافة قسم جديد', onclick: addSection })
    ));

    listView(v, {
      title: 'قائمة الأقسام التربوية',
      rows: sections,
      empty: 'لا توجد أقسام مسجلة.',
      search: function (s) { return s.name + ' ' + (s.description || ''); },
      cols: [
        { label: 'اسم القسم', get: function (s) { return s.name; }, sort: function (s) { return s.name; } },
        { label: 'الفرع التابع له', get: function (s) { return nameOf(branches, s.branch_id, 'name'); } },
        { label: 'عدد الطلبة', get: function (s) { return String(kidsCountInSection(s.id)); } },
        { label: 'الوصف', get: function (s) { return s.description || '—'; } },
        { label: 'الحالة', get: function (s) { return badge(s.active ? 'نشط' : 'معطّل', s.active ? 'ok' : 'gray'); } }
      ],
      actions: function (s) {
        return [
          rbtn(s.active ? 'تعطيل' : 'تفعيل', async function () {
            await C.rest('PATCH', '/sections?id=eq.' + uid(s.id), { active: !s.active });
            bust(); toast('تم تحديث حالة القسم.', 'ok'); go('branches');
          }, s.active ? 'light' : 'gold')
        ];
      }
    });
  }

  /* =====================================================================
     4. إدارة البرامج التربوية للأقسام (Educational Programs)
     ===================================================================== */
  async function secPrograms(v) {
    var d = await getMany('programs', 'sections');
    var rows = d[0], sections = d[1];
    var secOpts = sections.map(function (s) { return [s.id, s.name]; });

    var CURR = (window && window.DE_CURRICULUM) || EMBEDDED_CURRICULUM || {};
    var domainKeys = Object.keys(CURR);
    var domainOpts = domainKeys.map(function (d) { return [d, d]; });

    function editProgram(p) {
      var initialDomain = '', initialSkill = '';
      if (p && p.title) {
        var parts = p.title.split(' — ');
        if (parts.length >= 2 && CURR[parts[0]]) {
          initialDomain = parts[0];
          initialSkill = parts.slice(1).join(' — ');
        } else if (CURR[p.title]) {
          initialDomain = p.title;
        } else {
          initialDomain = domainKeys[0] || '';
          initialSkill = p.title;
        }
      } else {
        initialDomain = domainKeys[0] || '';
      }
      var skillList = (CURR[initialDomain] || []);
      var skillOpts = skillList.map(function (s) { return [s, s]; });
      if (initialSkill && !skillList.some(function (s) { return s === initialSkill; })) {
        skillOpts.unshift([initialSkill, initialSkill]);
      }

      var formVals = Object.assign({}, p || {}, {
        academic_year: (p && p.academic_year) || '2026-2027',
        status: (p && p.status) || 'draft',
        domain: initialDomain,
        skill: initialSkill || (skillList[0] || '')
      });

      return openForm({
        title: p ? 'تعديل برنامج تربوي' : 'إضافة برنامج تربوي لقسم',
        values: formVals,
        submits: p && p.status === 'published'
          ? [{ key: 'save', label: 'حفظ التعديلات (معتمد)' }]
          : [{ key: 'draft', label: 'حفظ كمسودة' }, { key: 'publish', label: 'اعتماد ونشر البرنامج' }],
        fields: [
          { k: 'section_id', label: 'القسم / الفوج التربوي المستهدف', type: 'select', opts: secOpts, req: true, hint: 'القسم الذي يُطبَّق عليه البرنامج التربوي.' },
          { k: 'domain', label: 'المجال التربوي', type: 'select', searchable: true, opts: domainOpts, req: true, hint: 'اختر أحد المجالات التربوية المعتمدة من الدليل البيداغوجي.' },
          { k: 'skill', label: 'المهارة المستهدفة', type: 'select', searchable: true, opts: skillOpts, req: true, hint: 'اختر المهارة المستهدفة (يمكنك البحث السريع بالكتابة في خانة البحث أعلاها).' },
          { k: 'academic_year', label: 'الموسم الدراسي', req: true, max: 20 },
          { k: 'description', label: 'وصف البرنامج وخطة الأنشطة البيداغوجية', type: 'textarea', max: 5000 },
          { k: 'goals', label: 'الأهداف الإجرائية والملاحظات التربوية', type: 'textarea', max: 5000 }
        ],
        onChange: function (changed, cur, formApi) {
          if (changed === 'domain') {
            var selectedDomain = cur.domain;
            var skills = (CURR[selectedDomain] || []);
            var newSkillOpts = skills.map(function (s) { return [s, s]; });
            formApi.setOpts('skill', newSkillOpts);
          }
        },
        onSubmit: async function (x, key) {
          var progTitle = (x.domain || '') + (x.skill ? (' — ' + x.skill) : '');
          var body = {
            section_id: x.section_id,
            title: progTitle || 'برنامج تربوي',
            academic_year: x.academic_year || '2026-2027',
            description: x.description || null,
            goals: x.goals || (x.skill || null),
            status: key === 'publish' ? 'published' : (p ? p.status : 'draft'),
            published_at: key === 'publish' ? new Date().toISOString() : (p ? p.published_at : null)
          };

          if (p) {
            await C.rest('PATCH', '/educational_programs?id=eq.' + uid(p.id), body);
          } else {
            await C.rest('POST', '/educational_programs', body);
          }
          bust();
          toast(key === 'publish' ? 'تم اعتماد ونشر البرنامج بنجاح.' : 'تم حفظ البرنامج كمسودة.', 'ok');
          go('programs');
        }
      });
    }

    listView(v, {
      title: 'البرامج التربوية للأقسام',
      addLabel: '➕ إضافة برنامج تربوي',
      onAdd: function () { editProgram(null); },
      rows: rows,
      empty: 'لا توجد برامج تربوية مسجلة.',
      search: function (p) { return p.title + ' ' + nameOf(sections, p.section_id, 'name'); },
      filters: [
        { label: 'القسم', opts: secOpts, test: function (p, x) { return p.section_id === x; } },
        { label: 'المجال التربوي', opts: domainOpts, test: function (p, x) { return (p.title || '').indexOf(x) >= 0; } },
        { label: 'الحالة', opts: [['published', 'معتمد ومنشور'], ['draft', 'مسودة']], test: function (p, x) { return p.status === x; } }
      ],
      cols: [
        { label: 'المجال والمهارة التربوية', get: function (p) { return p.title; }, sort: function (p) { return p.title; } },
        { label: 'القسم المستهدف', get: function (p) { return nameOf(sections, p.section_id, 'name'); } },
        { label: 'الموسم', get: function (p) { return p.academic_year || '2026-2027'; } },
        { label: 'الحالة', get: function (p) { return badge(p.status === 'published' ? 'معتمد ومنشور' : 'مسودة', p.status === 'published' ? 'ok' : 'gray'); } },
        { label: 'تاريخ النشر', get: function (p) { return p.published_at ? fmt(p.published_at) : '—'; } }
      ],
      actions: function (p) {
        return [
          rbtn('تعديل', function () { editProgram(p); }),
          p.status === 'published'
            ? rbtn('إلغاء النشر', async function () {
              await C.rest('PATCH', '/educational_programs?id=eq.' + uid(p.id), { status: 'draft', published_at: null });
              bust(); toast('تم إلغاء النشر وتحويل البرنامج لمسودة.', 'ok'); go('programs');
            }, 'light')
            : rbtn('اعتماد ونشر', async function () {
              await C.rest('PATCH', '/educational_programs?id=eq.' + uid(p.id), { status: 'published', published_at: new Date().toISOString() });
              bust(); toast('تم نشر البرنامج لأولياء القسم بنجاح.', 'ok'); go('programs');
            }, 'gold'),
          rbtn('حذف', async function () {
            if (!(await ask({ title: 'حذف البرنامج التربوي؟', msg: 'سيُحذف البرنامج نهائياً.', ok: 'حذف', danger: true }))) return;
            await C.rest('DELETE', '/educational_programs?id=eq.' + uid(p.id));
            bust(); toast('تم حذف البرنامج.', 'ok'); go('programs');
          }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     5. إدارة الأولياء (Parents)
     ===================================================================== */

  /* ---- قائمة إجراءات منبثقة (⋯): تُثبَّت فوق الجدول فلا تُقصّ داخل الحاوية ---- */
  function rowMenu(items) {
    var list = items.filter(Boolean);
    var wrap = h('div', { class: 'row-menu' });
    var trig = h('button', { class: 'icon-btn row-menu-trigger', type: 'button', text: '⋯' });
    trig.setAttribute('aria-haspopup', 'menu');
    trig.setAttribute('aria-expanded', 'false');
    trig.setAttribute('aria-label', 'إجراءات إضافية');
    trig.setAttribute('title', 'إجراءات إضافية');
    var pop = h('div', { class: 'row-menu-pop' }, list);
    pop.setAttribute('role', 'menu');
    pop.hidden = true;
    list.forEach(function (b) { b.setAttribute('role', 'menuitem'); });
    wrap.appendChild(trig);
    wrap.appendChild(pop);

    function onDocDown(e) { if (!wrap.contains(e.target)) close(); }
    function onKey(e) { if (e.key === 'Escape') { close(); trig.focus(); } }
    function open() {
      var r = trig.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.top = (r.bottom + 6) + 'px';
      pop.style.left = Math.max(8, r.right - 230) + 'px';
      pop.hidden = false;
      trig.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', onDocDown, true);
      document.addEventListener('keydown', onKey, true);
      if (list[0]) list[0].focus();
    }
    function close() {
      if (pop.hidden) return;
      pop.hidden = true;
      trig.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', onDocDown, true);
      document.removeEventListener('keydown', onKey, true);
    }
    trig.addEventListener('click', function (e) { e.stopPropagation(); if (pop.hidden) open(); else close(); });
    pop.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button')) close(); });
    return wrap;
  }


  /* =====================================================================
     6. التقارير التربوية (Progress Reports)
     ===================================================================== */
  async function secReports(v) {
    var d = await getMany('reports', 'children', 'branches', 'sections'), rows = d[0], kids = d[1], branches = d[2], sections = d[3];
    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });
    var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
    var secAllOpts = sections.map(function (s) { return [s.id, s.name]; });
    var MAX_FILE = 5242880;

    function fileInfo(f, api, r) {
      var kb = f.size < 1024 ? (f.size + ' بايت') : f.size < 1048576 ? (Math.round(f.size / 1024) + ' كيلوبايت') : ((f.size / 1048576).toFixed(1) + ' ميغابايت');
      var warn = f.size > MAX_FILE ? ' — الحجم يتجاوز 5 ميغابايت ولن يُقبل.' : '';
      var remove = h('button', { class: 'linkbtn', type: 'button', text: 'إزالة الملف قبل الحفظ', onclick: function () {
        var inp = api.input('file'); if (inp) inp.value = ''; api.refresh();
      } });
      return h('span', null, h('strong', { text: 'المرفق: ' }), f.name + ' — ' + (f.type || 'نوع غير معروف') + ' — ' + kb + warn, ' ', remove);
    }

    function edit(r) {
      var kid0 = r ? kids.filter(function (k) { return k.id === r.child_id; })[0] : null;
      var values = r ? {
        branch_id: kid0 ? kid0.branch_id : '', section_id: kid0 ? kid0.section_id : '', child_id: r.child_id,
        title: r.title, report_date: r.report_date, achievements: r.achievements, activities: r.activities, notes: r.notes, status: r.status
      } : { status: 'draft', report_date: new Date().toISOString().slice(0, 10) };
      var lastSec = values.section_id || '';
      var FORM = null, uploaded = null;

      return openForm({
        title: r ? 'تعديل تقرير تربوي' : 'تقرير تربوي جديد', values: values,
        submits: r && r.status === 'published' ? [{ key: 'save', label: 'حفظ التعديلات (منشور)' }] : [{ key: 'draft', label: 'حفظ كمسودة' }, { key: 'publish', label: 'اعتماد ونشر للولي' }],
        fields: [
          { k: 'branch_id', label: 'الفرع', type: 'select', opts: branchOpts, req: true },
          { k: 'section_id', label: 'القسم / الفوج', type: 'select', opts: secAllOpts, req: true },
          { k: 'child_id', label: 'الطفل', type: 'select', opts: kidOpts, req: true },
          { k: 'title', label: 'عنوان التقرير (مثال: التقرير الفصلي الأول)', req: true, max: 150 },
          { k: 'report_date', label: 'تاريخ التقرير', type: 'date', req: true },
          { k: 'achievements', label: 'المكتسبات والمهارات المحققة', type: 'textarea', max: 5000 },
          { k: 'activities', label: 'الأنشطة والورشات المنجزة', type: 'textarea', max: 5000 },
          { k: 'notes', label: 'ملاحظات وتوجيهات للأولياء', type: 'textarea', max: 5000 },
          { k: 'file', label: 'مرفق (PDF/JPG/PNG/WebP — حتى 5MB)', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp', hint: r && r.attachment_path ? 'يوجد مرفق محفوظ؛ اختيار ملف جديد يستبدل اسم المرفق في التقرير، والملف القديم يبقى محفوظًا.' : '' }
        ],
        onChange: function (key, cur, api) {
          FORM = api;
          // 1) الأقسام: تُصفّى حسب الفرع المختار
          var secs = sections.filter(function (s) { return s.branch_id === cur.branch_id; });
          api.setOpts('section_id', secs.map(function (s) { return [s.id, s.name]; }));
          var secNow = api.input('section_id').value;
          // 2) تغيّر القسم (بالاختيار أو بتغيّر الفرع) يمسح الطفل المختار
          if (secNow !== lastSec) { api.input('child_id').value = ''; lastSec = secNow; }
          // 3) الأطفال: من قسم الطفل المختار فقط
          var ks = secNow ? kids.filter(function (k) { return k.section_id === secNow; }) : [];
          api.setOpts('child_id', ks.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; }));
          // 4) رسائل الحالة الفارغة
          if (!cur.branch_id) api.note('pick', 'اختر الفرع أولًا لعرض أقسامه.');
          else if (!secs.length) api.note('pick', 'لا توجد أقسام في هذا الفرع بعد.');
          else if (!secNow) api.note('pick', 'اختر القسم لعرض أطفاله.');
          else if (!ks.length) api.note('pick', 'لا يوجد أطفال مسجلون في هذا القسم.');
          else api.note('pick', '');
          // 5) معاينة المرفق قبل الحفظ
          var f = cur.file;
          if (f) api.note('file', fileInfo(f, api, r));
          else api.note('file', r && r.attachment_path ? 'يوجد مرفق محفوظ لهذا التقرير؛ اختر ملفًا لاستبداله.' : '');
        },
        onSubmit: async function (x, key) {
          if (!x.child_id) throw new Error('اختر طفلًا من القسم المحدد.');
          var kid = kids.filter(function (k) { return k.id === x.child_id; })[0];
          if (!kid || kid.section_id !== x.section_id) throw new Error('الطفل المختار لا ينتمي إلى القسم المحدد.');
          if (key === 'publish' && !x.achievements && !x.activities && !x.notes) throw new Error('لا يمكن نشر تقرير فارغ تمامًا.');
          if (x.file && x.file.size > MAX_FILE) throw new Error('حجم الملف يتجاوز 5 ميغابايت.');
          var body = {
            child_id: x.child_id, title: x.title, report_date: x.report_date,
            // الحقلان مطلوبان في قاعدة البيانات ولم يعودا يُدخلان من الواجهة: يأخذان تاريخ التقرير للتقارير الجديدة ويُحفظ القيم القديمة عند التعديل
            period_start: r ? r.period_start : x.report_date, period_end: r ? r.period_end : x.report_date,
            achievements: x.achievements || null, activities: x.activities || null, notes: x.notes || null,
            status: key === 'publish' ? 'published' : (r ? r.status : 'draft')
          };
          if (x.file) {
            if (FORM) FORM.note('file', 'جارٍ رفع المرفق… لا تغلق النافذة.');
            try { uploaded = await uploadChecked(x.file, x.child_id); }
            catch (e) { if (FORM) FORM.note('file', 'تعذّر رفع المرفق: ' + (e && e.message || 'خطأ غير معروف')); throw e; }
            body.attachment_path = uploaded.path;
          }
          try {
            if (r) await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), body); else await C.rest('POST', '/progress_reports', body);
          } catch (e) {
            if (uploaded) C.removeObject('private-docs', uploaded.path).catch(function () {});
            throw e;
          }
          bust(); toast(key === 'publish' ? 'تم اعتماد التقرير ونشره للولي.' : 'حُفظت المسودة.', 'ok'); go('reports');
        }
      });
    }

    listView(v, {
      title: 'التقارير التربوية الدورية', addLabel: 'كتابة تقرير', onAdd: function () { if (!kids.length) return toast('أضف طفلًا أولًا.', 'bad'); edit(null); }, rows: rows, empty: 'لا توجد تقارير بعد.',
      search: function (r) { return r.title + ' ' + nameOf(kids, r.child_id); },
      filters: [{ label: 'الطفل', opts: kidOpts, test: function (r, x) { return r.child_id === x; } }, { label: 'الحالة', opts: [['published', 'منشور للولي'], ['draft', 'مسودة قيد الإعداد']], test: function (r, x) { return r.status === x; } }],
      cols: [
        { label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } },
        { label: 'الطفل', get: function (r) { return nameOf(kids, r.child_id); } },
        { label: 'التاريخ', get: function (r) { return fmt(r.report_date); }, sort: function (r) { return r.report_date; } },
        { label: 'الحالة', get: function (r) { return badge(r.status === 'published' ? 'منشور للولي' : 'مسودة', r.status === 'published' ? 'ok' : 'gray'); } }
      ],
      actions: function (r) {
        return [
          rbtn('تعديل', function () { return edit(r); }),
          r.status === 'published'
            ? rbtn('إلغاء النشر', async function () { await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), { status: 'draft' }); bust(); toast('تحوّل إلى مسودة.', 'ok'); go('reports'); }, 'light')
            : rbtn('نشر للولي', async function () { await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), { status: 'published' }); bust(); toast('تم النشر للولي.', 'ok'); go('reports'); }, 'gold'),
          rbtn('حذف', async function () { if (!(await ask({ title: 'حذف التقرير؟', msg: 'سيُحذف نهائيًا.', ok: 'حذف', danger: true }))) return; await C.rest('DELETE', '/progress_reports?id=eq.' + uid(r.id)); bust(); go('reports'); }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     7. المواعيد والأنشطة (Appointments)
     ===================================================================== */
  async function secAppts(v) {
    var d = await getMany('appts', 'children'), rows = d[0], kids = d[1];
    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });

    function edit(a) {
      return openForm({
        title: a ? 'تعديل موعد' : 'إضافة موعد أو نشاط جديد', values: a || { audience: 'all', status: 'scheduled' },
        fields: [
          { k: 'title', label: 'عنوان الموعد / النشاط', req: true, max: 150 },
          { k: 'starts_at', label: 'تاريخ ووقت البدء', type: 'datetime', req: true },
          { k: 'ends_at', label: 'تاريخ ووقت الانتهاء (اختياري)', type: 'datetime' },
          { k: 'location', label: 'المكان (مثال: قاعة الأنشطة، المركز الرئيسي)', max: 150 },
          { k: 'audience', label: 'المعنيون بالموعد', type: 'select', opts: [['all', 'جميع أولياء المركز'], ['child', 'أولياء طفل محدّد']], req: true },
          { k: 'child_id', label: 'الطفل المعني', type: 'select', opts: kidOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'description', label: 'تفاصيل وإرشادات إضافية', type: 'textarea', max: 2000 },
          { k: 'status', label: 'الحالة', type: 'select', opts: [['scheduled', 'قائم / مبرمج'], ['cancelled', 'ملغى']], req: true }
        ],
        onSubmit: async function (x) {
          if (x.ends_at && x.ends_at < x.starts_at) throw new Error('وقت الانتهاء يجب أن يكون بعد وقت البدء.');
          var body = {
            title: x.title, starts_at: x.starts_at, ends_at: x.ends_at || null, location: x.location || null,
            audience: x.audience, child_id: x.audience === 'child' ? x.child_id : null, description: x.description || null, status: x.status
          };
          if (a) await C.rest('PATCH', '/appointments?id=eq.' + uid(a.id), body); else await C.rest('POST', '/appointments', body);
          bust(); toast('تم حفظ الموعد بنجاح.', 'ok'); go('appts');
        }
      });
    }

    listView(v, {
      title: 'المواعيد والأنشطة المبرمجة', addLabel: 'إضافة موعد', onAdd: function () { edit(null); }, rows: rows, empty: 'لا توجد مواعيد مسجلة.',
      search: function (r) { return r.title + ' ' + (r.location || '') + ' ' + (r.audience === 'child' ? nameOf(kids, r.child_id) : 'الجميع'); },
      filters: [{ label: 'الحالة', opts: [['scheduled', 'قائم'], ['cancelled', 'ملغى']], test: function (r, x) { return r.status === x; } }],
      cols: [
        { label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } },
        { label: 'الوقت', get: function (r) { return fmt(r.starts_at, true); }, sort: function (r) { return r.starts_at; } },
        { label: 'المعنيون', get: function (r) { return r.audience === 'all' ? 'جميع الأولياء' : 'خاص بـ ' + nameOf(kids, r.child_id); } },
        { label: 'المكان', get: function (r) { return r.location || '—'; } },
        { label: 'الحالة', get: function (r) { return badge(r.status === 'scheduled' ? 'قائم' : 'ملغى', r.status === 'scheduled' ? 'ok' : 'bad'); } }
      ],
      actions: function (r) {
        return [
          rbtn('تعديل', function () { return edit(r); }),
          rbtn('حذف', async function () { if (!(await ask({ title: 'حذف الموعد؟', msg: 'سيُحذف نهائيًا.', ok: 'حذف', danger: true }))) return; await C.rest('DELETE', '/appointments?id=eq.' + uid(r.id)); bust(); go('appts'); }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     8. الرسائل والإعلانات (Messages)
     ===================================================================== */
  async function secMsgs(v) {
    var d = await getMany('msgs', 'reads', 'parents', 'children', 'branches', 'sections');
    var rows = d[0], reads = d[1], pars = d[2], kids = d[3], branches = d[4], sections = d[5];
    var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
    var secAllOpts = sections.map(function (s) { return [s.id, s.name]; });
    var parOpts = pars.map(function (p) { return [p.user_id, p.full_name]; });
    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });

    function readCount(id) { return reads.filter(function (x) { return x.message_id === id; }).length; }

    function edit(m) {
      var kid0 = m && m.child_id ? kids.filter(function (k) { return k.id === m.child_id; })[0] : null;
      var vals = m ? Object.assign({}, m, { branch_id: kid0 ? kid0.branch_id : '', section_id: kid0 ? kid0.section_id : '' }) : { kind: 'announcement', audience: 'all' };
      var lastSec = vals.section_id || '';
      return openForm({
        title: m ? 'تعديل رسالة/إعلان' : 'رسالة / إعلان جديد', values: vals,
        submits: m && m.published_at ? [{ key: 'save', label: 'حفظ التعديلات (منشور)' }] : [{ key: 'draft', label: 'حفظ كمسودة' }, { key: 'publish', label: 'نشر الآن' }],
        fields: [
          { k: 'kind', label: 'النوع', type: 'select', opts: [['announcement', 'إعلان عام'], ['message', 'رسالة خاصة']], req: true },
          { k: 'audience', label: 'المستلمون', type: 'select', opts: [['all', 'جميع الأولياء'], ['parent', 'ولي معيّن'], ['child', 'أولياء طفل معيّن']], req: true },
          { k: 'parent_id', label: 'الولي المستلم', type: 'select', opts: parOpts, req: true, showIf: function (x) { return x.audience === 'parent'; } },
          { k: 'branch_id', label: 'الفرع', type: 'select', opts: branchOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'section_id', label: 'القسم / الفوج', type: 'select', opts: secAllOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'child_id', label: 'الطفل المعني (يصل فقط لوليّه)', type: 'select', opts: kidOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'title', label: 'العنوان', req: true, max: 150 },
          { k: 'body', label: 'نص الرسالة / الإعلان', type: 'textarea', req: true, max: 5000 }
        ],
        onChange: function (key, cur, api) {
          if (cur.audience !== 'child') { api.note('pick', ''); return; }
          var secs = sections.filter(function (s) { return s.branch_id === cur.branch_id; });
          api.setOpts('section_id', secs.map(function (s) { return [s.id, s.name]; }));
          var secNow = api.input('section_id').value;
          if (secNow !== lastSec) { api.input('child_id').value = ''; lastSec = secNow; }
          var ks = secNow ? kids.filter(function (k) { return k.section_id === secNow; }) : [];
          api.setOpts('child_id', ks.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; }));
          if (!cur.branch_id) api.note('pick', 'اختر الفرع أولًا لعرض أقسامه.');
          else if (!secs.length) api.note('pick', 'لا توجد أقسام في هذا الفرع بعد.');
          else if (!secNow) api.note('pick', 'اختر القسم لعرض أطفاله.');
          else if (!ks.length) api.note('pick', 'لا يوجد أطفال مسجلون في هذا القسم.');
          else api.note('pick', '');
        },
        onSubmit: async function (x, key) {
          if (x.audience === 'child') {
            var kd = kids.filter(function (k) { return k.id === x.child_id; })[0];
            if (!kd || kd.section_id !== x.section_id) throw new Error('الطفل المختار لا ينتمي إلى القسم المحدد.');
          }
          var body = {
            kind: x.kind, audience: x.audience, parent_id: x.audience === 'parent' ? x.parent_id : null, child_id: x.audience === 'child' ? x.child_id : null,
            title: x.title, body: x.body, published_at: key === 'publish' ? new Date().toISOString() : (m ? m.published_at : null)
          };
          if (m) await C.rest('PATCH', '/messages?id=eq.' + uid(m.id), body); else await C.rest('POST', '/messages', body);
          bust(); toast(key === 'publish' ? 'تم النشر بنجاح.' : 'حُفظت المسودة.', 'ok'); go('msgs');
        }
      });
    }

    function to(r) { return r.audience === 'all' ? 'جميع الأولياء' : r.audience === 'parent' ? 'ولي: ' + nameOf(pars, r.parent_id) : 'أولياء: ' + nameOf(kids, r.child_id); }

    listView(v, {
      title: 'الرسائل والإعلانات للأولياء', addLabel: 'إنشاء رسالة/إعلان', onAdd: function () { edit(null); }, rows: rows, empty: 'لا توجد رسائل.',
      search: function (r) { return r.title + ' ' + to(r); },
      filters: [{ label: 'النوع', opts: [['announcement', 'إعلان عام'], ['message', 'رسالة خاصة']], test: function (r, x) { return r.kind === x; } }, { label: 'الحالة', opts: [['d', 'مسودة'], ['p', 'منشور']], test: function (r, x) { return (r.published_at ? 'p' : 'd') === x; } }],
      cols: [
        { label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } },
        { label: 'النوع', get: function (r) { return r.kind === 'message' ? 'رسالة خاصة' : 'إعلان عام'; } },
        { label: 'المستلمون', get: to },
        { label: 'الحالة', get: function (r) { return r.published_at ? badge('منشور ' + fmt(r.published_at), 'ok') : badge('مسودة'); } },
        { label: 'قرأها', get: function (r) { return r.published_at ? String(readCount(r.id)) : '—'; } }
      ],
      actions: function (r) {
        return [
          rbtn('تعديل', function () { return edit(r); }),
          r.published_at ? null : rbtn('نشر الآن', async function () { await C.rest('PATCH', '/messages?id=eq.' + uid(r.id), { published_at: new Date().toISOString() }); bust(); toast('تم النشر.', 'ok'); go('msgs'); }, 'gold'),
          rbtn('حذف', async function () { if (!(await ask({ title: 'حذف الرسالة؟', msg: 'ستختفي من فضاء الأولياء نهائيًا.', ok: 'حذف', danger: true }))) return; await C.rest('DELETE', '/messages?id=eq.' + uid(r.id)); bust(); go('msgs'); }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     9. الوثائق الخاصة (Documents)
     ===================================================================== */
  async function secDocs(v) {
    var d = await getMany('docs', 'children'), rows = d[0], kids = d[1];
    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });

    function upload() {
      return openForm({
        title: 'رفع وثيقة خاصة لملف طفل', submits: [{ key: 'up', label: 'رفع الوثيقة' }],
        fields: [
          { k: 'child_id', label: 'الطفل المعني', type: 'select', opts: kidOpts, req: true },
          { k: 'title', label: 'عنوان الوثيقة', req: true, max: 150 },
          { k: 'category', label: 'التصنيف (مثال: تقرير نفسي، فحص طبي، شهادة مدرسية)', max: 60 },
          { k: 'file', label: 'الملف (PDF/JPG/PNG/WebP — حتى 5MB)', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp', req: true },
          { k: 'shared', label: 'إتاحة الوثيقة للتحميل في فضاء ولي الطفل', type: 'checkbox' }
        ],
        onSubmit: async function (x) {
          var up = await uploadChecked(x.file, x.child_id);
          try {
            await C.rest('POST', '/documents', {
              title: x.title, category: x.category || null, child_id: x.child_id,
              storage_path: up.path, mime_type: up.mime, size_bytes: up.size, shared_with_parent: !!x.shared
            });
          } catch (e) {
            C.removeObject('private-docs', up.path).catch(function () {});
            throw e;
          }
          bust(); toast('تم رفع الوثيقة بنجاح.', 'ok'); go('docs');
        }
      });
    }

    listView(v, {
      title: 'الوثائق والملفات الخاصة', addLabel: 'رفع وثيقة', onAdd: function () { if (!kids.length) return toast('أضف طفلًا أولًا.', 'bad'); upload(); }, rows: rows, empty: 'لا توجد وثائق مسجلة.',
      search: function (r) { return r.title + ' ' + (r.category || '') + ' ' + nameOf(kids, r.child_id); },
      filters: [
        { label: 'الطفل', opts: kidOpts, test: function (r, x) { return r.child_id === x; } },
        { label: 'المشاركة', opts: [['1', 'متاحة للولي'], ['0', 'خاصة بالإدارة فقط']], test: function (r, x) { return String(+r.shared_with_parent) === x; } }
      ],
      cols: [
        { label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } },
        { label: 'الطفل', get: function (r) { return nameOf(kids, r.child_id); } },
        { label: 'التصنيف', get: function (r) { return r.category || '—'; } },
        { label: 'الحجم والنوع', get: function (r) { return r.mime_type.split('/')[1].toUpperCase() + ' · ' + size(r.size_bytes); } },
        { label: 'مع الولي', get: function (r) { return badge(r.shared_with_parent ? 'متاحة للولي' : 'خاصة بالإدارة', r.shared_with_parent ? 'ok' : 'gray'); } },
        { label: 'تاريخ الرفع', get: function (r) { return fmt(r.created_at); }, sort: function (r) { return r.created_at; } }
      ],
      actions: function (r) {
        return [
          rbtn('فتح', async function () {
            var url = await C.signedUrl('private-docs', r.storage_path, 60);
            info('رابط مؤقت مشفّر (دقيقة واحدة)', h('a', { class: 'btn gold', href: url, target: '_blank', rel: 'noopener noreferrer', text: 'فتح الوثيقة' }));
          }),
          rbtn(r.shared_with_parent ? 'إيقاف المشاركة' : 'مشاركة مع الولي', async function () {
            await C.rest('PATCH', '/documents?id=eq.' + uid(r.id), { shared_with_parent: !r.shared_with_parent }); bust(); go('docs');
          }),
          rbtn('حذف', async function () {
            if (!(await ask({ title: 'حذف الوثيقة؟', msg: 'سيُحذف الملف نهائيًا من وحدة التخزين الآمنة.', ok: 'حذف نهائي', danger: true }))) return;
            await C.rest('DELETE', '/documents?id=eq.' + uid(r.id));
            try { await C.removeObject('private-docs', r.storage_path); } catch (e) {}
            bust(); go('docs');
          }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     10. حسابات الإدارة (Accounts)
     ===================================================================== */
  async function secAccounts(v) {
    var r = await C.rpc('admin_list'), canManage = !!r.can_manage;
    S.isOwner = canManage;

    v.appendChild(h('div', { class: 'card' },
      h('p', { class: 'muted', text: canManage ? 'أنت المدير الرئيسي (المالك): تملك صلاحيات دعوة المديرين، إدارة الأدوار، وتصفية سجلات العمليات والتدقيق.' : 'صلاحية العرض فقط. إدارة حسابات المديرين محصورة بالمدير الرئيسي للمركز.' })
    ));

    function invite() {
      return openForm({
        title: 'دعوة مدير جديد',
        submits: [{ key: 'go', label: 'إرسال الدعوة بالبريد' }],
        fields: [
          { k: 'email', label: 'البريد الإلكتروني', type: 'email', req: true, kind: 'email', max: 254,
            hint: 'ستصل الدعوة إلى هذا البريد. المدعو يختار كلمة مروره بنفسه عند فتح الرابط.' },
          { k: 'role', label: 'الصلاحية', type: 'select', req: true, opts: [['admin', 'مدير شامل (إدارة الأطفال والأولياء والمحتوى)'], ['editor', 'محرّر (إدارة محتوى الموقع والوسائط فقط)']] }
        ],
        onSubmit: async function (x) {
          var email = x.email.toLowerCase();
          var res = await C.fn('admin-users', { action: 'invite_admin', email: email, role: x.role });
          bust();
          info('تم إرسال الدعوة', h('div', null,
            h('p', { text: 'أُرسلت الدعوة إلى: ' + (res.email || email) }),
            h('p', { text: 'الصلاحية: ' + (res.role_label || '') }),
            h('p', { class: 'muted small', text: 'عند فتح الرابط في البريد يُطلب من المدعو إنشاء كلمة مرور خاصة به، ثم يدخل مباشرة. إن لم تصل الرسالة فليتفقد مجلد الرسائل غير المرغوب فيها (Spam).' })
          ));
          go('accounts');
        }
      });
    }

    listView(v, {
      title: 'الحسابات الإدارية المعتمدة', addLabel: canManage ? 'دعوة مدير' : '', onAdd: canManage ? invite : null, rows: r.admins, empty: 'لا توجد حسابات.',
      search: function (a) { return a.email; },
      cols: [
        { label: 'البريد الإلكتروني', get: function (a) { return a.email + (a.is_owner ? ' (المالك الرئيسي)' : a.is_me ? ' (أنت)' : ''); }, sort: function (a) { return a.email; } },
        { label: 'الدور', get: function (a) { return a.is_owner ? 'المالك الرئيسي' : a.role === 'editor' ? 'محرّر موقع' : 'مدير'; } },
        { label: 'آخر تسجيل دخول', get: function (a) { return fmt(a.last_sign_in_at, true); } },
        { label: 'الحالة', get: function (a) { return badge(a.disabled ? 'معطَّل' : 'مفعّل', a.disabled ? 'bad' : 'ok'); } }
      ],
      actions: function (a) {
        if (!canManage || a.is_owner || a.is_me) return [];
        var actList = [];
        if (!a.last_sign_in_at) {
          actList.push(rbtn('📩 إرسال رابط التفعيل', async function () {
            var redirectUrl = location.origin + location.pathname;
            await C.recover(a.email, redirectUrl);
            toast('تم إرسال رابط تفعيل الحساب وإنشاء كلمة المرور إلى ' + a.email, 'ok');
          }, 'gold'));
        }
        return actList.concat([
          rbtn(a.disabled ? 'تفعيل الحساب' : 'تعطيل الحساب', async function () {
            if (!a.disabled && !(await ask({ title: 'تعطيل هذا المدير؟', msg: 'سيفقد صلاحياته فورًا ولن يستطيع الدخول إلى لوحة الإدارة.', ok: 'تعطيل', danger: true }))) return;
            try {
              await C.fn('admin-users', { action: 'set_admin_disabled', user_id: uid(a.id), disabled: !a.disabled });
            } catch (e) {
              await C.rest('PATCH', '/admins?user_id=eq.' + uid(a.id), { disabled: !a.disabled });
            }
            bust(); toast('تم تعديل حالة الحساب.', 'ok'); go('accounts');
          }, a.disabled ? 'gold' : 'light'),
          rbtn('🗑️ حذف المدير', async function () {
            if (!(await ask({
              title: 'حذف حساب المدير نهائيًا؟',
              msg: 'سيتم حذف حساب المدير (' + a.email + ') وسحب جميع صلاحياته فورًا. هذه العملية لا يمكن التراجع عنها!',
              ok: 'حذف نهائي',
              danger: true
            }))) return;
            try {
              await C.rpc('admin_remove_user', { p_user_id: uid(a.id) });
            } catch (rpcErr) {
              await C.fn('admin-users', { action: 'remove_admin', user_id: uid(a.id) });
            }
            bust(); toast('تم حذف حساب المدير نهائيًا.', 'ok'); go('accounts');
          }, 'danger')
        ]);
      }
    });
  }

  /* =====================================================================
     11. سجل العمليات والتدقيق (Audit Log) مع صلاحيات الحذف للمدير الرئيسي
     ===================================================================== */
  async function secAudit(v) {
    var rows = await C.rpc('admin_audit_list', { p_limit: 100 });
    var accountsData = null, permError = null;
    try { accountsData = await C.rpc('admin_list'); } catch (e) { permError = e; }
    var isOwner = !!(accountsData && accountsData.can_manage);

    var card = h('div', { class: 'card' },
      h('h2', { text: 'سجل العمليات والرقابة الأمنية (Audit Log)' }),
      h('p', { class: 'muted small', text: 'يُسجَّل تلقائيًا نوع كل عملية إدارية، البريد الإلكتروني للمنفّذ، والمعرّف الرقمي فقط — دون تخزين كلمات مرور أو تقارير طبية حساسة. الحماية مشددة على مستوى قاعدة البيانات.' })
    );

    if (isOwner) {
      var superAdminActions = h('div', { class: 'row-actions', style: 'margin-top:10px; border-top:1px dashed #cbd5e1; padding-top:10px;' },
        h('span', { class: 'badge gold', text: 'صلاحيات المالك الرئيسي' }),
        h('button', {
          class: 'btn small light',
          type: 'button',
          text: '🗑️ حذف السجلات الأقدم من 30 يومًا',
          onclick: async function () {
            if (!(await ask({
              title: 'تصفية سجلات التدقيق القديمة؟',
              msg: 'سيتم حذف جميع سجلات العمليات التي مضى عليها أكثر من 30 يومًا نهائيًا.',
              ok: 'تأكيد الحذف'
            }))) return;
            try {
              var pastDate = new Date(Date.now() - 30 * 86400000).toISOString();
              var deleted = await C.rpc('admin_delete_audit', { p_id: null, p_older_than: pastDate });
              bust();
              if (!deleted) toast('لا توجد سجلات أقدم من 30 يومًا، لذلك لم يُحذف شيء.');
              else toast('تم حذف ' + deleted + ' سجل تدقيق قديم.', 'ok');
              go('audit');
            } catch (e) {
              toast('تعذّر الحذف: ' + (e && e.message ? e.message : 'خطأ غير معروف') + '. إن استمرت المشكلة فتأكد من تشغيل ملف 08-fix-audit-and-admin-delete.sql.', 'bad');
            }
          }
        }),
        h('button', {
          class: 'btn small danger',
          type: 'button',
          text: '⚠️ تصفية كل سجلات التدقيق',
          onclick: async function () {
            if (!(await ask({
              title: 'تصفية شاملة لسجلات العمليات؟',
              msg: 'سيتم مسح سجل العمليات والتدقيق كاملاً. هذه العملية لا يمكن التراجع عنها!',
              ok: 'مسح شامل', danger: true
            }))) return;
            try {
              var deleted = await C.rpc('admin_delete_audit', { p_id: null, p_older_than: null });
              bust();
              toast('تم مسح ' + (deleted || 0) + ' سجل تدقيق بنجاح.', 'ok');
              go('audit');
            } catch (e) {
              toast('تعذّر المسح: ' + (e && e.message ? e.message : 'خطأ غير معروف') + '. إن استمرت المشكلة فتأكد من تشغيل ملف 08-fix-audit-and-admin-delete.sql.', 'bad');
            }
          }
        })
      );
      card.appendChild(superAdminActions);
    } else {
      card.appendChild(h('p', { class: 'muted small', text: permError
        ? 'تعذّر التحقق من صلاحياتك لعرض أزرار الحذف. حدّث الصفحة أو أعد تسجيل الدخول.'
        : 'أزرار مسح السجل متاحة للمدير الرئيسي (المالك) فقط. الحساب الحالي مدير غير مالك.' }));
    }

    v.appendChild(card);

    listView(v, {
      title: 'آخر العمليات المسجّلة',
      rows: rows,
      empty: 'لا توجد عمليات مسجّلة حالياً.',
      search: function (r) { return (AUDIT[r.action] || r.action) + ' ' + (r.actor_email || ''); },
      cols: [
        { label: 'التوقيت', get: function (r) { return fmt(r.at, true); }, sort: function (r) { return r.at; } },
        { label: 'المنفّذ', get: function (r) { return r.actor_email || 'النظام السحابي'; } },
        { label: 'العملية المنجزة', get: function (r) { return AUDIT[r.action] || r.action; } },
        { label: 'المعرّف المعني', get: function (r) { return r.target || '—'; } }
      ],
      actions: function () { return []; }
    });
  }

  /* =====================================================================
     12. الأمان والإعدادات (Settings)
     ===================================================================== */
  async function secSettings(v) {
    var me = await C.me(), mfa = ((me && me.factors) || []).some(function (f) { return f.status === 'verified'; });
    v.appendChild(h('div', { class: 'card' },
      h('h2', { text: 'المصادقة الثنائية (MFA - TOTP)' }),
      h('p', null, badge(mfa ? 'مفعّلة لحسابك بنجاح' : 'غير مفعّلة', mfa ? 'ok' : 'bad')),
      h('p', { class: 'muted', text: mfa ? 'حسابك مؤمّن برمز المصادقة المزدوجة (Google Authenticator).' : 'يمكن تفعيلها لحسابك عبر تطبيق مصادقة مثل Google Authenticator أو Microsoft Authenticator.' })
    ));
    v.appendChild(h('div', { class: 'card' },
      h('h2', { text: 'الأمان وقيود النفاذ (RLS)' }),
      h('p', { class: 'muted', text: 'تم تطبيق سياسات Row Level Security صارمة في PostgreSQL. أولياء الأمور يستحيل عليهم رؤية أي بيانات تخص أطفالاً آخرين غير أبنائهم المسجلين. مفتاح الخدمة service_role غير موجود في المتصفح.' })
    ));
    v.appendChild(h('div', { class: 'card' },
      h('h2', { text: 'رموز الاستجابة السريعة (QR)' }),
      h('p', { class: 'muted', text: 'رموز QR المطبوعة على بطاقات انخراط الطلبة تشير إلى صفحة التحقق العامة qr.html، وتعرض 5 حقول رسمية فقط بدون أي تفاصيل حساسة أو أرقام هواتف خاصة.' })
    ));
  }

  /* =====================================================================
     التنقل والتهيئة (Navigation & Bootstrap)
     ===================================================================== */
  var SECS = {
    dash: secDash,
    children: secChildren,
    branches: secBranches,
    programs: secPrograms,
    reports: secReports,
    appts: secAppts,
    msgs: secMsgs,
    docs: secDocs,
    accounts: secAccounts,
    audit: secAudit,
    settings: secSettings
  };

  async function go(sec) {
    if (!SECS[sec]) sec = 'dash';
    S.sec = sec;
    var n = ++S.nav, v = $('#view');
    $('#secTitle').textContent = TITLES[sec] || 'لوحة التحكم';

    [].forEach.call(document.querySelectorAll('#nav [data-sec]'), function (b) {
      if (b.dataset.sec === sec) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });

    if (window.innerWidth <= 860) $('#app').classList.remove('nav-toggled');
    v.textContent = '';
    v.appendChild(h('div', { class: 'empty', text: 'جارٍ التحميل…' }));

    var box = h('div');
    try {
      await SECS[sec](box);
    } catch (e) {
      bust();
      box = h('div', { class: 'err', role: 'alert' },
        h('p', { text: e.message }),
        h('button', { class: 'btn small', type: 'button', text: 'إعادة المحاولة', onclick: function () { go(sec); } }));
    }

    if (n !== S.nav) return;
    v.textContent = '';
    v.appendChild(box);
    window.scrollTo(0, 0);
  }

  var mode = 'creds';
  var MODE_UI = {
    creds: { btn: 'دخول', hint: 'للحسابات الإدارية المخوّلة فقط.' },
    mfa: { btn: 'تأكيد الرمز', hint: 'أدخل الرمز من تطبيق المصادقة.' },
    forgot: { btn: 'إرسال رابط استعادة كلمة المرور', hint: 'أدخل بريد حسابك وسنرسل إليه رابطًا آمنًا لإعادة تعيين كلمة المرور.' },
    set: { btn: 'إنشاء كلمة المرور وتفعيل الحساب', hint: 'مرحبًا بك! يرجى إنشاء كلمة مرور لحسابك وتأكيدها للمتابعة.' }
  };
  function setMode(m, hint) {
    mode = m;
    var u = MODE_UI[m] || MODE_UI.creds;
    $('#stCreds').hidden = m !== 'creds';
    $('#stMfa').hidden = m !== 'mfa';
    if ($('#stForgot')) $('#stForgot').hidden = m !== 'forgot';
    if ($('#stSet')) $('#stSet').hidden = m !== 'set';
    $('#lBtn').textContent = u.btn;
    $('#lHint').textContent = hint || u.hint;
    $('#forgotBtn').hidden = m !== 'creds';
    $('#backBtn').hidden = m === 'creds';
    if (m === 'set') { setTimeout(function () { var p = $('#np1'); if (p) p.focus(); }, 0); }
  }
  function showLogin(m) {
    S.stopIdle && S.stopIdle();
    show('login');
    setMode('creds');
    msg($('#lErr'), m);
    msg($('#lOk'), '');
  }

  async function enter() {
    show('boot');
    try {
      var ok = await C.rpc('can_manage_families');
      if (ok !== true) {
        var anyAdmin = await C.rpc('is_admin');
        await C.signOut();
        return showLogin(anyAdmin === true ? 'حسابك محرّر: لا يملك صلاحية بيانات الأطفال والأولياء.' : 'هذا الحساب غير مخوّل بالدخول إلى هذه اللوحة.');
      }
      S.me = await C.me();
      bust();
      show('app');
      $('#who').textContent = (S.me && S.me.email) || 'مدير';
      S.stopIdle && S.stopIdle();
      S.stopIdle = DE.idle(30 * 60 * 1000, function () { logout('تم تسجيل خروجك تلقائيًا بعد فترة خمول.'); });
      go('dash');
    } catch (e) { showLogin(e.message); }
  }

  async function logout(m) { await C.signOut(); S.cache = {}; S.me = null; showLogin(m); }

  async function submitLogin(e) {
    e.preventDefault();
    msg($('#lErr'), '');
    await lock($('#lBtn'), async function () {
      try {
        if (mode === 'creds') {
          var em = DE.clean($('#email').value, 254).toLowerCase(), pw = $('#password').value;
          if (!DE.isEmail(em) || !pw || pw.length > 72) return msg($('#lErr'), 'أدخل البريد وكلمة المرور.');
          var r = await C.signIn(em, pw);
          $('#password').value = '';
          if (r.mfa) { setMode('mfa'); $('#mfaCode').focus(); return; }
          await enter();
        } else if (mode === 'mfa') {
          var code = $('#mfaCode').value.replace(/\s/g, '');
          if (!/^\d{6}$/.test(code)) return msg($('#lErr'), 'أدخل الرمز المكوّن من 6 أرقام.');
          await C.verifyMfa(code);
          $('#mfaCode').value = '';
          await enter();
        } else if (mode === 'forgot') {
          var em1 = DE.clean($('#fEmail').value, 254).toLowerCase();
          if (!DE.isEmail(em1)) return msg($('#lErr'), 'اكتب بريدًا إلكترونيًا صالحًا.');
          var redirectUrl = location.origin + location.pathname;
          await C.recover(em1, redirectUrl);
          msg($('#lOk'), 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح. تفقد صندوق الوارد أو مجلد الرسائل غير المرغوب فيها (Spam)، وانقر على الرابط لإعادة تعيين كلمة المرور.');
        } else if (mode === 'set') {
          var a = String($('#np1').value || '').trim(), b = String($('#np2').value || '').trim();
          if (DE.pwProblem(a)) return msg($('#lErr'), 'كلمة المرور: 10 أحرف على الأقل مع حرف كبير وحرف صغير ورقم.');
          if (a !== b) return msg($('#lErr'), 'كلمتا المرور غير متطابقتين.');
          await C.setPassword(a);
          $('#np1').value = $('#np2').value = '';
          msg($('#lOk'), 'تم إنشاء كلمة المرور وتفعيل حسابك بنجاح! جارٍ الدخول…');
          await enter();
        }
      } catch (er) { msg($('#lErr'), er.message); }
    });
  }

  async function init() {
    if (!CFG.supabaseUrl || !CFG.supabaseKey) { $('#boot').textContent = 'إعدادات الاتصال غير مضبوطة.'; return; }
    C.onExpire(function () { showLogin('انتهت الجلسة. سجّل الدخول من جديد.'); });
    $('#loginForm').addEventListener('submit', submitLogin);
    $('#forgotBtn').addEventListener('click', function () { msg($('#lErr'), ''); msg($('#lOk'), ''); $('#fEmail').value = ($('#email').value || '').trim(); setMode('forgot'); $('#fEmail').focus(); });
    $('#backBtn').addEventListener('click', function () { C.cancelMfa(); msg($('#lErr'), ''); msg($('#lOk'), ''); setMode('creds'); });
    $('#logoutBtn').addEventListener('click', function () { logout(); });
    $('#menuBtn').addEventListener('click', function () {
      if (window.innerWidth <= 860) {
        $('#app').classList.toggle('nav-toggled');
      } else {
        $('#app').classList.toggle('side-collapsed');
      }
    });
    $('#scrim').addEventListener('click', function () { $('#app').classList.remove('nav-toggled'); });
    $('#nav').addEventListener('click', function (e) { var b = e.target.closest('button[data-sec]'); if (b) go(b.dataset.sec); });
    $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

    var hash = await C.adoptHash();
    if (hash && hash.error) { showLogin(hash.error); return; }
    if (hash && (hash.token || hash.type === 'invite' || hash.type === 'recovery' || hash.type === 'signup')) {
      show('login');
      var userEmail = hash.email || '';
      if (!userEmail) {
        try { var u = await C.me(); if (u && u.email) userEmail = u.email; } catch (e) {}
      }
      if ($('#setEmail')) $('#setEmail').value = userEmail;
      if ($('#email')) $('#email').value = userEmail;
      setMode('set', 'مرحبًا بك في لوحة الإدارة! بريدك الإلكتروني معروض أدناه. يرجى إنشاء كلمة المرور الخاصة بحسابك وتأكيدها للمتابعة.');
      return;
    }
    if (C.load()) enter(); else showLogin();
  }

  init();
})();
