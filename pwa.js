/* تسجيل التطبيق (PWA) + تثبيت وتشغيل تطبيق الإدارة على الكمبيوتر والهاتف.
   بدون innerHTML ولا سكربت مضمَّن (متوافق 100% مع معايير CSP الصارمة). */
(function () {
  'use strict';
  var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (secure && 'serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
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
    closeAllModals();
  });

  function closeAllModals() {
    var modals = document.querySelectorAll('.pwa-modal-backdrop');
    modals.forEach(function (m) { m.remove(); });
  }

  /* تنزيل اختصار سطح المكتب HTML الآمن */
  function downloadDesktopHtmlShortcut() {
    var targetUrl = location.href;
    var htmlContent = '<!DOCTYPE html>\n' +
      '<html lang="ar" dir="rtl">\n' +
      '<head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      '  <meta http-equiv="refresh" content="0; url=' + encodeURI(targetUrl) + '">\n' +
      '  <title>لوحة إدارة دار الإحسان</title>\n' +
      '  <style>\n' +
      '    * { box-sizing: border-box; }\n' +
      '    body {\n' +
      '      margin: 0;\n' +
      '      min-height: 100vh;\n' +
      '      display: flex;\n' +
      '      align-items: center;\n' +
      '      justify-content: center;\n' +
      '      background: #081B33;\n' +
      '      color: #FFFFFF;\n' +
      '      font-family: system-ui, -apple-system, sans-serif;\n' +
      '      padding: 20px;\n' +
      '      text-align: center;\n' +
      '    }\n' +
      '    .box {\n' +
      '      background: #0C2D55;\n' +
      '      border: 1px solid #E5C47F;\n' +
      '      border-radius: 20px;\n' +
      '      padding: 36px 28px;\n' +
      '      max-width: 440px;\n' +
      '      width: 100%;\n' +
      '      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);\n' +
      '    }\n' +
      '    h2 { color: #E5C47F; margin: 0 0 12px; font-size: 22px; }\n' +
      '    p { color: #CFE0F2; margin: 0 0 24px; font-size: 15px; line-height: 1.6; }\n' +
      '    a {\n' +
      '      display: inline-block;\n' +
      '      padding: 12px 28px;\n' +
      '      background: #E5C47F;\n' +
      '      color: #081B33;\n' +
      '      font-size: 15px;\n' +
      '      font-weight: 700;\n' +
      '      text-decoration: none;\n' +
      '      border-radius: 10px;\n' +
      '    }\n' +
      '  </style>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <div class="box">\n' +
      '    <h2>جارٍ فتح لوحة الإدارة…</h2>\n' +
      '    <p>إذا لم تفتح الصفحة تلقائياً، اضغط على الزر أدناه:</p>\n' +
      '    <a href="' + encodeURI(targetUrl) + '">دخول لوحة الإدارة</a>\n' +
      '  </div>\n' +
      '  <script>location.replace(' + JSON.stringify(targetUrl) + ');<\/script>\n' +
      '</body>\n' +
      '</html>';

    var blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'تشغيل_لوحة_الإدارة.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }

  /* تنزيل ملف مشغّل الأوامر BAT لويندوز */
  function downloadDesktopBatLauncher() {
    var targetUrl = location.href;
    var batContent = '@echo off\r\n' +
      'chcp 65001 >nul\r\n' +
      'title تشغيل لوحة إدارة دار الإحسان\r\n' +
      'cls\r\n' +
      'echo ========================================================\r\n' +
      'echo          دار الإحسان - تشغيل لوحة الإدارة\r\n' +
      'echo ========================================================\r\n' +
      'echo.\r\n' +
      'echo جارٍ فتح لوحة الإدارة في المتصفح...\r\n' +
      'start "" "' + targetUrl + '"\r\n' +
      'exit\r\n';

    var blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'تشغيل_لوحة_الإدارة.bat';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }

  /* نافذة تثبيت وتشغيل لوحة الإدارة على الكمبيوتر */
  function showDesktopInstallModal() {
    closeAllModals();

    var backdrop = document.createElement('div');
    backdrop.className = 'pwa-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    var card = document.createElement('div');
    card.className = 'pwa-modal-card';

    /* الرأس */
    var head = document.createElement('div');
    head.className = 'pwa-modal-head';

    var title = document.createElement('h2');
    title.className = 'pwa-modal-title';
    title.textContent = 'تثبيت وتشغيل لوحة الإدارة على الكمبيوتر';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'pwa-modal-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'إغلاق');
    closeBtn.addEventListener('click', function () { backdrop.remove(); });

    head.appendChild(title);
    head.appendChild(closeBtn);
    card.appendChild(head);

    /* المحتوى */
    var content = document.createElement('div');
    content.className = 'pwa-modal-content';

    /* الخيار 1: التثبيت كتطبيق مستقل PWA عبر المتصفح */
    var opt1 = document.createElement('div');
    opt1.className = 'pwa-opt-box featured';

    var opt1Head = document.createElement('div');
    opt1Head.className = 'pwa-opt-head';
    var opt1Label = document.createElement('div');
    opt1Label.className = 'pwa-opt-label';
    opt1Label.textContent = '1. التثبيت كتطبيق مستقل عبر المتصفح';
    var badge1 = document.createElement('span');
    badge1.className = 'pwa-badge';
    badge1.textContent = 'موصى به';
    opt1Head.appendChild(opt1Label);
    opt1Head.appendChild(badge1);

    var opt1Text = document.createElement('p');
    opt1Text.className = 'pwa-opt-text';
    opt1Text.textContent = 'يفتح لوحة الإدارة في نافذة مستقلة سريعة مع أيقونة على سطح المكتب وشريط المهام:';

    var opt1Steps = document.createElement('ol');
    opt1Steps.className = 'pwa-opt-steps';
    var stepA = document.createElement('li');
    stepA.textContent = 'اضغط على أيقونة التثبيت ( ⊕ أو رمز الشاشة ) في شريط عنوان المتصفح أعلى الصفحة (Chrome أو Edge).';
    var stepB = document.createElement('li');
    stepB.textContent = 'أو من قائمة المتصفح (⋮): اختر «الحفظ والمشاركة» (Save and share) ثم «تثبيت لوحة الإدارة» (Install).';
    opt1Steps.appendChild(stepA);
    opt1Steps.appendChild(stepB);

    opt1.appendChild(opt1Head);
    opt1.appendChild(opt1Text);
    opt1.appendChild(opt1Steps);

    if (savedPrompt) {
      var directInstallBtn = document.createElement('button');
      directInstallBtn.className = 'pwa-action-btn gold';
      directInstallBtn.type = 'button';
      directInstallBtn.textContent = 'تثبيت الآن بنقرة واحدة (PWA)';
      directInstallBtn.addEventListener('click', function () {
        savedPrompt.prompt();
        savedPrompt.userChoice.then(function (res) {
          if (res && res.outcome === 'accepted') {
            savedPrompt = null;
            backdrop.remove();
          }
        });
      });
      opt1.appendChild(directInstallBtn);
    }
    content.appendChild(opt1);

    /* الخيار 2: تنزيل اختصار سطح المكتب HTML الآمن */
    var opt2 = document.createElement('div');
    opt2.className = 'pwa-opt-box';

    var opt2Head = document.createElement('div');
    opt2Head.className = 'pwa-opt-head';
    var opt2Label = document.createElement('div');
    opt2Label.className = 'pwa-opt-label';
    opt2Label.textContent = '2. تنزيل اختصار سطح المكتب الفوري (.html)';
    var badge2 = document.createElement('span');
    badge2.className = 'pwa-badge';
    badge2.textContent = 'آمن وسريع';
    opt2Head.appendChild(opt2Label);
    opt2Head.appendChild(badge2);

    var opt2Text = document.createElement('p');
    opt2Text.className = 'pwa-opt-text';
    opt2Text.textContent = 'ملف خفيف يتعرف عليه ويندوز فوراً كملف متصفح، ضعه على سطح المكتب وانقر عليه مرتين للدخول المباشر دون أي رسائل تحذيرية أو حظر.';

    var dlHtmlBtn = document.createElement('button');
    dlHtmlBtn.className = 'pwa-action-btn navy';
    dlHtmlBtn.type = 'button';
    dlHtmlBtn.textContent = 'تنزيل اختصار لسطح المكتب (.html)';
    dlHtmlBtn.addEventListener('click', function () {
      downloadDesktopHtmlShortcut();
    });

    opt2.appendChild(opt2Head);
    opt2.appendChild(opt2Text);
    opt2.appendChild(dlHtmlBtn);
    content.appendChild(opt2);

    /* الخيار 3: تنزيل ملف التشغيل لويندوز BAT */
    var opt3 = document.createElement('div');
    opt3.className = 'pwa-opt-box';

    var opt3Head = document.createElement('div');
    opt3Head.className = 'pwa-opt-head';
    var opt3Label = document.createElement('div');
    opt3Label.className = 'pwa-opt-label';
    opt3Label.textContent = '3. تنزيل مشغّل الأوامر لويندوز (.bat)';
    var badge3 = document.createElement('span');
    badge3.className = 'pwa-badge';
    badge3.textContent = 'لويندوز PC';
    opt3Head.appendChild(opt3Label);
    opt3Head.appendChild(badge3);

    var opt3Text = document.createElement('p');
    opt3Text.className = 'pwa-opt-text';
    opt3Text.textContent = 'ملف تشغيل مباشر يفتح الصفحة فوراً في متصفحك الأساسي بنقرة زر واحدة.';

    var dlBatBtn = document.createElement('button');
    dlBatBtn.className = 'pwa-action-btn outline';
    dlBatBtn.type = 'button';
    dlBatBtn.textContent = 'تنزيل مشغّل الأوامر لويندوز (.bat)';
    dlBatBtn.addEventListener('click', function () {
      downloadDesktopBatLauncher();
    });

    opt3.appendChild(opt3Head);
    opt3.appendChild(opt3Text);
    opt3.appendChild(dlBatBtn);
    content.appendChild(opt3);

    card.appendChild(content);

    /* التذييل */
    var foot = document.createElement('div');
    foot.className = 'pwa-modal-foot';

    var closeFootBtn = document.createElement('button');
    closeFootBtn.className = 'pwa-action-btn outline';
    closeFootBtn.type = 'button';
    closeFootBtn.textContent = 'إغلاق النافذة';
    closeFootBtn.addEventListener('click', function () { backdrop.remove(); });

    foot.appendChild(closeFootBtn);
    card.appendChild(foot);

    backdrop.appendChild(card);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) backdrop.remove();
    });

    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape' && backdrop.parentNode) {
        backdrop.remove();
        document.removeEventListener('keydown', onEsc);
      }
    });

    document.body.appendChild(backdrop);
  }

  /* إرشاد الهاتف */
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

  /* دعم النقر على أي زر يحمل [data-install] */
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
        savedPrompt.userChoice.then(function (res) {
          if (!res || res.outcome !== 'accepted') {
            showDesktopInstallModal();
          } else {
            savedPrompt = null;
          }
        }).catch(function () {
          showDesktopInstallModal();
        });
      } else {
        showDesktopInstallModal();
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