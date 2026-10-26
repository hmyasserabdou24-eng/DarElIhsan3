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
  var SKEY = 'de_admin_session', BKEY = 'de_admin_backup', VERSION = '5';

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
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') el[k] = v;
      else if (k === 'style' || /^on/i.test(k) || k === 'innerHTML' || k === 'outerHTML' || k === 'srcdoc') return;
      else if ((k === 'href' || k === 'src') && !/^(https:|blob:|data:image\/svg\+xml;|#|index\.html|[A-Za-z0-9_\-\/.]+\.(png|jpg|jpeg|webp|svg|mp4))/i.test(String(v))) return;
      else el.setAttribute(k, v === true ? '' : String(v));
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
    [/rate limit|too many|over_email_send_rate_limit|only request this (after|once)/i, 'محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.'],
    [/sending (recovery )?email|smtp/i, 'تعذّر إرسال البريد. تأكد من ضبط خدمة البريد (SMTP) في Supabase.'],
    [/otp.*expired|token has expired|invalid.*(token|otp)|otp_expired/i, 'الرمز غير صحيح أو انتهت صلاحيته.'],
    [/same password|should be different/i, 'اختر كلمة مرور مختلفة عن الحالية.'],
    [/aal2|insufficient_aal|assurance level/i, 'حسابك محميّ بالمصادقة الثنائية، لذا لا يمكن إعادة التعيين بالرمز. اطلب من المالك تغيير الكود من تبويب المستخدمين.'],
    [/weak.?password|password should|at least \d+ char/i, 'كلمة المرور ضعيفة أو قصيرة (8 أحرف على الأقل).'],
    [/row-level security|permission denied|42501|not authorized|غير مصرّح/i, 'هذا الحساب لا يملك صلاحية تنفيذ هذه العملية.'],
    [/payload too large|exceeded the maximum|too large/i, 'حجم الملف أكبر من الحد المسموح (50 ميغابايت).'],
    [/mime type|not supported/i, 'نوع الملف غير مدعوم. المسموح: JPG وPNG وWebP وGIF وMP4 وWebM.']
  ];
  function apiError(res) {
    return res.text().then(function (t) {
      var j = {}; try { j = JSON.parse(t); } catch (e) { /* نص */ }
      var raw = j.msg || j.message || j.error_description || j.error || t || ('HTTP ' + res.status);
      var hit = MSG.filter(function (m) { return m[0].test(raw) || m[0].test(String(j.code || '')); })[0];
      if (!hit && window.console) console.warn('API error', res.status, raw);
      var err = new Error(hit ? hit[1] : ('حدث خطأ غير متوقع (' + res.status + '). حاول مرة أخرى.')); err.status = res.status; return err;
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
    o.sections = Array.isArray(o.sections) ? o.sections : [];
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
    errs = validateSections();
    if (errs.length) { go('sections'); toast(errs[0], 'err'); throw new Error(errs[0]); }
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

  /* ---------- الأقسام المخصصة ---------- */
  var AFTER_OPTS = [['about', 'بعد قسم «من نحن»'], ['services', 'بعد قسم «خدماتنا»'], ['center', 'بعد قسم «مركزنا»'], ['annexes', 'بعد قسم «الملاحقات»'], ['goals', 'بعد قسم «أهدافنا» (الافتراضي)']];
  var MAX_SECTIONS = 30;
  function validateSections() {
    var out = [];
    S.work.sections.forEach(function (x, i) {
      var b = x.button;
      if (b && b.url) { try { if (new URL(b.url).protocol !== 'https:') out.push('القسم ' + (i + 1) + ': رابط الزر يجب أن يبدأ بـ https://'); } catch (e) { out.push('القسم ' + (i + 1) + ': رابط الزر غير صالح'); } }
    });
    return out;
  }
  function sectionCard(s, i) {
    ['title', 'body', 'menuLabel'].forEach(function (k) { if (!isObj(s[k])) s[k] = {}; });
    function txt(kind, l, label, multi) {
      var el = h(multi ? 'textarea' : 'input', { dir: l === 'ar' ? 'rtl' : 'ltr', maxlength: multi ? 8000 : 150, rows: multi ? 5 : null, type: multi ? null : 'text', 'data-grow': multi ? '1' : null });
      el.value = s[kind][l] || '';
      el.addEventListener('input', function () { if (el.value) s[kind][l] = el.value; else delete s[kind][l]; if (multi) autoGrow(el); changed(); });
      return h('label', { class: 'fld' }, h('span', { text: label }), el);
    }
    function sel(label, opts, get, set) {
      var el = h('select', null, opts.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
      el.value = get(); el.addEventListener('change', function () { set(el.value); changed(); });
      return h('label', { class: 'fld' }, h('span', { text: label }), el);
    }
    function chk(label, get, set, after) {
      var c = h('input', { type: 'checkbox' }); c.checked = !!get();
      c.addEventListener('change', function () { set(c.checked); changed(); if (after) after(c.checked); });
      return h('label', { class: 'chk' }, c, h('span', { text: label }));
    }
    // الوسائط
    var mediaBox = h('div', { class: 'stack' });
    function drawMedia() {
      mediaBox.textContent = '';
      var m = s.media;
      if (m) {
        var th = h('div', { class: 'thumb' });
        if (m.type === 'image' && safePath(m.path)) th.append(h('img', { alt: '', src: publicUrl(m.path), loading: 'lazy' }));
        else if (m.type === 'video' && safePath(m.path)) th.append(h('video', { src: publicUrl(m.path) + '#t=0.1', preload: 'metadata', controls: true, playsinline: true }));
        else th.append(h('div', { class: 'emb' }, icon('play'), h('span', { text: (m.provider === 'vimeo' ? 'Vimeo' : 'YouTube') + ' · ' + (m.videoId || '') })));
        mediaBox.append(th);
      }
      var imgIn = filePicker('image/*', false, async function (f) { var r = await handleFile(f, { only: 'image', maxDim: 1600 }); s.media = { type: 'image', path: r.path }; changed(); drawMedia(); });
      var vidIn = filePicker('video/mp4,video/webm,video/quicktime', false, async function (f) { var r = await handleFile(f, { only: 'video' }); s.media = { type: 'video', path: r.path }; changed(); drawMedia(); });
      mediaBox.append(h('div', { class: 'item-actions' },
        h('button', { class: 'btn light small', type: 'button', onclick: function () { imgIn.click(); } }, icon('upload'), 'صورة'),
        h('button', { class: 'btn light small', type: 'button', onclick: function () { vidIn.click(); } }, icon('upload'), 'فيديو'),
        h('button', { class: 'btn light small', type: 'button', onclick: async function () {
          var inp = h('input', { type: 'url', dir: 'ltr', placeholder: 'https://www.youtube.com/watch?v=…' });
          await ask({ title: 'فيديو من رابط', msg: 'الصق رابط فيديو من يوتيوب أو فيميو.', body: h('label', { class: 'fld' }, inp), ok: 'إضافة', onOk: async function () {
            var e = parseEmbed(inp.value); if (!e) throw new Error('الرابط غير مدعوم. استخدم رابط يوتيوب أو فيميو صحيحًا.');
            s.media = { type: 'embed', provider: e.provider, videoId: e.videoId }; changed(); drawMedia();
          } });
        } }, icon('link'), 'رابط فيديو'),
        m && h('button', { class: 'btn danger small', type: 'button', onclick: function () { s.media = null; changed(); drawMedia(); } }, icon('trash'), 'إزالة الوسائط'), imgIn, vidIn));
    }
    drawMedia();
    // الزر
    function btnSet(kind, l, v) { if (!s.button) s.button = { label: {}, url: '' }; if (kind === 'url') s.button.url = v; else if (v) s.button.label[l] = v; else delete s.button.label[l]; if (!s.button.url && !Object.keys(s.button.label).length) s.button = null; changed(); }
    function btnIn(kind, l, label, ph) {
      var el = h('input', { type: kind === 'url' ? 'url' : 'text', dir: kind === 'url' || l === 'fr' ? 'ltr' : 'rtl', maxlength: kind === 'url' ? 500 : 60, placeholder: ph || '' });
      el.value = s.button ? (kind === 'url' ? s.button.url || '' : (s.button.label && s.button.label[l]) || '') : '';
      el.addEventListener('input', function () { btnSet(kind, l, el.value.trim()); });
      return h('label', { class: 'fld' }, h('span', { text: label }), el);
    }
    var menuBox = h('div', { class: 'two' }, txt('menuLabel', 'ar', 'اسم القسم في القائمة (عربي) – اختياري'), txt('menuLabel', 'fr', 'Nom dans le menu (Français)'));
    menuBox.hidden = !s.inMenu;
    return h('section', { class: 'card' + (s.hidden ? ' teal' : '') },
      h('div', { class: 'row' }, h('span', { class: 'badge', text: 'قسم ' + (i + 1) + (s.hidden ? ' · مخفي' : '') }), h('span', { class: 'grow' }),
        h('button', { class: 'icon-btn small', type: 'button', 'aria-label': 'تحريك للأعلى', onclick: function () { moveSec(i, -1); } }, icon('up')),
        h('button', { class: 'icon-btn small', type: 'button', 'aria-label': 'تحريك للأسفل', onclick: function () { moveSec(i, 1); } }, icon('down'))),
      h('div', { class: 'two' }, txt('title', 'ar', 'العنوان (عربي)'), txt('title', 'fr', 'Titre (Français)'), txt('body', 'ar', 'النص (عربي)', true), txt('body', 'fr', 'Texte (Français)', true)),
      h('p', { class: 'muted', text: 'اترك سطرًا فارغًا بين الفقرات لبدء فقرة جديدة. إن تُرك الحقل الفرنسي فارغًا يظهر النص العربي.' }),
      h('div', { class: 'two' },
        sel('مكان القسم في الصفحة', AFTER_OPTS, function () { return s.after || 'goals'; }, function (v) { s.after = v; }),
        sel('لون الخلفية', [['auto', 'تلقائي'], ['light', 'فاتحة'], ['tint', 'ملوّنة']], function () { return s.bg || 'auto'; }, function (v) { s.bg = v; })),
      h('h3', { text: 'صورة أو فيديو (اختياري)' }), mediaBox,
      h('h3', { text: 'زر (اختياري)' }),
      h('div', { class: 'two' }, btnIn('label', 'ar', 'نص الزر (عربي)'), btnIn('label', 'fr', 'Texte du bouton (Français)')), btnIn('url', null, 'رابط الزر (https فقط)', 'https://…'),
      chk('إظهار القسم في القائمة العلوية', function () { return s.inMenu; }, function (v) { s.inMenu = v; }, function (v) { menuBox.hidden = !v; }), menuBox,
      chk('إخفاء القسم مؤقتًا (لا يظهر للزوار)', function () { return s.hidden; }, function (v) { s.hidden = v; render(); }),
      h('div', { class: 'item-actions' }, h('button', { class: 'btn danger small', type: 'button', onclick: async function () {
        if (await ask({ title: 'حذف القسم؟', msg: 'سيُزال من الموقع عند النشر. يمكنك التراجع قبل الحفظ بزر «إلغاء التعديلات».', ok: 'حذف', danger: true })) { S.work.sections.splice(i, 1); changed(); render(); }
      } }, icon('trash'), 'حذف القسم')));
  }
  function moveSec(i, d) { var a = S.work.sections, j = i + d; if (j < 0 || j >= a.length) return; var t = a[i]; a[i] = a[j]; a[j] = t; changed(); render(); }
  function viewSections() {
    var wrap = h('div', null, h('h2', { text: 'أقسام ونصوص إضافية' }),
      h('p', { class: 'lead', text: 'أضف قسمًا جديدًا بعنوان ونص، ويمكنك إرفاق صورة أو فيديو أو زر. يظهر بنفس تصميم الموقع.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: function () {
        if (S.work.sections.length >= MAX_SECTIONS) return toast('بلغت الحد الأقصى (' + MAX_SECTIONS + ' قسمًا).', 'err');
        S.work.sections.push(newSection()); changed(); render();
        setTimeout(function () { var c = $('#view').lastElementChild; if (c && c.scrollIntoView) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
      } }, icon('plus'), 'إضافة قسم جديد')), h('p', { class: 'muted', text: 'الأقسام التي تشترك في نفس المكان تظهر بالترتيب نفسه هنا.' }));
    if (!S.work.sections.length) wrap.append(h('div', { class: 'empty', text: 'لا توجد أقسام إضافية بعد.' }));
    S.work.sections.forEach(function (x, i) { wrap.append(sectionCard(x, i)); });
    return wrap;
  }
  function newSection() { return { id: rid(), after: 'goals', title: {}, body: {}, media: null, button: null, bg: 'auto', inMenu: false, menuLabel: {}, hidden: false }; }

  /* ---------- المستخدمون (عبر دالة خلفية آمنة) ---------- */
  var USERS_SQL = "-- =====================================================================\n--  إدارة المستخدمين + سجل العمليات + سياسة كلمات المرور — شغّله في SQL Editor\n--  (آمن لإعادة التشغيل أكثر من مرة)\n--  (لا يحتاج Edge Functions ولا أي مفتاح سري)\n--  صلاحية الإضافة/الحذف/تغيير الكود: للمالك فقط = أقدم مدير في جدول admins.\n--  يتطلب تشغيل schema.sql أولًا.\n-- =====================================================================\n\ncreate extension if not exists pgcrypto with schema extensions;\n\n-- حذف مستخدم لا يجب أن يفشل لأنه عدّل المسودة سابقًا\nalter table public.site_content drop constraint if exists site_content_updated_by_fkey;\nalter table public.site_content\n  add constraint site_content_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null;\n\n-- سجل العمليات الحساسة (لا يُقرأ ولا يُكتب إلا عبر الدوال)\ncreate table if not exists public.admin_audit (\n  id          bigint generated always as identity primary key,\n  at          timestamptz not null default now(),\n  actor       uuid,\n  actor_email text,\n  action      text not null,\n  target      text\n);\nalter table public.admin_audit enable row level security;   -- بلا سياسات = مغلق أمام الـ API\nrevoke all on public.admin_audit from anon, authenticated;\n\ncreate or replace function public.audit_log(p_action text, p_target text default null)\nreturns void\nlanguage plpgsql security definer\nset search_path = public, auth\nas $$\nbegin\n  insert into public.admin_audit (actor, actor_email, action, target)\n    values (auth.uid(), (select u.email from auth.users u where u.id = auth.uid()), p_action, left(p_target, 200));\n  delete from public.admin_audit where id <= (select max(x.id) from public.admin_audit x) - 1000;  -- نحتفظ بآخر 1000 عملية\nend $$;\nrevoke all on function public.audit_log(text, text) from public, anon, authenticated;\n\n-- هل المتصل هو المالك؟\ncreate or replace function public.is_owner()\nreturns boolean\nlanguage sql stable security definer\nset search_path = public\nas $$\n  select public.is_admin()\n     and auth.uid() = (select a.user_id from public.admins a order by a.created_at asc, a.user_id asc limit 1);\n$$;\nrevoke all on function public.is_owner() from public, anon;\ngrant execute on function public.is_owner() to authenticated;\n\n-- قائمة المديرين (متاحة لأي مدير)\ncreate or replace function public.admin_list()\nreturns jsonb\nlanguage plpgsql stable security definer\nset search_path = public, auth\nas $$\ndeclare v_owner uuid; v_out jsonb;\nbegin\n  if not public.is_admin() then\n    raise exception 'غير مصرّح' using errcode = '42501';\n  end if;\n  select a.user_id into v_owner from public.admins a order by a.created_at asc, a.user_id asc limit 1;\n  select jsonb_build_object(\n           'can_manage', auth.uid() = v_owner,\n           'admins', coalesce(jsonb_agg(jsonb_build_object(\n               'id', a.user_id, 'email', u.email, 'created_at', a.created_at,\n               'last_sign_in_at', u.last_sign_in_at,\n               'is_owner', a.user_id = v_owner, 'is_me', a.user_id = auth.uid())\n             order by a.created_at asc, a.user_id asc), '[]'::jsonb))\n    into v_out\n    from public.admins a join auth.users u on u.id = a.user_id;\n  return v_out;\nend $$;\nrevoke all on function public.admin_list() from public, anon;\ngrant execute on function public.admin_list() to authenticated;\n\n-- إضافة مستخدم (أو تحديث كود مستخدم موجود) ومنحه صلاحية الإدارة\ncreate or replace function public.admin_add_user(p_email text, p_password text)\nreturns jsonb\nlanguage plpgsql security definer\nset search_path = public, auth, extensions\nas $$\ndeclare v_email text := lower(trim(coalesce(p_email, ''))); v_id uuid; v_existed boolean := false;\nbegin\n  if not public.is_owner() then\n    raise exception 'هذه العملية للمالك فقط' using errcode = '42501';\n  end if;\n  if length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]{2,}$' then\n    raise exception 'البريد الإلكتروني غير صالح' using errcode = '22023';\n  end if;\n  if p_password is null or length(p_password) < 8 or p_password !~ '[A-Z]' or p_password !~ '[0-9]' then\n    raise exception 'الكود: 8 أحرف على الأقل مع حرف كبير (A-Z) ورقم واحد على الأقل' using errcode = '22023';\n  end if;\n  if octet_length(p_password) > 72 then\n    raise exception 'الكود طويل جدًا (الحد 72 بايت)' using errcode = '22023';\n  end if;\n\n  select u.id into v_id from auth.users u where lower(u.email) = v_email limit 1;\n  if v_id is null then\n    v_id := gen_random_uuid();\n    insert into auth.users (\n      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,\n      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,\n      confirmation_token, recovery_token, email_change_token_new, email_change,\n      email_change_token_current, phone_change, phone_change_token, reauthentication_token)\n    values (\n      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,\n      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),\n      '{\"provider\":\"email\",\"providers\":[\"email\"]}'::jsonb, '{}'::jsonb, now(), now(),\n      '', '', '', '', '', '', '', '');\n    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)\n    values (gen_random_uuid(), v_id,\n            jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),\n            'email', v_id::text, now(), now(), now());\n  else\n    v_existed := true;\n    update auth.users\n       set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),\n           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()\n     where id = v_id;\n  end if;\n\n  insert into public.admins (user_id) values (v_id) on conflict (user_id) do nothing;\n  perform public.audit_log(case when v_existed then 'update_user' else 'add_user' end, v_email);\n  return jsonb_build_object('id', v_id, 'email', v_email, 'existed', v_existed);\nend $$;\nrevoke all on function public.admin_add_user(text, text) from public, anon;\ngrant execute on function public.admin_add_user(text, text) to authenticated;\n\n-- تغيير كود مدير (ويُسجَّل خروجه من أجهزته)\ncreate or replace function public.admin_reset_password(p_user_id uuid, p_password text)\nreturns jsonb\nlanguage plpgsql security definer\nset search_path = public, auth, extensions\nas $$\nbegin\n  if not public.is_owner() then\n    raise exception 'هذه العملية للمالك فقط' using errcode = '42501';\n  end if;\n  if not exists (select 1 from public.admins a where a.user_id = p_user_id) then\n    raise exception 'المستخدم غير موجود بين المديرين' using errcode = '22023';\n  end if;\n  if p_password is null or length(p_password) < 8 or p_password !~ '[A-Z]' or p_password !~ '[0-9]' then\n    raise exception 'الكود: 8 أحرف على الأقل مع حرف كبير (A-Z) ورقم واحد على الأقل' using errcode = '22023';\n  end if;\n  if octet_length(p_password) > 72 then\n    raise exception 'الكود طويل جدًا (الحد 72 بايت)' using errcode = '22023';\n  end if;\n  update auth.users\n     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()\n   where id = p_user_id;\n  delete from auth.sessions where user_id = p_user_id;\n  perform public.audit_log('reset_password', (select u.email from auth.users u where u.id = p_user_id));\n  return jsonb_build_object('ok', true);\nend $$;\nrevoke all on function public.admin_reset_password(uuid, text) from public, anon;\ngrant execute on function public.admin_reset_password(uuid, text) to authenticated;\n\n-- حذف مدير نهائيًا (الصلاحية تسقط فورًا)\ncreate or replace function public.admin_remove_user(p_user_id uuid)\nreturns jsonb\nlanguage plpgsql security definer\nset search_path = public, auth\nas $$\ndeclare v_mail text;\nbegin\n  if not public.is_owner() then\n    raise exception 'هذه العملية للمالك فقط' using errcode = '42501';\n  end if;\n  if p_user_id = auth.uid() then\n    raise exception 'لا يمكنك حذف حسابك أنت (المالك)' using errcode = '22023';\n  end if;\n  if not exists (select 1 from public.admins a where a.user_id = p_user_id) then\n    raise exception 'المستخدم غير موجود بين المديرين' using errcode = '22023';\n  end if;\n  select u.email into v_mail from auth.users u where u.id = p_user_id;\n  delete from public.admins where user_id = p_user_id;\n  delete from auth.users where id = p_user_id;\n  perform public.audit_log('remove_user', v_mail);\n  return jsonb_build_object('ok', true);\nend $$;\nrevoke all on function public.admin_remove_user(uuid) from public, anon;\ngrant execute on function public.admin_remove_user(uuid) to authenticated;\n\n-- قراءة سجل العمليات (لأي مدير)\ncreate or replace function public.admin_audit_list(p_limit int default 30)\nreturns jsonb\nlanguage plpgsql stable security definer\nset search_path = public\nas $$\nbegin\n  if not public.is_admin() then\n    raise exception 'غير مصرّح' using errcode = '42501';\n  end if;\n  return coalesce((\n    select jsonb_agg(jsonb_build_object('at', t.at, 'actor_email', t.actor_email, 'action', t.action, 'target', t.target) order by t.id desc)\n      from (select * from public.admin_audit order by id desc limit least(greatest(coalesce(p_limit, 30), 1), 100)) t\n  ), '[]'::jsonb);\nend $$;\nrevoke all on function public.admin_audit_list(int) from public, anon;\ngrant execute on function public.admin_audit_list(int) to authenticated;\n\n-- إعادة تعريف النشر وتحميل نسخة قديمة مع تسجيلهما في السجل\ncreate or replace function public.publish_content()\nreturns timestamptz\nlanguage plpgsql security definer\nset search_path = public\nas $$\ndeclare d jsonb; t timestamptz := now();\nbegin\n  if not public.is_admin() then\n    raise exception 'غير مصرّح' using errcode = '42501';\n  end if;\n  select (data - '_portal_meta') into d from public.site_content where id = 'draft';\n  if d is null then raise exception 'لا توجد مسودة'; end if;\n\n  insert into public.site_content_history (data, published_by)\n    select data, auth.uid() from public.site_content where id = 'published' and data <> '{}'::jsonb;\n\n  insert into public.site_content (id, data, updated_at, updated_by)\n    values ('published', d, t, auth.uid())\n  on conflict (id) do update\n    set data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by;\n\n  delete from public.site_content_history\n   where id not in (select id from public.site_content_history order by id desc limit 30);\n  perform public.audit_log('publish');\n  return t;\nend $$;\nrevoke all on function public.publish_content() from public, anon;\ngrant execute on function public.publish_content() to authenticated;\n\ncreate or replace function public.load_version_to_draft(p_id bigint)\nreturns void\nlanguage plpgsql security definer\nset search_path = public\nas $$\nbegin\n  if not public.is_admin() then\n    raise exception 'غير مصرّح' using errcode = '42501';\n  end if;\n  update public.site_content\n     set data = (select data from public.site_content_history where id = p_id),\n         updated_at = now(), updated_by = auth.uid()\n   where id = 'draft'\n     and exists (select 1 from public.site_content_history where id = p_id);\n  perform public.audit_log('load_version', p_id::text);\nend $$;\nrevoke all on function public.load_version_to_draft(bigint) from public, anon;\ngrant execute on function public.load_version_to_draft(bigint) to authenticated;\n\nnotify pgrst, 'reload schema';\n";
  // الاستدعاءات تذهب إلى دوال قاعدة البيانات (RPC) المعرَّفة في users-setup.sql
  async function fn(action, payload) {
    var map = { list: ['admin_list', function () { return {}; }], add: ['admin_add_user', function (p) { return { p_email: p.email, p_password: p.password }; }],
      reset: ['admin_reset_password', function (p) { return { p_user_id: p.user_id, p_password: p.password }; }], remove: ['admin_remove_user', function (p) { return { p_user_id: p.user_id }; }] };
    var m = map[action]; payload = payload || {};
    await ensureFresh();
    var go = function () { return fetch(base + '/rest/v1/rpc/' + m[0], { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(m[1](payload)) }); };
    var res; try { res = await go(); } catch (e) { throw new Error('تعذّر الاتصال بالخادم. تحقق من الإنترنت.'); }
    if (res.status === 401 && session && (await refresh())) res = await go();
    var txt = await res.text(), j = null; try { j = JSON.parse(txt); } catch (e) { /* غير JSON */ }
    if (!res.ok) {
      var code = (j && (j.code || '')) + '', msg = (j && (j.message || j.msg)) || '';
      if (res.status === 404 && (code === 'PGRST202' || /could not find the function|schema cache/i.test(msg))) { var nd = new Error('NOT_DEPLOYED'); nd.notDeployed = true; throw nd; }
      var er = new Error(/[\u0600-\u06FF]/.test(msg) ? msg : (res.status === 401 || res.status === 403 ? 'هذا الحساب لا يملك صلاحية تنفيذ هذه العملية.' : 'حدث خطأ غير متوقع (' + res.status + '). حاول مرة أخرى.')); if (window.console) console.warn('RPC error', res.status, code, msg); er.code = code; throw er;
    }
    if (action === 'add') return { ok: true, existed: !!(j && j.existed), user: { id: j.id, email: j.email } };
    return j || { ok: true };
  }
  var PW_MSG = 'الكود: 8 أحرف على الأقل مع حرف كبير (A-Z) ورقم واحد على الأقل.';
  function pwProblem(v) { return v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v) && new TextEncoder().encode(v).length <= 72 ? '' : PW_MSG; }
  function genCode() {
    var al = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', o;
    do { var a = new Uint8Array(14); crypto.getRandomValues(a); o = ''; a.forEach(function (x) { o += al[x % al.length]; }); } while (pwProblem(o));
    return o;
  }
  function codeField(labelText, value) {
    var el = h('input', { type: 'text', dir: 'ltr', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: 72 }); if (value) el.value = value;
    var hint = h('span', { class: 'hint', text: PW_MSG + ' يُفضَّل 12 حرفًا فأكثر، ولا تستعمل اسم المركز أو سنة التأسيس.' });
    el.addEventListener('input', function () { var v = el.value; hint.classList.toggle('bad', v.length > 0 && !!pwProblem(v)); });
    var gen = h('button', { class: 'btn light small', type: 'button', onclick: function () { el.value = genCode(); el.dispatchEvent(new Event('input')); } }, 'توليد كود قوي');
    return { input: el, node: h('div', { class: 'stack' }, h('label', { class: 'fld' }, h('span', { text: labelText }), el, hint), h('div', { class: 'row' }, gen)) };
  }
  async function addUserFlow(reload) {
    var email = h('input', { type: 'email', dir: 'ltr', inputmode: 'email', autocomplete: 'off', placeholder: 'name@example.com' });
    var cf = codeField('الكود (كلمة المرور) الذي تحدده له');
    var body = h('div', { class: 'stack' }, h('label', { class: 'fld' }, h('span', { text: 'البريد الإلكتروني' }), email), cf.node);
    var created = null;
    var ok = await ask({ title: 'إضافة مستخدم بصلاحية إدارة', msg: 'سيدخل هذا الشخص إلى لوحة الإدارة بهذا البريد وهذا الكود، وتكون له صلاحية كاملة على المحتوى (دون إدارة المستخدمين).', body: body, ok: 'إضافة', onOk: async function () {
      if (pwProblem(cf.input.value)) throw new Error(PW_MSG);
      var r = await fn('add', { email: email.value.trim(), password: cf.input.value }); created = { email: r.user.email, code: cf.input.value, existed: r.existed };
    } });
    if (!ok || !created) return;
    var url = location.origin + location.pathname;
    var msg = 'بيانات الدخول إلى لوحة إدارة دار الإحسان\nالرابط: ' + url + '\nالبريد: ' + created.email + '\nالكود: ' + created.code;
    var ta = h('textarea', { readonly: true, dir: 'rtl', rows: 5 }); ta.value = msg;
    await ask({ title: created.existed ? 'تم تحديث الحساب' : 'تمت الإضافة ✔', msg: 'أرسل هذه البيانات للشخص بشكل خاص، ويُفضَّل أن يغيّر كلمته بعد أول دخول.', hideCancel: true, ok: 'تم', body: h('div', { class: 'stack' }, h('label', { class: 'fld' }, ta),
      h('button', { class: 'btn light small', type: 'button', onclick: function () { try { navigator.clipboard.writeText(msg); toast('تم النسخ', 'ok'); } catch (e) { ta.select(); } } }, 'نسخ البيانات')) });
    reload();
  }
  async function resetUserFlow(u, reload) {
    var cf = codeField('الكود الجديد لـ ' + u.email);
    var ok = await ask({ title: 'تغيير كود الدخول', msg: 'سيُستبدل كود هذا المستخدم فورًا.', body: cf.node, ok: 'تغيير', onOk: async function () { if (pwProblem(cf.input.value)) throw new Error(PW_MSG); await fn('reset', { user_id: u.id, password: cf.input.value }); } });
    if (ok) { toast('تم تغيير الكود. أبلغ صاحبه به.', 'ok'); reload(); }
  }
  async function removeUserFlow(u, reload) {
    if (!(await ask({ title: 'حذف هذا المستخدم؟', msg: u.email + ' — ستسقط صلاحيته فورًا ويُحذف حسابه نهائيًا.', ok: 'حذف', danger: true }))) return;
    var b = busy(); try { await fn('remove', { user_id: u.id }); toast('تم حذف المستخدم.', 'ok'); reload(); } catch (e) { toast(e.message, 'err'); } finally { b.done(); }
  }
  function viewUsers() {
    var box = h('div', { class: 'stack' }, h('p', { class: 'muted', text: 'جارٍ التحميل…' }));
    var wrap = h('div', null, h('h2', { text: 'المستخدمون وصلاحيات الدخول' }),
      h('p', { class: 'lead', text: 'من هنا تمنح أي بريد إلكتروني حق الدخول إلى لوحة الإدارة بكود تحدده أنت.' }), box);
    function load() {
      box.textContent = ''; box.append(h('p', { class: 'muted', text: 'جارٍ التحميل…' }));
      fn('list').then(function (r) {
        box.textContent = '';
        if (r.can_manage) box.append(h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: function () { addUserFlow(load); } }, icon('plus'), 'إضافة مستخدم')));
        else box.append(h('p', { class: 'muted', text: 'إدارة المستخدمين متاحة للمالك فقط. هذه قائمة بالمديرين الحاليين.' }));
        var ul = h('ul', { class: 'list' });
        r.admins.forEach(function (u) {
          var meta = h('div', { class: 'grow' }, h('div', { dir: 'ltr', class: 'u-mail', text: u.email }),
            h('div', { class: 'row' }, u.is_owner && h('span', { class: 'badge owner', text: 'المالك' }), u.is_me && h('span', { class: 'badge', text: 'أنت' }),
              h('span', { class: 'muted small', text: u.last_sign_in_at ? 'آخر دخول: ' + fmtDate(u.last_sign_in_at) : 'لم يدخل بعد' })));
          var acts = h('div', { class: 'item-actions' });
          if (r.can_manage && !u.is_owner) {
            acts.append(h('button', { class: 'btn light small', type: 'button', onclick: function () { resetUserFlow(u, load); } }, 'تغيير الكود'),
              h('button', { class: 'btn danger small', type: 'button', onclick: function () { removeUserFlow(u, load); } }, icon('trash'), 'حذف'));
          }
          ul.append(h('li', { class: 'u-row' }, meta, acts));
        });
        box.append(ul);
      }).catch(function (e) {
        box.textContent = '';
        if (e.notDeployed) box.append(h('section', { class: 'card' }, h('h3', { text: 'تفعيل الميزة (مرة واحدة، دقيقة واحدة)' }),
          h('p', { text: 'إنشاء حسابات جديدة عملية حساسة، لذلك تُنفَّذ داخل قاعدة البيانات نفسها بدوال محمية للمالك فقط.' }),
          h('ol', { class: 'steps' }, h('li', { text: 'اضغط «نسخ كود SQL» أدناه.' }), h('li', { text: 'افتح Supabase ▸ SQL Editor ▸ New query والصق الكود.' }), h('li', { text: 'اضغط Run، ثم عد إلى هنا واضغط «إعادة المحاولة».' })),
          h('div', { class: 'row' },
            h('button', { class: 'btn', type: 'button', onclick: function () { try { navigator.clipboard.writeText(USERS_SQL).then(function () { toast('تم نسخ الكود ✔', 'ok'); }, function () { toast('تعذّر النسخ تلقائيًا؛ استخدم الملف users-setup.sql', 'err'); }); } catch (x) { toast('تعذّر النسخ تلقائيًا؛ استخدم الملف users-setup.sql', 'err'); } } }, 'نسخ كود SQL'),
            h('button', { class: 'btn light', type: 'button', onclick: load }, 'إعادة المحاولة'))));
        else box.append(h('div', { class: 'err', text: e.message }));
      });
    }
    load(); return wrap;
  }
  async function changeMyPassword() {
    var cf = codeField('كلمة المرور الجديدة لحسابك');
    var ok = await ask({ title: 'تغيير كلمة مروري', msg: 'ستُستعمل في الدخول القادم.', body: cf.node, ok: 'تغيير', onOk: async function () {
      var v = cf.input.value; if (pwProblem(v)) throw new Error(PW_MSG);
      await http('PUT', '/auth/v1/user', { password: v });
    } });
    if (ok) toast('تم تغيير كلمة المرور ✔', 'ok');
  }

  /* ---------- النشر والأمان ---------- */
  function diffCounts(a, b) {
    var t = 0; ['ar', 'fr'].forEach(function (l) { var ks = Object.keys(Object.assign({}, a.texts[l], b.texts[l])); ks.forEach(function (k) { if (a.texts[l][k] !== b.texts[l][k]) t++; }); });
    var f = Object.keys(Object.assign({}, a.fields, b.fields)).filter(function (k) { return a.fields[k] !== b.fields[k]; }).length;
    var im = Object.keys(Object.assign({}, a.images, b.images)).filter(function (k) { return a.images[k] !== b.images[k]; }).length;
    return { t: t, f: f, im: im, g: canon(a.gallery) === canon(b.gallery) ? 0 : 1, s: canon(a.sections) === canon(b.sections) ? 0 : 1 };
  }
  function viewPublish() {
    var d = diffCounts(S.work, S.published);
    var wrap = h('div', null, h('h2', { text: 'النشر والأمان' }));
    wrap.append(h('section', { class: 'card teal' }, h('h3', { text: 'الحالة' }),
      h('dl', { class: 'kv' },
        h('dt', { text: 'آخر نشر' }), h('dd', { text: S.pubAt && canon(S.published) !== canon(normalize({})) ? fmtDate(S.pubAt) : 'لم يُنشر محتوى بعد' }),
        h('dt', { text: 'آخر حفظ للمسودة' }), h('dd', { text: S.draftAt ? fmtDate(S.draftAt) : '—' }),
        h('dt', { text: 'الفروق عن المنشور' }), h('dd', { text: (d.t + d.f + d.im + d.g + d.s) ? [d.t && d.t + ' نص', d.f && d.f + ' بيانات اتصال', d.im && d.im + ' صورة أساسية', d.g && 'المعرض', d.s && 'الأقسام المخصصة'].filter(Boolean).join('، ') : 'لا فروق' })),
      h('div', { class: 'row' }, h('button', { class: 'btn light small', type: 'button', onclick: discardDraft }, icon('undo'), 'إرجاع المسودة إلى المنشور'))));
    var hist = h('ul', { class: 'list' }, h('li', { class: 'muted', text: 'جارٍ التحميل…' }));
    wrap.append(h('section', { class: 'card plain' }, h('h3', { text: 'النسخ المنشورة السابقة' }), hist));
    loadHistory(hist);
    var auditBox = h('ul', { class: 'list' }, h('li', { class: 'muted', text: 'جارٍ التحميل…' }));
    wrap.append(h('section', { class: 'card plain' }, h('h3', { text: 'سجل العمليات الحساسة' }), auditBox));
    loadAudit(auditBox);
    var mfa = h('div', null, h('p', { class: 'muted', text: 'جارٍ التحقق…' }));
    wrap.append(h('section', { class: 'card plain' }, h('h3', { text: 'الأمان' }),
      h('dl', { class: 'kv' }, h('dt', { text: 'الحساب' }), h('dd', { dir: 'ltr', text: (session && session.user && session.user.email) || '—' })),
      mfa,
      h('div', { class: 'row' }, h('button', { class: 'btn light small', type: 'button', onclick: changeMyPassword }, 'تغيير كلمة مروري'), h('button', { class: 'btn light small', type: 'button', onclick: cleanupFiles }, icon('trash'), 'تنظيف الملفات غير المستخدمة'),
        h('button', { class: 'btn light small', type: 'button', onclick: doLogout }, icon('out'), 'تسجيل الخروج'))));
    loadMfa(mfa);
    return wrap;
  }
  var AUDIT_LABELS = { publish: 'نشر المحتوى', load_version: 'تحميل نسخة سابقة إلى المسودة', add_user: 'إضافة مستخدم', update_user: 'تحديث كود مستخدم موجود', reset_password: 'تغيير كود مستخدم', remove_user: 'حذف مستخدم' };
  async function loadAudit(ul) {
    try {
      var rows = await rest('POST', '/rpc/admin_audit_list', { p_limit: 20 });
      ul.textContent = '';
      if (!rows || !rows.length) { ul.append(h('li', { class: 'muted', text: 'لا توجد عمليات مسجَّلة بعد.' })); return; }
      rows.forEach(function (r) {
        ul.append(h('li', { class: 'u-row' }, h('div', { class: 'grow' }, h('div', { text: (AUDIT_LABELS[r.action] || r.action) + (r.target ? ' — ' + r.target : '') }),
          h('div', { class: 'muted small', dir: 'ltr', text: (r.actor_email || '—') })), h('span', { class: 'muted small', text: fmtDate(r.at) })));
      });
    } catch (e) { ul.textContent = ''; ul.append(h('li', { class: 'muted', text: 'السجل غير مفعّل بعد: شغّل ملف users-setup.sql المحدَّث في SQL Editor.' })); }
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
    o.sections.forEach(function (x) { if (x && x.media && x.media.path) set[x.media.path] = 1; });
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
  var VIEWS = { texts: viewTexts, sections: viewSections, images: viewImages, gallery: viewGallery, contact: viewContact, users: viewUsers, publish: viewPublish };
  function go(tab) { S.tab = tab; render(); window.scrollTo(0, 0); }
  function render() {
    document.querySelectorAll('#tabs button').forEach(function (b) { var on = b.dataset.tab === S.tab; b.setAttribute('aria-selected', String(on)); if (on && b.scrollIntoView) b.scrollIntoView({ inline: 'center', block: 'nearest' }); });
    var v = $('#view'); v.textContent = '';
    try { if (!VIEWS[S.tab]) throw new Error('هذا القسم غير موجود في ملف admin.js المرفوع'); v.append(VIEWS[S.tab]()); }
    catch (ex) { v.append(h('div', { class: 'err', text: 'تعذّر عرض هذا القسم: ' + ex.message + '. ارفع كل ملفات الإصدار الأخير (admin.html وadmin.js وadmin.css) ثم حدّث الصفحة بالكامل.' })); }
    refreshStatus();
    v.querySelectorAll('details[open] textarea, textarea[data-grow]').forEach(autoGrow);
  }
  var loginMode = 'login', resetEmail = '', resendT = null;
  function setMode(m, hint) {
    loginMode = m;
    $('#stepCreds').hidden = m !== 'login'; $('#stepMfa').hidden = m !== 'mfa';
    $('#stepForgot1').hidden = m !== 'forgot1'; $('#stepForgot2').hidden = m !== 'forgot2';
    $('#forgotBtn').hidden = m !== 'login'; $('#backBtn').hidden = m === 'login' || m === 'mfa';
    $('#loginBtn').textContent = { login: 'دخول', mfa: 'تأكيد', forgot1: 'إرسال الرمز إلى بريدي', forgot2: 'تأكيد الرمز وتعيين كلمة المرور' }[m];
    $('#loginBtn').disabled = false;
    $('#loginHint').textContent = hint || { login: 'سجّل الدخول لإدارة محتوى الموقع.', mfa: 'أدخل الرمز من تطبيق المصادقة.', forgot1: 'اكتب بريد حسابك وسنرسل إليه رمز تحقق.', forgot2: 'أدخل الرمز الذي وصلك ثم اختر كلمة مرور جديدة.' }[m];
    $('#loginErr').hidden = true; $('#loginOk').hidden = true;
  }
  function showLogin(msg) {
    $('#boot').hidden = true; $('#app').hidden = true; $('#login').hidden = false;
    $('#password').value = ''; $('#mfaCode').value = ''; $('#rCode').value = ''; $('#rPass').value = ''; $('#rPass2').value = '';
    setMode('login');
    var e = $('#loginErr'); e.hidden = !msg; e.textContent = msg || '';
  }
  function cooldown() {
    var b = $('#resendBtn'), left = 60; b.disabled = true; clearInterval(resendT);
    resendT = setInterval(function () { left--; if (left <= 0) { clearInterval(resendT); b.disabled = false; b.textContent = 'إعادة إرسال الرمز'; } else b.textContent = 'إعادة الإرسال بعد ' + left + ' ثانية'; }, 1000);
    b.textContent = 'إعادة الإرسال بعد 60 ثانية';
  }
  async function sendRecovery(email) {
    var r; try { r = await fetch(base + '/auth/v1/recover', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }, false), body: JSON.stringify({ email: email }) }); }
    catch (e) { throw new Error('تعذّر الاتصال بالخادم. تحقق من الإنترنت.'); }
    if (!r.ok) throw await apiError(r);
  }
  async function finishReset(email, code, pw) {
    var hd = function (tok) { return headers({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, false); };
    var v; try { v = await fetch(base + '/auth/v1/verify', { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }, false), body: JSON.stringify({ type: 'recovery', email: email, token: code }) }); }
    catch (e) { throw new Error('تعذّر الاتصال بالخادم. تحقق من الإنترنت.'); }
    if (!v.ok) throw await apiError(v);
    var tok = await v.json();
    var u = await fetch(base + '/auth/v1/user', { method: 'PUT', headers: hd(tok.access_token), body: JSON.stringify({ password: pw }) });
    if (!u.ok) { var er = await apiError(u); fetch(base + '/auth/v1/logout', { method: 'POST', headers: hd(tok.access_token) }).catch(function () { }); throw er; }
    fetch(base + '/auth/v1/logout', { method: 'POST', headers: hd(tok.access_token) }).catch(function () { }); // نُغلق جلسة الاستعادة ونسجّل الدخول بشكل طبيعي (مع المصادقة الثنائية إن وُجدت)
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
    var mv = document.querySelector('meta[name=admin-version]');
    if (!mv || mv.content !== VERSION) { $('#boot').textContent = 'ملفات لوحة الإدارة غير متطابقة (admin.html وadmin.js). ارفع كل ملفات الإصدار الأخير ثم حدّث الصفحة بالكامل (Ctrl+F5).'; return; }
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

    $('#forgotBtn').addEventListener('click', function () { $('#fEmail').value = $('#email').value.trim(); setMode('forgot1'); $('#fEmail').focus(); });
    $('#backBtn').addEventListener('click', function () { clearInterval(resendT); setMode('login'); });
    $('#resendBtn').addEventListener('click', async function () {
      var err = $('#loginErr'); err.hidden = true;
      try { await sendRecovery(resetEmail); cooldown(); var ok = $('#loginOk'); ok.textContent = 'أُعيد إرسال الرمز.'; ok.hidden = false; } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    });
    $('#loginForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = $('#loginBtn'), err = $('#loginErr'), okm = $('#loginOk'); err.hidden = true; okm.hidden = true; btn.disabled = true;
      try {
        if (loginMode === 'mfa') { await verifyMfa($('#mfaCode').value.trim()); await enterApp(); }
        else if (loginMode === 'forgot1') {
          var em = $('#fEmail').value.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) throw new Error('اكتب بريدًا إلكترونيًا صالحًا.');
          await sendRecovery(em); resetEmail = em;
          setMode('forgot2'); cooldown(); $('#rCode').focus();
          okm.textContent = 'إن كان هذا البريد مسجَّلًا فقد أُرسل إليه رمز التحقق. تحقق أيضًا من البريد المزعج (Spam).'; okm.hidden = false; return;
        }
        else if (loginMode === 'forgot2') {
          var code = $('#rCode').value.replace(/\s/g, ''), p1 = $('#rPass').value, p2 = $('#rPass2').value;
          if (!/^\d{6,10}$/.test(code)) throw new Error('الرمز أرقام فقط (6 إلى 10 أرقام).');
          if (pwProblem(p1)) throw new Error('كلمة المرور: 8 أحرف على الأقل مع حرف كبير (A-Z) ورقم واحد على الأقل.');
          if (p1 !== p2) throw new Error('كلمتا المرور غير متطابقتين.');
          await finishReset(resetEmail, code, p1);
          clearInterval(resendT);
          var r2 = await signIn(resetEmail, p1, true);
          if (r2 === 'mfa') { setMode('mfa'); $('#mfaCode').focus(); return; }
          await enterApp();
        }
        else {
          var remember = $('#remember').checked; localStorage.setItem('de_admin_remember', remember ? '1' : '0');
          var r = await signIn($('#email').value.trim(), $('#password').value, remember);
          if (r === 'mfa') { setMode('mfa'); $('#mfaCode').focus(); return; }
          await enterApp();
        }
      } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; }
    });

    session = loadSession();
    if (session) enterApp().catch(function (e) { showLogin(e.message); });
    else showLogin();
  }
  init();
})();
