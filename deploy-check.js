/* فحص النشر: يجلب كل ملف بـ cache:'no-store' + معامل عشوائي، ويتحقق من وجوده ومن علامة الإصدار (BUILD). */
(function () {
  'use strict';
  var EXPECT_BUILD = '2026-10-19.3';
  var FILES = [
    ['index.html', 0], ['site.html', 0], ['go-login.js', 0], ['icons.js', 0], ['navback.js', 0], ['icons.css', 0], ['style.css', 0], ['script.js', 0], ['i18n-data.js', 0], ['cms.js', 0], ['cms.css', 0], ['cms-config.js', 0],
    ['manage.html', 0], ['manage.js', 1], ['parent.html', 0], ['parent.js', 1], ['portal.css', 0], ['de-core.js', 1], ['xlsx-writer.js', 1], ['card.js', 1], ['centers.js', 0], ['qr-encoder.js', 0], ['qr.js', 1],
    ['logo.png', 0], ['logo-sq.png', 0], ['manifest.webmanifest', 0], ['sw.js', 0], ['pwa.js', 0], ['pwa.css', 0], ['icon-192.png', 0], ['icon-512.png', 0]
  ];
  var h = DE.h, out = document.getElementById('out');
  function row(name, ok, note) { out.appendChild(h('div', { class: 'card' }, h('strong', { text: (ok ? '✅ ' : '❌ ') + name }), h('div', { class: 'muted small', text: note }))); }
  async function run() {
    out.textContent = '';
    var bad = 0;
    out.appendChild(h('div', { class: 'card' }, h('strong', { text: 'الإصدار المحمَّل الآن في متصفحك: ' + (DE.BUILD || '—') }),
      h('div', { class: 'muted small', text: DE.BUILD === EXPECT_BUILD ? 'مطابق للمتوقع.' : 'قديم! متصفحك يستخدم نسخة مخزَّنة مؤقتًا. أعد التحميل بقوة أو افتح الصفحة في نافذة خاصة.' })));
    for (var i = 0; i < FILES.length; i++) {
      var f = FILES[i];
      try {
        var r = await fetch(f[0] + '?nocache=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) { bad++; row(f[0], false, 'غير موجود على الخادم (HTTP ' + r.status + '). لم يُرفع إلى المستودع أو مساره خاطئ.'); continue; }
        var note = 'موجود (' + ((r.headers.get('content-length') || '') ? r.headers.get('content-length') + ' بايت' : 'OK') + ')';
        if (f[1]) {
          var t = await r.text();
          if (t.indexOf(EXPECT_BUILD) < 0) { bad++; row(f[0], false, 'موجود لكن نسخته قديمة (لا تحمل علامة الإصدار ' + EXPECT_BUILD + '). ارفع النسخة الجديدة.'); continue; }
          note += ' — الإصدار ' + EXPECT_BUILD;
        }
        row(f[0], true, note);
      } catch (e) { bad++; row(f[0], false, 'تعذّر الجلب.'); }
    }
    out.insertBefore(h('div', { class: 'card ' + (bad ? '' : 'ok') }, h('h2', { text: bad ? 'يوجد ' + bad + ' مشكلة' : 'كل الملفات موجودة ومحدّثة' })), out.firstChild);
  }
  document.getElementById('run').addEventListener('click', run);
})();
