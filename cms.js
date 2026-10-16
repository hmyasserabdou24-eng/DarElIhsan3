/* وقت تشغيل المحتوى العام: يقرأ النسخة المنشورة من Supabase (قراءة فقط بالمفتاح العام)
   ويطبّقها على الصفحة. إذا فشل الاتصال يبقى الموقع كما هو بمحتواه الأصلي.
   يُحمَّل بعد i18n-data.js وقبل script.js. */
(function () {
  'use strict';
  var CFG = window.DE_CONFIG || {};
  var CACHE_KEY = 'de_content_v1';
  var isPreview = /[?&]cms_preview=1(&|$)/.test(location.search) && window.parent !== window;
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

  /* ---------- المعرض ---------- */
  function embedSrc(it) {
    if (it.provider === 'youtube' && /^[\w-]{6,20}$/.test(it.videoId || '')) return 'https://www.youtube-nocookie.com/embed/' + it.videoId;
    if (it.provider === 'vimeo' && /^\d{4,15}$/.test(it.videoId || '')) return 'https://player.vimeo.com/video/' + it.videoId;
    return null;
  }
  function pick(o, l) {
    if (!isObj(o)) return '';
    var a = str(o[l], 1500) || '', b = str(o[l === 'ar' ? 'fr' : 'ar'], 1500) || '';
    return a.trim() ? a : b;
  }
  function renderGallery() {
    var wrap = document.getElementById('cmsGallery');
    var sec = document.getElementById('gallery');
    if (!wrap || !sec) return;
    var items = current && Array.isArray(current.gallery) ? current.gallery.slice(0, 60) : [];
    var l = lang();
    wrap.textContent = '';
    var shown = 0;
    items.forEach(function (it) {
      if (!isObj(it)) return;
      var media = null;
      if (it.type === 'image') {
        var u = mediaUrl(it.path); if (!u) return;
        media = document.createElement('img'); media.src = u; media.alt = pick(it.title, l); media.loading = 'lazy';
      } else if (it.type === 'video') {
        var vu = mediaUrl(it.path); if (!vu) return;
        media = document.createElement('video'); media.src = vu + '#t=0.1'; media.controls = true;
        media.preload = 'metadata'; media.setAttribute('playsinline', '');
      } else if (it.type === 'embed') {
        var es = embedSrc(it); if (!es) return;
        media = document.createElement('iframe'); media.src = es; media.loading = 'lazy';
        media.title = pick(it.title, l) || 'video'; media.allowFullscreen = true;
        media.setAttribute('allow', 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen');
        media.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      } else return;
      var card = document.createElement('article'); card.className = 'card in';
      var ph = document.createElement('div'); ph.className = 'ph'; ph.appendChild(media);
      var body = document.createElement('div'); body.className = 'body';
      var h = document.createElement('h3'); h.textContent = pick(it.title, l);
      var p = document.createElement('p'); p.textContent = pick(it.desc, l);
      body.appendChild(h); body.appendChild(p);
      if (!h.textContent && !p.textContent) card.className += ' no-body';
      card.appendChild(ph); card.appendChild(body);
      wrap.appendChild(card); shown++;
    });
    sec.hidden = shown === 0;
  }

  /* ---------- تطبيق المحتوى كاملًا ---------- */
  function apply(content, rerenderText) {
    current = isObj(content) ? content : {};
    applyTexts(current);
    if (rerenderText && typeof updateI18n === 'function') updateI18n();
    applyFields(current);
    applyImages(current);
    renderGallery();
  }

  /* 1) تطبيق النسخة المخزّنة محليًا فورًا (قبل script.js) لتجنّب وميض المحتوى القديم */
  var cached = null;
  if (!isPreview) {
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { cached = null; }
    if (isObj(cached)) { current = cached; applyTexts(cached); }
  }

  /* 2) بعد تحميل الصفحة: تطبيق بقية العناصر ثم جلب النسخة المنشورة الحديثة */
  document.addEventListener('DOMContentLoaded', function () {
    if (isPreview) {
      window.addEventListener('message', function (ev) {
        if (ev.origin !== location.origin || ev.source !== window.parent) return;
        var d = ev.data;
        if (d && d.type === 'cms-preview' && isObj(d.content)) apply(d.content, true);
      });
      window.parent.postMessage({ type: 'cms-ready' }, location.origin);
      return;
    }
    if (isObj(cached)) { applyFields(cached); applyImages(cached); renderGallery(); }
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

  /* إعادة رسم المعرض عند تبديل اللغة (script.js يغيّر lang على <html>) */
  new MutationObserver(function () { renderGallery(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
