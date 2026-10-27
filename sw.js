/* Service worker — دار الإحسان. يخزّن واجهة الموقع فقط (ملفات ثابتة من نفس النطاق).
   لا يلمس أي طلب إلى Supabase أو أي نطاق آخر، ولا طلبات غير GET، فلا تُخزَّن بيانات الأطفال أو الأولياء أبدًا.
   الاستراتيجية: الشبكة أولًا ثم النسخة المخزَّنة عند انقطاع الاتصال. غيّر CACHE عند كل إصدار جديد. */
'use strict';
var CACHE = 'de-shell-2026-10-27.3';
var SHELL = ['./', 'index.html', 'site.html', 'go-login.js', 'navback.js', 'icons.js', 'icons.css', 'parent.html', 'manage.html', 'qr.html', '404.html',
  'style.css', 'cms.css', 'portal.css', 'qr.css', 'manage-theme.css', 'mobile-admin.css', 'manage.webmanifest', 'pwa.css', 'pwa.js',
  'script.js', 'i18n-data.js', 'cms.js', 'cms-config.js', 'news.json', 'parent.js', 'parent-guard.js', 'de-core.js', 'username.js', 'manage.js', 'xlsx-writer.js', 'card.js', 'centers.js', 'fr-names.js', 'qr-encoder.js', 'qr-gen.js', 'qr.js', '404.js',
  'logo.png', 'logo-sq.png', 'cover.jpg', 'hero-background.jpg', 'icon-192.png', 'manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;      // Supabase والخطوط والبقية: مباشرة
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic') {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      if (req.mode === 'navigate') return caches.match('manage.html').then(function (h) { return h || caches.match('404.html'); });
      return Response.error();
    });
  }));
});
