/* لوحة إدارة الأطفال والأولياء. واجهة فقط: الصلاحيات الحقيقية في RLS ودالة admin-users.
   لا innerHTML: كل النصوص عبر DE.h (textContent). لا كلمات مرور تمرّ من هنا لحسابات الأولياء (دعوة بريدية). */
(function () {
  'use strict';
  var FILE_BUILD = '2026-10-19.3';
  if (window.top !== window.self) { document.body.textContent = ''; return; }

  var CFG = window.DE_CONFIG || {}, h = DE.h;
  var $ = function (s) { return document.querySelector(s); };
  var C = DE.Client(CFG, 'de_manage_session');
  var CENTERS = { main: 'المركز الرئيسي', work: 'مركز المساعدة على العمل', farm: 'المزرعة البيداغوجية' };
  var CENTER_OPTS = Object.keys(CENTERS).map(function (k) { return [k, CENTERS[k]]; });
  var S = { sec: 'dash', cache: {}, nav: 0, me: null, stopIdle: null };
  var TITLES = { dash: 'لوحة التحكم', children: 'الأطفال', parents: 'الأولياء', reports: 'التقارير التربوية', appts: 'المواعيد والأنشطة', msgs: 'الرسائل والإعلانات', docs: 'الوثائق', accounts: 'حسابات الإدارة', audit: 'سجل العمليات', settings: 'الأمان والإعدادات' };
  var AUDIT = { publish: 'نشر محتوى الموقع', load_version: 'تحميل نسخة سابقة', add_user: 'إضافة مدير', update_user: 'تحديث كود مدير', reset_password: 'تغيير كود مدير', remove_user: 'حذف مدير',
    'children:insert': 'إنشاء ملف طفل', 'children:delete': 'حذف ملف طفل', 'parent_profiles:insert': 'إنشاء ملف ولي', 'parent_profiles:delete': 'حذف ملف ولي',
    'parent:disable': 'تعطيل ولي', 'parent:enable': 'تفعيل ولي', 'parent:invite': 'دعوة ولي', 'parent:resend_invite': 'إعادة إرسال دعوة ولي', 'parent:disable_login': 'حظر دخول ولي', 'parent:enable_login': 'رفع حظر ولي',
    'parent_children:insert': 'ربط ولي بطفل', 'parent_children:delete': 'فك ربط ولي بطفل', 'progress_reports:insert': 'إنشاء تقرير', 'progress_reports:delete': 'حذف تقرير',
    'report:publish': 'نشر تقرير', 'report:unpublish': 'إلغاء نشر تقرير', 'appointments:insert': 'إضافة موعد', 'appointments:update': 'تعديل موعد', 'appointments:delete': 'حذف موعد',
    'messages:insert': 'إنشاء رسالة/إعلان', 'messages:delete': 'حذف رسالة/إعلان', 'documents:insert': 'رفع وثيقة', 'documents:delete': 'حذف وثيقة',
    'admin:invite': 'دعوة مدير', 'admin:disable': 'تعطيل مدير', 'admin:enable': 'تفعيل مدير' };

  /* ---------- أدوات ---------- */
  function fmt(v, t) { if (!v) return '—'; try { return new Date(v).toLocaleString('ar-DZ-u-nu-latn', t ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }); } catch (e) { return '—'; } }
  function toast(msg, kind) { var t = $('#toast'); t.textContent = msg; t.className = 'toast ' + (kind || ''); t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 4200); }
  function show(id) { ['boot', 'login', 'app'].forEach(function (x) { $('#' + x).hidden = x !== id; }); }
  function msg(el, m) { el.textContent = m || ''; el.hidden = !m; }
  function lock(btn, fn) {          // يمنع تكرار الطلبات
    if (btn.disabled) return Promise.resolve();
    btn.disabled = true;
    return Promise.resolve().then(fn).then(function (r) { btn.disabled = false; return r; }, function (e) { btn.disabled = false; throw e; });
  }
  function act(btn, fn, okMsg) {    // تنفيذ إجراء مع رسائل نجاح/فشل مفهومة
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

  var Q = {
    children: function () { return C.rest('GET', '/children?select=*&order=full_name'); },
    parents: function () { return C.rest('GET', '/parent_profiles?select=*&order=full_name'); },
    links: function () { return C.rest('GET', '/parent_children?select=parent_id,child_id'); },
    reports: function () { return C.rest('GET', '/progress_reports?select=*&order=report_date.desc'); },
    appts: function () { return C.rest('GET', '/appointments?select=*&order=starts_at.desc'); },
    msgs: function () { return C.rest('GET', '/messages?select=*&order=created_at.desc'); },
    reads: function () { return C.rest('GET', '/message_reads?select=message_id'); },
    docs: function () { return C.rest('GET', '/documents?select=*&order=created_at.desc'); }
  };
  async function get(k) { if (!S.cache[k]) S.cache[k] = await Q[k](); return S.cache[k]; }
  async function getMany() { var r = await Promise.all([].map.call(arguments, get)); return r; }
  function nameOf(list, id, key) { var x = list.filter(function (r) { return (r.id || r.user_id) === id; })[0]; return x ? x[key || 'full_name'] : '—'; }

  /* ---------- نوافذ ---------- */
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

  /* نموذج عام: حقول + تحقق + أزرار حفظ متعددة */
  function fieldEl(f, val) {
    var id = 'f_' + f.k, input, node, getv;
    var hint = h('small', { class: 'hint', text: f.hint || '' });
    if (f.type === 'textarea') { input = h('textarea', { id: id, maxlength: f.max || 2000, rows: 4 }); input.value = val || ''; getv = function () { return DE.clean(input.value, f.max || 2000); }; }
    else if (f.type === 'select') {
      input = h('select', { id: id }, h('option', { value: '', text: '— اختر —' }), (f.opts || []).map(function (o) { return h('option', { value: o[0], text: o[1] }); })); input.value = val == null ? '' : val; getv = function () { return input.value; };
    } else if (f.type === 'checkbox') {
      input = h('input', { id: id, type: 'checkbox' }); input.checked = !!val; getv = function () { return input.checked; };
    } else if (f.type === 'multi') {
      var set = {}; (val || []).forEach(function (x) { set[x] = true; });
      var boxes = (f.opts || []).map(function (o) { var cb = h('input', { type: 'checkbox', value: o[0] }); cb.checked = !!set[o[0]]; return { cb: cb, label: h('label', { class: 'chk' }, cb, o[1]) }; });
      input = h('div', { class: 'multi', id: id }, boxes.map(function (b) { return b.label; }));
      if (!boxes.length) input.appendChild(h('span', { class: 'muted small', text: 'لا توجد خيارات.' }));
      getv = function () { return boxes.filter(function (b) { return b.cb.checked; }).map(function (b) { return b.cb.value; }); };
    } else if (f.type === 'file') {
      input = h('input', { id: id, type: 'file', accept: f.accept || '' }); getv = function () { return input.files && input.files[0] || null; };
    } else {
      var t = f.type === 'datetime' ? 'datetime-local' : f.type || 'text';
      input = h('input', { id: id, type: t, maxlength: f.max || 200, dir: (t === 'email' || t === 'tel') ? 'ltr' : null, autocomplete: 'off' });
      input.value = val || '';
      getv = function () { return t === 'text' || t === 'email' || t === 'tel' ? DE.clean(input.value, f.max || 200) : input.value; };
    }
    node = f.type === 'checkbox'
      ? h('label', { class: 'chk' }, input, f.label)
      : h('label', { class: 'fld', for: id }, h('span', { text: f.label + (f.req ? ' *' : '') }), input, hint);
    return { node: node, get: getv, setError: function (e) { node.classList.toggle('bad', !!e); hint.textContent = e || f.hint || ''; hint.classList.toggle('bad', !!e); }, input: input };
  }
  function openForm(spec) {
    return new Promise(function (resolve) {
      var els = {}, body = h('div', { class: 'modal-body' }), err = h('p', { class: 'err', role: 'alert', hidden: true });
      var vals0 = spec.values || {};
      spec.fields.forEach(function (f) { els[f.k] = fieldEl(f, vals0[f.k]); body.appendChild(els[f.k].node); });
      function collect() { var v = {}; spec.fields.forEach(function (f) { v[f.k] = els[f.k].get(); }); return v; }
      function vis() { var v = collect(); spec.fields.forEach(function (f) { if (f.showIf) els[f.k].node.hidden = !f.showIf(v); }); }
      body.addEventListener('change', vis); vis();
      function validate() {
        var v = collect(), ok = true;
        spec.fields.forEach(function (f) {
          var e = '', x = v[f.k], hidden = f.showIf && !f.showIf(v);
          if (!hidden) {
            var empty = x === '' || x == null || (Array.isArray(x) && !x.length);
            if (f.req && f.type !== 'checkbox' && empty) e = 'هذا الحقل مطلوب.';
            else if (!empty && f.min && typeof x === 'string' && x.length < f.min) e = 'الحد الأدنى ' + f.min + ' أحرف.';
            else if (!empty && f.kind === 'email' && !DE.isEmail(x)) e = 'بريد إلكتروني غير صالح.';
            else if (!empty && f.kind === 'phone' && !DE.isPhone(x)) e = 'رقم هاتف غير صالح.';
            else if (!empty && f.kind === 'date' && !DE.isDate(x)) e = 'تاريخ غير صالح.';
            else if (!empty && f.maxItems && Array.isArray(x) && x.length > f.maxItems) e = 'الحد الأقصى ' + f.maxItems + ' عناصر.';
          }
          els[f.k].setError(e); if (e) ok = false;
        });
        if (ok && spec.validate) { var m = spec.validate(v); if (m) { msg(err, m); ok = false; } }
        return ok ? v : null;
      }
      var submits = (spec.submits || [{ key: 'save', label: 'حفظ' }]).map(function (s, i) {
        var b = h('button', { class: 'btn' + (i ? ' gold' : ''), type: 'button', text: s.label });
        b.addEventListener('click', function () {
          msg(err, ''); var v = validate(); if (!v) return;
          lock(b, async function () {
            try { await spec.onSubmit(v, s.key); closeModal(); resolve(true); } catch (e) { msg(err, e.message); }
          });
        });
        return b;
      });
      var cancel = h('button', { class: 'btn light', type: 'button', text: 'إلغاء', onclick: function () { closeModal(); resolve(false); } });
      openModal(h('div', { class: 'modal-body' }, h('h2', { text: spec.title }), body, err, h('div', { class: 'modal-actions' }, cancel, submits)));
    });
  }

  /* ---------- جدول عام: بحث + تصفية + ترتيب ---------- */
  function listView(v, spec) {
    var st = { q: '', sortI: -1, dir: 1, f: {} };
    var head = h('div', { class: 'section-title' }, h('h2', { text: spec.title }), spec.onAdd ? h('button', { class: 'btn gold', type: 'button', text: spec.addLabel, onclick: spec.onAdd }) : null);
    var tools = h('div', { class: 'toolbar' });
    var search = h('input', { type: 'search', placeholder: 'بحث…', 'aria-label': 'بحث', maxlength: 80 });
    search.addEventListener('input', function () { st.q = search.value.trim().toLowerCase(); draw(); });
    tools.appendChild(search);
    (spec.filters || []).forEach(function (f, i) {
      var sel = h('select', { 'aria-label': f.label }, h('option', { value: '', text: f.label + ': الكل' }), f.opts.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
      sel.addEventListener('change', function () { st.f[i] = sel.value; draw(); }); tools.appendChild(sel);
    });
    var wrap = h('div', { class: 'tbl-wrap' });
    function draw() {
      var rows = spec.rows.filter(function (r) {
        if (st.q && String(spec.search(r)).toLowerCase().indexOf(st.q) < 0) return false;
        return (spec.filters || []).every(function (f, i) { return !st.f[i] || f.test(r, st.f[i]); });
      });
      if (st.sortI >= 0) { var c = spec.cols[st.sortI]; rows.sort(function (a, b) { var x = c.sort(a), y = c.sort(b); return (x > y ? 1 : x < y ? -1 : 0) * st.dir; }); }
      wrap.textContent = '';
      if (!rows.length) { wrap.appendChild(h('div', { class: 'empty', text: spec.rows.length ? 'لا نتائج مطابقة.' : spec.empty })); return; }
      var tr = h('tr');
      spec.cols.forEach(function (c, i) {
        var th = h('th', { text: c.label + (st.sortI === i ? (st.dir > 0 ? ' ▲' : ' ▼') : ''), class: c.sort ? 'sortable' : '' });
        if (c.sort) th.addEventListener('click', function () { st.dir = st.sortI === i ? -st.dir : 1; st.sortI = i; draw(); });
        tr.appendChild(th);
      });
      tr.appendChild(h('th', { text: 'إجراءات' }));
      var tb = h('tbody');
      rows.forEach(function (r) {
        var row = h('tr'); spec.cols.forEach(function (c) { row.appendChild(h('td', { 'data-label': c.label }, c.get(r))); });
        row.appendChild(h('td', { 'data-label': 'إجراءات' }, h('div', { class: 'row-actions' }, spec.actions(r))));
        tb.appendChild(row);
      });
      wrap.appendChild(h('table', { class: 'tbl' }, h('thead', null, tr), tb));
    }
    v.appendChild(head); v.appendChild(tools); v.appendChild(wrap); draw();
  }
  function rbtn(text, fn, cls) { var b = h('button', { class: 'btn small ' + (cls || 'light'), type: 'button', text: text }); b.addEventListener('click', function () { act(b, function () { return fn(b); }); }); return b; }

  /* ---------- لوحة التحكم ---------- */
  async function secDash(v) {
    var c = await C.rpc('admin_family_counts');
    var items = [
      ['children', 'أطفال نشطون'],
      ['children_all', 'إجمالي ملفات الأطفال'],
      ['parents_active', 'أولياء مفعّلون'],
      ['parents_disabled', 'أولياء معطّلون'],
      ['parents_total', 'إجمالي الأولياء'],
      ['reports_published', 'تقارير منشورة'],
      ['reports_draft', 'تقارير مسودة'],
      ['appointments_upcoming', 'مواعيد قادمة'],
      ['messages_published', 'إعلانات ورسائل منشورة'],
      ['messages_draft', 'رسائل مسودة'],
      ['documents_total', 'إجمالي الوثائق'],
      ['documents_shared', 'وثائق مشاركة مع الأولياء']
    ];
    v.appendChild(h('div', { class: 'stats' }, items.map(function (i) {
      return h('div', { class: 'stat' },
        h('b', { text: String(c[i[0]] == null ? 0 : c[i[0]]) }),
        h('span', { text: i[1] })
      );
    })));
    v.appendChild(h('div', { class: 'card' },
      h('h2', { text: 'إدارة فضاء العائلات — اختصارات سريعة' }),
      h('p', { class: 'muted', text: 'الإحصاءات مستخرجة آليًا وبشكل دقيق من قاعدة البيانات الفعلية. لإدارة أي قسم استخدم الأزرار التالية أو القائمة الجانبية:' }),
      h('div', { class: 'row-actions' }, [
        ['children', 'إضافة / أرشفة طفل'],
        ['parents', 'دعوة ولي أمر'],
        ['reports', 'كتابة تقرير تربوي'],
        ['appts', 'جدولة موعد / نشاط'],
        ['msgs', 'نشر إعلان للأولياء'],
        ['docs', 'رفع وثيقة خاصة']
      ].map(function (x) {
        return h('button', { class: 'btn small', type: 'button', text: x[1], onclick: function () { go(x[0]); } });
      }))
    ));
  }

  /* ---------- الأطفال ---------- */
  async function secChildren(v) {
    var rows = await get('children');
    function edit(c) {
      return openForm({
        title: c ? 'تعديل ملف طفل' : 'إضافة طفل جديد', values: c || { active: true, center: 'main' },
        fields: [
          { k: 'full_name', label: 'الاسم الكامل', req: true, min: 2, max: 120 },
          { k: 'center', label: 'المركز / الملحقة', type: 'select', opts: CENTER_OPTS, req: true },
          { k: 'section', label: 'القسم / الورشة', max: 80 },
          { k: 'basic_info', label: 'معلومات أساسية يسمح المركز بمشاركتها مع الولي', type: 'textarea', max: 1000, hint: 'لا تُدخل تشخيصات طبية سرية؛ اكتب التوجيهات العامة المناسبة للولي.' },
          { k: 'photo_consent', label: 'يوجد إذن مكتوب من الولي بنشر صور الطفل علنًا', type: 'checkbox' },
          { k: 'active', label: 'الملف نشط (إلغاء التحديد ينقل الملف إلى الأرشيف)', type: 'checkbox' }
        ],
        onSubmit: async function (x) {
          var body = { full_name: x.full_name, center: x.center, section: x.section || null, basic_info: x.basic_info || null, photo_consent: x.photo_consent, active: x.active };
          if (c) await C.rest('PATCH', '/children?id=eq.' + uid(c.id), body); else await C.rest('POST', '/children', body);
          bust(); toast('تم حفظ ملف الطفل بنجاح.', 'ok'); go('children');
        }
      });
    }
    listView(v, {
      title: 'ملفات الأطفال', addLabel: 'إضافة طفل', onAdd: function () { edit(null); }, rows: rows, empty: 'لا توجد ملفات أطفال بعد.',
      search: function (r) { return r.full_name + ' ' + (r.section || ''); },
      filters: [
        { label: 'المركز', opts: CENTER_OPTS, test: function (r, x) { return r.center === x; } },
        { label: 'الحالة', opts: [['1', 'نشط'], ['0', 'مؤرشف']], test: function (r, x) { return String(+r.active) === x; } }
      ],
      cols: [
        { label: 'الاسم الكامل', get: function (r) { return r.full_name; }, sort: function (r) { return r.full_name; } },
        { label: 'المركز', get: function (r) { return CENTERS[r.center]; }, sort: function (r) { return r.center; } },
        { label: 'القسم', get: function (r) { return r.section || '—'; } },
        { label: 'الحالة', get: function (r) { return badge(r.active ? 'نشط' : 'مؤرشف', r.active ? 'ok' : 'gray'); } },
        { label: 'إذن الصور', get: function (r) { return r.photo_consent ? badge('موافق', 'ok') : badge('غير مصرح', 'gray'); } }
      ],
      actions: function (r) {
        return [
          rbtn('تعديل', function () { return edit(r); }),
          rbtn(r.active ? 'أرشفة' : 'استعادة', async function () {
            await C.rest('PATCH', '/children?id=eq.' + uid(r.id), { active: !r.active });
            bust(); toast(r.active ? 'تم نقل الملف إلى الأرشيف.' : 'تمت استعادة الملف إلى الحالة النشطة.', 'ok');
            go('children');
          }, r.active ? 'light' : 'gold'),
          rbtn('حذف', async function () {
            if (!(await ask({
              title: 'تنبيه بشأن حذف ملف الطفل',
              msg: 'سيُحذف الملف وروابطه نهائيًا. وفق سياسة المؤسسة: يُفضَّل دائمًا «أرشفة الملف» بدلًا من حذفه للحفاظ على السجلات التاريخية. هل تريد الحذف النهائي رغم ذلك؟',
              ok: 'حذف نهائي', danger: true
            }))) return;
            await C.rest('DELETE', '/children?id=eq.' + uid(r.id));
            bust(); toast('تم حذف الملف.', 'ok'); go('children');
          }, 'danger')
        ];
      }
    });
  }

  /* ---------- الأولياء ---------- */
  async function secParents(v) {
    var d = await getMany('parents', 'links', 'children'), rows = d[0], links = d[1], kids = d[2];
    function kidsOf(pid) { return links.filter(function (l) { return l.parent_id === pid; }).map(function (l) { return l.child_id; }); }
    var kidOpts = kids.map(function (k) { return [k.id, k.full_name]; });

    function invite() {
      return openForm({
        title: 'دعوة ولي أمر جديد', submits: [{ key: 'go', label: 'إرسال الدعوة الآمنة' }],
        fields: [
          { k: 'full_name', label: 'اسم ولي الأمر الكامل', req: true, min: 2, max: 120 },
          { k: 'email', label: 'البريد الإلكتروني للولي', type: 'email', req: true, kind: 'email', max: 254, hint: 'ستصل الولي دعوة عبر البريد لتعيين كلمة مروره بنفسه وبأمان.' },
          { k: 'phone', label: 'رقم الهاتف (اختياري)', type: 'tel', kind: 'phone', max: 25 },
          { k: 'child_ids', label: 'الأبناء المرتبطون بحسابه', type: 'multi', opts: kidOpts, maxItems: 10, hint: 'يمكن تحديد طفل أو أكثر لربطهم بحساب الولي مباشرة.' }
        ],
        onSubmit: async function (x) {
          var body = { action: 'invite_parent', email: x.email.toLowerCase(), full_name: x.full_name, child_ids: x.child_ids };
          if (x.phone) body.phone = x.phone;
          await C.fn('admin-users', body); bust(); toast('أُرسلت الدعوة بنجاح إلى بريد ولي الأمر.', 'ok'); go('parents');
        }
      });
    }

    function editParent(p) {
      return openForm({
        title: 'تعديل بيانات الولي: ' + p.full_name, values: p,
        fields: [
          { k: 'full_name', label: 'الاسم الكامل', req: true, min: 2, max: 120 },
          { k: 'phone', label: 'رقم الهاتف', type: 'tel', kind: 'phone', max: 25 }
        ],
        onSubmit: async function (x) {
          await C.rest('PATCH', '/parent_profiles?user_id=eq.' + uid(p.user_id), { full_name: x.full_name, phone: x.phone || null });
          bust(); toast('تم تعديل بيانات ولي الأمر بنجاح.', 'ok'); go('parents');
        }
      });
    }

    function relink(p) {
      var cur = kidsOf(p.user_id);
      return openForm({
        title: 'ربط الأبناء بـ ' + p.full_name, fields: [{ k: 'child_ids', label: 'الأبناء المصرح للولي بالوصول لملفاتهم', type: 'multi', opts: kidOpts, maxItems: 10 }], values: { child_ids: cur },
        onSubmit: async function (x) {
          var add = x.child_ids.filter(function (i) { return cur.indexOf(i) < 0; }), del = cur.filter(function (i) { return x.child_ids.indexOf(i) < 0; });
          if (del.length) await C.rest('DELETE', '/parent_children?parent_id=eq.' + uid(p.user_id) + '&child_id=in.(' + del.map(uid).join(',') + ')');
          if (add.length) await C.rest('POST', '/parent_children', add.map(function (i) { return { parent_id: p.user_id, child_id: i }; }));
          bust(); toast('تم تحديث ربط الأبناء بنجاح.', 'ok'); go('parents');
        }
      });
    }

    listView(v, {
      title: 'حسابات الأولياء', addLabel: 'دعوة ولي أمر', onAdd: invite, rows: rows, empty: 'لا توجد حسابات أولياء بعد.',
      search: function (r) { return r.full_name + ' ' + (r.email || '') + ' ' + (r.phone || ''); },
      filters: [{ label: 'الحالة', opts: [['0', 'مفعّل'], ['1', 'معطَّل']], test: function (r, x) { return String(+r.disabled) === x; } }],
      cols: [
        { label: 'الاسم الكامل', get: function (r) { return r.full_name; }, sort: function (r) { return r.full_name; } },
        { label: 'البريد الإلكتروني', get: function (r) { return r.email || '—'; } },
        { label: 'الهاتف', get: function (r) { return r.phone || '—'; } },
        { label: 'الأبناء المرتبطون', get: function (r) { var n = kidsOf(r.user_id).map(function (i) { return nameOf(kids, i); }); return n.length ? n.join('، ') : 'لا يوجد'; } },
        { label: 'تاريخ التسجيل', get: function (r) { return fmt(r.created_at); }, sort: function (r) { return r.created_at; } },
        { label: 'الحالة', get: function (r) { return badge(r.disabled ? 'معطَّل' : 'مفعّل', r.disabled ? 'bad' : 'ok'); } }
      ],
      actions: function (r) {
        return [
          rbtn('تعديل', function () { return editParent(r); }),
          rbtn('ربط الأبناء', function () { return relink(r); }),
          rbtn('إعادة إرسال الرابط', async function () {
            if (r.disabled) return toast('الحساب معطّل؛ فعّله أولاً قبل إرسال الرابط.', 'bad');
            if (!(await ask({
              title: 'إعادة إرسال رابط التفعيل / الاستعادة؟',
              msg: 'سيُرسل بريد إلكتروني يحتوي على رابط آمن إلى: ' + (r.email || 'البريد المسجل') + '. هل تريد المتابعة؟',
              ok: 'إرسال الرابط'
            }))) return;
            await C.fn('admin-users', { action: 'resend_parent_invite', user_id: uid(r.user_id) });
            toast('تم إرسال الرابط بنجاح إلى بريد الولي.', 'ok');
          }),
          rbtn(r.disabled ? 'تفعيل' : 'تعطيل', async function () {
            if (!r.disabled && !(await ask({
              title: 'تعطيل حساب الولي؟',
              msg: 'لن يتمكن ولي الأمر من تسجيل الدخول أو الاطلاع على أي ملفات حتى تعيد تفعيل حسابه.',
              ok: 'تعطيل الحساب', danger: true
            }))) return;
            await C.fn('admin-users', { action: 'set_parent_disabled', user_id: uid(r.user_id), disabled: !r.disabled });
            bust(); toast('تم تحديث حالة الحساب.', 'ok'); go('parents');
          }, r.disabled ? 'gold' : 'danger')
        ];
      }
    });
  }

  /* ---------- التقارير ---------- */
  function reportPreview(r, kids) {
    var box = h('div', { class: 'preview-box' }, h('h3', { text: r.title }),
      h('div', { class: 'meta' }, h('span', { text: nameOf(kids, r.child_id) }), h('span', { text: 'الفترة: ' + fmt(r.period_start) + ' – ' + fmt(r.period_end) })));
    [['المكتسبات', r.achievements], ['الأنشطة', r.activities], ['ملاحظات تربوية', r.notes]].forEach(function (p) { if (p[1]) box.appendChild(h('div', null, h('h3', { text: p[0] }), h('p', { class: 'pre', text: p[1] }))); });
    if (r.attachment_path) box.appendChild(h('p', { class: 'muted small', text: '📎 يوجد مرفق.' }));
    return box;
  }
  async function uploadChecked(file, childId) {     // فحص كامل ثم رفع باسم UUID إلى الحاوية الخاصة
    var bytes = await readBytes(file);
    var chk = DE.checkFile({ name: file.name, size: file.size, type: file.type, bytes: bytes });
    if (!chk.ok) throw new Error(chk.error);
    var path = DE.objectPath(uid(childId), chk.ext);
    await C.upload('private-docs', path, bytes, chk.mime);
    return { path: path, mime: chk.mime, size: bytes.length };
  }
  async function secReports(v) {
    var d = await getMany('reports', 'children'), rows = d[0], kids = d[1];
    var kidOpts = kids.map(function (k) { return [k.id, k.full_name]; });
    function edit(r) {
      return openForm({
        title: r ? 'تعديل تقرير' : 'تقرير تربوي جديد', values: r || { report_date: new Date().toISOString().slice(0, 10) },
        submits: r && r.status === 'published' ? [{ key: 'save', label: 'حفظ التعديلات (منشور)' }] : [{ key: 'draft', label: 'حفظ كمسودة' }, { key: 'publish', label: 'حفظ ونشر للولي' }],
        fields: [{ k: 'child_id', label: 'الطفل', type: 'select', opts: kidOpts, req: true }, { k: 'title', label: 'عنوان التقرير', req: true, max: 150 },
          { k: 'report_date', label: 'تاريخ التقرير', type: 'date', req: true, kind: 'date' }, { k: 'period_start', label: 'بداية الفترة', type: 'date', req: true, kind: 'date' }, { k: 'period_end', label: 'نهاية الفترة', type: 'date', req: true, kind: 'date' },
          { k: 'achievements', label: 'المكتسبات', type: 'textarea', max: 5000 }, { k: 'activities', label: 'الأنشطة', type: 'textarea', max: 5000 }, { k: 'notes', label: 'ملاحظات تربوية', type: 'textarea', max: 5000 },
          { k: 'file', label: 'مرفق (اختياري): PDF أو صورة، حتى 5MB', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp', hint: r && r.attachment_path ? 'يوجد مرفق حالي؛ اختيار ملف جديد يستبدله.' : '' }],
        validate: function (x) {
          if (x.period_end < x.period_start) return 'نهاية الفترة قبل بدايتها.';
        },
        onSubmit: async function (x, key) {
          if ((key === 'publish' || (r && r.status === 'published')) && !(x.achievements || x.activities || x.notes)) throw new Error('اكتب محتوى واحدًا على الأقل قبل النشر.');
          var up = x.file ? await uploadChecked(x.file, x.child_id) : null;
          var body = { child_id: x.child_id, title: x.title, report_date: x.report_date, period_start: x.period_start, period_end: x.period_end,
            achievements: x.achievements || null, activities: x.activities || null, notes: x.notes || null, status: key === 'publish' ? 'published' : (r ? r.status : 'draft') };
          if (up) body.attachment_path = up.path;
          try { if (r) await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), body); else await C.rest('POST', '/progress_reports', body); }
          catch (e) { if (up) C.removeObject('private-docs', up.path).catch(function () { }); throw e; }   // لا نترك ملفًا يتيمًا
          if (up && r && r.attachment_path) C.removeObject('private-docs', r.attachment_path).catch(function () { });
          bust(); toast(key === 'publish' ? 'تم النشر.' : 'حُفظت المسودة.', 'ok'); go('reports');
        }
      });
    }
    listView(v, {
      title: 'التقارير التربوية', addLabel: 'تقرير جديد', onAdd: function () { if (!kids.length) return toast('أضف طفلًا أولًا.', 'bad'); edit(null); }, rows: rows, empty: 'لا توجد تقارير بعد.',
      search: function (r) { return r.title + ' ' + nameOf(kids, r.child_id); },
      filters: [{ label: 'الطفل', opts: kidOpts, test: function (r, x) { return r.child_id === x; } }, { label: 'الحالة', opts: [['draft', 'مسودة'], ['published', 'منشور']], test: function (r, x) { return r.status === x; } }],
      cols: [{ label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } }, { label: 'الطفل', get: function (r) { return nameOf(kids, r.child_id); } },
        { label: 'التاريخ', get: function (r) { return fmt(r.report_date); }, sort: function (r) { return r.report_date; } },
        { label: 'الحالة', get: function (r) { return badge(r.status === 'published' ? 'منشور' : 'مسودة', r.status === 'published' ? 'ok' : ''); } },
        { label: 'آخر تعديل', get: function (r) { return fmt(r.updated_at, true); }, sort: function (r) { return r.updated_at; } }],
      actions: function (r) {
        var pub = r.status === 'published';
        return [rbtn('تعديل', function () { return edit(r); }), rbtn('معاينة', async function () { info('معاينة كما يراها الولي', reportPreview(r, kids)); }),
          rbtn(pub ? 'إلغاء النشر' : 'نشر', async function () {
            if (!(await ask({ title: pub ? 'إلغاء نشر التقرير؟' : 'نشر التقرير؟', msg: pub ? 'سيختفي التقرير عن الولي فورًا.' : 'سيظهر التقرير لولي هذا الطفل فقط.', ok: pub ? 'إلغاء النشر' : 'نشر' }))) return;
            await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), { status: pub ? 'draft' : 'published' }); bust(); toast('تم.', 'ok'); go('reports');
          }, pub ? 'light' : 'gold'),
          rbtn('حذف', async function () {
            if (!(await ask({ title: 'حذف التقرير؟', msg: 'سيُحذف التقرير ومرفقه نهائيًا ولا يمكن التراجع.', ok: 'حذف نهائي', danger: true }))) return;
            await C.rest('DELETE', '/progress_reports?id=eq.' + uid(r.id));
            if (r.attachment_path) C.removeObject('private-docs', r.attachment_path).catch(function () { });
            bust(); toast('تم الحذف.', 'ok'); go('reports');
          }, 'danger')];
      }
    });
  }

  /* ---------- المواعيد ---------- */
  async function secAppts(v) {
    var d = await getMany('appts', 'children'), rows = d[0], kids = d[1];
    var kidOpts = kids.map(function (k) { return [k.id, k.full_name]; });
    function edit(a) {
      return openForm({
        title: a ? 'تعديل موعد' : 'موعد / نشاط جديد', values: a ? Object.assign({}, a, { starts_at: toLocalInput(a.starts_at), ends_at: toLocalInput(a.ends_at) }) : { audience: 'all' },
        fields: [{ k: 'title', label: 'العنوان', req: true, max: 150 }, { k: 'description', label: 'الوصف', type: 'textarea', max: 2000 },
          { k: 'starts_at', label: 'البداية', type: 'datetime', req: true }, { k: 'ends_at', label: 'النهاية (اختياري)', type: 'datetime' }, { k: 'location', label: 'المكان', max: 150 },
          { k: 'audience', label: 'موجّه إلى', type: 'select', opts: [['all', 'جميع الأولياء'], ['child', 'ولي طفل معيّن']], req: true },
          { k: 'child_id', label: 'الطفل', type: 'select', opts: kidOpts, req: true, showIf: function (x) { return x.audience === 'child'; } }],
        validate: function (x) { if (x.ends_at && x.ends_at < x.starts_at) return 'وقت النهاية قبل البداية.'; },
        onSubmit: async function (x) {
          var body = { title: x.title, description: x.description || null, starts_at: isoFromLocal(x.starts_at), ends_at: x.ends_at ? isoFromLocal(x.ends_at) : null, location: x.location || null, audience: x.audience, child_id: x.audience === 'child' ? x.child_id : null };
          if (a) await C.rest('PATCH', '/appointments?id=eq.' + uid(a.id), body); else await C.rest('POST', '/appointments', body);
          bust(); toast('تم الحفظ.', 'ok'); go('appts');
        }
      });
    }
    listView(v, {
      title: 'المواعيد والأنشطة', addLabel: 'موعد جديد', onAdd: function () { edit(null); }, rows: rows, empty: 'لا توجد مواعيد.',
      search: function (r) { return r.title + ' ' + (r.location || ''); },
      filters: [{ label: 'الحالة', opts: [['scheduled', 'قائم'], ['cancelled', 'ملغى']], test: function (r, x) { return r.status === x; } },
        { label: 'الوقت', opts: [['up', 'القادمة'], ['past', 'السابقة']], test: function (r, x) { return (new Date(r.starts_at) >= new Date()) === (x === 'up'); } }],
      cols: [{ label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } }, { label: 'الموعد', get: function (r) { return fmt(r.starts_at, true); }, sort: function (r) { return r.starts_at; } },
        { label: 'المكان', get: function (r) { return r.location || '—'; } }, { label: 'الموجّه إليه', get: function (r) { return r.audience === 'all' ? 'الجميع' : nameOf(kids, r.child_id); } },
        { label: 'الحالة', get: function (r) { return badge(r.status === 'cancelled' ? 'ملغى' : 'قائم', r.status === 'cancelled' ? 'bad' : 'ok'); } }],
      actions: function (r) {
        return [rbtn('تعديل', function () { return edit(r); }),
          rbtn(r.status === 'cancelled' ? 'استعادة' : 'إلغاء الموعد', async function () { await C.rest('PATCH', '/appointments?id=eq.' + uid(r.id), { status: r.status === 'cancelled' ? 'scheduled' : 'cancelled' }); bust(); go('appts'); }),
          rbtn('حذف', async function () { if (!(await ask({ title: 'حذف الموعد؟', msg: 'لا يمكن التراجع. للإبقاء على أثر للأولياء استخدم «إلغاء الموعد».', ok: 'حذف', danger: true }))) return; await C.rest('DELETE', '/appointments?id=eq.' + uid(r.id)); bust(); go('appts'); }, 'danger')];
      }
    });
  }

  /* ---------- الرسائل والإعلانات ---------- */
  async function secMsgs(v) {
    var d = await getMany('msgs', 'children', 'parents', 'reads'), rows = d[0], kids = d[1], pars = d[2], reads = d[3];
    var kidOpts = kids.map(function (k) { return [k.id, k.full_name]; }), parOpts = pars.map(function (p) { return [p.user_id, p.full_name]; });
    function readCount(id) { return reads.filter(function (x) { return x.message_id === id; }).length; }
    function edit(m) {
      return openForm({
        title: m ? 'تعديل رسالة/إعلان' : 'رسالة / إعلان جديد', values: m || { kind: 'announcement', audience: 'all' },
        submits: m && m.published_at ? [{ key: 'save', label: 'حفظ التعديلات (منشور)' }] : [{ key: 'draft', label: 'حفظ كمسودة' }, { key: 'publish', label: 'نشر الآن' }],
        fields: [{ k: 'kind', label: 'النوع', type: 'select', opts: [['announcement', 'إعلان'], ['message', 'رسالة شخصية']], req: true },
          { k: 'audience', label: 'المستلمون', type: 'select', opts: [['all', 'جميع الأولياء'], ['parent', 'ولي معيّن'], ['child', 'أولياء طفل معيّن']], req: true },
          { k: 'parent_id', label: 'الولي', type: 'select', opts: parOpts, req: true, showIf: function (x) { return x.audience === 'parent'; } },
          { k: 'child_id', label: 'الطفل', type: 'select', opts: kidOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'title', label: 'العنوان', req: true, max: 150 }, { k: 'body', label: 'النص', type: 'textarea', req: true, max: 5000 }],
        onSubmit: async function (x, key) {
          var body = { kind: x.kind, audience: x.audience, parent_id: x.audience === 'parent' ? x.parent_id : null, child_id: x.audience === 'child' ? x.child_id : null, title: x.title, body: x.body };
          if (key === 'publish') body.published_at = new Date().toISOString(); else if (!m) body.published_at = null;   // 'save' على رسالة منشورة لا يغيّر تاريخ النشر
          if (m) await C.rest('PATCH', '/messages?id=eq.' + uid(m.id), body); else await C.rest('POST', '/messages', body);
          bust(); toast(key === 'publish' ? 'تم النشر.' : 'حُفظت المسودة.', 'ok'); go('msgs');
        }
      });
    }
    function to(r) { return r.audience === 'all' ? 'جميع الأولياء' : r.audience === 'parent' ? 'ولي: ' + nameOf(pars, r.parent_id) : 'أولياء: ' + nameOf(kids, r.child_id); }
    listView(v, {
      title: 'الرسائل والإعلانات', addLabel: 'جديد', onAdd: function () { edit(null); }, rows: rows, empty: 'لا توجد رسائل.',
      search: function (r) { return r.title + ' ' + to(r); },
      filters: [{ label: 'النوع', opts: [['announcement', 'إعلان'], ['message', 'رسالة']], test: function (r, x) { return r.kind === x; } }, { label: 'الحالة', opts: [['d', 'مسودة'], ['p', 'منشور']], test: function (r, x) { return (r.published_at ? 'p' : 'd') === x; } }],
      cols: [{ label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } }, { label: 'النوع', get: function (r) { return r.kind === 'message' ? 'رسالة' : 'إعلان'; } },
        { label: 'المستلمون', get: to }, { label: 'الحالة', get: function (r) { return r.published_at ? badge('منشور ' + fmt(r.published_at), 'ok') : badge('مسودة'); } },
        { label: 'قرأها', get: function (r) { return r.published_at ? String(readCount(r.id)) : '—'; } }],
      actions: function (r) {
        return [rbtn('تعديل', function () { return edit(r); }),
          r.published_at ? null : rbtn('نشر', async function () { await C.rest('PATCH', '/messages?id=eq.' + uid(r.id), { published_at: new Date().toISOString() }); bust(); toast('تم النشر.', 'ok'); go('msgs'); }, 'gold'),
          rbtn('حذف', async function () { if (!(await ask({ title: 'حذف الرسالة؟', msg: 'ستختفي من حسابات الأولياء ولا يمكن التراجع.', ok: 'حذف', danger: true }))) return; await C.rest('DELETE', '/messages?id=eq.' + uid(r.id)); bust(); go('msgs'); }, 'danger')];
      }
    });
  }

  /* ---------- الوثائق ---------- */
  async function secDocs(v) {
    var d = await getMany('docs', 'children'), rows = d[0], kids = d[1];
    var kidOpts = kids.map(function (k) { return [k.id, k.full_name]; });
    function upload() {
      return openForm({
        title: 'رفع وثيقة خاصة', submits: [{ key: 'up', label: 'رفع' }],
        fields: [{ k: 'child_id', label: 'الطفل', type: 'select', opts: kidOpts, req: true }, { k: 'title', label: 'عنوان الوثيقة', req: true, max: 150 }, { k: 'category', label: 'التصنيف (اختياري)', max: 60 },
          { k: 'file', label: 'الملف (PDF/JPG/PNG/WebP — حتى 5MB)', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp', req: true },
          { k: 'shared', label: 'شارك الوثيقة مع ولي الطفل', type: 'checkbox' }],
        onSubmit: async function (x) {
          var up = await uploadChecked(x.file, x.child_id);
          try { await C.rest('POST', '/documents', { title: x.title, category: x.category || null, child_id: x.child_id, storage_path: up.path, mime_type: up.mime, size_bytes: up.size, shared_with_parent: x.shared }); }
          catch (e) { C.removeObject('private-docs', up.path).catch(function () { }); throw e; }
          bust(); toast('تم الرفع.', 'ok'); go('docs');
        }
      });
    }
    listView(v, {
      title: 'الوثائق الخاصة', addLabel: 'رفع وثيقة', onAdd: function () { if (!kids.length) return toast('أضف طفلًا أولًا.', 'bad'); upload(); }, rows: rows, empty: 'لا توجد وثائق.',
      search: function (r) { return r.title + ' ' + (r.category || '') + ' ' + nameOf(kids, r.child_id); },
      filters: [{ label: 'الطفل', opts: kidOpts, test: function (r, x) { return r.child_id === x; } }, { label: 'المشاركة', opts: [['1', 'مشاركة'], ['0', 'غير مشاركة']], test: function (r, x) { return String(+r.shared_with_parent) === x; } }],
      cols: [{ label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } }, { label: 'الطفل', get: function (r) { return nameOf(kids, r.child_id); } },
        { label: 'النوع', get: function (r) { return r.mime_type.split('/')[1].toUpperCase() + ' · ' + size(r.size_bytes); } },
        { label: 'مع الولي', get: function (r) { return badge(r.shared_with_parent ? 'مشاركة' : 'خاصة', r.shared_with_parent ? 'ok' : 'gray'); } },
        { label: 'التاريخ', get: function (r) { return fmt(r.created_at); }, sort: function (r) { return r.created_at; } }],
      actions: function (r) {
        return [rbtn('فتح', async function () {
          var url = await C.signedUrl('private-docs', r.storage_path, 60);
          info('رابط مؤقت (دقيقة واحدة)', h('a', { class: 'btn gold', href: url, target: '_blank', rel: 'noopener noreferrer', text: 'فتح الملف' }));
        }),
          rbtn(r.shared_with_parent ? 'إيقاف المشاركة' : 'مشاركة مع الولي', async function () { await C.rest('PATCH', '/documents?id=eq.' + uid(r.id), { shared_with_parent: !r.shared_with_parent }); bust(); go('docs'); }),
          rbtn('حذف', async function () {
            if (!(await ask({ title: 'حذف الوثيقة؟', msg: 'سيُحذف الملف نهائيًا من التخزين.', ok: 'حذف نهائي', danger: true }))) return;
            await C.rest('DELETE', '/documents?id=eq.' + uid(r.id));
            try { await C.removeObject('private-docs', r.storage_path); } catch (e) { toast('حُذف السجل لكن تعذّر حذف الملف من التخزين؛ احذفه يدويًا من Supabase ▸ Storage.', 'bad'); }
            bust(); go('docs');
          }, 'danger')];
      }
    });
  }

  /* ---------- حسابات الإدارة (للمالك) ---------- */
  async function secAccounts(v) {
    var r = await C.rpc('admin_list'), canManage = !!r.can_manage;
    v.appendChild(h('div', { class: 'card' }, h('p', { class: 'muted', text: canManage ? 'أنت المالك: يمكنك دعوة مديرين وتعطيلهم. المحرّر (editor) يدير محتوى الموقع والوسائط فقط ولا يرى بيانات الأطفال والأولياء. لا يُحذف المالك ولا يُعطَّل.' : 'عرض فقط. دعوة وتعطيل الحسابات الإدارية للمالك وحده.' })));
    function invite() {
      return openForm({
        title: 'دعوة مدير', submits: [{ key: 'go', label: 'إرسال الدعوة' }],
        fields: [{ k: 'email', label: 'البريد الإلكتروني', type: 'email', req: true, kind: 'email', max: 254 }, { k: 'role', label: 'الدور', type: 'select', req: true, opts: [['admin', 'مدير (كل الصلاحيات)'], ['editor', 'محرّر (محتوى الموقع فقط)']] }],
        onSubmit: async function (x) { await C.fn('admin-users', { action: 'invite_admin', email: x.email.toLowerCase(), role: x.role }); bust(); toast('أُرسلت الدعوة.', 'ok'); go('accounts'); }
      });
    }
    listView(v, {
      title: 'الحسابات الإدارية', addLabel: canManage ? 'دعوة مدير' : '', onAdd: canManage ? invite : null, rows: r.admins, empty: 'لا حسابات.',
      search: function (a) { return a.email; },
      cols: [{ label: 'البريد', get: function (a) { return a.email + (a.is_owner ? ' (المالك)' : a.is_me ? ' (أنت)' : ''); }, sort: function (a) { return a.email; } },
        { label: 'الدور', get: function (a) { return a.is_owner ? 'مالك' : a.role === 'editor' ? 'محرّر' : 'مدير'; } },
        { label: 'آخر دخول', get: function (a) { return fmt(a.last_sign_in_at, true); } },
        { label: 'الحالة', get: function (a) { return badge(a.disabled ? 'معطَّل' : 'مفعّل', a.disabled ? 'bad' : 'ok'); } }],
      actions: function (a) {
        if (!canManage || a.is_owner || a.is_me) return [];
        return [rbtn(a.disabled ? 'تفعيل' : 'تعطيل', async function () {
          if (!a.disabled && !(await ask({ title: 'تعطيل هذا المدير؟', msg: 'سيفقد صلاحياته فورًا ولن يستطيع الدخول.', ok: 'تعطيل', danger: true }))) return;
          await C.fn('admin-users', { action: 'set_admin_disabled', user_id: uid(a.id), disabled: !a.disabled }); bust(); toast('تم.', 'ok'); go('accounts');
        }, a.disabled ? 'gold' : 'danger')];
      }
    });
  }

  /* ---------- سجل العمليات ---------- */
  async function secAudit(v) {
    var rows = await C.rpc('admin_audit_list', { p_limit: 100 });
    v.appendChild(h('div', { class: 'card' }, h('p', { class: 'muted small', text: 'يُسجَّل نوع العملية ومنفّذها ومعرّف السجل فقط — دون أسماء أطفال أو محتوى تقارير أو كلمات مرور. يُحتفظ بآخر 1000 عملية.' })));
    listView(v, {
      title: 'آخر العمليات', rows: rows, empty: 'لا عمليات مسجّلة.', search: function (r) { return (AUDIT[r.action] || r.action) + ' ' + (r.actor_email || ''); },
      cols: [{ label: 'الوقت', get: function (r) { return fmt(r.at, true); }, sort: function (r) { return r.at; } }, { label: 'المنفّذ', get: function (r) { return r.actor_email || 'النظام'; } },
        { label: 'العملية', get: function (r) { return AUDIT[r.action] || r.action; } }, { label: 'المعرّف', get: function (r) { return r.target || '—'; } }],
      actions: function () { return []; }
    });
  }

  /* ---------- الأمان والإعدادات ---------- */
  async function secSettings(v) {
    var me = await C.me(), mfa = ((me && me.factors) || []).some(function (f) { return f.status === 'verified'; });
    v.appendChild(h('div', { class: 'card' }, h('h2', { text: 'المصادقة الثنائية' }), h('p', null, badge(mfa ? 'مفعّلة لحسابك' : 'غير مفعّلة', mfa ? 'ok' : 'bad')),
      h('p', { class: 'muted', text: mfa ? 'ممتاز. لإلزامها على كل الحسابات في قاعدة البيانات شغّل 03-enforce-mfa.sql بعد أن يفعّلها كل المديرين.' : 'فعّلها من admin.html ▸ النشر والأمان (تطبيق مصادقة مثل Google Authenticator).' })));
    v.appendChild(h('div', { class: 'card' }, h('h2', { text: 'حدود الرفع' }), h('p', { class: 'muted', text: 'الملفات الخاصة: PDF وJPG وPNG وWebP، حتى 5 ميغابايت للملف. يُتحقق من الامتداد والنوع الحقيقي للملف (وليس ما يعلنه المتصفح) وتُسمّى الملفات بمعرّفات عشوائية. الفيديو والصور العامة تُدار من «محتوى الموقع والوسائط».' })));
    v.appendChild(h('div', { class: 'card' }, h('h2', { text: 'الجلسة' }), h('p', { class: 'muted', text: 'تنتهي الجلسة بإغلاق التبويب، ويخرج المتصفح تلقائيًا بعد 30 دقيقة بلا نشاط (راحة للمستخدم؛ مدة الجلسة الفعلية يضبطها Supabase حسب خطتك).' })));
    v.appendChild(h('div', { class: 'card' }, h('h2', { text: 'النسخ الاحتياطي' }), h('p', { class: 'muted', text: 'نسخ قاعدة البيانات في Supabase لا تشمل ملفات Storage (مثل private-docs). صدّر الملفات دوريًا وخزّنها في مكان خاص، ولا تضع بيانات الأطفال الحقيقية في GitHub.' })));
  }

  /* ---------- التنقل والتشغيل ---------- */
  var SECS = { dash: secDash, children: secChildren, parents: secParents, reports: secReports, appts: secAppts, msgs: secMsgs, docs: secDocs, accounts: secAccounts, audit: secAudit, settings: secSettings };
  async function go(sec) {
    S.sec = sec; var n = ++S.nav, v = $('#view');
    $('#secTitle').textContent = TITLES[sec];
    [].forEach.call(document.querySelectorAll('#nav [data-sec]'), function (b) { if (b.dataset.sec === sec) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (window.innerWidth <= 860) $('#app').classList.remove('nav-toggled');
    v.textContent = ''; v.appendChild(h('div', { class: 'empty', text: 'جارٍ التحميل…' }));
    var box = h('div');
    try { await SECS[sec](box); } catch (e) { box = h('div', { class: 'err', role: 'alert', text: e.message }); }
    if (n !== S.nav) return;                    // تنقّل أحدث ألغى هذا العرض
    v.textContent = ''; v.appendChild(box); window.scrollTo(0, 0);
  }

  var mode = 'creds';
  function setMode(m) { mode = m; $('#stCreds').hidden = m !== 'creds'; $('#stMfa').hidden = m !== 'mfa'; $('#lBtn').textContent = m === 'mfa' ? 'تأكيد الرمز' : 'دخول'; }
  function showLogin(m) { S.stopIdle && S.stopIdle(); show('login'); setMode('creds'); msg($('#lErr'), m); }
  async function enter() {
    show('boot');
    try {
      var ok = await C.rpc('can_manage_families');
      if (ok !== true) {
        var anyAdmin = await C.rpc('is_admin'); await C.signOut();
        return showLogin(anyAdmin === true ? 'حسابك محرّر: لا يملك صلاحية بيانات الأطفال والأولياء.' : 'هذا الحساب غير مخوّل بالدخول إلى هذه اللوحة.');
      }
      S.me = await C.me(); bust(); show('app'); $('#who').textContent = (S.me && S.me.email) || 'مدير';
      S.stopIdle && S.stopIdle(); S.stopIdle = DE.idle(30 * 60 * 1000, function () { logout('تم تسجيل خروجك تلقائيًا بعد فترة خمول.'); });
      go('dash');
    } catch (e) { showLogin(e.message); }
  }
  async function logout(m) { await C.signOut(); S.cache = {}; S.me = null; showLogin(m); }
  async function submitLogin(e) {
    e.preventDefault(); msg($('#lErr'), '');
    await lock($('#lBtn'), async function () {
      try {
        if (mode === 'creds') {
          var em = DE.clean($('#email').value, 254).toLowerCase(), pw = $('#password').value;
          if (!DE.isEmail(em) || !pw || pw.length > 72) return msg($('#lErr'), 'أدخل البريد وكلمة المرور.');
          var r = await C.signIn(em, pw); $('#password').value = '';
          if (r.mfa) { setMode('mfa'); $('#mfaCode').focus(); return; }
          await enter();
        } else {
          var code = $('#mfaCode').value.replace(/\s/g, '');
          if (!/^\d{6}$/.test(code)) return msg($('#lErr'), 'أدخل الرمز المكوّن من 6 أرقام.');
          await C.verifyMfa(code); $('#mfaCode').value = ''; await enter();
        }
      } catch (er) { msg($('#lErr'), er.message); }
    });
  }
  function init() {
    if (!CFG.supabaseUrl || !CFG.supabaseKey) { $('#boot').textContent = 'إعدادات الاتصال غير مضبوطة.'; return; }
    C.onExpire(function () { showLogin('انتهت الجلسة. سجّل الدخول من جديد.'); });
    $('#loginForm').addEventListener('submit', submitLogin);
    $('#logoutBtn').addEventListener('click', function () { logout(); });
    $('#menuBtn').addEventListener('click', function () { $('#app').classList.toggle('nav-toggled'); });
    $('#scrim').addEventListener('click', function () { $('#app').classList.remove('nav-toggled'); });
    $('#nav').addEventListener('click', function (e) { var b = e.target.closest('button[data-sec]'); if (b) go(b.dataset.sec); });
    $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
    if (C.load()) enter(); else showLogin();
  }
  init();
})();
