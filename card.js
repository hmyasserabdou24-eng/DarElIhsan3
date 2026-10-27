/* card.js — بطاقة انخراط التلميذ (85.6 × 54 مم أفقية) بدقة 300 dpi على Canvas.
   العناصر المطلوبة فقط: شعار المركز الأصلي، اسم المركز، اسم التلميذ، رقم المنخرط الرسمي،
   تاريخ الميلاد (خانة مستقلة)، ورمز QR خاص بالتلميذ يفتح صفحته.
   لا innerHTML. الصورة تُولَّد داخل المتصفح فقط ولا تُرفع إلى أي خادم.
   الاستعمال: DECARD.render(info) ← { jpeg, url, width, height }
              DECARD.toPdf(card) ← Blob(PDF)   |   DECARD.print(card.url)
   info = { full_name, membership_no, dob, center, url } */
(function (root) {
  'use strict';

  var W = 1011, H = 638;                       // 85.6 × 54 مم عند 300 dpi
  var NAVY = '#0c2d55', GOLD = '#b4873a', INK = '#14263d', MUTED = '#55657a', LINE = '#c9d3e0', PALE = '#f4f7fb';
  var FONT = 'IBM Plex Sans Arabic, "Segoe UI", Tahoma, sans-serif';

  function dateLabel(iso) {                    // YYYY-MM-DD → DD/MM/YYYY (أرقام لاتينية)
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '—';
  }
  // رقم المنخرط الرسمي كما هو (مع الأصفار الأولى)، وليس معرّف قاعدة البيانات
  function memberLabel(n) { return n == null || String(n).trim() === '' ? '—' : String(n).trim(); }

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
    var words = String(text || '').split(/\s+/).filter(Boolean), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {               // قصّ السطر الأخير بعلامة …
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (ctx.measureText(last + '…').width > maxW && last.length > 1) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }

  // تصغير الخط حتى يتسع النص في المساحة المحددة
  function fitFont(ctx, text, weight, startPx, maxW) {
    var px = startPx;
    ctx.font = weight + ' ' + px + 'px ' + FONT;
    while (ctx.measureText(text).width > maxW && px > 18) { px -= 2; ctx.font = weight + ' ' + px + 'px ' + FONT; }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // QR بوحدات صحيحة (حواف حادة) مع هامش أبيض 4 وحدات حوله
  function drawQr(ctx, text, x, y, box) {
    if (!root.DEQR) throw new Error('مولّد QR غير محمّل في الصفحة.');
    var q = root.DEQR.encode(text), total = q.size + 8;
    var m = Math.floor(box / total), side = m * total;
    var ox = x + Math.floor((box - side) / 2), oy = y + Math.floor((box - side) / 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, box, box);
    ctx.fillStyle = '#000000';
    for (var r = 0; r < q.size; r++) for (var c = 0; c < q.size; c++) {
      if (q.dark(c, r)) ctx.fillRect(ox + (c + 4) * m, oy + (r + 4) * m, m, m);
    }
  }

  function fontsReady() {
    if (!(document.fonts && document.fonts.load)) return Promise.resolve();
    return Promise.all([document.fonts.load('800 40px IBM Plex Sans Arabic'), document.fonts.load('700 28px IBM Plex Sans Arabic'), document.fonts.load('400 26px IBM Plex Sans Arabic')])
      .catch(function () { /* الخط الاحتياطي يكفي */ });
  }

  function checkUrl(u) {
    var x;
    try { x = new URL(u); } catch (e) { throw new Error('رابط البطاقة غير صالح.'); }
    if (x.protocol !== 'https:') throw new Error('رابط البطاقة يجب أن يبدأ بـ HTTPS.');
    if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(x.hostname)) throw new Error('رابط البطاقة لا يمكن أن يكون محليًا.');
    return x.href;
  }

  function render(info) {
    return Promise.resolve().then(function () {
      if (!info || !info.url) throw new Error('رابط البطاقة مفقود.');
      var url = checkUrl(info.url);
      var centers = root.DE_CENTERS || {};
      var center = centers[info.center] || centers.main || { name: 'المركز النفسي البيداغوجي دار الإحسان', logo: 'logo-sq.png' };
      return fontsReady().then(function () { return loadImage(center.logo); }).then(function (logo) {
        if (!logo) throw new Error('تعذّر تحميل شعار المركز. تأكد من وجود الملف ' + center.logo + ' في المشروع.');

        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        ctx.direction = 'rtl';
        ctx.textBaseline = 'alphabetic';

        // الخلفية والترويسة الزرقاء والشريط الذهبي
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, 178);
        ctx.fillStyle = GOLD; ctx.fillRect(0, 178, W, 8);

        // شعار المركز في دائرة بيضاء (الشعار الأصلي بلا تشويه: نسبة الطول والعرض محفوظة)
        var lx = W - 118, ly = 89, lr = 78;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
        var s = Math.min((lr * 2 - 8) / logo.width, (lr * 2 - 8) / logo.height);
        ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, lr - 4, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(logo, lx - (logo.width * s) / 2, ly - (logo.height * s) / 2, logo.width * s, logo.height * s);
        ctx.restore();

        // عنوان البطاقة واسم المركز (يسار الشعار)
        var tx = lx - lr - 28, maxTextW = tx - 40;
        ctx.textAlign = 'right';
        ctx.fillStyle = GOLD; ctx.font = '700 30px ' + FONT;
        ctx.fillText('بطاقة انخراط تلميذ', tx, 58);
        ctx.fillStyle = '#ffffff'; ctx.font = '800 38px ' + FONT;
        wrap(ctx, center.name, maxTextW, 2).forEach(function (ln, i) { ctx.fillText(ln, tx, 118 + i * 48); });

        // QR على يسار الجسم داخل إطار واضح بخلفية بيضاء
        var qx = 58, qy = 226, qb = 330;
        ctx.strokeStyle = LINE; ctx.lineWidth = 3; roundRect(ctx, qx - 14, qy - 14, qb + 28, qb + 28, 18); ctx.stroke();
        drawQr(ctx, url, qx, qy, qb);
        ctx.textAlign = 'center';
        ctx.fillStyle = MUTED; ctx.font = '700 24px ' + FONT;
        ctx.fillText('امسح الرمز للتحقق من البطاقة', qx + qb / 2, qy + qb + 46);

        // بيانات التلميذ (يمين): الاسم واللقب وتاريخ الميلاد فقط — بلا أي معلومات أخرى
        var rx = W - 58, colL = 436;
        ctx.textAlign = 'right';
        ctx.fillStyle = MUTED; ctx.font = '400 26px ' + FONT;
        ctx.fillText('الاسم واللقب', rx, 258);
        ctx.fillStyle = INK;
        fitFont(ctx, info.full_name || '—', '800', 60, rx - colL);
        var nm = wrap(ctx, info.full_name || '—', rx - colL, 2);
        nm.forEach(function (ln, i) { ctx.fillText(ln, rx, 326 + i * 66); });

        // خانة مستقلة لتاريخ الميلاد
        var by = 430, bh = 150, dobW = rx - colL;
        ctx.fillStyle = PALE; roundRect(ctx, colL, by, dobW, bh, 16); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 2; roundRect(ctx, colL, by, dobW, bh, 16); ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillStyle = MUTED; ctx.font = '700 24px ' + FONT;
        ctx.fillText('تاريخ الميلاد', rx - 24, by + 48);
        ctx.fillStyle = INK;
        var dob = dateLabel(info.dob);
        fitFont(ctx, dob, '800', 58, dobW - 48);
        ctx.fillText(dob, rx - 24, by + 124);

        // إطار ذهبي خارجي
        ctx.strokeStyle = GOLD; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, H - 6);

        return new Promise(function (res, rej) {
          cv.toBlob(function (jpeg) {
            if (!jpeg) return rej(new Error('تعذّر إنشاء صورة البطاقة.'));
            res({ jpeg: jpeg, url: URL.createObjectURL(jpeg), width: W, height: H, qrUrl: url });
          }, 'image/jpeg', 0.97);
        });
      });
    });
  }

  /* PDF من صورة JPEG واحدة بحجم البطاقة بالضبط (85.6 × 54 مم = 242.6 × 153.1 نقطة) */
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
      function done() { img.removeAttribute('src'); window.removeEventListener('afterprint', done); res(); }
      window.addEventListener('afterprint', done);
      img.onload = function () { setTimeout(function () { window.print(); }, 60); };
      img.src = url;
    });
  }

  root.DECARD = { render: render, toPdf: toPdf, download: download, print: print, memberLabel: memberLabel, dateLabel: dateLabel };
})(typeof window !== 'undefined' ? window : globalThis);
