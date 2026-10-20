/* card.js — بطاقة المنخرط: رسم على Canvas، تصدير PDF بلا مكتبات، والطباعة.
   لا innerHTML. الصورة تُولَّد داخل المتصفح فقط (لا تُرفع إلى أي خادم).
   الاستعمال: DECARD.render(info) ← { blob, url }  ثم DECARD.toPdf(blob) / DECARD.print(url) */
(function (root) {
  'use strict';

  var W = 1011, H = 638;                      // 85.6 × 54 مم بدقة 300 dpi (بطاقة بحجم بطاقة الائتمان)
  var NAVY = '#0c2d55', GOLD = '#b4873a', INK = '#14263d', MUTED = '#667689', LINE = 'rgba(18,62,115,.18)';
  var FONT = 'Cairo, Tajawal, "Segoe UI", Tahoma, sans-serif';

  function pad(n) { return String(n).padStart(2, '0'); }
  function memberLabel(n) { return n == null ? '—' : 'DI-' + String(n).padStart(5, '0'); }
  function dateLabel(iso) {                    // YYYY-MM-DD → DD/MM/YYYY (أرقام لاتينية)
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '—';
  }

  function loadImage(src) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { res(null); };
      img.src = src;
    });
  }

  // لفّ النص إلى أسطر بحدّ عرض (يحافظ على الكلمات)
  function wrap(ctx, text, maxW, maxLines) {
    var words = String(text || '').split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {                       // قصّ السطر الأخير بعلامة …
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (ctx.measureText(last + '…').width > maxW && last.length > 1) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawQr(ctx, text, x, y, box) {
    var q = root.DEQR.encode(text), total = q.size + 8;      // هامش 4 وحدات
    var m = Math.floor(box / total), side = m * total, ox = x + Math.floor((box - side) / 2), oy = y + Math.floor((box - side) / 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, box, box);
    ctx.fillStyle = '#000000';
    for (var r = 0; r < q.size; r++) for (var c = 0; c < q.size; c++) {
      if (q.dark(c, r)) ctx.fillRect(ox + (c + 4) * m, oy + (r + 4) * m, m, m);
    }
  }

  function fontsReady() {
    if (!(document.fonts && document.fonts.load)) return Promise.resolve();
    return Promise.all([document.fonts.load('800 40px Cairo'), document.fonts.load('700 28px Cairo'), document.fonts.load('400 26px Cairo')])
      .catch(function () { /* الخط الاحتياطي يكفي */ });
  }

  /* info: { full_name, center (مفتاح المركز), member_no, enrolled_on, qr_token, section?, url } */
  function render(info) {
    var C = root.DE_CENTERS || {}, center = C[info.center] || { name: '', logo: 'logo.png' };
    return fontsReady().then(function () { return loadImage(center.logo); }).then(function (logo) {
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d');
      ctx.direction = 'rtl';
      ctx.textBaseline = 'alphabetic';

      // خلفية وترويسة
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, 190);
      ctx.fillStyle = GOLD; ctx.fillRect(0, 190, W, 8);

      // شعار المركز (يمين، دائرة بيضاء)
      var lx = W - 40 - 120, ly = 95;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(lx, ly, 78, 0, Math.PI * 2); ctx.fill();
      if (logo) {
        var s = Math.min(112 / logo.width, 112 / logo.height), lw = logo.width * s, lh = logo.height * s;
        ctx.drawImage(logo, lx - lw / 2, ly - lh / 2, lw, lh);
      }

      // اسم المركز وعنوان البطاقة (يسار الشعار، محاذاة يمين)
      var tx = lx - 105, maxTextW = tx - 40;
      ctx.textAlign = 'right';
      ctx.fillStyle = GOLD; ctx.font = '700 30px ' + FONT;
      ctx.fillText('بطاقة منخرط · دار الإحسان', tx, 62);
      ctx.fillStyle = '#ffffff'; ctx.font = '800 36px ' + FONT;
      var nameLines = wrap(ctx, center.name, maxTextW, 2);
      nameLines.forEach(function (ln, i) { ctx.fillText(ln, tx, 118 + i * 50); });

      // QR (يسار)
      var qx = 60, qy = 240, qb = 340;
      ctx.strokeStyle = LINE; ctx.lineWidth = 3; roundRect(ctx, qx - 12, qy - 12, qb + 24, qb + 24, 18); ctx.stroke();
      drawQr(ctx, info.url, qx, qy, qb);

      // بيانات الطفل (يمين)
      var rx = W - 60;
      ctx.textAlign = 'right';
      ctx.fillStyle = MUTED; ctx.font = '400 26px ' + FONT;
      ctx.fillText('الاسم واللقب', rx, 262);
      ctx.fillStyle = INK; ctx.font = '800 50px ' + FONT;
      var nm = wrap(ctx, info.full_name, 560, 2);
      nm.forEach(function (ln, i) { ctx.fillText(ln, rx, 322 + i * 58); });

      var yA = nm.length > 1 ? 470 : 420;
      ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx - 560, yA - 40); ctx.lineTo(rx, yA - 40); ctx.stroke();
      ctx.fillStyle = MUTED; ctx.font = '400 26px ' + FONT;
      ctx.fillText('رقم المنخرط', rx, yA);
      ctx.fillStyle = NAVY; ctx.font = '800 52px ' + FONT;
      ctx.fillText(memberLabel(info.member_no), rx, yA + 58);

      ctx.fillStyle = MUTED; ctx.font = '400 26px ' + FONT;
      ctx.fillText('تاريخ الانخراط', rx - 300, yA);
      ctx.fillStyle = INK; ctx.font = '700 36px ' + FONT;
      ctx.fillText(dateLabel(info.enrolled_on), rx - 300, yA + 58);

      if (info.section) {
        ctx.fillStyle = MUTED; ctx.font = '400 24px ' + FONT;
        ctx.fillText(wrap(ctx, info.section, 260, 1)[0], rx - 300, yA + 100);
      }

      return new Promise(function (res, rej) {
        cv.toBlob(function (jpeg) {
          if (!jpeg) return rej(new Error('تعذّر إنشاء صورة البطاقة.'));
          res({ jpeg: jpeg, url: URL.createObjectURL(jpeg), width: W, height: H });
        }, 'image/jpeg', 0.95);
      });
    });
  }

  /* PDF من صورة JPEG واحدة بحجم البطاقة (ملف PDF صالح يعرض العربية كما هي) */
  function toPdf(card) {
    return card.jpeg.arrayBuffer().then(function (buf) {
      var jpeg = new Uint8Array(buf), enc = new TextEncoder();
      var pw = (W * 72 / 300).toFixed(2), ph = (H * 72 / 300).toFixed(2);
      var content = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
      var parts = [], offsets = [], pos = 0;
      function add(b) { parts.push(b); pos += b.length; }
      add(enc.encode('%PDF-1.4\n%âãÏÓ\n'));
      var objs = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'
      ];
      for (var i = 0; i < 5; i++) {
        offsets.push(pos);
        if (i < 3) add(enc.encode((i + 1) + ' 0 obj\n' + objs[i] + '\nendobj\n'));
        else if (i === 3) {
          add(enc.encode('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + W + ' /Height ' + H +
            ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n'));
          add(jpeg);
          add(enc.encode('\nendstream\nendobj\n'));
        } else add(enc.encode('5 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream\nendobj\n'));
      }
      var xref = pos, x = 'xref\n0 6\n0000000000 65535 f \n';
      offsets.forEach(function (o) { x += String(o).padStart(10, '0') + ' 00000 n \n'; });
      x += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
      add(enc.encode(x));
      return new Blob(parts, { type: 'application/pdf' });
    });
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  /* الطباعة: عنصر #printArea (خارج الواجهة) يظهر وحده في وضع الطباعة بمقاس البطاقة */
  function print(url) {
    var area = document.getElementById('printArea'), img = document.getElementById('printImg');
    if (!area || !img) return Promise.reject(new Error('عنصر الطباعة غير موجود في الصفحة.'));
    return new Promise(function (res) {
      function done() { img.removeAttribute('src'); window.removeEventListener('afterprint', done); }
      window.addEventListener('afterprint', done);
      img.onload = function () { setTimeout(function () { try { window.print(); } finally { res(); } }, 60); };
      img.src = url;
    });
  }

  root.DECARD = { render: render, toPdf: toPdf, download: download, print: print, memberLabel: memberLabel, dateLabel: dateLabel };
})(typeof window !== 'undefined' ? window : globalThis);
