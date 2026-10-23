/* تسجيل التطبيق (PWA) + شريط «ثبّت التطبيق». بدون innerHTML ولا سكربت مضمَّن (متوافق مع CSP). */
(function () {
  'use strict';
  var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (secure && 'serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  if (/qr\.html$/.test(location.pathname)) return;                     // صفحة التحقق العامة: لا شريط
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (standalone) return;
  var KEY = 'de-install-dismissed';
  try { var t = +localStorage.getItem(KEY); if (t && Date.now() - t < 14 * 864e5) return; } catch (e) {}
  var fr = (document.documentElement.lang || 'ar').slice(0, 2) === 'fr';
  var T = fr
    ? { msg: 'Installez l’application sur votre téléphone', btn: 'Installer', close: 'Fermer', ios: 'Appuyez sur Partager puis « Sur l’écran d’accueil »' }
    : { msg: 'ثبّت التطبيق على هاتفك للوصول السريع', btn: 'تثبيت', close: 'إغلاق', ios: 'اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»' };
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var deferred = null, bar = null;

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
        if (!deferred) return hide(true);
        deferred.prompt();
        deferred.userChoice.then(function () { deferred = null; hide(true); });
      });
      bar.appendChild(b);
    }
    var x = el('button', 'pwa-x', '×'); x.type = 'button'; x.setAttribute('aria-label', T.close);
    x.addEventListener('click', function () { hide(true); });
    bar.appendChild(x);
    document.body.appendChild(bar);
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; show(false); });
  window.addEventListener('appinstalled', function () { deferred = null; hide(true); });
  if (isIOS) window.addEventListener('load', function () { setTimeout(function () { show(true); }, 2500); });
})();
