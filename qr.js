/* صفحة التحقق العامة لبطاقة التلميذ (تُفتح عند مسح رمز QR).
   - الرابط الجديد: qr.html?c=<رمز البطاقة السري 32 حرفًا>  ← يُستدعى public_child_card
   - الروابط القديمة المطبوعة: qr.html?id=<public_uuid>      ← يُستدعى get_public_child
   تُعرض الحقول: رقم المنخرط، الاسم، المركز، الفوج/القسم، تاريخ الميلاد، طبيعة الإعاقة، الموسم الدراسي.
   لا تُعرض ملاحظات الولي (basic_info) ولا أي بيانات أخرى. */
(function () {
  'use strict';
  var CFG = window.DE_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };

  function setField(id, text) { var el = $('#' + id); if (el) el.textContent = text || '—'; }
  function centerName(key) {
    var c = (window.DE_CENTERS || {})[key] || (window.DE_CENTERS || {}).main;
    return c ? c.name : 'المركز النفسي البيداغوجي دار الإحسان';
  }
  function showError(msg) {
    $('#loading').hidden = true;
    $('#studentData').hidden = true;
    var err = $('#errorState');
    err.textContent = msg;
    err.hidden = false;
  }
  function formatDob(iso) {
    if (!iso) return '—';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? (m[1] + '/' + m[2] + '/' + m[3]) : iso;
  }
  function showCard(d) {
    setField('f_num', d.membership_no || '—');
    setField('f_name', d.full_name);
    setField('f_center', d.centerLabel || centerName(d.center));
    if (d.section) { setField('f_section', d.section); if ($('#row_section')) $('#row_section').hidden = false; }
    if (d.dob) { setField('f_dob', formatDob(d.dob)); if ($('#row_dob')) $('#row_dob').hidden = false; }
    if (d.disability) { setField('f_disability', d.disability); if ($('#row_disability')) $('#row_disability').hidden = false; }
    setField('f_period', d.academic_year ? ('السنة التربوية ' + d.academic_year.replace('-', '–')) : 'السنة التربوية 2026–2027');
    // زر دخول الولي: اسم المستخدم (اسم الطالب بالفرنسية + رقم قيده) يُملأ تلقائيًا في صفحة الدخول
    try {
      var un = window.DEUser && DEUser.username(d.full_name, d.membership_no);
      var claim = $('#btnClaim');
      if (un && claim) claim.setAttribute('href', 'parent.html?u=' + encodeURIComponent(un));
      if (un) { setField('f_user', un); var ur = $('#userRow'); if (ur) ur.hidden = false; }
    } catch (e) { /* يبقى الرابط العام */ }
    $('#loading').hidden = true;
    $('#studentData').hidden = false;
  }

  var NOT_FOUND = 'لم يتم العثور على بيانات مطابقة لهذه البطاقة. قد تكون البطاقة قديمة أو ملغاة، أو الملف غير نشط. راجع إدارة المركز.';
  var INVALID = 'رابط البطاقة غير صالح أو ناقص. يرجى مسح رمز الاستجابة السريعة (QR) الموجود على بطاقة التلميذ الرسمية.';

  async function init() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get('c');
    var legacyId = params.get('id');

    if (!token && !legacyId) return showError(INVALID);
    if (token && !/^[0-9a-f]{32}$/.test(token)) return showError(INVALID);
    if (!token && !(window.DE && DE.isUuid(legacyId))) return showError(INVALID);
    if (!CFG.supabaseUrl || !CFG.supabaseKey) return showError('إعدادات الاتصال غير مضبوطة.');

    try {
      var client = DE.Client(CFG, 'de_qr_session');
      if (token) {
        var res = await client.rpc('public_child_card', { p_token: token });
        if (!res || res.found !== true) return showError(NOT_FOUND);
        showCard({
          membership_no: res.membership_no || res.member_no,
          full_name: res.full_name,
          center: res.center,
          section: res.section,
          dob: res.dob,
          disability: res.disability,
          academic_year: res.academic_year
        });
      } else {
        // رابط قديم مطبوع قبل التحديث: نعرض الحقول العامة نفسها فقط
        var old = await client.rpc('get_public_child', { p_uuid: legacyId });
        if (!old || !old.full_name) return showError(NOT_FOUND);
        showCard({ membership_no: old.membership_no, full_name: old.full_name, centerLabel: old.branch, section: null });
      }
    } catch (err) {
      showError('تعذّر التحقق من البطاقة. تأكد من اتصال الإنترنت ثم أعد تحميل الصفحة.');
    }
  }

  init();
})();
