/* فضاء الأولياء — Espace Parents — دار الإحسان
   يدعم اللغتين العربية (افتراضي RTL) والفرنسية (LTR) مع حماية RLS كاملة وبلا مكتبات خارجية.
   كل النصوص تُدرج بـ textContent لحماية تامة من XSS. */
(function () {
  'use strict';
  var FILE_BUILD = '2026-10-20.2';
  if (window.top !== window.self) { document.body.textContent = ''; return; }

  var CFG = window.DE_CONFIG || {}, h = DE.h;
  var $ = function (s) { return document.querySelector(s); };
  var C = DE.Client(CFG, 'de_parent_session');
  var S = { tab: 'children', me: null, name: '', d: null, reads: {} };
  var stopIdle = null;

  /* ---------- الترجمة واللغات (عربي / فرنسي) ---------- */
  var LANG = (function () {
    try { return sessionStorage.getItem('de_parent_lang') || 'ar'; } catch (e) { return 'ar'; }
  })();

  var I18N = {
    ar: {
      brand: 'فضاء الأولياء',
      whoDefault: 'ولي الأمر',
      langBtnLogin: 'Français',
      langBtnBar: 'FR',
      titleLogin: 'فضاء الأولياء',
      titleSet: 'تعيين كلمة المرور',
      titleForgot: 'استعادة كلمة المرور',
      hintLogin: 'سجّل الدخول لمتابعة ملف طفلك.',
      hintForgot: 'أدخل بريدك وسنرسل إليك رابطًا لاستعادة كلمة المرور.',
      hintSet: 'اختر كلمة مرور قوية لحسابك.',
      hintInvite: 'مرحبًا بك! اختر كلمة مرور لتفعيل حسابك.',
      emailLabel: 'البريد الإلكتروني',
      passLabel: 'كلمة المرور',
      newPassLabel: 'كلمة المرور الجديدة',
      confirmPassLabel: 'أعد كتابة كلمة المرور',
      passRule: '10 أحرف على الأقل مع حرف كبير وصغير ورقم.',
      btnLogin: 'دخول',
      btnForgotSend: 'إرسال رابط الاستعادة',
      btnSetSave: 'حفظ كلمة المرور',
      btnForgot: 'نسيت كلمة المرور؟',
      btnBack: 'رجوع لتسجيل الدخول',
      accountNotice: 'الحسابات تُنشأ من إدارة المركز فقط. إن لم تصلك دعوة فتواصل مع المركز.',
      tabChildren: 'أبنائي',
      tabReports: 'التقارير',
      tabAppts: 'المواعيد',
      tabMsgs: 'الرسائل',
      tabDocs: 'الوثائق',
      tabContact: 'التواصل',
      welcome: 'مرحبًا',
      welcomeSuffix: '! أهلًا بك في فضاء الأولياء.',
      logoutPrompt: 'تم تسجيل خروجك تلقائيًا بعد فترة خمول.',
      btnSignOut: 'تسجيل الخروج',
      emptyChildren: 'لا توجد ملفات أطفال مرتبطة بحسابك بعد. تواصل مع إدارة المركز للمساعدة.',
      emptyReports: 'لا توجد تقارير تربوية منشورة بعد. ستظهر هنا التقارير الدورية عند اعتمادها.',
      emptyAppts: 'لا توجد مواعيد قادمة.',
      emptyApptsPast: 'لا توجد مواعيد سابقة.',
      emptyMsgs: 'لا توجد رسائل أو إعلانات حتى الآن.',
      emptyDocs: 'لا توجد وثائق مشاركة معك بعد.',
      center_main: 'المركز النفسي البيداغوجي دار الإحسان',
      center_work: 'مركز المساعدة على العمل',
      center_farm: 'المزرعة البيداغوجية ومركز التكوين في الزراعة المائية وتربية الأسماك',
      sectionPrefix: 'القسم: ',
      basicInfoTitle: 'المعلومات الأساسية والتوجيهات',
      noExtraInfo: 'لا توجد معلومات إضافية مسجلة.',
      periodPrefix: 'الفترة: ',
      datePrefix: 'التاريخ: ',
      achievements: 'المكتسبات والمهارات',
      activities: 'الأنشطة والبرامج',
      notes: 'ملاحظات وتوجيهات تربوية',
      openAttachment: 'فتح المرفق (PDF/صورة)',
      openDoc: 'فتح الوثيقة',
      openLinkWait: 'اضغط لفتح الملف (الرابط صالح دقيقة)',
      cancelled: 'ملغى',
      scheduled: 'قائم',
      apptsUpcoming: 'المواعيد والأنشطة القادمة',
      apptsPast: 'المواعيد السابقة والملغاة',
      forAll: 'لجميع الأولياء',
      forChildPrefix: 'خاص بـ ',
      newBadge: 'جديد',
      personalMsg: 'رسالة خاصة',
      announcement: 'إعلان عام',
      markAsRead: 'تم الاطلاع',
      contactTitle: 'التواصل مع إدارة المركز',
      contactSub: 'نحن في خدمتكم دائمًا عبر الوسائل الرسمية التالية:',
      contactAddrLabel: '📍 العنوان:',
      contactAddrVal: 'بلدية العطف – ولاية غرداية – الجزائر',
      contactEmailLabel: '✉️ البريد الإلكتروني:',
      contactPhoneLabel: '📞 الهاتف / الفاكس:',
      contactSocialLabel: '🌐 منصات التواصل:',
      contactWa: 'واتساب المركز',
      contactFb: 'صفحة فيسبوك',
      contactSiteLabel: '🏠 الموقع الرسمي للمركز:',
      contactSiteLink: 'الصفحة الرئيسية لدار الإحسان',
      contactNoteTitle: 'إرشاد للأولياء',
      contactNoteTxt: 'لأي استفسار طارئ أو مناقشة بخصوص الملف البيداغوجي لطفلك، يُفضَّل التواصل مع الإدارة المباشرة خلال ساعات العمل الرسمية.',
      enterCredsErr: 'أدخل البريد الإلكتروني وكلمة المرور.',
      validEmailErr: 'أدخل بريدًا إلكترونيًا صحيحًا.',
      passMismatchErr: 'كلمتا المرور غير متطابقتين.',
      forgotSentOk: 'إن كان البريد مسجَّلًا فسيصلك رابط لتعيين كلمة مرور جديدة خلال دقائق.',
      notActiveParentErr: 'هذا الحساب غير مفعّل أو غير مخصّص للأولياء.',
      titleConfirm: 'تفعيل حسابك',
      hintConfirmInvite: 'تمت دعوتك إلى فضاء الأولياء. اضغط «تفعيل حسابي» ثم اختر كلمة مرور.',
      hintConfirmReset: 'اضغط «متابعة» ثم اختر كلمة مرور جديدة لحسابك.',
      btnConfirmInvite: 'تفعيل حسابي',
      btnConfirmReset: 'متابعة',
      verifying: 'جارٍ التحقق من الرابط…',
      expiredMsg: 'هذا الرابط انتهت صلاحيته أو سبق استعماله. اطلب رابطًا جديدًا من الزر أدناه، أو تواصل مع إدارة المركز.',
      invalidMsg: 'هذا الرابط غير صالح أو ناقص. افتح الرابط كاملًا من البريد، أو اطلب رابطًا جديدًا.',
      btnRequestNew: 'طلب رابط جديد',
      hintNewLink: 'أدخل بريدك الإلكتروني وسنرسل إليك رابطًا جديدًا إن كان حسابك مسجَّلًا.'
    },
    fr: {
      brand: 'Espace Parents',
      whoDefault: 'Parent',
      langBtnLogin: 'العربية',
      langBtnBar: 'AR',
      titleLogin: 'Espace Parents',
      titleSet: 'Définir le mot de passe',
      titleForgot: 'Mot de passe oublié',
      hintLogin: 'Connectez-vous pour suivre le dossier de votre enfant.',
      hintForgot: 'Saisissez votre e-mail pour recevoir le lien de réinitialisation.',
      hintSet: 'Choisissez un mot de passe sécurisé pour votre compte.',
      hintInvite: 'Bienvenue ! Définissez votre mot de passe pour activer votre compte.',
      emailLabel: 'Adresse e-mail',
      passLabel: 'Mot de passe',
      newPassLabel: 'Nouveau mot de passe',
      confirmPassLabel: 'Confirmez le mot de passe',
      passRule: 'Au moins 10 caractères avec majuscule, minuscule et chiffre.',
      btnLogin: 'Connexion',
      btnForgotSend: 'Envoyer le lien',
      btnSetSave: 'Enregistrer le mot de passe',
      btnForgot: 'Mot de passe oublié ?',
      btnBack: 'Retour à la connexion',
      accountNotice: 'Les comptes sont créés par l’administration du centre uniquement. Si vous n’avez pas reçu d’invitation, contactez le centre.',
      tabChildren: 'Mes Enfants',
      tabReports: 'Rapports',
      tabAppts: 'Rendez-vous',
      tabMsgs: 'Messages',
      tabDocs: 'Documents',
      tabContact: 'Contact',
      welcome: 'Bienvenue',
      welcomeSuffix: ' dans votre Espace Parents.',
      logoutPrompt: 'Déconnexion automatique après une période d’inactivité.',
      btnSignOut: 'Déconnexion',
      emptyChildren: 'Aucun dossier d’enfant associé à votre compte. Contactez l’administration.',
      emptyReports: 'Aucun rapport pédagogique publié pour le moment.',
      emptyAppts: 'Aucun rendez-vous à venir.',
      emptyApptsPast: 'Aucun rendez-vous passé.',
      emptyMsgs: 'Aucun message ou annonce pour le moment.',
      emptyDocs: 'Aucun document partagé avec votre compte.',
      center_main: 'Centre psycho-pédagogique Dar El Ihsan',
      center_work: 'Centre d’Aide par le Travail (CAT)',
      center_farm: 'Ferme pédagogique et centre de formation en hydroponie et aquaculture',
      sectionPrefix: 'Section : ',
      basicInfoTitle: 'Informations de base & Orientations',
      noExtraInfo: 'Aucune information supplémentaire enregistrée.',
      periodPrefix: 'Période : ',
      datePrefix: 'Date : ',
      achievements: 'Acquis et compétences',
      activities: 'Activités et ateliers',
      notes: 'Observations pédagogiques',
      openAttachment: 'Ouvrir la pièce jointe (PDF/Image)',
      openDoc: 'Consulter le document',
      openLinkWait: 'Cliquer pour ouvrir (lien valide 1 minute)',
      cancelled: 'Annulé',
      scheduled: 'Programmé',
      apptsUpcoming: 'Rendez-vous et activités à venir',
      apptsPast: 'Rendez-vous passés et annulés',
      forAll: 'Pour tous les parents',
      forChildPrefix: 'Concerne : ',
      newBadge: 'Nouveau',
      personalMsg: 'Message personnel',
      announcement: 'Annonce générale',
      markAsRead: 'Marquer comme lu',
      contactTitle: 'Contacter l’Administration',
      contactSub: 'Nous sommes à votre écoute par le biais des canaux officiels suivants :',
      contactAddrLabel: '📍 Adresse :',
      contactAddrVal: 'Commune d’El Atteuf – Wilaya de Ghardaïa – Algérie',
      contactEmailLabel: '✉️ E-mail :',
      contactPhoneLabel: '📞 Téléphone / Fax :',
      contactSocialLabel: '🌐 Réseaux officiels :',
      contactWa: 'WhatsApp du Centre',
      contactFb: 'Page Facebook',
      contactSiteLabel: '🏠 Site web officiel :',
      contactSiteLink: 'Page d’accueil Dar El Ihsan',
      contactNoteTitle: 'Information aux parents',
      contactNoteTxt: 'Pour toute question relative au suivi éducatif ou médical de votre enfant, privilégiez le contact par e-mail ou une visite directe durant les heures de permanence.',
      enterCredsErr: 'Veuillez saisir votre e-mail et votre mot de passe.',
      validEmailErr: 'Veuillez saisir une adresse e-mail valide.',
      passMismatchErr: 'Les mots de passe ne correspondent pas.',
      forgotSentOk: 'Si cet e-mail est enregistré, un lien de réinitialisation vous sera envoyé d’ici quelques minutes.',
      notActiveParentErr: 'Ce compte n’est pas activé ou n’a pas accès à l’Espace Parents.',
      titleConfirm: 'Activer votre compte',
      hintConfirmInvite: 'Vous êtes invité(e) à l’Espace Parents. Appuyez sur « Activer mon compte » puis choisissez un mot de passe.',
      hintConfirmReset: 'Appuyez sur « Continuer » puis choisissez un nouveau mot de passe.',
      btnConfirmInvite: 'Activer mon compte',
      btnConfirmReset: 'Continuer',
      verifying: 'Vérification du lien…',
      expiredMsg: 'Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien ci-dessous ou contactez l’administration.',
      invalidMsg: 'Ce lien est invalide ou incomplet. Ouvrez le lien complet depuis l’e-mail ou demandez-en un nouveau.',
      btnRequestNew: 'Demander un nouveau lien',
      hintNewLink: 'Saisissez votre e-mail : un nouveau lien vous sera envoyé si votre compte existe.'
    }
  };

  function t(k) {
    return (I18N[LANG] && I18N[LANG][k]) || (I18N.ar && I18N.ar[k]) || k;
  }

  function applyLang() {
    var isFr = (LANG === 'fr');
    document.documentElement.dir = isFr ? 'ltr' : 'rtl';
    document.documentElement.lang = LANG;

    var btnLogin = $('#loginLangBtn');
    if (btnLogin) btnLogin.textContent = t('langBtnLogin');
    var btnBar = $('#barLangBtn');
    if (btnBar) btnBar.textContent = t('langBtnBar');

    var bt = $('#barTitle'); if (bt) bt.textContent = t('brand');
    var lt = $('#lTitle'); if (lt) lt.textContent = mode === 'confirm' ? t('titleConfirm') : mode === 'set' ? t('titleSet') : mode === 'forgot' ? t('titleForgot') : t('titleLogin');
    var lh = $('#lHint'); if (lh && !lh.dataset.custom) lh.textContent = mode === 'confirm' ? confirmHint() : mode === 'set' ? t('hintSet') : mode === 'forgot' ? t('hintForgot') : t('hintLogin');
    var em = $('#lblEmail'); if (em) em.textContent = t('emailLabel');
    var pw = $('#lblPassword'); if (pw) pw.textContent = t('passLabel');
    var fe = $('#lblFEmail'); if (fe) fe.textContent = t('emailLabel');
    var np1 = $('#lblNp1'); if (np1) np1.textContent = t('newPassLabel');
    var np2 = $('#lblNp2'); if (np2) np2.textContent = t('confirmPassLabel');
    var nh = $('#npHint'); if (nh) nh.textContent = t('passRule');
    var lb = $('#lBtn'); if (lb) lb.textContent = lblBtn(mode);
    var nl = $('#newLinkBtn'); if (nl) nl.textContent = t('btnRequestNew');
    var fb = $('#forgotBtn'); if (fb) fb.textContent = t('btnForgot');
    var bb = $('#backBtn'); if (bb) bb.textContent = t('btnBack');
    var nt = $('#loginNotice'); if (nt) nt.textContent = t('accountNotice');
    var who = $('#who'); if (who && (!S.name || who.textContent === 'ولي الأمر' || who.textContent === 'Parent')) who.textContent = S.name || t('whoDefault');
  }

  function toggleLang() {
    LANG = (LANG === 'ar') ? 'fr' : 'ar';
    try { sessionStorage.setItem('de_parent_lang', LANG); } catch (e) {}
    applyLang();
    if (C.loggedIn() && S.d) render();
  }

  /* ---------- أدوات ---------- */
  function fmtDate(v, withTime) {
    try {
      var locale = (LANG === 'fr') ? 'fr-DZ' : 'ar-DZ-u-nu-latn';
      return new Date(v).toLocaleString(locale, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
    } catch (e) { return ''; }
  }

  function toast(msg, kind) {
    var el = $('#toast'); el.textContent = msg; el.className = 'toast ' + (kind || ''); el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 3800);
  }

  function show(id) { ['boot', 'login', 'app'].forEach(function (x) { $('#' + x).hidden = x !== id; }); if (id !== 'boot') window.__deReady = true; }
  function setMsg(el, m) { el.textContent = m || ''; el.hidden = !m; }

  function lockBtn(btn, fn) {
    if (btn.disabled) return Promise.resolve();
    btn.disabled = true;
    return Promise.resolve().then(fn).then(function (r) { btn.disabled = false; return r; }, function (e) { btn.disabled = false; throw e; });
  }

  /* ---------- الدخول / الدعوة / الاستعادة ---------- */
  var mode = 'login'; // login | forgot | set | confirm
  var pendingOtp = null;      // { token_hash, type } من رابط البريد؛ يُستعمل مرة واحدة فقط ثم يُمسح
  var offerNewLink = false;   // يظهر زر «طلب رابط جديد» بعد رابط منتهٍ/غير صالح

  function confirmHint() { return pendingOtp && pendingOtp.type !== 'invite' ? t('hintConfirmReset') : t('hintConfirmInvite'); }
  function lblBtn(m) {
    return m === 'login' ? t('btnLogin') : m === 'forgot' ? t('btnForgotSend')
      : m === 'confirm' ? (pendingOtp && pendingOtp.type !== 'invite' ? t('btnConfirmReset') : t('btnConfirmInvite')) : t('btnSetSave');
  }

  function setMode(m, customHint) {
    mode = m;
    $('#stCreds').hidden = m !== 'login';
    $('#stForgot').hidden = m !== 'forgot';
    $('#stSet').hidden = m !== 'set';
    $('#forgotBtn').hidden = m !== 'login';
    $('#backBtn').hidden = (m === 'login' || m === 'set' || m === 'confirm');
    $('#newLinkBtn').hidden = !(m === 'login' && offerNewLink);

    $('#lBtn').textContent = lblBtn(m);
    $('#lTitle').textContent = m === 'confirm' ? t('titleConfirm') : m === 'set' ? t('titleSet') : m === 'forgot' ? t('titleForgot') : t('titleLogin');

    var hintEl = $('#lHint');
    if (customHint) {
      hintEl.textContent = customHint;
      hintEl.dataset.custom = '1';
    } else {
      delete hintEl.dataset.custom;
      hintEl.textContent = m === 'login' ? t('hintLogin') : m === 'forgot' ? t('hintForgot') : m === 'confirm' ? confirmHint() : t('hintSet');
    }
    setMsg($('#lErr'), ''); setMsg($('#lOk'), '');
  }

  function showLogin(msg, newLink) {
    stopIdle && stopIdle();
    offerNewLink = !!newLink;
    show('login');
    setMode('login');
    setMsg($('#lErr'), msg);
  }

  async function submitLogin(e) {
    e.preventDefault(); setMsg($('#lErr'), ''); setMsg($('#lOk'), '');
    await lockBtn($('#lBtn'), async function () {
      try {
        if (mode === 'confirm') {
          var po = pendingOtp;
          if (!po) return showLogin(t('invalidMsg'), true);
          pendingOtp = null;                         // استعمال واحد: لا إعادة معالجة لنفس الرمز
          setMsg($('#lOk'), t('verifying'));
          try { await C.verifyOtp(po.token_hash, po.type); }
          catch (er) {
            if (er.status === 0) { pendingOtp = po; setMsg($('#lOk'), ''); return setMsg($('#lErr'), er.message); }   // انقطاع شبكة: يمكن إعادة المحاولة بنفس الرابط
            return showLogin(t('expiredMsg'), true);
          }
          setMsg($('#lOk'), '');
          if (po.type === 'invite' || po.type === 'recovery') setMode('set', po.type === 'invite' ? t('hintInvite') : t('hintSet'));
          else await enter();
        } else if (mode === 'login') {
          var em = DE.clean($('#email').value, 254).toLowerCase(), pw = $('#password').value;
          if (!DE.isEmail(em) || !pw || pw.length > 72) return setMsg($('#lErr'), t('enterCredsErr'));
          await C.signIn(em, pw);
          $('#password').value = '';
          await enter();
        } else if (mode === 'forgot') {
          var fe = DE.clean($('#fEmail').value, 254).toLowerCase();
          if (!DE.isEmail(fe)) return setMsg($('#lErr'), t('validEmailErr'));
          try { await C.recover(fe, location.origin + location.pathname); }
          catch (er) { if (er.status === 429) throw er; }
          setMsg($('#lOk'), t('forgotSentOk'));
        } else {
          var a = $('#np1').value, b = $('#np2').value;
          if (DE.pwProblem(a)) return setMsg($('#lErr'), DE.PW_MSG);
          if (a !== b) return setMsg($('#lErr'), t('passMismatchErr'));
          await C.setPassword(a);
          $('#np1').value = $('#np2').value = '';
          await enter();
        }
      } catch (er) { setMsg($('#lErr'), er.message); }
    });
  }

  /* ---------- تحميل البيانات (عبر RLS) ---------- */
  async function enter() {
    show('boot');
    try {
      var ok = await C.rpc('is_active_parent');
      if (ok !== true) {
        await C.signOut();
        return showLogin(t('notActiveParentErr'));
      }
      var me = await C.me(); S.me = me && me.id;
      var q = function (p) { return C.rest('GET', p); };
      var r = await Promise.all([
        q('/parent_profiles?select=full_name&limit=1'),
        q('/children?select=id,full_name,center,section,basic_info&order=full_name'),
        q('/progress_reports?select=id,child_id,title,report_date,period_start,period_end,achievements,activities,notes,attachment_path&order=report_date.desc'),
        q('/appointments?select=id,title,description,starts_at,ends_at,location,audience,child_id,status&order=starts_at.asc'),
        q('/messages?select=id,kind,title,body,published_at&order=published_at.desc'),
        q('/message_reads?select=message_id'),
        q('/documents?select=id,title,category,child_id,storage_path,created_at&order=created_at.desc')
      ]);
      S.name = (r[0][0] && r[0][0].full_name) || '';
      S.d = { children: r[1], reports: r[2], appts: r[3], msgs: r[4], docs: r[6] };
      S.reads = {}; r[5].forEach(function (x) { S.reads[x.message_id] = true; });

      show('app');
      applyLang();
      $('#who').textContent = S.name || t('whoDefault');
      toast(t('welcome') + (S.name ? ' ' + S.name : '') + t('welcomeSuffix'), 'ok');

      stopIdle && stopIdle();
      stopIdle = DE.idle(30 * 60 * 1000, function () { logout(t('logoutPrompt')); });
      render();
    } catch (er) { showLogin(er.message); }
  }

  async function logout(msg) {
    await C.signOut();
    S = { tab: 'children', me: null, name: '', d: null, reads: {} };
    showLogin(msg);
  }

  /* ---------- العرض ---------- */
  var TABS = [
    ['children', 'tabChildren', 'i-child'],
    ['reports',  'tabReports',  'i-report'],
    ['appts',    'tabAppts',    'i-cal'],
    ['msgs',     'tabMsgs',     'i-mail'],
    ['docs',     'tabDocs',     'i-file'],
    ['contact',  'tabContact',  'i-contact']
  ];

  function unreadCount() {
    return S.d ? S.d.msgs.filter(function (m) { return !S.reads[m.id]; }).length : 0;
  }

  function icon(id) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'i');
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#' + id);
    s.appendChild(u);
    return s;
  }

  function renderTabs() {
    var nav = $('#tabs'); nav.textContent = '';
    TABS.forEach(function (tb) {
      var b = h('button', {
        type: 'button',
        role: 'tab',
        'aria-selected': S.tab === tb[0] ? 'true' : 'false',
        onclick: function () { S.tab = tb[0]; render(); window.scrollTo(0, 0); }
      }, icon(tb[2]), t(tb[1]));

      if (tb[0] === 'msgs' && unreadCount()) {
        b.appendChild(h('span', { class: 'dot', text: String(unreadCount()) }));
      }
      nav.appendChild(b);
    });
  }

  function childName(id) {
    var c = S.d.children.filter(function (x) { return x.id === id; })[0];
    return c ? c.full_name : '';
  }

  function empty(text) { return h('div', { class: 'card empty', text: text }); }

  function fileBtn(path, label) {
    var holder = h('span');
    var b = h('button', { class: 'btn small light', type: 'button', text: label || t('openDoc') });
    b.addEventListener('click', function () {
      lockBtn(b, async function () {
        try {
          var url = await C.signedUrl('private-docs', path, 60);
          holder.textContent = '';
          holder.appendChild(h('a', {
            class: 'btn small gold',
            href: url,
            target: '_blank',
            rel: 'noopener noreferrer',
            text: t('openLinkWait')
          }));
        } catch (er) { toast(er.message, 'bad'); }
      });
    });
    holder.appendChild(b);
    return holder;
  }

  function vChildren(v) {
    if (!S.d.children.length) return v.appendChild(empty(t('emptyChildren')));
    S.d.children.forEach(function (c) {
      var centerLabel = t('center_' + c.center) || c.center;
      var card = h('div', { class: 'card child-card' },
        h('h2', { text: c.full_name }),
        h('div', { class: 'meta' },
          h('span', { text: centerLabel }),
          c.section ? h('span', { text: t('sectionPrefix') + c.section }) : null
        )
      );
      if (c.basic_info) {
        card.appendChild(h('h3', { text: t('basicInfoTitle') }));
        card.appendChild(h('p', { class: 'txt', text: c.basic_info }));
      } else {
        card.appendChild(h('p', { class: 'muted small', text: t('noExtraInfo') }));
      }
      v.appendChild(card);
    });
  }

  function vReports(v) {
    if (!S.d.reports.length) return v.appendChild(empty(t('emptyReports')));
    S.d.reports.forEach(function (r) {
      var card = h('div', { class: 'card' },
        h('h2', { text: r.title }),
        h('div', { class: 'meta' },
          h('span', { text: childName(r.child_id) }),
          h('span', { text: t('periodPrefix') + fmtDate(r.period_start) + ' – ' + fmtDate(r.period_end) }),
          h('span', { text: t('datePrefix') + fmtDate(r.report_date) })
        )
      );
      [[t('achievements'), r.achievements], [t('activities'), r.activities], [t('notes'), r.notes]].forEach(function (p) {
        if (p[1]) card.appendChild(h('div', null, h('h3', { text: p[0] }), h('p', { class: 'txt', text: p[1] })));
      });
      if (r.attachment_path) card.appendChild(h('div', null, fileBtn(r.attachment_path, t('openAttachment'))));
      v.appendChild(card);
    });
  }

  function apptCard(a) {
    var isCancelled = (a.status === 'cancelled');
    return h('div', { class: 'card' },
      h('h2', null, a.title, ' ', isCancelled ? h('span', { class: 'badge bad', text: t('cancelled') }) : null),
      h('div', { class: 'meta' },
        h('span', { text: fmtDate(a.starts_at, true) }),
        a.location ? h('span', { text: a.location }) : null,
        a.audience === 'child' ? h('span', { text: t('forChildPrefix') + childName(a.child_id) }) : h('span', { text: t('forAll') })
      ),
      a.description ? h('p', { class: 'txt', text: a.description }) : null
    );
  }

  function vAppts(v) {
    var now = Date.now(), up = [], past = [];
    S.d.appts.forEach(function (a) {
      (a.status === 'scheduled' && new Date(a.starts_at).getTime() >= now ? up : past).push(a);
    });

    v.appendChild(h('div', { class: 'section-title' }, h('h2', { text: t('apptsUpcoming') })));
    if (!up.length) v.appendChild(empty(t('emptyAppts'))); else up.forEach(function (a) { v.appendChild(apptCard(a)); });

    if (past.length) {
      v.appendChild(h('div', { class: 'section-title' }, h('h2', { text: t('apptsPast') })));
      past.reverse().forEach(function (a) { v.appendChild(apptCard(a)); });
    }
  }

  function vMsgs(v) {
    if (!S.d.msgs.length) return v.appendChild(empty(t('emptyMsgs')));
    S.d.msgs.forEach(function (m) {
      var unread = !S.reads[m.id];
      var card = h('div', { class: 'card' + (unread ? ' unread' : '') },
        h('h2', null, m.title, ' ', unread ? h('span', { class: 'badge', text: t('newBadge') }) : null),
        h('div', { class: 'meta' },
          h('span', { text: m.kind === 'message' ? t('personalMsg') : t('announcement') }),
          h('span', { text: fmtDate(m.published_at, true) })
        ),
        h('p', { class: 'txt', text: m.body })
      );
      if (unread) {
        var b = h('button', { class: 'btn small light', type: 'button', text: t('markAsRead') });
        b.addEventListener('click', function () {
          lockBtn(b, async function () {
            try {
              await C.rest('POST', '/message_reads?on_conflict=message_id,parent_id', { message_id: m.id, parent_id: S.me }, 'resolution=ignore-duplicates,return=minimal');
              S.reads[m.id] = true;
              render();
            } catch (er) { toast(er.message, 'bad'); }
          });
        });
        card.appendChild(b);
      }
      v.appendChild(card);
    });
  }

  function vDocs(v) {
    if (!S.d.docs.length) return v.appendChild(empty(t('emptyDocs')));
    S.d.docs.forEach(function (d) {
      v.appendChild(h('div', { class: 'card' },
        h('h2', { text: d.title }),
        h('div', { class: 'meta' },
          h('span', { text: childName(d.child_id) }),
          d.category ? h('span', { text: d.category }) : null,
          h('span', { text: fmtDate(d.created_at) })
        ),
        fileBtn(d.storage_path, t('openDoc'))
      ));
    });
  }

  /* ---------- قسم التواصل مع المركز ---------- */
  function vContact(v) {
    var card = h('div', { class: 'card contact-card' });

    card.appendChild(h('h2', { text: t('contactTitle') }));
    card.appendChild(h('p', { class: 'muted small', text: t('contactSub') }));

    // العنوان
    var addrRow = h('div', { class: 'contact-item' });
    addrRow.appendChild(h('div', { class: 'ci-icon', text: '📍' }));
    var ab = h('div', { class: 'ci-body' });
    ab.appendChild(h('div', { class: 'ci-label', text: t('contactAddrLabel') }));
    ab.appendChild(h('div', { class: 'ci-val', text: t('contactAddrVal') }));
    addrRow.appendChild(ab);
    card.appendChild(addrRow);

    // البريد الإلكتروني
    var emailRow = h('div', { class: 'contact-item' });
    emailRow.appendChild(h('div', { class: 'ci-icon', text: '✉️' }));
    var eb = h('div', { class: 'ci-body' });
    eb.appendChild(h('div', { class: 'ci-label', text: t('contactEmailLabel') }));
    eb.appendChild(h('a', {
      class: 'ci-val',
      href: 'https://mail.google.com/mail/?view=cm&to=cppdarelihcen@gmail.com',
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'cppdarelihcen@gmail.com'
    }));
    emailRow.appendChild(eb);
    card.appendChild(emailRow);

    // الهاتف
    var telRow = h('div', { class: 'contact-item' });
    telRow.appendChild(h('div', { class: 'ci-icon', text: '📞' }));
    var tb = h('div', { class: 'ci-body' });
    tb.appendChild(h('div', { class: 'ci-label', text: t('contactPhoneLabel') }));
    tb.appendChild(h('div', { class: 'ci-val', dir: 'ltr', text: '044 44 48 34 / 0664 42 14 44 / 0540 81 77 75 / 0668 03 41 47' }));
    telRow.appendChild(tb);
    card.appendChild(telRow);

    // الروابط
    var btnWrap = h('div', { class: 'contact-btn-wrap' });
    btnWrap.appendChild(h('a', {
      class: 'contact-btn',
      href: 'https://wa.me/213668034147',
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '💬 ' + t('contactWa')
    }));
    btnWrap.appendChild(h('a', {
      class: 'contact-btn',
      href: 'https://www.facebook.com/apehme',
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '📘 ' + t('contactFb')
    }));

    var homeLink = document.createElement('a');
    homeLink.setAttribute('href', './index.html');
    homeLink.className = 'contact-btn';
    homeLink.textContent = '🏠 ' + t('contactSiteLink');
    btnWrap.appendChild(homeLink);

    card.appendChild(btnWrap);
    v.appendChild(card);

    var noteCard = h('div', { class: 'card' },
      h('h3', { text: t('contactNoteTitle') }),
      h('p', { class: 'txt', text: t('contactNoteTxt') })
    );
    v.appendChild(noteCard);
  }

  function render() {
    renderTabs();
    var v = $('#view'); v.textContent = '';
    ({ children: vChildren, reports: vReports, appts: vAppts, msgs: vMsgs, docs: vDocs, contact: vContact })[S.tab](v);
  }

  /* ---------- التشغيل ---------- */
  function init() {
    applyLang();

    if (!CFG.supabaseUrl || !CFG.supabaseKey) {
      $('#boot').textContent = 'إعدادات الاتصال غير مضبوطة.';
      return;
    }

    C.onExpire(function () { showLogin(t('logoutPrompt')); });
    $('#loginForm').addEventListener('submit', submitLogin);
    $('#forgotBtn').addEventListener('click', function () { setMode('forgot'); });
    $('#backBtn').addEventListener('click', function () { setMode('login'); });
    $('#logoutBtn').addEventListener('click', function () { logout(); });

    var loginLang = $('#loginLangBtn');
    if (loginLang) loginLang.addEventListener('click', toggleLang);
    var barLang = $('#barLangBtn');
    if (barLang) barLang.addEventListener('click', toggleLang);

    $('#newLinkBtn').addEventListener('click', function () { offerNewLink = false; setMode('forgot', t('hintNewLink')); });

    var u = C.adoptUrl();      // يعالج #hash وكذلك ?token_hash= و?error= و?code= ويمسحها من الشريط فورًا
    if (u) {
      if (u.kind === 'error') { showLogin(u.expired ? t('expiredMsg') : u.message, true); return; }
      if (u.kind === 'unsupported') { showLogin(t('invalidMsg'), true); return; }
      if (u.kind === 'otp') { pendingOtp = { token_hash: u.token_hash, type: u.type }; show('login'); setMode('confirm'); return; }
      if (u.kind === 'session' && (u.type === 'invite' || u.type === 'recovery')) {
        show('login');
        setMode('set', u.type === 'invite' ? t('hintInvite') : t('hintSet'));
        return;
      }
    }

    if (C.load()) enter(); else showLogin();
  }

  init();
})();
