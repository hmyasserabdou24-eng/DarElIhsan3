/* تسجيل التطبيق (PWA) + تثبيت تطبيق الإدارة على الكمبيوتر والهاتف.
   بدون innerHTML ولا سكربت مضمَّن (متوافق 100% مع CSP). */
(function () {
  'use strict';
  var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (secure && 'serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var savedPrompt = null;

  function syncInstallButtons() {
    var btns = [].slice.call(document.querySelectorAll('[data-install]'));
    btns.forEach(function (b) {
      b.hidden = false;
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    savedPrompt = e;
    syncInstallButtons();
  });

  window.addEventListener('appinstalled', function () {
    savedPrompt = null;
    standalone = true;
    syncInstallButtons();
  });

  function showInstallHint() {
    var old = document.querySelector('.pwa-bar.pwa-hint');
    if (old) old.remove();
    var box = document.createElement('div');
    box.className = 'pwa-bar pwa-hint';
    box.setAttribute('role', 'status');

    var msg = document.createElement('span');
    msg.className = 'pwa-msg';
    msg.textContent = 'لتثبيت لوحة الإدارة كتطبيق مستقل على الكمبيوتر: اضغط على أيقونة التثبيت (⊕ أو الشاشة مع السهم) الموجودة في شريط عنوان المتصفح (Chrome / Edge) أعلى الصفحة.';

    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'pwa-x';
    x.textContent = '×';
    x.setAttribute('aria-label', 'إغلاق');
    x.addEventListener('click', function () { box.remove(); });

    box.appendChild(msg);
    box.appendChild(x);
    document.body.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.remove(); }, 20000);
  }

  function showMobileInstallHint() {
    var old = document.querySelector('.pwa-bar.pwa-hint');
    if (old) old.remove();
    var box = document.createElement('div');
    box.className = 'pwa-bar pwa-hint';
    box.setAttribute('role', 'status');

    var msg = document.createElement('span');
    msg.className = 'pwa-msg';
    if (isIOS) {
      msg.textContent = 'لتثبيت لوحة الإدارة على الآيفون: اضغط على زر المشاركة (Share ⎋) أسفل المتصفح ثم اختر «إضافة إلى الشاشة الرئيسية».';
    } else {
      msg.textContent = 'لتثبيت لوحة الإدارة على الأندرويد: اضغط على قائمة المتصفح (⋮) أعلى الشاشة ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».';
    }

    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'pwa-x';
    x.textContent = '×';
    x.setAttribute('aria-label', 'إغلاق');
    x.addEventListener('click', function () { box.remove(); });

    box.appendChild(msg);
    box.appendChild(x);
    document.body.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.remove(); }, 15000);
  }

  /* دعم النقر على أي زر يحمل [data-install] لتفعيل تثبيت المتصفح الرسمي (PWA) */
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-install]') : null;
    if (!btn) return;
    e.preventDefault();
    if (isMobile) {
      if (savedPrompt) {
        savedPrompt.prompt();
        savedPrompt.userChoice.then(function () { savedPrompt = null; });
      } else {
        showMobileInstallHint();
      }
    } else {
      if (savedPrompt) {
        savedPrompt.prompt();
        savedPrompt.userChoice.then(function () { savedPrompt = null; });
      } else {
        showInstallHint();
      }
    }
  });

  syncInstallButtons();

  if (/qr\.html$/.test(location.pathname)) return;
  if (standalone) return;
  if (document.querySelector('[data-install]')) return;

  var KEY = 'de-install-dismissed';
  try { var t = +localStorage.getItem(KEY); if (t && Date.now() - t < 14 * 864e5) return; } catch (e) {}
  var fr = (document.documentElement.lang || 'ar').slice(0, 2) === 'fr';
  var T = fr
    ? { msg: 'Installez l’application sur votre appareil', btn: 'Installer', close: 'Fermer', ios: 'Appuyez sur Partager puis « Sur l’écran d’accueil »' }
    : { msg: 'ثبّت التطبيق على جهازك للوصول السريع', btn: 'تثبيت التطبيق', close: 'إغلاق', ios: 'اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»' };
  var bar = null;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  function hide(remember) {
    if (bar) { bar.remove(); bar = null; }
    if (remember) { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  }
  function show(iosHint) {
    if (bar) return;
    bar = el('div', 'pwa-bar'); bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', T.msg);
    bar.appendChild(el('span', 'pwa-msg', iosHint ? T.ios : T.msg));
    if (!iosHint) {
      var b = el('button', 'pwa-btn', T.btn); b.type = 'button';
      b.addEventListener('click', function () {
        if (!savedPrompt) return hide(true);
        savedPrompt.prompt();
        savedPrompt.userChoice.then(function () { savedPrompt = null; hide(true); });
      });
      bar.appendChild(b);
    }
    var x = el('button', 'pwa-x', '×'); x.type = 'button'; x.setAttribute('aria-label', T.close);
    x.addEventListener('click', function () { hide(true); });
    bar.appendChild(x);
    document.body.appendChild(bar);
  }
  window.addEventListener('beforeinstallprompt', function () { if (!document.querySelector('[data-install]')) show(false); });
  if (isIOS) window.addEventListener('load', function () { setTimeout(function () { show(true); }, 2500); });
})();