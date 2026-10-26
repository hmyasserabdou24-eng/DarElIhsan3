/* وقت تشغيل المحتوى العام: يقرأ النسخة المنشورة من Supabase (قراءة فقط بالمفتاح العام)
   ويطبّقها على الصفحة. إذا فشل الاتصال يبقى الموقع كما هو بمحتواه الأصلي.
   يُحمَّل بعد i18n-data.js وقبل script.js. */
(function () {
  'use strict';
  var CFG = window.DE_CONFIG || {};
  var CACHE_KEY = 'de_content_v1';
  var DEFAULT_T = JSON.parse(JSON.stringify(T));
  var current = null;
  var SLOT_PREVIEW_TIMEOUT = 12000;

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function str(v, max) { return typeof v === 'string' && v.length <= (max || 4000) ? v : null; }
  function safePath(p) { return typeof p === 'string' && /^[A-Za-z0-9_\-\/.]{1,200}$/.test(p) && p.indexOf('..') < 0 && p.charAt(0) !== '/'; }
  function mediaUrl(path) {
    if (!CFG.supabaseUrl || !safePath(path)) return null;
    return CFG.supabaseUrl.replace(/\/+$/, '') + '/storage/v1/object/public/' + (CFG.bucket || 'media') + '/' + path;
  }
  function httpsUrl(v) {
    try { var u = new URL(v); return u.protocol === 'https:' ? u.href : null; } catch (e) { return null; }
  }
  function lang() { return document.documentElement.lang === 'fr' ? 'fr' : 'ar'; }

  /* صور البطاقات: إن فشل تحميل الصورة تُحذف كما كان يفعل onerror سابقًا (أُزيلت السمات المضمَّنة لتفعيل CSP صارمة) */
  function dropBrokenImages() {
    document.querySelectorAll('img[data-cms-img]').forEach(function (img) {
      var bad = function () { if (!img.dataset.cmsSwapped) img.remove(); };
      if (img.complete && img.naturalWidth === 0) bad(); else img.addEventListener('error', bad, { once: true });
    });
  }

  /* ---------- النصوص: تُدمج داخل T ---------- */
  function applyTexts(content) {
    var texts = content && isObj(content.texts) ? content.texts : {};
    ['ar', 'fr'].forEach(function (l) {
      Object.keys(DEFAULT_T[l]).forEach(function (k) { T[l][k] = DEFAULT_T[l][k]; });
      var o = isObj(texts[l]) ? texts[l] : {};
      Object.keys(o).forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(DEFAULT_T[l], k)) {
          var v = str(o[k], 3000);
          if (v !== null && v.trim() !== '') T[l][k] = v;
        }
      });
    });
  }

  /* ---------- الحقول (هاتف، بريد، روابط، عنوان) ---------- */
  function remember(el, name, getter) {
    if (el.dataset['cmsDef' + name] === undefined) el.dataset['cmsDef' + name] = getter();
    return el.dataset['cmsDef' + name];
  }
  function applyFields(content) {
    var f = content && isObj(content.fields) ? content.fields : {};
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var def = remember(el, 'Text', function () { return el.textContent; });
      var v = str(f[el.dataset.cms], 300);
      el.textContent = v && v.trim() ? v : def;
    });
    document.querySelectorAll('[data-cms-mail]').forEach(function (el) {
      var defT = remember(el, 'Text', function () { return el.textContent; });
      var defH = remember(el, 'Href', function () { return el.getAttribute('href'); });
      var v = str(f[el.dataset.cmsMail], 120);
      if (v && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v)) { el.textContent = v; el.setAttribute('href', 'mailto:' + v); }
      else { el.textContent = defT; el.setAttribute('href', defH); }
    });
    document.querySelectorAll('[data-cms-tel]').forEach(function (el) {
      var defT = remember(el, 'Text', function () { return el.textContent; });
      var defH = remember(el, 'Href', function () { return el.getAttribute('href'); });
      var v = str(f[el.dataset.cmsTel], 40);
      var digits = v ? v.replace(/[^\d+]/g, '') : '';
      if (v && /^[\d\s+().\-]{5,40}$/.test(v) && digits.length >= 5) { el.textContent = v; el.setAttribute('href', 'tel:' + digits); }
      else { el.textContent = defT; el.setAttribute('href', defH); }
    });
    document.querySelectorAll('[data-cms-wa]').forEach(function (el) {
      var defH = remember(el, 'Href', function () { return el.getAttribute('href'); });
      var v = str(f[el.dataset.cmsWa], 20);
      var digits = v ? v.replace(/\D/g, '') : '';
      el.setAttribute('href', digits.length >= 8 && digits.length <= 15 ? 'https://wa.me/' + digits : defH);
    });
    document.querySelectorAll('[data-cms-link]').forEach(function (el) {
      var defH = remember(el, 'Href', function () { return el.getAttribute('href'); });
      var v = str(f[el.dataset.cmsLink], 500);
      el.setAttribute('href', (v && httpsUrl(v)) || defH);
    });
  }

  /* ---------- الصور الأساسية ---------- */
  function preload(url, ok) {
    var im = new Image(), done = false;
    var t = setTimeout(function () { done = true; }, SLOT_PREVIEW_TIMEOUT);
    im.onload = function () { if (!done) { clearTimeout(t); ok(); } };
    im.src = url;
  }
  function applyImages(content) {
    var imgs = content && isObj(content.images) ? content.images : {};
    var cover = document.querySelector('.hero-cover');
    if (cover) {
      var defBg = remember(cover, 'Bg', function () { return cover.style.backgroundImage || ''; });
      var cu = mediaUrl(imgs.cover);
      if (cu) preload(cu, function () { cover.style.backgroundImage = 'url("' + cu + '")'; });
      else cover.style.backgroundImage = defBg;
    }
    document.querySelectorAll('img[data-cms-img]').forEach(function (img) {
      var def = remember(img, 'Src', function () { return img.getAttribute('src'); });
      var u = mediaUrl(imgs[img.dataset.cmsImg]);
      if (u) preload(u, function () { img.setAttribute('src', u); });
      else img.setAttribute('src', def);
    });
  }

  /* ---------- الأقسام المخصصة (تُدرج بعد قسم موجود) ---------- */
  var AFTER = ['about', 'services', 'center', 'annexes', 'goals'];
  function buildMedia(m, alt, l) {
    if (!isObj(m)) return null;
    var el = null;
    if (m.type === 'image') {
      var u = mediaUrl(m.path); if (!u) return null;
      el = document.createElement('img'); el.src = u; el.alt = alt || ''; el.loading = 'lazy';
    } else if (m.type === 'video') {
      var vu = mediaUrl(m.path); if (!vu) return null;
      el = document.createElement('video'); el.src = vu + '#t=0.1'; el.controls = true; el.preload = 'metadata'; el.setAttribute('playsinline', '');
    } else if (m.type === 'embed') {
      var es = embedSrc(m); if (!es) return null;
      el = document.createElement('iframe'); el.src = es; el.loading = 'lazy'; el.title = alt || 'video'; el.allowFullscreen = true;
      el.setAttribute('allow', 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen');
      el.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    } else return null;
    var box = document.createElement('div'); box.className = 'cms-media'; box.appendChild(el); return box;
  }
  function renderSections() {
    document.querySelectorAll('[data-cms-sec]').forEach(function (e) { e.remove(); });
    document.querySelectorAll('a[data-cms-nav]').forEach(function (e) { e.remove(); });
    var list = current && Array.isArray(current.sections) ? current.sections.slice(0, 30) : [];
    var l = lang(), last = {}, nav = document.querySelector('.main-nav');
    var contactLink = nav ? nav.querySelector('a[href="#contact"]') : null;
    list.forEach(function (s, i) {
      if (!isObj(s) || s.hidden === true) return;
      var after = AFTER.indexOf(s.after) >= 0 ? s.after : 'goals';
      var title = pick(s.title, l), body = pick(s.body, l);
      var media = buildMedia(s.media, title, l);
      var btnLabel = isObj(s.button) ? pick(s.button.label, l) : '', btnUrl = isObj(s.button) ? httpsUrl(s.button.url) : null;
      if (!title && !body && !media) return;
      var target = last[after] || document.getElementById(after); if (!target) return;
      var sid = 's-' + (String(s.id || i).replace(/[^\w-]/g, '').slice(0, 40) || i);
      var tintDefault = !target.classList.contains('alt');
      var tint = s.bg === 'tint' ? true : s.bg === 'light' ? false : tintDefault;
      var sec = document.createElement('section'); sec.id = sid; sec.className = 'sec cms-sec' + (tint ? ' alt' : ''); sec.setAttribute('data-cms-sec', '1');
      var wrap = document.createElement('div'); wrap.className = 'wrap';
      if (title) { var h2 = document.createElement('h2'); h2.textContent = title; wrap.appendChild(h2); }
      if (body || media || (btnLabel && btnUrl)) {
        var box = document.createElement('div'); box.className = 'about-content hist cms-box' + (media ? ' has-media' : '');
        if (media) box.appendChild(media);
        var txt = document.createElement('div'); txt.className = 'cms-text';
        body.split(/\n\s*\n/).forEach(function (para) { if (para.trim()) { var p = document.createElement('p'); p.textContent = para.trim(); txt.appendChild(p); } });
        if (btnLabel && btnUrl) {
          var a = document.createElement('a'); a.className = 'btn gold'; a.href = btnUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = btnLabel; txt.appendChild(a);
        }
        if (txt.childNodes.length) box.appendChild(txt);
        wrap.appendChild(box);
      }
      sec.appendChild(wrap);
      target.insertAdjacentElement('afterend', sec); last[after] = sec;
      if (s.inMenu === true && nav && contactLink) {
        var label = pick(s.menuLabel, l) || title; if (!label) return;
        var na = document.createElement('a'); na.href = '#' + sid; na.textContent = label; na.setAttribute('data-cms-nav', '1');
        na.addEventListener('click', function () { nav.classList.remove('open'); var t = document.querySelector('.nav-toggle'); if (t) t.setAttribute('aria-expanded', 'false'); });
        nav.insertBefore(na, contactLink);
      }
    });
  }

  /* ---------- تطبيق المحتوى كاملًا ---------- */
  function apply(content, rerenderText) {
    current = isObj(content) ? content : {};
    applyTexts(current);
    if (rerenderText && typeof updateI18n === 'function') updateI18n();
    applyFields(current);
    applyImages(current);
    renderSections();
  }

  /* 1) تطبيق النسخة المخزّنة محليًا فورًا (قبل script.js) لتجنّب وميض المحتوى القديم */
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { cached = null; }
  if (isObj(cached)) { current = cached; applyTexts(cached); }

  /* 2) بعد تحميل الصفحة: تطبيق بقية العناصر ثم جلب النسخة المنشورة الحديثة */
  document.addEventListener('DOMContentLoaded', function () {
    dropBrokenImages();
    if (isObj(cached)) { applyFields(cached); applyImages(cached); renderSections(); }
    if (!CFG.supabaseUrl || !CFG.supabaseKey) return;

    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
    var headers = { apikey: CFG.supabaseKey, Accept: 'application/json' };
    if (/^eyJ/.test(CFG.supabaseKey)) headers.Authorization = 'Bearer ' + CFG.supabaseKey;
    fetch(CFG.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/site_content?id=eq.published&select=data', {
      headers: headers, signal: ctl ? ctl.signal : undefined
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) {
        clearTimeout(timer);
        var data = rows && rows[0] && rows[0].data;
        if (!isObj(data)) return;
        var before = JSON.stringify(cached || {});
        var after = JSON.stringify(data);
        try { localStorage.setItem(CACHE_KEY, after); } catch (e) { /* ignore */ }
        if (before === after) return;
        apply(data, JSON.stringify((cached && cached.texts) || {}) !== JSON.stringify(data.texts || {}));
      })
      .catch(function () { clearTimeout(timer); /* يبقى المحتوى الحالي كما هو */ });
  });

  /* إعادة رسم الأقسام المخصصة عند تبديل اللغة (script.js يغيّر lang على <html>) */
  new MutationObserver(function () { renderSections(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
