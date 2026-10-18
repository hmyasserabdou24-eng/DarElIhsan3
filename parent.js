/* فضاء الأولياء — قراءة فقط. كل البيانات تمر عبر RLS؛ هذا الملف واجهة فقط ولا يثق بأي معرّف.
   كل نص يُعرض بـ textContent (عبر DE.h) فلا ينفَّذ أي HTML قادم من قاعدة البيانات. */
(function () {
  'use strict';
  var FILE_BUILD = '2026-10-18.1';
  if (window.top !== window.self) { document.body.textContent = ''; return; }   // منع التضمين داخل إطارات

  var CFG = window.DE_CONFIG || {}, h = DE.h;
  var $ = function (s) { return document.querySelector(s); };
  var C = DE.Client(CFG, 'de_parent_session');
  var CENTERS = { main: 'المركز الرئيسي لدار الإحسان', work: 'مركز المساعدة على العمل', farm: 'المزرعة البيداغوجية' };
  var S = { tab: 'children', me: null, name: '', d: null, reads: {} };
  var stopIdle = null;

  /* ---------- أدوات ---------- */
  function fmtDate(v, withTime) {
    try { return new Date(v).toLocaleString('ar-DZ-u-nu-latn', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }); }
    catch (e) { return ''; }
  }
  function toast(msg, kind) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast ' + (kind || ''); t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 3800);
  }
  function show(id) { ['boot', 'login', 'app'].forEach(function (x) { $('#' + x).hidden = x !== id; }); }
  function setMsg(el, msg) { el.textContent = msg || ''; el.hidden = !msg; }
  function lockBtn(btn, fn) {          // يمنع تكرار الطلبات عند النقر المتكرر
    if (btn.disabled) return Promise.resolve();
    btn.disabled = true;
    return Promise.resolve().then(fn).then(function (r) { btn.disabled = false; return r; }, function (e) { btn.disabled = false; throw e; });
  }

  /* ---------- الدخول / الدعوة / الاستعادة ---------- */
  var mode = 'login';   // login | forgot | set
  function setMode(m, hint) {
    mode = m;
    $('#stCreds').hidden = m !== 'login'; $('#stForgot').hidden = m !== 'forgot'; $('#stSet').hidden = m !== 'set';
    $('#forgotBtn').hidden = m !== 'login'; $('#backBtn').hidden = m === 'login' || m === 'set';
    $('#lBtn').textContent = m === 'login' ? 'دخول' : m === 'forgot' ? 'إرسال رابط الاستعادة' : 'حفظ كلمة المرور';
    $('#lTitle').textContent = m === 'set' ? 'تعيين كلمة المرور' : m === 'forgot' ? 'استعادة كلمة المرور' : 'فضاء الأولياء';
    $('#lHint').textContent = hint || (m === 'login' ? 'سجّل الدخول لمتابعة ملف طفلك.' : m === 'forgot' ? 'أدخل بريدك وسنرسل إليك رابطًا.' : 'اختر كلمة مرور قوية لحسابك.');
    setMsg($('#lErr'), ''); setMsg($('#lOk'), '');
  }
  function showLogin(msg) { stopIdle && stopIdle(); show('login'); setMode('login'); setMsg($('#lErr'), msg); }

  async function submitLogin(e) {
    e.preventDefault(); setMsg($('#lErr'), ''); setMsg($('#lOk'), '');
    await lockBtn($('#lBtn'), async function () {
      try {
        if (mode === 'login') {
          var em = DE.clean($('#email').value, 254).toLowerCase(), pw = $('#password').value;
          if (!DE.isEmail(em) || !pw || pw.length > 72) return setMsg($('#lErr'), 'أدخل البريد وكلمة المرور.');
          await C.signIn(em, pw);
          $('#password').value = '';
          await enter();
        } else if (mode === 'forgot') {
          var fe = DE.clean($('#fEmail').value, 254).toLowerCase();
          if (!DE.isEmail(fe)) return setMsg($('#lErr'), 'أدخل بريدًا صحيحًا.');
          try { await C.recover(fe, location.origin + location.pathname); }
          catch (er) { if (er.status === 429) throw er; }          // لا نكشف هل البريد مسجَّل أم لا
          setMsg($('#lOk'), 'إن كان البريد مسجَّلًا فسيصلك رابط لتعيين كلمة مرور جديدة خلال دقائق.');
        } else {
          var a = $('#np1').value, b = $('#np2').value;
          if (DE.pwProblem(a)) return setMsg($('#lErr'), DE.PW_MSG);
          if (a !== b) return setMsg($('#lErr'), 'كلمتا المرور غير متطابقتين.');
          await C.setPassword(a); $('#np1').value = $('#np2').value = '';
          await enter();
        }
      } catch (er) { setMsg($('#lErr'), er.message); }
    });
  }

  /* ---------- تحميل البيانات (كلها عبر RLS) ---------- */
  async function enter() {
    show('boot');
    try {
      var ok = await C.rpc('is_active_parent');
      if (ok !== true) { await C.signOut(); return showLogin('هذا الحساب غير مفعّل أو غير مخصّص للأولياء.'); }
      var me = await C.me(); S.me = me && me.id;
      var q = function (p) { return C.rest('GET', p); };
      var r = await Promise.all([
        q('/parent_profiles?select=full_name&limit=1'),
        q('/children?select=id,full_name,center,section,basic_info&order=full_name'),
        q('/progress_reports?select=id,child_id,title,report_date,period_start,period_end,achievements,activities,notes,attachment_path&order=report_date.desc'),
        q('/appointments?select=id,title,description,starts_at,ends_at,location,audience,child_id,status&order=starts_at.asc'),
        q('/messages?select=id,kind,title,body,published_at&order=published_at.desc'),
        q('/message_reads?select=message_id'),
        q('/documents?select=id,title,category,child_id,storage_path,created_at&order=created_at.desc')
      ]);
      S.name = (r[0][0] && r[0][0].full_name) || '';
      S.d = { children: r[1], reports: r[2], appts: r[3], msgs: r[4], docs: r[6] };
      S.reads = {}; r[5].forEach(function (x) { S.reads[x.message_id] = true; });
      show('app'); $('#who').textContent = S.name || 'ولي الأمر';
      stopIdle && stopIdle(); stopIdle = DE.idle(30 * 60 * 1000, function () { logout('تم تسجيل خروجك تلقائيًا بعد فترة خمول.'); });
      render();
    } catch (er) { showLogin(er.message); }
  }
  async function logout(msg) { await C.signOut(); S = { tab: 'children', me: null, name: '', d: null, reads: {} }; showLogin(msg); }

  /* ---------- العرض ---------- */
  var TABS = [['children', 'أبنائي', 'i-child'], ['reports', 'التقارير', 'i-report'], ['appts', 'المواعيد', 'i-cal'], ['msgs', 'الرسائل', 'i-mail'], ['docs', 'الوثائق', 'i-file']];
  function unreadCount() { return S.d.msgs.filter(function (m) { return !S.reads[m.id]; }).length; }
  function icon(id) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'i'); var u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.appendChild(u); return s; }
  function renderTabs() {
    var nav = $('#tabs'); nav.textContent = '';
    TABS.forEach(function (t) {
      var b = h('button', { type: 'button', role: 'tab', 'aria-selected': S.tab === t[0] ? 'true' : 'false', onclick: function () { S.tab = t[0]; render(); window.scrollTo(0, 0); } }, icon(t[2]), t[1]);
      if (t[0] === 'msgs' && unreadCount()) b.appendChild(h('span', { class: 'dot', text: String(unreadCount()) }));
      nav.appendChild(b);
    });
  }
  function childName(id) { var c = S.d.children.filter(function (x) { return x.id === id; })[0]; return c ? c.full_name : ''; }
  function empty(t) { return h('div', { class: 'card empty', text: t }); }
  function fileBtn(path, label) {
    var holder = h('span');
    var b = h('button', { class: 'btn small light', type: 'button', text: label || 'فتح الملف' });
    b.addEventListener('click', function () {
      lockBtn(b, async function () {
        try {
          var url = await C.signedUrl('private-docs', path, 60);      // رابط مؤقت (60 ثانية) بعد تحقق الخادم من الصلاحية
          holder.textContent = '';
          holder.appendChild(h('a', { class: 'btn small gold', href: url, target: '_blank', rel: 'noopener noreferrer', text: 'اضغط لفتح الملف (الرابط صالح دقيقة)' }));
        } catch (er) { toast(er.message, 'bad'); }
      });
    });
    holder.appendChild(b); return holder;
  }

  function vChildren(v) {
    if (!S.d.children.length) return v.appendChild(empty('لا توجد ملفات أطفال مرتبطة بحسابك بعد. تواصل مع إدارة المركز.'));
    S.d.children.forEach(function (c) {
      v.appendChild(h('div', { class: 'card' },
        h('h2', { text: c.full_name }),
        h('div', { class: 'meta' }, h('span', { text: CENTERS[c.center] || '' }), c.section ? h('span', { text: 'القسم: ' + c.section }) : null),
        c.basic_info ? h('p', { class: 'txt', text: c.basic_info }) : h('p', { class: 'muted small', text: 'لا توجد معلومات إضافية.' })));
    });
  }
  function vReports(v) {
    if (!S.d.reports.length) return v.appendChild(empty('لا توجد تقارير منشورة بعد.'));
    S.d.reports.forEach(function (r) {
      var card = h('div', { class: 'card' }, h('h2', { text: r.title }),
        h('div', { class: 'meta' }, h('span', { text: childName(r.child_id) }), h('span', { text: 'الفترة: ' + fmtDate(r.period_start) + ' – ' + fmtDate(r.period_end) }), h('span', { text: 'التاريخ: ' + fmtDate(r.report_date) })));
      [['المكتسبات', r.achievements], ['الأنشطة', r.activities], ['ملاحظات تربوية', r.notes]].forEach(function (p) {
        if (p[1]) card.appendChild(h('div', null, h('h3', { text: p[0] }), h('p', { class: 'txt', text: p[1] })));
      });
      if (r.attachment_path) card.appendChild(h('div', null, fileBtn(r.attachment_path, 'فتح المرفق (PDF/صورة)')));
      v.appendChild(card);
    });
  }
  function apptCard(a) {
    var cancelled = a.status === 'cancelled';
    return h('div', { class: 'card' }, h('h2', null, a.title, ' ', cancelled ? h('span', { class: 'badge bad', text: 'ملغى' }) : null),
      h('div', { class: 'meta' }, h('span', { text: fmtDate(a.starts_at, true) }), a.location ? h('span', { text: a.location }) : null,
        a.audience === 'child' ? h('span', { text: 'خاص بـ ' + childName(a.child_id) }) : h('span', { text: 'لجميع الأولياء' })),
      a.description ? h('p', { class: 'txt', text: a.description }) : null);
  }
  function vAppts(v) {
    var now = Date.now(), up = [], past = [];
    S.d.appts.forEach(function (a) { (a.status === 'scheduled' && new Date(a.starts_at).getTime() >= now ? up : past).push(a); });
    v.appendChild(h('div', { class: 'section-title' }, h('h2', { text: 'المواعيد القادمة' })));
    if (!up.length) v.appendChild(empty('لا توجد مواعيد قادمة.')); else up.forEach(function (a) { v.appendChild(apptCard(a)); });
    if (past.length) { v.appendChild(h('div', { class: 'section-title' }, h('h2', { text: 'السابقة والملغاة' }))); past.reverse().forEach(function (a) { v.appendChild(apptCard(a)); }); }
  }
  function vMsgs(v) {
    if (!S.d.msgs.length) return v.appendChild(empty('لا توجد رسائل أو إعلانات.'));
    S.d.msgs.forEach(function (m) {
      var unread = !S.reads[m.id];
      var card = h('div', { class: 'card' + (unread ? ' unread' : '') },
        h('h2', null, m.title, ' ', unread ? h('span', { class: 'badge', text: 'جديد' }) : null),
        h('div', { class: 'meta' }, h('span', { text: m.kind === 'message' ? 'رسالة شخصية' : 'إعلان' }), h('span', { text: fmtDate(m.published_at, true) })),
        h('p', { class: 'txt', text: m.body }));
      if (unread) {
        var b = h('button', { class: 'btn small light', type: 'button', text: 'تم الاطلاع' });
        b.addEventListener('click', function () {
          lockBtn(b, async function () {
            try {
              await C.rest('POST', '/message_reads?on_conflict=message_id,parent_id', { message_id: m.id, parent_id: S.me }, 'resolution=ignore-duplicates,return=minimal');
              S.reads[m.id] = true; render();
            } catch (er) { toast(er.message, 'bad'); }
          });
        });
        card.appendChild(b);
      }
      v.appendChild(card);
    });
  }
  function vDocs(v) {
    if (!S.d.docs.length) return v.appendChild(empty('لا توجد وثائق مشاركة معك.'));
    S.d.docs.forEach(function (d) {
      v.appendChild(h('div', { class: 'card' }, h('h2', { text: d.title }),
        h('div', { class: 'meta' }, h('span', { text: childName(d.child_id) }), d.category ? h('span', { text: d.category }) : null, h('span', { text: fmtDate(d.created_at) })),
        fileBtn(d.storage_path, 'فتح الوثيقة')));
    });
  }
  function render() {
    renderTabs();
    var v = $('#view'); v.textContent = '';
    ({ children: vChildren, reports: vReports, appts: vAppts, msgs: vMsgs, docs: vDocs })[S.tab](v);
  }

  /* ---------- التشغيل ---------- */
  function init() {
    if (!CFG.supabaseUrl || !CFG.supabaseKey) { $('#boot').textContent = 'إعدادات الاتصال غير مضبوطة.'; return; }
    C.onExpire(function () { showLogin('انتهت الجلسة. سجّل الدخول من جديد.'); });
    $('#loginForm').addEventListener('submit', submitLogin);
    $('#forgotBtn').addEventListener('click', function () { setMode('forgot'); });
    $('#backBtn').addEventListener('click', function () { setMode('login'); });
    $('#logoutBtn').addEventListener('click', function () { logout(); });
    var hash = C.adoptHash();
    if (hash && hash.error) { showLogin(hash.error); return; }
    if (hash && (hash.type === 'invite' || hash.type === 'recovery')) {
      show('login'); setMode('set', hash.type === 'invite' ? 'مرحبًا بك! اختر كلمة مرور لتفعيل حسابك.' : 'اختر كلمة مرور جديدة.'); return;
    }
    if (C.load()) enter(); else showLogin();
  }
  init();
})();
