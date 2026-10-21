/* التحقق من بطاقة التلميذ عبر رمز QR العام
   يقرأ فقط 5 حقول أساسية عبر RPC آمن get_public_child دون تسريب أي بيانات شخصية أو حساسة. */
(function () {
  'use strict';
  var CFG = window.DE_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };

  function setField(id, text) {
    var el = $('#' + id);
    if (el) el.textContent = text || '—';
  }

  function showError(msg) {
    var l = $('#loading'), err = $('#errorState'), data = $('#studentData');
    if (l) l.hidden = true;
    if (data) data.hidden = true;
    if (err) {
      err.textContent = msg;
      err.hidden = false;
    }
  }

  async function init() {
    var params = new URLSearchParams(window.location.search);
    var publicUuid = params.get('id');

    if (!publicUuid || !DE.isUuid(publicUuid)) {
      showError('رابط البطاقة غير صالح أو مفقود. يرجى مسح رمز الاستجابة السريعة (QR) الموجود على بطاقة التلميذ الرسمية.');
      return;
    }

    if (!CFG.supabaseUrl || !CFG.supabaseKey) {
      showError('إعدادات الاتصال غير مضبوطة.');
      return;
    }

    try {
      var client = DE.Client(CFG, 'de_qr_session');
      var res = await client.rpc('get_public_child', { p_uuid: publicUuid });

      if (!res || !res.full_name) {
        showError('لم يتم العثور على بيانات تلميذ مطابقة لهذا الرمز، أو أن الملف غير نشط حالياً.');
        return;
      }

      setField('f_name', res.full_name);
      setField('f_dob', res.dob || '—');

      var claimBtn = $('#btnClaim');
      if (claimBtn) {
        claimBtn.href = 'parent.html?child=' + encodeURIComponent(publicUuid);
      }

      var l = $('#loading'), data = $('#studentData');
      if (l) l.hidden = true;
      if (data) data.hidden = false;

    } catch (err) {
      showError('تعذّر التحقق من بيانات البطاقة. يرجى التأكد من اتصال الإنترنت والمحاولة ثانية.');
    }
  }

  init();
})();
