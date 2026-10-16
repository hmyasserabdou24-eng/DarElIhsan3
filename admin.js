/* لوحة إدارة دار الإحسان — بدون أي مكتبات خارجية.
   الحماية الحقيقية تتم على الخادم (Supabase Auth + RLS + Storage policies)،
   وهذا الملف مجرد واجهة تتحدث مع الـ API بجلسة المدير. */
(function () {
  'use strict';
  if (window.top !== window.self) { document.body.textContent = ''; return; } // منع التضمين داخل إطارات

  var CFG = window.DE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var base = (CFG.supabaseUrl || '').replace(/\/+$/, '');
  var BUCKET = CFG.bucket || 'media';
  var SKEY = 'de_admin_session', BKEY = 'de_admin_backup';

  /* ---------- أدوات صغيرة ---------- */
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function canon(o) {
    if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
    if (isObj(o)) return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(o[k]); }).join(',') + '}';
    return JSON.stringify(o);
  }
  function h(tag, props) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k]; if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function icon(n) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'i');
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#a-' + n); s.append(u); return s;
  }
  function fmtDate(iso) { try { return new Date(iso).toLocaleString('ar-DZ-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso || '—'; } }
  function autoGrow(t) { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight, 48) + 'px'; }
  function publicUrl(path) { return base + '/storage/v1/object/public/' + BUCKET + '/' + path; }
  function safePath(p) { return typeof p === 'string' && /^[A-Za-z0-9_\-\/.]{1,200}$/.test(p) && p.indexOf('..') < 0; }

  /* ---------- واجهة: toast / busy / modal ---------- */
  var toastT;
  function toast(msg, kind) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast ' + (kind || ''); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, kind === 'err' ? 6000 : 3200);
  }
  function busy(text) {
    $('#busyTxt').textContent = text || 'جارٍ التنفيذ…'; $('#busyBar').style.width = '0%'; $('#busy').hidden = false;
    return { set: function (p, t) { $('#busyBar').style.width = Math.round(p * 100) + '%'; if (t) $('#busyTxt').textContent = t; }, done: function () { $('#busy').hidden = true; } };
  }
  function ask(o) {
    return new Promise(function (resolve) {
      var m = $('#modal'), ok = $('#mOk'), cancel = $('#mCancel');
      $('#mTitle').textContent = o.title || ''; $('#mMsg').textContent = o.msg || '';
      var body = $('#mBody'); body.textContent = ''; if (o.body) body.append(o.body);
      ok.textContent = o.ok || 'تأكيد'; ok.className = 'btn ' + (o.danger ? 'danger' : 'primary');
      cancel.hidden = o.hideCancel === true; ok.disabled = false; m.hidden = false;
      function close(v) { m.hidden = true; ok.onclick = cancel.onclick = null; document.removeEventListener('keydown', esc); resolve(v); }
      function esc(e) { if (e.key === 'Escape') close(false); }
      document.addEventListener('keydown', esc);
      cancel.onclick = function () { close(false); };
      ok.onclick = function () {
        if (!o.onOk) return close(true);
        ok.disabled = true;
        o.onOk().then(function () { close(true); }).catch(function (e) { ok.disabled = false; $('#mMsg').textContent = e.message || String(e); });
      };
    });
  }

  /* ---------- الجلسة والمصادقة (GoTrue عبر fetch) ---------- */
  var session = null, pendingMfa = null, refreshing = null;
  function loadSession() {
    try { var s = JSON.parse(localStorage.getItem(SKEY) || sessionStorage.getItem(SKEY) || 'null'); return s && s.refresh_token ? s : null; } catch (e) { return null; }
  }
  function saveSession(tok, remember) {
    var useLocal = remember === undefined ? localStorage.getItem(SKEY) !== null : remember;
    session = { access_token: tok.access_token, refresh_token: tok.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (tok.expires_in || 3600), user: tok.user || (session && session.user) || null };
    localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY);
    (useLocal ? localStorage : sessionStorage).setItem(SKEY, JSON.stringify(session));
  }
  function clearSession() { session = null; localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); }
  function headers(extra, authed) {
    var hd = { apikey: CFG.supabaseKey };
    var tok = authed !== false && session ? session.access_token : (/^eyJ/.test(CFG.supabaseKey) ? CFG.supabaseKey : null);
    if (tok) hd.Authorization = 'Bearer ' + tok;
    return Object.assign(hd, extra || {});
  }
  var MSG = [
    [/invalid login credentials/i, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
    [/invalid (totp|code)|mfa.*(invalid|failed)|code.*incorrect/i, 'رمز المصادقة غير صحيح أو منتهٍ.'],
    [/rate limit|too many/i, 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.'],
    [/row-level security|permission denied|42501|not authorized|غير مصرّح/i, 'هذا الحساب لا يملك صلاحية تنفيذ هذه العملية.'],
    [/payload too large|exceeded the maximum|too large/i, 'حجم الملف أكبر من الحد المسموح (50 ميغابايت).'],
    [/mime type|not supported/i, 'نوع الملف غير مدعوم. المسموح: JPG وPNG وWebP وGIF وMP4 وWebM.']
  ];
  function apiError(res) {
    return res.text().then(function (t) {
      var j = {}; try { j = JSON.parse(t); } catch (e) { /* نص */ }
      var raw = j.msg || j.message || j.error_description || j.error || t || ('HTTP ' + res.status);
      var hit = MSG.filter(function (m) { return m[0].test(raw) || m[0].test(String(j.code || '')); })[0];
      var err = new Error(hit ? hit[1] : ('حدث خطأ: ' + raw)); err.status = res.status; return err;
    });
  }
  function refresh() {
    if (refreshing) return refreshing;
    refreshing = (async function () {
      if (!session) return false;
      var r = await fetch(base + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }, false), body: JSON.stringify({ refresh_token: session.refresh_token }) });
      if (!r.ok) return false;
      saveSession(await r.json()); return true;
    })().catch(function () { return false; }).then(function (v) { refreshing = null; return v; });
    return refreshing;
  }
  async function ensureFresh() {
    if (session && session.expires_at - 60 < Date.now() / 1000) {
      if (!(await refresh())) { await expire(); throw new Error('انتهت الجلسة، سجّل الدخول من جديد.'); }
    }
  }
  async function http(method, path, body, extra) {
    await ensureFresh();
    var go = function () {
      return fetch(base + path, { method: method, headers: headers(Object.assign(body !== undefined ? { 'Content-Type': 'application/json' } : {}, extra || {})), body: body === undefined ? undefined : JSON.stringify(body) });
    };
    var res;
    try { res = await go(); } catch (e) { throw new Error('تعذّر الاتصال بالخادم. تحقق من الإنترنت.'); }
    if (res.status === 401 && session && (await refresh())) res = await go();
    if (res.status === 401) { await expire(); throw new Error('انتهت الجلسة، سجّل الدخول من جديد.'); }
    if (!res.ok) throw await apiError(res);
    var txt = await res.text(); return txt ? JSON.parse(txt) : null;
  }
  var rest = function (m, p, b, x) { return http(m, '/rest/v1' + p, b, x); };

  async function signIn(email, pw, remember) {
    var r;
    try { r = await fetch(base + '/auth/v1/token?grant_type=password', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }, false), body: JSON.stringify({ email: email, password: pw }) }); }
    catch (e) { throw new Error('تعذّر الاتصال بالخادم. تحقق من الإنترنت.'); }
    if (!r.ok) throw await apiError(r);
    var tok = await r.json();
    var factor = ((tok.user && tok.user.factors) || []).filter(function (f) { return f.factor_type === 'totp' && f.status === 'verified'; })[0];
    if (factor) { pendingMfa = { tok: tok, factor: factor, remember: remember }; return 'mfa'; }
    saveSession(tok, remember); return 'ok';
  }
  async function verifyMfa(code) {
    var hd = headers({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + pendingMfa.tok.access_token }, false);
    var c = await fetch(base + '/auth/v1/factors/' + pendingMfa.factor.id + '/challenge', { method: 'POST', headers: hd, body: '{}' });
    if (!c.ok) throw await apiError(c);
    var ch = await c.json();
    var v = await fetch(base + '/auth/v1/factors/' + pendingMfa.factor.id + '/verify', { method: 'POST', headers: hd, body: JSON.stringify({ challenge_id: ch.id, code: code }) });
    if (!v.ok) throw await apiError(v);
    var tok = await v.json(); tok.user = tok.user || pendingMfa.tok.user;
    saveSession(tok, pendingMfa.remember); pendingMfa = null;
  }
  async function signOut() {
    try { if (session) await fetch(base + '/auth/v1/logout', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }) }); } catch (e) { /* تجاهل */ }
    clearSession(); localStorage.removeItem(BKEY);
  }
  async function expire() { clearSession(); showLogin('انتهت الجلسة. سجّل الدخول من جديد.'); }

  /* ---------- النموذج ---------- */
  function normalize(d) {
    var o = isObj(d) ? clone(d) : {};
    o.v = 1;
    o.texts = isObj(o.texts) ? o.texts : {};
    o.texts.ar = isObj(o.texts.ar) ? o.texts.ar : {}; o.texts.fr = isObj(o.texts.fr) ? o.texts.fr : {};
    o.fields = isObj(o.fields) ? o.fields : {}; o.images = isObj(o.images) ? o.images : {};
    o.gallery = Array.isArray(o.gallery) ? o.gallery : [];
    return o;
  }
  var S = { work: null, draft: null, published: null, draftAt: null, pubAt: null, tab: 'texts', lang: 'ar' };
  var isDirty = function () { return canon(S.work) !== canon(S.draft); };
  var isPending = function () { return canon(S.draft) !== canon(S.published); };

  function changed() {
    refreshStatus();
    try { localStorage.setItem(BKEY, JSON.stringify({ base: canon(S.draft), work: S.work })); } catch (e) { /* ممتلئ */ }
  }
  function refreshStatus() {
    var d = isDirty(), p = isPending(), chip = $('#statusChip');
    chip.className = 'chip ' + (d ? 'dirty' : p ? 'pending' : 'live');
    chip.textContent = d ? 'تعديلات غير محفوظة' : p ? 'مسودة غير منشورة' : 'الموقع محدَّث';
    $('#btnSave').disabled = !d; $('#btnCancel').disabled = !d; $('#btnPublish').disabled = !(d || p);
  }
  async function loadData() {
    var rows = await rest('GET', '/site_content?select=id,data,updated_at');
    var dr = rows.filter(function (r) { return r.id === 'draft'; })[0], pb = rows.filter(function (r) { return r.id === 'published'; })[0];
    S.draft = normalize(dr && dr.data); S.published = normalize(pb && pb.data);
    S.draftAt = dr && dr.updated_at; S.pubAt = pb && pb.updated_at;
    S.work = clone(S.draft);
  }
  async function saveDraft() {
    var errs = validateFields();
    if (errs.length) { go('contact'); toast(errs[0], 'err'); throw new Error(errs[0]); }
    var body = { data: S.work, updated_at: new Date().toISOString(), updated_by: session && session.user ? session.user.id : null };
    var rows = await rest('PATCH', '/site_content?id=eq.draft', body, { Prefer: 'return=representation' });
    if (!rows || !rows.length) rows = await rest('POST', '/site_content', Object.assign({ id: 'draft' }, body), { Prefer: 'return=representation' });
    S.draft = normalize(rows[0].data); S.draftAt = rows[0].updated_at; S.work = clone(S.draft);
    localStorage.removeItem(BKEY); refreshStatus();
  }
  async function publish() {
    if (!(await ask({ title: 'نشر التغييرات؟', msg: 'ستظهر كل التعديلات الحالية للزوار فورًا على الموقع.', ok: 'نشر الآن' }))) return;
    var b = busy('جارٍ النشر…');
    try {
      if (isDirty()) await saveDraft();
      await rest('POST', '/rpc/publish_content', {});
      await loadData(); refreshStatus(); render();
      toast('تم النشر بنجاح ✔', 'ok');
    } catch (e) { toast(e.message, 'err'); } finally { b.done(); }
  }
  async function cancelEdits() {
    if (!isDirty()) return;
    if (!(await ask({ title: 'إلغاء التعديلات؟', msg: 'ستُتجاهل التعديلات غير المحفوظة وتعود المسودة إلى آخر نسخة محفوظة.', ok: 'نعم، إلغاء', danger: true }))) return;
    S.work = clone(S.draft); localStorage.removeItem(BKEY); refreshStatus(); render(); toast('تم إلغاء التعديلات');
  }

  /* ---------- التحقق من الحقول ---------- */
  var FIELDS = [
    { k: 'phone1', l: 'الهاتف / الفاكس 1', t: 'tel', d: '044 44 48 34' }, { k: 'phone2', l: 'الهاتف 2', t: 'tel', d: '0664 42 14 44' },
    { k: 'phone3', l: 'الهاتف 3', t: 'tel', d: '0540 81 77 75' }, { k: 'phone4', l: 'الهاتف 4', t: 'tel', d: '0668 03 41 47' },
    { k: 'email1', l: 'البريد الإلكتروني 1', t: 'email', d: 'cppdarelihcen@gmail.com' }, { k: 'email2', l: 'البريد الإلكتروني 2', t: 'email', d: 'contact@darelihsan.com' },
    { k: 'whatsapp', l: 'رقم واتساب', t: 'wa', d: '213668034147', hint: 'بالصيغة الدولية، أرقام فقط. مثال: 213668034147' },
    { k: 'facebook', l: 'رابط فيسبوك', t: 'url', d: 'https://www.facebook.com/apehme' }, { k: 'instagram', l: 'رابط إنستغرام', t: 'url', d: 'https://www.instagram.com/cpp_1990' },
    { k: 'mapCenter', l: 'رابط خريطة المركز', t: 'url', d: 'https://maps.app.goo.gl/t6nTLCWQ8NMMDG4A9' },
    { k: 'mapFarm', l: 'رابط خريطة المزرعة', t: 'url', d: 'https://maps.app.goo.gl/vLLZMdjQfvt87oHr9' },
    { k: 'mapWork', l: 'رابط خريطة مركز المساعدة على العمل', t: 'url', d: 'https://maps.app.goo.gl/H6kUhztG2EW298kaA' },
    { k: 'addrAr', l: 'العنوان بالعربية (التذييل)', t: 'text', d: 'بلدية العطف – ولاية غرداية – الجزائر' },
    { k: 'addrFr', l: 'العنوان بالفرنسية (التذييل)', t: 'text', d: 'El Atteuf – Ghardaïa – Algeria' }
  ];
  function checkField(f, v) {
    if (!v) return '';
    if (f.t === 'tel') return /^[\d\s+().\-]{5,40}$/.test(v) && v.replace(/[^\d+]/g, '').length >= 5 ? '' : 'رقم الهاتف غير صالح';
    if (f.t === 'email') return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v) ? '' : 'البريد الإلكتروني غير صالح';
    if (f.t === 'wa') { var dg = v.replace(/\D/g, ''); return dg.length >= 8 && dg.length <= 15 ? '' : 'رقم واتساب غير صالح (8 إلى 15 رقمًا)'; }
    if (f.t === 'url') { try { return new URL(v).protocol === 'https:' ? '' : 'يجب أن يبدأ الرابط بـ https://'; } catch (e) { return 'الرابط غير صالح'; } }
    return v.length <= 300 ? '' : 'النص طويل جدًا';
  }
  function validateFields() {
    var out = [];
    FIELDS.forEach(function (f) { var e = checkField(f, S.work.fields[f.k]); if (e) out.push(f.l + ': ' + e); });
    return out;
  }

  /* ---------- النصوص ---------- */
  function seq(prefix, n, label) { var a = []; for (var i = 1; i <= n; i++) a.push([prefix + i, label + ' ' + i]); return a; }
  var GROUPS = [
    ['الشريط العلوي وعنوان الترحيب', [['brand', 'اسم المركز في الشريط العلوي'], ['navHome', 'قائمة: الرئيسية'], ['navAbout', 'قائمة: من نحن'], ['navServices', 'قائمة: خدماتنا'], ['navAnnexes', 'قائمة: الملاحقات'], ['navGoals', 'قائمة: أهدافنا'], ['navContact', 'قائمة: اتصل بنا'], ['heroTitle', 'عنوان الترحيب (تحت صورة الغلاف)'], ['h1', 'عنوان تبويب المتصفح – الجزء الأول']]],
    ['من نحن', [['aboutTitle', 'عنوان القسم'], ['histTitle', 'عنوان «تاريخنا»'], ['histText', 'نص التاريخ'], ['statYearsValue', 'الإحصائية 1: الرقم'], ['statYears', 'الإحصائية 1: الوصف'], ['statServicesValue', 'الإحصائية 2: الرقم'], ['statServices', 'الإحصائية 2: الوصف'], ['statBeneficiariesValue', 'الإحصائية 3: الرقم'], ['statBeneficiaries', 'الإحصائية 3: الوصف'], ['missionTitle', 'عنوان الرسالة'], ['missionText', 'نص الرسالة'], ['visionTitle', 'عنوان الرؤية'], ['visionText', 'نص الرؤية']].concat(seq('v', 6, 'الكلمة'))],
    ['خدماتنا', [['servicesTitle', 'عنوان القسم'], ['servicesSub', 'العنوان الفرعي']].concat([1, 2, 3, 4].reduce(function (a, i) { return a.concat([['s' + i + 'a', 'الخدمة ' + i + ': الاسم'], ['s' + i + 'd', 'الخدمة ' + i + ': الوصف'], ['s' + i + 'n', 'الخدمة ' + i + ': الاسم الفرنسي أسفل البطاقة']]); }, []))],
    ['مركزنا', [['centerTitle', 'عنوان القسم'], ['cn', 'اسم المركز'], ['cd', 'وصف المركز'], ['map', 'نص زر الخريطة']]],
    ['الملاحقات', [['annexTitle', 'عنوان القسم'], ['nA1n', 'الملحقة 1: الاسم'], ['nA1d', 'الملحقة 1: الوصف'], ['nA2n', 'الملحقة 2: الاسم'], ['nA2d', 'الملحقة 2: الوصف']]],
    ['أهدافنا', [['goalsTitle', 'عنوان القسم']].concat(seq('g', 8, 'الهدف'))],
    ['المعرض', [['galleryTitle', 'عنوان قسم المعرض (يظهر عند إضافة عناصر)']]],
    ['التذييل وأزرار التواصل', [['f1', 'سطر التذييل 1'], ['f2', 'سطر التذييل 2'], ['contactTitle', 'عنوان «اتصل بنا»'], ['mailT', 'عنوان البريد'], ['phoneT', 'عنوان الهاتف'], ['waText', 'نص زر واتساب'], ['fb', 'نص فيسبوك'], ['ig', 'نص إنستغرام']]]
  ];
  function textField(l, key, label) {
    var def = (T[l] && T[l][key]) || '', cur = S.work.texts[l][key];
    var ta = h('textarea', { rows: 1, dir: l === 'ar' ? 'rtl' : 'ltr', maxlength: 3000 }); ta.value = cur !== undefined ? cur : def;
    var box = h('label', { class: 'fld' + (cur !== undefined ? ' edited' : '') }, h('span', { text: label }), ta);
    var rs = h('button', { class: 'reset', type: 'button', text: 'استعادة النص الأصلي', onclick: function () {
      delete S.work.texts[l][key]; ta.value = def; box.classList.remove('edited'); rs.hidden = true; autoGrow(ta); changed();
    } });
    rs.hidden = cur === undefined;
    ta.addEventListener('input', function () {
      var v = ta.value;
      if (v === def || v.trim() === '') { delete S.work.texts[l][key]; box.classList.remove('edited'); rs.hidden = true; }
      else { S.work.texts[l][key] = v; box.classList.add('edited'); rs.hidden = false; }
      autoGrow(ta); changed();
    });
    ta.addEventListener('blur', function () { if (ta.value.trim() === '') { ta.value = def; autoGrow(ta); } });
    setTimeout(function () { autoGrow(ta); }, 0);
    return h('div', null, box, rs);
  }
  function viewTexts() {
    var l = S.lang;
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'لغة التحرير' },
      h('button', { type: 'button', class: l === 'ar' ? 'on' : '', text: 'العربية', onclick: function () { S.lang = 'ar'; render(); } }),
      h('button', { type: 'button', class: l === 'fr' ? 'on' : '', text: 'Français', onclick: function () { S.lang = 'fr'; render(); } }));
    var wrap = h('div', null,
      h('h2', { text: 'نصوص الموقع' }),
      h('p', { class: 'lead', text: 'اضغط على القسم ثم عدّل النص. إذا تركت الحقل فارغًا يعود إلى النص الأصلي.' }),
      h('div', { class: 'toolbar' }, h('strong', { text: 'لغة التحرير:' }), seg));
    GROUPS.forEach(function (g, i) {
      var fields = g[1].filter(function (f) { return T[l] && f[0] in T[l]; });
      var edited = fields.filter(function (f) { return S.work.texts[l][f[0]] !== undefined; }).length;
      var d = h('details', { class: 'grp', open: i === 0 || edited > 0 },
        h('summary', { text: g[0] + (edited ? ' (' + edited + ' معدَّل)' : '') }),
        h('div', { class: 'inner' }, fields.map(function (f) { return textField(l, f[0], f[1]); })));
      d.addEventListener('toggle', function () { if (d.open) d.querySelectorAll('textarea').forEach(autoGrow); });
      wrap.append(d);
    });
    return wrap;
  }

  /* ---------- رفع الملفات ---------- */
  var MAX_VIDEO = 50 * 1024 * 1024;
  function rid() { var a = new Uint8Array(6); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
  function loadImg(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('تعذّر قراءة الصورة. جرّب صورة JPG أو PNG.')); };
      im.src = u;
    });
  }
  async function prepareImage(file, maxDim) {
    if (file.type === 'image/gif') { if (file.size > 8 * 1024 * 1024) throw new Error('ملف GIF كبير (الحد 8 ميغابايت).'); return { blob: file, ext: 'gif' }; }
    var im = await loadImg(file);
    var s = Math.min(1, maxDim / Math.max(im.naturalWidth, im.naturalHeight));
    var w = Math.max(1, Math.round(im.naturalWidth * s)), hh = Math.max(1, Math.round(im.naturalHeight * s));
    var c = document.createElement('canvas'); c.width = w; c.height = hh;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, hh); x.drawImage(im, 0, 0, w, hh);
    var blob = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.86); });
    if (!blob) throw new Error('تعذّر تجهيز الصورة.');
    return { blob: blob, ext: 'jpg' };
  }
  async function uploadBlob(blob, ext, mime, onProg) {
    await ensureFresh();
    var path = 'uploads/' + Date.now().toString(36) + '-' + rid() + '.' + ext;
    await new Promise(function (res, rej) {
      var x = new XMLHttpRequest();
      x.open('POST', base + '/storage/v1/object/' + BUCKET + '/' + path);
      var hd = headers({ 'Content-Type': mime, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' });
      Object.keys(hd).forEach(function (k) { x.setRequestHeader(k, hd[k]); });
      x.upload.onprogress = function (e) { if (e.lengthComputable && onProg) onProg(e.loaded / e.total); };
      x.onerror = function () { rej(new Error('تعذّر الاتصال أثناء الرفع. تحقق من الإنترنت.')); };
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) return res();
        apiError({ text: function () { return Promise.resolve(x.responseText); }, status: x.status }).then(rej);
      };
      x.send(blob);
    });
    return path;
  }
  async function handleFile(file, opts) {
    var isVid = /^video\//.test(file.type) || /\.(mp4|webm|mov)$/i.test(file.name);
    var isImg = /^image\//.test(file.type);
    if (opts.only === 'image' && !isImg) throw new Error('اختر صورة فقط.');
    if (!isImg && !isVid) throw new Error('نوع الملف غير مدعوم.');
    var b = busy(isVid ? 'جارٍ رفع الفيديو…' : 'جارٍ تجهيز الصورة…');
    try {
      var path, type;
      if (isVid) {
        if (file.size > MAX_VIDEO) throw new Error('حجم الفيديو أكبر من 50 ميغابايت. استخدم رابط يوتيوب أو فيميو بدلًا من الرفع.');
        var ext = /webm/i.test(file.type) || /\.webm$/i.test(file.name) ? 'webm' : 'mp4';
        path = await uploadBlob(file, ext, ext === 'webm' ? 'video/webm' : 'video/mp4', function (p) { b.set(p, 'جارٍ رفع الفيديو… ' + Math.round(p * 100) + '%'); });
        type = 'video';
      } else {
        var pr = await prepareImage(file, opts.maxDim || 1600); b.set(0.1, 'جارٍ رفع الصورة…');
        path = await uploadBlob(pr.blob, pr.ext, pr.ext === 'gif' ? 'image/gif' : 'image/jpeg', function (p) { b.set(0.1 + p * 0.9); });
        type = 'image';
      }
      return { path: path, type: type };
    } finally { b.done(); }
  }
  function filePicker(accept, multiple, cb) {
    var inp = h('input', { type: 'file', accept: accept, multiple: multiple ? true : null });
    inp.addEventListener('change', async function () {
      var files = Array.prototype.slice.call(inp.files || []); inp.value = '';
      for (var i = 0; i < files.length; i++) { try { await cb(files[i]); } catch (e) { toast(e.message, 'err'); } }
    });
    return inp;
  }

  /* ---------- الصور الأساسية ---------- */
  var SLOTS = [
    { k: 'cover', l: 'صورة الغلاف (أعلى الصفحة)', def: 'cover.jpg', max: 2000 },
    { k: 'center', l: 'صورة بطاقة «مركزنا»', def: 'main-center.jpg', max: 1600 },
    { k: 'farm', l: 'صورة المزرعة البيداغوجية', def: 'farm-hydroponic.jpg', max: 1600 },
    { k: 'work', l: 'صورة مركز المساعدة على العمل', def: 'work-center.jpg', max: 1600 }
  ];
  function viewImages() {
    var wrap = h('div', null, h('h2', { text: 'الصور الأساسية' }), h('p', { class: 'lead', text: 'استبدل صور الموقع الحالية بصور جديدة. تُصغَّر الصور تلقائيًا لتحميل أسرع على الهاتف.' }));
    SLOTS.forEach(function (s) {
      var p = S.work.images[s.k], mod = !!p;
      var img = h('img', { alt: '', src: mod && safePath(p) ? publicUrl(p) : s.def });
      var pick = filePicker('image/*', false, async function (f) { var r = await handleFile(f, { only: 'image', maxDim: s.max }); S.work.images[s.k] = r.path; changed(); render(); toast('تم رفع الصورة. اضغط «حفظ المسودة».', 'ok'); });
      var reset = h('button', { class: 'btn light small', type: 'button', onclick: function () { delete S.work.images[s.k]; changed(); render(); } }, icon('undo'), 'استعادة الأصلية'); reset.hidden = !mod;
      wrap.append(h('section', { class: 'card teal' }, h('div', { class: 'row' }, h('h3', { class: 'grow', text: s.l }), h('span', { class: 'badge' + (mod ? ' mod' : ''), text: mod ? 'مستبدلة' : 'الأصلية' })),
        h('div', { class: 'thumb' }, img),
        h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: function () { pick.click(); } }, icon('upload'), mod ? 'استبدال الصورة' : 'رفع صورة جديدة'), reset, pick)));
    });
    return wrap;
  }

  /* ---------- المعرض ---------- */
  function parseEmbed(u) {
    var url; try { url = new URL(u.trim()); } catch (e) { return null; }
    var host = url.hostname.replace(/^www\.|^m\./, ''), id = null;
    if (url.protocol !== 'https:') return null;
    if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      var m = url.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,20})/);
      id = m ? m[2] : url.searchParams.get('v');
      if (id && /^[\w-]{6,20}$/.test(id)) return { provider: 'youtube', videoId: id };
    } else if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      var vm = url.pathname.match(/(\d{4,15})/); if (vm) return { provider: 'vimeo', videoId: vm[1] };
    }
    return id && /^[\w-]{6,20}$/.test(id) ? { provider: 'youtube', videoId: id } : null;
  }
  function move(i, d) { var a = S.work.gallery, j = i + d; if (j < 0 || j >= a.length) return; var t = a[i]; a[i] = a[j]; a[j] = t; changed(); render(); }
  function galleryCard(it, i) {
    var thumb = h('div', { class: 'thumb' });
    if (it.type === 'image' && safePath(it.path)) thumb.append(h('img', { alt: '', src: publicUrl(it.path), loading: 'lazy' }));
    else if (it.type === 'video' && safePath(it.path)) thumb.append(h('video', { src: publicUrl(it.path) + '#t=0.1', preload: 'metadata', controls: true, playsinline: true }));
    else thumb.append(h('div', { class: 'emb' }, icon('play'), h('span', { text: (it.provider === 'vimeo' ? 'Vimeo' : 'YouTube') + ' · ' + (it.videoId || '') })));
    it.title = isObj(it.title) ? it.title : {}; it.desc = isObj(it.desc) ? it.desc : {};
    function inp(kind, l, label, multi) {
      var el = h(multi ? 'textarea' : 'input', { dir: l === 'ar' ? 'rtl' : 'ltr', maxlength: multi ? 1500 : 150, rows: multi ? 3 : null, type: multi ? null : 'text' });
      el.value = it[kind][l] || '';
      el.addEventListener('input', function () { if (el.value) it[kind][l] = el.value; else delete it[kind][l]; changed(); });
      return h('label', { class: 'fld' }, h('span', { text: label }), el);
    }
    var replace = (it.type === 'image' || it.type === 'video') ? filePicker(it.type === 'image' ? 'image/*' : 'video/*', false, async function (f) {
      var r = await handleFile(f, { only: it.type, maxDim: 1600 }); it.path = r.path; changed(); render(); toast('تم استبدال الملف.', 'ok');
    }) : null;
    return h('section', { class: 'card teal' },
      h('div', { class: 'row' }, h('span', { class: 'badge', text: it.type === 'image' ? 'صورة' : it.type === 'video' ? 'فيديو' : 'فيديو مضمَّن' }), h('span', { class: 'grow' }),
        h('button', { class: 'icon-btn small', type: 'button', 'aria-label': 'تحريك للأعلى', onclick: function () { move(i, -1); } }, icon('up')),
        h('button', { class: 'icon-btn small', type: 'button', 'aria-label': 'تحريك للأسفل', onclick: function () { move(i, 1); } }, icon('down'))),
      thumb,
      h('div', { class: 'two' }, inp('title', 'ar', 'العنوان (عربي)'), inp('title', 'fr', 'Titre (Français)'), inp('desc', 'ar', 'الوصف (عربي)', true), inp('desc', 'fr', 'Description (Français)', true)),
      h('div', { class: 'item-actions' },
        replace && h('button', { class: 'btn light small', type: 'button', onclick: function () { replace.click(); } }, icon('upload'), 'استبدال الملف'), replace,
        h('button', { class: 'btn danger small', type: 'button', onclick: async function () {
          if (await ask({ title: 'حذف العنصر؟', msg: 'سيُزال من المعرض عند النشر. يمكنك التراجع قبل الحفظ بزر «إلغاء التعديلات».', ok: 'حذف', danger: true })) { S.work.gallery.splice(i, 1); changed(); render(); }
        } }, icon('trash'), 'حذف')));
  }
  function viewGallery() {
    var up = filePicker('image/*,video/mp4,video/webm,video/quicktime', true, async function (f) {
      var r = await handleFile(f, { maxDim: 1600 });
      S.work.gallery.push({ id: rid(), type: r.type, path: r.path, title: {}, desc: {} }); changed(); render();
    });
    var wrap = h('div', null, h('h2', { text: 'معرض الصور والفيديو' }),
      h('p', { class: 'lead', text: 'يظهر القسم في الموقع بعد قسم «أهدافنا» عند وجود عنصر واحد على الأقل.' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn teal', type: 'button', onclick: function () { up.click(); } }, icon('upload'), 'رفع صور أو فيديو'),
        h('button', { class: 'btn light', type: 'button', onclick: addEmbed }, icon('link'), 'إضافة رابط يوتيوب / فيميو'), up),
      h('p', { class: 'muted', text: 'للفيديوهات الطويلة أو الأكبر من 50 ميغابايت استخدم رابط يوتيوب أو فيميو.' }));
    if (!S.work.gallery.length) wrap.append(h('div', { class: 'empty', text: 'لا توجد عناصر بعد. ابدأ برفع صورة أو إضافة فيديو.' }));
    S.work.gallery.forEach(function (it, i) { wrap.append(galleryCard(it, i)); });
    return wrap;
  }
  async function addEmbed() {
    var inp = h('input', { type: 'url', dir: 'ltr', placeholder: 'https://www.youtube.com/watch?v=…' });
    var ok = await ask({ title: 'إضافة فيديو من رابط', msg: 'الصق رابط فيديو من يوتيوب أو فيميو.', body: h('label', { class: 'fld' }, inp), ok: 'إضافة', onOk: async function () {
      var e = parseEmbed(inp.value); if (!e) throw new Error('الرابط غير مدعوم. استخدم رابط يوتيوب أو فيميو صحيحًا.');
      S.work.gallery.push({ id: rid(), type: 'embed', provider: e.provider, videoId: e.videoId, title: {}, desc: {} }); changed(); render();
    } });
    if (ok) toast('تمت إضافة الفيديو.', 'ok');
  }

  /* ---------- الاتصال ---------- */
  function viewContact() {
    var wrap = h('div', null, h('h2', { text: 'بيانات الاتصال والروابط' }), h('p', { class: 'lead', text: 'اترك الحقل فارغًا لاستعمال القيمة الأصلية الظاهرة بخط باهت.' }));
    var card = h('section', { class: 'card plain stack' });
    FIELDS.forEach(function (f) {
      var el = h('input', { type: 'text', dir: f.t === 'text' && /^[^\x00-\x7F]/.test(f.d) ? 'rtl' : 'ltr', placeholder: f.d, maxlength: 300, inputmode: f.t === 'tel' || f.t === 'wa' ? 'tel' : f.t === 'email' ? 'email' : f.t === 'url' ? 'url' : 'text' });
      el.value = S.work.fields[f.k] || '';
      var hint = h('span', { class: 'hint', text: f.hint || '' });
      var box = h('label', { class: 'fld' }, h('span', { text: f.l }), el, hint);
      el.addEventListener('input', function () {
        var v = el.value.trim(); if (v) S.work.fields[f.k] = v; else delete S.work.fields[f.k];
        var e = checkField(f, v); box.classList.toggle('bad', !!e); hint.classList.toggle('bad', !!e); hint.textContent = e || f.hint || ''; changed();
      });
      card.append(box);
    });
    wrap.append(card); return wrap;
  }

  /* ---------- النشر والأمان ---------- */
  function diffCounts(a, b) {
    var t = 0; ['ar', 'fr'].forEach(function (l) { var ks = Object.keys(Object.assign({}, a.texts[l], b.texts[l])); ks.forEach(function (k) { if (a.texts[l][k] !== b.texts[l][k]) t++; }); });
    var f = Object.keys(Object.assign({}, a.fields, b.fields)).filter(function (k) { return a.fields[k] !== b.fields[k]; }).length;
    var im = Object.keys(Object.assign({}, a.images, b.images)).filter(function (k) { return a.images[k] !== b.images[k]; }).length;
    return { t: t, f: f, im: im, g: canon(a.gallery) === canon(b.gallery) ? 0 : 1 };
  }
  function viewPublish() {
    var d = diffCounts(S.work, S.published);
    var wrap = h('div', null, h('h2', { text: 'النشر والأمان' }));
    wrap.append(h('section', { class: 'card teal' }, h('h3', { text: 'الحالة' }),
      h('dl', { class: 'kv' },
        h('dt', { text: 'آخر نشر' }), h('dd', { text: S.pubAt && canon(S.published) !== canon(normalize({})) ? fmtDate(S.pubAt) : 'لم يُنشر محتوى بعد' }),
        h('dt', { text: 'آخر حفظ للمسودة' }), h('dd', { text: S.draftAt ? fmtDate(S.draftAt) : '—' }),
        h('dt', { text: 'الفروق عن المنشور' }), h('dd', { text: (d.t + d.f + d.im + d.g) ? [d.t && d.t + ' نص', d.f && d.f + ' بيانات اتصال', d.im && d.im + ' صورة أساسية', d.g && 'المعرض'].filter(Boolean).join('، ') : 'لا فروق' })),
      h('div', { class: 'row' }, h('button', { class: 'btn light small', type: 'button', onclick: discardDraft }, icon('undo'), 'إرجاع المسودة إلى المنشور'))));
    var hist = h('ul', { class: 'list' }, h('li', { class: 'muted', text: 'جارٍ التحميل…' }));
    wrap.append(h('section', { class: 'card plain' }, h('h3', { text: 'النسخ المنشورة السابقة' }), hist));
    loadHistory(hist);
    var mfa = h('div', null, h('p', { class: 'muted', text: 'جارٍ التحقق…' }));
    wrap.append(h('section', { class: 'card plain' }, h('h3', { text: 'الأمان' }),
      h('dl', { class: 'kv' }, h('dt', { text: 'الحساب' }), h('dd', { dir: 'ltr', text: (session && session.user && session.user.email) || '—' })),
      mfa,
      h('div', { class: 'row' }, h('button', { class: 'btn light small', type: 'button', onclick: cleanupFiles }, icon('trash'), 'تنظيف الملفات غير المستخدمة'),
        h('button', { class: 'btn light small', type: 'button', onclick: doLogout }, icon('out'), 'تسجيل الخروج'))));
    loadMfa(mfa);
    return wrap;
  }
  async function discardDraft() {
    if (!(await ask({ title: 'إرجاع المسودة؟', msg: 'ستُستبدل المسودة بالنسخة المنشورة حاليًا وتُفقد كل تعديلاتك غير المنشورة.', ok: 'إرجاع', danger: true }))) return;
    var b = busy();
    try { S.work = clone(S.published); await saveDraft(); render(); toast('أُرجعت المسودة إلى المنشور.', 'ok'); } catch (e) { toast(e.message, 'err'); } finally { b.done(); }
  }
  async function loadHistory(ul) {
    try {
      var rows = await rest('GET', '/site_content_history?select=id,published_at&order=id.desc&limit=30');
      ul.textContent = '';
      if (!rows.length) { ul.append(h('li', { class: 'muted', text: 'لا توجد نسخ سابقة بعد.' })); return; }
      rows.forEach(function (r) {
        ul.append(h('li', null, h('span', { text: fmtDate(r.published_at) }), h('button', { class: 'btn light small', type: 'button', onclick: async function () {
          if (!(await ask({ title: 'تحميل هذه النسخة؟', msg: 'ستُحمَّل في المسودة فقط لتعاينها ثم تنشرها إن أردت. المنشور الحالي لا يتغير.', ok: 'تحميل في المسودة' }))) return;
          var b = busy();
          try { await rest('POST', '/rpc/load_version_to_draft', { p_id: r.id }); await loadData(); refreshStatus(); render(); toast('حُمّلت النسخة في المسودة. عاينها ثم انشرها.', 'ok'); } catch (e) { toast(e.message, 'err'); } finally { b.done(); }
        } }, 'تحميل في المسودة')));
      });
    } catch (e) { ul.textContent = ''; ul.append(h('li', { class: 'muted', text: e.message })); }
  }
  async function loadMfa(box) {
    try {
      var u = await http('GET', '/auth/v1/user');
      var f = (u.factors || []).filter(function (x) { return x.factor_type === 'totp' && x.status === 'verified'; })[0];
      box.textContent = '';
      if (f) box.append(h('p', { text: '✔ المصادقة الثنائية مفعّلة.' }), h('div', { class: 'row' }, h('button', { class: 'btn light small', type: 'button', onclick: function () { disableMfa(f.id); } }, 'إيقاف المصادقة الثنائية')));
      else box.append(h('p', { class: 'muted', text: 'المصادقة الثنائية غير مفعّلة. يُنصح بتفعيلها (تطبيق Google Authenticator أو ما يشبهه).' }), h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: enrollMfa }, 'تفعيل المصادقة الثنائية')));
    } catch (e) { box.textContent = e.message; }
  }
  async function enrollMfa() {
    var info;
    try { info = await http('POST', '/auth/v1/factors', { factor_type: 'totp', friendly_name: 'admin-' + Date.now(), issuer: 'Dar El Ihsan' }); } catch (e) { return toast(e.message, 'err'); }
    var code = h('input', { type: 'text', inputmode: 'numeric', maxlength: 6, dir: 'ltr', autocomplete: 'one-time-code' });
    var body = h('div', { class: 'stack' }, h('div', { class: 'qr' }, h('img', { alt: 'رمز QR', src: info.totp.qr_code })),
      h('p', { class: 'muted', text: 'امسح الرمز بتطبيق المصادقة، أو أدخل هذا المفتاح يدويًا:' }), h('code', { class: 'sec', text: info.totp.secret }),
      h('label', { class: 'fld' }, h('span', { text: 'أدخل الرمز المكوّن من 6 أرقام للتأكيد' }), code));
    var done = await ask({ title: 'تفعيل المصادقة الثنائية', msg: '', body: body, ok: 'تحقق وتفعيل', onOk: async function () {
      var c = await http('POST', '/auth/v1/factors/' + info.id + '/challenge', {});
      var tok = await http('POST', '/auth/v1/factors/' + info.id + '/verify', { challenge_id: c.id, code: code.value.trim() });
      saveSession(tok);
    } });
    if (done) { toast('تم تفعيل المصادقة الثنائية ✔', 'ok'); render(); }
    else { try { await http('DELETE', '/auth/v1/factors/' + info.id); } catch (e) { /* تجاهل */ } }
  }
  async function disableMfa(id) {
    if (!(await ask({ title: 'إيقاف المصادقة الثنائية؟', msg: 'سيصبح الدخول بكلمة المرور فقط.', ok: 'إيقاف', danger: true }))) return;
    try { await http('DELETE', '/auth/v1/factors/' + id); toast('تم الإيقاف.'); render(); } catch (e) { toast(e.message, 'err'); }
  }
  function collectPaths(o, set) {
    o = normalize(o);
    Object.keys(o.images).forEach(function (k) { if (o.images[k]) set[o.images[k]] = 1; });
    o.gallery.forEach(function (g) { if (g && g.path) set[g.path] = 1; });
  }
  async function cleanupFiles() {
    var b = busy('جارٍ فحص الملفات…');
    var unused = [], total = 0;
    try {
      var used = {}; collectPaths(S.work, used); collectPaths(S.draft, used); collectPaths(S.published, used);
      var hist = await rest('GET', '/site_content_history?select=data'); hist.forEach(function (r) { collectPaths(r.data, used); });
      var off = 0, files = [];
      for (;;) {
        var page = await http('POST', '/storage/v1/object/list/' + BUCKET, { prefix: 'uploads', limit: 100, offset: off, sortBy: { column: 'name', order: 'asc' } });
        files = files.concat(page.filter(function (f) { return f.id; })); if (page.length < 100) break; off += 100;
      }
      files.forEach(function (f) { var p = 'uploads/' + f.name; if (!used[p]) { unused.push(p); total += (f.metadata && f.metadata.size) || 0; } });
    } catch (e) { b.done(); return toast(e.message, 'err'); }
    b.done();
    if (!unused.length) return toast('لا توجد ملفات غير مستخدمة.', 'ok');
    var mb = (total / 1048576).toFixed(1);
    if (!(await ask({ title: 'حذف ' + unused.length + ' ملف غير مستخدم؟', msg: 'الحجم التقريبي ' + mb + ' ميغابايت. هذه الملفات غير مرتبطة بالمسودة ولا بالمنشور ولا بالنسخ السابقة. الحذف نهائي.', ok: 'حذف نهائيًا', danger: true }))) return;
    var b2 = busy('جارٍ الحذف…');
    try {
      for (var i = 0; i < unused.length; i += 50) await http('DELETE', '/storage/v1/object/' + BUCKET, { prefixes: unused.slice(i, i + 50) });
      toast('تم حذف الملفات غير المستخدمة.', 'ok');
    } catch (e) { toast(e.message, 'err'); } finally { b2.done(); }
  }
  async function doLogout() {
    if (isDirty() && !(await ask({ title: 'تعديلات غير محفوظة', msg: 'لديك تعديلات لم تُحفظ. تسجيل الخروج سيُبقيها كنسخة احتياطية محلية على هذا الجهاز فقط. هل تريد الخروج؟', ok: 'خروج' }))) return;
    var keep = isDirty() ? localStorage.getItem(BKEY) : null;
    await signOut(); if (keep) localStorage.setItem(BKEY, keep);
    showLogin();
  }

  /* ---------- المعاينة ---------- */
  function openPreview() {
    $('#preview').hidden = false; document.body.style.overflow = 'hidden';
    $('#pvStage').className = 'pv-stage ' + ($('#pvPhone').classList.contains('on') ? 'phone' : 'desk');
    $('#pvFrame').src = 'index.html?cms_preview=1&t=' + Date.now();
  }
  function closePreview() { $('#preview').hidden = true; document.body.style.overflow = ''; $('#pvFrame').src = 'about:blank'; }
  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin || ev.source !== $('#pvFrame').contentWindow) return;
    if (ev.data && ev.data.type === 'cms-ready') ev.source.postMessage({ type: 'cms-preview', content: S.work }, location.origin);
  });

  /* ---------- التنقل والعرض ---------- */
  var VIEWS = { texts: viewTexts, images: viewImages, gallery: viewGallery, contact: viewContact, publish: viewPublish };
  function go(tab) { S.tab = tab; render(); window.scrollTo(0, 0); }
  function render() {
    document.querySelectorAll('#tabs button').forEach(function (b) { var on = b.dataset.tab === S.tab; b.setAttribute('aria-selected', String(on)); if (on && b.scrollIntoView) b.scrollIntoView({ inline: 'center', block: 'nearest' }); });
    var v = $('#view'); v.textContent = ''; v.append(VIEWS[S.tab]()); refreshStatus();
    v.querySelectorAll('details[open] textarea').forEach(autoGrow);
  }
  function showLogin(msg) {
    $('#boot').hidden = true; $('#app').hidden = true; $('#login').hidden = false;
    $('#stepCreds').hidden = false; $('#stepMfa').hidden = true; $('#password').value = ''; $('#mfaCode').value = '';
    $('#loginBtn').textContent = 'دخول'; $('#loginBtn').disabled = false;
    var e = $('#loginErr'); e.hidden = !msg; e.textContent = msg || '';
  }
  async function enterApp() {
    $('#boot').hidden = false; $('#boot').textContent = 'جارٍ التحميل…';
    var ok = await rest('POST', '/rpc/is_admin', {});
    if (ok !== true) { await signOut(); return showLogin('هذا الحساب غير مصرّح له بإدارة الموقع.'); }
    await loadData();
    $('#boot').hidden = true; $('#login').hidden = true; $('#app').hidden = false;
    var bk; try { bk = JSON.parse(localStorage.getItem(BKEY) || 'null'); } catch (e) { bk = null; }
    render();
    if (bk && bk.work && bk.base === canon(S.draft) && canon(normalize(bk.work)) !== canon(S.draft)) {
      if (await ask({ title: 'استرجاع تعديلات؟', msg: 'وُجدت تعديلات غير محفوظة من جلسة سابقة على هذا الجهاز. هل تريد استرجاعها؟', ok: 'استرجاع' })) { S.work = normalize(bk.work); refreshStatus(); render(); }
      else localStorage.removeItem(BKEY);
    }
  }

  /* ---------- التشغيل ---------- */
  function init() {
    if (!base || !CFG.supabaseKey) { $('#boot').textContent = 'لم يتم ضبط الاتصال بعد. عدّل الملف cms-config.js وأضف عنوان Supabase والمفتاح العام.'; return; }
    $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-tab]'); if (b) go(b.dataset.tab); });
    $('#btnSave').addEventListener('click', async function () {
      var b = busy('جارٍ الحفظ…'); try { await saveDraft(); render(); toast('تم حفظ المسودة ✔', 'ok'); } catch (e) { toast(e.message, 'err'); } finally { b.done(); }
    });
    $('#btnCancel').addEventListener('click', cancelEdits);
    $('#btnPublish').addEventListener('click', publish);
    $('#btnPreview').addEventListener('click', openPreview);
    $('#pvBack').addEventListener('click', closePreview);
    $('#pvPublish').addEventListener('click', function () { closePreview(); publish(); });
    $('#pvPhone').addEventListener('click', function () { $('#pvPhone').classList.add('on'); $('#pvDesk').classList.remove('on'); $('#pvStage').className = 'pv-stage phone'; });
    $('#pvDesk').addEventListener('click', function () { $('#pvDesk').classList.add('on'); $('#pvPhone').classList.remove('on'); $('#pvStage').className = 'pv-stage desk'; });
    $('#logoutBtn').addEventListener('click', doLogout);
    window.addEventListener('beforeunload', function (e) { if (S.work && isDirty()) { e.preventDefault(); e.returnValue = ''; } });

    $('#loginForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = $('#loginBtn'), err = $('#loginErr'); err.hidden = true; btn.disabled = true;
      try {
        if (!$('#stepMfa').hidden) { await verifyMfa($('#mfaCode').value.trim()); }
        else {
          var remember = $('#remember').checked; localStorage.setItem('de_admin_remember', remember ? '1' : '0');
          var r = await signIn($('#email').value.trim(), $('#password').value, remember);
          if (r === 'mfa') { $('#stepCreds').hidden = true; $('#stepMfa').hidden = false; $('#loginHint').textContent = 'أدخل الرمز من تطبيق المصادقة.'; btn.textContent = 'تأكيد'; btn.disabled = false; $('#mfaCode').focus(); return; }
        }
        await enterApp();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; }
    });

    session = loadSession();
    if (session) enterApp().catch(function (e) { showLogin(e.message); });
    else showLogin();
  }
  init();
})();
