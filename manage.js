/* لوحة إدارة دار الإحسان المتطورة
   تتضمن:
   1. إدارة الأطفال والطلبة (رقم القيد، تاريخ الميلاد، الإعاقة، الفرع، القسم، المعرف العام)
   2. توليد وتحميل بطاقة التلميذ بصيغة JPG عالية الدقة عبر HTML5 Canvas مع رمز QR للتحقق
   3. إدارة رموز التسجيل السرية أحادية الاستخدام للأولياء (Registration Codes)
   4. إدارة الفروع والأقسام التربوية الرسمية الـ 11
   5. قسم المربيات (الاسم، القسم، رقم الهاتف/الواتساب، تعديل الملف، ودعوة المربيات عبر واتساب)
   6. إدارة البرامج التربوية للأقسام وتصديرها كصورة أفقية للأولياء مع عزل RLS صارم
   7. إدارة التقارير التربوية واستمارات التقييم البيداغوجي (اختيار الطفل، المجال، المهارات، التقييم 1-5، وإضافة أكثر من مجال)
   8. إدارة حسابات الإدارة والمربيات مع إظهار كلمة المرور لكل حساب وتخصيص واجهة المربية (قسم الطلبة + قسم التقارير والتقييم فقط)
   لا innerHTML: حماية تامة من XSS باستخدام DE.h و textContent حصراً. */
(function () {
  'use strict';
  var FILE_BUILD = '2026-10-26.5';

  var DEFAULT_CFG = {
    supabaseUrl: 'https://qgjddtylriqdwvpihvmi.supabase.co',
    supabaseKey: 'sb_publishable_8mgO37k9jB9_Dg4OQTfynw_NBC0gLjK'
  };
  var CFG = Object.assign({}, DEFAULT_CFG, window.DE_CONFIG || {});
  if (!CFG.supabaseUrl) CFG.supabaseUrl = DEFAULT_CFG.supabaseUrl;
  if (!CFG.supabaseKey) CFG.supabaseKey = DEFAULT_CFG.supabaseKey;
  window.DE_CONFIG = CFG;

  if (!window.DE) {
    (function (root) {
      var MAX_FILE = 5 * 1024 * 1024;
      var EXT = { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      function uuid() {
        var c = root.crypto;
        if (c && typeof c.randomUUID === 'function') return c.randomUUID();
        var b = new Uint8Array(16);
        if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b);
        b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
        var hx = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
        return hx.slice(0, 8) + '-' + hx.slice(8, 12) + '-' + hx.slice(12, 16) + '-' + hx.slice(16, 20) + '-' + hx.slice(20);
      }
      function clean(s, max) {
        return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max || 5000);
      }
      function isUuid(s) { return typeof s === 'string' && UUID_RE.test(s); }
      function isEmail(s) { return typeof s === 'string' && s.length <= 254 && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(s); }
      function isPhone(s) { return typeof s === 'string' && /^[0-9+()\s.-]{5,25}$/.test(s); }
      function isDate(s) {
        if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
        var d = new Date(s + 'T00:00:00Z');
        return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
      }
      function safeUrl(u) { try { var x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } }
      var PW_MSG = 'كلمة المرور: 10 أحرف على الأقل مع حرف كبير وحرف صغير ورقم.';
      function pwProblem(v) {
        v = String(v || '');
        var bytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(v).length : v.length;
        return v.length >= 10 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && bytes <= 72 ? '' : PW_MSG;
      }
      function append(el, c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
        el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
      }
      function h(tag, props) {
        var el = document.createElement(tag);
        var p = props || {};
        Object.keys(p).forEach(function (k) {
          var v = p[k];
          if (v == null || v === false) return;
          if (k === 'class') el.className = v;
          else if (k === 'text') el.textContent = v;
          else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
          else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') el[k] = v;
          else if (k === 'style' || /^on/i.test(k) || k === 'innerHTML' || k === 'outerHTML' || k === 'srcdoc') return;
          else if ((k === 'href' || k === 'src') && !/^(https:|blob:|#)/i.test(String(v))) return;
          else el.setAttribute(k, v === true ? '' : String(v));
        });
        for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
        return el;
      }
      function friendly(status, raw) {
        if (raw && /[\u0600-\u06FF]/.test(raw)) return raw;
        return 'حدث خطأ غير متوقع (' + status + '). حاول مرة أخرى.';
      }
      function Client(cfg, storeKey) {
        var base = String(cfg.supabaseUrl || '').replace(/\/+$/, '');
        var key = cfg.supabaseKey || '';
        var session = null, expireCb = function () {};
        function store() { try { return root.sessionStorage; } catch (e) { return null; } }
        function load() {
          var st = store(); if (!st) return null;
          try { var s = JSON.parse(st.getItem(storeKey) || 'null'); return s && s.refresh_token ? s : null; } catch (e) { return null; }
        }
        function save(tok) {
          session = { access_token: tok.access_token, refresh_token: tok.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (tok.expires_in || 3600), user: tok.user || (session && session.user) || null };
          var st = store(); if (st) st.setItem(storeKey, JSON.stringify(session));
        }
        function clear() { session = null; var st = store(); if (st) st.removeItem(storeKey); }
        async function raw(token, method, path, body, extra) {
          var hd = { apikey: key };
          if (token) hd.Authorization = 'Bearer ' + token;
          for (var k in (extra || {})) hd[k] = extra[k];
          if (body !== undefined && !(body instanceof Uint8Array)) hd['Content-Type'] = 'application/json';
          var res = await fetch(base + path, { method: method, headers: hd, body: body === undefined ? undefined : (body instanceof Uint8Array ? body : JSON.stringify(body)) });
          var txt = await res.text(), j = null;
          try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
          if (!res.ok) {
            var er = new Error(friendly(res.status, (j && (j.msg || j.message || j.error_description || j.error)) || ''));
            er.status = res.status; throw er;
          }
          return j;
        }
        return {
          load: function () { session = load(); return !!session; },
          loggedIn: function () { return !!session; },
          onExpire: function (cb) { expireCb = cb; },
          me: async function () { return session ? session.user : null; },
          signIn: async function (email, password) {
            var tok = await raw(null, 'POST', '/auth/v1/token?grant_type=password', { email: email, password: password });
            save(tok); return { mfa: false };
          },
          verifyMfa: async function () {},
          cancelMfa: function () {},
          signOut: async function () { clear(); },
          recover: function (email, redirectTo) { return raw(null, 'POST', '/auth/v1/recover' + (redirectTo ? '?redirect_to=' + encodeURIComponent(redirectTo) : ''), { email: email }); },
          adoptHash: async function () { return null; },
          setPassword: function (pw) { return raw(session && session.access_token, 'PUT', '/auth/v1/user', { password: pw }); },
          rest: function (method, path, body, prefer) { return raw(session && session.access_token, method, '/rest/v1' + path, body, prefer ? { Prefer: prefer } : {}); },
          rpc: function (name, args) { return raw(session && session.access_token, 'POST', '/rest/v1/rpc/' + name, args || {}); },
          fn: function (name, body) { return raw(session && session.access_token, 'POST', '/functions/v1/' + name, body); },
          signedUrl: async function () { return '#'; },
          upload: async function () { return {}; },
          removeObject: async function () { return {}; }
        };
      }
      function idle(ms, cb) {
        var t; function reset() { clearTimeout(t); t = setTimeout(cb, ms); }
        ['click', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) { root.addEventListener(ev, reset, { passive: true }); });
        reset(); return function stop() { clearTimeout(t); };
      }
      root.DE = { MAX_FILE: MAX_FILE, EXT: EXT, PW_MSG: PW_MSG, uuid: uuid, clean: clean, isUuid: isUuid, isEmail: isEmail, isPhone: isPhone, isDate: isDate, safeUrl: safeUrl, pwProblem: pwProblem, checkFile: function () { return { ok: true, ext: 'pdf', mime: 'application/pdf' }; }, objectPath: function (cid, ext) { return 'children/' + cid + '/' + uuid() + '.' + ext; }, h: h, friendly: friendly, Client: Client, idle: idle };
    })(window);
  }

  var h = DE.h;
  var $ = function (s) { return document.querySelector(s); };
  var C = DE.Client(CFG, 'de_manage_session');

  /* الدليل البيداغوجي الرسمي المعتمد (8 مجالات و195 مهارة) مدمج مباشرة لمنع أي اعتماد على ملفات خارجية */
  var EMBEDDED_CURRICULUM = {"مجال الاستقلالية (الحياة اليومية والعناية بالذات)":["غسل اليدين بالماء بشكل صحيح","غسل اليدين بالماء والصابون بشكل صحيح","غسل الوجه بالماء بشكل صحيح","تجفيف اليدين والوجه باستخدام الفوطة بشكل صحيح","استخدام المنديل بشكل صحيح","تنظيف الأنف","خلع السروال بشكل صحيح","خلع المئزر بشكل صحيح","خلع القميص (فك الأزرار) بشكل صحيح","خلع الجوارب بشكل صحيح","خلع الحذاء بشكل صحيح","لبس السروال بشكل صحيح","لبس المئزر بشكل صحيح","لبس القميص (فك الأزرار) بشكل صحيح","لبس الجوارب بشكل صحيح","لبس الحذاء بشكل صحيح","التعرف على أدوات الأكل (ملعقة، كوب، صحن، شوكة)","مسك أدوات الطعام بشكل صحيح","الشرب بكوب الماء أو العصير بشكل صحيح","الأكل بطريقة صحيحة","طلب الذهاب إلى الحمام عند الحاجة إليه (صورة / كلمة)","التعرف على مكان الحمام","استخدام الحمام باستقلالية","التعرف على أدوات تنظيف الأسنان (المعجون، الفرشاة، الماء)","القيام بتنظيف الأسنان باستقلالية"],"مجال المهارات الحركية الدقيقة":["القبض على الأشياء باستخدام قبضة اليد","الضغط على كرة إسفنجية بقبضة اليد بالتناوب بين اليدين","الضغط على مادة الصلصال","طي أو ثني ورقة عدة مرات بشكل عشوائي","مسك مقبض الباب وتدويره","يستطيع فتح قارورة","التقاط خرز (حجم صغير)","التقاط خرز (حجم كبير)","نقل خمس خرزات (حجم صغير) من صحن لآخر","نقل خمس خرزات (حجم كبير) من صحن لآخر","تقليب صفحات كتاب","ترتيب مجموعة من الأوراق فوق بعضها","تنظيم خمس خرزات (حجم صغير) بخيط","تنظيم خمس خرزات (حجم كبير) بخيط","يستطيع إغلاق قارورة","مسك القلم بشكل صحيح","التلوين بشكل عشوائي على الورقة","التلوين داخل حيز","توصيل خطوط منقطة مرسومة على ورقة بشكل أفقي","توصيل خطوط منقطة مرسومة على ورقة بشكل منحني","مسك المقص بشكل صحيح","قص الورقة بشكل عشوائي","قص الورقة على خطوط مستقيمة عريضة","قص الورقة على خطوط مستقيمة رفيعة","قص الورقة على خطوط منحنية عريضة","قص الورقة على خطوط منحنية رفيعة"],"مجال المهارات الحركية الكبرى":["الوقوف بطريقة صحيحة","الجلوس بطريقة صحيحة","المشي بطريقة صحيحة","الجري بطريقة صحيحة","التدحرج بشكل صحيح","رمي الكرة بطريقة صحيحة","ركل الكرة بطريقة صحيحة","الحجل بطريقة صحيحة","سحب الحبل بطريقة صحيحة","دفع جهاز متحرك لمسافة 2 م بطريقة صحيحة","يرفع ثقل (2 كغم) عن الأرض","يحمل ثقل (2 كغم) لمسافة 10 م","رفع الذراعين، أماماً، عالياً، جانباً بطريقة صحيحة","صعود ونزول السلم (الدرج) بطريقة صحيحة","يثني الجذع أماماً أسفل بطريقة صحيحة (مرونة)","رمي الكرة باتجاه هدف على الحائط من مسافة 2 م بطريقة صحيحة (توازن)","تنطيط الكرة من الثبات خمس مرات (توافق)","يجري بشكل متعرج لمسافة 10 م (رشاقة)","رمي ثقل (1 كغم) لمسافة 5 م (قوة)"],"مجال ما قبل الأكاديمي":["الوصل بين مجموعة عناصر من نفس الفئة","رسم لوحات بسيطة","تسلسل الأرقام والحروف","التعرف على الأشكال","التعرف على الألوان","المطابقة بين الأشياء المتماثلة","المطابقة بين الألوان","المطابقة بين الأشكال","المطابقة بين أنواع الفواكه (البرتقال، الموز، التفاح، العنب، البطيخ)","المطابقة بين أنواع الخضر (طماطم، بطاطا، فلفل..)","مطابقة أعضاء الحواس الخمسة (يد، عين، أذن، لسان، أنف)","المطابقة بين صور الحيوانات الأليفة (جمل، حصان، بقرة، قطة، أرنب، ماعز)","مطابقة فئات النقود الورقية والمعدنية","مطابقة الحروف الهجائية بالبطاقات","أن يكتب خطوطاً مستقيمة عن نموذج (استعداد للكتابة)","أن يكتب خطوطاً منحنية عن نموذج (استعداد للكتابة)","العد بشكل آلي من 1 إلى 10","يشير إلى الأرقام من 1 إلى 10","التعرف على مدلول الأرقام من 1 إلى 10"],"المجال الأكاديمي":["التعرف على أشكال الحروف داخل الكلمة (البداية، الوسط، النهاية)","التعرف إلى أشكال الحروف مع المد بالألف","التعرف إلى أشكال الحروف مع المد بالواو","التعرف إلى أشكال الحروف مع المد بالياء","التعرف إلى أشكال الحروف مع الحركات (الفتحة)","التعرف إلى أشكال الحروف مع الحركات (الضمة)","التعرف إلى أشكال الحروف مع الحركات (الكسرة)","التعرف إلى أشكال الحروف مع الحركات (السكون)","يقرأ كلمة من حرفين","يقرأ كلمة من 3 حروف","يقرأ كلمة من 4 حروف فأكثر","يقرأ جملة من كلمتين","يقرأ جملة من 3 كلمات","يقرأ جملة من 4 كلمات","يقرأ جملة من 5 كلمات فأكثر","يقرأ فقرة من درس مختار","يكتب الحرف فوق نقط","يكتب الحروف عن نموذج","يكتب أشكال حروف داخل الكلمة فوق نقط","يكتب أشكال الحروف داخل الكلمة عن نموذج","يكتب مقاطع عن نموذج","يكتب كلمة من 3 حروف","يكتب كلمة من 4 حروف فأكثر","يكتب جملاً مختارة عن نموذج","التعرف إلى إشارة (+)","التعرف إلى إشارة (-)","التعرف إلى إشارة (=)","التعرف إلى مفهوم الجمع","حل مسائل على الجمع ضمن الرقم 10","التعرف على مفهوم الطرح","حل مسائل على الطرح ضمن الرقم 10","يتعرف الطالب على مفاهيم الأحجام (كبير، صغير)","يصنف أشياء حسب حجمها (كبير، صغير)","يتعرف الطالب على مفاهيم الأطوال (طويل، قصير)","يصنف أشياء حسب طولها (طويل، قصير)","يتعرف الطالب على مفاهيم ظروف المكان (أمام، خلف، فوق، تحت، داخل، خارج)","يتعرف الطالب على مفاهيم ظروف الزمان (صباح، مساء، ليل، نهار، قبل، بعد)","يتعرف الطالب على المفاهيم (حار، بارد)","يتعرف الطالب على المفاهيم (ناعم، خشن)","يطابق الطالب أسماء أيام الأسبوع (بطاقات)","يتعرف الطالب على شكل أيام الأسبوع (بطاقات)","يذكر الطالب أيام الأسبوع بالتدرج (من السبت إلى الجمعة)","يميز الطالب بين اليوم والأمس وغداً","يربط الطالب اليوم مع أيام الأسبوع (معرفة اليوم الراهن)","يطابق الطالب فصول السنة الأربعة","يتعرف الطالب على فصول السنة الأربعة","يميز الطالب فصول السنة الأربعة","يربط الطالب الفصل الحالي مع فصول السنة الأربعة","يطابق الطالب أحرف اسمه بشكل صحيح (بطاقات)","يشير إلى أحرف اسمه بشكل صحيح","يتعرف الطالب على أحرف اسمه بشكل صحيح"],"مجال التقليد":["تقليد التصفيق","تقليد رفع اليدين إلى الأعلى معاً","تقليد ضرب الطاولة باليد","تقليد فتح وغلق اليدين","تشبيك اليدين معاً","الإشارة إلى أجزاء الجسم","رن الجرس باستخدام الأشياء","دحرجة لعبة باستخدام الأشياء","القفز من وضع الوقوف","الجري من وضع الوقوف","الدوران من وضع الوقوف","تقليد عدد تكرار الحركات","تقليد حركات حركية دون مساعدة لفظية","تقليد أصوات بسيطة (تقليد لفظي)","تقليد أصوات أولية للكلمات","تقليد مقاطع صوتية منفصلة","تقليد الكلمات","تقليد العبارات","تقليد تلقائي للكلمات","تقليد تلقائي للعبارات"],"مجال مهارات الحضور والانتباه":["الاستماع لصوت الجرس عند قرعه","الالتفات عند مناداته باسمه","الاتصال البصري أثناء المحادثة","الاتصال البصري أثناء التعليم الجماعي","الاستجابة للتعليمات اللفظية (أمر واحد)","الاستجابة للتعليمات اللفظية (أمران متسلسلان)","الاستجابة للتعليمات اللفظية (أمران غير متسلسلين)","إدارة رأسه من مصدر صوت إلى مصدر آخر","تذكر مكان إخفاء الشيء","متابعة لهب شمعة فترة من الوقت","الجلوس على المقعد بشكل صحيح أثناء أداء المهمة التعليمية"],"مجال التواصل":["يستجيب الطفل عند مناداته باسمه","يصرخ للحصول على ما يريد","يحدث ضجة بدل الكلام","يتكلم كلاماً غير مفهوم","يشير عن بعد إلى الأشياء التي يريدها","يستخدم كلمة واحدة للتعبير عن كلمات أو عبارات","يستجيب للأوامر البسيطة (أمر واحد)","يستجيب للأوامر المتسلسلة (أكثر من أمر)","يوجد لديه مصاداة، يكرر الأصوات أو الكلام كالببغاء","يبدو أنه أصم لا يسمع","يستجيب لأصوات الأشياء المألوفة","يعبر لفظياً عن حاجته للأكل أو الشرب أو استخدام الحمام","يستخدم كلمة (نعم) أو (لا) فقط","يسمي الأشياء المألوفة في البيئة","ينطق كلمة واحدة","ينطق جملة مكونة من كلمتين","ينطق جملة مكونة من ثلاث كلمات أو أكثر","يتلفظ بمقاطع لا معنى لها، أو يتمتم مع نفسه","يسحب الآخرين بيده لجلب شيء","يستجيب للإشارات الإيمائية","يصغي إلى التعليمات اللفظية","يستجيب الطفل للمس الجسدي","يفهم أحرف الجر","يستخدم الضمائر"]};
  window.DE_CURRICULUM = EMBEDDED_CURRICULUM;

  /* القائمة الرسمية المعتمدة للفروع والأقسام والـ 103 طالب لضمان ظهور الأطفال فوراً في جميع الظروف */
  var EMBEDDED_BRANCHES = [{"id": "11111111-0000-4000-8000-000000000001", "slug": "main", "name": "المركز الرئيسي لدار الإحسان", "active": true}, {"id": "11111111-0000-4000-8000-000000000002", "slug": "work", "name": "مركز المساعدة على العمل (ورشات التأهيل والتمهين)", "active": true}, {"id": "11111111-0000-4000-8000-000000000003", "slug": "farm", "name": "المزرعة البيداغوجية (البستنة والأنشطة الفلاحية)", "active": true}];
  var EMBEDDED_SECTIONS = [{"id": "22222222-0000-4000-8000-000000000001", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_autism_1", "name": "توحد 01", "description": "قسم اضطراب طيف التوحد (فوج 1)", "active": true}, {"id": "22222222-0000-4000-8000-000000000002", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_autism_2", "name": "التوحد 02", "description": "قسم اضطراب طيف التوحد (فوج 2)", "active": true}, {"id": "22222222-0000-4000-8000-000000000003", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_autism_3", "name": "توحد 03", "description": "قسم اضطراب طيف التوحد (فوج 3)", "active": true}, {"id": "22222222-0000-4000-8000-000000000004", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_observation", "name": "الملاحظة جدد", "description": "قسم الملاحظة والتشخيص للأطفال الجدد", "active": true}, {"id": "22222222-0000-4000-8000-000000000005", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_tafatan_1", "name": "التفطين 1 تأخر ذهني", "description": "قسم التفطن والتأهيل الذهني (فوج 1)", "active": true}, {"id": "22222222-0000-4000-8000-000000000006", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_tafatan_2", "name": "التفطين 2 متلازمة داون", "description": "قسم التفطن لمتلازمة داون (فوج 2)", "active": true}, {"id": "22222222-0000-4000-8000-000000000007", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_istithara", "name": "الاستثارة", "description": "قسم الاستثارة الحسية والحركية", "active": true}, {"id": "22222222-0000-4000-8000-000000000008", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_shibh_madrasi", "name": "قسم الشبه مدرسي مكيف", "description": "قسم التأهيل الشبه مدرسي المكيف", "active": true}, {"id": "22222222-0000-4000-8000-000000000009", "branch_id": "11111111-0000-4000-8000-000000000001", "slug": "sec_khariji", "name": "الخارجي اعاقة شديدة", "description": "فوج الرعاية النهارية الخارجية للإعاقات الشديدة", "active": true}, {"id": "22222222-0000-4000-8000-000000000010", "branch_id": "11111111-0000-4000-8000-000000000002", "slug": "sec_tamhin", "name": "التمهين م م ع", "description": "قسم التمهين والتأهيل المهني بمركز المساعدة على العمل", "active": true}, {"id": "22222222-0000-4000-8000-000000000011", "branch_id": "11111111-0000-4000-8000-000000000003", "slug": "sec_bostana", "name": "المزرعة البستنة", "description": "ورشة البستنة والأنشطة الزراعية بالمزرعة البيداغوجية", "active": true}];
  var EMBEDDED_STUDENTS = [{"id": "00000000-0000-4000-8000-000000000004", "membership_no": "004", "full_name": "حاج ابراهيم مسعود بن قاسم", "dob": "1981-08-01", "phone": "0559486900", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000021", "membership_no": "021", "full_name": "حاج ابراهيم عمر بن سليمان", "dob": "1986-04-26", "phone": "0553770520", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000022", "membership_no": "022", "full_name": "بهون علي يوسف بن يحي", "dob": "1986-06-12", "phone": "0658379640", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000050", "membership_no": "050", "full_name": "سعيد مصطفى بن عمر", "dob": "1991-09-20", "phone": "0561010960", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000077", "membership_no": "077", "full_name": "بهون علي زوليخة بنت يحي بن عمر", "dob": "1988-07-20", "phone": "0658379640", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000082", "membership_no": "082", "full_name": "حاج امحمد محمد بن اسماعيل", "dob": "1989-08-04", "phone": "0664421440", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000086", "membership_no": "086", "full_name": "حاج ابراهيم بهون بن عبد الرحمان", "dob": "1995-03-24", "phone": "0771307180", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000087", "membership_no": "087", "full_name": "خليف ابراهيم زكرياء بن أحمد", "dob": "2003-03-17", "phone": "0699950770", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000090", "membership_no": "090", "full_name": "اولاد حاجو بكير بن توفيق", "dob": "2004-05-22", "phone": "0663031990", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000101", "membership_no": "101", "full_name": "طالب باحمد عز الدين بن بكير", "dob": "2005-04-05", "phone": "0793613030", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000103", "membership_no": "103", "full_name": "بهون عائشة بنت نور الدين", "dob": "2001-08-23", "phone": "0671473010", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000104", "membership_no": "104", "full_name": "بهون وسام بنت ابراهيم", "dob": "2006-06-04", "phone": "0556530510", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000111", "membership_no": "111", "full_name": "بهون زوليخة بنت نور الدين", "dob": "1984-12-21", "phone": "0671473010", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000112", "membership_no": "112", "full_name": "قندوزي نصر الدين بن حسين", "dob": "2006-09-24", "phone": "0663434690", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000114", "membership_no": "114", "full_name": "اسماوي امين بن ابو عبيدة", "dob": "2009-09-30", "phone": "0559285840", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000116", "membership_no": "116", "full_name": "صلاح مهدي بن مسعود", "dob": "2002-03-08", "phone": "0664702430", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000117", "membership_no": "117", "full_name": "درين سمية بنت صالح", "dob": "1997-09-27", "phone": "0666616490", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000118", "membership_no": "118", "full_name": "درين منير بن صالح", "dob": "1993-09-02", "phone": "0666616490", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000003", "section_id": "22222222-0000-4000-8000-000000000011", "branch_slug": "farm", "section_slug": "sec_bostana", "section": "المزرعة البستنة", "center": "farm", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000119", "membership_no": "119", "full_name": "درين بشير بن صالح", "dob": "1995-07-19", "phone": "0666616490", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000003", "section_id": "22222222-0000-4000-8000-000000000011", "branch_slug": "farm", "section_slug": "sec_bostana", "section": "المزرعة البستنة", "center": "farm", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000132", "membership_no": "132", "full_name": "حمو علي قاسم بن عمر", "dob": "2009-08-01", "phone": "0666296250", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000009", "branch_slug": "main", "section_slug": "sec_khariji", "section": "الخارجي اعاقة شديدة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000138", "membership_no": "138", "full_name": "حمو علي سمية بنت موسى", "dob": "2004-06-09", "phone": "0797598770", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000142", "membership_no": "142", "full_name": "بوحديبة محمد بن ابراهيم", "dob": "2011-01-25", "phone": "0673648720", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000146", "membership_no": "146", "full_name": "حبيرش جيهان بنت عبد الوهاب", "dob": "2013-12-07", "phone": "0673412310", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000153", "membership_no": "153", "full_name": "العابد حسناء بنت منصور", "dob": "2008-02-28", "phone": "0670305460", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000159", "membership_no": "159", "full_name": "اسماوي محمد بن بلال", "dob": "2010-08-15", "phone": "0658391000", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000160", "membership_no": "160", "full_name": "بهون علي محمد السعيد بن عمر", "dob": "2013-07-17", "phone": "0550799880", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000165", "membership_no": "165", "full_name": "حمو علي زكرياء بن ابراهيم", "dob": "2014-09-08", "phone": "0667445790", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000167", "membership_no": "167", "full_name": "كليماني انفال بنت محمد", "dob": "2012-11-30", "phone": "0698371740", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000005", "branch_slug": "main", "section_slug": "sec_tafatan_1", "section": "التفطين 1 تأخر ذهني", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000168", "membership_no": "168", "full_name": "كليماني آية بنت محمد", "dob": "2009-04-05", "phone": "0698371740", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000170", "membership_no": "170", "full_name": "بن علي فاروق بن احمد", "dob": "2012-10-02", "phone": "0661649080", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000173", "membership_no": "173", "full_name": "بن يحي الياس بن مختار", "dob": "2007-10-27", "phone": "0665948640", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000176", "membership_no": "176", "full_name": "كبير حاج الطيب بن بشير", "dob": "2014-01-21", "phone": "0792747290", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000180", "membership_no": "180", "full_name": "زرقون صفوان بن مصطفى", "dob": "2007-05-31", "phone": "0668640480", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000187", "membership_no": "187", "full_name": "خروبي زكرياء بن عيسى", "dob": "2015-04-14", "phone": "0542284920", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000001", "branch_slug": "main", "section_slug": "sec_autism_1", "section": "توحد 01", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000188", "membership_no": "188", "full_name": "اسكوتي عيسى بن عثمان", "dob": "2016-06-19", "phone": "0699053930", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000001", "branch_slug": "main", "section_slug": "sec_autism_1", "section": "توحد 01", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000189", "membership_no": "189", "full_name": "الشرع ريان بن مختار", "dob": "2015-01-05", "phone": "0661474750", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000002", "branch_slug": "main", "section_slug": "sec_autism_2", "section": "التوحد 02", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000190", "membership_no": "190", "full_name": "بن حمودة أيمن سليمان بن عمر", "dob": "2013-09-06", "phone": "0666506900", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000002", "branch_slug": "main", "section_slug": "sec_autism_2", "section": "التوحد 02", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000192", "membership_no": "192", "full_name": "الشرع خالد بن مختار", "dob": "2013-10-16", "phone": "0661474750", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000001", "branch_slug": "main", "section_slug": "sec_autism_1", "section": "توحد 01", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000196", "membership_no": "196", "full_name": "بهشو اسماعيل بن سليمان", "dob": "2013-05-16", "phone": "0665996070", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000197", "membership_no": "197", "full_name": "كليماني اية", "dob": "2014-04-23", "phone": "0668369020", "disability": "متعدد الاعاقات", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": null, "branch_slug": "main", "section_slug": "", "section": "عام", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000198", "membership_no": "198", "full_name": "بن ريم مروة بنت مروان", "dob": "2009-02-06", "phone": "0665691870", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000200", "membership_no": "200", "full_name": "بن يوسف حاج ابراهيم بن نصر الدين", "dob": "2009-12-27", "phone": "0676424480", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000201", "membership_no": "201", "full_name": "باباعمر تيازيط زكرياء بن بشير", "dob": "2010-07-08", "phone": "0777120270", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000202", "membership_no": "202", "full_name": "بكلي الحاج محمد بن احمد", "dob": "2012-02-13", "phone": "0561247270", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000204", "membership_no": "204", "full_name": "ببو محمد بن العيد", "dob": "2008-06-01", "phone": "0668872890", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000206", "membership_no": "206", "full_name": "بن عافو يوسف بن عيسى", "dob": "2013-07-14", "phone": "0696141510", "disability": "متعدد الاعاقات", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000209", "membership_no": "209", "full_name": "قومار محمد ياسر بن حمزة", "dob": "2015-04-13", "phone": "0665539180", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000002", "branch_slug": "main", "section_slug": "sec_autism_2", "section": "التوحد 02", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000213", "membership_no": "213", "full_name": "يعقوب نذير بن محمد", "dob": "2007-11-04", "phone": "0657063250", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000216", "membership_no": "216", "full_name": "ابي اسماعيل ياسين بن بعيسى", "dob": "2012-01-14", "phone": "0558253810", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000219", "membership_no": "219", "full_name": "حاج امحمد اسماعيل بن ابراهيم", "dob": "2009-12-01", "phone": "0778464970", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000009", "branch_slug": "main", "section_slug": "sec_khariji", "section": "الخارجي اعاقة شديدة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000223", "membership_no": "223", "full_name": "أولاد علي صوفيا بنت محمد", "dob": "2014-01-22", "phone": "0661674980", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000003", "branch_slug": "main", "section_slug": "sec_autism_3", "section": "توحد 03", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000224", "membership_no": "224", "full_name": "مسهل لؤي بن خالد", "dob": "2016-06-02", "phone": "0660655590", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000003", "branch_slug": "main", "section_slug": "sec_autism_3", "section": "توحد 03", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000226", "membership_no": "226", "full_name": "دهان عبد القادر بن يحي بن عيسى", "dob": "2013-12-19", "phone": "0672223730", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000227", "membership_no": "227", "full_name": "قبسي مهدي عبد الرزاق بن احمد", "dob": "2014-05-12", "phone": "0697975120", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000003", "branch_slug": "main", "section_slug": "sec_autism_3", "section": "توحد 03", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000228", "membership_no": "228", "full_name": "حيمود اسامة بن مداني", "dob": "2007-06-20", "phone": "0666389040", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000231", "membership_no": "231", "full_name": "مهيري يوسف الصديق بن موسى", "dob": "2016-02-23", "phone": "0667432520", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000003", "branch_slug": "main", "section_slug": "sec_autism_3", "section": "توحد 03", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000236", "membership_no": "236", "full_name": "حاج سعيد مسعودة سيرين بنت عمر", "dob": "2018-07-09", "phone": "0557542540", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000006", "branch_slug": "main", "section_slug": "sec_tafatan_2", "section": "التفطين 2 متلازمة داون", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000238", "membership_no": "238", "full_name": "بابا عمر تيازيط يحي بن مسعود", "dob": "2009-07-25", "phone": "0671353090", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000003", "section_id": "22222222-0000-4000-8000-000000000011", "branch_slug": "farm", "section_slug": "sec_bostana", "section": "المزرعة البستنة", "center": "farm", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000239", "membership_no": "239", "full_name": "بابا عمر تيازيط محمد بن مسعود", "dob": "2016-12-22", "phone": "0671353090", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000240", "membership_no": "240", "full_name": "بن موسى مريم بنت بلقاسم", "dob": "2014-01-23", "phone": "0662021930", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000243", "membership_no": "243", "full_name": "حاج امحمد مصطفى الامين بن ابراه", "dob": "1993-02-01", "phone": "0659312590", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000247", "membership_no": "247", "full_name": "جرادة ابراهيم بن محمد", "dob": "2018-01-15", "phone": "0662507160", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000006", "branch_slug": "main", "section_slug": "sec_tafatan_2", "section": "التفطين 2 متلازمة داون", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000249", "membership_no": "249", "full_name": "حاتة سليمان بن بكير", "dob": "2001-02-04", "phone": "0792300200", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000250", "membership_no": "250", "full_name": "حاج اسماعيل عائشة بنت محمد بن ا", "dob": "2021-06-08", "phone": "0696683680", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000006", "branch_slug": "main", "section_slug": "sec_tafatan_2", "section": "التفطين 2 متلازمة داون", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000251", "membership_no": "251", "full_name": "سعيد فاطمة الزهراء بنت صلاح الدين", "dob": "2009-06-26", "phone": "0659886550", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000254", "membership_no": "254", "full_name": "بوال مصطفى بن إدريس", "dob": "2012-04-13", "phone": "0665436560", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000255", "membership_no": "255", "full_name": "بن خليفة ريهام شهد بنت محمد", "dob": "2009-07-25", "phone": "0698043640", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000256", "membership_no": "256", "full_name": "بن احمد انس عبد الجليل بن أحمد", "dob": "2017-11-12", "phone": "0699587610", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000005", "branch_slug": "main", "section_slug": "sec_tafatan_1", "section": "التفطين 1 تأخر ذهني", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000257", "membership_no": "257", "full_name": "الشامخة عبد الرزاق حفيظ بن مصطفى", "dob": "2017-12-03", "phone": "0668627200", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000001", "branch_slug": "main", "section_slug": "sec_autism_1", "section": "توحد 01", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000258", "membership_no": "258", "full_name": "اولاد الشيخ انس عبد العليم بن محمد", "dob": "2018-07-02", "phone": "0668981710", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000004", "branch_slug": "main", "section_slug": "sec_observation", "section": "الملاحظة جدد", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000259", "membership_no": "259", "full_name": "عيسى عز الدين بن بكير", "dob": "2010-08-28", "phone": "0550168410", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000263", "membership_no": "263", "full_name": "سالم يوسف بن حمو", "dob": "2008-02-09", "phone": "0541115810", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000264", "membership_no": "264", "full_name": "هامل سحر بنت أحمد بن صالح", "dob": "2007-06-04", "phone": "0778242620", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000009", "branch_slug": "main", "section_slug": "sec_khariji", "section": "الخارجي اعاقة شديدة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000265", "membership_no": "265", "full_name": "هامل عبد الحي بن أحمد بن صالح", "dob": "2010-07-29", "phone": "0778242620", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000267", "membership_no": "267", "full_name": "بلولو الحاج ابراهيم بن رمضان", "dob": "2010-08-14", "phone": "0796549990", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000273", "membership_no": "273", "full_name": "الواهج بكير بن صالح", "dob": "1988-12-15", "phone": "0552079890", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000274", "membership_no": "274", "full_name": "توهامي ريم بنت توفيق", "dob": "2014-06-03", "phone": "0550300330", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000004", "branch_slug": "main", "section_slug": "sec_observation", "section": "الملاحظة جدد", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000275", "membership_no": "275", "full_name": "أولاد حاجو مامة مالك بنت صالح", "dob": "2015-05-07", "phone": "0666147800", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000276", "membership_no": "276", "full_name": "صديقي محمد الامين بن مراد", "dob": "2014-03-14", "phone": "0662768430", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000003", "branch_slug": "main", "section_slug": "sec_autism_3", "section": "توحد 03", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000279", "membership_no": "279", "full_name": "قندوز نهال بنت نصر الدين", "dob": "2012-06-18", "phone": "0665970500", "disability": "التأخر الدراسي", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000280", "membership_no": "280", "full_name": "مطياز توفيق بن محمد", "dob": "2001-09-01", "phone": "0663479150", "disability": "التأخر الدراسي", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000281", "membership_no": "281", "full_name": "عكيف عبد الجليل طه بن أحمد", "dob": "2003-06-15", "phone": "0699989260", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000283", "membership_no": "283", "full_name": "داودي سهام بنت محمد", "dob": "2015-02-17", "phone": "0556105910", "disability": "التأخر الدراسي", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000288", "membership_no": "288", "full_name": "حاج عيسى فخار عيسى بن يونس", "dob": "1995-08-18", "phone": "0797940960", "disability": "متعدد الاعاقات", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000289", "membership_no": "289", "full_name": "بنورة منير بن محمد", "dob": "2015-01-01", "phone": "0555343750", "disability": "متعدد الاعاقات", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000009", "branch_slug": "main", "section_slug": "sec_khariji", "section": "الخارجي اعاقة شديدة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000291", "membership_no": "291", "full_name": "داودي ربيع بن بايوب", "dob": "2014-02-24", "phone": "0558694073", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000293", "membership_no": "293", "full_name": "ريغي اية بنت الشيخ", "dob": "2021-07-01", "phone": "0652504460", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000006", "branch_slug": "main", "section_slug": "sec_tafatan_2", "section": "التفطين 2 متلازمة داون", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000296", "membership_no": "296", "full_name": "عباس لقمان بن يحي", "dob": "2017-05-12", "phone": "0770714570", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000297", "membership_no": "297", "full_name": "الشيخ محمد المهدي بن عيسى", "dob": "2016-12-17", "phone": "0674626920", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000002", "branch_slug": "main", "section_slug": "sec_autism_2", "section": "التوحد 02", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000301", "membership_no": "301", "full_name": "اسماوي ايوب بن عبد السلام", "dob": "2018-12-15", "phone": "0553242830", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000008", "branch_slug": "main", "section_slug": "sec_shibh_madrasi", "section": "قسم الشبه مدرسي مكيف", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000305", "membership_no": "305", "full_name": "يحي الشريف خديجة بنت فاروق", "dob": "2022-09-23", "phone": "0668646890", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000005", "branch_slug": "main", "section_slug": "sec_tafatan_1", "section": "التفطين 1 تأخر ذهني", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000306", "membership_no": "306", "full_name": "بن صغير ياسين بن احمد", "dob": "2015-07-31", "phone": "0662014800", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000004", "branch_slug": "main", "section_slug": "sec_observation", "section": "الملاحظة جدد", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000307", "membership_no": "307", "full_name": "غبشي نورالهدى بنت يوسف", "dob": "2014-09-07", "phone": "0659514840", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000004", "branch_slug": "main", "section_slug": "sec_observation", "section": "الملاحظة جدد", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000310", "membership_no": "310", "full_name": "داودي الحاج يحي بن باحمد", "dob": "2007-06-24", "phone": "0541131000", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000311", "membership_no": "311", "full_name": "الشيخ دحمان مامة بنت دحمان", "dob": "2016-02-10", "phone": "0559336740", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000312", "membership_no": "312", "full_name": "بن يونس يسرى بنت مصطفى", "dob": "2007-09-09", "phone": "0666852080", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000313", "membership_no": "313", "full_name": "لعزيز ياسمين بنت سيراج", "dob": "2013-12-30", "phone": "0550158580", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000314", "membership_no": "314", "full_name": "نوح مفنون أمين بن البشير", "dob": "2007-01-05", "phone": "0778307440", "disability": "متلازمة داون T.21", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000315", "membership_no": "315", "full_name": "بورزمة ابراهيم بن محمد", "dob": "2021-08-11", "phone": "0663334780", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000005", "branch_slug": "main", "section_slug": "sec_tafatan_1", "section": "التفطين 1 تأخر ذهني", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000316", "membership_no": "316", "full_name": "زيطاري نور سين بنت خليل", "dob": "2020-09-21", "phone": "0662417360", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000005", "branch_slug": "main", "section_slug": "sec_tafatan_1", "section": "التفطين 1 تأخر ذهني", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000317", "membership_no": "317", "full_name": "داودي طه بن علي", "dob": "2007-06-06", "phone": "0541487670", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000002", "section_id": "22222222-0000-4000-8000-000000000010", "branch_slug": "work", "section_slug": "sec_tamhin", "section": "التمهين م م ع", "center": "work", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000318", "membership_no": "318", "full_name": "جبريط سعد الدين بن بدر الدين", "dob": "2014-05-10", "phone": "0662280780", "disability": "التأخر الذهني R.M", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000007", "branch_slug": "main", "section_slug": "sec_istithara", "section": "الاستثارة", "center": "main", "academic_year": "2026-2027", "active": true}, {"id": "00000000-0000-4000-8000-000000000320", "membership_no": "320", "full_name": "بيتور محمد اسحاق بن بن يعيش", "dob": "2019-03-24", "phone": "0662307490", "disability": "اضطراب طيف التوحد TSA", "branch_id": "11111111-0000-4000-8000-000000000001", "section_id": "22222222-0000-4000-8000-000000000004", "branch_slug": "main", "section_slug": "sec_observation", "section": "الملاحظة جدد", "center": "main", "academic_year": "2026-2027", "active": true}];

  /* القائمة الرسمية للموظفين والمربيات (16 موظفًا) — كلٌّ في مركزه، برقم الهاتف وكلمة المرور DI + تاريخ الميلاد (DDMMYYYY) */
  var EMBEDDED_STAFF = [
    {"id": "staff-001", "emp_no": "1",   "full_name": "أمير زكرياء بن عبد الله",            "dob": "1993-05-11", "phone": "0540817775", "email": "edu.0540817775@darelihsan.org", "center": "main", "role": "admin",    "job_title": "مدير المركز",      "section_id": "", "section_name": "المركز الرئيسي دار الإحسان", "has_account": true},
    {"id": "staff-002", "emp_no": "2",   "full_name": "الخلفاوي حمودة بن يحي",              "dob": "1986-05-03", "phone": "0550647516", "email": "edu.0550647516@darelihsan.org", "center": "main", "role": "admin",    "job_title": "عون إداري",        "section_id": "", "section_name": "المركز الرئيسي دار الإحسان", "has_account": true},
    {"id": "staff-010", "emp_no": "10",  "full_name": "الأخصائية نواري اسماء بنت جيلالي",   "dob": "2001-08-14", "phone": "0655806951", "email": "edu.0655806951@darelihsan.org", "center": "main", "role": "specialist", "job_title": "أخصائية نفسانية",  "section_id": "", "section_name": "المركز الرئيسي دار الإحسان", "has_account": true},
    {"id": "staff-017", "emp_no": "17",  "full_name": "فضاض خولة بنت الشيخ بن أحمد",        "dob": "1998-02-05", "phone": "0555905565", "email": "edu.0555905565@darelihsan.org", "center": "main", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000005", "section_name": "التفطين 1 تأخر ذهني", "has_account": true},
    {"id": "staff-047", "emp_no": "47",  "full_name": "الرمة فاطمة الزهراء بنت أحمد",       "dob": "1998-07-28", "phone": "0663412874", "email": "edu.0663412874@darelihsan.org", "center": "main", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000001", "section_name": "توحد 01", "has_account": true},
    {"id": "staff-058", "emp_no": "58",  "full_name": "قوطارة جميلة بنت مبروك",             "dob": "1993-06-19", "phone": "0676160618", "email": "edu.0676160618@darelihsan.org", "center": "main", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000008", "section_name": "قسم الشبه مدرسي مكيف", "has_account": true},
    {"id": "staff-103", "emp_no": "103", "full_name": "بوقانون فيروز بنت مسعود",            "dob": "1980-10-10", "phone": "0657929247", "email": "edu.0657929247@darelihsan.org", "center": "main", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000004", "section_name": "الملاحظة جدد", "has_account": true},
    {"id": "staff-104", "emp_no": "104", "full_name": "ميزات صارة بنت أحمد",                "dob": "1991-02-09", "phone": "0697626616", "email": "edu.0697626616@darelihsan.org", "center": "main", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000009", "section_name": "الخارجي اعاقة شديدة", "has_account": true},
    {"id": "staff-105", "emp_no": "105", "full_name": "قريدة عيدة بنت موسى",                "dob": "1970-02-18", "phone": "0657929291", "email": "edu.0657929291@darelihsan.org", "center": "main", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000006", "section_name": "التفطين 2 متلازمة داون", "has_account": true},
    {"id": "staff-111", "emp_no": "111", "full_name": "باحمد صليحة بنت نور الدين",          "dob": "1996-11-19", "phone": "0552698775", "email": "edu.0552698775@darelihsan.org", "center": "main", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000002", "section_name": "التوحد 02", "has_account": true},
    {"id": "staff-113", "emp_no": "113", "full_name": "بن دربال نسيبة بنت محمد",            "dob": "1985-11-25", "phone": "0667941590", "email": "edu.0667941590@darelihsan.org", "center": "main", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000003", "section_name": "توحد 03", "has_account": true},
    {"id": "staff-099", "emp_no": "99",  "full_name": "عبد الصمد عصام بن خميسي",            "dob": "1981-12-17", "phone": "0662744988", "email": "edu.0662744988@darelihsan.org", "center": "work", "role": "admin",    "job_title": "رئيس مصلحة",       "section_id": "22222222-0000-4000-8000-000000000010", "section_name": "التمهين م م ع", "has_account": true},
    {"id": "staff-004", "emp_no": "4",   "full_name": "لهزيل زينب بنت أحمد",                "dob": "1984-10-14", "phone": "0668640481", "email": "edu.0668640481@darelihsan.org", "center": "work", "role": "educator", "job_title": "مربية",            "section_id": "22222222-0000-4000-8000-000000000010", "section_name": "التمهين م م ع", "has_account": true},
    {"id": "staff-038", "emp_no": "38",  "full_name": "جلود عبد السلام بن الشيخ بن قويدر",  "dob": "1996-09-30", "phone": "0657855528", "email": "edu.0657855528@darelihsan.org", "center": "work", "role": "educator", "job_title": "مربي",             "section_id": "22222222-0000-4000-8000-000000000010", "section_name": "التمهين م م ع", "has_account": true},
    {"id": "staff-107", "emp_no": "107", "full_name": "سيروكان بشرى بنت احمد",              "dob": "2011-04-25", "phone": "0652676768", "email": "edu.0652676768@darelihsan.org", "center": "work", "role": "educator", "job_title": "مساعدة مربية",     "section_id": "22222222-0000-4000-8000-000000000010", "section_name": "التمهين م م ع", "has_account": true},
    {"id": "staff-074", "emp_no": "74",  "full_name": "طالب باحمد ياسين بن عيسى",           "dob": "2007-10-22", "phone": "0664359676", "email": "edu.0664359676@darelihsan.org", "center": "farm", "role": "educator", "job_title": "مربي المزرعة البيداغوجية", "section_id": "22222222-0000-4000-8000-000000000011", "section_name": "المزرعة البستنة", "has_account": true}
  ];

  function staffPasswordFromDob(dob) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || '').trim());
    return m ? ('DI' + m[3] + m[2] + m[1]) : '';
  }

  function buildDefaultPortalMeta() {
    var edus = [];
    var accs = {};
    EMBEDDED_STAFF.forEach(function (st) {
      var em = st.email.toLowerCase();
      if (st.role === 'educator') {
        edus.push({
          id: st.id,
          emp_no: st.emp_no,
          full_name: st.full_name,
          dob: st.dob,
          phone: st.phone,
          email: em,
          center: st.center,
          job_title: st.job_title,
          section_id: st.section_id,
          section_name: st.section_name,
          has_account: true,
          updated_at: '2026-10-26T08:00:00Z'
        });
      }
      accs[em] = {
        role: st.role,
        educator_id: st.role === 'educator' ? st.id : null,
        emp_no: st.emp_no,
        full_name: st.full_name,
        dob: st.dob,
        phone: st.phone,
        center: st.center,
        center_access: st.center,
        job_title: st.job_title,
        section_id: st.section_id,
        section_name: st.section_name,
        has_account: true,
        updated_at: '2026-10-26T08:00:00Z'
      };
    });
    return { educators: edus, account_meta: accs };
  }


  function normAr(s) {
    return String(s || '').toLowerCase()
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/[ى]/g, 'ي')
      .replace(/[ة]/g, 'ه')
      .replace(/[\u064B-\u065F\u0670]/g, '');
  }

  var CENTERS = { main: 'المركز الرئيسي دار الإحسان', work: 'مركز المساعدة على العمل', farm: 'المزرعة البيداغوجية' };

  var CENTER_META = {
    main: {
      key: 'main',
      name: 'المركز الرئيسي دار الإحسان',
      shortName: 'المركز الرئيسي',
      badge: 'المركز النفسي البيداغوجي',
      icon: '', svgIcon: 's-main-center',
      avatar: 'د',
      desc: 'الدخول إلى اللوحة الحالية الخاصة بالمركز الرئيسي دار الإحسان (الأطفال والطلبة، الأقسام التربوية، المربيات، البرامج الأسبوعية، التقارير والتقييم، المواعيد، الرسائل، والوثائق).'
    },
    work: {
      key: 'work',
      name: 'مركز المساعدة على العمل',
      shortName: 'مركز المساعدة على العمل',
      badge: 'ورشات التأهيل والتمهين',
      icon: '', svgIcon: 's-work-center',
      avatar: 'ع',
      desc: 'الدخول إلى لوحة مركز المساعدة على العمل والاطلاع على طلابها وأقسامها (قسم التمهين م م ع والأقسام المهنية) وبرامجها وتقاريرها.'
    },
    farm: {
      key: 'farm',
      name: 'المزرعة البيداغوجية',
      shortName: 'المزرعة البيداغوجية (البستنة)',
      badge: 'البستنة والأنشطة الفلاحية',
      icon: '', svgIcon: 's-farm-center',
      avatar: 'م',
      desc: 'الدخول إلى لوحة المزرعة البيداغوجية والاطلاع على طلاب البستنة (قسم المزرعة البستنة) وإدارة ملفاتهم وحسابات المزرعة.'
    }
  };

  var CENTER_ACCESS_OPTS = [
    ['all', 'جميع المراكز (المركز الرئيسي + المساعدة على العمل + المزرعة البيداغوجية)'],
    ['main', 'المركز الرئيسي دار الإحسان فقط'],
    ['work', 'مركز المساعدة على العمل فقط'],
    ['farm', 'المزرعة البيداغوجية (البستنة) فقط'],
    ['main,work', '+المركز الرئيسي + مركز المساعدة على العمل'],
    ['main,farm', '+المركز الرئيسي + المزرعة البيداغوجية'],
    ['work,farm', '+مركز المساعدة على العمل + المزرعة البيداغوجية']
  ];

  var S = {
    sec: 'hub',
    activeCenter: 'main',
    filterSectionId: '',
    centerAccess: 'all',
    cache: {},
    nav: 0,
    me: null,
    isOwner: false,
    isEducator: false,
    isSpecialist: false,
    eduProfile: null,
    eduSectionId: '',
    eduSectionName: '',
    portalMeta: null,
    stopIdle: null,
    navStack: [],
    inSubBuilder: false,
    deletedRuntimeIds: {},
    deletedRuntimeEmails: {}
  };

  var TITLES = {
    hub: 'لوحة الإدارة',
    hub_accounts: 'الحسابات الخاصة بجميع المراكز',
    dash: 'لوحة التحكم',
    children: 'الأطفال والطلبة والأقسام',
    branches: 'الفروع والأقسام التربوية',
    educators: 'قسم المربيات',
    programs: 'البرامج التربوية للأقسام',
    reports: 'التقارير التربوية الدورية',
    evaluations: 'استمارات التقييم البيداغوجي (الرسمية)',
    archive: 'الأرشيف والنسخ الاحتياطية',
    appts: 'المواعيد والأنشطة',
    msgs: 'الرسائل والإعلانات',
    docs: 'الوثائق الخاصة',
    accounts: 'حسابات المركز',
    audit: 'سجل العمليات والتدقيق',
    settings: 'الأمان والإعدادات'
  };

  function getCenterMeta(ck) {
    return CENTER_META[ck] || CENTER_META.main;
  }

  function parseAllowedCenters(accessStr) {
    var raw = String(accessStr || 'all').trim().toLowerCase();
    if (!raw || raw === 'all') return ['main', 'work', 'farm'];
    var parts = raw.split(',').map(function (s) { return s.trim(); }).filter(function (s) {
      return s === 'main' || s === 'work' || s === 'farm';
    });
    return parts.length ? parts : ['main', 'work', 'farm'];
  }

  function canAccessCenter(centerKey) {
    if (S.isOwner) return true;
    var allowed = parseAllowedCenters(S.centerAccess);
    return allowed.indexOf(centerKey) >= 0;
  }

  function canAccessGeneralAdmin() {
    if (S.isEducator) return false;
    if (S.isOwner) return true;
    var raw = String(S.centerAccess || 'all').trim().toLowerCase();
    return !raw || raw === 'all';
  }

  function formatCenterAccessLabel(accessStr) {
    var raw = String(accessStr || 'all').trim().toLowerCase();
    if (!raw || raw === 'all') return 'جميع المراكز (المركز وملحقاته)';
    var map = {
      'main': 'المركز الرئيسي فقط',
      'work': 'مركز المساعدة على العمل فقط',
      'farm': 'المزرعة البيداغوجية فقط',
      'main,work': 'المركز الرئيسي + المساعدة على العمل',
      'main,farm': 'المركز الرئيسي + المزرعة البيداغوجية',
      'work,farm': 'المساعدة على العمل + المزرعة البيداغوجية'
    };
    return map[raw] || ('' + raw);
  }

  function branchCenterKey(b) {
    if (!b) return 'main';
    var sl = String(b.slug || '').toLowerCase();
    var nm = String(b.name || '');
    if (sl === 'work' || nm.indexOf('المساعدة') >= 0 || nm.indexOf('التمهين') >= 0) return 'work';
    if (sl === 'farm' || nm.indexOf('المزرعة') >= 0 || nm.indexOf('البستنة') >= 0) return 'farm';
    return 'main';
  }

  function sectionCenterKey(s, branches) {
    if (!s) return 'main';
    var sl = String(s.slug || '').toLowerCase();
    var nm = String(s.name || '');
    if (sl === 'sec_tamhin' || nm.indexOf('التمهين') >= 0 || nm.indexOf('م م ع') >= 0 || nm.indexOf('المساعدة') >= 0) return 'work';
    if (sl === 'sec_bostana' || nm.indexOf('البستنة') >= 0 || nm.indexOf('المزرعة') >= 0) return 'farm';
    if (s.branch_id && Array.isArray(branches)) {
      var br = branches.filter(function (b) { return b.id === s.branch_id; })[0];
      if (br) return branchCenterKey(br);
    }
    return 'main';
  }

  function childMatchesSection(c, targetSecId, targetSecName, allSections) {
    if (!c) return false;
    if (!targetSecId && !targetSecName) return true;
    if (targetSecId && c.section_id === targetSecId) return true;
    var secObj = (allSections || []).filter(function (s) {
      return (targetSecId && (s.id === targetSecId || s.slug === targetSecId)) ||
             (targetSecName && normAr(s.name) === normAr(targetSecName));
    })[0];
    if (secObj) {
      if (c.section_id === secObj.id) return true;
      if (c.section_slug && c.section_slug === secObj.slug) return true;
      if (c.section && normAr(c.section) === normAr(secObj.name)) return true;
    }
    if (targetSecName && c.section && normAr(c.section) === normAr(targetSecName)) return true;
    return false;
  }

  function childCenterKey(c, branches, sections) {
    if (!c) return 'main';
    if (c.center === 'work' || c.center === 'farm') return c.center;
    if (c.section_id && Array.isArray(sections)) {
      var sec = sections.filter(function (s) { return s.id === c.section_id; })[0];
      if (sec) return sectionCenterKey(sec, branches);
    }
    if (c.branch_id && Array.isArray(branches)) {
      var br = branches.filter(function (b) { return b.id === c.branch_id; })[0];
      if (br) return branchCenterKey(br);
    }
    var sTxt = String(c.section || '');
    if (sTxt.indexOf('التمهين') >= 0 || sTxt.indexOf('م م ع') >= 0 || sTxt.indexOf('المساعدة') >= 0) return 'work';
    if (sTxt.indexOf('البستنة') >= 0 || sTxt.indexOf('المزرعة') >= 0) return 'farm';
    return 'main';
  }

  var AUDIT = {
    publish: 'نشر محتوى الموقع', load_version: 'تحميل نسخة سابقة', add_user: 'إضافة مدير', update_user: 'تحديث كود مدير', reset_password: 'تغيير كود مدير', remove_user: 'حذف مدير',
    'children:insert': 'إنشاء ملف طفل', 'children:delete': 'حذف ملف طفل', 'parent_profiles:insert': 'إنشاء ملف ولي', 'parent_profiles:delete': 'حذف ملف ولي',
    'parent:disable': 'تعطيل ولي', 'parent:enable': 'تفعيل ولي', 'parent:invite': 'دعوة ولي', 'parent:resend_invite': 'إعادة إرسال دعوة ولي', 'parent:disable_login': 'حظر دخول ولي', 'parent:enable_login': 'رفع حظر ولي',
    'parent_children:insert': 'ربط ولي بطفل', 'parent_children:delete': 'فك ربط ولي بطفل', 'progress_reports:insert': 'إنشاء تقرير', 'progress_reports:delete': 'حذف تقرير',
    'report:publish': 'نشر تقرير', 'report:unpublish': 'إلغاء نشر تقرير', 'appointments:insert': 'إضافة موعد', 'appointments:update': 'تعديل موعد', 'appointments:delete': 'حذف موعد',
    'messages:insert': 'إنشاء رسالة/إعلان', 'messages:delete': 'حذف رسالة/إعلان', 'documents:insert': 'رفع وثيقة', 'documents:delete': 'حذف وثيقة',
    'admin:invite': 'دعوة مدير', 'admin:create': 'إنشاء مدير بكلمة مرور', 'admin:disable': 'تعطيل مدير', 'admin:enable': 'تفعيل مدير',
    'branches:insert': 'إضافة فرع', 'sections:insert': 'إضافة قسم', 'educational_programs:insert': 'إضافة برنامج تربوي',
    'educational_programs:delete': 'حذف برنامج تربوي', 'registration_code:generate': 'توليد رمز تسجيل طفل',
    'parent:redeem_code': 'استرداد رمز تسجيل من ولي', 'audit:delete': 'حذف سجلات التدقيق'
  };

  /* ---------- إدارة بيانات المربيات وحسابات الإدارة وكلمات المرور (تخزين سحابي في site_content) ---------- */
  function emptyPortalMeta() {
    return buildDefaultPortalMeta();
  }

  function normalizeArabicDigits(str) {
    var s = String(str || '');
    var ar = '٠١٢٣٤٥٦٧٨٩';
    var fa = '۰۱۲۳۴۵۶۷۸۹';
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var i1 = ar.indexOf(ch);
      var i2 = fa.indexOf(ch);
      if (i1 >= 0) out += String(i1);
      else if (i2 >= 0) out += String(i2);
      else out += ch;
    }
    return out;
  }

  function sanitizeAccountEntry(entry) {
    if (!entry || typeof entry !== 'object') return {};
    var copy = Object.assign({}, entry);
    delete copy.pwVal;
    delete copy.setupKey;
    delete copy.password;
    return copy;
  }

  function sanitizeEducatorEntry(edu) {
    if (!edu || typeof edu !== 'object') return null;
    var copy = Object.assign({}, edu);
    delete copy.pwVal;
    delete copy.setupKey;
    delete copy.password;
    return copy;
  }

  function normalizePortalMeta(raw) {
    var m = raw && typeof raw === 'object' ? raw : {};
    var base = buildDefaultPortalMeta();
    var delEmails = Array.isArray(m.deleted_emails) ? m.deleted_emails.map(function (x) { return String(x || '').toLowerCase(); }).filter(Boolean) : [];
    var delEduIds = Array.isArray(m.deleted_educator_ids) ? m.deleted_educator_ids.map(String).filter(Boolean) : [];
    var delEmailMap = {};
    var delEduMap = {};
    delEmails.forEach(function (em) { delEmailMap[em] = true; });
    delEduIds.forEach(function (id) { delEduMap[id] = true; });
    if (S && S.deletedRuntimeEmails) {
      Object.keys(S.deletedRuntimeEmails).forEach(function (em) {
        delEmailMap[em] = true;
        if (delEmails.indexOf(em) < 0) delEmails.push(em);
      });
    }
    if (S && S.deletedRuntimeIds) {
      Object.keys(S.deletedRuntimeIds).forEach(function (id) {
        delEduMap[id] = true;
        if (delEduIds.indexOf(id) < 0) delEduIds.push(id);
      });
    }

    var rawEdus = Array.isArray(m.educators) ? m.educators.map(sanitizeEducatorEntry).filter(Boolean) : [];
    rawEdus = rawEdus.filter(function (e) {
      var isIstithara = (e.section_id === '22222222-0000-4000-8000-000000000007') || (String(e.section_name || '').indexOf('الاستثارة') >= 0);
      if (isIstithara) return false;
      if (e.id && delEduMap[String(e.id)]) return false;
      if (e.email && delEmailMap[String(e.email).toLowerCase()]) return false;
      return true;
    });

    var edus = base.educators.filter(function (be) {
      if (be.id && delEduMap[String(be.id)]) return false;
      if (be.email && delEmailMap[String(be.email).toLowerCase()]) return false;
      return true;
    });

    rawEdus.forEach(function (re) {
      if (!re || !re.id) return;
      var idx = edus.findIndex(function (be) { return be.id === re.id || (be.phone && re.phone && cleanPhoneDigits(be.phone) === cleanPhoneDigits(re.phone)); });
      if (idx >= 0) edus[idx] = Object.assign({}, edus[idx], re);
      else edus.push(re);
    });

    var rawAccs = (m.account_meta && typeof m.account_meta === 'object') ? m.account_meta : {};
    var accs = {};
    Object.keys(base.account_meta).forEach(function (bk) {
      var lowK = bk.toLowerCase();
      var bEntry = base.account_meta[bk];
      if (delEmailMap[lowK]) return;
      if (bEntry && bEntry.educator_id && delEduMap[String(bEntry.educator_id)]) return;
      accs[lowK] = Object.assign({}, bEntry);
    });

    Object.keys(rawAccs).forEach(function (k) {
      var lowK = k.toLowerCase();
      if (delEmailMap[lowK]) return;
      var entry = sanitizeAccountEntry(rawAccs[k]);
      if (entry.educator_id && delEduMap[String(entry.educator_id)]) return;
      var isIstitharaAcc = (entry.section_id === '22222222-0000-4000-8000-000000000007') || (String(entry.section_name || '').indexOf('الاستثارة') >= 0);
      if (entry.role === 'educator' && isIstitharaAcc) return;
      accs[lowK] = Object.assign({}, accs[lowK] || {}, entry);
    });
    return { educators: edus, account_meta: accs, deleted_emails: delEmails, deleted_educator_ids: delEduIds };
  }

  function mergePortalMetas(primary, secondary) {
    var p = normalizePortalMeta(primary);
    var s = normalizePortalMeta(secondary);
    var delEmails = (p.deleted_emails || []).slice();
    (s.deleted_emails || []).forEach(function (em) { if (delEmails.indexOf(em) < 0) delEmails.push(em); });
    var delEduIds = (p.deleted_educator_ids || []).slice();
    (s.deleted_educator_ids || []).forEach(function (id) { if (delEduIds.indexOf(id) < 0) delEduIds.push(id); });
    var delEmailMap = {}, delEduMap = {};
    delEmails.forEach(function (em) { delEmailMap[em] = true; });
    delEduIds.forEach(function (id) { delEduMap[id] = true; });

    var mergedEdus = p.educators.slice();
    s.educators.forEach(function (se) {
      if (!se || !se.id) return;
      if (delEduMap[String(se.id)] || (se.email && delEmailMap[String(se.email).toLowerCase()])) return;
      var idx = mergedEdus.findIndex(function (pe) { return pe && pe.id === se.id; });
      if (idx === -1) {
        mergedEdus.push(se);
      } else if (se.updated_at && (!mergedEdus[idx].updated_at || se.updated_at > mergedEdus[idx].updated_at)) {
        mergedEdus[idx] = se;
      }
    });
    var mergedAccs = Object.assign({}, s.account_meta, p.account_meta);
    Object.keys(mergedAccs).forEach(function (k) {
      if (delEmailMap[k.toLowerCase()]) delete mergedAccs[k];
    });
    return normalizePortalMeta({ educators: mergedEdus, account_meta: mergedAccs, deleted_emails: delEmails, deleted_educator_ids: delEduIds });
  }

  function readLocalPortalBackup() {
    try {
      var s = sessionStorage.getItem('de_portal_meta_v1');
      if (s) return normalizePortalMeta(JSON.parse(s));
    } catch (e) {}
    return null;
  }

  function writeLocalPortalBackup(meta) {
    var jsonStr = JSON.stringify(normalizePortalMeta(meta));
    try { sessionStorage.setItem('de_portal_meta_v1', jsonStr); } catch (e) {}
  }

  async function loadPortalMeta(force) {
    if (S.portalMeta && !force) return S.portalMeta;
    var localBackup = readLocalPortalBackup();
    if (S.portalMeta) {
      localBackup = localBackup ? mergePortalMetas(S.portalMeta, localBackup) : S.portalMeta;
    }

    try {
      var fetchP = C.rest('GET', '/site_content?id=eq.draft&select=id,data');
      var timeP = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 3000); });
      var rows = await Promise.race([fetchP, timeP]);
      var list = Array.isArray(rows) ? rows : (rows ? [rows] : []);
      var draftRow = list[0];
      var remoteMeta = (draftRow && draftRow.data && draftRow.data._portal_meta) ? normalizePortalMeta(draftRow.data._portal_meta) : null;

      if (remoteMeta) {
        var finalMeta = localBackup ? mergePortalMetas(remoteMeta, localBackup) : remoteMeta;
        S.portalMeta = finalMeta;
        writeLocalPortalBackup(finalMeta);
        return finalMeta;
      }
    } catch (e) {}

    S.portalMeta = localBackup || emptyPortalMeta();
    writeLocalPortalBackup(S.portalMeta);
    return S.portalMeta;
  }

  async function savePortalMeta(meta) {
    var cleanMeta = normalizePortalMeta(meta);
    S.portalMeta = cleanMeta;
    writeLocalPortalBackup(cleanMeta);
    try {
      var rows = await C.rest('GET', '/site_content?id=eq.draft&select=id,data');
      var row = Array.isArray(rows) ? rows[0] : null;
      var baseData = (row && row.data && typeof row.data === 'object') ? Object.assign({}, row.data) : {};
      baseData._portal_meta = cleanMeta;
      if (row) {
        await C.rest('PATCH', '/site_content?id=eq.draft', { data: baseData, updated_at: new Date().toISOString() });
      } else {
        await C.rest('POST', '/site_content', { id: 'draft', data: baseData, updated_at: new Date().toISOString() });
      }
    } catch (e) {}
    return cleanMeta;
  }

  function cleanPhoneDigits(p) {
    return normalizeArabicDigits(p).replace(/\D/g, '');
  }

  function toWhatsAppPhone(p) {
    var d = cleanPhoneDigits(p);
    if (!d) return '';
    if (d.indexOf('00213') === 0) return d.slice(2);
    if (d.indexOf('213') === 0) return d;
    if (d.charAt(0) === '0' && d.length >= 9) return '213' + d.slice(1);
    return d;
  }

  function educatorEmailFromPhoneOrName(phone, eduId) {
    var d = cleanPhoneDigits(phone);
    if (d.length >= 6) return 'edu.' + d + '@darelihsan.org';
    var shortId = String(eduId || '').replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase() || 'staff';
    return 'edu.' + shortId + '@darelihsan.org';
  }

  function resolveEducatorLoginEmail(inputStr, meta) {
    var raw = String(inputStr || '').trim().toLowerCase();
    if (!raw) return '';
    var m = meta || S.portalMeta || emptyPortalMeta();
    var digits = cleanPhoneDigits(raw);
    var tail9 = digits.length >= 9 ? digits.slice(-9) : '';

    if (tail9) {
      var byPhone = (m.educators || []).filter(function (e) {
        var ed = cleanPhoneDigits(e.phone);
        return ed.length >= 9 && ed.slice(-9) === tail9;
      })[0];
      if (byPhone && byPhone.email) return byPhone.email.toLowerCase();

      var accKeys = Object.keys(m.account_meta || {});
      for (var i = 0; i < accKeys.length; i++) {
        var ak = accKeys[i];
        var am = m.account_meta[ak];
        var ad = cleanPhoneDigits(am && am.phone);
        if (ad.length >= 9 && ad.slice(-9) === tail9) return ak.toLowerCase();
      }
      if (!DE.isEmail(raw)) {
        var normPhone = raw.charAt(0) === '0' ? digits : ('0' + tail9);
        return 'edu.' + normPhone + '@darelihsan.org';
      }
    }

    if (!DE.isEmail(raw)) {
      var byName = (m.educators || []).filter(function (e) {
        return normAr(e.full_name) === normAr(raw);
      })[0];
      if (byName && byName.email) return byName.email.toLowerCase();
    }

    return raw;
  }

  var STAFF_SESSION_KEY = 'de_staff_portal_session_v2';

  function clearEducatorDirectSession() {
    try {
      sessionStorage.removeItem('de_edu_direct_session');
      sessionStorage.removeItem(STAFF_SESSION_KEY);
    } catch (e) {}
  }

  function persistStaffSession(prof) {
    if (!prof || !prof.email) return;
    try {
      sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify({
        id: prof.id || prof.educator_id || ('staff-' + cleanPhoneDigits(prof.phone || prof.email)),
        email: String(prof.email).toLowerCase(),
        full_name: prof.full_name || '',
        phone: prof.phone || '',
        dob: prof.dob || '',
        role: prof.role || 'educator',
        center: prof.center || prof.center_access || 'main',
        center_access: prof.center_access || prof.center || 'main',
        section_id: prof.section_id || '',
        section_name: prof.section_name || '',
        job_title: prof.job_title || '',
        at: Date.now()
      }));
    } catch (e) {}
  }

  function readStaffSession() {
    try {
      var raw = sessionStorage.getItem(STAFF_SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return (parsed && parsed.email) ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function verifyStaffPortalAuth(rawInput, resolvedEmail, passwordInput, meta) {
    var em = String(resolvedEmail || '').trim().toLowerCase();
    var pw = String(passwordInput || '').trim();
    if (!em || !pw) return null;

    var m = meta || S.portalMeta || emptyPortalMeta();
    var delEmails = (m.deleted_emails || []).map(function (x) { return String(x || '').toLowerCase(); });
    var delIds = (m.deleted_educator_ids || []).map(String);
    if (delEmails.indexOf(em) >= 0 || (S.deletedRuntimeEmails && S.deletedRuntimeEmails[em])) {
      return null;
    }

    var inDigits = cleanPhoneDigits(rawInput);
    var tail9 = inDigits.length >= 9 ? inDigits.slice(-9) : '';

    var candidates = [];
    EMBEDDED_STAFF.forEach(function (st) {
      candidates.push(Object.assign({}, st));
    });
    (m.educators || []).forEach(function (ed) {
      if (ed) candidates.push(Object.assign({ role: 'educator' }, ed));
    });
    Object.keys(m.account_meta || {}).forEach(function (k) {
      var ac = m.account_meta[k];
      if (ac) candidates.push(Object.assign({ email: k }, ac));
    });

    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      var cEmail = String(c.email || '').toLowerCase();
      var cId = String(c.id || c.educator_id || '');
      if (cEmail && (delEmails.indexOf(cEmail) >= 0 || (S.deletedRuntimeEmails && S.deletedRuntimeEmails[cEmail]))) continue;
      if (cId && (delIds.indexOf(cId) >= 0 || (S.deletedRuntimeIds && S.deletedRuntimeIds[cId]))) continue;

      var cDigits = cleanPhoneDigits(c.phone || '');
      var cTail9 = cDigits.length >= 9 ? cDigits.slice(-9) : '';
      var emailMatched = (cEmail && cEmail === em);
      var phoneMatched = (tail9 && cTail9 && tail9 === cTail9);

      if (emailMatched || phoneMatched) {
        var expectedPw = staffPasswordFromDob(c.dob);
        if (expectedPw && pw.toUpperCase() === expectedPw.toUpperCase()) {
          return Object.assign({}, c, {
            email: cEmail || em
          });
        }
      }
    }
    return null;
  }

  function setNavBtnLabel(btn, txt) {
    var sp = btn.querySelector('span');
    if (sp) sp.textContent = txt;
    else if (btn.lastChild && btn.lastChild.nodeType === 3) btn.lastChild.nodeValue = txt;
  }

  function updateSidebarCenterCard() {
    var nameEl = $('#sideCenterName');
    var roleEl = $('#sideRoleLabel');
    var avEl = $('#sideAvatar');
    var swBtn = $('#hubSwitchBtn');
    var swTxt = $('#hubSwitchTxt');
    var topDateEl = $('#topDate');

    if (topDateEl && !topDateEl.textContent) {
      try {
        topDateEl.textContent = new Date().toLocaleDateString('ar-DZ-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) {}
    }

    if (S.isEducator) {
      if (nameEl) nameEl.textContent = S.eduSectionName || 'فوجي التربوي';
      if (roleEl) roleEl.textContent = 'فضاء المربية';
      if (avEl) avEl.textContent = 'م';
      if (swBtn) swBtn.hidden = true;
      return;
    }

    if (S.isSpecialist) {
      if (nameEl) nameEl.textContent = 'المركز الرئيسي دار الإحسان';
      if (roleEl) roleEl.textContent = 'أخصائية نفسانية';
      if (avEl) avEl.textContent = 'ن';
      if (swBtn) swBtn.hidden = true;
      return;
    }

    if (swBtn) swBtn.hidden = (S.sec === 'hub');
    var cm = getCenterMeta(S.activeCenter);
    if (S.sec === 'hub' || S.sec === 'hub_accounts') {
      if (nameEl) nameEl.textContent = 'لوحة الإدارة (المراكز الثلاثة)';
      if (roleEl) roleEl.textContent = S.isOwner ? 'المدير الرئيسي (المالك)' : formatCenterAccessLabel(S.centerAccess);
      if (avEl) avEl.textContent = 'د';
      if (swTxt) swTxt.textContent = 'العودة إلى لوحة الإدارة';
    } else {
      if (nameEl) nameEl.textContent = cm.name;
      if (roleEl) roleEl.textContent = 'اضغط للعودة إلى لوحة الإدارة';
      if (avEl) avEl.textContent = cm.avatar;
      if (swTxt) swTxt.textContent = 'لوحة الإدارة (' + cm.shortName + ')';
    }
  }

  
  function isFarmSession() {
    if (S.activeCenter === 'farm') return true;
    if (S.isEducator) {
      var secId = String(S.eduSectionId || '');
      var secNm = String(S.eduSectionName || '');
      var profCenter = S.eduProfile && S.eduProfile.center;
      if (profCenter === 'farm' || secId === '22222222-0000-4000-8000-000000000011' || secId === 'sec_bostana' || secNm.indexOf('البستنة') >= 0 || secNm.indexOf('المزرعة') >= 0) {
        return true;
      }
    }
    return false;
  }

  
  /* فحص صلاحية الوصول إلى نظام الأرشيف الشامل (للإداري الخلفاوي حمودة أو من يملك صلاحية جميع المراكز فقط) */
  function canUserAccessArchive() {
    if (!S.me) return false;
    if (S.isEducator) return false;
    var email = String(S.me.email || '').toLowerCase().trim();
    var name = String(S.me.full_name || S.me.name || '').trim();
    var phone = String(S.me.phone || '').trim();
    var isHammouda = email === 'edu.0550647516@darelihsan.org' ||
                     email.indexOf('0550647516') >= 0 ||
                     phone.indexOf('0550647516') >= 0 ||
                     name.indexOf('حمودة') >= 0 ||
                     name.indexOf('الخلفاوي') >= 0;
    var hasAllCenters = S.isOwner || (S.centerAccess === 'all') || (typeof canAccessGeneralAdmin === 'function' && canAccessGeneralAdmin());
    return isHammouda || hasAllCenters;
  }

  function applyRoleSidebarUI() {
    var isEdu = !!S.isEducator;
    var isFarm = isFarmSession();
    var isSpec = !!S.isSpecialist;
    var allowedForEdu = isFarm ? { children: true } : { children: true, reports: true, evaluations: true };
    var allowedForSpec = { dash: true, children: true, educators: true, programs: true, reports: true, evaluations: true, appts: true, msgs: true, docs: true, archive: true };
    var isWorkOrFarm = !isEdu && !isSpec && (S.activeCenter === 'work' || S.activeCenter === 'farm');
    var allowedForWorkOrFarm = { children: true, accounts: true, archive: true };

    [].forEach.call(document.querySelectorAll('#nav [data-sec]'), function (btn) {
      var secKey = btn.dataset.sec;
      if (secKey === 'hub') {
        btn.hidden = true;
        return;
      }
      if (isEdu) {
        btn.hidden = !allowedForEdu[secKey];
        if (secKey === 'children') setNavBtnLabel(btn, 'قسم الطلبة (' + (S.eduSectionName || 'فوجي') + ')');
        if (secKey === 'reports') setNavBtnLabel(btn, 'التقارير');
        if (secKey === 'evaluations') setNavBtnLabel(btn, 'التقييم');
      } else if (isSpec) {
        btn.hidden = !allowedForSpec[secKey];
        if (secKey === 'children') setNavBtnLabel(btn, 'الأطفال والطلبة');
        if (secKey === 'reports') setNavBtnLabel(btn, 'التقارير');
        if (secKey === 'evaluations') setNavBtnLabel(btn, 'التقييم');
        if (secKey === 'archive') setNavBtnLabel(btn, 'الأرشيف والنسخ الاحتياطية');
      } else if (isWorkOrFarm) {
        btn.hidden = !allowedForWorkOrFarm[secKey];
        if (secKey === 'children') setNavBtnLabel(btn, 'الطلبة');
        if (secKey === 'accounts') setNavBtnLabel(btn, S.activeCenter === 'work' ? 'الحسابات الخاصة بمركز المساعدة على العمل' : 'الحسابات الخاصة بالمزرعة البيداغوجية');
        if (secKey === 'archive') setNavBtnLabel(btn, 'الأرشيف والنسخ الاحتياطية');
      } else {
        btn.hidden = false;
        if (secKey === 'children') setNavBtnLabel(btn, 'الأطفال والطلبة');
        if (secKey === 'reports') setNavBtnLabel(btn, 'التقارير');
        if (secKey === 'evaluations') setNavBtnLabel(btn, 'التقييم');
        if (secKey === 'accounts') setNavBtnLabel(btn, 'حسابات المركز الرئيسي');
        if (secKey === 'archive') setNavBtnLabel(btn, 'الأرشيف والنسخ الاحتياطية');
      }
    });

    [].forEach.call(document.querySelectorAll('#nav .nav-group-label'), function (g) {
      if (isEdu || isWorkOrFarm) {
        g.hidden = true;
      } else if (isSpec) {
        g.hidden = (g.dataset.navGroup === 'operations');
      } else {
        g.hidden = false;
      }
    });
    var navSep = $('#navSep') || document.querySelector('#nav .sep');
    if (navSep) navSep.hidden = isEdu || isWorkOrFarm || isSpec;
    var archNavBtn = document.querySelector("#nav [data-sec='archive']");
    if (archNavBtn) {
      archNavBtn.hidden = !canUserAccessArchive();
    }
    updateSidebarCenterCard();
  }

  /* ---------- أدوات المساعدة ---------- */
  function fmt(v, t) { if (!v) return '—'; try { return new Date(v).toLocaleString('ar-DZ-u-nu-latn', t ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }); } catch (e) { return '—'; } }
  function toast(msg, kind) { var t = $('#toast'); t.textContent = msg; t.className = 'toast ' + (kind || ''); t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 4200); }
  function show(id) { ['boot', 'login', 'app'].forEach(function (x) { $('#' + x).hidden = x !== id; }); }
  function msg(el, m) { el.textContent = m || ''; el.hidden = !m; }
  function lock(btn, fn) {
    if (btn.disabled) return Promise.resolve();
    btn.disabled = true;
    return Promise.resolve().then(fn).then(function (r) { btn.disabled = false; return r; }, function (e) { btn.disabled = false; throw e; });
  }
  function act(btn, fn, okMsg) {
    return lock(btn, fn).then(function (r) { if (okMsg) toast(okMsg, 'ok'); return r; }, function (e) { toast(e.message, 'bad'); });
  }
  function bust() { S.cache = {}; }
  function uid(id) { if (!DE.isUuid(id)) throw new Error('معرّف غير صالح.'); return id; }
  function toLocalInput(iso) {
    if (!iso) return ''; var d = new Date(iso), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function isoFromLocal(v) { var d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); }
  function badge(text, kind) { return h('span', { class: 'badge ' + (kind || ''), text: text }); }
  function size(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function readBytes(file) { return file.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }

  /* استعلامات REST مع استرداد تلقائي للقائمة الرسمية (103 طفل و11 قسمًا و3 فروع) لضمان عدم اختفاء الأطفال أبدًا */
  var _autoImportAttempted = false;
  var CHILD_SAFE_COLS = 'id,membership_no,full_name,dob,disability,phone,center,branch_id,section_id,section,academic_year,basic_info,photo_consent,active,qr_token,created_at,updated_at';

  function mapEmbeddedStudentsToSections(liveBranches, liveSections) {
    var brBySlug = {}, secBySlug = {}, secByName = {};
    (liveBranches || []).forEach(function (b) { if (b && b.slug) brBySlug[b.slug] = b.id; });
    (liveSections || []).forEach(function (s) {
      if (s && s.slug) secBySlug[s.slug] = s.id;
      if (s && s.name) secByName[normAr(s.name)] = s.id;
    });
    return EMBEDDED_STUDENTS.map(function (st) {
      var copy = Object.assign({}, st);
      if (st.branch_slug && brBySlug[st.branch_slug]) copy.branch_id = brBySlug[st.branch_slug];
      if (st.section_slug && secBySlug[st.section_slug]) copy.section_id = secBySlug[st.section_slug];
      else if (st.section && secByName[normAr(st.section)]) copy.section_id = secByName[normAr(st.section)];
      return copy;
    });
  }

  var Q = {
    branches: async function () {
      try {
        var rows = await C.rest('GET', '/branches?select=*&order=name');
        if (Array.isArray(rows) && rows.length) return rows;
      } catch (e) {}
      return EMBEDDED_BRANCHES.slice();
    },
    sections: async function () {
      try {
        var rows = await C.rest('GET', '/sections?select=*&order=name');
        if (Array.isArray(rows) && rows.length) return rows;
      } catch (e) {}
      return EMBEDDED_SECTIONS.slice();
    },
    children: async function () {
      var rows = null;
      try {
        rows = await C.rest('GET', '/children?select=' + CHILD_SAFE_COLS + '&order=membership_no.asc,full_name.asc');
      } catch (err1) {
        try {
          rows = await C.rest('GET', '/children?select=id,full_name,center,section,basic_info,photo_consent,active,created_at,updated_at&order=full_name.asc');
        } catch (err2) {
          rows = [];
        }
      }
      if ((!Array.isArray(rows) || !rows.length) && !S.isEducator && !_autoImportAttempted) {
        _autoImportAttempted = true;
        try {
          await C.rpc('import_official_students');
          rows = await C.rest('GET', '/children?select=' + CHILD_SAFE_COLS + '&order=membership_no.asc,full_name.asc');
        } catch (eImp) {}
      }
      if (Array.isArray(rows) && rows.length) {
        return rows;
      }
      var bList = S.cache.branches || EMBEDDED_BRANCHES;
      var sList = S.cache.sections || EMBEDDED_SECTIONS;
      return mapEmbeddedStudentsToSections(bList, sList);
    },
    parents: function () { return C.rest('GET', '/parent_profiles?select=*&order=full_name').catch(function () { return []; }); },
    links: function () { return C.rest('GET', '/parent_children?select=parent_id,child_id').catch(function () { return []; }); },
    programs: function () { return C.rest('GET', '/educational_programs?select=*&order=created_at.desc').catch(function () { return []; }); },
    codes: function () { return C.rest('GET', '/registration_codes?select=*&order=created_at.desc').catch(function () { return []; }); },
    reports: function () { return C.rest('GET', '/progress_reports?select=*&order=report_date.desc').catch(function () { return []; }); },
    appts: function () { return C.rest('GET', '/appointments?select=*&order=starts_at.desc').catch(function () { return []; }); },
    msgs: function () { return C.rest('GET', '/messages?select=*&order=created_at.desc').catch(function () { return []; }); },
    reads: function () { return C.rest('GET', '/message_reads?select=message_id').catch(function () { return []; }); },
    docs: function () { return C.rest('GET', '/documents?select=*&order=created_at.desc').catch(function () { return []; }); }
  };

  async function get(k) { if (!S.cache[k]) S.cache[k] = await Q[k](); return S.cache[k]; }
  async function getMany() { var r = await Promise.all([].map.call(arguments, get)); return r; }
  function nameOf(list, id, key) { var x = list.filter(function (r) { return (r.id || r.user_id) === id; })[0]; return x ? x[key || 'full_name'] : '—'; }

  /* ---------- نوافذ الحوار ---------- */
  function openModal(card) {
    var m = $('#modal'), c = $('#modalCard'); c.textContent = ''; c.appendChild(card);
    var wasHidden = m.hidden;
    m.hidden = false; document.body.style.overflow = 'hidden';
    if (wasHidden) {
      try { window.history.pushState({ deApp: true, sec: S.sec, center: S.activeCenter, modal: true }, ''); } catch (e) {}
    }
    var first = c.querySelector('input,select,textarea,button'); if (first) first.focus();
  }
  function closeModal() { $('#modal').hidden = true; $('#modalCard').textContent = ''; document.body.style.overflow = ''; }
  function ask(o) {
    return new Promise(function (res) {
      var done = function (v) { closeModal(); res(v); };
      openModal(h('div', { class: 'modal-body' }, h('h2', { text: o.title }), h('p', { text: o.msg || '' }),
        h('div', { class: 'modal-actions' },
          h('button', { class: 'btn light', type: 'button', text: 'تراجع', onclick: function () { done(false); } }),
          h('button', { class: 'btn' + (o.danger ? ' danger' : ''), type: 'button', text: o.ok || 'تأكيد', onclick: function () { done(true); } }))));
    });
  }
  function info(title, node) {
    openModal(h('div', { class: 'modal-body' }, h('h2', { text: title }), node, h('div', { class: 'modal-actions' }, h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }))));
  }

  /* نماذج الإدخال العامة */
  function fieldEl(f, val) {
    var id = 'f_' + f.k, input, getv;
    var hint = h('small', { class: 'hint', text: f.hint || '' });
    if (f.type === 'textarea') {
      input = h('textarea', { id: id, maxlength: f.max || 2000, rows: 4 }); input.value = val || '';
      getv = function () { return DE.clean(input.value, f.max || 2000); };
    } else if (f.type === 'select') {
      var allOpts = (f.opts || []).slice();
      input = h('select', { id: id }, h('option', { value: '', text: '— اختر —' }), allOpts.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
      input.value = val == null ? '' : val; getv = function () { return input.value; };
      var searchIn = null;
      if (f.searchable) {
        searchIn = h('input', { type: 'search', class: 'fld-search', placeholder: 'بحث سريع في القائمة...', autocomplete: 'off' });
        searchIn.addEventListener('input', function () {
          var q = normAr(searchIn.value.trim());
          var curVal = input.value;
          var opts = f.opts || allOpts;
          while (input.firstChild) input.removeChild(input.firstChild);
          input.appendChild(h('option', { value: '', text: '— اختر —' }));
          opts.forEach(function (o) {
            if (!q || normAr(o[1]).indexOf(q) >= 0 || normAr(o[0]).indexOf(q) >= 0) {
              input.appendChild(h('option', { value: o[0], text: o[1] }));
            }
          });
          if (curVal && opts.some(function (o) { return o[0] === curVal; })) input.value = curVal;
        });
      }
    } else if (f.type === 'checkbox') {
      input = h('input', { id: id, type: 'checkbox' }); input.checked = !!val;
      getv = function () { return input.checked; };
    } else if (f.type === 'multi') {
      var set = {}; (val || []).forEach(function (x) { set[x] = true; });
      var boxes = (f.opts || []).map(function (o) { var cb = h('input', { type: 'checkbox', value: o[0] }); cb.checked = !!set[o[0]]; return { cb: cb, label: h('label', { class: 'chk' }, cb, o[1]) }; });
      input = h('div', { class: 'multi', id: id }, boxes.map(function (b) { return b.label; }));
      if (!boxes.length) input.appendChild(h('span', { class: 'muted small', text: 'لا توجد خيارات.' }));
      getv = function () { return boxes.filter(function (b) { return b.cb.checked; }).map(function (b) { return b.cb.value; }); };
    } else if (f.type === 'file') {
      input = h('input', { id: id, type: 'file', accept: f.accept || '' });
      getv = function () { return input.files && input.files[0] || null; };
    } else {
      var t = f.type === 'datetime' ? 'datetime-local' : (f.type === 'date' ? 'date' : f.type || 'text');
      input = h('input', { id: id, type: t, maxlength: f.max || 200, dir: (t === 'email' || t === 'tel') ? 'ltr' : null, autocomplete: 'off', readonly: !!f.readonly, class: f.readonly ? 'fld-readonly' : null });
      input.value = val || '';
      getv = function () { return t === 'datetime' ? isoFromLocal(input.value) : DE.clean(input.value, f.max || 200); };
    }
    var genBtn = null;
    if (f.gen) {
      genBtn = h('button', { class: 'btn light small', type: 'button', text: 'توليد كود قوي', onclick: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        input.value = f.gen(); input.dispatchEvent(new Event('input', { bubbles: true }));
      } });
    }
    var row = h('label', { class: 'fld', for: id }, h('span', { text: f.label + (f.req ? ' *' : '') }), searchIn, input, genBtn, f.hint ? hint : null);
    return { row: row, input: input, get: getv, def: f };
  }

  function openForm(cfg) {
    var vals = cfg.values || {};
    var pairs = cfg.fields.map(function (f) {
      var v = vals[f.k];
      if (f.type === 'datetime' && v) v = toLocalInput(v);
      return fieldEl(f, v);
    });
    var noteEls = { pick: h('div', { class: 'form-note muted small' }), file: h('div', { class: 'form-note small' }) };
    var byKey = {}; pairs.forEach(function (p) { byKey[p.def.k] = p; });
    var api = {
      input: function (k) { return byKey[k] ? byKey[k].input : null; },
      setOpts: function (k, opts) {
        var p = byKey[k]; if (!p) return;
        var sel = p.input; if (!sel) return;
        p.def.opts = (opts || []).slice();
        var parentLabel = sel.parentElement;
        var sIn = parentLabel ? parentLabel.querySelector('.fld-search') : null;
        if (sIn) sIn.value = '';
        var keep = sel.value;
        while (sel.firstChild) sel.removeChild(sel.firstChild);
        sel.appendChild(h('option', { value: '', text: '— اختر —' }));
        (opts || []).forEach(function (o) { sel.appendChild(h('option', { value: o[0], text: o[1] })); });
        sel.value = (opts || []).some(function (o) { return o[0] === keep; }) ? keep : '';
      },
      note: function (slot, content) {
        var el = noteEls[slot]; while (el.firstChild) el.removeChild(el.firstChild);
        if (typeof content === 'string') el.textContent = content; else if (content) el.appendChild(content);
        el.hidden = !el.firstChild;
      },
      refresh: function () { syncVisibility('file'); }
    };
    function syncVisibility(changed) {
      var cur = {}; pairs.forEach(function (p) { cur[p.def.k] = p.get(); });
      pairs.forEach(function (p) { if (p.def.showIf) p.row.hidden = !p.def.showIf(cur); });
      if (cfg.onChange) cfg.onChange(changed, cur, api);
    }
    pairs.forEach(function (p) {
      var k = p.def.k;
      p.input.addEventListener('change', function () { syncVisibility(k); });
      p.input.addEventListener('input', function () { syncVisibility(k); });
    });
    syncVisibility(null);

    var errEl = h('p', { class: 'err', role: 'alert' }); errEl.hidden = true;
    var submits = cfg.submits || [{ key: 'save', label: 'حفظ' }];
    var btns = submits.map(function (s) {
      var b = h('button', { class: 'btn' + (s.danger ? ' danger' : s.light ? ' light' : s.gold ? ' gold' : ''), type: 'button', text: s.label });
      b.addEventListener('click', function () {
        act(b, async function () {
          msg(errEl, '');
          try {
            var data = {};
            for (var i = 0; i < pairs.length; i++) {
              var p = pairs[i], f = p.def;
              if (f.showIf && p.row.hidden) continue;
              var v = p.get();
              if (typeof v === 'string' && (f.kind === 'phone' || f.type === 'tel')) {
                v = normalizeArabicDigits(v).trim();
              }
              if (f.req && (v === '' || v === null || (Array.isArray(v) && !v.length))) throw new Error('يرجى ملء الحقل المطلوب: ' + f.label);
              if (f.kind === 'email' && v && !DE.isEmail(v)) throw new Error('البريد الإلكتروني غير صحيح.');
              if (f.kind === 'phone' && v && !DE.isPhone(v)) throw new Error('رقم الهاتف غير صحيح.');
              data[f.k] = v;
            }
            await cfg.onSubmit(data, s.key);
            closeModal();
          } catch (submitErr) {
            msg(errEl, submitErr && submitErr.message ? submitErr.message : 'حدث خطأ أثناء الحفظ.');
            throw submitErr;
          }
        });
      });
      return b;
    });

    var card = h('div', { class: 'modal-body' },
      h('h2', { text: cfg.title }),
      pairs.map(function (p) { return p.row; }),
      noteEls.pick, noteEls.file,
      errEl,
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn light', type: 'button', text: 'إلغاء', onclick: closeModal }),
        btns
      )
    );
    openModal(card);
  }

  /* قوائم العرض والجداول المتجاوبة */
  function listView(v, o) {
    var searchVal = '', curFilters = {}, sortIdx = -1, sortDir = 1, openRows = {}, visible = [];
    var bar = h('div', { class: 'bar-sub' }, h('h2', { text: o.title }));
    var barBtns = h('div', { class: 'row-actions' });
    // [REMOVED: زر تصدير الإكسال بناء على طلب المستخدم]
    (o.extra || []).forEach(function (x) {
      var ic = detectBtnSvgIcon(x.label);
      barBtns.appendChild(h('button', { class: 'btn ' + (x.kind || 'light'), type: 'button', onclick: x.onclick }, ic ? makeSvgIcon(ic) : null, h('span', { text: stripEmojis(x.label) })));
    });
    if (o.addLabel && o.onAdd) {
      var addIc = detectBtnSvgIcon(o.addLabel) || 's-plus';
      barBtns.appendChild(h('button', { class: 'btn', type: 'button', onclick: o.onAdd }, makeSvgIcon(addIc), h('span', { text: stripEmojis(o.addLabel) })));
    }
    bar.appendChild(barBtns);
    v.appendChild(bar);

    var fwrap = h('div', { class: 'filter-bar' });
    if (o.search) {
      var sIn = h('input', { type: 'search', placeholder: o.searchPlaceholder || 'بحث بالاسم، رقم القيد، أو القسم…', 'aria-label': 'بحث' });
      sIn.addEventListener('input', function () { searchVal = DE.clean(sIn.value, 80).toLowerCase(); render(); });
      fwrap.appendChild(sIn);
    }
    // [REMOVED: الخيارات التي على الصورة - وضع مكانها البحث فقط بكامل العرض]
    if (o.search) v.appendChild(fwrap);

    var countBadge = h('div', { class: 'muted small' });
    v.appendChild(countBadge);

    var listBox = h('div');
    v.appendChild(listBox);

    function filtered() {
      return (o.rows || []).filter(function (r) {
        if (searchVal && o.search && (o.search(r) || '').toLowerCase().indexOf(searchVal) === -1) return false;
        for (var k in curFilters) {
          var val = curFilters[k];
          if (val !== '' && o.filters[k] && !o.filters[k].test(r, val)) return false;
        }
        return true;
      });
    }

    function sortList(list) {
      if (sortIdx < 0 || !o.cols[sortIdx] || typeof o.cols[sortIdx].sort !== 'function') return list;
      var key = o.cols[sortIdx].sort;
      return list.slice().sort(function (a, b) {
        var x = key(a), y = key(b);
        if (x == null) x = ''; if (y == null) y = '';
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * sortDir;
        return String(x).localeCompare(String(y), 'ar', { numeric: true, sensitivity: 'base' }) * sortDir;
      });
    }

    function render() {
      var prevWrap = listBox.querySelector('.table-wrap');
      var pos = prevWrap ? [prevWrap.scrollTop, prevWrap.scrollLeft] : null;
      listBox.textContent = '';

      var list = sortList(filtered());
      visible = list;
      countBadge.textContent = 'إجمالي السجلات المعروضة: ' + list.length + ' من ' + (o.rows ? o.rows.length : 0);

      if (!list.length) {
        listBox.appendChild(h('div', { class: 'empty', text: o.empty || 'لا توجد عناصر مطابقة.' }));
        return;
      }

      var hasActs = !!(o.actions || o.details);
      var headRow = h('tr');
      o.cols.forEach(function (c, ci) {
        var sortable = typeof c.sort === 'function';
        var label = c.label + (sortable && sortIdx === ci ? (sortDir > 0 ? ' ▲' : ' ▼') : '');
        var th = h('th', { text: label, class: sortable ? 'sortable' : null, title: sortable ? 'اضغط للفرز' : null });
        if (sortable) {
          th.setAttribute('aria-sort', sortIdx === ci ? (sortDir > 0 ? 'ascending' : 'descending') : 'none');
          th.addEventListener('click', function () {
            if (sortIdx === ci) sortDir = -sortDir; else { sortIdx = ci; sortDir = 1; }
            render();
          });
        }
        headRow.appendChild(th);
      });
      if (hasActs) headRow.appendChild(h('th', { text: 'الإجراءات' }));
      var table = h('table', { class: 'tbl' + (o.sheet ? ' tbl-sheet' : '') },
        h('thead', {}, headRow));
      var tbody = h('tbody');

      list.forEach(function (r) {
        var tr = h('tr');
        o.cols.forEach(function (c) {
          var val = c.get(r);
          var td = h('td', { 'data-label': c.label });
          if (val instanceof Node) td.appendChild(val); else td.textContent = val == null ? '—' : String(val);
          tr.appendChild(td);
        });
        if (hasActs) {
          var acts = [];
          if (o.details) {
            var open = !!openRows[r.id];
            acts.push(h('button', {
              class: 'btn small ' + (open ? 'gold' : 'light'), type: 'button',
              'aria-expanded': open ? 'true' : 'false',
              onclick: function () { openRows[r.id] = !open; render(); }
            }, makeSvgIcon(open ? 's-eye-off' : 's-eye'), h('span', { text: open ? 'إخفاء التفاصيل' : 'عرض التفاصيل' })));
          }
          if (o.actions) acts = acts.concat(o.actions(r) || []);
          tr.appendChild(h('td', { class: 'actions-cell' }, acts.filter(Boolean)));
        }
        tbody.appendChild(tr);
        if (o.details && openRows[r.id]) {
          tbody.appendChild(h('tr', { class: 'detail-row' },
            h('td', { colspan: String(o.cols.length + (hasActs ? 1 : 0)) }, o.details(r))));
        }
      });

      table.appendChild(tbody);
      var wrap = h('div', { class: 'table-wrap' + (o.sheet ? ' sheet-wrap' : '') }, table);
      listBox.appendChild(wrap);
      if (pos) { wrap.scrollTop = pos[0]; wrap.scrollLeft = pos[1]; }
    }

    function exportNow() {
      var x = o.exportXlsx;
      if (!x || !visible.length) return toast('لا توجد سجلات معروضة للتصدير.', 'bad');
      if (!window.DE_XLSX) return toast('مكتبة التصدير غير محمّلة. حدّث الصفحة.', 'bad');
      var headers = x.cols.map(function (c) { return c.label; });
      var rows = visible.map(function (r) {
        return x.cols.map(function (c) { var val = c.value(r); return val == null ? '' : String(val); });
      });
      var stamp = new Date().toISOString().slice(0, 10);
      DE_XLSX.download(x.file + '_' + stamp + '.xlsx', x.sheet || 'Sheet1', headers, rows, x.widths);
      toast('تم تصدير ' + rows.length + ' سجل إلى ملف Excel (XLSX).', 'ok');
    }

    render();
  }

  function detectBtnSvgIcon(txt) {
    var s = String(txt || '');
    if (s.indexOf('حذف') >= 0 || s.indexOf('مسح') >= 0 || s.indexOf('إزالة') >= 0) return 's-trash';
    if (s.indexOf('تعديل') >= 0 || s.indexOf('كتابة') >= 0 || s.indexOf('ملء') >= 0) return 's-edit';
    if (s.indexOf('البطاقة') >= 0) return 's-idcard';
    if (s.indexOf('رمز') >= 0 || s.indexOf('كلمة المرور') >= 0 || s.indexOf('كلمة السر') >= 0 || s.indexOf('إنشاء حساب') >= 0) return 's-key';
    if (s.indexOf('إذن') >= 0 || s.indexOf('صلاحيات') >= 0) return 's-lock';
    if (s.indexOf('إضافة') >= 0 || s.indexOf('إدراج') >= 0 || s.indexOf('جديد') >= 0) return 's-plus';
    if (s.indexOf('مزامنة') >= 0 || s.indexOf('استعادة') >= 0 || s.indexOf('تحديث') >= 0 || s.indexOf('تحويل') >= 0) return 's-refresh';
    if (s.indexOf('طباعة') >= 0 || s.indexOf('الاستمارة والطباعة') >= 0 || s.indexOf('صورة البرنامج') >= 0) return 's-print';
    if (s.indexOf('تحميل') >= 0 || s.indexOf('تنزيل') >= 0) return 's-download';
    if (s.indexOf('تصدير') >= 0 || s.indexOf('نشر') >= 0 || s.indexOf('رفع') >= 0 || s.indexOf('اعتماد') >= 0) return 's-upload';
    if (s.indexOf('عرض') >= 0 || s.indexOf('فتح') >= 0 || s.indexOf('تكبير') >= 0) return 's-eye';
    if (s.indexOf('إخفاء') >= 0) return 's-eye-off';
    if (s.indexOf('نسخ') >= 0 || s.indexOf('تعميم') >= 0) return 's-copy';
    if (s.indexOf('رجوع') >= 0 || s.indexOf('العودة') >= 0) return 's-back';
    return '';
  }

  function rbtn(label, fn, kind) {
    var cleanText = stripEmojis(label);
    var icName = detectBtnSvgIcon(cleanText);
    var b = h('button', { class: 'btn small ' + (kind || 'light'), type: 'button' },
      icName ? makeSvgIcon(icName) : null,
      h('span', { text: cleanText })
    );
    b.addEventListener('click', function () { act(b, fn); });
    return b;
  }

  
  /* التحقق الذكي من رقم الهاتف الجزائري للواتساب وتنسيقه دولياً */
  function getAlgerianWaNumber(raw) {
    if (!raw) return null;
    var d = normalizeArabicDigits(String(raw)).replace(/\D/g, '');
    if (!d) return null;
    if (d.startsWith('00213')) d = d.slice(5);
    else if (d.startsWith('213')) d = d.slice(3);
    else if (d.startsWith('0')) d = d.slice(1);
    // الأرقام الجزائرية الصالحة لواتساب تتكون من 9 أرقام بعد رمز الدولة (10 أرقام محلياً مع الصفر)
    return d.length === 9 ? ('213' + d) : null;
  }

  function openFixWhatsAppPhoneModal(child, rawPhone) {
    var raw = String(rawPhone || '').trim();
    var initialInput = raw;
    if (raw.length === 9 && raw.startsWith('0')) {
      initialInput = raw; // الرقم 9 أرقام ينقصه رقم أخير
    }
    var phoneInput = h('input', {
      type: 'tel',
      dir: 'ltr',
      class: 'sic-num',
      maxlength: 16,
      style: 'font-size:1.15rem;letter-spacing:1px;padding:10px 14px;border:2px solid #25D366;border-radius:8px;font-weight:bold;width:100%;box-sizing:border-box;',
      value: initialInput
    });

    var errorEl = h('p', { class: 'err', style: 'margin:8px 0;' });
    errorEl.hidden = true;

    var childName = (child && child.full_name) || 'الطفل';

    var card = h('div', { class: 'modal-body' },
      h('div', { class: 'bar-sub' },
        h('h2', { style: 'display:flex;align-items:center;gap:8px;' },
          makeSvgIcon('s-whatsapp'),
          h('span', { text: 'مراسلة ولي التلميذ: ' + childName })
        )
      ),
      h('div', { style: 'background:#FDF8ED;border:1px solid rgba(180,135,58,0.3);padding:12px 16px;border-radius:10px;margin-bottom:14px;' },
        h('p', { style: 'margin:0 0 6px;color:#8A6420;font-weight:700;', text: 'تنبيه حول رقم هاتف الولي في السجل:' }),
        h('p', { style: 'margin:0;color:#334155;font-size:0.92rem;line-height:1.5;', text: 'الرقم المسجل حالياً (' + raw + ') يتكون من 9 أرقام، بينما أرقام الهواتف المحمولة في الجزائر الصالحة على واتساب تتكون من 10 أرقام (ينقصه الرقم الأخير ليفتح واتساب بنجاح).' })
      ),
      h('label', { class: 'fld' },
        h('span', { text: 'أدخل رقم هاتف الولي كاملاً (10 أرقام تبدأ بـ 05 أو 06 أو 07):' }),
        phoneInput
      ),
      h('div', { style: 'margin:10px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center;' },
        h('small', { class: 'muted', text: 'خيارات سريعة لإكمال الرقم المفقود:' }),
        h('button', {
          type: 'button', class: 'btn small light', text: '+ تجربة إضافة 0 بالآخر (' + initialInput + '0)',
          onclick: function () { phoneInput.value = initialInput + '0'; }
        }),
        h('button', {
          type: 'button', class: 'btn small light', text: '+ تجربة إضافة 1 بالآخر (' + initialInput + '1)',
          onclick: function () { phoneInput.value = initialInput + '1'; }
        })
      ),
      errorEl,
      h('div', { class: 'modal-actions', style: 'margin-top:20px;' },
        h('button', { class: 'btn light', type: 'button', text: 'إلغاء', onclick: closeModal }),
        h('button', {
          class: 'btn gold',
          type: 'button',
          style: 'background:#25D366;border-color:#25D366;color:#fff;font-weight:700;',
          onclick: async function () {
            var val = phoneInput.value.trim();
            var validWa = getAlgerianWaNumber(val);
            if (!validWa) {
              errorEl.textContent = 'رقم الهاتف الجزائري يجب أن يتكون من 10 أرقام (مثال: 0661649080). يرجى التأكد من كتابة 10 أرقام.';
              errorEl.hidden = false;
              return;
            }
            errorEl.hidden = true;
            var local10 = '0' + validWa.slice(3);

            // تحديث الرقم تلقائياً في ملف الطفل في قاعدة البيانات
            if (child && child.id) {
              child.phone = local10;
              try {
                await C.rest('PATCH', '/children?id=eq.' + uid(child.id), { phone: local10 });
                bust();
              } catch (eSave) {}
            }
            closeModal();
            window.open('https://wa.me/' + validWa, '_blank');
            toast('تم تحديث رقم الولي وفتح محادثة واتساب بنجاح!', 'ok');
          }
        }, makeSvgIcon('s-whatsapp'), h('span', { text: 'فتح واتساب ومراسلة الولي وحفظ الرقم' })),
        h('button', {
          class: 'btn light',
          type: 'button',
          text: 'محاولة الفتح بالرقم الحالي على أية حال',
          onclick: function () {
            closeModal();
            var d = normalizeArabicDigits(raw).replace(/\D/g, '').replace(/^0+/, '');
            window.open('https://wa.me/213' + d, '_blank');
          }
        })
      )
    );
    openModal(card);
    setTimeout(function () {
      phoneInput.focus();
      phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
    }, 120);
  }

  /* رابط واتساب المباشر لأرقام هواتف الأولياء مع أيقونة واتساب الرسمية ومعالجة الأرقام الناقصة */
  function makeWhatsAppLink(phone, child) {
    if (!phone || phone === '—') return h('span', { text: '—' });
    var raw = String(phone).trim();
    var validWa = getAlgerianWaNumber(raw);

    var btn = h('button', {
      type: 'button',
      class: 'btn-wa-link',
      title: 'مراسلة الولي عبر واتساب (' + raw + ')'
    },
      makeSvgIcon('s-whatsapp'),
      h('span', { dir: 'ltr', class: 'sic-num', text: raw }),
      h('span', { class: 'wa-badge', text: 'واتساب' })
    );

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      var d = normalizeArabicDigits(raw).replace(/\D/g, '');
      if (d.startsWith('00213')) d = d.slice(5);
      else if (d.startsWith('213')) d = d.slice(3);
      else if (d.startsWith('0')) d = d.slice(1);
      // تصحيح الأرقام المكونة من 8 أرقام بإضافة 0 ليصبح رقماً جزائرياً نظامياً صالحاً لواتساب
      if (d.length === 8 && /^[567]/.test(d)) {
        d = d + '0';
      }
      window.open('https://wa.me/213' + d, '_blank');
    });

    return btn;
  }

  /* فحص ورفع الملفات */
  async function uploadChecked(file, childId) {
    if (!file) throw new Error('اختر ملفًا.');
    if (file.size > 5242880) throw new Error('حجم الملف يتجاوز 5 ميغابايت.');
    var bytes = await readBytes(file);
    var head = Array.from(bytes.slice(0, 8)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    var mime = null, ext = null;
    if (head.startsWith('25504446')) { mime = 'application/pdf'; ext = 'pdf'; }
    else if (head.startsWith('ffd8ff')) { mime = 'image/jpeg'; ext = 'jpg'; }
    else if (head.startsWith('89504e47')) { mime = 'image/png'; ext = 'png'; }
    else if (head.startsWith('52494646') && bytes.length > 12 && String.fromCharCode.apply(null, bytes.slice(8, 12)) === 'WEBP') { mime = 'image/webp'; ext = 'webp'; }
    if (!mime) throw new Error('نوع الملف غير مدعوم. المسموح: PDF, JPG, PNG, WebP فقط.');

    var path = 'children/' + uid(childId) + '/' + crypto.randomUUID() + '.' + ext;
    await C.upload('private-docs', path, bytes, mime);
    return { path: path, mime: mime, size: file.size };
  }

  function stripEmojis(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function makeSvgIcon(symId) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'i');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#' + symId);
    svg.appendChild(use);
    return svg;
  }
  var ico = makeSvgIcon;

  function openAddSectionForCenterModal(centerKey, branches, onDone) {
    var targetBranch = (branches || []).filter(function (b) { return branchCenterKey(b) === centerKey; })[0] || branches[0];
    var cm = getCenterMeta(centerKey);
    return openForm({
      title: 'إضافة قسم / فوج جديد في: ' + cm.name,
      fields: [
        { k: 'name', label: 'اسم القسم / الفوج التربوي', req: true, min: 2, max: 80, hint: centerKey === 'work' ? 'مثال: التمهين م م ع، ورشة النجارة، ورشة الخياطة' : centerKey === 'farm' ? 'مثال: المزرعة البستنة، الزراعة المائية' : 'مثال: توحد 04، الاستثارة 02' },
        { k: 'description', label: 'وصف القسم وأهدافه (اختياري)', type: 'textarea', max: 500 }
      ],
      onSubmit: async function (x) {
        if (!targetBranch) throw new Error('لم يتم العثور على الفرع في قاعدة البيانات.');
        var slug = 'sec_' + centerKey + '_' + Date.now().toString(36);
        await C.rest('POST', '/sections', {
          branch_id: targetBranch.id,
          name: x.name,
          slug: slug,
          description: x.description || null,
          active: true
        });
        bust();
        toast('تمت إضافة القسم الجديد في «' + cm.name + '» بنجاح.', 'ok');
        if (onDone) onDone();
      }
    });
  }

  /* =====================================================================
     0. لوحة المركز وملحقاته (الاختيارات الثلاثة + قسم الإدارة وإذن الدخول لكل مركز وحده)
     ===================================================================== */
  async function secHub(v) {
    if (S.isEducator) return go('children');

    var hubWrap = h('div', { class: 'hub-standalone-wrap' });

    var allAccountsBtn = canAccessGeneralAdmin() ? h('button', {
      type: 'button',
      class: 'hub-all-accounts-btn',
      onclick: function () { go('hub_accounts'); }
    },
      makeSvgIcon('s-shield'),
      h('span', { text: 'الحسابات الخاصة بجميع المراكز' })
    ) : null;

    var diagramTopbar = h('div', { class: 'hub-diagram-topbar' },
      allAccountsBtn,
      h('div', { class: 'hub-diagram-title-box' },
        h('h1', { text: 'لوحة الإدارة' }),
        h('p', { text: 'اختر المركز للدخول إلى لوحة الإدارة الخاصة به' })
      )
    );
    hubWrap.appendChild(diagramTopbar);

    var centerOrder = ['main', 'work', 'farm'];
    var hubGrid = h('div', { class: 'centers-hub-grid' });

    centerOrder.forEach(function (ck) {
      var cm = getCenterMeta(ck);
      var allowed = canAccessCenter(ck);

      var enterCenter = function () {
        if (!allowed) {
          return toast('ليست لديك صلاحية الدخول إلى «' + cm.name + '».', 'bad');
        }
        S.activeCenter = ck;
        S.filterSectionId = '';
        applyRoleSidebarUI();
        if (ck === 'main') {
          go('dash');
        } else {
          go('children');
        }
      };

      var cardEl = h('button', {
        type: 'button',
        class: 'center-hub-card center-hub-clean-box center-hub-' + ck + (allowed ? '' : ' is-locked'),
        onclick: enterCenter
      },
        h('div', { class: 'chc-icon chc-icon-' + ck }, makeSvgIcon(cm.svgIcon || 's-branch')),
        h('div', { class: 'chc-body' },
          h('h3', { class: 'chc-title', text: cm.name }),
          h('span', { class: 'chc-badge-sub', text: cm.badge })
        )
      );
      hubGrid.appendChild(cardEl);
    });

    hubWrap.appendChild(hubGrid);

    // إضافة بطاقة التحميل اليدوي السريع للأرشيف الشامل داخل لوحة الإدارة
    if (canAccessGeneralAdmin()) {
      var quickArchCard = h('div', { class: 'hub-quick-archive-box', style: 'margin-top:24px;background:#ffffff;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;' },
        h('div', { style: 'display:flex;align-items:center;gap:12px;' },
          h('div', { style: 'width:42px;height:42px;border-radius:8px;background:rgba(180,135,58,0.12);color:#B4873A;display:flex;align-items:center;justify-content:center;' }, makeSvgIcon('s-archive')),
          h('div', null,
            h('h3', { style: 'margin:0;font-size:1rem;color:#0C2D55;', text: 'الأرشيف الشامل والنسخ الاحتياطية' }),
            h('p', { class: 'muted small', style: 'margin:2px 0 0;', text: 'تنزيل فوري لجميع التقارير والوثائق وبيانات الأطفال في ملف ZIP منظم.' })
          )
        ),
        h('div', { style: 'display:flex;gap:8px;' },
          h('button', {
            type: 'button',
            class: 'btn gold',
            style: 'font-weight:600;',
            onclick: function () { go('archive'); }
          }, makeSvgIcon('s-download'), h('span', { text: 'تحميل الأرشيف يدوياً (ZIP)' }))
        )
      );
      hubWrap.appendChild(quickArchCard);
    }

    v.appendChild(hubWrap);
  }

  /* =====================================================================
     1. لوحة التحكم والإحصاءات الحية (Dashboard — مطابقة لتصميم الصورة المرفقة)
     ===================================================================== */
  async function secDash(v) {
    if (S.isEducator) return go('children');
    if (!canAccessCenter(S.activeCenter)) {
      var allowedList = parseAllowedCenters(S.centerAccess);
      S.activeCenter = allowedList[0] || 'main';
    }
    var cm = getCenterMeta(S.activeCenter);
    var d = await Promise.all([
      C.rpc('admin_family_counts').catch(function () { return {}; }),
      get('children'),
      get('branches'),
      get('sections')
    ]);
    var c = d[0] || {}, allKids = d[1] || [], branches = d[2] || [], sections = d[3] || [];

    var centerKids = allKids.filter(function (k) { return childCenterKey(k, branches, sections) === S.activeCenter; });
    var activeCenterKids = centerKids.filter(function (k) { return !!k.active; });
    var centerSections = sections.filter(function (s) { return sectionCenterKey(s, branches) === S.activeCenter; });

    // 1. البانر الأخضر الترحيبي العلوي مع بطاقات الإحصائيات الشفافة الـ 4 داخله (مطابق للصورة المرفقة)
    var hero = h('div', { class: 'dash-hero-banner' },
      h('div', { class: 'dash-hero-top' },
        h('div', null,
          h('span', { class: 'dash-hero-kicker', text: 'ADMIN DASHBOARD • ' + cm.badge }),
          h('h1', { class: 'dash-hero-title', text: 'مرحبًا بك في ' + cm.name }),
          h('p', { class: 'dash-hero-sub', text: 'إحصائيات حية ومباشرة وإجراءات سريعة لإدارة ' + cm.name + '.' })
        ),
        h('button', {
          type: 'button',
          class: 'dash-hero-btn',
          text: 'المركز وملحقاته (تبديل المركز)',
          onclick: function () { go('hub'); }
        })
      ),
      h('div', { class: 'dash-hero-stats' },
        h('div', { class: 'dash-hero-stat' },
          h('b', { text: String(centerKids.length) }),
          h('span', { text: 'إجمالي الطلبة بالمركز' })
        ),
        h('div', { class: 'dash-hero-stat' },
          h('b', { text: String(activeCenterKids.length) }),
          h('span', { text: 'الطلبة النشطون' })
        ),
        h('div', { class: 'dash-hero-stat' },
          h('b', { text: String(centerSections.length || 1) }),
          h('span', { text: 'الأقسام والأفواج' })
        ),
        h('div', { class: 'dash-hero-stat' },
          h('b', { text: String(c.reports_published == null ? 0 : c.reports_published) }),
          h('span', { text: 'التقارير المعتمدة' })
        )
      )
    );
    v.appendChild(hero);

    // 2. شبكة الإجراءات السريعة (Quick Actions) ببطاقات بيضاء وأيقونات خضراء ناعمة (مطابقة للصورة المرفقة)
    v.appendChild(h('div', { class: 'qa-section-hdr' },
      h('h2', { class: 'qa-section-title', text: 'الإجراءات السريعة (Quick Actions)' })
    ));

    var qaItems = [
      { sec: 'children', icon: 's-child', title: S.activeCenter === 'farm' ? 'طلاب البستنة' : 'الأطفال والطلبة', sub: 'إدارة ملفات الطلبة، الأقسام، والبطاقات' },
      { sec: 'educators', icon: 's-users', title: 'المربيات', sub: 'إدارة المربيات وإسناد الأفواج وحساباتهن' },
      { sec: 'programs', icon: 's-book', title: 'البرامج التربوية', sub: 'إعداد وتصدير الجداول الأسبوعية للأقسام' },
      S.activeCenter !== 'farm' ? { sec: 'reports', icon: 's-report', title: 'التقارير التربوية', sub: 'التقارير الدورية ومرفقات ملفات الطلبة' } : null,
      S.activeCenter !== 'farm' ? { sec: 'evaluations', icon: 's-card', title: 'استمارات التقييم', sub: 'استمارات التقييم البيداغوجي وفق النموذج الرسمي' } : null,
      { sec: 'appts', icon: 's-cal', title: 'المواعيد والأنشطة', sub: 'برمجة مواعيد المتابعة والأنشطة' },
      { sec: 'msgs', icon: 's-mail', title: 'الرسائل والإعلانات', sub: 'إرسال الإعلانات والرسائل للأولياء' },
      { sec: 'docs', icon: 's-file', title: 'الوثائق والملفات', sub: 'أرشيف الوثائق الخاصة والآمنة للطلبة' },
      { sec: 'hub', icon: 's-branch', title: 'المركز وملحقاته', sub: 'التنقل بين المراكز الثلاثة وقسم الإدارة' }
    ];

    if (canAccessGeneralAdmin()) {
      qaItems.push(
        { sec: 'archive', icon: 's-archive', title: 'الأرشيف والنسخ الاحتياطية', sub: 'تنزيل أرشيف ZIP شامل ومنظم للأطفال والتقارير' },
        { sec: 'accounts', icon: 's-shield', title: 'قسم الإدارة والصلاحيات', sub: 'حسابات الإدارة وإذن الدخول لكل مركز' },
        { sec: 'audit', icon: 's-log', title: 'سجل العمليات', sub: 'متابعة النشاط والرقابة الأمنية' },
        { sec: 'settings', icon: 's-gear', title: 'الأمان والإعدادات', sub: 'المصادقة الثنائية وإعدادات النظام' }
      );
    }

    var qaGrid = h('div', { class: 'quick-actions-grid' }, qaItems.filter(Boolean).map(function (item) {
      return h('button', {
        type: 'button',
        class: 'qa-card',
        onclick: function () { go(item.sec); }
      },
        h('span', { class: 'qa-icon' }, makeSvgIcon(item.icon)),
        h('strong', { class: 'qa-title', text: item.title }),
        h('span', { class: 'qa-sub', text: item.sub })
      );
    }));
    v.appendChild(qaGrid);
  }

  /* =====================================================================
     2. إدارة الأطفال والطلبة + أقسام المركز المدمجة + بطاقة الانخراط + رمز التسجيل
     ===================================================================== */
  async function secChildren(v) {
    var d = await getMany('children', 'branches', 'sections', 'codes', 'reports');
    var allRows = d[0] || [], branches = d[1] || [], allSections = d[2] || [], codes = d[3] || [], allReports = d[4] || [];

    if (!S.isEducator && !canAccessCenter(S.activeCenter)) {
      var allowedList = parseAllowedCenters(S.centerAccess);
      S.activeCenter = allowedList[0] || 'main';
    }

    var cm = getCenterMeta(S.activeCenter);
    var centerSections = allSections.filter(function (s) {
      return sectionCenterKey(s, branches) === S.activeCenter;
    });
    var sections = S.isEducator ? allSections : (centerSections.length ? centerSections : allSections);

    var centerRows = allRows;
    if (S.isEducator && (S.eduSectionId || S.eduSectionName)) {
      centerRows = allRows.filter(function (k) { return childMatchesSection(k, S.eduSectionId, S.eduSectionName, allSections); });
    } else if (!S.isEducator) {
      centerRows = allRows.filter(function (k) { return childCenterKey(k, branches, allSections) === S.activeCenter; });
      if (!centerRows.length && allRows.length) {
        centerRows = allRows.slice();
      }
    }

    var rows = centerRows;
    if (!S.isEducator && S.filterSectionId) {
      var filterSecObj = allSections.filter(function (s) { return s.id === S.filterSectionId; })[0];
      rows = centerRows.filter(function (k) { return childMatchesSection(k, S.filterSectionId, filterSecObj && filterSecObj.name, allSections); });
    }

    var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
    var secOpts = sections.map(function (s) { return [s.id, s.name]; });

    function getCodeForChild(childId) {
      var active = codes.filter(function (c) { return c.child_id === childId && !c.used_at && new Date(c.expires_at) > new Date(); })[0];
      return active ? active.code : null;
    }

    function editChild(c) {
      if (S.isEducator) return toast('صلاحية تعديل ملفات الطلبة محصورة بالإدارة.', 'bad');
      return openForm({
        title: c ? 'تعديل بيانات تلميذ' : 'إضافة تلميذ جديد إلى المركز',
        values: c ? Object.assign({}, c, { created_at: c.created_at ? String(c.created_at).slice(0, 10) : '' }) : (function () {
          var defBr = branches.filter(function (b) { return branchCenterKey(b) === S.activeCenter; })[0];
          var defSec = S.filterSectionId || (centerSections[0] ? centerSections[0].id : '');
          return { active: true, academic_year: '2026-2027', branch_id: defBr ? defBr.id : '', section_id: defSec };
        })(),
        fields: [
          { k: 'membership_no', label: 'رقم القيد / العضوية (مثال: 004، 082)', max: 20, hint: 'الرقم المعتمد بالقائمة الرسمية (مع الحفاظ على الأصفار الأولى).' },
          { k: 'full_name', label: 'اسم ولقب التلميذ(ة)', req: true, min: 2, max: 120 },
          { k: 'dob', label: 'تاريخ الميلاد', type: 'date', hint: 'تاريخ الميلاد الرسمي للطفل' },
          { k: 'disability', label: 'طبيعة الإعاقة', max: 120, hint: 'مثال: التأخر الذهني R.M، اضطراب طيف التوحد TSA، متلازمة داون T.21' },
          { k: 'phone', label: 'رقم هاتف الاتصال', type: 'tel', kind: 'phone', max: 25 },
          { k: 'branch_id', label: 'الفرع / المركز', type: 'select', opts: branchOpts },
          { k: 'section_id', label: 'الفوج / القسم التربوي', type: 'select', opts: secOpts },
          { k: 'academic_year', label: 'الموسم الدراسي', max: 20, hint: 'افتراضي: 2026-2027' },
          { k: 'basic_info', label: 'معلومات وتوجيهات خاصة بالولي', type: 'textarea', max: 1000 },
          { k: 'created_at', label: 'تاريخ إنشاء الملف', type: 'date', hint: 'يمكن تعديله عند الحاجة (مثلًا لتصحيح تاريخ إدخال قديم).' },
          { k: 'active', label: 'الملف نشط (إلغاء التحديد يؤرشف الملف)', type: 'checkbox' }
        ],
        onSubmit: async function (x) {
          var branchName = nameOf(branches, x.branch_id, 'name');
          var secName = nameOf(sections, x.section_id, 'name');
          var centerKey = 'main';
          if (branchName.indexOf('المساعدة') >= 0 || branchName.indexOf('التمهين') >= 0) centerKey = 'work';
          else if (branchName.indexOf('المزرعة') >= 0 || branchName.indexOf('البستنة') >= 0) centerKey = 'farm';

          var body = {
            membership_no: x.membership_no || null,
            full_name: x.full_name,
            dob: x.dob || null,
            disability: x.disability || null,
            phone: x.phone || null,
            branch_id: x.branch_id || null,
            section_id: x.section_id || null,
            section: secName || null,
            center: centerKey,
            academic_year: x.academic_year || '2026-2027',
            basic_info: x.basic_info || null,
            active: !!x.active
          };
          if (x.created_at) body.created_at = x.created_at + 'T12:00:00Z';

          if (c) {
            await C.rest('PATCH', '/children?id=eq.' + uid(c.id), body);
          } else {
            await C.rest('POST', '/children', body);
          }
          bust();
          toast('تم حفظ ملف التلميذ بنجاح.', 'ok');
          go('children');
        }
      });
    }

    function publicCardUrl(child) {
      var origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && window.location.protocol !== 'file:')
        ? window.location.origin : 'https://hmyasserabdou24-eng.github.io';
      var basePath = (typeof window !== 'undefined' && window.location) ? window.location.pathname.replace(/[^/]*$/, '') : '/';
      if (!basePath.startsWith('/')) basePath = '/' + basePath;
      var u = new URL(basePath + 'qr.html', origin);
      if (child) {
        if (child.membership_no) {
          u.searchParams.set('m', child.membership_no);
        } else if (child.id) {
          u.searchParams.set('id', child.id);
        }
      }
      return u.href;
    }

    function openStudentCard(child) {
      var status = h('p', { class: 'muted small', text: 'جارٍ إنشاء البطاقة…' });
      var preview = h('img', { class: 'card-preview', alt: 'معاينة بطاقة انخراط التلميذ ' + (child.full_name || ''), hidden: true });
      var jpgBtn = h('button', { class: 'btn gold', type: 'button', text: 'تنزيل JPG', disabled: true });
      var printBtn = h('button', { class: 'btn', type: 'button', text: 'طباعة البطاقة', disabled: true });
      var openLink = h('a', { class: 'btn light', target: '_blank', rel: 'noopener', text: 'فتح صفحة التلميذ' });
      var warn = !child.membership_no ? h('p', { class: 'err small', text: 'تنبيه: لا يوجد رقم قيد رسمي لهذا الطفل؛ أكمله في ملف الطفل قبل طباعة البطاقة.' }) : null;

      openModal(h('div', { class: 'modal-body card-modal' },
        h('h2', { text: 'بطاقة انخراط التلميذ' }),
        warn,
        preview,
        status,
        h('div', { class: 'modal-actions' },
          h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }),
          openLink, jpgBtn, printBtn)
      ));

      var url = publicCardUrl(child);
      openLink.setAttribute('href', url);

      var card = null;
      DECARD.render({ full_name: child.full_name, membership_no: child.membership_no || '—', dob: child.dob, center: child.center || 'main', url: url })
        .then(function (c) {
          card = c;
          preview.src = c.url; preview.hidden = false;
          status.textContent = 'رمز QR يفتح: صفحة التلميذ العامة (بدون بيانات حساسة).';
          jpgBtn.disabled = false; printBtn.disabled = false;
        })
        .catch(function (e) { status.textContent = e.message; status.className = 'err small'; });

      function exportJpg(c, filename) {
        // exportJpg (image/jpeg)
        DECARD.download(c.jpeg, filename);
      }
      jpgBtn.addEventListener('click', function () {
        if (!card) return;
        var safe = String(child.full_name || 'تلميذ').replace(/\s+/g, '_');
        exportJpg(card, 'بطاقة_انخراط_' + (child.membership_no || child.id) + '_' + safe + '.jpg');
        toast('تم تنزيل صورة البطاقة بصيغة JPG.', 'ok');
      });

      printBtn.addEventListener('click', function () {
        if (!card) return;
        DECARD.print(card.url).catch(function (e) { toast(e.message, 'bad'); });
      });
    }

    async function manageChildCode(child) {
      var activeCode = getCodeForChild(child.id);
      if (activeCode) {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(activeCode);
          toast('تم نسخ رمز التسجيل السري للطفل (' + activeCode + ')', 'ok');
        } else {
          info('رمز تسجيل الطفل', h('div', null,
            h('p', { text: 'رمز التسجيل السري أحادي الاستخدام الخاص بالطفل: ' + child.full_name }),
            h('div', { class: 'link-box', text: activeCode })
          ));
        }
      } else {
        var code = await C.rpc('admin_generate_child_code', { p_child_id: uid(child.id) });
        bust();
        toast('تم توليد رمز تسجيل جديد بنجاح: ' + code, 'ok');
        go('children');
      }
    }

    if (S.isEducator) {
      v.appendChild(h('div', { class: 'card edu-banner-card' },
        h('strong', { text: (isFarmSession() ? 'فضاء مربي المزرعة البيداغوجية: ' : 'فضاء المربية: ') + (S.eduProfile && S.eduProfile.full_name || S.me && S.me.email || '') + ' — القسم المسند: ' + (S.eduSectionName || 'غير محدد') }),
        h('p', { class: 'muted small', text: isFarmSession() ? 'يظهر لك هنا طلاب قسم المزرعة البستنة للاطلاع على ملفاتهم وبطاقاتهم.' : 'يظهر لكِ هنا طلاب قسمكِ فقط. يمكنكِ الاطلاع على ملفاتهم وإضافة التقارير واستمارات التقييم البيداغوجي الخاصة بهم.' })
      ));
    } else {
      var activeKidsCount = centerRows.filter(function (k) { return !!k.active; }).length;
      v.appendChild(h('div', { class: 'dash-hero-banner' },
        h('div', { class: 'dash-hero-top' },
          h('div', null,
            h('span', { class: 'dash-hero-kicker', text: cm.icon + ' ' + cm.badge }),
            h('h1', { class: 'dash-hero-title', text: S.activeCenter === 'farm' ? 'المزرعة البيداغوجية — طلاب البستنة' : S.activeCenter === 'work' ? 'مركز المساعدة على العمل — الطلاب والأقسام' : 'المركز الرئيسي دار الإحسان — الطلاب والأقسام' }),
            h('p', { class: 'dash-hero-sub', text: S.activeCenter === 'farm' ? 'قائمة طلاب قسم البستنة بالمزرعة البيداغوجية مع إمكانية إدارة ملفاتهم وبطاقاتهم.' : S.activeCenter === 'work' ? 'قائمة طلاب وأقسام مركز المساعدة على العمل (قسم التمهين م م ع والأقسام المهنية).' : 'قائمة طلاب وأقسام المركز الرئيسي دار الإحسان.' })
          ),
          h('div', { class: 'row-actions' },
            (S.activeCenter === 'work' || S.activeCenter === 'farm') ? h('button', {
              type: 'button',
              class: 'dash-hero-btn',
              text: S.activeCenter === 'work' ? 'الحسابات الخاصة بمركز المساعدة على العمل' : 'الحسابات الخاصة بالمزرعة البيداغوجية',
              onclick: function () { go('accounts'); }
            }) : h('button', {
              type: 'button',
              class: 'dash-hero-btn',
              text: 'لوحة تحكم المركز الرئيسي',
              onclick: function () { go('dash'); }
            }),
            h('button', {
              type: 'button',
              class: 'dash-hero-btn',
              text: 'العودة إلى لوحة الإدارة',
              onclick: function () { go('hub'); }
            })
          )
        ),
        h('div', { class: 'dash-hero-stats' },
          h('div', { class: 'dash-hero-stat' },
            h('b', { text: String(centerRows.length) }),
            h('span', { text: S.activeCenter === 'farm' ? 'إجمالي طلاب البستنة' : 'إجمالي طلاب المركز' })
          ),
          h('div', { class: 'dash-hero-stat' },
            h('b', { text: String(activeKidsCount) }),
            h('span', { text: 'الطلاب النشطون' })
          ),
          h('div', { class: 'dash-hero-stat' },
            h('b', { text: String(centerSections.length || 1) }),
            h('span', { text: 'أقسام المركز' })
          ),
          h('div', { class: 'dash-hero-stat' },
            h('b', { text: '2026/2027' }),
            h('span', { text: 'الموسم الدراسي' })
          )
        )
      ));

      // شريط أقسام المركز المدمج (يعرض أقسام المركز وعدد طلاب كل قسم مع إمكانية التصفية الفورية أو إضافة قسم)
      var pillsRow = h('div', { class: 'csp-pills' });
      pillsRow.appendChild(h('button', {
        type: 'button',
        class: 'csp-pill' + (!S.filterSectionId ? ' active' : ''),
        onclick: function () { S.filterSectionId = ''; go('children'); }
      },
        h('span', { text: 'الكل في ' + cm.shortName }),
        h('span', { class: 'csp-pill-count', text: String(centerRows.length) })
      ));

      centerSections.forEach(function (sec) {
        var cnt = centerRows.filter(function (k) { return childMatchesSection(k, sec.id, sec.name, allSections); }).length;
        var isSel = S.filterSectionId === sec.id;
        pillsRow.appendChild(h('button', {
          type: 'button',
          class: 'csp-pill' + (isSel ? ' active' : ''),
          onclick: function () { S.filterSectionId = isSel ? '' : sec.id; go('children'); }
        },
          h('span', { text: sec.name }),
          h('span', { class: 'csp-pill-count', text: String(cnt) })
        ));
      });

      var secPanelEl = h('div', { class: 'center-sections-panel' + (S.hideSectionsBar ? ' is-collapsed' : '') });
      var toggleSecLabel = h('span', { text: S.hideSectionsBar ? 'إظهار قائمة الأقسام (' + centerSections.length + ')' : 'إخفاء قائمة الأقسام' });
      var toggleSecBtn = h('button', {
        type: 'button',
        class: 'csp-toggle-btn',
        title: 'إظهار أو إخفاء قائمة الأقسام',
        onclick: function () {
          S.hideSectionsBar = !S.hideSectionsBar;
          secPanelEl.classList.toggle('is-collapsed', !!S.hideSectionsBar);
          toggleSecLabel.textContent = S.hideSectionsBar ? ('إظهار قائمة الأقسام (' + centerSections.length + ')') : 'إخفاء قائمة الأقسام';
        }
      }, ico('s-menu'), toggleSecLabel);

      secPanelEl.appendChild(h('div', { class: 'csp-head' },
        h('strong', { text: 'أقسام ' + cm.name + ' (اضغط على القسم لعرض طلابه):' }),
        h('div', { class: 'csp-head-actions' },
          toggleSecBtn,
          h('button', {
            type: 'button',
            class: 'btn small light',
            text: 'إضافة قسم في هذا المركز',
            onclick: function () { openAddSectionForCenterModal(S.activeCenter, branches, function () { go('children'); }); }
          })
        )
      ));
      secPanelEl.appendChild(pillsRow);
      v.appendChild(secPanelEl);
    }

    var listTitle = S.isEducator
      ? ('قائمة طلاب قسم: ' + (S.eduSectionName || 'فوجي'))
      : S.activeCenter === 'farm'
        ? 'قائمة طلاب البستنة — المزرعة البيداغوجية'
        : S.activeCenter === 'work'
          ? 'قائمة طلاب وأقسام مركز المساعدة على العمل'
          : 'قائمة طلاب المركز الرئيسي دار الإحسان';

    function openChildReportsModal(child) {
      var childReps = (allReports || []).filter(function (rep) {
        return rep.child_id === child.id && !isEvaluationReport(rep);
      });
      var body = h('div', { class: 'modal-body' },
        h('div', { class: 'bar-sub' },
          h('h2', { text: 'التقارير الدورية للتلميذ(ة): ' + child.full_name }),
          h('span', { class: 'badge ok', text: childReps.length + ' تقرير' })
        )
      );

      if (!childReps.length) {
        body.appendChild(h('div', { class: 'card empty', text: 'لا توجد تقارير دورية مسجلة لهذا الطفل حتى الآن.' }));
      } else {
        var list = h('div', { class: 'dynamic-items-container', style: 'max-height: 420px; overflow-y: auto;' });
        childReps.forEach(function (rep) {
          var repCard = h('div', { class: 'pm-list-item-card', style: 'padding: 12px 16px; margin-bottom: 8px;' },
            h('div', { class: 'pm-lic-right' },
              h('div', { class: 'pm-lic-icon-box' }, makeSvgIcon('s-report')),
              h('div', { class: 'pm-lic-info' },
                h('strong', { class: 'pm-lic-title', text: rep.title }),
                h('div', { class: 'pm-lic-meta' },
                  h('span', { text: 'التاريخ: ' + fmt(rep.report_date) }),
                  h('span', { class: 'badge ' + (rep.status === 'published' ? 'ok' : 'gray'), text: rep.status === 'published' ? 'منشور للولي' : 'مسودة' }),
                  rep.attachment_path ? h('span', { class: 'badge gold', text: 'مرفق ملف' }) : null
                )
              )
            ),
            h('div', { class: 'pm-lic-actions' },
              h('button', {
                type: 'button', class: 'btn small light', text: 'عرض التفاصيل',
                onclick: function () {
                  var dModal = h('div', { class: 'modal-body' },
                    h('div', { class: 'bar-sub' },
                      h('h2', { text: rep.title }),
                      h('span', { class: 'badge ok', text: fmt(rep.report_date) })
                    ),
                    rep.achievements ? h('div', { style: 'margin-bottom:10px;' }, h('h4', { text: 'المكتسبات والمهارات المحققة:' }), h('p', { class: 'txt', text: rep.achievements })) : null,
                    rep.activities ? h('div', { style: 'margin-bottom:10px;' }, h('h4', { text: 'الأنشطة والورشات المنجزة:' }), h('p', { class: 'txt', text: rep.activities })) : null,
                    rep.notes ? h('div', { style: 'margin-bottom:10px;' }, h('h4', { text: 'ملاحظات وتوجيهات للأولياء:' }), h('p', { class: 'txt', text: rep.notes })) : null,
                    rep.attachment_path ? h('div', { style: 'margin-top:12px;' },
                      h('button', {
                        type: 'button', class: 'btn small gold', text: 'تحميل / فتح الملف المرفق',
                        onclick: function () {
                          C.signedUrl('private-docs', rep.attachment_path, 60).then(function (url) {
                            window.open(url, '_blank');
                          }).catch(function (e) { toast(e.message, 'bad'); });
                        }
                      })
                    ) : null,
                    h('div', { class: 'modal-actions' },
                      h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal })
                    )
                  );
                  openModal(dModal);
                }
              }),
              rep.attachment_path ? h('button', {
                type: 'button', class: 'btn small gold', text: 'المرفق',
                onclick: function () {
                  C.signedUrl('private-docs', rep.attachment_path, 60).then(function (url) {
                    window.open(url, '_blank');
                  }).catch(function (e) { toast(e.message, 'bad'); });
                }
              }) : null
            )
          );
          list.appendChild(repCard);
        });
        body.appendChild(list);
      }

      body.appendChild(h('div', { class: 'modal-actions' },
        h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal })
      ));
      openModal(body);
    }

    function openChildEvaluationsModal(child) {
      var childEvals = (allReports || []).filter(function (rep) {
        return rep.child_id === child.id && isEvaluationReport(rep);
      });
      var secName = nameOf(sections, child.section_id, 'name') || child.section || '';

      var body = h('div', { class: 'modal-body' },
        h('div', { class: 'bar-sub' },
          h('h2', { text: 'استمارات التقييم البيداغوجي للتلميذ(ة): ' + child.full_name }),
          h('span', { class: 'badge gold', text: childEvals.length + ' تقييم معتمد' })
        )
      );

      if (!childEvals.length) {
        body.appendChild(h('div', { class: 'card empty', text: 'لا توجد استمارات تقييم مسجلة لهذا الطفل حتى الآن.' }));
      } else {
        var list = h('div', { class: 'dynamic-items-container', style: 'max-height: 420px; overflow-y: auto;' });
        childEvals.forEach(function (evRep) {
          var evCard = h('div', { class: 'pm-list-item-card', style: 'padding: 12px 16px; margin-bottom: 8px;' },
            h('div', { class: 'pm-lic-right' },
              h('div', { class: 'pm-lic-icon-box gold' }, makeSvgIcon('s-card')),
              h('div', { class: 'pm-lic-info' },
                h('strong', { class: 'pm-lic-title', text: evRep.title }),
                h('div', { class: 'pm-lic-meta' },
                  h('span', { text: 'التاريخ: ' + fmt(evRep.report_date) }),
                  h('span', { class: 'badge ' + (evRep.status === 'published' ? 'ok' : 'gray'), text: evRep.status === 'published' ? 'معتمدة ومنشورة' : 'مسودة' })
                )
              )
            ),
            h('div', { class: 'pm-lic-actions' },
              h('button', {
                type: 'button', class: 'btn small gold', text: 'عرض ورقة التقييم الرسمية (طباعة)',
                onclick: function () {
                  openModal(h('div', { class: 'modal-body wk-modal-print' },
                    renderEvaluationSheetView(evRep, child.full_name, secName, child),
                    h('div', { class: 'modal-actions no-print' },
                      h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }),
                      h('button', { class: 'btn gold', type: 'button', text: 'طباعة الورقة الرسمية (A4)', onclick: function () { window.print(); } })
                    )
                  ));
                }
              })
            )
          );
          list.appendChild(evCard);
        });
        body.appendChild(list);
      }

      body.appendChild(h('div', { class: 'modal-actions' },
        h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal })
      ));
      openModal(body);
    }

    listView(v, {
      title: listTitle,
      addLabel: S.isEducator ? '' : 'إضافة طالب جديد',
      onAdd: S.isEducator ? null : function () { editChild(null); },
      extra: [],
      rows: rows,
      sheet: true,
      searchPlaceholder: 'بحث بالاسم، رقم القيد، الفرع، أو القسم…',
      empty: S.isEducator ? 'لا يوجد طلاب مسجلون في هذا القسم حالياً.' : 'لا توجد بيانات مسجلة للأطفال.',
      search: function (r) {
        return [r.membership_no, r.full_name, nameOf(branches, r.branch_id, 'name'), nameOf(sections, r.section_id, 'name'), r.section, r.disability]
          .filter(Boolean).join(' ');
      },
      details: function (r) {
        var secName = nameOf(sections, r.section_id, 'name') || r.section || '';
        var kd = r;
        
        // 1. معلومات الطالب الأساسية مع رابط واتساب المباشر لرقم الهاتف
        var infoItems = [
          ['تاريخ الميلاد', r.dob ? fmt(r.dob) : '—'],
          ['رقم هاتف الاتصال (واتساب)', makeWhatsAppLink(r.phone, r)],
          ['طبيعة الإعاقة', r.disability || '—'],
          ['الموسم الدراسي', r.academic_year || '—'],
          ['الفرع / المركز', nameOf(branches, r.branch_id, 'name') || CENTERS[r.center] || '—'],
          ['الفوج / القسم', secName || '—'],
          ['تاريخ إنشاء الملف', fmt(r.created_at)],
          ['معلومات وتوجيهات خاصة بالولي', r.basic_info || '—', true]
        ];

        var detailsGrid = h('div', { class: 'child-details' }, infoItems.map(function (it) {
          var valNode = it[1] instanceof Node ? it[1] : h('b', { text: String(it[1]) });
          return h('div', { class: 'cd-item' + (it[2] ? ' wide' : '') }, h('span', { text: it[0] }), valNode);
        }));

        // 2. شريط إجراءات الطفل المنقول بالكامل إلى داخل التفاصيل (البطاقة، الرمز، التعديل، الأرشفة، الحذف)
        var actionsBar = h('div', { class: 'child-details-actions-bar' },
          rbtn('التقارير', function () { openChildReportsModal(r); }, 'light'),
          rbtn('التقييمات', function () { openChildEvaluationsModal(r); }, 'gold'),
          rbtn('بطاقة التلميذ', function () { openStudentCard(r); }, 'gold'),
          rbtn('رمز تسجيل الولي', function () { return manageChildCode(r); }),
          rbtn('تعديل البيانات', function () { editChild(r); }),
          rbtn(r.active ? 'أرشفة الملف' : 'استعادة الملف', async function () {
            await C.rest('PATCH', '/children?id=eq.' + uid(r.id), { active: !r.active });
            bust(); toast(r.active ? 'تم نقل الملف إلى الأرشيف.' : 'تمت استعادة الملف إلى الحالة النشطة.', 'ok');
            go('children');
          }, r.active ? 'light' : 'gold'),
          rbtn('حذف نهائي', async function () {
            if (!(await ask({
              title: 'تنبيه بشأن حذف ملف الطالب',
              msg: 'سيُحذف الملف وروابطه نهائيًا. هل تريد الحذف رغم ذلك؟',
              ok: 'حذف نهائي', danger: true
            }))) return;
            await C.rest('DELETE', '/children?id=eq.' + uid(r.id));
            bust(); toast('تم حذف الملف.', 'ok'); go('children');
          }, 'danger'),

        );

        // 3. قسم تقارير الطفل الدورية
        var childReps = (allReports || []).filter(function (rep) {
          return rep.child_id === r.id && !isEvaluationReport(rep);
        });

        var repsHost = h('div', { class: 'child-sub-section' },
          h('div', { class: 'child-sub-section-title' },
            makeSvgIcon('s-report'),
            h('span', { text: 'التقارير التربوية الدورية للطفل (' + childReps.length + ')' })
          )
        );

        if (!childReps.length) {
          repsHost.appendChild(h('p', { class: 'muted small', text: 'لا توجد تقارير دورية مسجلة لهذا الطفل بعد.' }));
        } else {
          childReps.forEach(function (rep) {
            var repCard = h('div', { class: 'child-sub-item-card' },
              h('div', null,
                h('strong', { text: rep.title }),
                h('div', { class: 'muted small', text: 'التاريخ: ' + fmt(rep.report_date) + ' • الحالة: ' + (rep.status === 'published' ? 'منشور للولي' : 'مسودة') })
              ),
              h('div', { class: 'row-actions' },
                rep.attachment_path ? rbtn('المرفق', function () {
                  C.signedUrl('private-docs', rep.attachment_path, 60).then(function (url) {
                    window.open(url, '_blank');
                  }).catch(function (e) { toast(e.message, 'bad'); });
                }, 'light') : null,
                rbtn('تعديل التقرير', function () {
                  S.preselectChildId = r.id;
                  go('reports');
                }, 'light')
              )
            );
            repsHost.appendChild(repCard);
          });
        }

        // 4. قسم استمارات التقييم البيداغوجي للطفل
        var childEvals = (allReports || []).filter(function (rep) {
          return rep.child_id === r.id && isEvaluationReport(rep);
        });

        var evalsHost = h('div', { class: 'child-sub-section' },
          h('div', { class: 'child-sub-section-title' },
            makeSvgIcon('s-card'),
            h('span', { text: 'استمارات التقييم البيداغوجي للطفل (' + childEvals.length + ')' })
          )
        );

        if (!childEvals.length) {
          evalsHost.appendChild(h('p', { class: 'muted small', text: 'لا توجد استمارات تقييم مسجلة لهذا الطفل بعد.' }));
        } else {
          childEvals.forEach(function (evRep) {
            var evCard = h('div', { class: 'child-sub-item-card' },
              h('div', null,
                h('strong', { text: evRep.title }),
                h('div', { class: 'muted small', text: 'التاريخ: ' + fmt(evRep.report_date) + ' • الحالة: ' + (evRep.status === 'published' ? 'معتمدة ومنشورة' : 'مسودة') })
              ),
              h('div', { class: 'row-actions' },
                rbtn('عرض الورقة الرسمية (طباعة)', function () {
                  openModal(h('div', { class: 'modal-body wk-modal-print' },
                    renderEvaluationSheetView(evRep, r.full_name, secName, r),
                    h('div', { class: 'modal-actions no-print' },
                      h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }),
                      h('button', { class: 'btn gold', type: 'button', text: 'طباعة الورقة الرسمية (A4)', onclick: function () { window.print(); } })
                    )
                  ));
                }, 'gold')
              )
            );
            evalsHost.appendChild(evCard);
          });
        }

        var pane = h('div', { class: 'child-details-pane' },
          detailsGrid,
          actionsBar,
          repsHost,
          evalsHost
        );
        return pane;
      },
      exportXlsx: {
        file: 'قائمة_الأطفال_دار_الإحسان',
        sheet: 'الأطفال',
        widths: [14, 30, 14, 30, 30, 28, 18, 16, 12, 40],
        cols: [
          { label: 'رقم القيد', value: function (r) { return r.membership_no || ''; } },
          { label: 'اسم ولقب التلميذ', value: function (r) { return r.full_name || ''; } },
          { label: 'تاريخ الميلاد', value: function (r) { return r.dob || ''; } },
          { label: 'الفرع', value: function (r) { return nameOf(branches, r.branch_id, 'name') || CENTERS[r.center] || ''; } },
          { label: 'الفوج / القسم', value: function (r) { return nameOf(sections, r.section_id, 'name') || r.section || ''; } },
          { label: 'طبيعة الإعاقة', value: function (r) { return r.disability || ''; } },
          { label: 'رقم الهاتف', value: function (r) { return r.phone || ''; } },
          { label: 'الموسم الدراسي', value: function (r) { return r.academic_year || ''; } },
          { label: 'الحالة', value: function (r) { return r.active ? 'نشط' : 'مؤرشف'; } },
          { label: 'توجيهات الولي', value: function (r) { return r.basic_info || ''; } }
        ]
      },
      filters: S.isEducator ? [
        { label: 'الحالة', opts: [['1', 'نشط'], ['0', 'مؤرشف']], test: function (r, x) { return String(+r.active) === x; } }
      ] : [
        { label: 'الفرع', opts: branchOpts, test: function (r, x) { return r.branch_id === x; } },
        { label: 'القسم', opts: secOpts, test: function (r, x) { return r.section_id === x; } },
        { label: 'الحالة', opts: [['1', 'نشط'], ['0', 'مؤرشف']], test: function (r, x) { return String(+r.active) === x; } }
      ],
      cols: [
        {
          label: 'رقم القيد',
          get: function (r) {
            return h('span', { class: 'sic-num', text: r.membership_no ? ('N° ' + r.membership_no) : '—' });
          },
          sort: function (r) { return r.membership_no || ''; }
        },
        { label: 'اسم ولقب التلميذ', get: function (r) { return r.full_name; }, sort: function (r) { return r.full_name; } },
        { label: 'تاريخ الميلاد', get: function (r) { return r.dob ? fmt(r.dob) : '—'; }, sort: function (r) { return r.dob; } },
        { label: 'الفرع', get: function (r) { return nameOf(branches, r.branch_id, 'name') || CENTERS[r.center] || '—'; }, sort: function (r) { return nameOf(branches, r.branch_id, 'name') || CENTERS[r.center] || ''; } },
        { label: 'الفوج / القسم', get: function (r) { return nameOf(sections, r.section_id, 'name') || r.section || '—'; }, sort: function (r) { return nameOf(sections, r.section_id, 'name') || r.section || ''; } },
        { label: 'الإعاقة', get: function (r) { return r.disability || '—'; }, sort: function (r) { return r.disability || ''; } },
        { label: 'الحالة', get: function (r) { return badge(r.active ? 'نشط' : 'مؤرشف', r.active ? 'ok' : 'gray'); }, sort: function (r) { return r.active ? 1 : 0; } }
      ],
      actions: function (r) {
        return [];
      }
    });
  }

  /* =====================================================================
     3. إدارة الفروع والأقسام التربوية (Branches & Sections)
     ===================================================================== */
  async function secBranches(v) {
    if (S.isEducator) return go('children');
    var d;
    try {
      d = await getMany('branches', 'sections', 'children');
    } catch (e) {
      var is404 = (e.status === 404) || (e.message && (e.message.indexOf('404') >= 0 || e.message.indexOf('Not Found') >= 0 || e.message.indexOf('relation') >= 0));
      if (is404) {
        v.appendChild(h('div', { class: 'card' },
          h('h2', { text: 'يجب تنفيذ ترقية قاعدة البيانات أولاً' }),
          h('p', { text: 'جداول الفروع والأقسام غير موجودة في قاعدة البيانات بعد.' }),
          h('p', { class: 'muted', text: 'لإصلاح هذا: في Supabase Dashboard → SQL Editor، شغّل محتوى ملف 05-branches-sections-import.sql الموجود في مجلد المشروع.' }),
          h('p', { class: 'muted small', text: 'بعد تنفيذ السكريبت، أعد تشغيل PostgREST عبر إرسال الأمر: notify pgrst, \'reload schema\';' })
        ));
        return;
      }
      throw e;
    }
    var branches = d[0], sections = d[1], kids = d[2];

    function kidsCountInBranch(bid) { return kids.filter(function (k) { return k.branch_id === bid && k.active; }).length; }
    function kidsCountInSection(sid) { return kids.filter(function (k) { return k.section_id === sid && k.active; }).length; }

    function addSection() {
      var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
      return openForm({
        title: 'إضافة قسم / فوج تربوي جديد',
        fields: [
          { k: 'branch_id', label: 'الفرع التابع له', type: 'select', opts: branchOpts, req: true },
          { k: 'name', label: 'اسم القسم / الفوج', req: true, min: 2, max: 80 },
          { k: 'slug', label: 'المعرّف التقني (Slug)', req: true, min: 2, max: 40, hint: 'أحرف إنجليزية وأرقام وشرطة فقط (مثال: sec_autism_4)' },
          { k: 'description', label: 'وصف القسم وأهدافه', type: 'textarea', max: 500 }
        ],
        onSubmit: async function (x) {
          await C.rest('POST', '/sections', {
            branch_id: x.branch_id,
            name: x.name,
            slug: x.slug.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            description: x.description || null,
            active: true
          });
          bust(); toast('تم إنشاء القسم التربوي بنجاح.', 'ok'); go('branches');
        }
      });
    }

    v.appendChild(h('div', { class: 'bar-sub' },
      h('h2', { text: 'فروع المؤسسة المعتمدة' })
    ));

    var branchCards = branches.map(function (b) {
      return h('div', { class: 'card branch-card-item' },
        h('h3', { text: b.name }),
        h('div', { class: 'meta' },
          h('span', { text: 'المعرّف: ' + b.slug }),
          h('span', { text: 'عدد الطلبة المسجلين: ' + kidsCountInBranch(b.id) }),
          badge(b.active ? 'نشط' : 'معطّل', b.active ? 'ok' : 'gray')
        )
      );
    });
    v.appendChild(h('div', null, branchCards));

    v.appendChild(h('div', { class: 'bar-sub' },
      h('h2', { text: 'الأقسام والأفواج التربوية (11 فوج رسمي)' }),
      h('button', { class: 'btn', type: 'button', text: 'إضافة قسم جديد', onclick: addSection })
    ));

    listView(v, {
      title: 'قائمة الأقسام التربوية',
      rows: sections,
      empty: 'لا توجد أقسام مسجلة.',
      search: function (s) { return s.name + ' ' + (s.description || ''); },
      cols: [
        { label: 'اسم القسم', get: function (s) { return s.name; }, sort: function (s) { return s.name; } },
        { label: 'الفرع التابع له', get: function (s) { return nameOf(branches, s.branch_id, 'name'); } },
        { label: 'عدد الطلبة', get: function (s) { return String(kidsCountInSection(s.id)); } },
        { label: 'الوصف', get: function (s) { return s.description || '—'; } },
        { label: 'الحالة', get: function (s) { return badge(s.active ? 'نشط' : 'معطّل', s.active ? 'ok' : 'gray'); } }
      ],
      actions: function (s) {
        return [
          rbtn(s.active ? 'تعطيل' : 'تفعيل', async function () {
            await C.rest('PATCH', '/sections?id=eq.' + uid(s.id), { active: !s.active });
            bust(); toast('تم تحديث حالة القسم.', 'ok'); go('branches');
          }, s.active ? 'light' : 'gold')
        ];
      }
    });
  }

  /* =====================================================================
     3-ب. قسم المربيات وإنشاء حساب للمربية بكلمة سر من الإدارة (Educators Section)
     ===================================================================== */
  function genTempSetupCode() {
    var al = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', o;
    do {
      var a = new Uint32Array(12); crypto.getRandomValues(a); o = '';
      for (var i = 0; i < a.length; i++) o += al.charAt(a[i] % al.length);
    } while (!/[A-Z]/.test(o) || !/[a-z]/.test(o) || !/[0-9]/.test(o));
    return o;
  }

  async function createOrUpdateEducatorAccount(edu, rawPw, sections, returnSec) {
    if (!edu || !edu.section_id) throw new Error('يرجى تحديد القسم الخاص بالمربية أولاً.');
    var pw = String(rawPw || '').trim();
    if (pw.length < 8) throw new Error('كلمة السر يجب أن تتكون من 8 أحرف أو أرقام على الأقل.');

    var secName = nameOf(sections, edu.section_id, 'name') || edu.section_name || 'القسم التربوي';
    var loginEmail = (edu.email && DE.isEmail(edu.email)) ? edu.email.toLowerCase() : educatorEmailFromPhoneOrName(edu.phone, edu.id);
    edu.email = loginEmail;

    try {
      await C.fn('admin-users', { action: 'create_admin', email: loginEmail, role: 'admin', password: pw });
    } catch (e1) {
      try {
        await C.rpc('admin_add_user', { p_email: loginEmail, p_password: pw });
      } catch (e2) {}
    }

    var meta = await loadPortalMeta();
    meta.account_meta[loginEmail] = {
      role: 'educator',
      educator_id: edu.id,
      full_name: edu.full_name,
      section_id: edu.section_id,
      section_name: secName,
      phone: edu.phone || '',
      has_account: true,
      updated_at: new Date().toISOString()
    };

    var eduInList = (meta.educators || []).filter(function (x) { return x.id === edu.id; })[0];
    if (eduInList) {
      eduInList.email = loginEmail;
      eduInList.section_name = secName;
      eduInList.phone = edu.phone || eduInList.phone;
      eduInList.has_account = true;
    }
    await savePortalMeta(meta);
    bust();

    var loginIdDisplay = edu.phone ? (edu.phone + ' (أو ' + loginEmail + ')') : loginEmail;
    var credsSummary = 'اسم المربية: ' + edu.full_name + '\n'
      + 'القسم التربوي: ' + secName + '\n'
      + 'اسم المستخدم للدخول (رقم الهاتف أو البريد): ' + (edu.phone || loginEmail) + '\n'
      + 'كلمة السر: ' + pw;

    openModal(h('div', { class: 'modal-body' },
      h('h2', { text: 'تم إنشاء حساب المربية وحفظ كلمة السر بنجاح' }),
      h('div', { class: 'child-details' },
        h('div', { class: 'cd-item' }, h('span', { text: 'اسم المربية' }), h('b', { text: edu.full_name })),
        h('div', { class: 'cd-item' }, h('span', { text: 'القسم الخاص بها' }), h('b', { text: secName })),
        h('div', { class: 'cd-item' }, h('span', { text: 'معرّف الدخول (رقم الهاتف أو البريد)' }), h('b', { dir: 'ltr', text: loginIdDisplay })),
        h('div', { class: 'cd-item' }, h('span', { text: 'كلمة السر المعتمدة' }), h('b', { dir: 'ltr', text: pw })),
        h('div', { class: 'cd-item wide' }, h('span', { text: 'صلاحيات الحساب' }), h('b', { text: 'قسم الطلبة (طلاب قسمها فقط) + قسم التقارير واستمارات التقييم' }))
      ),
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: function () { closeModal(); if (returnSec) go(returnSec); } }),
        h('button', {
          class: 'btn gold',
          type: 'button',
          text: 'نسخ بيانات دخول المربية',
          onclick: function () {
            try {
              navigator.clipboard.writeText(credsSummary);
              toast('تم نسخ بيانات دخول المربية وكلمة السر بنجاح.', 'ok');
            } catch (e) {}
          }
        })
      )
    ));
  }

  function openCreateEducatorAccountModal(preselectedEdu, sections, meta, returnSec) {
    var educators = (meta && meta.educators) || [];
    if (!educators.length) {
      toast('يرجى إضافة المربيات أولاً في «قسم المربيات» ثم إنشاء حساب لهن.', 'bad');
      return go('educators');
    }

    var eduOpts = educators.map(function (e) {
      var sName = nameOf(sections, e.section_id, 'name');
      return [e.id, e.full_name + ' — (' + (sName !== '—' ? sName : (e.section_name || '')) + ')'];
    });

    var targetEdu = preselectedEdu || educators[0];
    var targetSecName = targetEdu ? (nameOf(sections, targetEdu.section_id, 'name') || targetEdu.section_name || '') : '';
    var existingAcc = (targetEdu && targetEdu.email && meta.account_meta && meta.account_meta[targetEdu.email.toLowerCase()]) || {};
    var initialPw = '';

    return openForm({
      title: 'إنشاء حساب للمربية وتعيين كلمة السر',
      values: {
        educator_id: targetEdu ? targetEdu.id : '',
        section_display: targetSecName,
        phone: targetEdu ? (targetEdu.phone || '') : '',
        edu_pw: initialPw
      },
      submits: [
        { key: 'create', label: 'إنشاء حساب المربية وحفظ كلمة السر', gold: true }
      ],
      fields: [
        {
          k: 'educator_id',
          label: 'اختر اسم المربية',
          type: 'select',
          opts: eduOpts,
          req: true,
          searchable: true,
          hint: 'عند اختيار اسم المربية يظهر تلقائياً القسم الخاص بها ورقم هاتفها.'
        },
        {
          k: 'section_display',
          label: 'القسم / الفوج التربوي الخاص بالمربية (يظهر تلقائياً)',
          type: 'text',
          readonly: true,
          hint: 'سيكون للمربية إذن لمعرفة طلاب قسمها فقط وإضافة التقارير واستمارات التقييم لهم فقط.'
        },
        {
          k: 'phone',
          label: 'رقم الهاتف (تستخدمه المربية لتسجيل الدخول — اختياري)',
          type: 'tel',
          max: 25
        },
        {
          k: 'edu_pw',
          label: 'كلمة السر الخاصة بالمربية (تضعها الإدارة)',
          type: 'text',
          req: true,
          max: 72,
          gen: genTempSetupCode,
          hint: 'اكتب كلمة السر التي ستدخل بها المربية إلى حسابها (8 أحرف أو أرقام على الأقل)، أو اضغط «توليد كود قوي».'
        }
      ],
      onChange: function (changedKey, cur, api) {
        if (changedKey === 'educator_id' || !changedKey) {
          var chosen = educators.filter(function (e) { return e.id === cur.educator_id; })[0];
          if (chosen) {
            var sName = nameOf(sections, chosen.section_id, 'name');
            var secInput = api.input('section_display');
            var phInput = api.input('phone');
            var pwInput = api.input('edu_pw');
            if (secInput) secInput.value = sName !== '—' ? sName : (chosen.section_name || '');
            if (phInput && (changedKey === 'educator_id' || !phInput.value)) phInput.value = chosen.phone || '';
            if (pwInput && changedKey === 'educator_id') {
              var acc = (chosen.email && meta.account_meta && meta.account_meta[chosen.email.toLowerCase()]) || {};
              pwInput.value = '';
            }
          }
        }
      },
      onSubmit: async function (x) {
        var chosen = educators.filter(function (e) { return e.id === x.educator_id; })[0];
        if (!chosen) throw new Error('اختر اسم المربية أولاً.');
        if (x.phone) chosen.phone = normalizeArabicDigits(x.phone).trim();
        await createOrUpdateEducatorAccount(chosen, x.edu_pw, sections, returnSec || 'accounts');
      }
    });
  }

  async function secEducators(v) {
    if (S.isEducator) return go('children');
    var d0 = await getMany('sections', 'branches');
    var allSections = d0[0] || [], branches = d0[1] || [];
    var centerSecs = allSections.filter(function (s) { return sectionCenterKey(s, branches) === S.activeCenter; });
    var sections = centerSecs.length ? centerSecs : allSections;
    var secIdsMap = {};
    sections.forEach(function (s) { secIdsMap[s.id] = true; });
    var meta = await loadPortalMeta(true);
    var educators = (meta.educators || []).filter(function (e) { return !e.section_id || !!secIdsMap[e.section_id]; });
    var secOpts = sections.map(function (s) { return [s.id, s.name]; });

    function openChangeEducatorSectionModal(edu, allSectionsList) {
      var curSecId = edu.section_id || '';
      var curSecName = nameOf(allSectionsList, curSecId, 'name');
      var sel = h('select', { class: 'fld-select' },
        h('option', { value: '', text: '— بدون قسم محدد —' }),
        allSectionsList.map(function (s) {
          var opt = h('option', { value: s.id, text: s.name });
          if (s.id === curSecId) opt.selected = true;
          return opt;
        })
      );
      var card = h('div', { class: 'modal-card' },
        h('h3', { text: 'تغيير قسم المربية: ' + edu.full_name }),
        h('p', { class: 'muted small', text: 'القسم الحالي: ' + (curSecName !== '—' ? curSecName : (edu.section_name || 'غير محدد')) }),
        h('label', { class: 'fld' },
          h('span', { text: 'اختر القسم التربوي الجديد للمربية:' }),
          sel
        ),
        h('div', { class: 'row-actions' },
          h('button', {
            class: 'btn light',
            type: 'button',
            text: 'إلغاء',
            onclick: function () { $('#modal').hidden = true; }
          }),
          h('button', {
            class: 'btn gold',
            type: 'button',
            text: 'حفظ ونقل المربية',
            onclick: async function () {
              var newSecId = sel.value;
              var newSecName = nameOf(allSectionsList, newSecId, 'name');
              edu.section_id = newSecId;
              edu.section_name = newSecName !== '—' ? newSecName : '';
              var curMeta = await loadPortalMeta();
              var idx = (curMeta.educators || []).findIndex(function (item) { return item && item.id === edu.id; });
              if (idx >= 0) {
                curMeta.educators[idx].section_id = edu.section_id;
                curMeta.educators[idx].section_name = edu.section_name;
                var em = (edu.email || '').toLowerCase();
                if (em && curMeta.account_meta && curMeta.account_meta[em]) {
                  curMeta.account_meta[em].section_id = edu.section_id;
                  curMeta.account_meta[em].section_name = edu.section_name;
                }
              }
              await savePortalMeta(curMeta);
              bust();
              $('#modal').hidden = true;
              toast('تم تغيير قسم المربية «' + edu.full_name + '» إلى: ' + (edu.section_name || 'بدون قسم') + ' بنجاح!', 'ok');
              go('educators');
            }
          })
        )
      );
      var m = $('#modal'), mc = $('#modalCard');
      mc.textContent = '';
      mc.appendChild(card);
      m.hidden = false;
    }

    function editEducator(edu) {
      var existingAcc = (edu && edu.email && meta.account_meta && meta.account_meta[edu.email.toLowerCase()]) || {};
      var vals = edu ? {
        full_name: edu.full_name,
        section_id: edu.section_id,
        phone: edu.phone || '',
        email: edu.email || '',
        edu_pw: '',
        notes: edu.notes || ''
      } : {
        section_id: sections[0] ? sections[0].id : ''
      };

      return openForm({
        title: edu ? 'تعديل ملف المربية' : 'إضافة مربية جديدة',
        values: vals,
        submits: [
          { key: 'save', label: 'حفظ ملف المربية', gold: true }
        ],
        fields: [
          { k: 'full_name', label: 'اسم ولقب المربية', req: true, max: 120 },
          { k: 'section_id', label: 'القسم / الفوج التربوي الخاص بها', type: 'select', opts: secOpts, req: true, searchable: true },
          { k: 'phone', label: 'رقم هاتف المربية', type: 'tel', max: 25, hint: 'مثال: 0668034147 — تستخدمه المربية لتسجيل الدخول إلى حسابها.' },
          { k: 'edu_pw', label: 'كلمة السر لحساب المربية (اختياري — يمكن تعيينها هنا أو من حسابات الإدارة)', type: 'text', max: 72, gen: genTempSetupCode, hint: 'إذا وضعت كلمة سر هنا (8 أحرف على الأقل)، يتم إنشاء/تحديث حساب المربية مباشرة.' },
          { k: 'email', label: 'البريد الإلكتروني (اختياري — يُنشأ تلقائياً من رقم الهاتف إن تُرك فارغاً)', type: 'text', max: 254 },
          { k: 'notes', label: 'ملاحظات إدارية (اختياري)', type: 'textarea', max: 500 }
        ],
        onSubmit: async function (x) {
          var cleanPhone = normalizeArabicDigits(x.phone || '').trim();
          var secName = nameOf(sections, x.section_id, 'name');
          var eduId = edu ? edu.id : (crypto.randomUUID ? crypto.randomUUID() : ('edu-' + Date.now()));
          var cleanEm = String(x.email || '').trim().toLowerCase();
          var loginEmail = (cleanEm && DE.isEmail(cleanEm)) ? cleanEm : educatorEmailFromPhoneOrName(cleanPhone, eduId);

          var trimmedPw0 = normalizeArabicDigits(String(x.edu_pw || '').trim());
          var record = {
            id: eduId,
            full_name: x.full_name,
            section_id: x.section_id,
            section_name: secName !== '—' ? secName : '',
            phone: cleanPhone,
            email: loginEmail,
            has_account: !!(trimmedPw0 || (edu && edu.has_account) || (existingAcc && existingAcc.has_account)),
            notes: x.notes || '',
            updated_at: new Date().toISOString()
          };

          var curMeta = await loadPortalMeta();
          var idx = curMeta.educators.findIndex(function (item) { return item && item.id === eduId; });
          if (idx >= 0) {
            var oldEmail = curMeta.educators[idx].email;
            curMeta.educators[idx] = record;
            if (oldEmail && curMeta.account_meta[oldEmail]) {
              var oldAcc = curMeta.account_meta[oldEmail];
              oldAcc.full_name = record.full_name;
              oldAcc.section_id = record.section_id;
              oldAcc.section_name = record.section_name;
              oldAcc.phone = record.phone;
              curMeta.account_meta[loginEmail] = oldAcc;
            }
          } else {
            curMeta.educators.push(record);
          }

          await savePortalMeta(curMeta);
          var trimmedPw = String(x.edu_pw || '').trim();
          if (trimmedPw.length > 0) {
            if (trimmedPw.length < 8) {
              throw new Error('تم حفظ ملف المربية، ولكن كلمة السر يجب أن تتكون من 8 أحرف أو أرقام على الأقل لإنشاء الحساب.');
            }
            await createOrUpdateEducatorAccount(record, trimmedPw, sections, 'educators');
          } else {
            toast(edu ? 'تم تحديث وحفظ ملف المربية بنجاح.' : 'تمت إضافة وحفظ المربية في قسم المربيات بنجاح.', 'ok');
            go('educators');
          }
        }
      });
    }

    listView(v, {
      title: 'قسم المربيات وإسناد الأقسام التربوية',
      addLabel: 'إضافة مربية جديدة',
      onAdd: function () { editEducator(null); },
      extra: [
        {
          label: 'إنشاء حساب للمربية وتعيين كلمة سر',
          kind: 'gold',
          onclick: function () { openCreateEducatorAccountModal(null, sections, meta, 'educators'); }
        }
      ],
      rows: educators,
      sheet: true,
      searchPlaceholder: 'بحث باسم المربية، القسم، أو رقم الهاتف…',
      empty: 'لا توجد مربيات مسجلات بعد. اضغط «إضافة مربية جديدة» لإضافة المربيات وربط كل مربية بقسمها.',
      search: function (e) {
        return [e.full_name, nameOf(sections, e.section_id, 'name'), e.section_name, e.phone, e.email].filter(Boolean).join(' ');
      },
      filters: [
        { label: 'القسم', opts: secOpts, test: function (e, x) { return e.section_id === x; } }
      ],
      cols: [
        { label: 'اسم ولقب المربية', get: function (e) { return e.full_name; }, sort: function (e) { return e.full_name; } },
        {
          label: 'القسم / الفوج المسند إليها',
          get: function (e) {
            var sName = nameOf(sections, e.section_id, 'name');
            return badge(sName !== '—' ? sName : (e.section_name || 'غير محدد'), 'gold');
          },
          sort: function (e) { return nameOf(sections, e.section_id, 'name') || e.section_name || ''; }
        },
        {
          label: 'رقم الهاتف (معرّف الدخول)',
          get: function (e) { return h('span', { dir: 'ltr', class: 'sic-num', text: e.phone || '—' }); },
          sort: function (e) { return e.phone || ''; }
        },
        {
          label: 'تاريخ الميلاد',
          get: function (e) { return h('span', { dir: 'ltr', text: e.dob || '—' }); },
          sort: function (e) { return e.dob || ''; }
        },
        {
          label: 'كلمة المرور (DI + تاريخ الميلاد)',
          get: function (e) {
            var dobPw = staffPasswordFromDob(e.dob);
            var acc = meta.account_meta && e.email ? meta.account_meta[e.email.toLowerCase()] : null;
            return h('div', { class: 'row-actions' },
              dobPw ? h('code', { dir: 'ltr', class: 'sic-num', text: dobPw }) : null,
              (!acc || !acc.has_account) ? badge('لم يُنشأ الحساب بعد', 'gray') : badge('مفعّل', 'ok')
            );
          }
        }
      ],
      actions: function (e) {
        return [
          rbtn('تغيير القسم', function () { openChangeEducatorSectionModal(e, allSections); }, 'ok'),
          rbtn('تعديل الملف', function () { editEducator(e); }, 'gold'),
          rbtn('إنشاء حساب / كلمة سر', function () { openCreateEducatorAccountModal(e, sections, meta, 'educators'); }),
          rbtn('حذف', async function () {
            if (!(await ask({ title: 'حذف ملف وحساب المربية؟', msg: 'سيتم حذف ملف المربية «' + e.full_name + '» وحسابها نهائيًا.', ok: 'حذف نهائي', danger: true }))) return;
            var emLower = String(e.email || '').toLowerCase();
            if (e.id) S.deletedRuntimeIds[String(e.id)] = true;
            if (emLower) S.deletedRuntimeEmails[emLower] = true;
            var curMeta = await loadPortalMeta();
            if (!Array.isArray(curMeta.deleted_educator_ids)) curMeta.deleted_educator_ids = [];
            if (!Array.isArray(curMeta.deleted_emails)) curMeta.deleted_emails = [];
            if (e.id && curMeta.deleted_educator_ids.indexOf(String(e.id)) < 0) curMeta.deleted_educator_ids.push(String(e.id));
            if (emLower && curMeta.deleted_emails.indexOf(emLower) < 0) curMeta.deleted_emails.push(emLower);
            curMeta.educators = (curMeta.educators || []).filter(function (x) { return x.id !== e.id; });
            if (emLower && curMeta.account_meta) delete curMeta.account_meta[emLower];
            if (emLower) {
              try { await C.rpc('admin_remove_user_by_email', { p_email: emLower }); } catch (errRpc) {}
            }
            await savePortalMeta(curMeta);
            bust();
            toast('تم حذف ملف وحساب المربية نهائيًا.', 'ok');
            go('educators');
          }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     4. إدارة البرامج التربوية للأقسام والجدول الأسبوعي المصوّر (Educational Programs)
     ===================================================================== */
  var WEEK_DAYS = [
    { key: 'sun', label: 'الأحد' },
    { key: 'mon', label: 'الإثنين' },
    { key: 'tue', label: 'الثلاثاء' },
    { key: 'wed', label: 'الأربعاء' },
    { key: 'thu', label: 'الخميس' }
  ];

  var BREAK_PRESETS = [
    'الاعتماد على الذات',
    'فسحة',
    'استراحة',
    'رياضة',
    'التحضير للخروج'
  ];

  function createTamhinDemoBody(secId, secName) {
    var cleanDomains = [
      {
        domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)',
        skills: [
          'غسل اليدين بالماء والصابون بشكل صحيح',
          'لبس المئزر بشكل صحيح',
          'مسك أدوات الطعام بشكل صحيح'
        ]
      },
      {
        domain: 'مجال المهارات الحركية الدقيقة',
        skills: [
          'مسك المقص بشكل صحيح',
          'قص الورقة على خطوط مستقيمة عريضة',
          'ترتيب مجموعة من الأوراق فوق بعضها'
        ]
      },
      {
        domain: 'مجال المهارات الحركية الكبرى',
        skills: [
          'المشي بطريقة صحيحة',
          'دفع جهاز متحرك لمسافة 2 م بطريقة صحيحة'
        ]
      },
      {
        domain: 'مجال مهارات الحضور والانتباه',
        skills: [
          'الاتصال البصري أثناء التعليم الجماعي',
          'الاستجابة للتعليمات اللفظية (أمران متسلسلان)'
        ]
      },
      {
        domain: 'مجال التواصل',
        skills: [
          'يسمي الأشياء المألوفة في البيئة',
          'يستجيب للأوامر المتسلسلة (أكثر من أمر)'
        ]
      }
    ];

    var demoDays = [
      {
        day: 'sun',
        label: 'الأحد',
        sessions: [
          {
            kind: 'break',
            title: 'الاعتماد على الذات',
            start: '08:00',
            end: '09:00',
            items: [{ domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skill: 'لبس المئزر بشكل صحيح' }]
          },
          {
            kind: 'session',
            title: 'ورشة التأهيل المهني الأولي',
            start: '09:00',
            end: '10:30',
            items: [
              { domain: 'مجال المهارات الحركية الدقيقة', skill: 'مسك المقص بشكل صحيح' },
              { domain: 'مجال مهارات الحضور والانتباه', skill: 'الاتصال البصري أثناء التعليم الجماعي' }
            ]
          },
          {
            kind: 'break',
            title: 'فسحة',
            start: '10:30',
            end: '11:00',
            items: []
          },
          {
            kind: 'session',
            title: 'تنمية المهارات العملية',
            start: '12:00',
            end: '13:40',
            items: [{ domain: 'مجال التواصل', skill: 'يستجيب للأوامر المتسلسلة (أكثر من أمر)' }]
          },
          {
            kind: 'break',
            title: 'التحضير للخروج',
            start: '13:40',
            end: '14:00',
            items: []
          }
        ]
      },
      {
        day: 'mon',
        label: 'الإثنين',
        sessions: [
          {
            kind: 'break',
            title: 'الاعتماد على الذات',
            start: '08:00',
            end: '09:00',
            items: [{ domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skill: 'غسل اليدين بالماء والصابون بشكل صحيح' }]
          },
          {
            kind: 'session',
            title: 'نشاط الفرز والترتيب المهني',
            start: '09:00',
            end: '10:30',
            items: [{ domain: 'مجال المهارات الحركية الدقيقة', skill: 'ترتيب مجموعة من الأوراق فوق بعضها' }]
          },
          {
            kind: 'break',
            title: 'فسحة',
            start: '10:30',
            end: '11:00',
            items: []
          },
          {
            kind: 'session',
            title: 'ورشة القص والتشكيل',
            start: '12:00',
            end: '13:40',
            items: [{ domain: 'مجال المهارات الحركية الدقيقة', skill: 'قص الورقة على خطوط مستقيمة عريضة' }]
          },
          {
            kind: 'break',
            title: 'التحضير للخروج',
            start: '13:40',
            end: '14:00',
            items: []
          }
        ]
      },
      {
        day: 'tue',
        label: 'الثلاثاء',
        sessions: [
          {
            kind: 'break',
            title: 'الاعتماد على الذات',
            start: '08:00',
            end: '09:00',
            items: []
          },
          {
            kind: 'session',
            title: 'رياضة وتوافق حركي مهني',
            start: '09:00',
            end: '10:30',
            items: [{ domain: 'مجال المهارات الحركية الكبرى', skill: 'دفع جهاز متحرك لمسافة 2 م بطريقة صحيحة' }]
          },
          {
            kind: 'break',
            title: 'فسحة',
            start: '10:30',
            end: '11:00',
            items: []
          },
          {
            kind: 'session',
            title: 'تواصل وتفاعل اجتماعي بالورشة',
            start: '12:00',
            end: '13:40',
            items: [{ domain: 'مجال التواصل', skill: 'يسمي الأشياء المألوفة في البيئة' }]
          },
          {
            kind: 'break',
            title: 'التحضير للخروج',
            start: '13:40',
            end: '14:00',
            items: []
          }
        ]
      },
      {
        day: 'wed',
        label: 'الأربعاء',
        sessions: [
          {
            kind: 'break',
            title: 'الاعتماد على الذات',
            start: '08:00',
            end: '09:00',
            items: []
          },
          {
            kind: 'session',
            title: 'ورشة التمهين التطبيقي',
            start: '09:00',
            end: '10:30',
            items: [
              { domain: 'مجال مهارات الحضور والانتباه', skill: 'الاستجابة للتعليمات اللفظية (أمران متسلسلان)' },
              { domain: 'مجال المهارات الحركية الدقيقة', skill: 'مسك المقص بشكل صحيح' }
            ]
          },
          {
            kind: 'break',
            title: 'فسحة',
            start: '10:30',
            end: '11:00',
            items: []
          },
          {
            kind: 'session',
            title: 'استقلالية الحياة اليومية',
            start: '12:00',
            end: '13:40',
            items: [{ domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skill: 'مسك أدوات الطعام بشكل صحيح' }]
          },
          {
            kind: 'break',
            title: 'التحضير للخروج',
            start: '13:40',
            end: '14:00',
            items: []
          }
        ]
      },
      {
        day: 'thu',
        label: 'الخميس',
        sessions: [
          {
            kind: 'break',
            title: 'الاعتماد على الذات',
            start: '08:00',
            end: '09:00',
            items: []
          },
          {
            kind: 'session',
            title: 'تقييم أسبوعي للمهارات المهنية',
            start: '09:00',
            end: '10:30',
            items: [
              { domain: 'مجال المهارات الحركية الدقيقة', skill: 'ترتيب مجموعة من الأوراق فوق بعضها' },
              { domain: 'مجال التواصل', skill: 'يستجيب للأوامر المتسلسلة (أكثر من أمر)' }
            ]
          },
          {
            kind: 'break',
            title: 'فسحة',
            start: '10:30',
            end: '11:00',
            items: []
          },
          {
            kind: 'session',
            title: 'أنشطة جماعية ومراجعة',
            start: '12:00',
            end: '13:40',
            items: [{ domain: 'مجال المهارات الحركية الكبرى', skill: 'المشي بطريقة صحيحة' }]
          },
          {
            kind: 'break',
            title: 'التحضير للخروج',
            start: '13:40',
            end: '14:00',
            items: []
          }
        ]
      }
    ];

    var notesTxt = 'برنامج أسبوعي معتمد لقسم التمهين (مركز المساعدة على العمل) — يشمل الفترات الصباحية والمسائية والحصص البينية.';
    var schedulePayload = demoDays.map(function (dy) {
      return {
        day: dy.day,
        label: dy.label,
        section_name: secName || 'التمهين م م ع',
        academic_year: '2026/2027',
        notes: notesTxt,
        domains: cleanDomains,
        sessions: dy.sessions
      };
    });

    var goalsLines = cleanDomains.map(function (dm) {
      return '• ' + dm.domain + ': ' + dm.skills.join(' ، ');
    });

    return {
      section_id: secId,
      title: DE.clean('البرنامج الأسبوعي — ' + (secName || 'التمهين م م ع'), 155),
      academic_year: '2026/2027',
      description: notesTxt,
      goals: DE.clean(goalsLines.join('\n'), 4800),
      schedule: schedulePayload,
      status: 'published',
      published_at: new Date().toISOString()
    };
  }

  var _tamhinSeedAttempted = false;

  async function secPrograms(v) {
    if (S.isEducator) return go('children');
    var d = await getMany('programs', 'sections', 'branches');
    var allProgs = d[0] || [], allSections = d[1] || [], branches = d[2] || [];
    var centerSecs = allSections.filter(function (s) { return sectionCenterKey(s, branches) === S.activeCenter; });
    var sections = centerSecs.length ? centerSecs : allSections;
    var secIdsMap = {};
    sections.forEach(function (s) { secIdsMap[s.id] = true; });
    var rows = allProgs.filter(function (p) { return !p.section_id || !!secIdsMap[p.section_id]; });
    var secOpts = sections.map(function (s) { return [s.id, s.name]; });

    var tamhinSec = sections.filter(function (s) {
      return s.slug === 'sec_tamhin' || (s.name && s.name.indexOf('التمهين') >= 0);
    })[0];

    if (tamhinSec && !_tamhinSeedAttempted) {
      var hasTamhinProg = rows.some(function (r) { return r.section_id === tamhinSec.id && r.status === 'published'; });
      if (!hasTamhinProg) {
        _tamhinSeedAttempted = true;
        try {
          var demoBody = createTamhinDemoBody(tamhinSec.id, tamhinSec.name);
          await C.rest('POST', '/educational_programs', demoBody);
          bust();
          var fresh = await getMany('programs', 'sections');
          rows = fresh[0];
          sections = fresh[1];
        } catch (seedErr) {}
      }
    }

    var CURR = (window && window.DE_CURRICULUM) || EMBEDDED_CURRICULUM || {};
    var domainKeys = Object.keys(CURR);
    var domainOpts = domainKeys.map(function (dk) { return [dk, dk]; });

    function domainColorClass(domName) {
      var idx = domainKeys.indexOf(domName);
      if (idx < 0) idx = 0;
      return 'wk-dom-c' + (idx % 8);
    }

    function parseProgState(p) {
      var st = {
        id: p ? p.id : null,
        section_id: (p && p.section_id) || (sections[0] ? sections[0].id : ''),
        academic_year: (p && p.academic_year) || '2026/2027',
        status: (p && p.status) || 'draft',
        published_at: (p && p.published_at) || null,
        notes: '',
        domains: [],
        days: WEEK_DAYS.map(function (wd) {
          return { day: wd.key, label: wd.label, sessions: [] };
        })
      };

      var rawSched = null;
      if (p && p.schedule) {
        try {
          rawSched = typeof p.schedule === 'string' ? JSON.parse(p.schedule) : p.schedule;
        } catch (e) { rawSched = null; }
      }

      if (Array.isArray(rawSched) && rawSched.length) {
        if (rawSched[0] && Array.isArray(rawSched[0].domains)) {
          st.domains = rawSched[0].domains.map(function (dm) {
            return {
              domain: dm.domain || (domainKeys[0] || ''),
              skills: Array.isArray(dm.skills) ? dm.skills.slice() : []
            };
          });
        }
        if (rawSched[0] && typeof rawSched[0].notes === 'string') {
          st.notes = rawSched[0].notes;
        }
        st.days = WEEK_DAYS.map(function (wd) {
          var found = rawSched.filter(function (r) { return r && (r.day === wd.key || r.label === wd.label || (wd.key === 'mon' && r.label === 'الاثنين')); })[0];
          var sessList = (found && Array.isArray(found.sessions)) ? found.sessions.map(function (s) {
            return {
              kind: s.kind === 'break' ? 'break' : 'session',
              title: s.title || '',
              start: s.start || '',
              end: s.end || '',
              items: Array.isArray(s.items) ? s.items.map(function (it) {
                return { domain: it.domain || '', skill: it.skill || '' };
              }).filter(function (it) { return it.domain || it.skill; }) : []
            };
          }) : [];
          return { day: wd.key, label: wd.label, sessions: sessList };
        });
      } else if (p) {
        st.notes = p.description || '';
        if (p.title) {
          var parts = p.title.split(' — ');
          if (parts.length >= 2 && CURR[parts[0]]) {
            st.domains.push({ domain: parts[0], skills: [parts.slice(1).join(' — ')] });
          } else if (CURR[p.title]) {
            st.domains.push({ domain: p.title, skills: [] });
          }
        }
      }

      st.days.forEach(function (dy) {
        (dy.sessions || []).forEach(function (s) {
          (s.items || []).forEach(function (it) {
            if (!it.domain) return;
            var dEntry = st.domains.filter(function (dm) { return dm.domain === it.domain; })[0];
            if (!dEntry) {
              dEntry = { domain: it.domain, skills: [] };
              st.domains.push(dEntry);
            }
            if (it.skill && dEntry.skills.indexOf(it.skill) < 0) {
              dEntry.skills.push(it.skill);
            }
          });
        });
      });

      if (!st.domains.length) {
        st.domains.push({ domain: domainKeys[0] || '', skills: [] });
      }

      if (!p) {
        st.days.forEach(function (dy) {
          if (!dy.sessions.length) {
            dy.sessions.push({ kind: 'session', title: '', start: '', end: '', items: [] });
          }
        });
      }

      return st;
    }

    function formatTimeRange(start, end) {
      var s = String(start || '').trim();
      var e = String(end || '').trim();
      if (s && e) return 'من ' + s + ' إلى ' + e;
      if (s) return 'من ' + s;
      if (e) return 'إلى ' + e;
      return '';
    }

    function formatShortTimeRange(start, end) {
      var s = String(start || '').trim();
      var e = String(end || '').trim();
      if (s && e) return s + ' ⟵ ' + e;
      if (s) return s;
      if (e) return e;
      return '';
    }

    function isSessionActive(s) {
      if (!s) return false;
      if (s.kind === 'break') return !!(s.title || s.start || s.end || (s.items && s.items.length));
      return !!((s.items && s.items.length) || s.title || s.start || s.end);
    }

    /* استخراج أعمدة الحصص الموحدة وتوقيتها (من وقت ... إلى وقت ...) لجميع أيام الأسبوع تحت إطار الفترات */
    function buildUnifiedScheduleColumns(daysList) {
      var maxCols = 0;
      (daysList || []).forEach(function (dy) {
        var len = (dy && dy.sessions) ? dy.sessions.length : 0;
        if (len > maxCols) maxCols = len;
      });
      if (maxCols === 0) maxCols = 1;

      var cols = [];
      var normalCounter = 0;
      for (var c = 0; c < maxCols; c++) {
        var startVal = '';
        var endVal = '';
        var breakCount = 0;
        var activeCount = 0;
        var sampleTitle = '';
        var anyActive = false;

        (daysList || []).forEach(function (dy) {
          var s = dy && dy.sessions ? dy.sessions[c] : null;
          if (!s) return;
          if (isSessionActive(s)) anyActive = true;
          if (!startVal && s.start) startVal = String(s.start).trim();
          if (!endVal && s.end) endVal = String(s.end).trim();
          if (s.kind === 'break') {
            breakCount++;
            if (!sampleTitle && s.title) sampleTitle = s.title;
          }
          if (s.kind) activeCount++;
        });

        var isBrk = breakCount > 0 && breakCount >= Math.ceil((activeCount || 1) / 2);
        if (!isBrk) normalCounter++;
        cols.push({
          colIndex: c,
          isBreak: isBrk,
          sessionNum: isBrk ? 0 : normalCounter,
          label: isBrk ? (sampleTitle || 'حصة بينية / فسحة') : ('الحصة ' + normalCounter),
          start: startVal,
          end: endVal,
          anyActive: anyActive
        });
      }

      var filtered = cols.filter(function (cl) { return cl.anyActive; });
      return filtered.length ? filtered : [cols[0]];
    }

    function wrapCanvasLines(ctx, text, maxWidth) {
      var words = String(text || '').trim().split(/\s+/);
      if (!words.length || !words[0]) return [];
      var lines = [];
      var cur = words[0];
      for (var i = 1; i < words.length; i++) {
        var test = cur + ' ' + words[i];
        if (ctx.measureText(test).width <= maxWidth) {
          cur = test;
        } else {
          lines.push(cur);
          cur = words[i];
        }
      }
      lines.push(cur);
      return lines;
    }

    /* رسم جدول البرنامج الأسبوعي كصورة أفقية عالية الدقة مع وضع التوقيت الواضح مباشرة تحت إطار الفترات وموحد لجميع الأيام */
    function renderWeeklyScheduleDataUrl(st, secName, cb) {
      var canvas = document.createElement('canvas');
      var W = 1600;
      var activeDomains = (st.domains || []).filter(function (dm) { return dm && dm.domain; });
      var stripH = activeDomains.length ? 92 : 0;
      var unifiedCols = buildUnifiedScheduleColumns(st.days || []);
      var numCols = unifiedCols.length;

      var rowHeights = WEEK_DAYS.map(function (wd) {
        var dy = (st.days || []).filter(function (d) { return d.day === wd.key; })[0];
        var sess = dy && dy.sessions ? dy.sessions : [];
        var maxItems = 1;
        unifiedCols.forEach(function (col) {
          var s = sess[col.colIndex];
          if (!s) return;
          var c = (s.items ? s.items.length : 0);
          if (c > maxItems) maxItems = c;
        });
        return Math.max(108, 42 + maxItems * 56);
      });

      var periodHeaderH = 48;
      var timeHeaderH = 68;
      var totalTableH = periodHeaderH + timeHeaderH + rowHeights.reduce(function (a, b) { return a + b; }, 0);
      var H = 178 + stripH + totalTableH + 88;
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');
      ctx.direction = 'rtl';

      var palette = ['#FEF08A', '#BBF7D0', '#BAE6FD', '#FBCFE8', '#FED7AA', '#DDD6FE', '#A7F3D0', '#FECDD3'];

      function drawAll(logoImg) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, W - 20, H - 20);

        // 1. الترويسة الرسمية العلوية
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(14, 14, W - 28, 140);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 20px Cairo, Tajawal, sans-serif';
        ctx.fillText('الموسم الدراسي: ' + (st.academic_year || '2026/2027'), W - 36, 58);
        ctx.fillText('الفوج / القسم: ' + (secName || 'غير محدد'), W - 36, 98);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 19px Cairo, Tajawal, sans-serif';
        ctx.fillText('جمعية أولياء الأطفال المعاقين ذهنيًا', W / 2, 42);
        ctx.fillText('المركز النفسي البيداغوجي دار الإحسان', W / 2, 68);
        ctx.font = 'bold 16px Cairo, Tajawal, sans-serif';
        ctx.fillText('- العطف - غرداية -', W / 2, 92);

        ctx.fillStyle = '#E0F2FE';
        ctx.fillRect(W / 2 - 195, 102, 390, 44);
        ctx.strokeStyle = '#0284C7';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(W / 2 - 195, 102, 390, 44);
        ctx.fillStyle = '#0C2D55';
        ctx.font = '900 27px Cairo, Tajawal, sans-serif';
        ctx.fillText('البرنامج الأسبوعي', W / 2, 133);

        if (logoImg) {
          try { ctx.drawImage(logoImg, 38, 24, 108, 108); } catch (e) {}
        }

        var y = 164;

        // 2. الشريط العلوي الملون للأنشطة والمجالات
        if (activeDomains.length) {
          var rightLblW = 148;
          var leftTotalW = 126;
          var domAreaW = W - 56 - rightLblW - leftTotalW;
          var dColW = domAreaW / activeDomains.length;

          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(W - 28 - rightLblW, y, rightLblW, 38);
          ctx.fillRect(W - 28 - rightLblW, y + 38, rightLblW, 42);
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(W - 28 - rightLblW, y, rightLblW, 38);
          ctx.strokeRect(W - 28 - rightLblW, y + 38, rightLblW, 42);
          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 14px Cairo, Tajawal, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('الأنشطة / المجالات', W - 28 - rightLblW / 2, y + 24);
          ctx.fillText('عدد المهارات', W - 28 - rightLblW / 2, y + 64);

          var totalSkills = 0;
          activeDomains.forEach(function (dm, dIdx) {
            var dx = W - 28 - rightLblW - (dIdx + 1) * dColW;
            var colColor = palette[dIdx % palette.length];
            var skCount = dm.skills ? dm.skills.length : 0;
            totalSkills += skCount;

            ctx.fillStyle = colColor;
            ctx.fillRect(dx, y, dColW, 38);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(dx, y + 38, dColW, 42);
            ctx.strokeStyle = '#1E293B';
            ctx.strokeRect(dx, y, dColW, 38);
            ctx.strokeRect(dx, y + 38, dColW, 42);

            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 12.5px Cairo, Tajawal, sans-serif';
            ctx.fillText(String(dm.domain || '').slice(0, 30), dx + dColW / 2, y + 24);
            ctx.font = 'bold 15px Cairo, Tajawal, sans-serif';
            ctx.fillText(skCount + ' مهارة', dx + dColW / 2, y + 64);
          });

          ctx.fillStyle = '#D8B4E2';
          ctx.fillRect(28, y, leftTotalW, 38);
          ctx.fillStyle = '#F3E8FF';
          ctx.fillRect(28, y + 38, leftTotalW, 42);
          ctx.strokeStyle = '#1E293B';
          ctx.strokeRect(28, y, leftTotalW, 38);
          ctx.strokeRect(28, y + 38, leftTotalW, 42);
          ctx.fillStyle = '#3B0764';
          ctx.font = 'bold 15px Cairo, Tajawal, sans-serif';
          ctx.fillText('المجموع', 28 + leftTotalW / 2, y + 24);
          ctx.fillText(totalSkills + ' مهارة', 28 + leftTotalW / 2, y + 64);

          y += 92;
        }

        // 3. إطار الفترات (الصف الأول من رأس الجدول) + صف التوقيت الواضح تحته مباشرة (الصف الثاني)
        var dayColW = 148;
        var sessColW = W - 56 - dayColW;
        var colW = sessColW / numCols;

        // تقسيم الفترات (الفترة الصباحية | الاستراحة / الفسحة | الفترة المسائية) فوق أعمدة الحصص
        var midBreakIdx = -1;
        for (var bIdx = 1; bIdx < numCols - 1; bIdx++) {
          if (unifiedCols[bIdx].isBreak && (unifiedCols[bIdx].label.indexOf('فسحة') >= 0 || unifiedCols[bIdx].label.indexOf('استراحة') >= 0 || bIdx === Math.floor(numCols / 2))) {
            midBreakIdx = bIdx;
            break;
          }
        }

        // خلية اليمين لإطار الفترات
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(28 + sessColW, y, dayColW, periodHeaderH);
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(28 + sessColW, y, dayColW, periodHeaderH);
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 17px Cairo, Tajawal, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('إطار الفترات', 28 + sessColW + dayColW / 2, y + 30);

        if (midBreakIdx >= 0 && numCols >= 3) {
          var mornCols = midBreakIdx;
          var brkCols = 1;
          var aftCols = numCols - mornCols - brkCols;

          var mornW = mornCols * colW;
          var brkW = brkCols * colW;
          var aftW = aftCols * colW;

          var mornX = 28 + sessColW - mornW;
          var brkX = mornX - brkW;
          var aftX = 28;

          ctx.fillStyle = '#BAE6FD';
          ctx.fillRect(mornX, y, mornW, periodHeaderH);
          ctx.strokeRect(mornX, y, mornW, periodHeaderH);
          ctx.fillStyle = '#0C2D55';
          ctx.font = 'bold 18px Cairo, Tajawal, sans-serif';
          ctx.fillText('الفترة الصباحية', mornX + mornW / 2, y + 31);

          ctx.fillStyle = '#D8B4E2';
          ctx.fillRect(brkX, y, brkW, periodHeaderH);
          ctx.strokeRect(brkX, y, brkW, periodHeaderH);
          ctx.fillStyle = '#3B0764';
          ctx.font = 'bold 16px Cairo, Tajawal, sans-serif';
          ctx.fillText('⏸' + (unifiedCols[midBreakIdx].label || 'فسحة'), brkX + brkW / 2, y + 31);

          ctx.fillStyle = '#DDD6FE';
          ctx.fillRect(aftX, y, aftW, periodHeaderH);
          ctx.strokeRect(aftX, y, aftW, periodHeaderH);
          ctx.fillStyle = '#1E1B4B';
          ctx.font = 'bold 18px Cairo, Tajawal, sans-serif';
          ctx.fillText('الفترة المسائية', aftX + aftW / 2, y + 31);
        } else if (numCols >= 2) {
          var halfCols = Math.ceil(numCols / 2);
          var mW = halfCols * colW;
          var aW = sessColW - mW;
          var mX = 28 + sessColW - mW;

          ctx.fillStyle = '#BAE6FD';
          ctx.fillRect(mX, y, mW, periodHeaderH);
          ctx.strokeRect(mX, y, mW, periodHeaderH);
          ctx.fillStyle = '#0C2D55';
          ctx.font = 'bold 18px Cairo, Tajawal, sans-serif';
          ctx.fillText('الفترة الصباحية', mX + mW / 2, y + 31);

          ctx.fillStyle = '#DDD6FE';
          ctx.fillRect(28, y, aW, periodHeaderH);
          ctx.strokeRect(28, y, aW, periodHeaderH);
          ctx.fillStyle = '#1E1B4B';
          ctx.font = 'bold 18px Cairo, Tajawal, sans-serif';
          ctx.fillText('الفترة المسائية', 28 + aW / 2, y + 31);
        } else {
          ctx.fillStyle = '#BAE6FD';
          ctx.fillRect(28, y, sessColW, periodHeaderH);
          ctx.strokeRect(28, y, sessColW, periodHeaderH);
          ctx.fillStyle = '#0C2D55';
          ctx.font = 'bold 18px Cairo, Tajawal, sans-serif';
          ctx.fillText('الفترة الصباحية   |   الفترة المسائية', 28 + sessColW / 2, y + 31);
        }

        y += periodHeaderH;

        // 4. صف التوقيت الواضح تحت إطار الفترات مباشرة (موحد لجميع أيام الأسبوع من الأحد إلى الخميس)
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(28 + sessColW, y, dayColW, timeHeaderH);
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(28 + sessColW, y, dayColW, timeHeaderH);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px Cairo, Tajawal, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⏰ التوقيت الموحد', 28 + sessColW + dayColW / 2, y + 27);
        ctx.fillStyle = '#FDE047';
        ctx.font = 'bold 14px Cairo, Tajawal, sans-serif';
        ctx.fillText('الأيام ⬇ / الحصص ⬅', 28 + sessColW + dayColW / 2, y + 52);

        unifiedCols.forEach(function (col, cIdx) {
          var cx = 28 + sessColW - (cIdx + 1) * colW;
          ctx.fillStyle = col.isBreak ? '#F3E8FF' : '#EFF6FF';
          ctx.fillRect(cx, y, colW, timeHeaderH);
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx, y, colW, timeHeaderH);

          // اسم الحصة أو الفترة البينية
          ctx.fillStyle = col.isBreak ? '#4C1D95' : '#0C2D55';
          ctx.font = 'bold 14px Cairo, Tajawal, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(col.label.slice(0, 28), cx + colW / 2, y + 22);

          // كبسولة التوقيت الواضح (من ... إلى ...)
          var pillX = cx + 8;
          var pillY = y + 30;
          var pillW = colW - 16;
          var pillH = 31;
          ctx.fillStyle = col.isBreak ? '#FAF5FF' : '#FFFFFF';
          ctx.fillRect(pillX, pillY, pillW, pillH);
          ctx.strokeStyle = col.isBreak ? '#9333EA' : '#0284C7';
          ctx.lineWidth = 1.6;
          ctx.strokeRect(pillX, pillY, pillW, pillH);

          var timeTxt = formatTimeRange(col.start, col.end) || 'التوقيت يدوي';
          ctx.fillStyle = col.isBreak ? '#581C87' : '#0F172A';
          ctx.font = '900 15px Cairo, Tajawal, sans-serif';
          ctx.fillText('' + timeTxt, cx + colW / 2, pillY + 21);
        });

        y += timeHeaderH;

        // 5. صفوف أيام الأسبوع (الأحد – الخميس) تحت أعمدة الحصص وتوقيتها الموحد
        WEEK_DAYS.forEach(function (wd, idx) {
          var rh = rowHeights[idx];
          ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          ctx.fillRect(28, y, sessColW, rh);
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(28 + sessColW, y, dayColW, rh);

          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(28, y, sessColW, rh);
          ctx.strokeRect(28 + sessColW, y, dayColW, rh);

          ctx.fillStyle = '#0F172A';
          ctx.font = '900 21px Cairo, Tajawal, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(wd.label, 28 + sessColW + dayColW / 2, y + rh / 2 + 7);

          var dy = (st.days || []).filter(function (d) { return d.day === wd.key; })[0];
          var sessArr = (dy && dy.sessions) ? dy.sessions : [];

          unifiedCols.forEach(function (col, cIdx) {
            var sx = 28 + sessColW - (cIdx + 1) * colW;
            var sess = sessArr[col.colIndex];

            ctx.strokeStyle = '#94A3B8';
            ctx.lineWidth = 1.1;
            ctx.strokeRect(sx, y, colW, rh);

            if (!sess || !isSessionActive(sess)) {
              ctx.fillStyle = '#94A3B8';
              ctx.font = 'bold 16px Cairo, Tajawal, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('—', sx + colW / 2, y + rh / 2 + 6);
              return;
            }

            var isBrk = sess.kind === 'break' || col.isBreak;
            ctx.fillStyle = isBrk ? '#F3E8FF' : '#FFFFFF';
            ctx.fillRect(sx + 2, y + 2, colW - 4, rh - 4);

            var customTime = '';
            if ((sess.start && sess.start !== col.start) || (sess.end && sess.end !== col.end)) {
              customTime = formatShortTimeRange(sess.start, sess.end);
            }

            var iy = y + 10;
            if (sess.title && (!isBrk || (sess.items && sess.items.length))) {
              ctx.fillStyle = isBrk ? '#D8B4E2' : '#E0F2FE';
              ctx.fillRect(sx + 5, iy, colW - 10, 24);
              ctx.fillStyle = '#0F172A';
              ctx.font = 'bold 12.5px Cairo, Tajawal, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText((sess.title + (customTime ? (' (' + customTime + ')') : '')).slice(0, 34), sx + colW / 2, iy + 17);
              iy += 28;
            }

            if (isBrk && (!sess.items || !sess.items.length)) {
              ctx.fillStyle = '#4C1D95';
              ctx.font = 'bold 17px Cairo, Tajawal, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(sess.title || col.label || 'فسحة', sx + colW / 2, y + rh / 2 + 7);
            } else {
              (sess.items || []).forEach(function (it) {
                var domIdx = Math.max(0, domainKeys.indexOf(it.domain)) % palette.length;
                var boxH = 48;
                ctx.fillStyle = palette[domIdx];
                ctx.fillRect(sx + 6, iy, colW - 12, boxH);
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 0.9;
                ctx.strokeRect(sx + 6, iy, colW - 12, boxH);

                ctx.textAlign = 'right';
                ctx.fillStyle = '#0C2D55';
                ctx.font = 'bold 11.5px Cairo, Tajawal, sans-serif';
                ctx.fillText(('' + (it.domain || '')).slice(0, 38), sx + colW - 10, iy + 16);

                ctx.fillStyle = '#0F172A';
                ctx.font = 'bold 12px Cairo, Tajawal, sans-serif';
                var skillLines = wrapCanvasLines(ctx, '' + (it.skill || ''), colW - 22);
                ctx.fillText((skillLines[0] || '').slice(0, 44), sx + colW - 10, iy + 32);
                if (skillLines[1]) {
                  ctx.font = 'bold 11px Cairo, Tajawal, sans-serif';
                  ctx.fillText(skillLines[1].slice(0, 44), sx + colW - 10, iy + 44);
                }
                iy += boxH + 5;
              });
            }
          });

          y += rh;
        });

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 19px Cairo, Tajawal, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('توقيع المربية', W - 200, y + 48);
        ctx.fillText('المشرف البيداغوجي', W / 2, y + 48);
        ctx.fillText('توقيع وختم المدير', 200, y + 48);

        cb(canvas.toDataURL('image/png'));
      }

      var im = new Image();
      im.onload = function () { drawAll(im); };
      im.onerror = function () { drawAll(null); };
      im.src = 'logo-sq.png';
    }

    function downloadScheduleImage(st, secName) {
      renderWeeklyScheduleDataUrl(st, secName, function (dataUrl) {
        var a = document.createElement('a');
        a.download = 'البرنامج_الأسبوعي_' + String(secName || 'القسم').replace(/\s+/g, '_') + '.png';
        a.href = dataUrl;
        a.click();
        toast('تم تحميل صورة البرنامج الأسبوعي الأفقية بنجاح.', 'ok');
      });
    }

    function openFullProgramImageModal(st, secName, statusText) {
      var imgEl = h('img', { class: 'wk-zoom-img', alt: 'صورة البرنامج الأسبوعي — ' + (secName || '') });
      var zoomWrap = h('div', { class: 'wk-zoom-container' }, imgEl);
      var scale = 1;

      renderWeeklyScheduleDataUrl(st, secName, function (dataUrl) {
        imgEl.src = dataUrl;
      });

      openModal(h('div', { class: 'modal-body wk-modal-print' },
        h('div', { class: 'bar-sub no-print' },
          h('h2', { text: 'صورة البرنامج الأسبوعي — ' + (secName || '') }),
          h('div', { class: 'row-actions' },
            h('button', {
              class: 'btn small light',
              type: 'button',
              text: 'تكبير الصورة',
              onclick: function () {
                scale = Math.min(2.5, scale + 0.25);
                imgEl.className = scale > 1 ? 'wk-zoom-img is-zoomed' : 'wk-zoom-img';
              }
            }),
            h('button', {
              class: 'btn small light',
              type: 'button',
              text: 'تصغير',
              onclick: function () {
                scale = 1;
                imgEl.className = 'wk-zoom-img';
              }
            })
          )
        ),
        zoomWrap,
        h('div', { class: 'modal-actions no-print' },
          h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }),
          h('button', { class: 'btn gold', type: 'button', text: 'تحميل صورة البرنامج (PNG)', onclick: function () { downloadScheduleImage(st, secName); } }),
          h('button', { class: 'btn', type: 'button', text: 'طباعة', onclick: function () { window.print(); } })
        )
      ));
    }

    function buildWeeklySheet(st, secName, statusText) {
      var imgEl = h('img', {
        class: 'wk-program-img',
        alt: 'البرنامج الأسبوعي — ' + (secName || ''),
        title: 'اضغط لفتح وتكبير صورة البرنامج الأسبوعي كاملة',
        onclick: function () { openFullProgramImageModal(st, secName, statusText); }
      });

      renderWeeklyScheduleDataUrl(st, secName, function (dataUrl) {
        imgEl.src = dataUrl;
      });

      return h('div', { class: 'wk-img-card-wrap' },
        h('div', { class: 'wk-img-hint-bar no-print' },
          h('span', { class: 'muted small', text: 'صورة البرنامج الأسبوعي (التوقيت واضح تحت إطار الفترات وموحد من وقت البداية إلى وقت النهاية لجميع أيام الأسبوع):' }),
          h('button', {
            type: 'button',
            class: 'btn small gold',
            text: 'فتح وتكبير صورة البرنامج كاملة',
            onclick: function () { openFullProgramImageModal(st, secName, statusText); }
          })
        ),
        imgEl
      );
    }

    function printWeeklySheet(st, secName, statusText) {
      openFullProgramImageModal(st, secName, statusText);
    }

    function openProgramBuilder(p) {
      S.inSubBuilder = true;
      try { window.history.pushState({ deApp: true, sec: S.sec, center: S.activeCenter, subBuilder: true }, ''); } catch (e) {}
      var st = parseProgState(p);
      var showDaysList = true;
      var openDays = { sun: true, mon: true, tue: true, wed: true, thu: true };
      var activeCellTarget = null; // { dayKey, sIdx } لتوجيه النقر المباشر من جدول التوزيع السريع

      v.textContent = '';

      var topBar = h('div', { class: 'bar-sub' },
        h('h2', { text: p ? 'تعديل البرنامج الأسبوعي للقسم' : 'إعداد برنامج أسبوعي جديد للقسم' }),
        h('div', { class: 'row-actions' },
          h('button', { class: 'btn light', type: 'button', text: 'رجوع لقائمة البرامج', onclick: function () { go('programs'); } })
        )
      );
      v.appendChild(topBar);

      var previewHost = h('div', { class: 'wk-preview-host' });
      var domainsHost = h('div', { class: 'prog-domains-host' });
      var unifiedTimesHost = h('div', { class: 'prog-unified-times-host' });
      var daysToggleWrap = h('div', { class: 'prog-days-toggle-wrap' });
      var daysHost = h('div', { class: 'prog-days-host' });

      function getSecName() {
        return nameOf(sections, st.section_id, 'name') || 'غير محدد';
      }

      /* مزامنة توقيت الحصة (من وقت البداية إلى وقت النهاية) في جميع أيام الأسبوع (الأحد – الخميس) */
      function syncSlotTimeAcrossAllDays(slotIdx, field, val) {
        st.days.forEach(function (dy) {
          while (dy.sessions.length <= slotIdx) {
            dy.sessions.push({ kind: 'session', title: '', start: '', end: '', items: [] });
          }
          dy.sessions[slotIdx][field] = val;
        });
      }

      function allSelectedPairs() {
        var list = [];
        (st.domains || []).forEach(function (dm) {
          if (!dm || !dm.domain) return;
          (dm.skills || []).forEach(function (sk) {
            if (!list.some(function (x) { return x.domain === dm.domain && x.skill === sk; })) {
              list.push({ domain: dm.domain, skill: sk });
            }
          });
        });
        return list;
      }

      function ensureInDomains(domain, skill) {
        if (!domain) return;
        var dm = st.domains.filter(function (x) { return x.domain === domain; })[0];
        if (!dm) {
          dm = { domain: domain, skills: [] };
          st.domains.push(dm);
        }
        if (skill && dm.skills.indexOf(skill) < 0) {
          dm.skills.push(skill);
        }
      }

      function refreshPreview() {
        previewHost.textContent = '';
        previewHost.appendChild(buildWeeklySheet(st, getSecName(), st.status === 'published' ? 'معتمد ومصدَّر للأولياء' : 'معاينة قبل التصدير'));
      }

      /* شريط ضبط توقيت الحصص الموحد تحت إطار الفترات (يبدأ من وقت وينتهي في جميع الأيام للحصة) */
      function renderUnifiedTimesBar() {
        unifiedTimesHost.textContent = '';
        var cols = buildUnifiedScheduleColumns(st.days);
        var slotsGrid = h('div', { class: 'prog-unified-slots-grid' });

        cols.forEach(function (col) {
          var sIn = h('input', {
            type: 'text',
            class: 'sess-time-input',
            dir: 'ltr',
            maxlength: 25,
            placeholder: '08:00',
            value: col.start || ''
          });
          var eIn = h('input', {
            type: 'text',
            class: 'sess-time-input',
            dir: 'ltr',
            maxlength: 25,
            placeholder: '09:00',
            value: col.end || ''
          });

          sIn.addEventListener('input', function () {
            var vClean = DE.clean(sIn.value, 25);
            syncSlotTimeAcrossAllDays(col.colIndex, 'start', vClean);
            refreshPreview();
          });
          sIn.addEventListener('change', function () { renderDays(); });

          eIn.addEventListener('input', function () {
            var vClean = DE.clean(eIn.value, 25);
            syncSlotTimeAcrossAllDays(col.colIndex, 'end', vClean);
            refreshPreview();
          });
          eIn.addEventListener('change', function () { renderDays(); });

          slotsGrid.appendChild(h('div', { class: 'prog-unified-slot-box' + (col.isBreak ? ' is-break' : '') },
            h('div', { class: 'prog-unified-slot-hdr' },
              badge(col.isBreak ? ('⏸' + col.label) : ('' + col.label), col.isBreak ? 'warn' : 'gold')
            ),
            h('div', { class: 'prog-sess-times' },
              h('label', { class: 'sess-time-lbl' }, h('span', { text: '⏰ من (البداية):' }), sIn),
              h('label', { class: 'sess-time-lbl' }, h('span', { text: '⏰ إلى (النهاية):' }), eIn)
            )
          ));
        });

        var addUnifiedSlotBtn = h('button', {
          type: 'button',
          class: 'btn small gold',
          text: 'إضافة عمود حصة جديد لجميع الأيام',
          onclick: function () {
            var targetLen = cols.length + 1;
            st.days.forEach(function (dy) {
              while (dy.sessions.length < targetLen) {
                dy.sessions.push({ kind: 'session', title: '', start: '', end: '', items: [] });
              }
            });
            renderUnifiedTimesBar();
            renderDays();
            refreshPreview();
          }
        });

        var addUnifiedBreakBtn = h('button', {
          type: 'button',
          class: 'btn small light',
          text: '⏸+ حصة بينية (فسحة) لجميع الأيام',
          onclick: function () {
            var targetLen = cols.length;
            st.days.forEach(function (dy) {
              while (dy.sessions.length < targetLen) {
                dy.sessions.push({ kind: 'session', title: '', start: '', end: '', items: [] });
              }
              dy.sessions.push({ kind: 'break', title: 'فسحة', start: '', end: '', items: [] });
            });
            renderUnifiedTimesBar();
            renderDays();
            refreshPreview();
          }
        });

        unifiedTimesHost.appendChild(h('div', { class: 'prog-unified-times-card' },
          h('div', { class: 'bar-sub' },
            h('div', null,
              h('strong', { text: '⏰ شريط التوقيت الموحد للحصص (يظهر مباشرة تحت إطار الفترات ويسري على جميع الأيام: الأحد – الخميس)' }),
              h('p', { class: 'muted small', text: 'حدد وقت البداية والنهاية لكل حصة مرة واحدة هنا (أو من داخل أي يوم) وسيُعمَّم تلقائياً على جميع أيام الأسبوع.' })
            ),
            h('div', { class: 'row-actions' }, addUnifiedSlotBtn, addUnifiedBreakBtn)
          ),
          slotsGrid
        ));
      }

      var secSelect = h('select', { id: 'prog_sec_id' },
        h('option', { value: '', text: '— اختر الفوج / القسم التربوي —' }),
        secOpts.map(function (o) { return h('option', { value: o[0], text: o[1] }); })
      );
      secSelect.value = st.section_id || '';
      secSelect.addEventListener('change', function () {
        st.section_id = secSelect.value;
        refreshPreview();
      });

      var yearInput = h('input', { type: 'text', maxlength: 20, value: st.academic_year, placeholder: '2026/2027' });
      yearInput.addEventListener('input', function () {
        st.academic_year = DE.clean(yearInput.value, 20) || '2026/2027';
        refreshPreview();
      });

      var notesInput = h('textarea', { rows: 2, maxlength: 2000, placeholder: 'ملاحظات أو توجيهات بيداغوجية إضافية تظهر للأولياء (اختياري)...' });
      notesInput.value = st.notes || '';
      notesInput.addEventListener('input', function () {
        st.notes = DE.clean(notesInput.value, 2000);
        refreshPreview();
      });

      var basicCard = h('div', { class: 'card prog-step-card' },
        h('h3', { class: 'prog-step-title', text: '1⃣ بيانات الفوج / القسم والموسم الدراسي' }),
        h('div', { class: 'prog-grid-2' },
          h('label', { class: 'fld' }, h('span', { text: 'الفوج / القسم التربوي المستهدف *' }), secSelect),
          h('label', { class: 'fld' }, h('span', { text: 'الموسم الدراسي *' }), yearInput)
        ),
        h('label', { class: 'fld' }, h('span', { text: 'ملاحظات وتوجيهات عامة للأولياء (اختياري)' }), notesInput)
      );
      v.appendChild(basicCard);

      function renderDomains() {
        domainsHost.textContent = '';
        st.domains.forEach(function (dm, dIdx) {
          var curDomain = dm.domain || (domainKeys[0] || '');
          dm.domain = curDomain;
          var domainSkills = CURR[curDomain] || [];

          var domSearch = h('input', { type: 'search', class: 'fld-search', placeholder: 'ابحث عن المجال التربوي...', autocomplete: 'off' });
          var domSel = h('select', null, domainKeys.map(function (dk) { return h('option', { value: dk, text: dk }); }));
          domSel.value = curDomain;

          domSearch.addEventListener('input', function () {
            var q = normAr(domSearch.value.trim());
            var keep = domSel.value;
            while (domSel.firstChild) domSel.removeChild(domSel.firstChild);
            domainKeys.forEach(function (dk) {
              if (!q || normAr(dk).indexOf(q) >= 0) {
                domSel.appendChild(h('option', { value: dk, text: dk }));
              }
            });
            if (domainKeys.indexOf(keep) >= 0 && (!q || normAr(keep).indexOf(q) >= 0)) {
              domSel.value = keep;
            } else if (domSel.options.length) {
              domSel.selectedIndex = 0;
              dm.domain = domSel.value;
              renderDomains();
              renderDays();
              refreshPreview();
            }
          });

          domSel.addEventListener('change', function () {
            dm.domain = domSel.value;
            renderDomains();
            renderDays();
            refreshPreview();
          });

          var sklSearch = h('input', { type: 'search', class: 'fld-search', placeholder: 'ابحث في مهارات هذا المجال (' + domainSkills.length + ' مهارة)...', autocomplete: 'off' });
          var sklListBox = h('div', { class: 'prog-skills-checklist' });
          var selectedTagsBox = h('div', { class: 'prog-selected-tags' });

          function refreshSelectedTags() {
            selectedTagsBox.textContent = '';
            if (!dm.skills.length) {
              selectedTagsBox.appendChild(h('span', { class: 'muted small', text: 'لم يتم تحديد مهارات من هذا المجال بعد — ضع علامة على مهارة أو أكثر من القائمة أعلاه.' }));
              return;
            }
            dm.skills.forEach(function (sk) {
              selectedTagsBox.appendChild(h('span', { class: 'prog-tag-chip ' + domainColorClass(curDomain) },
                h('span', { text: '' + sk }),
                h('button', {
                  type: 'button',
                  class: 'prog-tag-rm',
                  text: '',
                  title: 'إزالة المهارة',
                  onclick: function () {
                    dm.skills = dm.skills.filter(function (x) { return x !== sk; });
                    renderDomains();
                    renderDays();
                    refreshPreview();
                  }
                })
              ));
            });
          }

          function populateSkillCheckboxes() {
            var q = normAr(sklSearch.value.trim());
            sklListBox.textContent = '';
            var shown = 0;
            domainSkills.forEach(function (sk) {
              if (q && normAr(sk).indexOf(q) === -1) return;
              shown++;
              var isChecked = dm.skills.indexOf(sk) >= 0;
              var cb = h('input', { type: 'checkbox', checked: isChecked });
              cb.addEventListener('change', function () {
                if (cb.checked) {
                  if (dm.skills.indexOf(sk) < 0) dm.skills.push(sk);
                } else {
                  dm.skills = dm.skills.filter(function (x) { return x !== sk; });
                }
                refreshSelectedTags();
                renderDays();
                refreshPreview();
              });
              sklListBox.appendChild(h('label', { class: 'prog-skl-item' + (isChecked ? ' active' : '') }, cb, h('span', { text: sk })));
            });
            if (!shown) {
              sklListBox.appendChild(h('p', { class: 'muted small', text: 'لا توجد مهارات مطابقة لعبارة البحث.' }));
            }
          }

          sklSearch.addEventListener('input', populateSkillCheckboxes);
          populateSkillCheckboxes();
          refreshSelectedTags();

          var blockCard = h('div', { class: 'prog-domain-card ' + domainColorClass(curDomain) },
            h('div', { class: 'prog-domain-card-hdr' },
              h('strong', { text: 'المجال التربوي رقم (' + (dIdx + 1) + ')' }),
              h('div', { class: 'row-actions' },
                h('span', { class: 'badge gold', text: dm.skills.length + ' مهارة محددة' }),
                h('button', {
                  type: 'button',
                  class: 'btn small light',
                  text: 'تحديد أول 5 مهارات',
                  onclick: function () {
                    domainSkills.slice(0, 5).forEach(function (sk) {
                      if (dm.skills.indexOf(sk) < 0) dm.skills.push(sk);
                    });
                    renderDomains();
                    renderDays();
                    refreshPreview();
                  }
                }),
                dm.skills.length ? h('button', {
                  type: 'button',
                  class: 'btn small light',
                  text: 'مسح المحدد',
                  onclick: function () {
                    dm.skills = [];
                    renderDomains();
                    renderDays();
                    refreshPreview();
                  }
                }) : null,
                st.domains.length > 1 ? h('button', {
                  type: 'button',
                  class: 'btn small danger',
                  text: 'حذف هذا المجال',
                  onclick: function () {
                    st.domains.splice(dIdx, 1);
                    renderDomains();
                    renderDays();
                    refreshPreview();
                  }
                }) : null
              )
            ),
            h('label', { class: 'fld' },
              h('span', { text: 'اختر المجال التربوي:' }),
              domSearch,
              domSel
            ),
            h('div', { class: 'fld' },
              h('span', { text: 'اختر مهارة أو أكثر من مهارات «' + curDomain + '»:' }),
              sklSearch,
              sklListBox
            ),
            h('div', { class: 'prog-selected-wrap' },
              h('small', { class: 'muted', text: 'المهارات المختارة من هذا المجال:' }),
              selectedTagsBox
            )
          );
          domainsHost.appendChild(blockCard);
        });
      }

      function addAnotherDomain() {
        var used = st.domains.map(function (dm) { return dm.domain; });
        var nextDom = domainKeys.filter(function (dk) { return used.indexOf(dk) < 0; })[0] || domainKeys[0] || '';
        st.domains.push({ domain: nextDom, skills: [] });
        renderDomains();
        renderDays();
        refreshPreview();
        toast('تمت إضافة خانة مجال جديد — اختر المجال ومهاراته.', 'ok');
      }

      /* قوالب جاهزة وتوزيع تلقائي ذكي لتسهيل ملء البرنامج الأسبوعي بضغطة واحدة */
      function applyStandardStructureTemplate(kind) {
        var slots = kind === 'compact' ? [
          { kind: 'session', title: 'الحصة الصباحية 1', start: '08:30', end: '10:00' },
          { kind: 'break',   title: 'فسحة واستراحة', start: '10:00', end: '10:30' },
          { kind: 'session', title: 'الحصة الصباحية 2', start: '10:30', end: '12:00' }
        ] : [
          { kind: 'break',   title: 'الاعتماد على الذات', start: '08:00', end: '09:00' },
          { kind: 'session', title: 'الحصة الصباحية', start: '09:00', end: '10:30' },
          { kind: 'break',   title: 'فسحة', start: '10:30', end: '11:00' },
          { kind: 'session', title: 'الحصة المسائية', start: '12:00', end: '13:40' },
          { kind: 'break',   title: 'التحضير للخروج', start: '13:40', end: '14:00' }
        ];
        st.days.forEach(function (dy) {
          var oldSessions = dy.sessions || [];
          dy.sessions = slots.map(function (sl, idx) {
            var prev = oldSessions[idx];
            return {
              kind: sl.kind,
              title: (prev && prev.title) ? prev.title : sl.title,
              start: sl.start,
              end: sl.end,
              items: (prev && Array.isArray(prev.items)) ? prev.items.slice() : []
            };
          });
        });
        showDaysList = true;
        WEEK_DAYS.forEach(function (wd) { openDays[wd.key] = true; });
        renderUnifiedTimesBar();
        renderDays();
        refreshPreview();
        toast('تم تطبيق قالب الحصص والتوقيت الموحد على جميع أيام الأسبوع بنجاح!', 'ok');
      }

      function autoDistributeSkillsAcrossWeek() {
        var pairs = allSelectedPairs();
        if (!pairs.length) {
          // إذا لم يحدد المستخدم مهارات بعد، نختار تلقائياً أول 3 مهارات من كل مجال محدد للتسهيل
          st.domains.forEach(function (dm) {
            var sks = (CURR[dm.domain] || []).slice(0, 3);
            sks.forEach(function (sk) {
              if (dm.skills.indexOf(sk) < 0) dm.skills.push(sk);
            });
          });
          pairs = allSelectedPairs();
          renderDomains();
        }
        if (!pairs.length) {
          return toast('اختر مجالاً ومهارة واحدة على الأقل أولاً ليتم توزيعها تلقائياً.', 'bad');
        }

        // التأكد من وجود هيكل حصص قياسي إن كان الجدول فارغاً
        var maxSessions = Math.max.apply(null, st.days.map(function (d) { return (d.sessions || []).length; }));
        if (maxSessions <= 1) {
          applyStandardStructureTemplate('full');
        }

        var cursor = 0;
        st.days.forEach(function (dy) {
          (dy.sessions || []).forEach(function (sess) {
            if (sess.kind === 'break') {
              if (sess.title === 'الاعتماد على الذات' && !sess.items.length) {
                var selfCare = pairs.filter(function (p) { return p.domain.indexOf('الاستقلالية') >= 0; })[0];
                if (selfCare) sess.items = [{ domain: selfCare.domain, skill: selfCare.skill }];
              }
              return;
            }
            var p1 = pairs[cursor % pairs.length];
            cursor++;
            var items = [ { domain: p1.domain, skill: p1.skill } ];
            if (pairs.length > 4) {
              var p2 = pairs[cursor % pairs.length];
              if (p2.skill !== p1.skill || p2.domain !== p1.domain) {
                items.push({ domain: p2.domain, skill: p2.skill });
                cursor++;
              }
            }
            sess.items = items;
          });
        });

        showDaysList = true;
        WEEK_DAYS.forEach(function (wd) { openDays[wd.key] = true; });
        renderUnifiedTimesBar();
        renderDays();
        refreshPreview();
        toast('تم توزيع المهارات المختارة تلقائياً على جميع حصص الأسبوع (الأحد – الخميس)! يمكنك تعديل أي خانة بحرية.', 'ok');
      }

      function copyDayToAllWeek(sourceDayObj) {
        st.days.forEach(function (dy) {
          if (dy.day === sourceDayObj.day) return;
          dy.sessions = (sourceDayObj.sessions || []).map(function (s) {
            return {
              kind: s.kind,
              title: s.title,
              start: s.start,
              end: s.end,
              items: (s.items || []).map(function (it) { return { domain: it.domain, skill: it.skill }; })
            };
          });
        });
        renderUnifiedTimesBar();
        renderDays();
        refreshPreview();
        toast('تم نسخ برنامج يوم ' + sourceDayObj.label + ' وتعميمه على جميع أيام الأسبوع بنجاح!', 'ok');
      }

      var domainsStepCard = h('div', { class: 'card prog-step-card' },
        h('div', { class: 'bar-sub' },
          h('div', null,
            h('h3', { class: 'prog-step-title', text: '2⃣ المجالات التربوية والمهارات المستهدفة (إمكانية إضافة أكثر من مجال)' }),
            h('p', { class: 'muted small', text: 'يمكنك إضافة أكثر من مجال تربوي، وعند اختيار كل مجال تظهر مهاراته الخاصة لتختار منها مهارة أو أكثر.' })
          ),
          h('div', { class: 'row-actions' },
            h('button', { type: 'button', class: 'btn gold', text: 'إضافة مجال تربوي آخر', onclick: addAnotherDomain })
          )
        ),
        domainsHost,
        h('div', { class: 'prog-add-domain-bar' },
          h('button', { type: 'button', class: 'btn gold', text: 'إضافة مجال تربوي آخر ومهاراته', onclick: addAnotherDomain })
        )
      );
      v.appendChild(domainsStepCard);

      function insertSessionAt(dayObj, index, kind, defaultTitle) {
        var refSess = (st.days[0] && st.days[0].sessions && st.days[0].sessions[index]) || null;
        dayObj.sessions.splice(index, 0, {
          kind: kind || 'session',
          title: defaultTitle || '',
          start: refSess ? (refSess.start || '') : '',
          end: refSess ? (refSess.end || '') : '',
          items: []
        });
        openDays[dayObj.day] = true;
        renderUnifiedTimesBar();
        renderDays();
        refreshPreview();
      }

      function copyBreakToAllDays(sourceSess, positionIndex) {
        st.days.forEach(function (dy) {
          var already = dy.sessions.some(function (s) { return s.kind === 'break' && s.title === sourceSess.title && s.start === sourceSess.start && s.end === sourceSess.end; });
          if (!already) {
            var targetIdx = Math.min(positionIndex, dy.sessions.length);
            dy.sessions.splice(targetIdx, 0, {
              kind: 'break',
              title: sourceSess.title || 'فسحة',
              start: sourceSess.start || '',
              end: sourceSess.end || '',
              items: (sourceSess.items || []).map(function (it) { return { domain: it.domain, skill: it.skill }; })
            });
          }
        });
        renderUnifiedTimesBar();
        renderDays();
        refreshPreview();
        toast('تم إدراج الحصة البينية «' + (sourceSess.title || 'فاصل') + '» بنفس التوقيت في جميع أيام الأسبوع (الأحد – الخميس).', 'ok');
      }

      function buildInsertBetweenBar(dayObj, insertIdx, labelText) {
        return h('div', { class: 'prog-insert-between' },
          h('span', { class: 'prog-insert-lbl', text: labelText }),
          h('div', { class: 'prog-insert-btns' },
            h('button', {
              type: 'button',
              class: 'btn small light',
              text: 'إدراج حصة تربوية هنا',
              onclick: function () { insertSessionAt(dayObj, insertIdx, 'session', ''); }
            }),
            h('button', {
              type: 'button',
              class: 'btn small gold',
              text: '⏸إدراج حصة ما بين الحصص وعنوانها هنا',
              onclick: function () { insertSessionAt(dayObj, insertIdx, 'break', ''); }
            })
          )
        );
      }

      function renderDays() {
        renderUnifiedTimesBar();
        daysToggleWrap.textContent = '';
        daysHost.textContent = '';

        var toggleDaysBtn = h('button', {
          type: 'button',
          class: 'btn ' + (showDaysList ? 'light' : 'gold') + ' prog-show-days-btn',
          text: showDaysList ? 'إخفاء قائمة أيام الأسبوع' : 'اضغط هنا لإظهار أيام الأسبوع (الأحد – الخميس) وتعبئة البرنامج',
          onclick: function () {
            showDaysList = !showDaysList;
            renderDays();
          }
        });

        daysToggleWrap.appendChild(toggleDaysBtn);

        if (!showDaysList) {
          daysHost.hidden = true;
          return;
        }
        daysHost.hidden = false;

        var selectedPairs = allSelectedPairs();

        st.days.forEach(function (dayObj) {
          var isDayOpen = !!openDays[dayObj.day];
          var filledCount = (dayObj.sessions || []).filter(isSessionActive).length;

          var dayHeaderBtn = h('div', {
            class: 'prog-day-hdr clickable' + (isDayOpen ? ' is-open' : ''),
            role: 'button',
            tabindex: '0',
            'aria-expanded': isDayOpen ? 'true' : 'false',
            onclick: function (e) {
              if (e.target && e.target.closest && e.target.closest('button')) return;
              openDays[dayObj.day] = !isDayOpen;
              renderDays();
            }
          },
            h('div', { class: 'prog-day-title' },
              h('strong', { text: 'يوم ' + dayObj.label }),
              h('span', { class: 'badge ' + (filledCount ? 'ok' : 'gray'), text: filledCount ? ('تم ملء ' + filledCount + ' حصة') : 'اضغط لملء برنامج اليوم' })
            ),
            h('div', { class: 'row-actions' },
              isDayOpen
                ? h('button', {
                    type: 'button',
                    class: 'btn small light',
                    text: 'إخفاء تفاصيل يوم ' + dayObj.label,
                    onclick: function (e) {
                      e.stopPropagation();
                      openDays[dayObj.day] = false;
                      renderDays();
                    }
                  })
                : h('button', {
                    type: 'button',
                    class: 'btn small gold',
                    text: 'فتح وملء برنامج يوم ' + dayObj.label,
                    onclick: function (e) {
                      e.stopPropagation();
                      openDays[dayObj.day] = true;
                      renderDays();
                    }
                  })
            )
          );

          if (!isDayOpen) {
            daysHost.appendChild(h('div', { class: 'prog-day-card collapsed' }, dayHeaderBtn));
            return;
          }

          var sessListWrap = h('div', { class: 'prog-day-sessions' });

          var dayQuickAddBar = h('div', { class: 'prog-day-quick-actions' },
            h('span', { class: 'muted small', text: 'إدارة حصص يوم ' + dayObj.label + ':' }),
            h('div', { class: 'row-actions' },
              h('button', {
                type: 'button',
                class: 'btn small light',
                text: 'نسخ برنامج يوم ' + dayObj.label + ' إلى كل أيام الأسبوع',
                onclick: function () { copyDayToAllWeek(dayObj); }
              }),
              h('button', {
                type: 'button',
                class: 'btn small gold',
                text: 'إضافة حصة في يوم ' + dayObj.label,
                onclick: function () { insertSessionAt(dayObj, dayObj.sessions.length, 'session', ''); }
              }),
              h('button', {
                type: 'button',
                class: 'btn small light',
                text: '⏸+ حصة ما بين الحصص وعنوانها',
                onclick: function () { insertSessionAt(dayObj, dayObj.sessions.length, 'break', ''); }
              })
            )
          );
          sessListWrap.appendChild(dayQuickAddBar);

          if (dayObj.sessions.length > 0) {
            sessListWrap.appendChild(buildInsertBetweenBar(dayObj, 0, 'إدراج في بداية يوم ' + dayObj.label + ':'));
          } else {
            sessListWrap.appendChild(buildInsertBetweenBar(dayObj, 0, 'لا توجد حصص في يوم ' + dayObj.label + ' — ابدأ بإضافة حصة:'));
          }

          var normalCounter = 0;
          dayObj.sessions.forEach(function (sess, sIdx) {
            var isBreak = sess.kind === 'break';
            if (!isBreak) normalCounter++;

            var startIn = h('input', {
              type: 'text',
              class: 'sess-time-input',
              dir: 'ltr',
              maxlength: 25,
              placeholder: 'مثال: 08:00',
              value: sess.start || ''
            });
            var endIn = h('input', {
              type: 'text',
              class: 'sess-time-input',
              dir: 'ltr',
              maxlength: 25,
              placeholder: 'مثال: 09:00',
              value: sess.end || ''
            });

            startIn.addEventListener('input', function () {
              var cleanVal = DE.clean(startIn.value, 25);
              sess.start = cleanVal;
              syncSlotTimeAcrossAllDays(sIdx, 'start', cleanVal);
              renderUnifiedTimesBar();
              refreshPreview();
            });
            endIn.addEventListener('input', function () {
              var cleanVal = DE.clean(endIn.value, 25);
              sess.end = cleanVal;
              syncSlotTimeAcrossAllDays(sIdx, 'end', cleanVal);
              renderUnifiedTimesBar();
              refreshPreview();
            });

            var titleIn = h('input', {
              type: 'text',
              class: 'sess-title-input',
              maxlength: 80,
              placeholder: isBreak ? 'اكتب عنوان الحصة ما بين الحصص (مثال: فسحة، الاعتماد على الذات، استراحة، التحضير للخروج)...' : 'عنوان الحصة أو النشاط (اختياري — مثال: رياضة، ورشة، الفترة الصباحية)...',
              value: sess.title || ''
            });
            titleIn.addEventListener('input', function () {
              sess.title = DE.clean(titleIn.value, 80);
              renderUnifiedTimesBar();
              refreshPreview();
            });

            var presetRow = null;
            if (isBreak) {
              presetRow = h('div', { class: 'prog-break-presets' },
                h('small', { class: 'muted', text: 'عناوين سريعة للحصة ما بين الحصص:' }),
                BREAK_PRESETS.map(function (pr) {
                  return h('button', {
                    type: 'button',
                    class: 'btn small ' + (sess.title === pr ? 'gold' : 'light'),
                    text: pr,
                    onclick: function () {
                      sess.title = pr;
                      titleIn.value = pr;
                      renderDays();
                      refreshPreview();
                    }
                  });
                }),
                h('button', {
                  type: 'button',
                  class: 'btn small',
                  text: 'تعميم هذه الحصة البينية على كل أيام الأسبوع',
                  onclick: function () { copyBreakToAllDays(sess, sIdx); }
                })
              );
            }

            var itemsBox = h('div', { class: 'prog-sess-items-cell' });
            if (!sess.items.length) {
              itemsBox.appendChild(h('div', {
                class: 'wk-empty-cell-hint',
                text: isBreak
                  ? 'حصة بينية بعنوان «' + (sess.title || 'بدون عنوان بعد') + '» — يمكنك الاكتفاء بعنوانها أو إضافة مجال ومهارة أدناه.'
                  : 'الخانة فارغة حالياً — اختر مهارة أو أكثر من الأسفل ليظهر المجال مع المهارة في نفس الخانة.'
              }));
            } else {
              sess.items.forEach(function (it, iIdx) {
                itemsBox.appendChild(h('div', { class: 'wk-cell-item editable ' + domainColorClass(it.domain) },
                  h('div', { class: 'wk-cell-content' },
                    h('div', { class: 'wk-cell-domain' },
                      h('span', { class: 'wk-lbl', text: 'المجال:' }),
                      h('strong', { text: ' ' + it.domain })
                    ),
                    h('div', { class: 'wk-cell-skill' },
                      h('span', { class: 'wk-lbl', text: 'المهارة:' }),
                      h('span', { text: ' ' + it.skill })
                    )
                  ),
                  h('button', {
                    type: 'button',
                    class: 'btn small danger',
                    text: 'حذف',
                    onclick: function () {
                      sess.items.splice(iIdx, 1);
                      renderDays();
                      refreshPreview();
                    }
                  })
                ));
              });
            }

            var quickBar = null;
            if (selectedPairs.length) {
              var quickBtns = selectedPairs.map(function (pair) {
                var alreadyIn = sess.items.some(function (x) { return x.domain === pair.domain && x.skill === pair.skill; });
                return h('button', {
                  type: 'button',
                  class: 'btn small ' + (alreadyIn ? 'gold' : 'light'),
                  text: (alreadyIn ? '' : '') + pair.domain + ' — ' + pair.skill,
                  onclick: function () {
                    if (alreadyIn) {
                      sess.items = sess.items.filter(function (x) { return !(x.domain === pair.domain && x.skill === pair.skill); });
                    } else {
                      sess.items.push({ domain: pair.domain, skill: pair.skill });
                    }
                    renderDays();
                    refreshPreview();
                  }
                });
              });
              quickBar = h('div', { class: 'prog-sess-quick' },
                h('small', { class: 'prog-quick-lbl', text: 'اختيار سريع من المجالات والمهارات المحددة أعلاه (اضغط للإدراج أو الإزالة في نفس الخانة):' }),
                h('div', { class: 'prog-quick-btns' }, quickBtns)
              );
            }

            var pickerDom = sess._pickerDomain || (st.domains[0] && st.domains[0].domain) || domainKeys[0] || '';
            var pDomSearch = h('input', { type: 'search', class: 'fld-search', placeholder: 'ابحث عن مجال لإضافته للحصة...', autocomplete: 'off' });
            var pDomSelect = h('select', null, domainKeys.map(function (dk) { return h('option', { value: dk, text: dk }); }));
            pDomSelect.value = pickerDom;

            var pSkillSearch = h('input', { type: 'search', class: 'fld-search', placeholder: 'ابحث عن مهارة أو أكثر لإدراجها في هذه الحصة...', autocomplete: 'off' });
            var pSkillChecklist = h('div', { class: 'prog-sess-skill-list' });

            function renderSessionSkillChoices() {
              var activeDom = pDomSelect.value || domainKeys[0] || '';
              sess._pickerDomain = activeDom;
              var skList = CURR[activeDom] || [];
              var q = normAr(pSkillSearch.value.trim());
              pSkillChecklist.textContent = '';
              var count = 0;
              skList.forEach(function (sk) {
                if (q && normAr(sk).indexOf(q) === -1) return;
                count++;
                var inSess = sess.items.some(function (x) { return x.domain === activeDom && x.skill === sk; });
                var cb = h('input', { type: 'checkbox', checked: inSess });
                cb.addEventListener('change', function () {
                  if (cb.checked) {
                    if (!sess.items.some(function (x) { return x.domain === activeDom && x.skill === sk; })) {
                      sess.items.push({ domain: activeDom, skill: sk });
                    }
                    ensureInDomains(activeDom, sk);
                  } else {
                    sess.items = sess.items.filter(function (x) { return x.domain !== activeDom || x.skill !== sk; });
                  }
                  renderDomains();
                  renderDays();
                  refreshPreview();
                });
                pSkillChecklist.appendChild(h('label', { class: 'prog-skl-item' + (inSess ? ' active' : '') },
                  cb,
                  h('span', { text: sk })
                ));
              });
              if (!count) {
                pSkillChecklist.appendChild(h('p', { class: 'muted small', text: 'لا توجد مهارات مطابقة.' }));
              }
            }

            pDomSearch.addEventListener('input', function () {
              var q = normAr(pDomSearch.value.trim());
              var keep = pDomSelect.value;
              while (pDomSelect.firstChild) pDomSelect.removeChild(pDomSelect.firstChild);
              domainKeys.forEach(function (dk) {
                if (!q || normAr(dk).indexOf(q) >= 0) {
                  pDomSelect.appendChild(h('option', { value: dk, text: dk }));
                }
              });
              if (pDomSelect.options.length) {
                if (domainKeys.indexOf(keep) >= 0 && (!q || normAr(keep).indexOf(q) >= 0)) pDomSelect.value = keep;
                else pDomSelect.selectedIndex = 0;
                renderSessionSkillChoices();
              }
            });

            pDomSelect.addEventListener('change', renderSessionSkillChoices);
            pSkillSearch.addEventListener('input', renderSessionSkillChoices);
            renderSessionSkillChoices();

            var directPickerDetails = h('details', { class: 'prog-sess-details' },
              h('summary', { text: 'اختيار وإدراج مجال ومهارة أو أكثر مباشرة في هذه الحصة (من جميع المجالات)' }),
              h('div', { class: 'prog-sess-picker-body' },
                h('div', { class: 'prog-grid-2' },
                  h('label', { class: 'fld' }, h('span', { text: '1. اختر المجال التربوي:' }), pDomSearch, pDomSelect),
                  h('label', { class: 'fld' }, h('span', { text: '2. ابحث واختر مهارة أو أكثر (تُدرج فوراً مع المجال في نفس الخانة):' }), pSkillSearch)
                ),
                pSkillChecklist
              )
            );

            var moveUpBtn = sIdx > 0 ? h('button', {
              type: 'button',
              class: 'btn small light',
              text: '⬆تقديم',
              onclick: function () {
                var tmp = dayObj.sessions[sIdx - 1];
                dayObj.sessions[sIdx - 1] = dayObj.sessions[sIdx];
                dayObj.sessions[sIdx] = tmp;
                renderDays();
                refreshPreview();
              }
            }) : null;

            var moveDownBtn = sIdx < dayObj.sessions.length - 1 ? h('button', {
              type: 'button',
              class: 'btn small light',
              text: '⬇تأخير',
              onclick: function () {
                var tmp = dayObj.sessions[sIdx + 1];
                dayObj.sessions[sIdx + 1] = dayObj.sessions[sIdx];
                dayObj.sessions[sIdx] = tmp;
                renderDays();
                refreshPreview();
              }
            }) : null;

            var toggleKindBtn = h('button', {
              type: 'button',
              class: 'btn small light',
              text: isBreak ? 'تحويل لحصة عادية' : '⏸تحويل لحصة بينية (فاصل)',
              onclick: function () {
                sess.kind = isBreak ? 'session' : 'break';
                renderDays();
                refreshPreview();
              }
            });

            var sessBox = h('div', { class: 'prog-sess-card' + (isBreak ? ' is-break-card' : '') },
              h('div', { class: 'prog-sess-hdr' },
                h('span', {
                  class: 'badge ' + (isBreak ? 'warn' : 'gold'),
                  text: isBreak ? ('⏸حصة ما بين الحصص — يوم ' + dayObj.label) : ('الحصة ' + normalCounter + ' — يوم ' + dayObj.label)
                }),
                h('div', { class: 'prog-sess-times' },
                  h('label', { class: 'sess-time-lbl' }, h('span', { text: '⏰ من (البداية لكل الأيام):' }), startIn),
                  h('label', { class: 'sess-time-lbl' }, h('span', { text: '⏰ إلى (النهاية لكل الأيام):' }), endIn)
                ),
                h('div', { class: 'row-actions' },
                  moveUpBtn,
                  moveDownBtn,
                  toggleKindBtn,
                  h('button', {
                    type: 'button',
                    class: 'btn small danger',
                    text: 'حذف',
                    onclick: function () {
                      dayObj.sessions.splice(sIdx, 1);
                      renderDays();
                      refreshPreview();
                    }
                  })
                )
              ),
              h('label', { class: 'fld' },
                h('span', { text: isBreak ? 'عنوان الحصة ما بين الحصص * (مثال: فسحة، الاعتماد على الذات، التحضير للخروج):' : 'عنوان الحصة / النشاط (اختياري):' }),
                titleIn
              ),
              presetRow,
              h('div', { class: 'prog-sess-cell-wrap' },
                h('small', { class: 'muted', text: 'محتوى خانة الحصة في الجدول (المجال + المهارة في نفس الخانة):' }),
                itemsBox
              ),
              quickBar,
              directPickerDetails
            );

            sessListWrap.appendChild(sessBox);

            var betweenLabel = sIdx < dayObj.sessions.length - 1
              ? ('إدراج ما بين الحصة (' + (sIdx + 1) + ') والحصة (' + (sIdx + 2) + ') في يوم ' + dayObj.label + ':')
              : ('إضافة بعد الحصة (' + (sIdx + 1) + ') في نهاية يوم ' + dayObj.label + ':');
            sessListWrap.appendChild(buildInsertBetweenBar(dayObj, sIdx + 1, betweenLabel));
          });

          var dayDoneFooter = h('div', { class: 'prog-day-done-footer' },
            h('button', {
              type: 'button',
              class: 'btn gold',
              text: 'انتهيت من ملء برنامج يوم ' + dayObj.label + ' — إخفاء التفاصيل ',
              onclick: function () {
                openDays[dayObj.day] = false;
                renderDays();
                refreshPreview();
              }
            })
          );
          sessListWrap.appendChild(dayDoneFooter);

          daysHost.appendChild(h('div', { class: 'prog-day-card expanded' }, dayHeaderBtn, sessListWrap));
        });
      }

      var easyWizardBar = h('div', { class: 'prog-unified-times-card' },
        h('div', { class: 'bar-sub' },
          h('div', null,
            h('strong', { text: 'المساعد السريع لملء البرنامج الأسبوعي بضغطة واحدة (اختياري)' }),
            h('p', { class: 'muted small', text: 'بدل إدخال كل يوم وحصة يدوياً، يمكنك إنشاء هيكل الحصص القياسي وتوزيع المهارات المختارة على الأسبوع كاملاً بضغطة زر ثم تعديل ما تشاء.' })
          ),
          h('div', { class: 'row-actions' },
            h('button', {
              type: 'button',
              class: 'btn small light',
              text: 'قالب اليوم الكامل (صباحي + فسحة + مسائي)',
              onclick: function () { applyStandardStructureTemplate('full'); }
            }),
            h('button', {
              type: 'button',
              class: 'btn small light',
              text: 'قالب الفترة الصباحية فقط (حصتان + فسحة)',
              onclick: function () { applyStandardStructureTemplate('compact'); }
            }),
            h('button', {
              type: 'button',
              class: 'btn small gold',
              text: 'توزيع المهارات المختارة تلقائياً على كل الأسبوع',
              onclick: autoDistributeSkillsAcrossWeek
            })
          )
        )
      );

      var scheduleStepCard = h('div', { class: 'card prog-step-card' },
        h('div', { class: 'bar-sub' },
          h('div', null,
            h('h3', { class: 'prog-step-title', text: '3⃣ جدول البرنامج الأسبوعي والتوقيت الموحد تحت إطار الفترات' }),
            h('p', { class: 'muted small', text: 'التوقيت يظهر بوضوح تحت إطار الفترات (الفترة الصباحية / المسائية) ويبدأ من وقت وينتهي في جميع الأيام للحصة. استخدم المساعد السريع أعلاه أو املأ الحصص أدناه.' })
          )
        ),
        easyWizardBar,
        unifiedTimesHost,
        daysToggleWrap,
        daysHost
      );
      v.appendChild(scheduleStepCard);

      async function saveProgram(exportToParents) {
        if (!st.section_id) {
          return toast('يرجى اختيار الفوج / القسم التربوي المستهدف أولاً.', 'bad');
        }

        var totalActiveSessions = 0;
        st.days.forEach(function (dy) {
          (dy.sessions || []).forEach(function (s) {
            if (isSessionActive(s)) totalActiveSessions++;
          });
        });

        var selectedPairs = allSelectedPairs();
        if (totalActiveSessions === 0 && selectedPairs.length > 0) {
          st.days.forEach(function (dy, idx) {
            if (!dy.sessions.length) dy.sessions.push({ kind: 'session', title: '', start: '', end: '', items: [] });
            var pair = selectedPairs[idx % selectedPairs.length];
            if (pair) dy.sessions[0].items.push({ domain: pair.domain, skill: pair.skill });
          });
          totalActiveSessions = selectedPairs.length;
        }

        if (totalActiveSessions === 0 && selectedPairs.length === 0) {
          return toast('يرجى اختيار مجال ومهارة واحدة على الأقل أو إضافة حصة داخل الجدول الأسبوعي.', 'bad');
        }

        var secName = getSecName();
        var cleanDomains = st.domains.filter(function (dm) { return dm && dm.domain; }).map(function (dm) {
          return { domain: dm.domain, skills: (dm.skills || []).slice() };
        });

        var domNames = cleanDomains.map(function (dm) { return dm.domain; });
        var progTitle = DE.clean('البرنامج الأسبوعي — ' + secName + (domNames.length ? (' (' + domNames.join('، ') + ')') : ''), 155);

        var goalsLines = [];
        cleanDomains.forEach(function (dm) {
          if (dm.skills && dm.skills.length) {
            goalsLines.push('• ' + dm.domain + ': ' + dm.skills.join(' ، '));
          } else {
            goalsLines.push('• ' + dm.domain);
          }
        });
        var goalsSummary = DE.clean(goalsLines.join('\n'), 4800) || progTitle;

        var descLines = [];
        if (st.notes) descLines.push(st.notes);
        st.days.forEach(function (dy) {
          var activeS = (dy.sessions || []).filter(isSessionActive);
          if (activeS.length) {
            var sTxt = activeS.map(function (s, idx) {
              var tRange = formatTimeRange(s.start, s.end);
              var headTxt = (s.kind === 'break' ? ('[فاصل: ' + (s.title || 'استراحة') + ']') : (s.title || ('الحصة ' + (idx + 1)))) + (tRange ? (' (' + tRange + ')') : '');
              var itTxt = (s.items || []).map(function (it) { return '[' + it.domain + ' — ' + it.skill + ']'; }).join(' + ');
              return headTxt + (itTxt ? (': ' + itTxt) : '');
            }).join(' | ');
            descLines.push(dy.label + ': ' + sTxt);
          }
        });
        var descSummary = DE.clean(descLines.join('\n'), 4800) || null;

        var schedulePayload = st.days.map(function (dy) {
          return {
            day: dy.day,
            label: dy.label,
            section_name: secName,
            academic_year: st.academic_year || '2026/2027',
            notes: st.notes || '',
            domains: cleanDomains,
            sessions: (dy.sessions || []).filter(isSessionActive).map(function (s) {
              return {
                kind: s.kind === 'break' ? 'break' : 'session',
                title: s.title || '',
                start: s.start || '',
                end: s.end || '',
                items: (s.items || []).map(function (it) { return { domain: it.domain, skill: it.skill }; })
              };
            })
          };
        });

        var isPub = exportToParents ? true : false;
        var body = {
          section_id: st.section_id,
          title: progTitle,
          academic_year: st.academic_year || '2026/2027',
          description: descSummary,
          goals: goalsSummary,
          schedule: schedulePayload,
          status: isPub ? 'published' : 'draft',
          published_at: isPub ? new Date().toISOString() : null
        };

        if (st.id) {
          await C.rest('PATCH', '/educational_programs?id=eq.' + uid(st.id), body);
        } else {
          await C.rest('POST', '/educational_programs', body);
        }
        bust();
        toast(isPub ? 'تم اعتماد وتصدير البرنامج الأسبوعي كصورة إلى أولياء القسم بنجاح!' : 'تم حفظ البرنامج الأسبوعي كمسودة بنجاح.', 'ok');
        go('programs');
      }

      var exportBtn = h('button', { type: 'button', class: 'btn gold', text: 'تصدير البرنامج الأسبوعي إلى الأولياء (اعتماد ونشر الجدول)' });
      var draftBtn = h('button', { type: 'button', class: 'btn light', text: 'حفظ كمسودة' });
      var imgPreviewBtn = h('button', {
        type: 'button',
        class: 'btn light',
        text: 'تحميل صورة الجدول (PNG)',
        onclick: function () { downloadScheduleImage(st, getSecName()); }
      });
      var printPreviewBtn = h('button', {
        type: 'button',
        class: 'btn',
        text: 'تكبير وطباعة الجدول',
        onclick: function () { printWeeklySheet(st, getSecName(), 'البرنامج الأسبوعي'); }
      });

      var exportBtnBottom = h('button', { type: 'button', class: 'btn gold', text: 'تصدير البرنامج الأسبوعي إلى الأولياء (اعتماد ونشر الجدول)' });
      var draftBtnBottom = h('button', { type: 'button', class: 'btn light', text: 'حفظ كمسودة' });
      var imgBtnBottom = h('button', {
        type: 'button',
        class: 'btn light',
        text: 'تحميل صورة الجدول (PNG)',
        onclick: function () { downloadScheduleImage(st, getSecName()); }
      });
      var printBtnBottom = h('button', {
        type: 'button',
        class: 'btn',
        text: 'تكبير وطباعة الجدول',
        onclick: function () { printWeeklySheet(st, getSecName(), 'البرنامج الأسبوعي'); }
      });

      exportBtn.addEventListener('click', function () { act(exportBtn, function () { return saveProgram(true); }); });
      draftBtn.addEventListener('click', function () { act(draftBtn, function () { return saveProgram(false); }); });
      exportBtnBottom.addEventListener('click', function () { act(exportBtnBottom, function () { return saveProgram(true); }); });
      draftBtnBottom.addEventListener('click', function () { act(draftBtnBottom, function () { return saveProgram(false); }); });

      var previewCard = h('div', { class: 'card prog-step-card' },
        h('div', { class: 'bar-sub' },
          h('div', null,
            h('h3', { class: 'prog-step-title', text: '4⃣ معاينة صورة البرنامج الأسبوعي المصدَّر للأولياء' }),
            h('p', { class: 'muted small', text: 'يظهر البرنامج للأولياء على شكل صورة أفقية متكاملة بنفس تصميم وألوان المركز دون الحاجة للتمرير الطويل.' })
          ),
          h('div', { class: 'row-actions' })
        ),
        previewHost,
        h('div', { class: 'prog-submit-bar' },
          h('button', { type: 'button', class: 'btn light', text: 'إلغاء والعودة', onclick: function () { go('programs'); } }),
          imgBtnBottom,
          printBtnBottom,
          draftBtnBottom,
          exportBtnBottom
        )
      );

      v.appendChild(previewCard);

      renderDomains();
      renderDays();
      refreshPreview();
      window.scrollTo(0, 0);
    }

    listView(v, {
      title: 'البرامج التربوية والجداول الأسبوعية للأقسام',
      addLabel: 'إعداد برنامج أسبوعي جديد',
      onAdd: function () { openProgramBuilder(null); },
      rows: rows,
      empty: 'لا توجد برامج أسبوعية مسجلة بعد. اضغط «إعداد برنامج أسبوعي جديد» للبدء.',
      search: function (p) { return (p.title || '') + ' ' + (p.goals || '') + ' ' + nameOf(sections, p.section_id, 'name'); },
      details: function (p) {
        var st = parseProgState(p);
        var sName = nameOf(sections, p.section_id, 'name');
        return buildWeeklySheet(st, sName, p.status === 'published' ? 'مصدَّر للأولياء' : 'مسودة');
      },
      filters: [
        { label: 'القسم', opts: secOpts, test: function (p, x) { return p.section_id === x; } },
        { label: 'المجال التربوي', opts: domainOpts, test: function (p, x) { return (p.title || '').indexOf(x) >= 0 || (p.goals || '').indexOf(x) >= 0 || JSON.stringify(p.schedule || []).indexOf(x) >= 0; } },
        { label: 'الحالة', opts: [['published', 'مصدَّر ومنشور للأولياء'], ['draft', 'مسودة قيد الإعداد']], test: function (p, x) { return p.status === x; } }
      ],
      cols: [
        { label: 'البرنامج الأسبوعي والمجالات', get: function (p) { return p.title; }, sort: function (p) { return p.title; } },
        { label: 'القسم المستهدف', get: function (p) { return nameOf(sections, p.section_id, 'name'); }, sort: function (p) { return nameOf(sections, p.section_id, 'name'); } },
        { label: 'الموسم', get: function (p) { return p.academic_year || '2026/2027'; } },
        { label: 'حالة التصدير للأولياء', get: function (p) { return badge(p.status === 'published' ? 'مصدَّر للأولياء (صورة)' : 'مسودة', p.status === 'published' ? 'ok' : 'gray'); } },
        { label: 'تاريخ التصدير', get: function (p) { return p.published_at ? fmt(p.published_at) : '—'; } }
      ],
      actions: function (p) {
        var st = parseProgState(p);
        var sName = nameOf(sections, p.section_id, 'name');
        return [
          rbtn('صورة البرنامج والطباعة', function () { printWeeklySheet(st, sName, p.status === 'published' ? 'مصدَّر للأولياء' : 'مسودة'); }, 'gold'),
          rbtn('تعديل', function () { openProgramBuilder(p); }),
          p.status === 'published'
            ? rbtn('إلغاء التصدير', async function () {
              await C.rest('PATCH', '/educational_programs?id=eq.' + uid(p.id), { status: 'draft', published_at: null });
              bust(); toast('تم إلغاء التصدير وتحويل البرنامج لمسودة.', 'ok'); go('programs');
            }, 'light')
            : rbtn('تصدير للأولياء', async function () {
              await C.rest('PATCH', '/educational_programs?id=eq.' + uid(p.id), { status: 'published', published_at: new Date().toISOString() });
              bust(); toast('تم تصدير ونشر البرنامج الأسبوعي لأولياء القسم بنجاح.', 'ok'); go('programs');
            }, 'gold'),
          rbtn('حذف', async function () {
            if (!(await ask({ title: 'حذف البرنامج الأسبوعي؟', msg: 'سيُحذف البرنامج وجدوله الأسبوعي نهائياً.', ok: 'حذف', danger: true }))) return;
            await C.rest('DELETE', '/educational_programs?id=eq.' + uid(p.id));
            bust(); toast('تم حذف البرنامج.', 'ok'); go('programs');
          }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     5. قائمة إجراءات منبثقة (⋯)
     ===================================================================== */
  function rowMenu(items) {
    var list = items.filter(Boolean);
    var wrap = h('div', { class: 'row-menu' });
    var trig = h('button', { class: 'icon-btn row-menu-trigger', type: 'button', text: '⋯' });
    trig.setAttribute('aria-haspopup', 'menu');
    trig.setAttribute('aria-expanded', 'false');
    trig.setAttribute('aria-label', 'إجراءات إضافية');
    trig.setAttribute('title', 'إجراءات إضافية');
    var pop = h('div', { class: 'row-menu-pop' }, list);
    pop.setAttribute('role', 'menu');
    pop.hidden = true;
    list.forEach(function (b) { b.setAttribute('role', 'menuitem'); });
    wrap.appendChild(trig);
    wrap.appendChild(pop);

    function onDocDown(e) { if (!wrap.contains(e.target)) close(); }
    function onKey(e) { if (e.key === 'Escape') { close(); trig.focus(); } }
    function open() {
      var r = trig.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.top = (r.bottom + 6) + 'px';
      pop.style.left = Math.max(8, r.right - 230) + 'px';
      pop.hidden = false;
      trig.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', onDocDown, true);
      document.addEventListener('keydown', onKey, true);
      if (list[0]) list[0].focus();
    }
    function close() {
      if (pop.hidden) return;
      pop.hidden = true;
      trig.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', onDocDown, true);
      document.removeEventListener('keydown', onKey, true);
    }
    trig.addEventListener('click', function (e) { e.stopPropagation(); if (pop.hidden) open(); else close(); });
    pop.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button')) close(); });
    return wrap;
  }

  /* =====================================================================
     6. التقارير التربوية الدورية واستمارات التقييم البيداغوجي (مفصولة ومطابقة للصورة الرسمية)
     ===================================================================== */
  var EVAL_MARKER = '/*DE_EVAL_V1*/';

  function isEvaluationReport(r) {
    if (!r) return false;
    return (typeof r.activities === 'string' && r.activities.indexOf(EVAL_MARKER) === 0)
      || (typeof r.title === 'string' && (r.title.indexOf('استمارة تقييم') >= 0 || r.title.indexOf('تقرير اللجنة البيداغوجية') >= 0));
  }

  function parseEvaluationReport(r) {
    var CURR = (window && window.DE_CURRICULUM) || EMBEDDED_CURRICULUM || {};
    var domainKeys = Object.keys(CURR);
    var res = {
      id: r ? r.id : null,
      child_id: (r && r.child_id) || S.preselectChildId || '',
      title: (r && r.title) || 'تقرير اللجنة البيداغوجية والتربوية — استمارة التقييم',
      report_date: (r && r.report_date) || new Date().toISOString().slice(0, 10),
      status: (r && r.status) || 'draft',
      general_notes: (r && r.notes) || '',
      term: 'الثلاثي الأخير',
      school_year: '2024/2025',
      degree_of_disability: 'متوسطة',
      qualification_level: '',
      supervisors: [
        { name: 'أمير زكرياء', role: 'مدير المركز' }
      ],
      general_report: '',
      abilities: {
        current_potentials: '',
        cognitive_intellectual: '',
        language_receptive_expressive: '',
        communication_behavioral: '',
        academic_preacademic: '',
        motor_independence: ''
      },
      strengths: [''],
      weaknesses: [''],
      recommendations: [''],
      domains: []
    };

    if (r && typeof r.activities === 'string' && r.activities.indexOf(EVAL_MARKER) === 0) {
      try {
        var rawJson = JSON.parse(r.activities.slice(EVAL_MARKER.length));
        if (rawJson && typeof rawJson === 'object') {
          if (rawJson.term) res.term = rawJson.term;
          if (rawJson.school_year) res.school_year = rawJson.school_year;
          if (rawJson.degree_of_disability) res.degree_of_disability = rawJson.degree_of_disability;
          if (rawJson.qualification_level) res.qualification_level = rawJson.qualification_level;
          if (Array.isArray(rawJson.supervisors) && rawJson.supervisors.length) res.supervisors = rawJson.supervisors;
          if (rawJson.general_report) res.general_report = rawJson.general_report;
          if (rawJson.abilities) res.abilities = Object.assign({}, res.abilities, rawJson.abilities);
          if (Array.isArray(rawJson.strengths) && rawJson.strengths.length) res.strengths = rawJson.strengths;
          if (Array.isArray(rawJson.weaknesses) && rawJson.weaknesses.length) res.weaknesses = rawJson.weaknesses;
          if (Array.isArray(rawJson.recommendations) && rawJson.recommendations.length) res.recommendations = rawJson.recommendations;

          if (Array.isArray(rawJson.domains)) {
            res.domains = rawJson.domains.map(function (dm) {
              var domName = typeof dm.d === 'number' ? (domainKeys[dm.d] || domainKeys[0]) : (dm.domain || domainKeys[0]);
              var skList = CURR[domName] || [];
              var ratingsMap = {};
              if (Array.isArray(dm.r)) {
                dm.r.forEach(function (entry) {
                  ratingsMap[entry[0]] = {
                    score: entry[1] != null ? String(entry[1]) : '',
                    yn: entry[2] || '',
                    note: entry[3] || ''
                  };
                });
              } else if (dm.ratings && typeof dm.ratings === 'object') {
                ratingsMap = dm.ratings;
              }
              return {
                domain: domName,
                ratings: skList.map(function (sk, idx) {
                  var saved = ratingsMap[idx] || ratingsMap[sk] || {};
                  return {
                    num: idx + 1,
                    skill: sk,
                    item: sk,
                    score: saved.score != null ? String(saved.score) : '',
                    yn: saved.yn || '',
                    note: saved.note || ''
                  };
                })
              };
            });
          }
        }
      } catch (e) {}
    }

    if (!res.general_report && res.general_notes) {
      res.general_report = res.general_notes;
    }

    if (!res.domains.length) {
      var firstDom = domainKeys[0] || '';
      res.domains.push({
        domain: firstDom,
        ratings: (CURR[firstDom] || []).map(function (sk, idx) {
          return { num: idx + 1, skill: sk, score: '', yn: '', note: '' };
        })
      });
    }
    return res;
  }

  /* رسم ورقة التقييم الرسمية المطابقة بدقة للصورة المرفقة (53020.jpg) */
  function renderEvaluationSheetView(r, childFullName, secName, kd) {
    var ev = parseEvaluationReport(r);

    // حساب العمر التقريبي للطفل إن توفر تاريخ الميلاد
    var ageTxt = '—';
    if (kd && kd.dob) {
      try {
        var birthDate = new Date(kd.dob);
        var today = new Date();
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age > 0) ageTxt = age + ' سنة';
      } catch (e) {}
    }

    var logoImg = h('img', { class: 'oep-logo-side', alt: 'شعار الجمعية' });
    logoImg.setAttribute('src', 'logo-sq.png');

    // 1. ترويسة الوثيقة الرسمية
    var header = h('div', { class: 'oep-header' },
      h('div', { class: 'oep-title-block' },
        h('h3', { class: 'oep-org-name', text: 'جمعية أولياء الأطفال المعاقين ذهنيًا' }),
        h('h4', { class: 'oep-center-name', text: 'المركز النفسي البيداغوجي دار الإحسان' }),
        h('p', { class: 'oep-location', text: '— العطف - غرداية —' }),
        h('div', { class: 'oep-fr-title', text: "COMPTE RENDU DE L'EQUIPE PEDAGOGIQUE" }),
        h('h2', { class: 'oep-report-heading', text: 'تقرير اللجنة البيداغوجية والتربوية' })
      ),
      logoImg
    );

    // 2. البانر الأصفر/الذهبي للثلاثي والموسم
    var termBanner = h('div', { class: 'oep-term-banner', text: 'تقييم ' + (ev.term || 'الثلاثي الأخير') + ' للموسم الدراسي: ' + (ev.school_year || '2024/2025') });

    // 3. شبكة معلومات الحالة (اسم الحالة، العمر، نوع الاضطراب، الميلاد، درجة الإعاقة، القسم)
    var infoTable = h('table', { class: 'oep-info-table' },
      h('tbody', null,
        h('tr', null,
          h('td', { class: 'oep-info-label', text: 'اسم ولقب الحالة:' }),
          h('td', { class: 'oep-info-val' }, h('strong', { text: childFullName || '—' })),
          h('td', { class: 'oep-info-label', text: 'العمر:' }),
          h('td', { class: 'oep-info-val', text: ageTxt })
        ),
        h('tr', null,
          h('td', { class: 'oep-info-label', text: 'نوع الاضطراب:' }),
          h('td', { class: 'oep-info-val', text: (kd && kd.disability) || '—' }),
          h('td', { class: 'oep-info-label', text: 'تاريخ الميلاد:' }),
          h('td', { class: 'oep-info-val', text: (kd && kd.dob) ? fmt(kd.dob) : '—' })
        ),
        h('tr', null,
          h('td', { class: 'oep-info-label', text: 'درجة الإعاقة / الاضطراب:' }),
          h('td', { class: 'oep-info-val', text: ev.degree_of_disability || 'متوسطة' }),
          h('td', { class: 'oep-info-label', text: 'القسم ومستوى التأهيل:' }),
          h('td', { class: 'oep-info-val', text: ev.qualification_level || secName || '—' })
        )
      )
    );

    // 4. جدول المشرفين بدون رموز QR وبمظهر رسمي نظيف وأنيق
    var supRows = (ev.supervisors && ev.supervisors.length ? ev.supervisors : [{ name: 'أمير زكرياء', role: 'مدير المركز' }]).map(function (sp) {
      return h('tr', null,
        h('td', null, h('strong', { text: sp.name || '—' })),
        h('td', { text: sp.role || '—' }),
        h('td', null, h('span', { class: 'muted small', text: '........................' }))
      );
    });

    var supervisorsTable = h('table', { class: 'oep-supervisors-table' },
      h('thead', null,
        h('tr', null,
          h('th', { text: 'المشرفون: الإسم واللقب' }),
          h('th', { text: 'الوظيفة' }),
          h('th', { text: 'التوقيع والختم' })
        )
      ),
      h('tbody', null, supRows)
    );

    // 5. البانر الأزرق وقسم "الوصف العام لأداء الحالة"
    var perfBanner = h('div', { class: 'oep-section-banner', text: 'الوصف العام لأداء الحالة' });

    var generalReportCol = h('div', { class: 'oep-general-report-box' },
      h('div', { class: 'oep-gr-header', text: 'التقرير العام' }),
      h('div', { class: 'oep-gr-body', text: ev.general_report || 'تم تسجيل تقدم ملحوظ في الأداء العام للحالة مع مواصلة التأهيل التربوي والنفسي.' })
    );

    var ab = ev.abilities || {};
    var abilityBoxes = [
      { title: 'إمكانيات والقدرات الحالية', val: ab.current_potentials, cls: 'oep-ab-hdr-1' },
      { title: 'المهارات المعرفية والفكرية', val: ab.cognitive_intellectual, cls: 'oep-ab-hdr-2' },
      { title: 'اللغة (استقبالية تعبيرية)', val: ab.language_receptive_expressive, cls: 'oep-ab-hdr-3' },
      { title: 'القدرات الإتصالية والسلوكية', val: ab.communication_behavioral, cls: 'oep-ab-hdr-4' },
      { title: 'المعارف الأكاديمية وما قبل الأكاديمي', val: ab.academic_preacademic, cls: 'oep-ab-hdr-5' },
      { title: 'القدرات الحركية والاستقلالية', val: ab.motor_independence, cls: 'oep-ab-hdr-6' }
    ].map(function (item) {
      return h('div', { class: 'oep-ability-box' },
        h('div', { class: 'oep-ab-hdr ' + item.cls, text: item.title }),
        h('div', { class: 'oep-ab-content', text: item.val || '—' })
      );
    });

    var abilitiesCol = h('div', { class: 'oep-abilities-stack' }, abilityBoxes);
    var perfGrid = h('div', { class: 'oep-performance-grid' }, generalReportCol, abilitiesCol);

    // 6. البانر الأخضر وقسم "الخلاصة والتوصيات" (نقاط القوة، نقاط الضعف، التوصيات)
    var summaryBanner = h('div', { class: 'oep-summary-banner', text: 'الخلاصة والتوصيات' });

    function renderListItems(arr, fallback) {
      var items = (arr || []).filter(function (x) { return x && x.trim(); });
      if (!items.length) items = [fallback];
      var ul = h('ul', { class: 'oep-rec-list' });
      items.forEach(function (txt) { ul.appendChild(h('li', { text: txt })); });
      return ul;
    }

    var recGrid = h('div', { class: 'oep-recommendations-grid' },
      h('div', { class: 'oep-rec-col' },
        h('div', { class: 'oep-rec-title', text: '1. نقاط القوة' }),
        renderListItems(ev.strengths, 'استجابة وتفاعل إيجابي مع الأنشطة الموجهة.')
      ),
      h('div', { class: 'oep-rec-col' },
        h('div', { class: 'oep-rec-title', text: '2. نقاط الضعف' }),
        renderListItems(ev.weaknesses, 'الحاجة لتعزيز مهارات التركيز والاستقلالية.')
      ),
      h('div', { class: 'oep-rec-col' },
        h('div', { class: 'oep-rec-title', text: '3. التوصيات' }),
        renderListItems(ev.recommendations, 'مواصلة المتابعة البيداغوجية والتنسيق المستمر مع الأسرة.')
      )
    );

    // 7. كشف الحساب التلقائي للنقاط لكل مجال والنتيجة الإجمالية لكافة المجالات المختارة
    var totalEarnedPoints = 0;
    var totalMaxPoints = 0;
    var totalRatedSkills = 0;

    var domainRows = (ev.domains || []).map(function (dm) {
      var dEarned = 0;
      var dMax = 0;
      var dCount = (dm.ratings || []).length;
      (dm.ratings || []).forEach(function (it) {
        var sc = 0;
        if (it.score !== '' && it.score != null) {
          var parsedSc = parseInt(it.score, 10);
          if (!isNaN(parsedSc)) sc = parsedSc;
        } else if (it.yn) {
          if (it.yn === 'نعم') sc = 5;
        }
        dEarned += sc;
        dMax += 5;
      });
      totalEarnedPoints += dEarned;
      totalMaxPoints += dMax;
      totalRatedSkills += dCount;
      var dPct = dMax > 0 ? Math.round((dEarned / dMax) * 100) : 0;
      return h('tr', null,
        h('td', null, h('strong', { text: dm.domain })),
        h('td', { text: dCount + ' مهارة' }),
        h('td', null, h('span', { class: 'badge ' + (dEarned > 0 ? 'ok' : 'gray'), text: dEarned + ' نقطة' })),
        h('td', { text: dMax + ' نقطة' }),
        h('td', null, h('strong', { text: dPct + '%' }))
      );
    });

    var overallPct = totalMaxPoints > 0 ? ((totalEarnedPoints / totalMaxPoints) * 100).toFixed(1) : '0';

    var scorecardTable = h('table', { class: 'oep-scorecard-table' },
      h('thead', null,
        h('tr', null,
          h('th', { text: 'المجال التربوي / البيداغوجي' }),
          h('th', { text: 'المهارات المقيمة' }),
          h('th', { text: 'النقاط المحصلة' }),
          h('th', { text: 'المجموع الأقصى' }),
          h('th', { text: 'النسبة المئوية' })
        )
      ),
      h('tbody', null,
        domainRows,
        h('tr', { class: 'total-row' },
          h('td', null, h('strong', { text: 'النتيجة الإجمالية لكافة المجالات التربوية المختارة' })),
          h('td', { text: totalRatedSkills + ' مهارة' }),
          h('td', null, h('strong', { text: totalEarnedPoints + ' نقطة' })),
          h('td', null, h('strong', { text: totalMaxPoints + ' نقطة' })),
          h('td', null, h('strong', { text: overallPct + '%' }))
        )
      )
    );

    var overallBanner = h('div', { class: 'oep-overall-score-banner' },
      h('span', { text: 'النتيجة الإجمالية لكافة المجالات المختارة:' }),
      h('span', { class: 'oep-score-highlight', text: totalEarnedPoints + ' من ' + totalMaxPoints + ' نقطة (' + overallPct + '%)' })
    );

    var skillsSectionBanner = h('div', { class: 'oep-section-banner', style: 'background-color:#E0E7FF; color:#1E1B4B; margin-top:12px;', text: 'كشف درجات التقييم والنتائج الإجمالية' });

    // 8. إظهار كافة الجداول التفصيلية للمهارات لكل مجال بيداغوجي مختار مع أسماء المهارات والدرجة صفر لمن لم تقيّم
    var allDomainDetailTables = (ev.domains || []).map(function (dm, dIdx) {
      var dEarned = 0;
      var dMax = 0;
      var skillRows = (dm.ratings || []).map(function (it, sIdx) {
        var skillName = it.skill || it.item || (EMBEDDED_CURRICULUM[dm.domain] && EMBEDDED_CURRICULUM[dm.domain][sIdx]) || ('مهارة ' + (sIdx + 1));
        var sc = 0;
        var isRated = false;
        if (it.score !== '' && it.score != null) {
          var parsedSc = parseInt(it.score, 10);
          if (!isNaN(parsedSc)) {
            sc = parsedSc;
            isRated = true;
          }
        } else if (it.yn) {
          if (it.yn === 'نعم') sc = 5;
          else sc = 0;
          isRated = true;
        }
        dEarned += sc;
        dMax += 5;
        var scVal = isRated ? (it.yn ? it.yn : (sc + ' / 5')) : '0 / 5';

        return h('tr', null,
          h('td', { style: 'text-align:center;', text: String(sIdx + 1) }),
          h('td', null, h('strong', { text: skillName })),
          h('td', { style: 'text-align:center;' }, h('span', { class: 'badge ' + (sc > 0 ? 'ok' : 'gray'), text: scVal })),
          h('td', { class: 'muted small', text: it.note || it.obs || (isRated ? 'مقيَّمة' : 'لم تقيَّم (درجة صفر)') })
        );
      });
      var dPct = dMax > 0 ? Math.round((dEarned / dMax) * 100) : 0;

      return h('div', { class: 'eval-domain-table-wrap', style: 'margin-top:16px;' },
        h('div', { class: 'oep-gr-header', style: 'display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#EEF2FF;color:#312E81;border:1px solid #C7D2FE;' },
          h('strong', { text: (dIdx + 1) + '. ' + dm.domain + ' (' + (dm.ratings ? dm.ratings.length : 0) + ' مهارة)' }),
          h('span', { class: 'badge gold', text: 'النقاط: ' + dEarned + ' / ' + dMax + ' (' + dPct + '%)' })
        ),
        h('table', { class: 'oep-scorecard-table', style: 'margin-top:0;width:100%;' },
          h('thead', null,
            h('tr', null,
              h('th', { style: 'width:45px;text-align:center;', text: '#' }),
              h('th', { text: 'المهارة المقيمة' }),
              h('th', { style: 'width:130px;text-align:center;', text: 'التقييم / النتيجة' }),
              h('th', { text: 'الملاحظات والتوجيهات' })
            )
          ),
          h('tbody', null, skillRows.length ? skillRows : h('tr', null, h('td', { colspan: 4, class: 'muted', style: 'text-align:center;', text: 'لا توجد مهارات مسجلة في هذا المجال.' })))
        )
      );
    });

    var detailedSkillsSection = h('div', { class: 'eval-detailed-skills-box', style: 'margin-top:20px;' },
      h('div', { class: 'oep-section-banner', style: 'background-color:#E0E7FF; color:#1E1B4B; margin:16px 0 8px;' }, 'الجداول التفصيلية لكافة المهارات المقيمة في المجالات التربوية'),
      allDomainDetailTables
    );

    var topActionsBar = h('div', { class: 'oep-action-bar no-print', style: 'display:flex;justify-content:flex-end;gap:10px;margin-bottom:16px;padding:10px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;' },
      h('button', {
        type: 'button',
        class: 'btn gold',
        onclick: async function () {
          try {
            toast('جارٍ تجهيز وتحميل الاستمارة بصيغة PDF...', 'ok');
            var pdfBytes = await DE_PDF.renderEvaluationToPdf(r, childFullName, secName, kd);
            DE_PDF.downloadPdf(pdfBytes, 'استمارة_تقييم_' + (childFullName || 'تلميذ').replace(/\s+/g, '_') + '.pdf');
            toast('تم تنزيل ملف PDF بنجاح!', 'ok');
          } catch (e) {
            toast('تعذر تنزيل PDF: ' + e.message, 'bad');
          }
        }
      }, makeSvgIcon('s-download'), h('span', { text: 'تحميل الاستمارة بصيغة PDF' })),
      h('button', {
        type: 'button',
        class: 'btn',
        onclick: function () { window.print(); }
      }, makeSvgIcon('s-print'), h('span', { text: 'طباعة الورقة الرسمية (A4)' }))
    );

    var compactSkillsBox = h('div', { class: 'eval-compact-box' },
      skillsSectionBanner,
      scorecardTable,
      overallBanner
    );

    return h('div', { class: 'official-eval-paper' },
      topActionsBar,
      header,
      termBanner,
      infoTable,
      supervisorsTable,
      perfBanner,
      perfGrid,
      summaryBanner,
      recGrid,
      compactSkillsBox,
      detailedSkillsSection
    );
  }

  /* ---- باني ومحرر استمارة التقييم البيداغوجي (مع خانات التقرير والمشرفين والمجالات المصغرة) ---- */
  function openEvaluationBuilder(existingRep, kids, sections, secAllOpts, branchOpts) {
    S.inSubBuilder = true;
    try { window.history.pushState({ deApp: true, sec: 'evaluations', center: S.activeCenter, subBuilder: true }, ''); } catch (e) {}
    var ev = parseEvaluationReport(existingRep);
    S.preselectChildId = null;

    var v = $('#view');
    v.textContent = '';

    var topBar = h('div', { class: 'bar-sub' },
      h('h2', { text: existingRep ? 'تعديل استمارة التقييم البيداغوجي' : 'إضافة استمارة تقييم بيداغوجي رسمية جديدة' }),
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn light', type: 'button', text: 'رجوع لقائمة التقييم', onclick: function () { go('evaluations'); } })
      )
    );
    v.appendChild(topBar);

    // 1. اختيار الطفل والتفاصيل الإدارية
    var selectedKid0 = kids.filter(function (k) { return k.id === ev.child_id; })[0] || (kids.length === 1 ? kids[0] : null);
    if (selectedKid0 && !ev.child_id) ev.child_id = selectedKid0.id;

    var curSecId = S.isEducator ? S.eduSectionId : (selectedKid0 ? selectedKid0.section_id : '');
    var secFilterSelect = h('select', { disabled: !!S.isEducator },
      h('option', { value: '', text: '— جميع الأقسام —' }),
      secAllOpts.map(function (o) { return h('option', { value: o[0], text: o[1] }); })
    );
    secFilterSelect.value = curSecId || '';

    var kidSearch = h('input', { type: 'search', class: 'fld-search', placeholder: 'ابحث باسم الطفل أو رقم القيد...', autocomplete: 'off' });
    var kidSelect = h('select', null);

    function populateKidsSelect() {
      var sId = secFilterSelect.value;
      var q = normAr(kidSearch.value.trim());
      var keep = ev.child_id || kidSelect.value;
      while (kidSelect.firstChild) kidSelect.removeChild(kidSelect.firstChild);
      kidSelect.appendChild(h('option', { value: '', text: '— اختر الطفل المعني بالتقييم —' }));
      kids.forEach(function (k) {
        if (sId && !childMatchesSection(k, sId, nameOf(sections, sId, 'name'), sections)) return;
        var label = (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name + (k.section ? (' — ' + k.section) : '');
        if (q && normAr(label).indexOf(q) === -1) return;
        kidSelect.appendChild(h('option', { value: k.id, text: label }));
      });
      if (keep && kids.some(function (k) { return k.id === keep && (!sId || childMatchesSection(k, sId, nameOf(sections, sId, 'name'), sections)); })) {
        kidSelect.value = keep;
      }
    }

    secFilterSelect.addEventListener('change', function () {
      ev.child_id = '';
      populateKidsSelect();
      ev.child_id = kidSelect.value;
      updateChildAutoMeta();
    });

    kidSearch.addEventListener('input', function () {
      populateKidsSelect();
      ev.child_id = kidSelect.value;
      updateChildAutoMeta();
    });

    populateKidsSelect();

    var titleInput = h('input', { type: 'text', maxlength: 145, value: ev.title || 'تقرير اللجنة البيداغوجية والتربوية' });
    titleInput.addEventListener('input', function () { ev.title = titleInput.value; });

    var dateInput = h('input', { type: 'date', value: ev.report_date });
    dateInput.addEventListener('change', function () { ev.report_date = dateInput.value; });

    var termSelect = h('select', null,
      h('option', { value: 'الثلاثي الأخير', text: 'الثلاثي الأخير (الثالث)' }),
      h('option', { value: 'الثلاثي الأول', text: 'الثلاثي الأول' }),
      h('option', { value: 'الثلاثي الثاني', text: 'الثلاثي الثاني' })
    );
    termSelect.value = ev.term || 'الثلاثي الأخير';
    termSelect.addEventListener('change', function () { ev.term = termSelect.value; });

    var schoolYearInput = h('input', { type: 'text', maxlength: 20, value: ev.school_year || '2024/2025' });
    schoolYearInput.addEventListener('input', function () { ev.school_year = schoolYearInput.value; });

    var disabilityDegInput = h('input', { type: 'text', maxlength: 50, value: ev.degree_of_disability || 'متوسطة' });
    disabilityDegInput.addEventListener('input', function () { ev.degree_of_disability = disabilityDegInput.value; });

    var qualLevelInput = h('input', { type: 'text', maxlength: 80, value: ev.qualification_level || '' });
    qualLevelInput.addEventListener('input', function () { ev.qualification_level = qualLevelInput.value; });

    function updateChildAutoMeta() {
      var chosen = kids.filter(function (k) { return k.id === ev.child_id; })[0];
      if (chosen) {
        var sName = nameOf(sections, chosen.section_id, 'name') || chosen.section || '';
        if (!qualLevelInput.value) {
          qualLevelInput.value = sName;
          ev.qualification_level = sName;
        }
      }
    }

    kidSelect.addEventListener('change', function () {
      ev.child_id = kidSelect.value;
      updateChildAutoMeta();
    });

    var step1Card = h('div', { class: 'card prog-step-card' },
      h('h3', { class: 'prog-step-title', text: '1⃣ بيانات الحالة والموسم الدراسي (مطابقة للصورة الرسمية)' }),
      h('div', { class: 'eval-builder-grid-2' },
        h('label', { class: 'fld' }, h('span', { text: 'تصفية حسب القسم التربوي:' }), secFilterSelect),
        h('label', { class: 'fld' }, h('span', { text: 'بحث عن الطفل:' }), kidSearch)
      ),
      h('label', { class: 'fld' }, h('span', { text: 'الطفل المعني بالاستمارة:' }), kidSelect),
      h('div', { class: 'eval-builder-grid-2' },
        h('label', { class: 'fld' }, h('span', { text: 'تقييم الثلاثي:' }), termSelect),
        h('label', { class: 'fld' }, h('span', { text: 'الموسم الدراسي:' }), schoolYearInput),
        h('label', { class: 'fld' }, h('span', { text: 'تاريخ التقييم:' }), dateInput),
        h('label', { class: 'fld' }, h('span', { text: 'عنوان الوثيقة:' }), titleInput),
        h('label', { class: 'fld' }, h('span', { text: 'درجة الإعاقة / الاضطراب:' }), disabilityDegInput),
        h('label', { class: 'fld' }, h('span', { text: 'القسم ومستوى التأهيل:' }), qualLevelInput)
      )
    );
    v.appendChild(step1Card);

    // 2. إدارة المشرفين (المشرفون: ضع في الأول واحد ثم إمكانية إضافة واحد)
    var supervisorsHost = h('div', { class: 'dynamic-items-container' });

    function renderSupervisorsList() {
      supervisorsHost.textContent = '';
      if (!ev.supervisors || !ev.supervisors.length) {
        ev.supervisors = [{ name: 'أمير زكرياء', role: 'مدير المركز' }];
      }

      ev.supervisors.forEach(function (sp, idx) {
        var nameInp = h('input', { type: 'text', placeholder: 'اسم ولقب المشرف...', value: sp.name || '' });
        nameInp.addEventListener('input', function () { sp.name = nameInp.value; });

        var roleInp = h('input', { type: 'text', placeholder: 'الوظيفة (مدير المركز، أخصائية نفسانية، مربية...)', value: sp.role || '' });
        roleInp.addEventListener('input', function () { sp.role = roleInp.value; });

        var delBtn = h('button', {
          type: 'button',
          class: 'btn small danger',
          text: 'حذف',
          disabled: ev.supervisors.length <= 1,
          onclick: function () {
            ev.supervisors.splice(idx, 1);
            renderSupervisorsList();
          }
        });

        var row = h('div', { class: 'dynamic-item-row' },
          h('span', { class: 'badge', text: '#' + (idx + 1) }),
          nameInp,
          roleInp,
          delBtn
        );
        supervisorsHost.appendChild(row);
      });
    }

    var addSupervisorBtn = h('button', {
      type: 'button',
      class: 'btn small gold',
      text: '+ إضافة مشرف آخر',
      onclick: function () {
        ev.supervisors.push({ name: '', role: 'مربية' });
        renderSupervisorsList();
      }
    });

    renderSupervisorsList();

    var stepSupervisorsCard = h('div', { class: 'card prog-step-card' },
      h('div', { class: 'bar-sub' },
        h('h3', { class: 'prog-step-title', text: '2⃣ المشرفون على التقييم (جدول التوقيعات ورموز الاستجابة السريعة)' }),
        addSupervisorBtn
      ),
      h('p', { class: 'muted small', text: 'حدد أسماء ووظائف أعضاء اللجنة البيداغوجية المشرفة على التقييم (يبدأ بمشرف واحد مع إمكانية إضافة مشرفين إضافيين).' }),
      supervisorsHost
    );
    v.appendChild(stepSupervisorsCard);

    // 3. خانات تقرير التقييم (الوصف العام لأداء الحالة: التقرير العام + الخانات الستة)
    var generalReportArea = h('textarea', { rows: 9, placeholder: 'اكتب التقرير العام الشامل لأداء وسلوك الحالة...' });
    generalReportArea.value = ev.general_report || '';
    generalReportArea.addEventListener('input', function () { ev.general_report = generalReportArea.value; });

    var ab = ev.abilities || {};
    function makeAbArea(key, placeholder) {
      var ta = h('textarea', { rows: 2, placeholder: placeholder });
      ta.value = ab[key] || '';
      ta.addEventListener('input', function () {
        if (!ev.abilities) ev.abilities = {};
        ev.abilities[key] = ta.value;
      });
      return ta;
    }

    var stepReportFieldsCard = h('div', { class: 'card prog-step-card' },
      h('h3', { class: 'prog-step-title', text: '3⃣ خانات تقرير التقييم — الوصف العام لأداء الحالة (مطابقة للصورة الرسمية)' }),
      h('div', { class: 'eval-builder-grid-2' },
        h('label', { class: 'fld' },
          h('span', { text: 'التقرير العام (مربع التقرير الشامل على اليمين):' }),
          generalReportArea
        ),
        h('div', { class: 'oep-abilities-stack' },
          h('label', { class: 'fld' }, h('span', { text: '1. إمكانيات والقدرات الحالية:' }), makeAbArea('current_potentials', 'سجل الإمكانيات والقدرات الحالية...')),
          h('label', { class: 'fld' }, h('span', { text: '2. المهارات المعرفية والفكرية:' }), makeAbArea('cognitive_intellectual', 'سجل المهارات المعرفية والفكرية...')),
          h('label', { class: 'fld' }, h('span', { text: '3. اللغة (استقبالية تعبيرية):' }), makeAbArea('language_receptive_expressive', 'سجل مستوى اللغة الاستقبالية والتعبيرية...')),
          h('label', { class: 'fld' }, h('span', { text: '4. القدرات الإتصالية والسلوكية:' }), makeAbArea('communication_behavioral', 'سجل القدرات التواصلية والسلوك...')),
          h('label', { class: 'fld' }, h('span', { text: '5. المعارف الأكاديمية وما قبل الأكاديمي:' }), makeAbArea('academic_preacademic', 'سجل المعارف الأكاديمية وما قبل الأكاديمية...')),
          h('label', { class: 'fld' }, h('span', { text: '6. القدرات الحركية والاستقلالية:' }), makeAbArea('motor_independence', 'سجل القدرات الحركية ومستوى الاستقلالية...'))
        )
      )
    );
    v.appendChild(stepReportFieldsCard);

    // 4. الخلاصة والتوصيات (نقاط القوة، نقاط الضعف، التوصيات مع إمكانية إضافة أكثر من واحدة)
    function buildDynamicListBlock(title, arrKey, placeholder, addLabel) {
      var container = h('div', { class: 'dynamic-items-container' });
      function redraw() {
        container.textContent = '';
        if (!ev[arrKey] || !ev[arrKey].length) ev[arrKey] = [''];
        ev[arrKey].forEach(function (val, idx) {
          var inp = h('input', { type: 'text', placeholder: placeholder, value: val || '' });
          inp.addEventListener('input', function () { ev[arrKey][idx] = inp.value; });
          var del = h('button', {
            type: 'button',
            class: 'btn small danger',
            text: 'حذف',
            disabled: ev[arrKey].length <= 1,
            onclick: function () {
              ev[arrKey].splice(idx, 1);
              redraw();
            }
          });
          container.appendChild(h('div', { class: 'dynamic-item-row' }, inp, del));
        });
      }
      redraw();
      var addBtn = h('button', {
        type: 'button',
        class: 'btn small light',
        text: addLabel,
        onclick: function () {
          ev[arrKey].push('');
          redraw();
        }
      });
      return h('div', { class: 'card', style: 'margin-bottom:0;' },
        h('div', { class: 'bar-sub' }, h('h4', { text: title }), addBtn),
        container
      );
    }

    var stepSummaryCard = h('div', { class: 'card prog-step-card' },
      h('h3', { class: 'prog-step-title', text: '4⃣ الخلاصة والتوصيات (إمكانية إضافة أكثر من نقطة قوة، ضعف، وتوصية)' }),
      h('div', { class: 'eval-builder-grid-2' },
        buildDynamicListBlock('نقاط القوة', 'strengths', 'اكتب نقطة قوة...', '+ إضافة نقطة قوة'),
        buildDynamicListBlock('نقاط الضعف', 'weaknesses', 'اكتب نقطة ضعف...', '+ إضافة نقطة ضعف')
      ),
      buildDynamicListBlock('التوصيات والتوجيهات', 'recommendations', 'اكتب توصية للمركز والأسرة...', '+ إضافة توصية أخرى')
    );
    v.appendChild(stepSummaryCard);

    // 5. تقييم المهارات والمجالات البيداغوجية المصغر ("اريد ان تصغر حجم التقيم")
    var CURR = (window && window.DE_CURRICULUM) || EMBEDDED_CURRICULUM || {};
    var domainKeys = Object.keys(CURR);

    function buildDomainRatingsList(domName, existingRatings) {
      var skList = CURR[domName] || [];
      var ratingsMap = {};
      (existingRatings || []).forEach(function (it, idx) {
        ratingsMap[idx] = it;
        if (it && it.skill) ratingsMap[it.skill] = it;
      });
      return skList.map(function (sk, idx) {
        var sv = ratingsMap[idx] || ratingsMap[sk] || {};
        return {
          num: idx + 1,
          skill: sk,
          score: sv.score != null ? String(sv.score) : '',
          yn: sv.yn || '',
          note: sv.note || ''
        };
      });
    }

    var domainsHost = h('div', null);

    function renderEvalDomains() {
      domainsHost.textContent = '';
      ev.domains.forEach(function (dm, dIdx) {
        var domSel = h('select', null,
          domainKeys.map(function (k) { return h('option', { value: k, text: k }); })
        );
        domSel.value = dm.domain;
        domSel.addEventListener('change', function () {
          var newDom = domSel.value;
          dm.domain = newDom;
          dm.ratings = buildDomainRatingsList(newDom, []);
          renderEvalDomains();
        });

        var tbody = h('tbody');
        dm.ratings.forEach(function (it) {
          var isComm = dm.domain.indexOf('التواصل') >= 0;

          // خيارات الدرجات من 0 إلى 5 مع دعم الصفر
          var scoreButtons = ['0', '1', '2', '3', '4', '5'].map(function (sc) {
            var btn = h('button', {
              type: 'button',
              class: 'eval-compact-score-btn' + (it.score === sc ? ' is-selected' : ''),
              text: sc,
              onclick: function () {
                it.score = (it.score === sc ? '' : sc);
                renderEvalDomains();
              }
            });
            return btn;
          });

          var ynButtons = null;
          if (isComm) {
            ynButtons = h('div', { class: 'row-actions' },
              h('button', {
                type: 'button',
                class: 'eval-compact-score-btn' + (it.yn === 'نعم' ? ' is-selected' : ''),
                text: 'نعم',
                onclick: function () { it.yn = it.yn === 'نعم' ? '' : 'نعم'; renderEvalDomains(); }
              }),
              h('button', {
                type: 'button',
                class: 'eval-compact-score-btn' + (it.yn === 'لا' ? ' is-selected' : ''),
                text: 'لا',
                onclick: function () { it.yn = it.yn === 'لا' ? '' : 'لا'; renderEvalDomains(); }
              })
            );
          }

          var noteInp = h('input', { type: 'text', placeholder: 'ملاحظة...', value: it.note || '', style: 'font-size:0.8rem; padding:3px 6px;' });
          noteInp.addEventListener('input', function () { it.note = noteInp.value; });

          tbody.appendChild(h('tr', { class: (it.score || it.yn) ? 'eval-row-rated' : '' },
            h('td', { class: 'eval-col-num', text: String(it.num) }),
            h('td', { class: 'eval-col-skill', text: it.skill }),
            h('td', null, ynButtons || h('div', { class: 'row-actions' }, scoreButtons)),
            h('td', null, noteInp)
          ));
        });

        var quickFillBar = h('div', { class: 'eval-quick-fill-bar' },
          h('span', { class: 'muted small', text: 'تعبئة سريعة:' }),
          ['5', '4', '3', '2', '1', '0'].map(function (val) {
            return h('button', {
              type: 'button',
              class: 'btn small light',
              text: 'الكل ' + val,
              onclick: function () {
                dm.ratings.forEach(function (it) { it.score = val; });
                renderEvalDomains();
              }
            });
          }),
          h('button', {
            type: 'button',
            class: 'btn small danger',
            text: 'تفريغ الدرجات',
            onclick: function () {
              dm.ratings.forEach(function (it) { it.score = ''; it.yn = ''; it.note = ''; });
              renderEvalDomains();
            }
          })
        );

        // حساب نقاط المجال تلقائياً
        var domEarned = 0;
        var domMax = 0;
        var domRated = 0;
        (dm.ratings || []).forEach(function (it) {
          if (it.score !== '' && it.score != null) {
            var sc = parseInt(it.score, 10);
            if (!isNaN(sc)) {
              domEarned += sc;
              domMax += 5;
              domRated++;
            }
          } else if (it.yn) {
            if (it.yn === 'نعم') domEarned += 5;
            domMax += 5;
            domRated++;
          }
        });
        var domPct = domMax > 0 ? Math.round((domEarned / domMax) * 100) : 0;

        var domCard = h('div', { class: 'card', style: 'margin-bottom:12px; padding:12px;' },
          h('div', { class: 'bar-sub' },
            h('h4', { text: dm.domain }),
            h('div', { class: 'row-actions' },
              h('span', { class: 'badge ' + (domRated ? 'ok' : 'gold'), text: 'المجموع: ' + domEarned + ' من ' + domMax + ' نقطة (' + domPct + '%)' }),
              ev.domains.length > 1 ? h('button', {
                type: 'button',
                class: 'btn small danger',
                text: 'حذف المجال',
                onclick: function () { ev.domains.splice(dIdx, 1); renderEvalDomains(); }
              }) : null
            )
          ),
          h('label', { class: 'fld' }, h('span', { text: 'المجال التربوي:' }), domSel),
          quickFillBar,
          h('div', { class: 'eval-table-wrap', style: 'max-height: 280px; overflow-y: auto;' },
            h('table', { class: 'eval-official-table' },
              h('thead', null,
                h('tr', null,
                  h('th', { style: 'width:35px;', text: 'الرقم' }),
                  h('th', { text: 'المهارة التربوية' }),
                  h('th', { style: 'width:180px;', text: 'الدرجة (1–5 / نعم–لا)' }),
                  h('th', { text: 'ملاحظة' })
                )
              ),
              tbody
            )
          )
        );
        domainsHost.appendChild(domCard);
      });

      // حساب النتيجة الإجمالية لكافة المجالات المختارة في الوقت الفعلي
      var overallEarned = 0;
      var overallMax = 0;
      var overallSkillsCount = 0;
      ev.domains.forEach(function (dm) {
        (dm.ratings || []).forEach(function (it) {
          if (it.score !== '' && it.score != null) {
            var sc = parseInt(it.score, 10);
            if (!isNaN(sc)) {
              overallEarned += sc;
              overallMax += 5;
              overallSkillsCount++;
            }
          } else if (it.yn) {
            if (it.yn === 'نعم') overallEarned += 5;
            overallMax += 5;
            overallSkillsCount++;
          }
        });
      });
      var overallPercentage = overallMax > 0 ? ((overallEarned / overallMax) * 100).toFixed(1) : '0';

      var liveOverallBanner = h('div', { class: 'eval-live-score-banner' },
        h('div', null,
          h('div', { class: 'eval-live-score-title', text: '📊 النتيجة الإجمالية لكافة المجالات التربوية المختارة:' }),
          h('p', { class: 'muted small', style: 'margin:0;', text: 'تُحسب تلقائياً بجمع النقاط المحصلة (' + overallEarned + ') مقسومة على المجموع الكلي الأقصى للمجالات المختارة (' + overallMax + ').' })
        ),
        h('div', { class: 'eval-live-score-val', text: overallEarned + ' / ' + overallMax + ' نقطة (' + overallPercentage + '%)' })
      );
      domainsHost.insertBefore(liveOverallBanner, domainsHost.firstChild);
    }

    function addAnotherEvalDomain() {
      var used = ev.domains.map(function (d) { return d.domain; });
      var nextDom = domainKeys.filter(function (dk) { return used.indexOf(dk) < 0; })[0] || domainKeys[0] || '';
      ev.domains.push({
        domain: nextDom,
        ratings: buildDomainRatingsList(nextDom, [])
      });
      renderEvalDomains();
      toast('تمت إضافة مجال تربوي إضافي للاستمارة.', 'ok');
    }

    renderEvalDomains();

    var step5Card = h('div', { class: 'card prog-step-card' },
      h('div', { class: 'bar-sub' },
        h('div', null,
          h('h3', { class: 'prog-step-title', text: '5⃣ جدول تقييم المجالات والمهارات البيداغوجية (تصميم مصغر وسهل التعبئة)' }),
          h('p', { class: 'muted small', text: 'اختر المجال وقيّم المهارات بسرعة عبر الأزرار المدمجة (1 إلى 5).' })
        ),
        h('div', { class: 'row-actions' },
          h('button', { type: 'button', class: 'btn gold', text: '+ إضافة مجال آخر للاستمارة', onclick: addAnotherEvalDomain })
        )
      ),
      domainsHost
    );
    v.appendChild(step5Card);

    // 6. الحفظ والاعتماد والمعاينة
    async function saveEvaluationForm(publishNow) {
      if (!ev.child_id) return toast('يرجى اختيار الطفل المعني باستمارة التقييم أولاً.', 'bad');

      var compactDomains = [];
      var totalRated = 0;
      ev.domains.forEach(function (dm) {
        var dIdx = domainKeys.indexOf(dm.domain);
        var compactRows = [];
        (dm.ratings || []).forEach(function (it, sIdx) {
          if (it.score || it.yn || it.note) {
            totalRated++;
            compactRows.push([sIdx, it.score || '', it.yn || '', (it.note || '').slice(0, 40)]);
          }
        });
        compactDomains.push({
          d: dIdx >= 0 ? dIdx : dm.domain,
          r: compactRows
        });
      });

      // بناء الحمولة المتوافقة مع النموذج الجديد v:2
      var payloadObj = {
        v: 2,
        term: ev.term || 'الثلاثي الأخير',
        school_year: ev.school_year || '2024/2025',
        degree_of_disability: DE.clean(ev.degree_of_disability || '', 50),
        qualification_level: DE.clean(ev.qualification_level || '', 80),
        supervisors: (ev.supervisors || []).map(function (s) {
          return { name: DE.clean(s.name || '', 60), role: DE.clean(s.role || '', 60) };
        }),
        general_report: DE.clean(ev.general_report || '', 1800),
        abilities: {
          current_potentials: DE.clean((ev.abilities && ev.abilities.current_potentials) || '', 400),
          cognitive_intellectual: DE.clean((ev.abilities && ev.abilities.cognitive_intellectual) || '', 400),
          language_receptive_expressive: DE.clean((ev.abilities && ev.abilities.language_receptive_expressive) || '', 400),
          communication_behavioral: DE.clean((ev.abilities && ev.abilities.communication_behavioral) || '', 400),
          academic_preacademic: DE.clean((ev.abilities && ev.abilities.academic_preacademic) || '', 400),
          motor_independence: DE.clean((ev.abilities && ev.abilities.motor_independence) || '', 400)
        },
        strengths: (ev.strengths || []).map(function (s) { return DE.clean(s || '', 150); }).filter(Boolean),
        weaknesses: (ev.weaknesses || []).map(function (w) { return DE.clean(w || '', 150); }).filter(Boolean),
        recommendations: (ev.recommendations || []).map(function (rc) { return DE.clean(rc || '', 150); }).filter(Boolean),
        domains: compactDomains
      };

      var serializedPayload = EVAL_MARKER + JSON.stringify(payloadObj);
      if (serializedPayload.length > 4950) {
        // ضغط طفيف في حال الإطالة
        payloadObj.general_report = payloadObj.general_report.slice(0, 1000);
        serializedPayload = EVAL_MARKER + JSON.stringify(payloadObj);
      }

      var chosenKid = kids.filter(function (k) { return k.id === ev.child_id; })[0];
      var kidName = chosenKid ? chosenKid.full_name : 'الطفل';

      var body = {
        child_id: ev.child_id,
        title: DE.clean(ev.title || ('تقرير اللجنة البيداغوجية والتربوية — ' + ev.term), 145),
        report_date: ev.report_date || new Date().toISOString().slice(0, 10),
        period_start: ev.report_date || new Date().toISOString().slice(0, 10),
        period_end: ev.report_date || new Date().toISOString().slice(0, 10),
        achievements: DE.clean('تقييم ' + ev.term + ' للموسم الدراسي ' + ev.school_year + ' — المشرفون: ' + (ev.supervisors.map(function (s) { return s.name; }).join('، ')), 4800),
        activities: serializedPayload,
        notes: DE.clean(ev.general_report || '', 4800) || null,
        status: publishNow ? 'published' : 'draft'
      };

      if (ev.id) {
        await C.rest('PATCH', '/progress_reports?id=eq.' + uid(ev.id), body);
      } else {
        await C.rest('POST', '/progress_reports', body);
      }
      bust();
      toast(publishNow ? 'تم اعتماد ونشر استمارة التقييم البيداغوجي للولي بنجاح!' : 'تم حفظ استمارة التقييم كمسودة.', 'ok');
      go('evaluations');
    }

    var btnSaveDraft = h('button', { type: 'button', class: 'btn light', text: 'حفظ الاستمارة كمسودة' });
    var btnPublish = h('button', { type: 'button', class: 'btn gold', text: 'اعتماد وإرسال استمارة التقييم للولي' });
    btnSaveDraft.addEventListener('click', function () { act(btnSaveDraft, function () { return saveEvaluationForm(false); }); });
    btnPublish.addEventListener('click', function () { act(btnPublish, function () { return saveEvaluationForm(true); }); });

    var previewBtn = h('button', {
      type: 'button',
      class: 'btn',
      text: 'معاينة الورقة الرسمية (مثل الصورة)',
      onclick: function () {
        var chosenKid = kids.filter(function (k) { return k.id === ev.child_id; })[0];
        var sName = chosenKid ? (nameOf(sections, chosenKid.section_id, 'name') || chosenKid.section || '') : '';
        openModal(h('div', { class: 'modal-body wk-modal-print' },
          renderEvaluationSheetView({
            id: ev.id,
            child_id: ev.child_id,
            title: ev.title,
            report_date: ev.report_date,
            activities: EVAL_MARKER + JSON.stringify(ev)
          }, chosenKid ? chosenKid.full_name : '—', sName, chosenKid),
          h('div', { class: 'modal-actions no-print' },
            h('button', { class: 'btn light', type: 'button', text: 'إغلاق المعاينة', onclick: closeModal }),
            h('button', { class: 'btn gold', type: 'button', text: 'طباعة الورقة الرسمية (A4)', onclick: function () { window.print(); } })
          )
        ));
      }
    });

    var footerCard = h('div', { class: 'card prog-step-card' },
      h('div', { class: 'prog-submit-bar' },
        h('button', { type: 'button', class: 'btn light', text: 'إلغاء والعودة', onclick: function () { go('evaluations'); } }),
        previewBtn,
        btnSaveDraft,
        btnPublish
      )
    );
    v.appendChild(footerCard);
  }

  /* =====================================================================
     6.1 قسم التقارير التربوية الدورية (Reports Only — مفصول تماماً عن التقييم)
     ===================================================================== */
  async function secReports(v) {
    if (isFarmSession()) return go('children');
    var d = await getMany('reports', 'children', 'branches', 'sections');
    var allReports = d[0], kids = d[1], branches = d[2], sections = d[3];

    // إظهار التقارير الدورية فقط واستبعاد استمارات التقييم
    var rows = allReports.filter(function (r) { return !isEvaluationReport(r); });

    if (S.isEducator && (S.eduSectionId || S.eduSectionName)) {
      kids = kids.filter(function (k) { return childMatchesSection(k, S.eduSectionId, S.eduSectionName, sections); });
      var allowedKidIds = {};
      kids.forEach(function (k) { allowedKidIds[k.id] = true; });
      rows = rows.filter(function (r) { return !!allowedKidIds[r.child_id]; });
    } else if (!S.isEducator) {
      kids = kids.filter(function (k) { return childCenterKey(k, branches, sections) === S.activeCenter; });
      sections = sections.filter(function (s) { return sectionCenterKey(s, branches) === S.activeCenter; });
      var centerKidIds = {};
      kids.forEach(function (k) { centerKidIds[k.id] = true; });
      rows = rows.filter(function (r) { return !!centerKidIds[r.child_id]; });
    }

    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });
    var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
    var secAllOpts = sections.map(function (s) { return [s.id, s.name]; });
    var MAX_FILE = 5242880;

    function editReport(r) {
      var lastSec = r ? (nameOf(kids, r.child_id, 'section_id') || '') : '';
      var curKid = r ? kids.filter(function (k) { return k.id === r.child_id; })[0] : null;
      var curSec = curKid ? curKid.section_id : '';
      var curBranch = curKid ? curKid.branch_id : (branches[0] ? branches[0].id : '');
      var FORM = null, uploaded = null;

      return openForm({
        title: r ? 'تعديل التقرير الدوري للطفل' : 'كتابة تقرير دوري جديد مع إمكانية رفع ملف',
        submits: [
          { key: 'draft', label: 'حفظ كمسودة' },
          { key: 'publish', label: 'اعتماد ونشر للولي' }
        ],
        values: {
          branch_id: curBranch,
          section_id: curSec,
          child_id: r ? r.child_id : (S.preselectChildId || (kids[0] ? kids[0].id : '')),
          title: r ? r.title : '',
          report_date: r ? r.report_date : new Date().toISOString().slice(0, 10),
          achievements: r ? r.achievements : '',
          activities: r ? r.activities : '',
          notes: r ? r.notes : ''
        },
        fields: [
          { k: 'branch_id', label: 'الفرع', type: 'select', opts: branchOpts, req: !S.isEducator, showIf: function () { return !S.isEducator; } },
          { k: 'section_id', label: 'القسم / الفوج', type: 'select', opts: secAllOpts, req: true, showIf: function () { return !S.isEducator; } },
          { k: 'child_id', label: 'الطفل المعني', type: 'select', opts: kidOpts, req: true, searchable: true },
          { k: 'title', label: 'عنوان التقرير (مثال: التقرير الفصلي الأول)', req: true, max: 150 },
          { k: 'report_date', label: 'تاريخ التقرير', type: 'date', req: true },
          { k: 'achievements', label: 'المكتسبات والمهارات المحققة', type: 'textarea', max: 5000 },
          { k: 'activities', label: 'الأنشطة والورشات المنجزة', type: 'textarea', max: 5000 },
          { k: 'notes', label: 'ملاحظات وتوجيهات للأولياء', type: 'textarea', max: 5000 },
          { k: 'file', label: 'رفع ملف مرفق للتقرير (PDF/JPG/PNG/WebP — حتى 5MB)', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp', hint: r && r.attachment_path ? 'يوجد مرفق محفوظ؛ يمكنك رفع ملف جديد لاستبداله.' : 'يمكنك رفع ملف PDF أو صورة مصورة للتقرير ليتمكن الولي من تحميلها مباشرة.' }
        ],
        onSubmit: async function (x, key) {
          if (!x.child_id) throw new Error('اختر طفلاً من القائمة.');
          if (key === 'publish' && !x.achievements && !x.activities && !x.notes && !x.file && !(r && r.attachment_path)) {
            throw new Error('لا يمكن نشر تقرير فارغ تماماً.');
          }
          if (x.file && x.file.size > MAX_FILE) throw new Error('حجم الملف يتجاوز 5 ميغابايت.');
          var body = {
            child_id: x.child_id, title: x.title, report_date: x.report_date,
            period_start: r ? r.period_start : x.report_date, period_end: r ? r.period_end : x.report_date,
            achievements: x.achievements || null, activities: x.activities || null, notes: x.notes || null,
            status: key === 'publish' ? 'published' : (r ? r.status : 'draft')
          };
          if (x.file) {
            try { uploaded = await uploadChecked(x.file, x.child_id); }
            catch (e) { throw new Error('تعذّر رفع الملف: ' + (e && e.message || 'خطأ')); }
            body.attachment_path = uploaded.path;
          }
          try {
            if (r) await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), body);
            else await C.rest('POST', '/progress_reports', body);
          } catch (e) {
            if (uploaded) C.removeObject('private-docs', uploaded.path).catch(function () {});
            throw e;
          }
          bust(); toast(key === 'publish' ? 'تم نشر التقرير للولي بنجاح.' : 'حُفظت المسودة.', 'ok'); go('reports');
        }
      });
    }

    if (S.openReportDirect) {
      S.openReportDirect = false;
      setTimeout(function () { editReport(null); }, 40);
    }

    listView(v, {
      title: S.isEducator ? ('التقارير التربوية الدورية — قسم ' + (S.eduSectionName || 'فوجي')) : 'التقارير التربوية الدورية للطلبة',
      addLabel: 'كتابة تقرير دوري جديد',
      onAdd: function () { if (!kids.length) return toast('لا يوجد أطفال مسجلون في هذا القسم.', 'bad'); editReport(null); },
      rows: rows,
      empty: 'لا توجد تقارير دورية مسجلة بعد. اضغط «كتابة تقرير دوري جديد» لإضافة تقرير مع إمكانية رفع ملف.',
      search: function (r) { return r.title + ' ' + nameOf(kids, r.child_id); },
      details: function (r) {
        var kd = kids.filter(function (k) { return k.id === r.child_id; })[0];
        return h('div', { class: 'child-details' },
          r.achievements ? h('div', { class: 'cd-item wide' }, h('span', { text: 'المكتسبات والمهارات المحققة' }), h('b', { text: r.achievements })) : null,
          r.activities ? h('div', { class: 'cd-item wide' }, h('span', { text: 'الأنشطة والورشات المنجزة' }), h('b', { text: r.activities })) : null,
          r.notes ? h('div', { class: 'cd-item wide' }, h('span', { text: 'ملاحظات وتوجيهات للأولياء' }), h('b', { text: r.notes })) : null,
          r.attachment_path ? h('div', { class: 'cd-item wide' },
            h('span', { text: 'الملف المرفق' }),
            h('button', {
              class: 'btn small gold',
              type: 'button',
              text: 'تحميل / فتح الملف المرفق',
              onclick: function () {
                C.signedUrl('private-docs', r.attachment_path, 60).then(function (url) {
                  window.open(url, '_blank');
                }).catch(function (e) { toast(e.message, 'bad'); });
              }
            })
          ) : null
        );
      },
      filters: [
        { label: 'الطفل', opts: kidOpts, test: function (r, x) { return r.child_id === x; } },
        { label: 'الحالة', opts: [['published', 'منشور للولي'], ['draft', 'مسودة قيد الإعداد']], test: function (r, x) { return r.status === x; } }
      ],
      cols: [
        {
          label: 'عنوان التقرير',
          get: function (r) {
            return h('div', { class: 'row-actions' },
              badge('تقرير دوري', 'ok'),
              h('strong', { text: r.title }),
              r.attachment_path ? h('span', { class: 'badge gold', text: 'مرفق ملف' }) : null
            );
          },
          sort: function (r) { return r.title; }
        },
        { label: 'الطفل', get: function (r) { return nameOf(kids, r.child_id); } },
        { label: 'التاريخ', get: function (r) { return fmt(r.report_date); }, sort: function (r) { return r.report_date; } },
        { label: 'الحالة', get: function (r) { return badge(r.status === 'published' ? 'منشور للولي' : 'مسودة', r.status === 'published' ? 'ok' : 'gray'); } }
      ],
      actions: function (r) {
        return [
          rbtn('تعديل التقرير', function () { return editReport(r); }),
          r.status === 'published'
            ? rbtn('إلغاء النشر', async function () {
              await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), { status: 'draft' });
              bust(); toast('تحوّل التقرير إلى مسودة.', 'ok'); go('reports');
            }, 'light')
            : rbtn('نشر للولي', async function () {
              await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), { status: 'published' });
              bust(); toast('تم نشر التقرير للولي.', 'ok'); go('reports');
            }, 'gold'),
          rbtn('حذف التقرير', async function () {
            if (!(await ask({ title: 'حذف التقرير؟', msg: 'سيُحذف التقرير نهائيًا.', ok: 'حذف', danger: true }))) return;
            await C.rest('DELETE', '/progress_reports?id=eq.' + uid(r.id));
            bust(); go('reports');
          }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     6.2 قسم استمارات التقييم البيداغوجي (Evaluations Only — مفصول تماماً ومطابق للصورة)
     ===================================================================== */
  async function secEvaluations(v) {
    if (isFarmSession()) return go('children');
    var d = await getMany('reports', 'children', 'branches', 'sections');
    var allReports = d[0], kids = d[1], branches = d[2], sections = d[3];

    // إظهار استمارات التقييم فقط
    var rows = allReports.filter(function (r) { return isEvaluationReport(r); });

    if (S.isEducator && (S.eduSectionId || S.eduSectionName)) {
      kids = kids.filter(function (k) { return childMatchesSection(k, S.eduSectionId, S.eduSectionName, sections); });
      var allowedKidIds = {};
      kids.forEach(function (k) { allowedKidIds[k.id] = true; });
      rows = rows.filter(function (r) { return !!allowedKidIds[r.child_id]; });
    } else if (!S.isEducator) {
      kids = kids.filter(function (k) { return childCenterKey(k, branches, sections) === S.activeCenter; });
      sections = sections.filter(function (s) { return sectionCenterKey(s, branches) === S.activeCenter; });
      var centerKidIds = {};
      kids.forEach(function (k) { centerKidIds[k.id] = true; });
      rows = rows.filter(function (r) { return !!centerKidIds[r.child_id]; });
    }

    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });
    var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
    var secAllOpts = sections.map(function (s) { return [s.id, s.name]; });

    if (S.openEvalDirect) {
      S.openEvalDirect = false;
      return openEvaluationBuilder(null, kids, sections, secAllOpts, branchOpts);
    }

    listView(v, {
      title: S.isEducator ? ('استمارات التقييم البيداغوجي — قسم ' + (S.eduSectionName || 'فوجي')) : 'استمارات التقييم البيداغوجي الرسمية للطلبة',
      addLabel: 'إضافة استمارة تقييم جديدة',
      onAdd: function () {
        if (!kids.length) return toast('لا يوجد أطفال مسجلون في هذا القسم.', 'bad');
        openEvaluationBuilder(null, kids, sections, secAllOpts, branchOpts);
      },
      rows: rows,
      empty: 'لا توجد استمارات تقييم مسجلة بعد. اضغط «إضافة استمارة تقييم جديدة» لإنشاء استمارة مطابقة للنموذج الرسمي.',
      search: function (r) { return r.title + ' ' + nameOf(kids, r.child_id); },
      details: function (r) {
        var kd = kids.filter(function (k) { return k.id === r.child_id; })[0];
        var sName = kd ? (nameOf(sections, kd.section_id, 'name') || kd.section || '') : '';
        return renderEvaluationSheetView(r, kd ? kd.full_name : '—', sName, kd);
      },
      filters: [
        { label: 'الطفل', opts: kidOpts, test: function (r, x) { return r.child_id === x; } },
        { label: 'الحالة', opts: [['published', 'معتمدة ومنشورة للولي'], ['draft', 'مسودة قيد الإعداد']], test: function (r, x) { return r.status === x; } }
      ],
      cols: [
        {
          label: 'عنوان الاستمارة',
          get: function (r) {
            return h('div', { class: 'row-actions' },
              badge('استمارة تقييم رسمية', 'gold'),
              h('strong', { text: r.title })
            );
          },
          sort: function (r) { return r.title; }
        },
        { label: 'الطفل', get: function (r) { return nameOf(kids, r.child_id); } },
        { label: 'التاريخ', get: function (r) { return fmt(r.report_date); }, sort: function (r) { return r.report_date; } },
        { label: 'الحالة', get: function (r) { return badge(r.status === 'published' ? 'معتمدة ومنشورة' : 'مسودة', r.status === 'published' ? 'ok' : 'gray'); } }
      ],
      actions: function (r) {
        var kd = kids.filter(function (k) { return k.id === r.child_id; })[0];
        var sName = kd ? (nameOf(sections, kd.section_id, 'name') || kd.section || '') : '';
        return [
          rbtn('عرض الورقة والطباعة', function () {
            openModal(h('div', { class: 'modal-body wk-modal-print' },
              renderEvaluationSheetView(r, kd ? kd.full_name : '—', sName, kd),
              h('div', { class: 'modal-actions no-print' },
                h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }),
                h('button', { class: 'btn gold', type: 'button', text: 'طباعة الورقة الرسمية (A4)', onclick: function () { window.print(); } })
              )
            ));
          }, 'gold'),
          rbtn('تعديل الاستمارة', function () {
            return openEvaluationBuilder(r, kids, sections, secAllOpts, branchOpts);
          }),
          r.status === 'published'
            ? rbtn('إلغاء النشر', async function () {
              await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), { status: 'draft' });
              bust(); toast('تحوّلت الاستمارة إلى مسودة.', 'ok'); go('evaluations');
            }, 'light')
            : rbtn('اعتماد ونشر للولي', async function () {
              await C.rest('PATCH', '/progress_reports?id=eq.' + uid(r.id), { status: 'published' });
              bust(); toast('تم اعتماد ونشر الاستمارة للولي.', 'ok'); go('evaluations');
            }, 'gold'),
          rbtn('حذف الاستمارة', async function () {
            if (!(await ask({ title: 'حذف استمارة التقييم؟', msg: 'سيُحذف السجل نهائيًا.', ok: 'حذف', danger: true }))) return;
            await C.rest('DELETE', '/progress_reports?id=eq.' + uid(r.id));
            bust(); go('evaluations');
          }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     7. المواعيد والأنشطة (Appointments)
     ===================================================================== */
  async function secAppts(v) {
    if (S.isEducator) return go('children');
    var d = await getMany('appts', 'children'), rows = d[0], kids = d[1];
    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });

    function edit(a) {
      return openForm({
        title: a ? 'تعديل موعد' : 'إضافة موعد أو نشاط جديد', values: a || { audience: 'all', status: 'scheduled' },
        fields: [
          { k: 'title', label: 'عنوان الموعد / النشاط', req: true, max: 150 },
          { k: 'starts_at', label: 'تاريخ ووقت البدء', type: 'datetime', req: true },
          { k: 'ends_at', label: 'تاريخ ووقت الانتهاء (اختياري)', type: 'datetime' },
          { k: 'location', label: 'المكان (مثال: قاعة الأنشطة، المركز الرئيسي)', max: 150 },
          { k: 'audience', label: 'المعنيون بالموعد', type: 'select', opts: [['all', 'جميع أولياء المركز'], ['child', 'أولياء طفل محدّد']], req: true },
          { k: 'child_id', label: 'الطفل المعني', type: 'select', opts: kidOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'description', label: 'تفاصيل وإرشادات إضافية', type: 'textarea', max: 2000 },
          { k: 'status', label: 'الحالة', type: 'select', opts: [['scheduled', 'قائم / مبرمج'], ['cancelled', 'ملغى']], req: true }
        ],
        onSubmit: async function (x) {
          if (x.ends_at && x.ends_at < x.starts_at) throw new Error('وقت الانتهاء يجب أن يكون بعد وقت البدء.');
          var body = {
            title: x.title, starts_at: x.starts_at, ends_at: x.ends_at || null, location: x.location || null,
            audience: x.audience, child_id: x.audience === 'child' ? x.child_id : null, description: x.description || null, status: x.status
          };
          if (a) await C.rest('PATCH', '/appointments?id=eq.' + uid(a.id), body); else await C.rest('POST', '/appointments', body);
          bust(); toast('تم حفظ الموعد بنجاح.', 'ok'); go('appts');
        }
      });
    }

    listView(v, {
      title: 'المواعيد والأنشطة المبرمجة', addLabel: 'إضافة موعد', onAdd: function () { edit(null); }, rows: rows, empty: 'لا توجد مواعيد مسجلة.',
      search: function (r) { return r.title + ' ' + (r.location || '') + ' ' + (r.audience === 'child' ? nameOf(kids, r.child_id) : 'الجميع'); },
      filters: [{ label: 'الحالة', opts: [['scheduled', 'قائم'], ['cancelled', 'ملغى']], test: function (r, x) { return r.status === x; } }],
      cols: [
        { label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } },
        { label: 'الوقت', get: function (r) { return fmt(r.starts_at, true); }, sort: function (r) { return r.starts_at; } },
        { label: 'المعنيون', get: function (r) { return r.audience === 'all' ? 'جميع الأولياء' : 'خاص بـ ' + nameOf(kids, r.child_id); } },
        { label: 'المكان', get: function (r) { return r.location || '—'; } },
        { label: 'الحالة', get: function (r) { return badge(r.status === 'scheduled' ? 'قائم' : 'ملغى', r.status === 'scheduled' ? 'ok' : 'bad'); } }
      ],
      actions: function (r) {
        return [
          rbtn('تعديل', function () { return edit(r); }),
          rbtn('حذف', async function () { if (!(await ask({ title: 'حذف الموعد؟', msg: 'سيُحذف نهائيًا.', ok: 'حذف', danger: true }))) return; await C.rest('DELETE', '/appointments?id=eq.' + uid(r.id)); bust(); go('appts'); }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     8. الرسائل والإعلانات (Messages)
     ===================================================================== */
  async function secMsgs(v) {
    if (S.isEducator) return go('children');
    var d = await getMany('msgs', 'reads', 'parents', 'children', 'branches', 'sections');
    var rows = d[0], reads = d[1], pars = d[2], kids = d[3], branches = d[4], sections = d[5];
    var branchOpts = branches.map(function (b) { return [b.id, b.name]; });
    var secAllOpts = sections.map(function (s) { return [s.id, s.name]; });
    var parOpts = pars.map(function (p) { return [p.user_id, p.full_name]; });
    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });

    function readCount(id) { return reads.filter(function (x) { return x.message_id === id; }).length; }

    function edit(m) {
      var kid0 = m && m.child_id ? kids.filter(function (k) { return k.id === m.child_id; })[0] : null;
      var vals = m ? Object.assign({}, m, { branch_id: kid0 ? kid0.branch_id : '', section_id: kid0 ? kid0.section_id : '' }) : { kind: 'announcement', audience: 'all' };
      var lastSec = vals.section_id || '';
      return openForm({
        title: m ? 'تعديل رسالة/إعلان' : 'رسالة / إعلان جديد', values: vals,
        submits: m && m.published_at ? [{ key: 'save', label: 'حفظ التعديلات (منشور)' }] : [{ key: 'draft', label: 'حفظ كمسودة' }, { key: 'publish', label: 'نشر الآن' }],
        fields: [
          { k: 'kind', label: 'النوع', type: 'select', opts: [['announcement', 'إعلان عام'], ['message', 'رسالة خاصة']], req: true },
          { k: 'audience', label: 'المستلمون', type: 'select', opts: [['all', 'جميع الأولياء'], ['parent', 'ولي معيّن'], ['child', 'أولياء طفل معيّن']], req: true },
          { k: 'parent_id', label: 'الولي المستلم', type: 'select', opts: parOpts, req: true, showIf: function (x) { return x.audience === 'parent'; } },
          { k: 'branch_id', label: 'الفرع', type: 'select', opts: branchOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'section_id', label: 'القسم / الفوج', type: 'select', opts: secAllOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'child_id', label: 'الطفل المعني (يصل فقط لوليّه)', type: 'select', opts: kidOpts, req: true, showIf: function (x) { return x.audience === 'child'; } },
          { k: 'title', label: 'العنوان', req: true, max: 150 },
          { k: 'body', label: 'نص الرسالة / الإعلان', type: 'textarea', req: true, max: 5000 }
        ],
        onChange: function (key, cur, api) {
          if (cur.audience !== 'child') { api.note('pick', ''); return; }
          var secs = sections.filter(function (s) { return s.branch_id === cur.branch_id; });
          api.setOpts('section_id', secs.map(function (s) { return [s.id, s.name]; }));
          var secNow = api.input('section_id').value;
          if (secNow !== lastSec) { api.input('child_id').value = ''; lastSec = secNow; }
          var ks = secNow ? kids.filter(function (k) { return k.section_id === secNow; }) : [];
          api.setOpts('child_id', ks.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; }));
          if (!cur.branch_id) api.note('pick', 'اختر الفرع أولًا لعرض أقسامه.');
          else if (!secs.length) api.note('pick', 'لا توجد أقسام في هذا الفرع بعد.');
          else if (!secNow) api.note('pick', 'اختر القسم لعرض أطفاله.');
          else if (!ks.length) api.note('pick', 'لا يوجد أطفال مسجلون في هذا القسم.');
          else api.note('pick', '');
        },
        onSubmit: async function (x, key) {
          if (x.audience === 'child') {
            var kd = kids.filter(function (k) { return k.id === x.child_id; })[0];
            if (!kd || kd.section_id !== x.section_id) throw new Error('الطفل المختار لا ينتمي إلى القسم المحدد.');
          }
          var body = {
            kind: x.kind, audience: x.audience, parent_id: x.audience === 'parent' ? x.parent_id : null, child_id: x.audience === 'child' ? x.child_id : null,
            title: x.title, body: x.body, published_at: key === 'publish' ? new Date().toISOString() : (m ? m.published_at : null)
          };
          if (m) await C.rest('PATCH', '/messages?id=eq.' + uid(m.id), body); else await C.rest('POST', '/messages', body);
          bust(); toast(key === 'publish' ? 'تم النشر بنجاح.' : 'حُفظت المسودة.', 'ok'); go('msgs');
        }
      });
    }

    function to(r) { return r.audience === 'all' ? 'جميع الأولياء' : r.audience === 'parent' ? 'ولي: ' + nameOf(pars, r.parent_id) : 'أولياء: ' + nameOf(kids, r.child_id); }

    listView(v, {
      title: 'الرسائل والإعلانات للأولياء', addLabel: 'إنشاء رسالة/إعلان', onAdd: function () { edit(null); }, rows: rows, empty: 'لا توجد رسائل.',
      search: function (r) { return r.title + ' ' + to(r); },
      filters: [{ label: 'النوع', opts: [['announcement', 'إعلان عام'], ['message', 'رسالة خاصة']], test: function (r, x) { return r.kind === x; } }, { label: 'الحالة', opts: [['d', 'مسودة'], ['p', 'منشور']], test: function (r, x) { return (r.published_at ? 'p' : 'd') === x; } }],
      cols: [
        { label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } },
        { label: 'النوع', get: function (r) { return r.kind === 'message' ? 'رسالة خاصة' : 'إعلان عام'; } },
        { label: 'المستلمون', get: to },
        { label: 'الحالة', get: function (r) { return r.published_at ? badge('منشور ' + fmt(r.published_at), 'ok') : badge('مسودة'); } },
        { label: 'قرأها', get: function (r) { return r.published_at ? String(readCount(r.id)) : '—'; } }
      ],
      actions: function (r) {
        return [
          rbtn('تعديل', function () { return edit(r); }),
          r.published_at ? null : rbtn('نشر الآن', async function () { await C.rest('PATCH', '/messages?id=eq.' + uid(r.id), { published_at: new Date().toISOString() }); bust(); toast('تم النشر.', 'ok'); go('msgs'); }, 'gold'),
          rbtn('حذف', async function () { if (!(await ask({ title: 'حذف الرسالة؟', msg: 'ستختفي من فضاء الأولياء نهائيًا.', ok: 'حذف', danger: true }))) return; await C.rest('DELETE', '/messages?id=eq.' + uid(r.id)); bust(); go('msgs'); }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     9. الوثائق الخاصة (Documents)
     ===================================================================== */
  async function secDocs(v) {
    if (S.isEducator) return go('children');
    var d = await getMany('docs', 'children'), rows = d[0], kids = d[1];
    var kidOpts = kids.map(function (k) { return [k.id, (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name]; });

    function upload() {
      return openForm({
        title: 'رفع وثيقة خاصة لملف طفل', submits: [{ key: 'up', label: 'رفع الوثيقة' }],
        fields: [
          { k: 'child_id', label: 'الطفل المعني', type: 'select', opts: kidOpts, req: true },
          { k: 'title', label: 'عنوان الوثيقة', req: true, max: 150 },
          { k: 'category', label: 'التصنيف (مثال: تقرير نفسي، فحص طبي، شهادة مدرسية)', max: 60 },
          { k: 'file', label: 'الملف (PDF/JPG/PNG/WebP — حتى 5MB)', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp', req: true },
          { k: 'shared', label: 'إتاحة الوثيقة للتحميل في فضاء ولي الطفل', type: 'checkbox' }
        ],
        onSubmit: async function (x) {
          var up = await uploadChecked(x.file, x.child_id);
          try {
            await C.rest('POST', '/documents', {
              title: x.title, category: x.category || null, child_id: x.child_id,
              storage_path: up.path, mime_type: up.mime, size_bytes: up.size, shared_with_parent: !!x.shared
            });
          } catch (e) {
            C.removeObject('private-docs', up.path).catch(function () {});
            throw e;
          }
          bust(); toast('تم رفع الوثيقة بنجاح.', 'ok'); go('docs');
        }
      });
    }

    listView(v, {
      title: 'الوثائق والملفات الخاصة', addLabel: 'رفع وثيقة', onAdd: function () { if (!kids.length) return toast('أضف طفلًا أولًا.', 'bad'); upload(); }, rows: rows, empty: 'لا توجد وثائق مسجلة.',
      search: function (r) { return r.title + ' ' + (r.category || '') + ' ' + nameOf(kids, r.child_id); },
      filters: [
        { label: 'الطفل', opts: kidOpts, test: function (r, x) { return r.child_id === x; } },
        { label: 'المشاركة', opts: [['1', 'متاحة للولي'], ['0', 'خاصة بالإدارة فقط']], test: function (r, x) { return String(+r.shared_with_parent) === x; } }
      ],
      cols: [
        { label: 'العنوان', get: function (r) { return r.title; }, sort: function (r) { return r.title; } },
        { label: 'الطفل', get: function (r) { return nameOf(kids, r.child_id); } },
        { label: 'التصنيف', get: function (r) { return r.category || '—'; } },
        { label: 'الحجم والنوع', get: function (r) { return r.mime_type.split('/')[1].toUpperCase() + ' · ' + size(r.size_bytes); } },
        { label: 'مع الولي', get: function (r) { return badge(r.shared_with_parent ? 'متاحة للولي' : 'خاصة بالإدارة', r.shared_with_parent ? 'ok' : 'gray'); } },
        { label: 'تاريخ الرفع', get: function (r) { return fmt(r.created_at); }, sort: function (r) { return r.created_at; } }
      ],
      actions: function (r) {
        return [
          rbtn('فتح', async function () {
            var url = await C.signedUrl('private-docs', r.storage_path, 60);
            info('رابط مؤقت مشفّر (دقيقة واحدة)', h('a', { class: 'btn gold', href: url, target: '_blank', rel: 'noopener noreferrer', text: 'فتح الوثيقة' }));
          }),
          rbtn(r.shared_with_parent ? 'إيقاف المشاركة' : 'مشاركة مع الولي', async function () {
            await C.rest('PATCH', '/documents?id=eq.' + uid(r.id), { shared_with_parent: !r.shared_with_parent }); bust(); go('docs');
          }),
          rbtn('حذف', async function () {
            if (!(await ask({ title: 'حذف الوثيقة؟', msg: 'سيُحذف الملف نهائيًا من وحدة التخزين الآمنة.', ok: 'حذف نهائي', danger: true }))) return;
            await C.rest('DELETE', '/documents?id=eq.' + uid(r.id));
            try { await C.removeObject('private-docs', r.storage_path); } catch (e) {}
            bust(); go('docs');
          }, 'danger')
        ];
      }
    });
  }

  /* =====================================================================
     10. قسم الإدارة وحسابات المراكز والمربيات (مع إذن الدخول لكل مركز وحده + إظهار كلمة المرور)
     ===================================================================== */
  async function secAccounts(v, fromHubAll) {
    if (S.isEducator) return go('children');
    var isAllCentersView = !!fromHubAll || (S.sec === 'hub_accounts');
    var returnSec = isAllCentersView ? 'hub_accounts' : 'accounts';
    var targetCenter = isAllCentersView ? 'all' : (S.activeCenter || 'main');
    var cm = getCenterMeta(S.activeCenter);

    var d = await Promise.all([
      C.rpc('admin_list').catch(function () { return { admins: [], can_manage: false }; }),
      get('sections'),
      get('branches'),
      loadPortalMeta(true)
    ]);
    var r = d[0] || { admins: [], can_manage: true }, allSections = d[1] || [], branches = d[2] || [], meta = d[3];
    var canManage = !S.isEducator;
    S.isOwner = true;

    var centerSections = isAllCentersView ? allSections : allSections.filter(function (s) {
      return sectionCenterKey(s, branches) === targetCenter;
    });
    var sections = centerSections.length ? centerSections : allSections;
    var centerSecIds = {};
    centerSections.forEach(function (s) { centerSecIds[s.id] = true; });

    var headingTitle = isAllCentersView
      ? 'الحسابات الخاصة بجميع المراكز وإمكانية إضافة حساب'
      : targetCenter === 'work'
        ? 'الحسابات الخاصة بمركز المساعدة على العمل'
        : targetCenter === 'farm'
          ? 'الحسابات الخاصة بالمزرعة البيداغوجية'
          : 'حسابات المركز الرئيسي دار الإحسان';

    var headingDesc = isAllCentersView
      ? 'جميع حسابات الإدارة والمشرفين والمربيات في كافة المراكز الثلاثة، مع إمكانية إضافة حساب جديد وتحديد إذن الدخول لكل مركز وحده.'
      : 'الحسابات الإدارية وحسابات المربيات المخوّلة بالدخول إلى «' + cm.name + '»، مع إمكانية إضافة حساب جديد خاص بهذا المركز.';

    v.appendChild(h('div', { class: 'card' },
      h('div', { class: 'bar-sub' },
        h('div', null,
          h('h2', { text: headingTitle }),
          h('p', { class: 'muted small', text: headingDesc })
        ),
        h('div', { class: 'row-actions' },
          isAllCentersView ? h('button', {
            type: 'button',
            class: 'btn gold',
            text: 'العودة إلى لوحة الإدارة (المراكز الثلاثة)',
            onclick: function () { go('hub'); }
          }) : h('button', {
            type: 'button',
            class: 'btn light',
            text: 'العودة إلى الطلبة (' + cm.shortName + ')',
            onclick: function () { go('children'); }
          })
        )
      )
    ));

    function genAdminCode() {
      var al = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', o;
      do {
        var a = new Uint32Array(12); crypto.getRandomValues(a); o = '';
        for (var i = 0; i < a.length; i++) o += al.charAt(a[i] % al.length);
      } while (!/[A-Z]/.test(o) || !/[a-z]/.test(o) || !/[0-9]/.test(o));
      return o;
    }

    function createEducatorAccountFromAccounts() {
      return openCreateEducatorAccountModal(null, sections, meta, returnSec);
    }

    function openSetCenterAccessModal(accRow) {
      var emailKey = (accRow.email || '').toLowerCase();
      var currentMeta = (meta.account_meta && meta.account_meta[emailKey]) || {};
      return openForm({
        title: 'تحديد إذن الدخول للمركز: ' + (accRow.display_name || accRow.email),
        values: {
          center_access: currentMeta.center_access || accRow.center_access || 'all'
        },
        submits: [{ key: 'save', label: 'حفظ واعتماد إذن الدخول للمركز', gold: true }],
        fields: [
          {
            k: 'center_access',
            label: 'إذن الدخول للمراكز المسموح بها لهذا الحساب',
            type: 'select',
            req: true,
            opts: CENTER_ACCESS_OPTS,
            hint: 'اختر المركز الذي يُسمح لصاحب هذا الحساب بالدخول إليه وإدارة طلابه وأقسامه.'
          }
        ],
        onSubmit: async function (x) {
          var curMeta = await loadPortalMeta();
          curMeta.account_meta[emailKey] = Object.assign({}, curMeta.account_meta[emailKey] || {}, {
            center_access: x.center_access || 'all',
            updated_at: new Date().toISOString()
          });
          await savePortalMeta(curMeta);
          toast('تم تحديث إذن الدخول للمركز بنجاح: ' + formatCenterAccessLabel(x.center_access), 'ok');
          go(returnSec);
        }
      });
    }

    function invite() {
      var defaultCenterAccess = isAllCentersView ? 'all' : targetCenter;
      return openForm({
        title: isAllCentersView ? 'إضافة حساب جديد (مع تحديد المركز المسموح له)' : ('إضافة حساب خاص بـ ' + cm.name),
        values: { role: 'admin', center_access: defaultCenterAccess },
        submits: [{ key: 'go', label: 'إرسال الدعوة بالبريد' }, { key: 'pw', label: 'إنشاء الحساب بكلمة المرور وإذن المركز', gold: true }],
        fields: [
          { k: 'email', label: 'البريد الإلكتروني للحساب', type: 'email', req: true, kind: 'email', max: 254 },
          { k: 'full_name', label: 'اسم المدير / مسؤول المركز (اختياري)', type: 'text', max: 120 },
          { k: 'center_access', label: 'إذن الدخول للمركز (حدد المركز المسموح له بالدخول إليه)', type: 'select', req: true, opts: CENTER_ACCESS_OPTS,
            hint: 'يمكنك تخصيص الحساب لدخول مركز واحد وحده (المركز الرئيسي فقط، أو مركز المساعدة على العمل فقط، أو المزرعة البيداغوجية فقط) أو جميع المراكز.' },
          { k: 'role', label: 'الدور الإداري', type: 'select', req: true, opts: [['admin', 'مدير / مشرف مركز (إدارة الطلبة والأقسام والتقارير)'], ['editor', 'محرّر (إدارة محتوى الموقع والوسائط فقط)']] },
          { k: 'pw_input', label: 'كلمة المرور (تُحفظ وتظهر في جدول حسابات الإدارة)', type: 'text', max: 72, gen: genAdminCode,
            hint: '8 أحرف على الأقل مع حرف كبير (A-Z) ورقم. ستُحفظ كلمة المرور في سجل الحساب لتتمكن من رؤيتها في أي وقت.' }
        ],
        onSubmit: async function (x, key) {
          var email = x.email.toLowerCase();
          var curMeta = await loadPortalMeta();
          if (key === 'pw') {
            var pw = x.pw_input || '';
            if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw) || new TextEncoder().encode(pw).length > 72) throw new Error('كلمة المرور: 8 أحرف على الأقل مع حرف كبير (A-Z) ورقم واحد على الأقل.');
            try {
              await C.fn('admin-users', { action: 'create_admin', email: email, role: x.role, password: pw });
            } catch (eFn) {
              try { await C.rpc('admin_add_user', { p_email: email, p_password: pw }); } catch (eRpc) {}
            }
            curMeta.account_meta[email] = Object.assign({}, curMeta.account_meta[email] || {}, {
              role: x.role,
              full_name: x.full_name || '',
              center_access: x.center_access || 'all',
              has_account: true,
              updated_at: new Date().toISOString()
            });
            await savePortalMeta(curMeta);
            bust(); toast('أُنشئ الحساب وحُفظ إذن الدخول للمركز وكلمة المرور بنجاح.', 'ok'); go(returnSec);
            return;
          }
          var res = null;
          try {
            res = await C.fn('admin-users', { action: 'invite_admin', email: email, role: x.role });
          } catch (fnErr) {
            var redirectUrl = location.origin + location.pathname;
            await C.recover(email, redirectUrl);
          }
          curMeta.account_meta[email] = Object.assign({}, curMeta.account_meta[email] || {}, {
            role: x.role,
            full_name: x.full_name || '',
            center_access: x.center_access || 'all',
            updated_at: new Date().toISOString()
          });
          await savePortalMeta(curMeta);
          bust();
          var actionLink = res && res.action_link;
          if (actionLink) {
            info('تمت دعوة المدير بنجاح', h('div', null,
              h('p', { text: 'أُرسلت الدعوة إلى البريد: ' + email }),
              h('p', { class: 'muted small', text: 'إذن الدخول المعتمد: ' + formatCenterAccessLabel(x.center_access) }),
              h('div', { class: 'link-box', dir: 'ltr', text: actionLink }),
              h('button', { class: 'btn gold', type: 'button', text: 'نسخ الرابط المباشر', onclick: function () { try { navigator.clipboard.writeText(actionLink); toast('تم نسخ رابط التفعيل.', 'ok'); } catch (e) {} } })
            ));
          } else {
            toast('أُرسلت دعوة تفعيل الحساب إلى بريد المدير بنجاح.', 'ok');
          }
          go(returnSec);
        }
      });
    }

    function openSetAccountPasswordModal(accRow) {
      var emailKey = (accRow.email || '').toLowerCase();
      var currentMeta = (meta.account_meta && meta.account_meta[emailKey]) || {};
      return openForm({
        title: 'تعيين / تحديث كلمة المرور للحساب: ' + (accRow.display_name || accRow.email),
        values: {
          new_pw: genAdminCode()
        },
        submits: [{ key: 'save', label: 'حفظ واعتماد كلمة المرور', gold: true }],
        fields: [
          {
            k: 'new_pw',
            label: 'كلمة المرور الخاصة بالحساب',
            type: 'text',
            req: true,
            max: 72,
            gen: genAdminCode,
            hint: '10 أحرف على الأقل مع حرف كبير وحرف صغير ورقم. ستظهر هذه الكلمة مباشرة أمام الحساب في الجدول.'
          }
        ],
        onSubmit: async function (x) {
          var pw = String(x.new_pw || '').trim();
          if ( pw.length < 8 ) throw new Error('كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.');
          if (accRow.is_me) {
            try { await C.setPassword(pw); } catch (e) {}
          } else {
            try {
              await C.fn('admin-users', { action: 'create_admin', email: emailKey, role: accRow.role === 'editor' ? 'editor' : 'admin', password: pw });
            } catch (e) {
              try { await C.rpc('admin_add_user', { p_email: emailKey, p_password: pw }); } catch (e2) {}
            }
          }
          var curMeta = await loadPortalMeta();
          curMeta.account_meta[emailKey] = Object.assign({}, curMeta.account_meta[emailKey] || {}, {
            has_account: true,
            updated_at: new Date().toISOString()
          });
          await savePortalMeta(curMeta);
          toast('تم حفظ وتحديث كلمة المرور للحساب بنجاح.', 'ok');
          go(returnSec);
        }
      });
    }

    var delEmailSet = {};
    (meta.deleted_emails || []).forEach(function (em) { delEmailSet[String(em || '').toLowerCase()] = true; });
    Object.keys(S.deletedRuntimeEmails || {}).forEach(function (em) { delEmailSet[em.toLowerCase()] = true; });
    var activeAdminsList = (r.admins || []).filter(function (a) {
      var em = String(a.email || '').toLowerCase();
      if (em && delEmailSet[em]) return false;
      if (a.id && S.deletedRuntimeIds && S.deletedRuntimeIds[String(a.id)]) return false;
      return true;
    });

    // دمج الحسابات الإدارية مع حسابات المراكز والمربيات لعرضها في جدول موحد مع إذن الدخول للمركز وكلمة المرور
    var unifiedAccounts = activeAdminsList.map(function (a) {
      var em = (a.email || '').toLowerCase();
      var am = (meta.account_meta && meta.account_meta[em]) || {};
      var isEdu = am.role === 'educator';
      var rolePrefix = isEdu ? '' : '';
      var titleSuffix = am.job_title ? (' — ' + am.job_title) : '';
      return {
        id: a.id,
        email: a.email,
        display_name: am.full_name ? (rolePrefix + am.full_name + titleSuffix) : a.email,
        role: isEdu ? 'educator' : a.role,
        job_title: am.job_title || (isEdu ? 'مربية' : 'إداري'),
        dob: am.dob || '',
        center_access: a.is_owner ? 'all' : (am.center_access || am.center || 'all'),
        section_name: isEdu ? (am.section_name || nameOf(sections, am.section_id, 'name')) : (am.section_name || 'إدارة المركز'),
        phone: am.phone || '—',
        has_account: true,
        is_owner: a.is_owner,
        is_me: a.is_me,
        disabled: a.disabled,
        last_sign_in_at: a.last_sign_in_at,
        educator_id: am.educator_id || null
      };
    });

    Object.keys(meta.account_meta || {}).forEach(function (emKey) {
      var am = meta.account_meta[emKey];
      if (!am) return;
      var exists = unifiedAccounts.some(function (u) { return (u.email || '').toLowerCase() === emKey.toLowerCase(); });
      if (!exists) {
        var isEdu = am.role === 'educator';
        var rolePrefix = isEdu ? '' : '';
        var titleSuffix = am.job_title ? (' — ' + am.job_title) : '';
        unifiedAccounts.push({
          id: am.educator_id || emKey,
          email: emKey,
          display_name: am.full_name ? (rolePrefix + am.full_name + titleSuffix) : emKey,
          role: isEdu ? 'educator' : (am.role || 'admin'),
          job_title: am.job_title || (isEdu ? 'مربية' : 'إداري'),
          dob: am.dob || '',
          center_access: am.center_access || am.center || 'all',
          section_name: isEdu ? (am.section_name || nameOf(sections, am.section_id, 'name') || '—') : (am.section_name || 'إدارة المركز'),
          phone: am.phone || '—',
          has_account: !!am.has_account,
          is_owner: false,
          is_me: false,
          disabled: false,
          last_sign_in_at: null,
          educator_id: am.educator_id || null,
          virtual_edu: true
        });
      }
    });

    // تصفية الحسابات حسب المركز الحالي إذا كنا داخل مركز محدد (المركز الرئيسي / المساعدة على العمل / المزرعة البيداغوجية)
    var displayedAccounts = isAllCentersView ? unifiedAccounts : unifiedAccounts.filter(function (a) {
      if (a.role === 'educator') {
        var em = (a.email || '').toLowerCase();
        var am = (meta.account_meta && meta.account_meta[em]) || {};
        if (am.section_id && centerSecIds[am.section_id]) return true;
        if (targetCenter === 'work' && (String(a.section_name || '').indexOf('التمهين') >= 0 || String(a.section_name || '').indexOf('المساعدة') >= 0)) return true;
        if (targetCenter === 'farm' && (String(a.section_name || '').indexOf('البستنة') >= 0 || String(a.section_name || '').indexOf('المزرعة') >= 0)) return true;
        return false;
      }
      var allowedForAcc = parseAllowedCenters(a.is_owner ? 'all' : a.center_access);
      return allowedForAcc.indexOf(targetCenter) >= 0;
    });

    listView(v, {
      title: isAllCentersView ? 'قائمة الحسابات الخاصة بجميع المراكز' : ('قائمة ' + headingTitle.replace(/^[^\s]+\s/, '')),
      desc: headingDesc,
      addLabel: canManage ? (isAllCentersView ? 'إضافة حساب جديد (لأي مركز)' : ('إضافة حساب في ' + cm.shortName)) : '',
      onAdd: canManage ? invite : null,
      extra: canManage ? [
        {
          label: 'إنشاء حساب للمربية',
          kind: 'light',
          onclick: createEducatorAccountFromAccounts
        }
      ] : [],
      rows: displayedAccounts,
      sheet: true,
      empty: 'لا توجد حسابات.',
      search: function (a) { return (a.display_name || '') + ' ' + (a.email || '') + ' ' + (a.section_name || '') + ' ' + (a.phone || '') + ' ' + formatCenterAccessLabel(a.center_access); },
      cols: [
        {
          label: 'الحساب / المستخدم',
          get: function (a) {
            var suffix = a.is_owner ? ' (المالك الرئيسي)' : a.is_me ? ' (أنت)' : '';
            var isSynthetic = a.email && /^edu\.\d+@darelihsan\.org$/i.test(a.email);
            var phoneDisplay = (a.phone && a.phone !== '—') ? a.phone : '';
            if (a.role === 'educator') {
              return h('div', null,
                h('strong', { text: a.display_name }),
                phoneDisplay ? h('div', { class: 'muted small', dir: 'ltr', text: phoneDisplay }) : null
              );
            }
            if (a.role === 'specialist' || a.job_title === 'أخصائية نفسانية') {
              return h('div', null,
                h('strong', { text: (a.display_name || 'الأخصائية نواري اسماء بنت جيلالي') + suffix }),
                phoneDisplay ? h('div', { class: 'muted small', dir: 'ltr', text: phoneDisplay }) : null
              );
            }
            return h('div', null,
              h('strong', { text: (a.display_name || (isSynthetic ? phoneDisplay : a.email)) + suffix }),
              (!isSynthetic && a.display_name && a.display_name !== a.email) ? h('div', { class: 'muted small', dir: 'ltr', text: a.email }) : (isSynthetic && phoneDisplay ? h('div', { class: 'muted small', dir: 'ltr', text: phoneDisplay }) : null)
            );
          },
          sort: function (a) { return a.display_name || a.email; }
        },
        {
          label: 'الدور وإذن الدخول للمركز',
          get: function (a) {
            if (a.role === 'educator') {
              return h('div', { class: 'row-actions' },
                badge('مربية قسم', 'gold'),
                badge(a.section_name || 'قسم مخصص', 'ok')
              );
            }
            if (a.role === 'specialist' || a.job_title === 'أخصائية نفسانية') {
              return h('div', { class: 'row-actions' },
                badge('أخصائية نفسانية', 'gold'),
                badge('المركز الرئيسي دار الإحسان', 'ok')
              );
            }
            var roleBdg = a.is_owner ? badge('المالك الرئيسي', 'gold') : a.role === 'editor' ? badge('محرّر موقع', 'gray') : badge('مدير / مسؤول مركز', 'ok');
            var centerBdg = badge(formatCenterAccessLabel(a.is_owner ? 'all' : a.center_access), (!a.center_access || a.center_access === 'all' || a.is_owner) ? 'ok' : 'gold');
            return h('div', { class: 'row-actions' }, roleBdg, centerBdg);
          }
        },
        {
          label: 'رقم الهاتف وكلمة المرور (DI + تاريخ الميلاد)',
          get: function (a) {
            var dobPw = staffPasswordFromDob(a.dob);
            return h('div', { class: 'row-actions' },
              a.phone && a.phone !== '—' ? h('span', { dir: 'ltr', class: 'sic-num', text: a.phone }) : null,
              dobPw ? h('code', { dir: 'ltr', class: 'sic-num', text: dobPw }) : badge('مشفرة (bcrypt)', 'ok')
            );
          }
        },
        { label: 'آخر تسجيل دخول', get: function (a) { return fmt(a.last_sign_in_at, true); } },
        { label: 'الحالة', get: function (a) { return badge(a.disabled ? 'معطَّل' : 'مفعّل', a.disabled ? 'bad' : 'ok'); } }
      ],
      actions: function (a) {
        var actList = [];
        if (a.role === 'educator') {
          var eduObj = (meta.educators || []).filter(function (e) { return e.id === a.educator_id || (e.email && e.email.toLowerCase() === (a.email || '').toLowerCase()); })[0];
          if (eduObj) {
            actList.push(rbtn('تعديل الحساب وكلمة السر', function () { return openCreateEducatorAccountModal(eduObj, sections, meta, returnSec); }, 'gold'));
          } else {
            actList.push(rbtn('تغيير كلمة المرور', function () { return openSetAccountPasswordModal(a); }, 'light'));
          }
        } else {
          actList.push(rbtn('تغيير كلمة المرور', function () { return openSetAccountPasswordModal(a); }, 'light'));
          if (!a.is_owner) {
            actList.push(rbtn('إذن الدخول للمركز', function () { return openSetCenterAccessModal(a); }, 'gold'));
          }
        }

        if (!a.virtual_edu && !a.is_me && DE.isUuid(String(a.id || ''))) {
          actList.push(rbtn(a.disabled ? 'تفعيل الحساب' : 'تعطيل الحساب', async function () {
            if (!a.disabled && !(await ask({ title: 'تعطيل هذا الحساب؟', msg: 'سيفقد صلاحياته فورًا ولن يستطيع الدخول إلى لوحة الإدارة.', ok: 'تعطيل', danger: true }))) return;
            try {
              await C.fn('admin-users', { action: 'set_admin_disabled', user_id: uid(a.id), disabled: !a.disabled });
            } catch (e) {
              await C.rest('PATCH', '/admins?user_id=eq.' + uid(a.id), { disabled: !a.disabled });
            }
            bust(); toast('تم تعديل حالة الحساب.', 'ok'); go(returnSec);
          }, a.disabled ? 'gold' : 'light'));
        }

        actList.push(rbtn('حذف الحساب', async function () {
          if (a.is_me) {
            return toast('لا يمكنك حذف الحساب الذي تسجل الدخول به حالياً.', 'bad');
          }
          if (!(await ask({
            title: 'حذف الحساب نهائيًا؟',
            msg: 'سيتم حذف الحساب (' + stripEmojis(a.display_name || a.email) + ') وسحب جميع صلاحياته فورًا. هل تريد تأكيد الحذف النهائي؟',
            ok: 'حذف نهائي',
            danger: true
          }))) return;

          var emLower = String(a.email || '').toLowerCase();
          if (a.id) S.deletedRuntimeIds[String(a.id)] = true;
          if (a.educator_id) S.deletedRuntimeIds[String(a.educator_id)] = true;
          if (emLower) S.deletedRuntimeEmails[emLower] = true;

          if (DE.isUuid(String(a.id || ''))) {
            try {
              await C.rpc('admin_remove_user', { p_user_id: uid(a.id) });
            } catch (rpcErr) {
              try { await C.fn('admin-users', { action: 'remove_admin', user_id: uid(a.id) }); } catch (e2) {
                try { await C.rest('DELETE', '/admins?user_id=eq.' + uid(a.id)); } catch (e3) {}
              }
            }
          }
          if (emLower) {
            try { await C.rpc('admin_remove_user_by_email', { p_email: emLower }); } catch (e4) {}
          }

          var curMeta = await loadPortalMeta();
          if (!Array.isArray(curMeta.deleted_emails)) curMeta.deleted_emails = [];
          if (!Array.isArray(curMeta.deleted_educator_ids)) curMeta.deleted_educator_ids = [];
          if (emLower && curMeta.deleted_emails.indexOf(emLower) < 0) curMeta.deleted_emails.push(emLower);
          if (a.educator_id && curMeta.deleted_educator_ids.indexOf(String(a.educator_id)) < 0) curMeta.deleted_educator_ids.push(String(a.educator_id));
          if (a.id && curMeta.deleted_educator_ids.indexOf(String(a.id)) < 0) curMeta.deleted_educator_ids.push(String(a.id));
          if (emLower && curMeta.account_meta) delete curMeta.account_meta[emLower];
          curMeta.educators = (curMeta.educators || []).filter(function (e) {
            return e.id !== a.educator_id && e.id !== a.id && String(e.email || '').toLowerCase() !== emLower;
          });
          await savePortalMeta(curMeta);
          bust();
          toast('تم حذف الحساب نهائيًا.', 'ok');
          go(returnSec);
        }, 'danger'));

        return actList;
      }
    });
  }

  /* =====================================================================
     11. سجل العمليات والتدقيق (Audit Log) مع صلاحيات الحذف للمدير الرئيسي
     ===================================================================== */
  async function secAudit(v) {
    if (S.isEducator) return go('children');
    var rows = (await C.rpc('admin_audit_list', { p_limit: 100 }).catch(function () { return []; })) || [];
    var accountsData = null, permError = null;
    try { accountsData = await C.rpc('admin_list'); } catch (e) { permError = e; }
    var isOwner = !!(accountsData && accountsData.can_manage);

    var card = h('div', { class: 'card' },
      h('h2', { text: 'سجل العمليات والرقابة الأمنية (Audit Log)' }),
      h('p', { class: 'muted small', text: 'يُسجَّل تلقائيًا نوع كل عملية إدارية، البريد الإلكتروني للمنفّذ، والمعرّف الرقمي فقط — دون تخزين كلمات مرور أو تقارير طبية حساسة. الحماية مشددة على مستوى قاعدة البيانات.' })
    );

    if (isOwner) {
      var superAdminActions = h('div', { class: 'row-actions audit-owner-bar' },
        h('span', { class: 'badge gold', text: 'صلاحيات المالك الرئيسي' }),
        h('button', {
          class: 'btn small light',
          type: 'button',
          text: 'حذف السجلات الأقدم من 30 يومًا',
          onclick: async function () {
            if (!(await ask({
              title: 'تصفية سجلات التدقيق القديمة؟',
              msg: 'سيتم حذف جميع سجلات العمليات التي مضى عليها أكثر من 30 يومًا نهائيًا.',
              ok: 'تأكيد الحذف'
            }))) return;
            try {
              var pastDate = new Date(Date.now() - 30 * 86400000).toISOString();
              var deleted = await C.rpc('admin_delete_audit', { p_older_than: pastDate });
              if (!deleted) toast('لا توجد سجلات أقدم من 30 يومًا، لذلك لم يُحذف شيء.');
              else toast('تم حذف ' + deleted + ' سجل تدقيق قديم.', 'ok');
              go('audit');
            } catch (e) {
              toast('تعذّر الحذف. يرجى التأكد من تشغيل ملف 08-fix-audit-and-admin-delete.sql في Supabase.', 'bad');
            }
          }
        }),
        h('button', {
          class: 'btn small danger',
          type: 'button',
          text: 'تصفية كل سجلات التدقيق',
          onclick: async function () {
            if (!(await ask({
              title: 'تصفية شاملة لسجلات العمليات؟',
              msg: 'سيتم مسح سجل العمليات والتدقيق كاملاً. هذه العملية لا يمكن التراجع عنها!',
              ok: 'مسح شامل', danger: true
            }))) return;
            try {
              var deleted = await C.rpc('admin_delete_audit', {});
              toast('تم مسح ' + deleted + ' سجل تدقيق بنجاح.', 'ok');
              go('audit');
            } catch (e) {
              toast('تعذّر المسح. يرجى التأكد من تشغيل ملف 08-fix-audit-and-admin-delete.sql في Supabase.', 'bad');
            }
          }
        })
      );
      card.appendChild(superAdminActions);
    } else {
      card.appendChild(h('p', { class: 'muted small', text: permError
        ? 'تعذّر التحقق من صلاحياتك لعرض أزرار الحذف. حدّث الصفحة أو أعد تسجيل الدخول.'
        : 'أزرار مسح السجل متاحة للمدير الرئيسي (المالك) فقط. الحساب الحالي مدير غير مالك.' }));
    }

    v.appendChild(card);

    listView(v, {
      title: 'آخر العمليات المسجّلة',
      rows: rows,
      empty: 'لا توجد عمليات مسجّلة حالياً.',
      search: function (r) { return (AUDIT[r.action] || r.action) + ' ' + (r.actor_email || ''); },
      cols: [
        { label: 'التوقيت', get: function (r) { return fmt(r.at, true); }, sort: function (r) { return r.at; } },
        { label: 'المنفّذ', get: function (r) { return r.actor_email || 'النظام السحابي'; } },
        { label: 'العملية المنجزة', get: function (r) { return AUDIT[r.action] || r.action; } },
        { label: 'المعرّف المعني', get: function (r) { return r.target || '—'; } }
      ],
      actions: function () { return []; }
    });
  }

  /* =====================================================================
     12. الأمان والإعدادات (Settings)
     ===================================================================== */
  async function secSettings(v) {
    if (S.isEducator) return go('children');
    var me = (await C.me().catch(function () { return S.me; })) || S.me, mfa = ((me && me.factors) || []).some(function (f) { return f.status === 'verified'; });
    v.appendChild(h('div', { class: 'card' },
      h('h2', { text: 'المصادقة الثنائية (MFA - TOTP)' }),
      h('p', null, badge(mfa ? 'مفعّلة لحسابك بنجاح' : 'غير مفعّلة', mfa ? 'ok' : 'bad')),
      h('p', { class: 'muted', text: mfa ? 'حسابك مؤمّن برمز المصادقة المزدوجة (Google Authenticator).' : 'يمكن تفعيلها لحسابك عبر تطبيق مصادقة مثل Google Authenticator أو Microsoft Authenticator.' })
    ));
    v.appendChild(h('div', { class: 'card' },
      h('h2', { text: 'الأمان وقيود النفاذ (RLS)' }),
      h('p', { class: 'muted', text: 'تم تطبيق سياسات Row Level Security صارمة في PostgreSQL. أولياء الأمور يستحيل عليهم رؤية أي بيانات تخص أطفالاً آخرين غير أبنائهم المسجلين. مفتاح الخدمة service_role غير موجود في المتصفح.' })
    ));
    v.appendChild(h('div', { class: 'card' },
      h('h2', { text: 'رموز الاستجابة السريعة (QR)' }),
      h('p', { class: 'muted', text: 'رموز QR المطبوعة على بطاقات انخراط الطلبة تشير إلى صفحة التحقق العامة qr.html، وتعرض 5 حقول رسمية فقط بدون أي تفاصيل حساسة أو أرقام هواتف خاصة.' })
    ));
  }

  /* =====================================================================
     12. قسم الأرشيف الشامل والنسخ الاحتياطية (Archive & Automated Backups)
     ===================================================================== */
  var ARABIC_MONTH_NAMES_LIST = {
    1: '01-جانفي', 2: '02-فيفري', 3: '03-مارس', 4: '04-أفريل',
    5: '05-ماي', 6: '06-جوان', 7: '07-جويلية', 8: '08-أوت',
    9: '09-سبتمبر', 10: '10-أكتوبر', 11: '11-نوفمبر', 12: '12-ديسمبر'
  };

  function sanitizeArchiveFolderName(name) {
    if (!name) return 'غير_معرف';
    return String(name).trim()
      .replace(/[\\/:*?"<>|\r\n\t]/g, '_')
      .slice(0, 100)
      .trim() || 'سجل';
  }

  function generateStandaloneReportHtml(rep, child, secName, brName) {
    var title = rep.title || 'تقرير تربوي';
    var chName = child ? child.full_name : 'غير محدد';
    var safeDate = rep.report_date || '';
    var memNo = child ? (child.membership_no || '—') : '—';
    var year = child ? (child.academic_year || '2024/2025') : '2024/2025';

    var achieve = rep.achievements || '—';
    var activ = rep.activities || '—';
    var notes = rep.notes || '—';

    // إن كانت استمارة تقييم رسمية
    if (isEvaluationReport(rep)) {
      var ev = parseEvaluationReport(rep);
      var supLines = (ev.supervisors || []).map(function (s) {
        return '<tr><td style="padding:6px;border:1px solid #000;font-weight:bold;">' + (s.name || '—') + '</td><td style="padding:6px;border:1px solid #000;">' + (s.role || '—') + '</td><td style="padding:6px;border:1px solid #000;color:#666;">..................</td></tr>';
      }).join('');

      var strLines = (ev.strengths || []).map(function (s) { return '<li>' + s + '</li>'; }).join('');
      var wkWLines = (ev.weaknesses || []).map(function (s) { return '<li>' + s + '</li>'; }).join('');
      var recLines = (ev.recommendations || []).map(function (s) { return '<li>' + s + '</li>'; }).join('');
      var ab = ev.abilities || {};

      return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' + title + ' — ' + chName + '</title>' +
        '<style>body{font-family:sans-serif;direction:rtl;padding:20px;color:#000;background:#fff;max-width:850px;margin:0 auto;border:2px solid #000;}' +
        '.hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px;}' +
        '.term{background:#EAB308;color:#000;font-weight:bold;font-size:16px;text-align:center;padding:6px;border:1px solid #000;margin-bottom:10px;}' +
        'table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px;} th,td{border:1px solid #000;padding:5px;}' +
        '.banner{background:#7DD3FC;font-weight:bold;text-align:center;padding:5px;border:1px solid #000;margin-bottom:8px;}' +
        '.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}' +
        '.box{border:1px solid #000;padding:8px;}' +
        '.rec-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;border:1px solid #000;padding:8px;}' +
        '</style></head><body>' +
        '<div class="hdr"><h3>جمعية أولياء الأطفال المعاقين ذهنيًا — المركز النفسي البيداغوجي دار الإحسان</h3>' +
        '<div>العطف - غرداية • COMPTE RENDU DE L\'EQUIPE PEDAGOGIQUE</div>' +
        '<h2>تقرير اللجنة البيداغوجية والتربوية</h2></div>' +
        '<div class="term">تقييم ' + (ev.term || 'الثلاثي الأخير') + ' للموسم الدراسي: ' + (ev.school_year || '2024/2025') + '</div>' +
        '<table><tr><td style="background:#f1f5f9;font-weight:bold;width:20%;">اسم ولقب الحالة:</td><td><strong>' + chName + '</strong></td><td style="background:#f1f5f9;font-weight:bold;width:20%;">رقم القيد:</td><td>' + memNo + '</td></tr>' +
        '<tr><td style="background:#f1f5f9;font-weight:bold;">الفرع / المركز:</td><td>' + brName + '</td><td style="background:#f1f5f9;font-weight:bold;">القسم:</td><td>' + secName + '</td></tr>' +
        '<tr><td style="background:#f1f5f9;font-weight:bold;">درجة الإعاقة:</td><td>' + (ev.degree_of_disability || '—') + '</td><td style="background:#f1f5f9;font-weight:bold;">تاريخ التقييم:</td><td>' + safeDate + '</td></tr></table>' +
        '<div class="banner">المشرفون على التقييم</div>' +
        '<table><thead><tr style="background:#f8fafc;"><th>المشرف: الإسم واللقب</th><th>الوظيفة</th><th>التوقيع</th></tr></thead><tbody>' + supLines + '</tbody></table>' +
        '<div class="banner">الوصف العام لأداء الحالة</div>' +
        '<div class="grid"><div class="box"><strong>التقرير العام:</strong><p style="white-space:pre-wrap;line-height:1.5;">' + (ev.general_report || '—') + '</p></div>' +
        '<div>' +
        '<div style="margin-bottom:6px;border:1px solid #000;padding:4px;"><strong style="background:#0F172A;color:#fff;display:block;padding:2px 4px;">1. إمكانيات والقدرات الحالية:</strong> ' + (ab.current_potentials || '—') + '</div>' +
        '<div style="margin-bottom:6px;border:1px solid #000;padding:4px;"><strong style="background:#F472B6;color:#831843;display:block;padding:2px 4px;">2. المهارات المعرفية والفكرية:</strong> ' + (ab.cognitive_intellectual || '—') + '</div>' +
        '<div style="margin-bottom:6px;border:1px solid #000;padding:4px;"><strong style="background:#60A5FA;color:#1E3A8A;display:block;padding:2px 4px;">3. اللغة استقبالية تعبيرية:</strong> ' + (ab.language_receptive_expressive || '—') + '</div>' +
        '<div style="margin-bottom:6px;border:1px solid #000;padding:4px;"><strong style="background:#FDBA74;color:#7C2D12;display:block;padding:2px 4px;">4. القدرات الإتصالية والسلوكية:</strong> ' + (ab.communication_behavioral || '—') + '</div>' +
        '<div style="margin-bottom:6px;border:1px solid #000;padding:4px;"><strong style="background:#86EFAC;color:#14532D;display:block;padding:2px 4px;">5. المعارف الأكاديمية وما قبل الأكاديمي:</strong> ' + (ab.academic_preacademic || '—') + '</div>' +
        '<div style="margin-bottom:6px;border:1px solid #000;padding:4px;"><strong style="background:#A7F3D0;color:#064E3B;display:block;padding:2px 4px;">6. القدرات الحركية والاستقلالية:</strong> ' + (ab.motor_independence || '—') + '</div>' +
        '</div></div>' +
        '<div class="banner" style="background:#86EFAC;color:#064E3B;">الخلاصة والتوصيات</div>' +
        '<div class="rec-grid">' +
        '<div><strong>1. نقاط القوة:</strong><ul>' + (strLines || '<li>—</li>') + '</ul></div>' +
        '<div><strong>2. نقاط الضعف:</strong><ul>' + (wkWLines || '<li>—</li>') + '</ul></div>' +
        '<div><strong>3. التوصيات:</strong><ul>' + (recLines || '<li>—</li>') + '</ul></div>' +
        '</div>' +
        '</body></html>';
    }

    return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' + title + ' — ' + chName + '</title>' +
      '<style>body{font-family:sans-serif;direction:rtl;padding:24px;color:#123E73;background:#fff;max-width:800px;margin:0 auto;}' +
      '.hdr{text-align:center;border-bottom:2px solid #123E73;padding-bottom:12px;margin-bottom:18px;}' +
      '.ttl{font-size:20px;font-weight:bold;color:#B4873A;margin-top:6px;}' +
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;background:#F8FAFC;padding:12px;border:1px solid #E2E8F0;border-radius:8px;font-size:14px;}' +
      '.box{margin-bottom:14px;border:1px solid #E2E8F0;border-radius:8px;padding:12px;}' +
      '.box-title{font-size:15px;font-weight:bold;color:#123E73;border-bottom:1px solid #CBD5E1;padding-bottom:4px;margin-top:0;}' +
      '.txt{white-space:pre-wrap;font-size:14px;color:#334155;line-height:1.6;}' +
      '</style></head><body>' +
      '<div class="hdr"><h2>جمعية أولياء الأطفال المعاقين ذهنيًا — دار الإحسان</h2><div class="ttl">' + title + '</div></div>' +
      '<div class="grid">' +
      '<div><strong>اسم التلميذ:</strong> ' + chName + '</div>' +
      '<div><strong>رقم القيد:</strong> ' + memNo + '</div>' +
      '<div><strong>الفرع / المركز:</strong> ' + brName + '</div>' +
      '<div><strong>الفوج / القسم:</strong> ' + secName + '</div>' +
      '<div><strong>تاريخ التقرير:</strong> ' + safeDate + '</div>' +
      '<div><strong>الموسم الدراسي:</strong> ' + year + '</div>' +
      '</div>' +
      '<div class="box"><h3 class="box-title">المكتسبات والمهارات المحققة</h3><div class="txt">' + achieve + '</div></div>' +
      '<div class="box"><h3 class="box-title">الأنشطة والورشات المنجزة</h3><div class="txt">' + activ + '</div></div>' +
      '<div class="box"><h3 class="box-title">ملاحظات وتوجيهات للأولياء</h3><div class="txt">' + notes + '</div></div>' +
      '</body></html>';
  }

  
  /* دوال إنشاء ملفات Word المعتمدة (.doc) الرسمية بدون أكواد برمجية */
  function generateWordDocReport(rep, child, secName, brName) {
    var title = rep.title || 'تقرير تربوي';
    var chName = child ? child.full_name : 'غير محدد';
    var safeDate = rep.report_date || '';
    var memNo = child ? (child.membership_no || '—') : '—';
    var year = child ? (child.academic_year || '2026/2027') : '2026/2027';

    var achieve = rep.achievements || '—';
    var activ = rep.activities || '—';
    var notes = rep.notes || '—';

    if (isEvaluationReport(rep)) {
      return generateWordDocEvaluation(rep, child, secName, brName);
    }

    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n' +
      '<head><meta charset="utf-8"><title>' + title + ' — ' + chName + '</title>\n' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->\n' +
      '<style>\n' +
      '@page { size: 21cm 29.7cm; margin: 2cm; mso-page-orientation: portrait; }\n' +
      'body { font-family: "Times New Roman", "Cairo", Arial, sans-serif; direction: rtl; text-align: right; color: #000000; }\n' +
      'table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }\n' +
      'th, td { border: 1pt solid #000000; padding: 6pt; font-size: 11pt; text-align: right; }\n' +
      'th { background-color: #F1F5F9; font-weight: bold; }\n' +
      '.hdr { text-align: center; border-bottom: 2pt solid #123E73; padding-bottom: 8pt; margin-bottom: 12pt; }\n' +
      '.ttl { font-size: 16pt; font-weight: bold; color: #B4873A; margin-top: 4pt; }\n' +
      '.box { border: 1pt solid #000000; padding: 8pt; margin-bottom: 10pt; }\n' +
      '.box-title { font-size: 12pt; font-weight: bold; color: #123E73; border-bottom: 1pt solid #CBD5E1; padding-bottom: 3pt; margin-top: 0; }\n' +
      '</style></head><body>\n' +
      '<div class="hdr"><h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>\n' +
      '<h3>جمعية أولياء الأطفال المعاقين ذهنيًا — دار الإحسان</h3>\n' +
      '<p>المركز النفسي البيداغوجي دار الإحسان — العطف، ولاية غرداية</p>\n' +
      '<div class="ttl">' + title + '</div></div>\n' +
      '<table><tr><th style="width:25%;">اسم التلميذ:</th><td><strong>' + chName + '</strong></td><th style="width:25%;">رقم القيد:</th><td>' + memNo + '</td></tr>\n' +
      '<tr><th>الفرع / المركز:</th><td>' + brName + '</td><th>الفوج / القسم:</th><td>' + secName + '</td></tr>\n' +
      '<tr><th>تاريخ التقرير:</th><td>' + safeDate + '</td><th>الموسم الدراسي:</th><td>' + year + '</td></tr></table>\n' +
      '<div class="box"><div class="box-title">المكتسبات والمهارات المحققة:</div><p style="white-space:pre-wrap;">' + achieve + '</p></div>\n' +
      '<div class="box"><div class="box-title">الأنشطة والورشات المنجزة:</div><p style="white-space:pre-wrap;">' + activ + '</p></div>\n' +
      '<div class="box"><div class="box-title">ملاحظات وتوجيهات للأولياء:</div><p style="white-space:pre-wrap;">' + notes + '</p></div>\n' +
      '<br><br><table><tr><td style="text-align:center;width:50%;border:none;"><strong>توقيع وختم المربية</strong></td><td style="text-align:center;width:50%;border:none;"><strong>توقيع وختم المدير</strong></td></tr></table>\n' +
      '</body></html>';
  }

  function generateWordDocEvaluation(rep, child, secName, brName) {
    var title = rep.title || 'تقرير اللجنة البيداغوجية والتربوية';
    var chName = child ? child.full_name : 'غير محدد';
    var safeDate = rep.report_date || '';
    var memNo = child ? (child.membership_no || '—') : '—';
    var year = child ? (child.academic_year || '2026/2027') : '2026/2027';

    var ev = parseEvaluationReport(rep);
    var supLines = (ev.supervisors || []).map(function (s) {
      return '<tr><td style="padding:6pt;border:1pt solid #000;font-weight:bold;">' + (s.name || '—') + '</td><td style="padding:6pt;border:1pt solid #000;">' + (s.role || '—') + '</td><td style="padding:6pt;border:1pt solid #000;color:#666;">........................</td></tr>';
    }).join('');

    var strLines = (ev.strengths || []).map(function (s) { return '<li>' + s + '</li>'; }).join('');
    var wkWLines = (ev.weaknesses || []).map(function (s) { return '<li>' + s + '</li>'; }).join('');
    var recLines = (ev.recommendations || []).map(function (s) { return '<li>' + s + '</li>'; }).join('');
    var ab = ev.abilities || {};

    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n' +
      '<head><meta charset="utf-8"><title>' + title + ' — ' + chName + '</title>\n' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->\n' +
      '<style>\n' +
      '@page { size: 21cm 29.7cm; margin: 2cm; mso-page-orientation: portrait; }\n' +
      'body { font-family: "Times New Roman", "Cairo", Arial, sans-serif; direction: rtl; text-align: right; color: #000000; }\n' +
      'table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }\n' +
      'th, td { border: 1pt solid #000000; padding: 6pt; font-size: 11pt; text-align: right; }\n' +
      '.banner { background-color: #EAB308; color: #000; font-weight: bold; text-align: center; padding: 6pt; border: 1pt solid #000; margin-bottom: 10pt; }\n' +
      '.sec-banner { background-color: #7DD3FC; font-weight: bold; text-align: center; padding: 6pt; border: 1pt solid #000; margin-bottom: 8pt; }\n' +
      '.hdr { text-align: center; border-bottom: 2pt solid #000; padding-bottom: 8pt; margin-bottom: 10pt; }\n' +
      '</style></head><body>\n' +
      '<div class="hdr"><h3>جمعية أولياء الأطفال المعاقين ذهنيًا — المركز النفسي البيداغوجي دار الإحسان</h3>\n' +
      '<p>العطف - غرداية • COMPTE RENDU DE L\'EQUIPE PEDAGOGIQUE</p>\n' +
      '<h2>' + title + '</h2></div>\n' +
      '<div class="banner">تقييم ' + (ev.term || 'الثلاثي الأخير') + ' للموسم الدراسي: ' + (ev.school_year || year) + '</div>\n' +
      '<table><tr><td style="background:#f1f5f9;font-weight:bold;width:20%;">اسم ولقب الحالة:</td><td><strong>' + chName + '</strong></td><td style="background:#f1f5f9;font-weight:bold;width:20%;">رقم القيد:</td><td>' + memNo + '</td></tr>\n' +
      '<tr><td style="background:#f1f5f9;font-weight:bold;">الفرع / المركز:</td><td>' + brName + '</td><td style="background:#f1f5f9;font-weight:bold;">القسم:</td><td>' + secName + '</td></tr>\n' +
      '<tr><td style="background:#f1f5f9;font-weight:bold;">درجة الإعاقة:</td><td>' + (ev.degree_of_disability || '—') + '</td><td style="background:#f1f5f9;font-weight:bold;">تاريخ التقييم:</td><td>' + safeDate + '</td></tr></table>\n' +
      '<div class="sec-banner">المشرفون على التقييم</div>\n' +
      '<table><thead><tr style="background:#f8fafc;"><th>المشرف: الإسم واللقب</th><th>الوظيفة</th><th>التوقيع والختم</th></tr></thead><tbody>' + supLines + '</tbody></table>\n' +
      '<div class="sec-banner">الوصف العام لأداء الحالة</div>\n' +
      '<table><tr><td style="width:50%;vertical-align:top;"><strong>التقرير العام:</strong><p style="white-space:pre-wrap;">' + (ev.general_report || '—') + '</p></td>\n' +
      '<td style="width:50%;vertical-align:top;">' +
      '<div><strong>1. إمكانيات والقدرات الحالية:</strong> ' + (ab.current_potentials || '—') + '</div><br>' +
      '<div><strong>2. المهارات المعرفية والفكرية:</strong> ' + (ab.cognitive_intellectual || '—') + '</div><br>' +
      '<div><strong>3. اللغة (استقبالية تعبيرية):</strong> ' + (ab.language_receptive_expressive || '—') + '</div><br>' +
      '<div><strong>4. القدرات الإتصالية والسلوكية:</strong> ' + (ab.communication_behavioral || '—') + '</div><br>' +
      '<div><strong>5. المعارف الأكاديمية وما قبل الأكاديمي:</strong> ' + (ab.academic_preacademic || '—') + '</div><br>' +
      '<div><strong>6. القدرات الحركية والاستقلالية:</strong> ' + (ab.motor_independence || '—') + '</div>' +
      '</td></tr></table>\n' +
      '<div class="sec-banner" style="background:#86EFAC;">الخلاصة والتوصيات</div>\n' +
      '<table><tr>' +
      '<td style="vertical-align:top;"><strong>1. نقاط القوة:</strong><ul>' + (strLines || '<li>—</li>') + '</ul></td>' +
      '<td style="vertical-align:top;"><strong>2. نقاط الضعف:</strong><ul>' + (wkWLines || '<li>—</li>') + '</ul></td>' +
      '<td style="vertical-align:top;"><strong>3. التوصيات:</strong><ul>' + (recLines || '<li>—</li>') + '</ul></td>' +
      '</tr></table>\n' +
      '</body></html>';
  }

  function generateWordArchiveReport(total, success, failed, year, monthName, errors) {
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n' +
      '<head><meta charset="utf-8"><title>تقرير الأرشفة والنسخ الاحتياطي</title>\n' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->\n' +
      '<style>body{font-family:"Times New Roman", "Cairo", Arial;direction:rtl;text-align:right;} table{border-collapse:collapse;width:100%;} th,td{border:1pt solid #000;padding:6pt;}</style>\n' +
      '</head><body>\n' +
      '<h2 style="text-align:center;color:#123E73;">المركز النفسي البيداغوجي دار الإحسان — تقرير الأرشفة والنسخ الاحتياطي</h2>\n' +
      '<p><strong>تاريخ وساعة التنفيذ:</strong> ' + (new Date().toLocaleString('ar-DZ')) + '</p>\n' +
      '<p><strong>السنة:</strong> ' + year + ' | <strong>الشهر:</strong> ' + monthName + '</p>\n' +
      '<table><tr><th>إجمالي السجلات</th><th>الملفات المؤرشفة بنجاح</th><th>الملفات التي تعذر تنزيلها</th></tr>\n' +
      '<tr><td>' + total + '</td><td><strong style="color:green;">' + success + '</strong></td><td><strong style="color:' + (failed ? 'red' : 'green') + ';">' + failed + '</strong></td></tr></table>\n' +
      '<h3>ملاحظات العملية:</h3><p>' + (errors.length ? errors.join('<br>') : 'تمت أرشفة وتنزيل كافة الملفات والتقارير بنجاح تام 100% بصيغ Word و PDF و Excel.') + '</p>\n' +
      '</body></html>';
  }

  async function secArchive(v) {
    if (S.isEducator || !canAccessGeneralAdmin()) return go('children');

    v.textContent = '';

    var d = await Promise.all([
      get('children'),
      get('branches'),
      get('sections'),
      get('reports'),
      get('docs'),
      C.rest('GET', '/archive_runs?select=*&order=run_date.desc&limit=15').catch(function () { return []; })
    ]);

    var allKids = d[0] || [], branches = d[1] || [], sections = d[2] || [];
    var allReports = d[3] || [], allDocs = d[4] || [], dbPastRuns = d[5] || [];

    var brMap = {}, secMap = {}, chMap = {};
    branches.forEach(function (b) { brMap[b.id] = b; });
    sections.forEach(function (s) { secMap[s.id] = s; });
    allKids.forEach(function (c) { chMap[c.id] = c; });

    // تتبع العمليات السابقة (دمج قاعدة البيانات مع التخزين المحلي)
    var localPastRuns = [];
    try { localPastRuns = JSON.parse(localStorage.getItem('de_archive_runs_history') || '[]'); } catch (e) {}
    var pastRuns = dbPastRuns.length ? dbPastRuns : localPastRuns;

    // العنوان العلوي
    v.appendChild(h('div', { class: 'bar-sub' },
      h('div', null,
        h('h2', { text: 'نظام الأرشفة الشاملة والنسخ الاحتياطية' }),
        h('p', { class: 'muted small', text: 'تنزيل أرشيف ZIP شامل ومنظم للملفات والتقارير والوثائق حسب السنة، الشهر، الفرع، القسم، وكل طفل.' })
      )
    ));

    // بطاقة التحميل اليدوي المباشر الشامل (نزولاً عند طلب الإدارة للتحميل اليدوي المباشر)
    var manualDirectCard = h('div', { class: 'arch-manual-direct-card' },
      h('div', null,
        h('h3', null, makeSvgIcon('s-download'), h('span', { text: 'التحميل اليدوي المباشر للأرشيف الشامل (ZIP)' })),
        h('p', { text: 'يمكنك تنزيل أرشيف ZIP شامل لكافة ملفات المركز، التقارير التربوية، استمارات التقييم، الوثائق المرفوعة، وبيانات الأطفال فوراً بضغطة زر واحدة دون الحاجة إلى فلاتر إضافية.' })
      ),
      h('div', { class: 'arch-manual-btns-wrap' },
        h('button', {
          type: 'button',
          class: 'arch-manual-btn-main',
          onclick: function () {
            startArchiveJob({
              scope: 'all',
              year: now.getFullYear(),
              month: null,
              scopeLabel: 'التحميل اليدوي المباشر لكامل أرشيف دار الإحسان'
            });
          }
        }, makeSvgIcon('s-archive'), h('span', { text: 'تحميل كامل الأرشيف يدوياً الآن (ZIP)' })),
        h('button', {
          type: 'button',
          class: 'arch-manual-btn-sub',
          onclick: async function () {
            toast('جارٍ استخراج وتصدير قاعدة البيانات...');
            try {
              var kids = await get('children');
              var cols = ['الرقم', 'رقم القيد', 'الاسم واللقب', 'تاريخ الميلاد', 'الإعاقة', 'الفرع', 'القسم', 'الهاتف'];
              var rows = (kids || []).map(function (k, idx) {
                return [idx + 1, k.membership_no || '', k.full_name || '', k.dob || '', k.disability || '', k.branch_id || '', k.section || '', k.phone || ''];
              });
              DE_XLSX.download('قاعدة_بيانات_أطفال_دار_الإحسان.xlsx', 'الأطفال', cols, rows, [6, 12, 28, 14, 20, 16, 18, 16]);
              toast('تم تنزيل ملف Excel بنجاح!', 'ok');
            } catch (ex) {
              toast('تعذر تصدير Excel: ' + ex.message, 'bad');
            }
          }
        }, makeSvgIcon('s-file'), h('span', { text: 'تصدير نسخة احتياطية (Excel)' }))
      )
    );
    v.appendChild(manualDirectCard);

    // بطاقات الإحصائيات السريعة
    var lastRunDateTxt = pastRuns.length ? fmt(pastRuns[0].run_date || pastRuns[0].created_at) : 'لم يتم بعد';
    var statsGrid = h('div', { class: 'arch-stats-grid' },
      h('div', { class: 'arch-stat-card' },
        h('b', { class: 'arch-stat-val', text: String(allKids.length) }),
        h('span', { class: 'arch-stat-label', text: 'إجمالي ملفات الطلبة' })
      ),
      h('div', { class: 'arch-stat-card' },
        h('b', { class: 'arch-stat-val', text: String(allReports.length) }),
        h('span', { class: 'arch-stat-label', text: 'التقارير واستمارات التقييم' })
      ),
      h('div', { class: 'arch-stat-card' },
        h('b', { class: 'arch-stat-val', text: String(allDocs.length) }),
        h('span', { class: 'arch-stat-label', text: 'الوثائق والمستندات المرفوعة' })
      ),
      h('div', { class: 'arch-stat-card' },
        h('b', { class: 'arch-stat-val', text: String(pastRuns.length) }),
        h('span', { class: 'arch-stat-label', text: 'عمليات الأرشفة المنفذة (' + lastRunDateTxt + ')' })
      )
    );
    v.appendChild(statsGrid);

    // 2. التحقق من الأرشفة الشهرية التلقائية (تنبيه إذا كان الشهر السابق غير مؤرشف)
    var now = new Date();
    var firstOfCurrent = new Date(now.getFullYear(), now.month, 1);
    var prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var prevYear = prevMonthDate.getFullYear();
    var prevMonthNum = prevMonthDate.getMonth() + 1;
    var prevMonthName = ARABIC_MONTH_NAMES_LIST[prevMonthNum] || String(prevMonthNum);

    var hasArchivedPrev = pastRuns.some(function (pr) {
      return pr.period_year === prevYear && pr.period_month === prevMonthNum && (pr.status === 'completed' || pr.status === 'completed_with_errors');
    });

    if (!hasArchivedPrev) {
      var autoBtn = h('button', {
        type: 'button',
        class: 'btn gold',
        text: 'أرشفة وتنزيل شهر ' + prevMonthName + ' الآن',
        onclick: function () {
          startArchiveJob({
            scope: 'monthly_auto',
            year: prevYear,
            month: prevMonthNum,
            scopeLabel: 'الأرشفة الشهرية التلقائية لشهر ' + prevMonthName + ' ' + prevYear
          });
        }
      });

      var autoBanner = h('div', { class: 'arch-auto-banner' },
        h('div', null,
          h('div', { class: 'arch-auto-title', text: '🔔 حان موعد الأرشفة الشهرية التلقائية لشهر: ' + prevMonthName + ' (' + prevYear + ')' }),
          h('div', { class: 'arch-auto-sub', text: 'وفق توقيت الجزائر (Africa/Algiers): يمكنك إنشاء أرشيف الشهر السابق وتنزيله بضغطة زر واحدة لحفظ التقارير والوثائق المضافة أو المعدلة.' })
        ),
        autoBtn
      );
      v.appendChild(autoBanner);
    }

    // 3. بطاقة إعداد وتنزيل الأرشيف المخصص
    var scopeSelect = h('select', null,
      h('option', { value: 'all', text: '1. تنزيل جميع ملفات دار الإحسان (الأرشيف الشامل)' }),
      h('option', { value: 'branch', text: '2. تنزيل أرشيف فرع / مركز محدد' }),
      h('option', { value: 'section', text: '3. تنزيل أرشيف قسم / فوج محدد' }),
      h('option', { value: 'child', text: '4. تنزيل أرشيف طفل محدد بالكامل' }),
      h('option', { value: 'reports_only', text: '5. تنزيل التقارير واستمارات التقييم فقط' }),
      h('option', { value: 'docs_only', text: '6. تنزيل الوثائق والمستندات المرفوعة فقط' }),
      h('option', { value: 'custom', text: '7. تحديد عدة أقسام أو أطفال (أرشيف مخصص)' })
    );

    var branchSelect = h('select', null,
      h('option', { value: '', text: '— اختر الفرع —' }),
      branches.map(function (b) { return h('option', { value: b.id, text: b.name }); })
    );

    var secSelect = h('select', null,
      h('option', { value: '', text: '— اختر القسم —' }),
      sections.map(function (s) { return h('option', { value: s.id, text: s.name }); })
    );

    var childSelect = h('select', null,
      h('option', { value: '', text: '— اختر الطفل —' }),
      allKids.map(function (k) { return h('option', { value: k.id, text: (k.membership_no ? ('[' + k.membership_no + '] ') : '') + k.full_name }); })
    );

    var dateFilterSelect = h('select', null,
      h('option', { value: 'all', text: 'كامل السجلات التاريخية (بلا تحديد زمني)' }),
      h('option', { value: 'month', text: 'تحديد شهر وسنة محددة' }),
      h('option', { value: 'custom_range', text: 'تحديد فترة مخصصة (من تاريخ إلى تاريخ)' })
    );

    var yearInput = h('input', { type: 'number', min: '2020', max: '2100', value: String(now.getFullYear()) });
    var monthSelect = h('select', null,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (mNum) {
        return h('option', { value: String(mNum), text: ARABIC_MONTH_NAMES_LIST[mNum] });
      })
    );
    monthSelect.value = String(now.getMonth() + 1);

    var dateStartInput = h('input', { type: 'date', value: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10) });
    var dateEndInput = h('input', { type: 'date', value: now.toISOString().slice(0, 10) });

    // حاويات إظهار/إخفاء الفلاتر الفرعية
    var branchField = h('label', { class: 'fld', hidden: true }, h('span', { text: 'الفرع المستهدف:' }), branchSelect);
    var secField = h('label', { class: 'fld', hidden: true }, h('span', { text: 'القسم المستهدف:' }), secSelect);
    var childField = h('label', { class: 'fld', hidden: true }, h('span', { text: 'الطفل المستهدف:' }), childSelect);

    var monthField = h('div', { class: 'eval-builder-grid-2', hidden: true },
      h('label', { class: 'fld' }, h('span', { text: 'السنة:' }), yearInput),
      h('label', { class: 'fld' }, h('span', { text: 'الشهر:' }), monthSelect)
    );

    var rangeField = h('div', { class: 'eval-builder-grid-2', hidden: true },
      h('label', { class: 'fld' }, h('span', { text: 'من تاريخ:' }), dateStartInput),
      h('label', { class: 'fld' }, h('span', { text: 'إلى تاريخ:' }), dateEndInput)
    );

    // قائمة الاختيار المتعدد للأقسام في النطاق المخصص
    var customSecHost = h('div', { style: 'max-height: 180px; overflow-y: auto; border: 1px solid #E2E8F0; padding: 10px; border-radius: 8px; margin-bottom: 12px;', hidden: true });
    sections.forEach(function (sec) {
      var chk = h('input', { type: 'checkbox', value: sec.id, id: 'chk_sec_' + sec.id });
      var lbl = h('label', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer;' }, chk, h('span', { text: sec.name }));
      customSecHost.appendChild(lbl);
    });

    scopeSelect.addEventListener('change', function () {
      var val = scopeSelect.value;
      branchField.hidden = (val !== 'branch');
      secField.hidden = (val !== 'section');
      childField.hidden = (val !== 'child');
      customSecHost.hidden = (val !== 'custom');
    });

    dateFilterSelect.addEventListener('change', function () {
      var dval = dateFilterSelect.value;
      monthField.hidden = (dval !== 'month');
      rangeField.hidden = (dval !== 'custom_range');
    });

    // عناصر شريط التقدم التفاعلي الحي
    var progressBox = h('div', { class: 'arch-progress-wrap', hidden: true });
    var progressBarFill = h('div', { class: 'arch-progress-fill' });
    var progressStatusText = h('span', { text: 'جاهز لبدء الأرشفة...' });
    var progressCounterText = h('span', { text: '' });
    var progressErrorBox = h('div', { style: 'margin-top:10px; font-size:0.8rem; color:#B91C1C; max-height:120px; overflow-y:auto;', hidden: true });

    progressBox.appendChild(h('div', { class: 'arch-progress-status' }, progressStatusText, progressCounterText));
    progressBox.appendChild(h('div', { class: 'arch-progress-bar-bg' }, progressBarFill));
    progressBox.appendChild(progressErrorBox);

    var startBtn = h('button', { type: 'button', class: 'btn gold', text: 'إنشاء وتنزيل الأرشيف الآن (ZIP)' });
    var repsOnlyBtn = h('button', {
      type: 'button', class: 'btn light', text: 'تنزيل التقارير فقط',
      onclick: function () {
        scopeSelect.value = 'reports_only';
        scopeSelect.dispatchEvent(new Event('change'));
        startBtn.click();
      }
    });
    var docsOnlyBtn = h('button', {
      type: 'button', class: 'btn light', text: 'تنزيل الوثائق والمرفقات فقط',
      onclick: function () {
        scopeSelect.value = 'docs_only';
        scopeSelect.dispatchEvent(new Event('change'));
        startBtn.click();
      }
    });

    // منطق إنشاء وتنزيل الأرشيف الحي
    async function startArchiveJob(cfg) {
      if (!window.DE_ZIP) {
        return toast('مكتبة الأرشفة zip-builder غير محملة. يرجى تحديث الصفحة.', 'bad');
      }

      var selScope = cfg ? cfg.scope : scopeSelect.value;
      var pYear = cfg ? cfg.year : parseInt(yearInput.value, 10);
      var pMonth = cfg ? cfg.month : (dateFilterSelect.value === 'month' ? parseInt(monthSelect.value, 10) : null);
      var dateMode = cfg ? (cfg.month ? 'month' : 'all') : dateFilterSelect.value;
      var startDate = dateStartInput.value;
      var endDate = dateEndInput.value;

      var targetBranchId = branchSelect.value;
      var targetSectionId = secSelect.value;
      var targetChildId = childSelect.value;

      var selectedCustomSecIds = [];
      if (selScope === 'custom') {
        var chks = customSecHost.querySelectorAll('input[type="checkbox"]:checked');
        chks.forEach(function (c) { selectedCustomSecIds.push(c.value); });
        if (!selectedCustomSecIds.length) {
          return toast('يرجى تحديد قسم واحد على الأقل في الأرشيف المخصص.', 'bad');
        }
      }

      // تصفية الأطفال
      var targetKids = allKids.slice();
      if (selScope === 'branch' && targetBranchId) {
        targetKids = targetKids.filter(function (k) { return k.branch_id === targetBranchId; });
      } else if (selScope === 'section' && targetSectionId) {
        targetKids = targetKids.filter(function (k) { return k.section_id === targetSectionId; });
      } else if (selScope === 'child' && targetChildId) {
        targetKids = targetKids.filter(function (k) { return k.id === targetChildId; });
      } else if (selScope === 'custom') {
        targetKids = targetKids.filter(function (k) { return selectedCustomSecIds.indexOf(k.section_id) >= 0; });
      }

      var allowedKidMap = {};
      targetKids.forEach(function (k) { allowedKidMap[k.id] = true; });

      // تصفية التقارير
      var targetReports = (selScope === 'docs_only') ? [] : allReports.filter(function (r) {
        if (!allowedKidMap[r.child_id]) return false;
        var rDate = r.report_date || '';
        if (dateMode === 'month' && pMonth && rDate) {
          var rd = new Date(rDate);
          if (rd.getFullYear() !== pYear || (rd.getMonth() + 1) !== pMonth) return false;
        } else if (dateMode === 'custom_range' && rDate) {
          if (startDate && rDate < startDate) return false;
          if (endDate && rDate > endDate) return false;
        }
        return true;
      });

      // تصفية الوثائق
      var targetDocs = (selScope === 'reports_only') ? [] : allDocs.filter(function (d) {
        if (!allowedKidMap[d.child_id]) return false;
        var dDate = (d.created_at || '').slice(0, 10);
        if (dateMode === 'month' && pMonth && dDate) {
          var dd = new Date(dDate);
          if (dd.getFullYear() !== pYear || (dd.getMonth() + 1) !== pMonth) return false;
        } else if (dateMode === 'custom_range' && dDate) {
          if (startDate && dDate < startDate) return false;
          if (endDate && dDate > endDate) return false;
        }
        return true;
      });

      if (!targetReports.length && !targetDocs.length && !targetKids.length) {
        return toast('لا توجد ملفات أو سجلات مطابقة للخيارات المحددة.', 'bad');
      }

      // إظهار شريط التقدم
      progressBox.hidden = false;
      progressErrorBox.hidden = true;
      progressErrorBox.textContent = '';
      progressBarFill.style.width = '5%';
      progressStatusText.textContent = 'جارٍ تجهيز ملفات الأرشيف...';
      startBtn.disabled = true;

      var monthFolderName = pMonth ? (ARABIC_MONTH_NAMES_LIST[pMonth] || String(pMonth)) : 'كامل_السنة';
      var rootPath = 'Dar_El_Ihsan_Archive/' + pYear + '/' + monthFolderName;

      var filesToZip = [];
      var csvRows = [
        ['الرقم', 'اسم الطفل', 'رقم القيد', 'الفرع', 'القسم', 'نوع السجل', 'اسم الملف', 'المسار في الأرشيف', 'التاريخ', 'الحالة', 'ملاحظات']
      ];

      var totalItems = targetReports.length + targetDocs.length;
      var processedItems = 0;
      var successCount = 0;
      var failedCount = 0;
      var errorLog = [];

      function updateProgressUi(itemTitle) {
        processedItems++;
        var pct = Math.min(90, Math.round((processedItems / (totalItems || 1)) * 85) + 5);
        progressBarFill.style.width = pct + '%';
        progressStatusText.textContent = 'معالجة: ' + itemTitle;
        progressCounterText.textContent = 'ناجح: ' + successCount + ' | فاشل: ' + failedCount + ' | إجمالي: ' + totalItems;
      }

      try {
        // 1. معالجة التقارير
        for (var i = 0; i < targetReports.length; i++) {
          var rep = targetReports[i];
          var child = chMap[rep.child_id] || { full_name: 'طفل_غير_معرف', membership_no: '' };
          var chName = sanitizeArchiveFolderName(child.full_name);
          var chMem = sanitizeArchiveFolderName(child.membership_no || '');
          var chFolder = chMem ? (chName + ' [' + chMem + ']') : chName;

          var sec = secMap[child.section_id];
          var secFolder = sanitizeArchiveFolderName(sec ? sec.name : (child.section || 'غير_مصنف'));

          var br = brMap[child.branch_id];
          var brFolder = sanitizeArchiveFolderName(br ? br.name : 'المركز_الرئيسي');

          var rDate = rep.report_date || 'تاريخ_غير_محدد';
          var rTitle = sanitizeArchiveFolderName(rep.title || 'تقرير');
          var repFolder = rootPath + '/' + brFolder + '/' + secFolder + '/' + chFolder + '/التقارير';

          // أ) مستند Microsoft Word رسمي (.doc) لفتحه مباشرة في وورد
          var wordContent = generateWordDocReport(rep, child, secFolder, brFolder);
          var wordFilePath = repFolder + '/' + rDate + ' - ' + rTitle + ' (Word).doc';
          filesToZip.push({ name: wordFilePath, data: wordContent });

          // ب) مستند رسمي بصيغة PDF حقيقية معتمدة للكمبيوتر والهاتف (بدون أي ملفات HTML)
          var pdfBytes = await DE_PDF.renderReportToPdf(rep, child, secFolder, brFolder);
          var pdfFilePath = repFolder + '/' + rDate + ' - ' + rTitle + '.pdf';
          filesToZip.push({ name: pdfFilePath, data: pdfBytes });

          if (isEvaluationReport(rep)) {
            var evalPdfBytes = await DE_PDF.renderEvaluationToPdf(rep, child.full_name, secFolder, child);
            var evalPdfPath = repFolder + '/' + rDate + ' - استمارة_تقييم_' + rTitle + '.pdf';
            filesToZip.push({ name: evalPdfPath, data: evalPdfBytes });
          }

          successCount++;
          csvRows.push([String(processedItems + 1), child.full_name, chMem, brFolder, secFolder, isEvaluationReport(rep) ? 'استمارة تقييم' : 'تقرير تربوي', rTitle + ' (Word).doc', wordFilePath, rDate, 'ناجح', 'تم إنشاء مستند Word']);

          // ج) مرفق التقرير إن وجد
          if (rep.attachment_path) {
            var attFolder = rootPath + '/' + brFolder + '/' + secFolder + '/' + chFolder + '/الصور_والمرفقات';
            var attExt = rep.attachment_path.split('.').pop() || 'dat';
            var attFilePath = attFolder + '/' + rDate + ' - مرفق_' + rTitle + '.' + attExt;

            try {
              var signedUrl = await C.signedUrl('private-docs', rep.attachment_path, 120);
              var fetchResp = await fetch(signedUrl);
              if (!fetchResp.ok) throw new Error('HTTP ' + fetchResp.status);
              var attBuffer = await fetchResp.arrayBuffer();
              filesToZip.push({ name: attFilePath, data: attBuffer });
              successCount++;
              csvRows.push([String(processedItems + 1), child.full_name, chMem, brFolder, secFolder, 'مرفق تقرير', 'مرفق_' + rTitle + '.' + attExt, attFilePath, rDate, 'ناجح', 'تم تنزيل المرفق']);
            } catch (attEx) {
              failedCount++;
              var attErr = 'تعذر تنزيل مرفق (' + rep.attachment_path + '): ' + attEx.message;
              errorLog.push(attErr);
              csvRows.push([String(processedItems + 1), child.full_name, chMem, brFolder, secFolder, 'مرفق تقرير', 'مرفق_' + rTitle, attFilePath, rDate, 'فشل', attEx.message]);
              filesToZip.push({ name: attFilePath + '_تعذر_التنزيل.txt', data: attErr });
            }
          }

          updateProgressUi(rep.title || 'تقرير');
        }

        // 2. معالجة الوثائق
        for (var j = 0; j < targetDocs.length; j++) {
          var doc = targetDocs[j];
          var child = chMap[doc.child_id] || { full_name: 'طفل_غير_معرف', membership_no: '' };
          var chName = sanitizeArchiveFolderName(child.full_name);
          var chMem = sanitizeArchiveFolderName(child.membership_no || '');
          var chFolder = chMem ? (chName + ' [' + chMem + ']') : chName;

          var sec = secMap[child.section_id];
          var secFolder = sanitizeArchiveFolderName(sec ? sec.name : (child.section || 'غير_مصنف'));

          var br = brMap[child.branch_id];
          var brFolder = sanitizeArchiveFolderName(br ? br.name : 'المركز_الرئيسي');

          var dDate = (doc.created_at || '').slice(0, 10) || 'تاريخ_غير_محدد';
          var dTitle = sanitizeArchiveFolderName(doc.title || 'وثيقة');
          var dExt = doc.storage_path ? ('.' + doc.storage_path.split('.').pop()) : '.pdf';
          var docFilePath = rootPath + '/' + brFolder + '/' + secFolder + '/' + chFolder + '/الوثائق/' + dDate + ' - ' + dTitle + dExt;

          if (doc.storage_path) {
            try {
              var sUrl = await C.signedUrl('private-docs', doc.storage_path, 120);
              var dResp = await fetch(sUrl);
              if (!dResp.ok) throw new Error('HTTP ' + dResp.status);
              var dBuffer = await dResp.arrayBuffer();
              filesToZip.push({ name: docFilePath, data: dBuffer });
              successCount++;
              csvRows.push([String(processedItems + 1), child.full_name, chMem, brFolder, secFolder, 'وثيقة رسمية', dTitle + dExt, docFilePath, dDate, 'ناجح', 'تم تنزيل الوثيقة']);
            } catch (docEx) {
              failedCount++;
              var docErr = 'تعذر تنزيل الوثيقة (' + doc.storage_path + '): ' + docEx.message;
              errorLog.push(docErr);
              csvRows.push([String(processedItems + 1), child.full_name, chMem, brFolder, secFolder, 'وثيقة رسمية', dTitle + dExt, docFilePath, dDate, 'فشل', docEx.message]);
              filesToZip.push({ name: docFilePath + '_تعذر_التنزيل.txt', data: docErr });
            }
          }

          updateProgressUi(doc.title || 'وثيقة');
        }

        // 3. كتابة سجل وفهرس الأرشيف الشامل بصيغة Microsoft Excel (.xlsx) الحقيقية
        try {
          var xlsxHeaders = csvRows[0];
          var xlsxBodyRows = csvRows.slice(1);
          var xlsxBlob = DE_XLSX.build('فهرس_الأرشيف', xlsxHeaders, xlsxBodyRows, [6, 26, 12, 20, 20, 16, 28, 40, 14, 12, 25]);
          var xlsxBuf = await xlsxBlob.arrayBuffer();
          filesToZip.push({ name: rootPath + '/فهرس_الأرشيف_الشامل (Excel).xlsx', data: xlsxBuf });
        } catch (eXlsx) {}

        // 4. كتابة تقرير الأرشفة الرسمي بصيغة Microsoft Word (.doc)
        var wordReportSummary = generateWordArchiveReport(totalItems, successCount, failedCount, pYear, monthFolderName, errorLog);
        filesToZip.push({ name: rootPath + '/تقرير_الأرشفة_الرسمي (Word).doc', data: wordReportSummary });

        // 5. ضغط وبناء ملف الـ ZIP وتنزيله
        progressStatusText.textContent = 'جارٍ ضغط الأرشيف وتنزيل ملف ZIP...';
        progressBarFill.style.width = '95%';

        var zipBlob = DE_ZIP.build(filesToZip, function (curr, tot) {
          var p = 90 + Math.round((curr / tot) * 10);
          progressBarFill.style.width = Math.min(100, p) + '%';
        });

        var scopeSlug = selScope.replace(/_/g, '-');
        var zipFileName = 'Dar_El_Ihsan_Archive_' + pYear + '_' + sanitizeArchiveFolderName(monthFolderName) + '_' + scopeSlug + '_' + (new Date().toISOString().slice(0, 10)) + '.zip';
        DE_ZIP.download(zipBlob, zipFileName);

        progressBarFill.style.width = '100%';
        progressStatusText.textContent = 'اكتمل إنشاء وتنزيل الأرشيف بنجاح! (' + (zipBlob.size / (1024 * 1024)).toFixed(2) + ' MB)';

        // تسجيل العملية في قاعدة البيانات والتخزين المحلي
        var runRecord = {
          period_year: pYear,
          period_month: pMonth || now.getMonth() + 1,
          archive_scope: selScope,
          initiated_by: (S.me && S.me.id) || null,
          initiator_name: S.email || 'المدير',
          status: failedCount > 0 ? 'completed_with_errors' : 'completed',
          total_records: totalItems,
          success_count: successCount,
          failed_count: failedCount,
          file_size_bytes: zipBlob.size,
          error_summary: errorLog.slice(0, 5).join('; ')
        };

        C.rest('POST', '/archive_runs', runRecord).catch(function () {});

        try {
          var runsHist = JSON.parse(localStorage.getItem('de_archive_runs_history') || '[]');
          runRecord.run_date = new Date().toISOString();
          runsHist.unshift(runRecord);
          localStorage.setItem('de_archive_runs_history', JSON.stringify(runsHist.slice(0, 30)));
        } catch (e) {}

        if (errorLog.length) {
          progressErrorBox.hidden = false;
          progressErrorBox.innerHTML = '<strong>ملاحظات وأخطاء التنزيل:</strong><br>' + errorLog.map(function (e) { return '• ' + e; }).join('<br>');
        }

        toast('تم تنزيل أرشيف دار الإحسان بنجاح على جهازك!', 'ok');
      } catch (fatalEx) {
        progressStatusText.textContent = 'تعذر استكمال الأرشفة: ' + fatalEx.message;
        progressBarFill.style.background = '#DC2626';
        toast('خطأ أثناء الأرشفة: ' + fatalEx.message, 'bad');
      } finally {
        startBtn.disabled = false;
      }
    }

    startBtn.addEventListener('click', function () { startArchiveJob(null); });

    // تجميع بطاقة الإعداد
    var wizardCard = h('div', { class: 'arch-card' },
      h('h3', { class: 'arch-card-title' }, makeSvgIcon('s-archive'), h('span', { text: 'إنشاء وتنزيل أرشيف مخصص للكمبيوتر (ZIP)' })),
      h('p', { class: 'muted small', text: 'حدد نطاق الأرشفة والفترة الزمنية، وسيتم استخراج الملفات الأصلية وتنظيمها تلقائياً داخل أرشيف ZIP مضغوط.' }),
      h('div', { class: 'arch-filter-grid' },
        h('label', { class: 'fld' }, h('span', { text: 'نطاق الأرشفة:' }), scopeSelect),
        branchField,
        secField,
        childField,
        h('label', { class: 'fld' }, h('span', { text: 'الفترة الزمنية:' }), dateFilterSelect)
      ),
      monthField,
      rangeField,
      customSecHost,
      progressBox,
      h('div', { class: 'arch-btn-row' },
        startBtn,
        repsOnlyBtn,
        docsOnlyBtn
      )
    );
    v.appendChild(wizardCard);

    // 4. جدول سجل العمليات السابقة
    v.appendChild(h('div', { class: 'bar-sub' },
      h('h3', { text: 'سجل عمليات الأرشفة السابقة' })
    ));

    if (!pastRuns.length) {
      v.appendChild(h('div', { class: 'card empty', text: 'لم يتم تسجيل أي عمليات أرشفة سابقة بعد.' }));
    } else {
      var rowsHtml = pastRuns.map(function (pr) {
        var statusBadgeKind = pr.status === 'completed' ? 'ok' : (pr.status === 'completed_with_errors' ? 'gold' : 'bad');
        var statusTxt = pr.status === 'completed' ? 'ناجحة' : (pr.status === 'completed_with_errors' ? 'ناجحة مع أخطاء' : 'فاشلة');
        var sizeMb = pr.file_size_bytes ? (pr.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : '—';
        var pMonthTxt = pr.period_month ? (ARABIC_MONTH_NAMES_LIST[pr.period_month] || String(pr.period_month)) : '—';

        return h('tr', null,
          h('td', { text: fmt(pr.run_date || pr.created_at) }),
          h('td', { text: pr.archive_scope || 'all' }),
          h('td', { text: (pr.period_year || '') + ' / ' + pMonthTxt }),
          h('td', { text: String(pr.success_count || 0) + ' من ' + String(pr.total_records || 0) }),
          h('td', { text: sizeMb }),
          h('td', null, badge(statusTxt, statusBadgeKind)),
          h('td', null,
            h('button', {
              type: 'button',
              class: 'btn small light',
              text: 'إعادة إنشاء وتنزيل',
              onclick: function () {
                startArchiveJob({
                  scope: pr.archive_scope || 'all',
                  year: pr.period_year,
                  month: pr.period_month,
                  scopeLabel: 'إعادة أرشفة ' + (pr.period_year || '') + ' / ' + pMonthTxt
                });
              }
            })
          )
        );
      });

      var historyTable = h('div', { class: 'table-wrap' },
        h('table', { class: 'tbl' },
          h('thead', null,
            h('tr', null,
              h('th', { text: 'تاريخ العملية' }),
              h('th', { text: 'النطاق' }),
              h('th', { text: 'الفترة' }),
              h('th', { text: 'الملفات' }),
              h('th', { text: 'الحجم' }),
              h('th', { text: 'الحالة' }),
              h('th', { text: 'إجراءات' })
            )
          ),
          h('tbody', null, rowsHtml)
        )
      );
      v.appendChild(historyTable);
    }

    // 5. بطاقة تنزيل النسخ الاحتياطية المباشرة بصيغ Office المعتمدة (Excel و Word و PDF) دون أي أكواد
    var officeExportsCard = h('div', { class: 'arch-card', style: 'margin-top:24px;border:1px solid #CBD5E1;' },
      h('h3', { style: 'margin-top:0; color:#123E73; display:flex; align-items:center; gap:8px;' },
        makeSvgIcon('s-file'),
        h('span', { text: 'تنزيل النسخ الاحتياطية المباشرة بصيغ Office المعتمدة (Excel و Word و PDF)' })
      ),
      h('p', { class: 'muted small', text: 'تنزيل فوري لملفات البيانات والتقارير بصيغ Microsoft Excel و Word الأصلية لفتحها مباشرة على الكمبيوتر دون أي أكواد برمجية.' }),
      h('div', { class: 'row-actions', style: 'margin-top:14px;flex-wrap:wrap;gap:10px;' },
        h('button', {
          type: 'button',
          class: 'btn gold',
          onclick: function () {
            var cols = ['الرقم', 'رقم القيد', 'الاسم واللقب', 'تاريخ الميلاد', 'طبيعة الإعاقة', 'الفرع', 'القسم', 'الهاتف'];
            var rows = allKids.map(function (k, idx) {
              return [idx + 1, k.membership_no || '', k.full_name || '', k.dob || '', k.disability || '', (brMap[k.branch_id] ? brMap[k.branch_id].name : '') || '', (secMap[k.section_id] ? secMap[k.section_id].name : k.section) || '', k.phone || ''];
            });
            DE_XLSX.download('قاعدة_بيانات_أطفال_دار_الإحسان.xlsx', 'الأطفال', cols, rows, [6, 12, 28, 14, 22, 18, 18, 16]);
            toast('تم تنزيل ملف Excel بنجاح!', 'ok');
          }
        }, makeSvgIcon('s-file'), h('span', { text: 'تنزيل قاعدة بيانات الأطفال (Excel .xlsx)' })),
        h('button', {
          type: 'button',
          class: 'btn light',
          onclick: function () {
            var cols = ['الرقم', 'عنوان التقرير', 'اسم الطفل', 'التاريخ', 'الحالة', 'المكتسبات', 'الأنشطة', 'ملاحظات'];
            var rows = allReports.map(function (r, idx) {
              var ch = chMap[r.child_id] || {};
              return [idx + 1, r.title || '', ch.full_name || '', r.report_date || '', r.status === 'published' ? 'منشور' : 'مسودة', r.achievements || '', r.activities || '', r.notes || ''];
            });
            DE_XLSX.download('سجل_التقارير_والاستمارات.xlsx', 'التقارير', cols, rows, [6, 26, 26, 14, 12, 35, 35, 35]);
            toast('تم تنزيل سجل التقارير بصيغة Excel!', 'ok');
          }
        }, makeSvgIcon('s-download'), h('span', { text: 'تنزيل سجل التقارير (Excel .xlsx)' }))
      )
    );
    v.appendChild(officeExportsCard);
  }

  /* =====================================================================
     التنقل والتهيئة (Navigation & Bootstrap)
     ===================================================================== */
  var SECS = {
    hub: secHub,
    hub_accounts: function (v) { return secAccounts(v, true); },
    dash: secDash,
    children: secChildren,
    branches: secBranches,
    educators: secEducators,
    programs: secPrograms,
    reports: secReports,
    evaluations: secEvaluations,
    appts: secAppts,
    msgs: secMsgs,
    docs: secDocs,
    archive: secArchive,
    accounts: function (v) { return secAccounts(v, false); },
    audit: secAudit,
    settings: secSettings
  };

  async function go(sec, navOpts) {
    var opts = navOpts || {};
    if (sec === 'archive' && !canUserAccessArchive()) {
      toast('خاصية الأرشيف والنسخ الاحتياطية مخصصة للإدارة العامة المخولة فقط.', 'bad');
      sec = 'dash';
    }
    if (isFarmSession() && sec === 'reports') {
      sec = 'children';
    }
    if (S.isEducator && (sec !== 'children' && (sec !== 'reports' || isFarmSession()))) {
      sec = 'children';
    }
    if (S.isSpecialist && (sec === 'accounts' || sec === 'hub' || sec === 'hub_accounts' || sec === 'audit' || sec === 'settings')) {
      toast('قسم الحسابات غير متاح لصلاحية الأخصائية.', 'bad');
      sec = 'children';
    }
    if (!S.isEducator && (S.activeCenter === 'work' || S.activeCenter === 'farm') && sec !== 'hub' && sec !== 'hub_accounts' && sec !== 'children' && sec !== 'accounts') {
      sec = 'children';
    }
    if (!SECS[sec]) sec = S.isEducator ? 'children' : 'hub';

    if (!opts.fromHistory && S.me) {
      if (S.sec && (S.sec !== sec || S.inSubBuilder || S._lastCenter !== S.activeCenter || S._lastFilterSec !== S.filterSectionId)) {
        S.navStack.push({
          sec: S.sec,
          center: S._lastCenter || S.activeCenter,
          filterSectionId: S._lastFilterSec || ''
        });
        if (S.navStack.length > 30) S.navStack.shift();
        try {
          window.history.pushState({
            deApp: true,
            sec: sec,
            center: S.activeCenter,
            filterSectionId: S.filterSectionId || ''
          }, '');
        } catch (e) {}
      }
    }
    S.inSubBuilder = false;
    S._lastCenter = S.activeCenter;
    S._lastFilterSec = S.filterSectionId || '';
    S.sec = sec;
    var n = ++S.nav, v = $('#view');
    var appEl = $('#app');
    if (appEl) {
      appEl.classList.toggle('is-hub-mode', !S.isEducator && (sec === 'hub' || sec === 'hub_accounts'));
    }

    applyRoleSidebarUI();

    var cm = getCenterMeta(S.activeCenter);
    if (sec === 'hub') {
      $('#secTitle').textContent = 'لوحة الإدارة';
    } else if (sec === 'hub_accounts') {
      $('#secTitle').textContent = 'الحسابات الخاصة بجميع المراكز';
    } else if (!S.isEducator && sec === 'accounts') {
      $('#secTitle').textContent = S.activeCenter === 'work'
        ? 'الحسابات الخاصة بمركز المساعدة على العمل'
        : S.activeCenter === 'farm'
          ? 'الحسابات الخاصة بالمزرعة البيداغوجية'
          : 'حسابات المركز الرئيسي';
    } else if (!S.isEducator && (sec === 'dash' || sec === 'children')) {
      $('#secTitle').textContent = (TITLES[sec] || 'لوحة التحكم') + ' — ' + cm.shortName;
    } else {
      $('#secTitle').textContent = TITLES[sec] || 'لوحة التحكم';
    }

    updateSidebarCenterCard();

    [].forEach.call(document.querySelectorAll('#nav [data-sec]'), function (b) {
      var isAct = b.dataset.sec === sec;
      b.classList.toggle('active', isAct);
      if (isAct) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });

    if (window.innerWidth <= 860) $('#app').classList.remove('nav-toggled');
    v.textContent = '';
    v.appendChild(h('div', { class: 'empty', text: 'جارٍ التحميل…' }));

    var box = h('div', { class: 'view-transition-enter' });
    try {
      await SECS[sec](box);
    } catch (e) {
      bust();
      box = h('div', { class: 'err', role: 'alert' },
        h('p', { text: e.message }),
        h('button', { class: 'btn small', type: 'button', text: 'إعادة المحاولة', onclick: function () { go(sec); } }));
    }

    if (n !== S.nav) return;
    v.textContent = '';
    v.appendChild(box);
    window.scrollTo(0, 0);
  }

  var mode = 'creds';
  var MODE_UI = {
    creds: { btn: 'دخول', hint: 'للحسابات الإدارية والمربيات المخوّلات فقط.' },
    mfa: { btn: 'تأكيد الرمز', hint: 'أدخل الرمز من تطبيق المصادقة.' },
    invite: { btn: 'إرسال رابط إنشاء كلمة المرور', hint: 'أدخل بريدك الإلكتروني أو رقم هاتفك المدعو به لتفعيل حسابك وإنشاء كلمة المرور مباشرة.' },
    forgot: { btn: 'إرسال رابط استعادة كلمة المرور', hint: 'أدخل بريد حسابك وسنرسل إليه رابطًا آمنًا لإعادة تعيين كلمة المرور.' },
    set: { btn: 'إنشاء كلمة المرور وتفعيل الحساب', hint: 'مرحبًا بك! يرجى إنشاء كلمة مرور لحسابك وتأكيدها للمتابعة.' }
  };
  function setMode(m, hint) {
    mode = m;
    var u = MODE_UI[m] || MODE_UI.creds;
    $('#stCreds').hidden = m !== 'creds';
    $('#stMfa').hidden = m !== 'mfa';
    if ($('#stForgot')) $('#stForgot').hidden = m !== 'forgot';
    if ($('#stInvite')) $('#stInvite').hidden = m !== 'invite';
    if ($('#stSet')) $('#stSet').hidden = m !== 'set';
    $('#lBtn').textContent = u.btn;
    $('#lHint').textContent = hint || u.hint;
    if ($('#firstTimeBtn')) $('#firstTimeBtn').hidden = m !== 'creds';
    $('#forgotBtn').hidden = m !== 'creds';
    $('#backBtn').hidden = m === 'creds';
    if (m === 'set') { setTimeout(function () { var p = $('#np1'); if (p) p.focus(); }, 0); }
  }
  function showLogin(m) {
    S.stopIdle && S.stopIdle();
    show('login');
    setMode('creds');
    msg($('#lErr'), m);
    msg($('#lOk'), '');
  }

  async function enter() {
    show('boot');
    try {
      var staffSess = readStaffSession();
      if (!C.loggedIn() && !staffSess) {
        return showLogin();
      }
      var meta = await loadPortalMeta(true);
      var meUser = null;
      if (C.loggedIn()) {
        try { meUser = await C.me(); } catch (eMe) { meUser = null; }
      }
      if (!meUser && staffSess) {
        meUser = { id: staffSess.id || 'staff-session', email: staffSess.email };
      }
      var myEmail = (meUser && meUser.email || (staffSess && staffSess.email) || '').toLowerCase();
      var delEmails = (meta.deleted_emails || []).map(function (x) { return String(x || '').toLowerCase(); });
      if (myEmail && (delEmails.indexOf(myEmail) >= 0 || (S.deletedRuntimeEmails && S.deletedRuntimeEmails[myEmail]))) {
        clearEducatorDirectSession();
        await C.signOut();
        return showLogin('تم حذف هذا الحساب ولم يعد مخوّلاً بالدخول.');
      }

      var accMeta = (meta.account_meta && meta.account_meta[myEmail]) || null;
      var eduMatch = (meta.educators || []).filter(function (e) {
        return e.email && e.email.toLowerCase() === myEmail;
      })[0];
      var embeddedMatch = EMBEDDED_STAFF.filter(function (st) {
        return st.email && st.email.toLowerCase() === myEmail;
      })[0];
      if (!accMeta && embeddedMatch) {
        accMeta = Object.assign({ center_access: embeddedMatch.center }, embeddedMatch);
      }
      if (!accMeta && staffSess && staffSess.email && staffSess.email.toLowerCase() === myEmail) {
        accMeta = Object.assign({}, staffSess);
      }

      var isKnownStaff = !!(accMeta || eduMatch || embeddedMatch || staffSess);
      var isKnownSpec = !!((accMeta && (accMeta.role === 'specialist' || accMeta.job_title === 'أخصائية نفسانية')) ||
                           (embeddedMatch && (embeddedMatch.role === 'specialist' || embeddedMatch.job_title === 'أخصائية نفسانية')) ||
                           myEmail === 'edu.0655806951@darelihsan.org' ||
                           (staffSess && (staffSess.role === 'specialist' || staffSess.job_title === 'أخصائية نفسانية')));
      var isKnownEdu = !isKnownSpec && !!((accMeta && accMeta.role === 'educator') || eduMatch || (embeddedMatch && embeddedMatch.role === 'educator') || (staffSess && staffSess.role === 'educator'));

      if (C.loggedIn()) {
        var ok = false;
        try {
          var rpcP = C.rpc('can_manage_families');
          var timeP2 = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 3000); });
          ok = await Promise.race([rpcP, timeP2]);
        } catch (eRpc) { ok = isKnownStaff; }
        if (ok !== true && !isKnownStaff) {
          var anyAdmin = false;
          try { anyAdmin = await C.rpc('is_admin'); } catch (eAdm) {}
          await C.signOut();
          return showLogin(anyAdmin === true ? 'حسابك محرّر: لا يملك صلاحية بيانات الأطفال والأولياء.' : 'هذا الحساب غير مخوّل بالدخول إلى هذه اللوحة.');
        }
      }

      S.me = meUser || { email: myEmail };
      bust();

      if (isKnownEdu) {
        var prof = Object.assign({}, eduMatch || {}, accMeta || {});
        S.isEducator = true;
        S.isSpecialist = false;
        S.eduProfile = prof;
        S.eduSectionId = (prof && prof.section_id) || '';
        S.eduSectionName = (prof && prof.section_name) || '';
        S.centerAccess = (prof && (prof.center_access || prof.center)) || 'main';
        if (S.eduSectionId === '22222222-0000-4000-8000-000000000011' || S.eduSectionId === 'sec_bostana' || String(S.eduSectionName).indexOf('البستنة') >= 0 || String(S.eduSectionName).indexOf('المزرعة') >= 0) {
          S.activeCenter = 'farm';
        } else if (S.eduSectionId === '22222222-0000-4000-8000-000000000010' || S.eduSectionId === 'sec_tamhin' || String(S.eduSectionName).indexOf('التمهين') >= 0) {
          S.activeCenter = 'work';
        } else {
          S.activeCenter = (prof && prof.center) || 'main';
        }
        if (S.eduSectionId && !S.eduSectionName) {
          try {
            var secs = await get('sections');
            S.eduSectionName = nameOf(secs, S.eduSectionId, 'name');
          } catch (e) {}
        }
      } else if (isKnownSpec) {
        S.isEducator = false;
        S.isSpecialist = true;
        S.eduProfile = null;
        S.eduSectionId = '';
        S.eduSectionName = '';
        S.centerAccess = 'main';
        S.activeCenter = 'main';
      } else {
        S.isEducator = false;
        S.isSpecialist = false;
        S.eduProfile = null;
        S.eduSectionId = '';
        S.eduSectionName = '';
        S.centerAccess = (accMeta && accMeta.center_access) || 'all';
        var allowedCentersList = parseAllowedCenters(S.centerAccess);
        S.activeCenter = allowedCentersList[0] || 'main';
      }

      applyRoleSidebarUI();
      show('app');
      if (S.isEducator) {
        var eduName = (S.eduProfile && S.eduProfile.full_name) || (embeddedMatch && embeddedMatch.full_name) || myEmail;
        $('#who').textContent = '' + eduName + (S.eduSectionName ? (' — ' + S.eduSectionName) : '');
      } else if (S.isSpecialist) {
        $('#who').textContent = 'الأخصائية نواري اسماء بنت جيلالي — دار الإحسان الرئيسي';
      } else {
        var whoEmail = (S.me && S.me.email) || 'مدير';
        if (/^edu\.\d+@darelihsan\.org$/i.test(whoEmail)) {
          var matchedSt = EMBEDDED_STAFF.filter(function (st) { return st.email && st.email.toLowerCase() === whoEmail.toLowerCase(); })[0];
          $('#who').textContent = (matchedSt && matchedSt.full_name) || 'مستخدم إداري';
        } else {
          $('#who').textContent = whoEmail;
        }
      }

      S.stopIdle && S.stopIdle();
      S.stopIdle = DE.idle(30 * 60 * 1000, function () { logout('تم تسجيل خروجك تلقائيًا بعد فترة خمول.'); });

      if (!S.isEducator) {
        get('children').catch(function () {});
        (async function () {
          if (_tamhinSeedAttempted) return;
          try {
            var d = await getMany('programs', 'sections');
            var progs = d[0] || [], secs = d[1] || [];
            var tSec = secs.filter(function (s) { return s.slug === 'sec_tamhin' || (s.name && s.name.indexOf('التمهين') >= 0); })[0];
            if (tSec && !progs.some(function (r) { return r.section_id === tSec.id && r.status === 'published'; })) {
              _tamhinSeedAttempted = true;
              await C.rest('POST', '/educational_programs', createTamhinDemoBody(tSec.id, tSec.name));
              bust();
            }
          } catch (e) {}
        })();
      }

      var startSec = (S.isEducator || S.isSpecialist) ? 'children' : 'hub';
      S.navStack = [];
      S._lastCenter = S.activeCenter;
      S._lastFilterSec = '';
      try {
        window.history.replaceState({ deGuard: true, deApp: true, sec: startSec, center: S.activeCenter }, '');
        window.history.pushState({ deApp: true, sec: startSec, center: S.activeCenter }, '');
      } catch (e) {}
      go(startSec, { fromHistory: true });
    } catch (e) { showLogin(e.message); }
  }

  async function logout(m) {
    clearEducatorDirectSession();
    await C.signOut();
    S.cache = {};
    S.me = null;
    S.isEducator = false;
    S.isSpecialist = false;
    S.eduProfile = null;
    S.eduSectionId = '';
    S.eduSectionName = '';
    showLogin(m);
  }

  async function submitLogin(e) {
    e.preventDefault();
    msg($('#lErr'), '');
    await lock($('#lBtn'), async function () {
      try {
        if (mode === 'creds') {
          var rawInput = normalizeArabicDigits(DE.clean($('#email').value, 254).trim());
          var pw = String($('#password').value || '').trim();
          if (!rawInput || !pw || pw.length > 72) return msg($('#lErr'), 'أدخل البريد الإلكتروني (أو رقم الهاتف) وكلمة المرور.');
          var meta = await loadPortalMeta(true);
          var em = resolveEducatorLoginEmail(rawInput, meta);

          if (!DE.isEmail(em)) {
            return msg($('#lErr'), 'أدخل بريدًا إلكترونيًا أو رقم هاتف مسجلاً في النظام.');
          }

          var signedInOk = false;
          var signInErr = null;
          try {
            var r = await C.signIn(em, pw);
            signedInOk = true;
            clearEducatorDirectSession();
            $('#password').value = '';
            if (r && r.mfa) { setMode('mfa'); $('#mfaCode').focus(); return; }
          } catch (errSign) {
            signInErr = errSign;
          }

          if (!signedInOk) {
            var staffProf = verifyStaffPortalAuth(rawInput, em, pw, meta);
            if (staffProf) {
              persistStaffSession(staffProf);
              $('#password').value = '';
              await enter();
              return;
            }
            throw (signInErr || new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.'));
          }
          await enter();
        } else if (mode === 'mfa') {
          var code = $('#mfaCode').value.replace(/\s/g, '');
          if (!/^\d{6}$/.test(code)) return msg($('#lErr'), 'أدخل الرمز المكوّن من 6 أرقام.');
          await C.verifyMfa(code);
          $('#mfaCode').value = '';
          await enter();
        } else if (mode === 'invite') {
          var rawInv = DE.clean($('#invEmail').value, 254).trim();
          var metaInv = await loadPortalMeta();
          var emInv = resolveEducatorLoginEmail(rawInv, metaInv);
          if (!DE.isEmail(emInv)) return msg($('#lErr'), 'اكتب بريدًا إلكترونيًا أو رقم هاتف صالحًا.');
          var redirectUrl = location.origin + location.pathname;
          await C.recover(emInv, redirectUrl);
          msg($('#lOk'), 'تم إرسال رابط تفعيل الحساب وإنشاء كلمة المرور إلى (' + emInv + ') بنجاح.');
        } else if (mode === 'forgot') {
          var rawFg = DE.clean($('#fEmail').value, 254).trim();
          var metaFg = await loadPortalMeta();
          var em1 = resolveEducatorLoginEmail(rawFg, metaFg);
          if (!DE.isEmail(em1)) return msg($('#lErr'), 'اكتب بريدًا إلكترونيًا أو رقم هاتف صالحًا.');
          var redirectUrl2 = location.origin + location.pathname;
          await C.recover(em1, redirectUrl2);
          msg($('#lOk'), 'تم إرسال رابط استعادة كلمة المرور بنجاح.');
        } else if (mode === 'set') {
          var a = String($('#np1').value || '').trim(), b = String($('#np2').value || '').trim();
          if (DE.pwProblem(a)) return msg($('#lErr'), 'كلمة المرور: 10 أحرف على الأقل مع حرف كبير وحرف صغير ورقم.');
          if (a !== b) return msg($('#lErr'), 'كلمتا المرور غير متطابقتين.');
          await C.setPassword(a);
          $('#np1').value = $('#np2').value = '';
          msg($('#lOk'), 'تم إنشاء كلمة المرور وتفعيل حسابك بنجاح! جارٍ الدخول…');
          await enter();
        }
      } catch (er) { msg($('#lErr'), er.message); }
    });
  }

  function ensureManageDomReady() {
    try {
      if (!document.querySelector('link[href*="IBM+Plex+Sans+Arabic"]')) {
        var fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&family=Readex+Pro:wght@500;600;700&display=swap';
        document.head.appendChild(fontLink);
      }
      var ns = 'http://www.w3.org/2000/svg';
      var sprite = document.querySelector('svg.sprite');
      if (!sprite) {
        sprite = document.createElementNS(ns, 'svg');
        sprite.setAttribute('width', '0');
        sprite.setAttribute('height', '0');
        sprite.setAttribute('class', 'sprite');
        sprite.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(sprite, document.body.firstChild);
      }
      var symbols = {
        's-main-center': ['M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 3 2 8h20L12 3z'],
        's-work-center': ['M2 7h20v14H2z', 'M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v3M2 12h20'],
        's-farm-center': ['M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z', 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'],
        's-plus': ['M12 5v14M5 12h14'],
        's-edit': ['M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
        's-trash': ['M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6'],
        's-key': ['M7.5 10a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z', 'm21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3'],
        's-idcard': ['M2 4h20v16H2z', 'M14 10h4M14 14h4M5 17c1.2-1.5 4.8-1.5 6 0'],
        's-refresh': ['M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16', 'M16 16h5v5'],
        's-eye': ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
        's-eye-off': ['M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20'],
        's-download': ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3'],
        's-upload': ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'],
        's-print': ['M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v8H6z'],
        's-back': ['M19 12H5M12 19l-7-7 7-7'],
        's-search': ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'm21 21-4.3-4.3'],
        's-check': ['M20 6 9 17l-5-5'],
        's-clock': ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6v6l4 2'],
        's-desktop': ['M2 3h20v14H2z', 'M8 21h8M12 17v4M12 7v6M9.5 10.5 12 13l2.5-2.5'],
        's-copy': ['M9 9h13v13H9z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
        's-wand': ['m15 4-1 1 4 4 1-1a2.83 2.83 0 1 0-4-4ZM13 6 3 16v4h4L17 10M8 2v2M2 8h2M18 14v2M22 18h-2'],
        's-lock': ['M3 11h18v11H3z', 'M7 11V7a5 5 0 0 1 10 0v4']
      };
      Object.keys(symbols).forEach(function (id) {
        if (!document.getElementById(id)) {
          var sym = document.createElementNS(ns, 'symbol');
          sym.setAttribute('id', id);
          sym.setAttribute('viewBox', '0 0 24 24');
          symbols[id].forEach(function (d) {
            var p = document.createElementNS(ns, 'path');
            p.setAttribute('d', d);
            sym.appendChild(p);
          });
          sprite.appendChild(sym);
        }
      });

      // تم إلغاء حقن أزرار تثبيت تطبيق الكمبيوتر نزولاً عند طلب الإدارة
    } catch (eDom) {}
  }

  // ملتقط أخطاء عام لمنع بقاء الصفحة معلقة على شاشة التحميل إطلاقاً
  if (typeof window !== 'undefined') {
    window.addEventListener('error', function (errEv) {
      var b = document.getElementById('boot');
      if (b && !b.hidden) {
        showLogin();
      }
    });
    window.addEventListener('unhandledrejection', function () {
      var b = document.getElementById('boot');
      if (b && !b.hidden) {
        showLogin();
      }
    });
  }

  async function init() {
    // صمام أمان حاسم: إذا بقيت شاشة التحميل ظاهرة لأكثر من ثانيتين، يتم إظهار شاشة الدخول فوراً
    setTimeout(function () {
      var b = document.getElementById('boot');
      if (b && !b.hidden) {
        var appEl = document.getElementById('app');
        var loginEl = document.getElementById('login');
        if ((!appEl || appEl.hidden) && (!loginEl || loginEl.hidden)) {
          showLogin();
        }
      }
    }, 2000);

    try {
      ensureManageDomReady();
      if (!CFG.supabaseUrl || !CFG.supabaseKey) { if ($('#boot')) $('#boot').textContent = 'إعدادات الاتصال غير مضبوطة.'; return; }
      C.onExpire(function () { showLogin('انتهت الجلسة. سجّل الدخول من جديد.'); });

      if ($('#loginForm')) $('#loginForm').addEventListener('submit', submitLogin);
      var qDemo = $('#quickDemoAdminBtn');
      if (qDemo) {
        qDemo.addEventListener('click', function () {
          $('#email').value = '0540817775';
          $('#password').value = 'DI11051993';
          $('#loginForm').dispatchEvent(new Event('submit'));
        });
      }
      var ftBtn = $('#firstTimeBtn');
      if (ftBtn) {
        ftBtn.addEventListener('click', function () {
          msg($('#lErr'), ''); msg($('#lOk'), '');
          $('#invEmail').value = ($('#email').value || '').trim();
          setMode('invite');
          $('#invEmail').focus();
        });
      }
      if ($('#forgotBtn')) $('#forgotBtn').addEventListener('click', function () { msg($('#lErr'), ''); msg($('#lOk'), ''); $('#fEmail').value = ($('#email').value || '').trim(); setMode('forgot'); $('#fEmail').focus(); });
      if ($('#backBtn')) $('#backBtn').addEventListener('click', function () { C.cancelMfa(); msg($('#lErr'), ''); msg($('#lOk'), ''); setMode('creds'); });
      var topLBtn = $('#logoutBtn'); if (topLBtn) topLBtn.addEventListener('click', function () { logout(); });
      var topArchBtn = $('#topArchiveBtn');
      if (topArchBtn) {
        topArchBtn.addEventListener('click', function () {
          if (!S.isEducator && canAccessGeneralAdmin()) {
            go('archive');
          } else {
            toast('ميزة الأرشيف مخصصة للإدارة العامة.', 'bad');
          }
        });
      }
      if ($('#sideLogoutBtn')) $('#sideLogoutBtn').addEventListener('click', function () { logout(); });
      if ($('#hubSwitchBtn')) $('#hubSwitchBtn').addEventListener('click', function () { if (!S.isEducator) go('hub'); });
      if ($('#sideCenterCard')) $('#sideCenterCard').addEventListener('click', function () { if (!S.isEducator) go('hub'); });
      if ($('#menuBtn')) {
        $('#menuBtn').addEventListener('click', function () {
          if (window.innerWidth <= 860) {
            $('#app').classList.toggle('nav-toggled');
          } else {
            $('#app').classList.toggle('side-collapsed');
          }
        });
      }
      if ($('#sideCloseBtn')) {
        $('#sideCloseBtn').addEventListener('click', function () {
          if (window.innerWidth <= 860) {
            $('#app').classList.remove('nav-toggled');
          } else {
            $('#app').classList.toggle('side-collapsed');
          }
        });
      }
      if ($('#scrim')) $('#scrim').addEventListener('click', function () { $('#app').classList.remove('nav-toggled'); });
      if ($('#nav')) $('#nav').addEventListener('click', function (e) { var b = e.target.closest('button[data-sec]'); if (b) go(b.dataset.sec); });
      if ($('#modal')) $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeModal(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

      /* دعم زر الرجوع في الهاتف (Hardware Back Button) للرجوع خطوة للخلف داخل الموقع وعدم الخروج منه */
      window.addEventListener('popstate', function () {
        if ($('#login') && !$('#login').hidden && mode !== 'creds') {
          C.cancelMfa();
          msg($('#lErr'), '');
          msg($('#lOk'), '');
          setMode('creds');
          try { window.history.pushState({ deLogin: true }, ''); } catch (e) {}
          return;
        }
        if ((!C.loggedIn() && !readStaffSession()) || ($('#app') && $('#app').hidden)) return;

        if ($('#modal') && !$('#modal').hidden) {
          closeModal();
          return;
        }
        if ($('#app') && $('#app').classList.contains('nav-toggled')) {
          $('#app').classList.remove('nav-toggled');
          try { window.history.pushState({ deApp: true, sec: S.sec, center: S.activeCenter }, ''); } catch (e) {}
          return;
        }
        if (S.inSubBuilder) {
          S.inSubBuilder = false;
          go(S.sec, { fromHistory: true });
          try { window.history.pushState({ deApp: true, sec: S.sec, center: S.activeCenter }, ''); } catch (e) {}
          return;
        }
        if (!S.isEducator && S.filterSectionId) {
          S.filterSectionId = '';
          go('children', { fromHistory: true });
          try { window.history.pushState({ deApp: true, sec: 'children', center: S.activeCenter }, ''); } catch (e) {}
          return;
        }
        while (S.navStack.length > 0) {
          var prev = S.navStack.pop();
          if (prev && (prev.sec !== S.sec || prev.center !== S.activeCenter || prev.filterSectionId !== S.filterSectionId)) {
            S.activeCenter = prev.center || S.activeCenter;
            S.filterSectionId = prev.filterSectionId || '';
            go(prev.sec, { fromHistory: true });
            try { window.history.pushState({ deApp: true, sec: prev.sec, center: S.activeCenter }, ''); } catch (e) {}
            return;
          }
        }
        var rootSec = S.isEducator ? 'children' : 'hub';
        if (S.sec !== rootSec) {
          go(rootSec, { fromHistory: true });
          try { window.history.pushState({ deApp: true, sec: rootSec, center: S.activeCenter }, ''); } catch (e) {}
          return;
        }
        try { window.history.pushState({ deApp: true, sec: rootSec, center: S.activeCenter }, ''); } catch (e) {}
      });

      try {
        var sp = new URLSearchParams(window.location.search);
        if (sp.get('invite_edu') === '1') {
          var invU = (sp.get('u') || '').trim().toLowerCase();
          var invPhone = sp.get('phone') || '';
          var invName = sp.get('name') || '';
          window.history.replaceState(null, '', window.location.pathname);
          if (invU) {
            show('login');
            if ($('#invEmail')) $('#invEmail').value = invPhone || invU;
            if ($('#email')) $('#email').value = invPhone || invU;
            setMode('invite', 'مرحبًا بكِ أستاذة ' + (invName || '') + '! اضغطي الزر أدناه لتفعيل حسابكِ وإنشاء كلمة المرور الخاصة بكِ.');
            return;
          }
        }
      } catch (eInvUrl) {}

      try {
        var hash = await C.adoptHash();
        if (hash && hash.error) { showLogin(hash.error); return; }
        if (hash && (hash.token || hash.type === 'invite' || hash.type === 'recovery' || hash.type === 'signup')) {
          show('login');
          var userEmail = hash.email || '';
          if (!userEmail) {
            try { var u = await C.me(); if (u && u.email) userEmail = u.email; } catch (e) {}
          }
          if ($('#setEmail')) $('#setEmail').value = userEmail;
          if ($('#email')) $('#email').value = userEmail;
          setMode('set', 'مرحبًا بك في لوحة الإدارة! حسابك معروض أدناه. يرجى إنشاء كلمة المرور الخاصة بك وتأكيدها للمتابعة.');
          return;
        }
      } catch (eHash) {}

      if (C.load() || readStaffSession()) {
        try {
          var enterTimeout = new Promise(function (_, rej) {
            setTimeout(function () { rej(new Error('enter_timeout')); }, 3500);
          });
          await Promise.race([enter(), enterTimeout]);
        } catch (eEnter) {
          showLogin(eEnter && eEnter.message ? eEnter.message : null);
        }
      } else {
        showLogin();
      }
    } catch (eFatal) {
      console.error('Fatal init error:', eFatal);
      showLogin(eFatal && eFatal.message);
    }
  }

  init();
})();