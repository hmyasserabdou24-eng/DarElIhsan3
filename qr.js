/* qr.js — عرض معلومات طفل واحد عند مسح رمز QR. لا يعرض إلا الحقول التي يعيدها الخادم (public_child_card). */
(function () {
  'use strict';
  var CFG = window.DE_CONFIG || {}, CENTERS = window.DE_CENTERS || {};
  var base = String(CFG.supabaseUrl || '').replace(/\/+$/, '');
  var token = '';
  try { token = new URLSearchParams(location.search).get('t') || ''; } catch (e) { token = ''; }
  try { history.replaceState(null, '', location.pathname); } catch (e) { /* لا يمنع العرض */ }   // لا يبقى الرمز في شريط العنوان

  var $ = function (id) { return document.getElementById(id); };
  function show(which) {
    $('state').hidden = true;
    $('card').hidden = which !== 'card';
    $('unavailable').hidden = which !== 'off';
  }
  function dateLabel(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '—';
  }
  function memberLabel(n) { return n == null ? '—' : 'DI-' + String(n).padStart(5, '0'); }

  function render(d) {
    var center = CENTERS[d.center] || { name: '', logo: 'logo.png' };
    $('logo').src = center.logo;
    $('logo').alt = center.name;
    $('centerName').textContent = center.name;
    $('childName').textContent = d.full_name || '';
    $('memberNo').textContent = memberLabel(d.member_no);
    $('enrolled').textContent = dateLabel(d.enrolled_on);
    if (d.section) { $('section').textContent = d.section; $('sectionRow').hidden = false; }
    document.title = 'بطاقة منخرط – ' + (center.name || 'دار الإحسان');
    show('card');
  }

  if (!base || !/^[0-9a-f]{32}$/.test(token)) { show('off'); return; }

  fetch(base + '/rest/v1/rpc/public_child_card', {
    method: 'POST',
    headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ p_token: token }),
    credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer'
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.found) render(d); else show('off'); })
    .catch(function () { show('off'); });
})();
