/* فضاء الأولياء — Espace Parents — دار الإحسان
   يدعم اللغتين العربية (افتراضي RTL) والفرنسية (LTR) مع حماية RLS كاملة وبلا مكتبات خارجية.
   عزل تام للبيانات: لا يمكن للولي رؤية أي ملف أو برنامج تربوي إلا للقسم والطفل المرتبط به حصراً.
   كل النصوص تُدرج بـ textContent لحماية تامة من XSS. */
(function () {
  'use strict';
  var FILE_BUILD = '2026-10-27.1';
  function currentAcademicYear(sep) {
    var s = sep || '-';
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    var start = (m >= 8) ? y : (y - 1);
    return start + s + (start + 1);
  }

  /* frame-safe */

  var CFG = window.DE_CONFIG || {}, h = DE.h;
  var $ = function (s) { return document.querySelector(s); };
  var C = DE.Client(CFG, 'de_parent_session');
  var S = { tab: 'children', tabStack: [], me: null, name: '', d: null, reads: {}, selectedChildId: null };
  var stopIdle = null;

  /* الدليل البيداغوجي الرسمي المعتمد (لإظهار استمارات التقييم البيداغوجي للأولياء بدقة تامة) */
  var EMBEDDED_CURRICULUM = {"مجال الاستقلالية (الحياة اليومية والعناية بالذات)":["غسل اليدين بالماء بشكل صحيح","غسل اليدين بالماء والصابون بشكل صحيح","غسل الوجه بالماء بشكل صحيح","تجفيف اليدين والوجه باستخدام الفوطة بشكل صحيح","استخدام المنديل بشكل صحيح","تنظيف الأنف","خلع السروال بشكل صحيح","خلع المئزر بشكل صحيح","خلع القميص (فك الأزرار) بشكل صحيح","خلع الجوارب بشكل صحيح","خلع الحذاء بشكل صحيح","لبس السروال بشكل صحيح","لبس المئزر بشكل صحيح","لبس القميص (فك الأزرار) بشكل صحيح","لبس الجوارب بشكل صحيح","لبس الحذاء بشكل صحيح","التعرف على أدوات الأكل (ملعقة، كوب، صحن، شوكة)","مسك أدوات الطعام بشكل صحيح","الشرب بكوب الماء أو العصير بشكل صحيح","الأكل بطريقة صحيحة","طلب الذهاب إلى الحمام عند الحاجة إليه (صورة / كلمة)","التعرف على مكان الحمام","استخدام الحمام باستقلالية","التعرف على أدوات تنظيف الأسنان (المعجون، الفرشاة، الماء)","القيام بتنظيف الأسنان باستقلالية"],"مجال المهارات الحركية الدقيقة":["القبض على الأشياء باستخدام قبضة اليد","الضغط على كرة إسفنجية بقبضة اليد بالتناوب بين اليدين","الضغط على مادة الصلصال","طي أو ثني ورقة عدة مرات بشكل عشوائي","مسك مقبض الباب وتدويره","يستطيع فتح قارورة","التقاط خرز (حجم صغير)","التقاط خرز (حجم كبير)","نقل خمس خرزات (حجم صغير) من صحن لآخر","نقل خمس خرزات (حجم كبير) من صحن لآخر","تقليب صفحات كتاب","ترتيب مجموعة من الأوراق فوق بعضها","تنظيم خمس خرزات (حجم صغير) بخيط","تنظيم خمس خرزات (حجم كبير) بخيط","يستطيع إغلاق قارورة","مسك القلم بشكل صحيح","التلوين بشكل عشوائي على الورقة","التلوين داخل حيز","توصيل خطوط منقطة مرسومة على ورقة بشكل أفقي","توصيل خطوط منقطة مرسومة على ورقة بشكل منحني","مسك المقص بشكل صحيح","قص الورقة بشكل عشوائي","قص الورقة على خطوط مستقيمة عريضة","قص الورقة على خطوط مستقيمة رفيعة","قص الورقة على خطوط منحنية عريضة","قص الورقة على خطوط منحنية رفيعة"],"مجال المهارات الحركية الكبرى":["الوقوف بطريقة صحيحة","الجلوس بطريقة صحيحة","المشي بطريقة صحيحة","الجري بطريقة صحيحة","التدحرج بشكل صحيح","رمي الكرة بطريقة صحيحة","ركل الكرة بطريقة صحيحة","الحجل بطريقة صحيحة","سحب الحبل بطريقة صحيحة","دفع جهاز متحرك لمسافة 2 م بطريقة صحيحة","يرفع ثقل (2 كغم) عن الأرض","يحمل ثقل (2 كغم) لمسافة 10 م","رفع الذراعين، أماماً، عالياً، جانباً بطريقة صحيحة","صعود ونزول السلم (الدرج) بطريقة صحيحة","يثني الجذع أماماً أسفل بطريقة صحيحة (مرونة)","رمي الكرة باتجاه هدف على الحائط من مسافة 2 م بطريقة صحيحة (توازن)","تنطيط الكرة من الثبات خمس مرات (توافق)","يجري بشكل متعرج لمسافة 10 م (رشاقة)","رمي ثقل (1 كغم) لمسافة 5 م (قوة)"],"مجال ما قبل الأكاديمي":["الوصل بين مجموعة عناصر من نفس الفئة","رسم لوحات بسيطة","تسلسل الأرقام والحروف","التعرف على الأشكال","التعرف على الألوان","المطابقة بين الأشياء المتماثلة","المطابقة بين الألوان","المطابقة بين الأشكال","المطابقة بين أنواع الفواكه (البرتقال، الموز، التفاح، العنب، البطيخ)","المطابقة بين أنواع الخضر (طماطم، بطاطا، فلفل..)","مطابقة أعضاء الحواس الخمسة (يد، عين، أذن، لسان، أنف)","المطابقة بين صور الحيوانات الأليفة (جمل، حصان، بقرة، قطة، أرنب، ماعز)","مطابقة فئات النقود الورقية والمعدنية","مطابقة الحروف الهجائية بالبطاقات","أن يكتب خطوطاً مستقيمة عن نموذج (استعداد للكتابة)","أن يكتب خطوطاً منحنية عن نموذج (استعداد للكتابة)","العد بشكل آلي من 1 إلى 10","يشير إلى الأرقام من 1 إلى 10","التعرف على مدلول الأرقام من 1 إلى 10"],"المجال الأكاديمي":["التعرف على أشكال الحروف داخل الكلمة (البداية، الوسط، النهاية)","التعرف إلى أشكال الحروف مع المد بالألف","التعرف إلى أشكال الحروف مع المد بالواو","التعرف إلى أشكال الحروف مع المد بالياء","التعرف إلى أشكال الحروف مع الحركات (الفتحة)","التعرف إلى أشكال الحروف مع الحركات (الضمة)","التعرف إلى أشكال الحروف مع الحركات (الكسرة)","التعرف إلى أشكال الحروف مع الحركات (السكون)","يقرأ كلمة من حرفين","يقرأ كلمة من 3 حروف","يقرأ كلمة من 4 حروف فأكثر","يقرأ جملة من كلمتين","يقرأ جملة من 3 كلمات","يقرأ جملة من 4 كلمات","يقرأ جملة من 5 كلمات فأكثر","يقرأ فقرة من درس مختار","يكتب الحرف فوق نقط","يكتب الحروف عن نموذج","يكتب أشكال حروف داخل الكلمة فوق نقط","يكتب أشكال الحروف داخل الكلمة عن نموذج","يكتب مقاطع عن نموذج","يكتب كلمة من 3 حروف","يكتب كلمة من 4 حروف فأكثر","يكتب جملاً مختارة عن نموذج","التعرف إلى إشارة (+)","التعرف إلى إشارة (-)","التعرف إلى إشارة (=)","التعرف إلى مفهوم الجمع","حل مسائل على الجمع ضمن الرقم 10","التعرف على مفهوم الطرح","حل مسائل على الطرح ضمن الرقم 10","يتعرف الطالب على مفاهيم الأحجام (كبير، صغير)","يصنف أشياء حسب حجمها (كبير، صغير)","يتعرف الطالب على مفاهيم الأطوال (طويل، قصير)","يصنف أشياء حسب طولها (طويل، قصير)","يتعرف الطالب على مفاهيم ظروف المكان (أمام، خلف، فوق، تحت، داخل، خارج)","يتعرف الطالب على مفاهيم ظروف الزمان (صباح، مساء، ليل، نهار، قبل، بعد)","يتعرف الطالب على المفاهيم (حار، بارد)","يتعرف الطالب على المفاهيم (ناعم، خشن)","يطابق الطالب أسماء أيام الأسبوع (بطاقات)","يتعرف الطالب على شكل أيام الأسبوع (بطاقات)","يذكر الطالب أيام الأسبوع بالتدرج (من السبت إلى الجمعة)","يميز الطالب بين اليوم والأمس وغداً","يربط الطالب اليوم مع أيام الأسبوع (معرفة اليوم الراهن)","يطابق الطالب فصول السنة الأربعة","يتعرف الطالب على فصول السنة الأربعة","يميز الطالب فصول السنة الأربعة","يربط الطالب الفصل الحالي مع فصول السنة الأربعة","يطابق الطالب أحرف اسمه بشكل صحيح (بطاقات)","يشير إلى أحرف اسمه بشكل صحيح","يتعرف الطالب على أحرف اسمه بشكل صحيح"],"مجال التقليد":["تقليد التصفيق","تقليد رفع اليدين إلى الأعلى معاً","تقليد ضرب الطاولة باليد","تقليد فتح وغلق اليدين","تشبيك اليدين معاً","الإشارة إلى أجزاء الجسم","رن الجرس باستخدام الأشياء","دحرجة لعبة باستخدام الأشياء","القفز من وضع الوقوف","الجري من وضع الوقوف","الدوران من وضع الوقوف","تقليد عدد تكرار الحركات","تقليد حركات حركية دون مساعدة لفظية","تقليد أصوات بسيطة (تقليد لفظي)","تقليد أصوات أولية للكلمات","تقليد مقاطع صوتية منفصلة","تقليد الكلمات","تقليد العبارات","تقليد تلقائي للكلمات","تقليد تلقائي للعبارات"],"مجال مهارات الحضور والانتباه":["الاستماع لصوت الجرس عند قرعه","الالتفات عند مناداته باسمه","الاتصال البصري أثناء المحادثة","الاتصال البصري أثناء التعليم الجماعي","الاستجابة للتعليمات اللفظية (أمر واحد)","الاستجابة للتعليمات اللفظية (أمران متسلسلان)","الاستجابة للتعليمات اللفظية (أمران غير متسلسلين)","إدارة رأسه من مصدر صوت إلى مصدر آخر","تذكر مكان إخفاء الشيء","متابعة لهب شمعة فترة من الوقت","الجلوس على المقعد بشكل صحيح أثناء أداء المهمة التعليمية"],"مجال التواصل":["يستجيب الطفل عند مناداته باسمه","يصرخ للحصول على ما يريد","يحدث ضجة بدل الكلام","يتكلم كلاماً غير مفهوم","يشير عن بعد إلى الأشياء التي يريدها","يستخدم كلمة واحدة للتعبير عن كلمات أو عبارات","يستجيب للأوامر البسيطة (أمر واحد)","يستجيب للأوامر المتسلسلة (أكثر من أمر)","يوجد لديه مصاداة، يكرر الأصوات أو الكلام كالببغاء","يبدو أنه أصم لا يسمع","يستجيب لأصوات الأشياء المألوفة","يعبر لفظياً عن حاجته للأكل أو الشرب أو استخدام الحمام","يستخدم كلمة (نعم) أو (لا) فقط","يسمي الأشياء المألوفة في البيئة","ينطق كلمة واحدة","ينطق جملة مكونة من كلمتين","ينطق جملة مكونة من ثلاث كلمات أو أكثر","يتلفظ بمقاطع لا معنى لها، أو يتمتم مع نفسه","يسحب الآخرين بيده لجلب شيء","يستجيب للإشارات الإيمائية","يصغي إلى التعليمات اللفظية","يستجيب الطفل للمس الجسدي","يفهم أحرف الجر","يستخدم الضمائر"]};

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
      loginIdLabel: 'اسم المستخدم أو البريد الإلكتروني',
      passLabel: 'كلمة المرور',
      newPassLabel: 'كلمة المرور الجديدة',
      confirmPassLabel: 'أعد كتابة كلمة المرور',
      passRule: '10 أحرف على الأقل مع حرف كبير وصغير ورقم.',
      btnLogin: 'دخول',
      btnForgotSend: 'إرسال رابط الاستعادة',
      btnSetSave: 'حفظ كلمة المرور',
      btnForgot: 'نسيت كلمة المرور؟',
      btnBack: 'رجوع لتسجيل الدخول',
      accountNotice: 'الحسابات تُنشأ من إدارة المركز فقط، أو عبر رمز التسجيل السري المسلَّم من الإدارة.',
      tabChildren: 'أبنائي',
      tabPrograms: 'البرامج التربوية',
      tabReports: 'التقارير والتقييم',
      tabAppts: 'المواعيد',
      tabMsgs: 'الرسائل',
      tabDocs: 'الوثائق',
      tabContact: 'التواصل',
      welcome: 'مرحبًا',
      welcomeSuffix: '! أهلًا بك في فضاء الأولياء.',
      logoutPrompt: 'تم تسجيل خروجك تلقائيًا بعد فترة خمول.',
      btnSignOut: 'تسجيل الخروج',
      emptyChildren: 'لا توجد ملفات أطفال مرتبطة بحسابك بعد. تواصل مع إدارة المركز للمساعدة أو أدخل رمز التسجيل.',
      emptyPrograms: 'لا توجد برامج تربوية منشورة لفوج طفلك حالياً. ستظهر هنا المناهج والبرامج المعتمدة للقسم فور نشرها.',
      emptyReports: 'لا توجد تقارير أو استمارات تقييم منشورة بعد. ستظهر هنا عند اعتمادها.',
      emptyAppts: 'لا توجد مواعيد قادمة.',
      emptyApptsPast: 'لا توجد مواعيد سابقة.',
      emptyMsgs: 'لا توجد رسائل أو إعلانات حتى الآن.',
      emptyDocs: 'لا توجد وثائق مشاركة معك بعد.',
      center_main: 'المركز الرئيسي لدار الإحسان',
      center_work: 'مركز المساعدة على العمل (ورشات التأهيل والتمهين)',
      center_farm: 'المزرعة البيداغوجية (البستنة والأنشطة الفلاحية)',
      membershipPrefix: 'رقم القيد: ',
      dobPrefix: 'تاريخ الميلاد: ',
      disabilityPrefix: 'طبيعة الإعاقة: ',
      sectionPrefix: 'الفوج / القسم: ',
      basicInfoTitle: 'المعلومات الأساسية والتوجيهات',
      noExtraInfo: 'لا توجد توجيهات إضافية مسجلة.',
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
      contactAddrLabel: 'العنوان:',
      contactAddrVal: 'بلدية العطف – ولاية غرداية – الجزائر',
      contactEmailLabel: 'البريد الإلكتروني:',
      contactPhoneLabel: 'الهاتف / الفاكس:',
      contactSocialLabel: 'منصات التواصل:',
      contactWa: 'واتساب المركز',
      contactFb: 'صفحة فيسبوك',
      contactSiteLabel: 'الموقع الرسمي للمركز:',
      contactSiteLink: 'الصفحة الرئيسية لدار الإحسان',
      contactNoteTitle: 'إرشاد للأولياء',
      contactNoteTxt: 'لأي استفسار طارئ أو مناقشة بخصوص الملف البيداغوجي لطفلك، يُفضَّل التواصل مع الإدارة المباشرة خلال ساعات العمل الرسمية.',
      enterCredsErr: 'أدخل اسم المستخدم (أو البريد الإلكتروني) وكلمة المرور.',
      validEmailErr: 'أدخل بريدًا إلكترونيًا صحيحًا.',
      passMismatchErr: 'كلمتا المرور غير متطابقتين.',
      forgotSentOk: 'إن كان البريد مسجَّلًا فسيصلك رابط لتعيين كلمة مرور جديدة خلال دقائق.',
      notActiveParentErr: 'هذا الحساب غير مفعّل أو غير مخصّص للأولياء.',
      btnLinkCode: 'ربط طفل برمز التسجيل',
      enterCodePrompt: 'أدخل رمز التسجيل السري المكوّن من 8 محارف (مثال: DI-A1B2C3):',
      codePlaceholder: 'DI-XXXXXX',
      btnConfirmLink: 'تأكيد الربط',
      btnCancel: 'إلغاء',
      codeEmptyErr: 'يرجى إدخال رمز التسجيل.',
      linkSuccess: 'تم ربط ملف التلميذ بحسابك بنجاح!'
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
      loginIdLabel: "Nom d'utilisateur ou e-mail",
      passLabel: 'Mot de passe',
      newPassLabel: 'Nouveau mot de passe',
      confirmPassLabel: 'Confirmez le mot de passe',
      passRule: 'Au moins 10 caractères avec majuscule, minuscule et chiffre.',
      btnLogin: 'Connexion',
      btnForgotSend: 'Envoyer le lien',
      btnSetSave: 'Enregistrer le mot de passe',
      btnForgot: 'Mot de passe oublié ?',
      btnBack: 'Retour à la connexion',
      accountNotice: 'Les comptes sont créés par l’administration ou via le code d’inscription sécurisé.',
      tabChildren: 'Mes Enfants',
      tabPrograms: 'Programmes',
      tabReports: 'Rapports & Évaluations',
      tabAppts: 'Rendez-vous',
      tabMsgs: 'Messages',
      tabDocs: 'Documents',
      tabContact: 'Contact',
      welcome: 'Bienvenue',
      welcomeSuffix: ' dans votre Espace Parents.',
      logoutPrompt: 'Déconnexion automatique après une période d’inactivité.',
      btnSignOut: 'Déconnexion',
      emptyChildren: 'Aucun dossier d’enfant associé à votre compte. Contactez l’administration ou utilisez un code d’inscription.',
      emptyPrograms: 'Aucun programme éducatif publié pour la section de votre enfant pour le moment.',
      emptyReports: 'Aucun rapport pédagogique publié pour le moment.',
      emptyAppts: 'Aucun rendez-vous à venir.',
      emptyApptsPast: 'Aucun rendez-vous passé.',
      emptyMsgs: 'Aucun message ou annonce pour le moment.',
      emptyDocs: 'Aucun document partagé avec votre compte.',
      center_main: 'Centre principal Dar El Ihsan',
      center_work: 'Centre d’Aide par le Travail (CAT)',
      center_farm: 'Ferme pédagogique',
      membershipPrefix: 'N° d’adhérent : ',
      dobPrefix: 'Date de naissance : ',
      disabilityPrefix: 'Type de handicap : ',
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
      contactAddrLabel: 'Adresse :',
      contactAddrVal: 'Commune d’El Atteuf – Wilaya de Ghardaïa – Algérie',
      contactEmailLabel: 'E-mail :',
      contactPhoneLabel: 'Téléphone / Fax :',
      contactSocialLabel: 'Réseaux officiels :',
      contactWa: 'WhatsApp du Centre',
      contactFb: 'Page Facebook',
      contactSiteLabel: 'Site web officiel :',
      contactSiteLink: 'Page d’accueil Dar El Ihsan',
      contactNoteTitle: 'Information aux parents',
      contactNoteTxt: 'Pour toute question relative au suivi éducatif ou médical de votre enfant, privilégiez le contact par e-mail ou une visite directe durant les heures de permanence.',
      enterCredsErr: "Veuillez saisir votre nom d'utilisateur (ou e-mail) et votre mot de passe.",
      validEmailErr: 'Veuillez saisir une adresse e-mail valide.',
      passMismatchErr: 'Les mots de passe ne correspondent pas.',
      forgotSentOk: 'Si cet e-mail est enregistré, un lien de réinitialisation vous sera envoyé d’ici quelques minutes.',
      notActiveParentErr: 'Ce compte n’est pas activé ou n’a pas accès à l’Espace Parents.',
      btnLinkCode: 'Lier un enfant par code',
      enterCodePrompt: 'Saisissez le code d’inscription secret (ex: DI-A1B2C3) :',
      codePlaceholder: 'DI-XXXXXX',
      btnConfirmLink: 'Confirmer',
      btnCancel: 'Annuler',
      codeEmptyErr: 'Veuillez saisir un code valide.',
      linkSuccess: 'Dossier de l’enfant lié avec succès !'
    }
  };

  function t(k) {
    return (I18N[LANG] && I18N[LANG][k]) || (I18N.ar && I18N.ar[k]) || k;
  }

  function applyLang() {
    var isFr = (LANG === 'fr');
    document.documentElement.dir = isFr ? 'ltr' : 'rtl';
    document.documentElement.lang = LANG;

    var btnLogin = $('#loginLangBtn'); if (btnLogin) btnLogin.textContent = t('langBtnLogin');
    var btnBar = $('#barLangBtn'); if (btnBar) btnBar.textContent = t('langBtnBar');

    var bt = $('#barTitle'); if (bt) bt.textContent = t('brand');
    var lt = $('#lTitle'); if (lt) lt.textContent = mode === 'set' ? t('titleSet') : mode === 'forgot' ? t('titleForgot') : t('titleLogin');
    var lh = $('#lHint'); if (lh && !lh.dataset.custom) lh.textContent = mode === 'set' ? t('hintSet') : mode === 'forgot' ? t('hintForgot') : t('hintLogin');
    var em = $('#lblEmail'); if (em) em.textContent = t('loginIdLabel');
    var pw = $('#lblPassword'); if (pw) pw.textContent = t('passLabel');
    var fe = $('#lblFEmail'); if (fe) fe.textContent = t('emailLabel');
    var np1 = $('#lblNp1'); if (np1) np1.textContent = t('newPassLabel');
    var np2 = $('#lblNp2'); if (np2) np2.textContent = t('confirmPassLabel');
    var nh = $('#npHint'); if (nh) nh.textContent = t('passRule');
    var lb = $('#lBtn'); if (lb) lb.textContent = mode === 'login' ? t('btnLogin') : mode === 'forgot' ? t('btnForgotSend') : t('btnSetSave');
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

  function show(id) { ['boot', 'login', 'app'].forEach(function (x) { $('#' + x).hidden = x !== id; }); }
  function setMsg(el, m) { el.textContent = m || ''; el.hidden = !m; }

  function lockBtn(btn, fn) {
    if (btn.disabled) return Promise.resolve();
    btn.disabled = true;
    return Promise.resolve().then(fn).then(function (r) { btn.disabled = false; return r; }, function (e) { btn.disabled = false; throw e; });
  }

  function openModal(card) {
    var m = $('#modal'), c = $('#modalCard');
    if (!m || !c) return;
    var wasHidden = m.hidden;
    c.textContent = ''; c.appendChild(card); m.hidden = false; document.body.style.overflow = 'hidden';
    if (wasHidden) {
      try { window.history.pushState({ deParent: true, tab: S.tab, modal: true }, ''); } catch (e) {}
    }
    var first = c.querySelector('input,select,textarea,button'); if (first) first.focus();
  }
  function closeModal() {
    var m = $('#modal'), c = $('#modalCard');
    if (m) m.hidden = true;
    if (c) c.textContent = '';
    document.body.style.overflow = '';
  }

  /* ---------- الدخول / الاستعادة ---------- */
  var mode = 'login';

  function setMode(m, customHint) {
    mode = m;
    $('#stCreds').hidden = m !== 'login';
    $('#stForgot').hidden = m !== 'forgot';
    $('#stSet').hidden = m !== 'set';
    $('#forgotBtn').hidden = m !== 'login';
    $('#backBtn').hidden = (m === 'login' || m === 'set');

    $('#lBtn').textContent = m === 'login' ? t('btnLogin') : m === 'forgot' ? t('btnForgotSend') : t('btnSetSave');
    $('#lTitle').textContent = m === 'set' ? t('titleSet') : m === 'forgot' ? t('titleForgot') : t('titleLogin');

    var hintEl = $('#lHint');
    if (customHint) {
      hintEl.textContent = customHint;
      hintEl.dataset.custom = '1';
    } else {
      delete hintEl.dataset.custom;
      hintEl.textContent = m === 'login' ? t('hintLogin') : m === 'forgot' ? t('hintForgot') : t('hintSet');
    }
    setMsg($('#lErr'), ''); setMsg($('#lOk'), '');
  }

  function showLogin(msg) {
    stopIdle && stopIdle();
    show('login');
    setMode('login');
    setMsg($('#lErr'), msg);
  }

  async function submitLogin(e) {
    e.preventDefault(); setMsg($('#lErr'), ''); setMsg($('#lOk'), '');
    await lockBtn($('#lBtn'), async function () {
      try {
        if (mode === 'login') {
          var em = DE.clean($('#email').value, 254).toLowerCase(), pw = String($('#password').value || '').trim();
          if (/^[a-z0-9._-]{3,30}$/.test(em)) em = em + '@parents.darelihsan.invalid';
          else if (!DE.isEmail(em)) return setMsg($('#lErr'), t('enterCredsErr'));
          if (!pw || pw.length > 72) return setMsg($('#lErr'), t('enterCredsErr'));
          await C.signIn(em, pw);
          try { sessionStorage.setItem('de_parent_user', DE.clean($('#email').value, 254).toLowerCase()); } catch (e2) {}
          $('#password').value = '';
          await enter();
        } else if (mode === 'forgot') {
          var fe = DE.clean($('#fEmail').value, 254).toLowerCase();
          if (!DE.isEmail(fe)) return setMsg($('#lErr'), t('validEmailErr'));
          try { await C.recover(fe, location.origin + location.pathname); }
          catch (er) { if (er.status === 429) throw er; }
          setMsg($('#lOk'), t('forgotSentOk'));
        } else {
          var a = String($('#np1').value || '').trim(), b = String($('#np2').value || '').trim();
          if (DE.pwProblem(a)) return setMsg($('#lErr'), DE.PW_MSG);
          if (a !== b) return setMsg($('#lErr'), t('passMismatchErr'));
          await C.setPassword(a);
          $('#np1').value = $('#np2').value = '';
          await enter();
        }
      } catch (er) { setMsg($('#lErr'), er.message); }
    });
  }

  /* ---------- تحميل البيانات (عبر RLS الصارم) ---------- */
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

      var fetchKidsResilient = async function () {
        try {
          var k1 = await q('/children?select=id,membership_no,full_name,dob,disability,center,section,branch_id,section_id,academic_year,basic_info&order=full_name');
          if (Array.isArray(k1) && k1.length) return k1;
        } catch (e1) {
          try {
            var k2 = await q('/children?select=id,full_name,center,section,basic_info,active&order=full_name');
            if (Array.isArray(k2) && k2.length) return k2;
          } catch (e2) {}
        }
        try {
          var linked = await C.rpc('ensure_parent_child_link');
          if (linked) {
            var k3 = await q('/children?select=id,membership_no,full_name,dob,disability,center,section,branch_id,section_id,academic_year,basic_info&order=full_name').catch(function () {
              return q('/children?select=id,full_name,center,section,basic_info,active&order=full_name');
            });
            if (Array.isArray(k3)) return k3;
          }
        } catch (e3) {}
        return [];
      };

      var r = await Promise.all([
        q('/parent_profiles?select=full_name&limit=1').catch(function () { return []; }),
        fetchKidsResilient(),
        q('/progress_reports?select=id,child_id,title,report_date,period_start,period_end,achievements,activities,notes,attachment_path&order=report_date.desc').catch(function () { return []; }),
        q('/appointments?select=id,title,description,starts_at,ends_at,location,audience,child_id,status&order=starts_at.asc').catch(function () { return []; }),
        q('/messages?select=id,kind,title,body,published_at&order=published_at.desc').catch(function () { return []; }),
        q('/message_reads?select=message_id').catch(function () { return []; }),
        q('/documents?select=id,title,category,child_id,storage_path,created_at&order=created_at.desc').catch(function () { return []; }),
        q('/educational_programs?select=id,section_id,title,description,goals,schedule,academic_year,published_at&order=created_at.desc').catch(function () { return []; }),
        q('/sections?select=id,name').catch(function () { return []; })
      ]);

      var mergedReports = (r[2] || []).slice();

      S.name = (r[0][0] && r[0][0].full_name) || '';
      S.d = {
        children: r[1],
        reports: mergedReports,
        appts: r[3],
        msgs: r[4],
        docs: r[6],
        programs: r[7] || [],
        sections: r[8] || []
      };
      S.reads = {}; r[5].forEach(function (x) { S.reads[x.message_id] = true; });

      if (S.d.children.length && !S.selectedChildId) {
        S.selectedChildId = S.d.children[0].id;
      }

      show('app');
      applyLang();
      $('#who').textContent = S.name || t('whoDefault');
      var spName = $('#sideParentName');
      if (spName) spName.textContent = S.name || t('whoDefault');
      var spEmail = $('#sideParentEmail');
      if (spEmail && S.me) spEmail.textContent = (me && me.email) || '';
      toast(t('welcome') + (S.name ? ' ' + S.name : '') + t('welcomeSuffix'), 'ok');

      stopIdle && stopIdle();
      stopIdle = DE.idle(30 * 60 * 1000, function () { logout(t('logoutPrompt')); });
      S.tabStack = [];
      try {
        window.history.replaceState({ deParentGuard: true, deParent: true, tab: S.tab }, '');
        window.history.pushState({ deParent: true, tab: S.tab }, '');
      } catch (e) {}
      render();

      var params = new URLSearchParams(window.location.search);
      if (params.get('child')) {
        openRedeemModal();
      }
    } catch (er) { showLogin(er.message); }
  }

  async function logout(msg) {
    await C.signOut();
    S = { tab: 'children', me: null, name: '', d: null, reads: {}, selectedChildId: null };
    showLogin(msg);
  }

  /* ---------- العرض والتنقل ---------- */
  var TABS = [
    ['children', 'tabChildren', 'i-child'],
    ['programs', 'tabPrograms', 'i-book'],
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

  function isFarmOnlyParent() {
    var kids = (S.d && S.d.children) || [];
    if (!kids.length) return false;
    return kids.every(function (c) {
      return c.center === 'farm' || String(c.section || '').indexOf('البستنة') >= 0 || String(c.section || '').indexOf('المزرعة') >= 0;
    });
  }

  function renderTabs() {
    var nav = $('#tabs'); nav.textContent = '';
    var hideReports = isFarmOnlyParent();
    if (hideReports && S.tab === 'reports') S.tab = 'children';
    TABS.forEach(function (tb) {
      if (hideReports && tb[0] === 'reports') return;
      var b = h('button', {
        type: 'button',
        role: 'tab',
        'aria-selected': S.tab === tb[0] ? 'true' : 'false',
        onclick: function () {
          document.body.classList.remove('nav-toggled');
          if (S.tab !== tb[0]) {
            S.tabStack.push(S.tab);
            if (S.tabStack.length > 20) S.tabStack.shift();
            S.tab = tb[0];
            try { window.history.pushState({ deParent: true, tab: S.tab }, ''); } catch (e) {}
          }
          render();
          window.scrollTo(0, 0);
        }
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

  function openRedeemModal() {
    var codeInput = h('input', { type: 'text', class: 'code-input', placeholder: t('codePlaceholder'), maxlength: 20, dir: 'ltr' });
    var errEl = h('p', { class: 'err', role: 'alert' }); errEl.hidden = true;
    var confirmBtn = h('button', { class: 'btn gold', type: 'button', text: t('btnConfirmLink') });

    confirmBtn.addEventListener('click', async function () {
      var val = DE.clean(codeInput.value, 30).trim().toUpperCase();
      if (!val) { errEl.textContent = t('codeEmptyErr'); errEl.hidden = false; return; }
      lockBtn(confirmBtn, async function () {
        try {
          var res = await C.rpc('redeem_registration_code', { p_code: val });
          closeModal();
          toast(t('linkSuccess') + (res && res.child_name ? ' (' + res.child_name + ')' : ''), 'ok');
          await enter();
        } catch (e) {
          errEl.textContent = e.message || 'رمز التسجيل غير صالح أو مستخدم مسبقاً.';
          errEl.hidden = false;
        }
      });
    });

    var card = h('div', { class: 'modal-body' },
      h('h2', { text: t('btnLinkCode') }),
      h('p', { text: t('enterCodePrompt') }),
      h('label', { class: 'fld' }, codeInput),
      errEl,
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn light', type: 'button', text: t('btnCancel'), onclick: closeModal }),
        confirmBtn
      )
    );
    openModal(card);
  }

  /* تبويب أبنائي */
  function vChildren(v) {
    var topRow = h('div', { class: 'bar-sub' },
      h('h2', { text: t('tabChildren') })
    );
    v.appendChild(topRow);

    if (!S.d.children.length) return v.appendChild(empty(t('emptyChildren')));

    S.d.children.forEach(function (c) {
      var centerLabel = t('center_' + c.center) || c.center;
      var card = h('div', { class: 'card child-card' },
        h('div', { class: 'child-card-header' },
          h('div', { class: 'child-card-name' },
            h('h2', { text: c.full_name }),
            h('span', { class: 'child-center-tag', text: centerLabel })
          ),
          c.membership_no ? h('span', { class: 'sic-num', text: 'N° ' + c.membership_no }) : null
        ),
        h('div', { class: 'child-details' }, [
          c.section ? ['الفوج / القسم', c.section] : null,
          c.dob ? ['تاريخ الميلاد', fmtDate(c.dob)] : null,
          c.disability ? ['طبيعة الإعاقة', c.disability] : null,
          ['الموسم الدراسي', c.academic_year ? c.academic_year.replace('-', '–') : currentAcademicYear('–')]
        ].filter(Boolean).map(function (it) {
          return h('div', { class: 'cd-item' }, h('span', { text: it[0] }), h('b', { text: it[1] }));
        }))
      );

      if (c.basic_info) {
        card.appendChild(h('div', { class: 'cd-item wide' },
          h('span', { text: t('basicInfoTitle') }),
          h('b', { text: c.basic_info })
        ));
      } else {
        card.appendChild(h('p', { class: 'muted small', text: t('noExtraInfo') }));
      }
      v.appendChild(card);
    });
  }

  /* تبويب البرامج التربوية للأقسام — عرض البرنامج الأسبوعي للأولياء على شكل صورة أفقية يدخل فيها الولي ويرى كل البرنامج */
  var WEEK_DAYS_PARENT = [
    { key: 'sun', label: 'الأحد' },
    { key: 'mon', label: 'الإثنين' },
    { key: 'tue', label: 'الثلاثاء' },
    { key: 'wed', label: 'الأربعاء' },
    { key: 'thu', label: 'الخميس' }
  ];

  var PARENT_DOMAIN_KEYS = Object.keys(EMBEDDED_CURRICULUM);

  function formatParentTimeRange(start, end) {
    var s = String(start || '').trim();
    var e = String(end || '').trim();
    if (s && e) return 'من ' + s + ' إلى ' + e;
    if (s) return 'من ' + s;
    if (e) return 'إلى ' + e;
    return '';
  }

  function formatParentShortTime(start, end) {
    var s = String(start || '').trim();
    var e = String(end || '').trim();
    if (s && e) return s + ' ⟵ ' + e;
    if (s) return s;
    if (e) return e;
    return '';
  }

  function isParentSessionActive(s) {
    if (!s) return false;
    if (s.kind === 'break') return !!(s.title || s.start || s.end || (s.items && s.items.length));
    return !!((s.items && s.items.length) || s.title || s.start || s.end);
  }

  function resolveSectionName(p, rawSched) {
    if (Array.isArray(rawSched) && rawSched[0] && rawSched[0].section_name) {
      return rawSched[0].section_name;
    }
    var secs = (S.d && S.d.sections) || [];
    var foundSec = secs.filter(function (s) { return s.id === p.section_id; })[0];
    if (foundSec && foundSec.name) return foundSec.name;
    var kids = (S.d && S.d.children) || [];
    var foundKid = kids.filter(function (c) { return c.section_id === p.section_id && c.section; })[0] || kids[0];
    if (foundKid && foundKid.section) return foundKid.section;
    return 'الفوج التربوي';
  }

  function buildParentUnifiedCols(rawSched) {
    var maxCols = 0;
    WEEK_DAYS_PARENT.forEach(function (wd) {
      var dy = Array.isArray(rawSched) ? rawSched.filter(function (d) { return d && (d.day === wd.key || d.label === wd.label || (wd.key === 'mon' && d.label === 'الاثنين')); })[0] : null;
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

      WEEK_DAYS_PARENT.forEach(function (wd) {
        var dy = Array.isArray(rawSched) ? rawSched.filter(function (d) { return d && (d.day === wd.key || d.label === wd.label || (wd.key === 'mon' && d.label === 'الاثنين')); })[0] : null;
        var s = dy && dy.sessions ? dy.sessions[c] : null;
        if (!s) return;
        if (isParentSessionActive(s)) anyActive = true;
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

  function wrapParentCanvasLines(ctx, text, maxWidth) {
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

  function buildParentProgramCanvasDataUrl(p, cb) {
    var rawSched = null;
    if (p && p.schedule) {
      try {
        rawSched = typeof p.schedule === 'string' ? JSON.parse(p.schedule) : p.schedule;
      } catch (e) { rawSched = null; }
    }
    var secName = resolveSectionName(p, rawSched);
    var acYear = (p && p.academic_year) || (Array.isArray(rawSched) && rawSched[0] && rawSched[0].academic_year) || currentAcademicYear('/');
    var domainsList = (Array.isArray(rawSched) && rawSched[0] && Array.isArray(rawSched[0].domains)) ? rawSched[0].domains : [];
    var activeDomains = domainsList.filter(function (dm) { return dm && dm.domain; });

    var canvas = document.createElement('canvas');
    var W = 1600;
    var stripH = activeDomains.length ? 92 : 0;
    var unifiedCols = buildParentUnifiedCols(rawSched);
    var numCols = unifiedCols.length;

    var rowHeights = WEEK_DAYS_PARENT.map(function (wd) {
      var dy = Array.isArray(rawSched) ? rawSched.filter(function (d) { return d && (d.day === wd.key || d.label === wd.label || (wd.key === 'mon' && d.label === 'الاثنين')); })[0] : null;
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

      // 1. الترويسة الرسمية
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(14, 14, W - 28, 140);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 20px Cairo, Tajawal, sans-serif';
      ctx.fillText('الموسم الدراسي: ' + acYear, W - 36, 58);
      ctx.fillText('الفوج / القسم: ' + secName, W - 36, 98);

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

      // إطار الفترات + صف التوقيت الواضح تحته مباشرة
      var dayColW = 148;
      var sessColW = W - 56 - dayColW;
      var colW = sessColW / numCols;

      var midBreakIdx = -1;
      for (var bIdx = 1; bIdx < numCols - 1; bIdx++) {
        if (unifiedCols[bIdx].isBreak && (unifiedCols[bIdx].label.indexOf('فسحة') >= 0 || unifiedCols[bIdx].label.indexOf('استراحة') >= 0 || bIdx === Math.floor(numCols / 2))) {
          midBreakIdx = bIdx;
          break;
        }
      }

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

      // صف التوقيت الواضح تحت إطار الفترات مباشرة
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

        ctx.fillStyle = col.isBreak ? '#4C1D95' : '#0C2D55';
        ctx.font = 'bold 14px Cairo, Tajawal, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(col.label.slice(0, 28), cx + colW / 2, y + 22);

        var pillX = cx + 8;
        var pillY = y + 30;
        var pillW = colW - 16;
        var pillH = 31;
        ctx.fillStyle = col.isBreak ? '#FAF5FF' : '#FFFFFF';
        ctx.fillRect(pillX, pillY, pillW, pillH);
        ctx.strokeStyle = col.isBreak ? '#9333EA' : '#0284C7';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(pillX, pillY, pillW, pillH);

        var timeTxt = formatParentTimeRange(col.start, col.end) || 'التوقيت يدوي';
        ctx.fillStyle = col.isBreak ? '#581C87' : '#0F172A';
        ctx.font = '900 15px Cairo, Tajawal, sans-serif';
        ctx.fillText('' + timeTxt, cx + colW / 2, pillY + 21);
      });

      y += timeHeaderH;

      WEEK_DAYS_PARENT.forEach(function (wd, idx) {
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

        var dy = Array.isArray(rawSched) ? rawSched.filter(function (d) { return d && (d.day === wd.key || d.label === wd.label || (wd.key === 'mon' && d.label === 'الاثنين')); })[0] : null;
        var sessArr = (dy && dy.sessions) ? dy.sessions : [];

        unifiedCols.forEach(function (col, cIdx) {
          var sx = 28 + sessColW - (cIdx + 1) * colW;
          var sess = sessArr[col.colIndex];

          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 1.1;
          ctx.strokeRect(sx, y, colW, rh);

          if (!sess || !isParentSessionActive(sess)) {
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
            customTime = formatParentShortTime(sess.start, sess.end);
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
              var domIdx = Math.max(0, PARENT_DOMAIN_KEYS.indexOf(it.domain)) % palette.length;
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
              var skillLines = wrapParentCanvasLines(ctx, '' + (it.skill || ''), colW - 22);
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

      cb(canvas.toDataURL('image/png'), secName);
    }

    var im = new Image();
    im.onload = function () { drawAll(im); };
    im.onerror = function () { drawAll(null); };
    im.src = 'logo-sq.png';
  }

  function openParentProgramImageViewer(p) {
    var imgEl = h('img', { class: 'wk-zoom-img', alt: 'البرنامج الأسبوعي' });
    var zoomContainer = h('div', { class: 'wk-zoom-container' }, imgEl);
    var currentDataUrl = '';
    var currentSecName = 'القسم';
    var zoomed = false;

    buildParentProgramCanvasDataUrl(p, function (dataUrl, sName) {
      currentDataUrl = dataUrl;
      currentSecName = sName;
      imgEl.src = dataUrl;
    });

    imgEl.addEventListener('click', function () {
      zoomed = !zoomed;
      imgEl.className = zoomed ? 'wk-zoom-img is-zoomed' : 'wk-zoom-img';
    });

    openModal(h('div', { class: 'modal-body wk-modal-print' },
      h('div', { class: 'bar-sub no-print' },
        h('h2', { text: 'صورة البرنامج الأسبوعي الكاملة' }),
        h('div', { class: 'row-actions' },
          h('button', {
            type: 'button',
            class: 'btn small light',
            text: 'تكبير / تصغير الصورة',
            onclick: function () {
              zoomed = !zoomed;
              imgEl.className = zoomed ? 'wk-zoom-img is-zoomed' : 'wk-zoom-img';
            }
          })
        )
      ),
      h('p', { class: 'muted small no-print', text: 'اضغط على الصورة لتكبيرها وتحريكها يمينًا ويسارًا، أو حمّلها على هاتفك:' }),
      zoomContainer,
      h('div', { class: 'modal-actions no-print' },
        h('button', { class: 'btn light', type: 'button', text: 'إغلاق', onclick: closeModal }),
        h('button', {
          class: 'btn gold',
          type: 'button',
          text: 'تحميل صورة البرنامج (PNG)',
          onclick: function () {
            if (!currentDataUrl) return;
            var a = document.createElement('a');
            a.download = 'البرنامج_الأسبوعي_' + String(currentSecName).replace(/\s+/g, '_') + '.png';
            a.href = currentDataUrl;
            a.click();
          }
        }),
        h('button', { class: 'btn', type: 'button', text: 'طباعة', onclick: function () { window.print(); } })
      )
    ));
  }

  function renderParentWeeklySheet(p) {
    var rawSched = null;
    if (p && p.schedule) {
      try {
        rawSched = typeof p.schedule === 'string' ? JSON.parse(p.schedule) : p.schedule;
      } catch (e) { rawSched = null; }
    }
    var secName = resolveSectionName(p, rawSched);
    var acYear = (p && p.academic_year) || (Array.isArray(rawSched) && rawSched[0] && rawSched[0].academic_year) || currentAcademicYear('/');

    var imgEl = h('img', {
      class: 'wk-program-img',
      alt: 'صورة البرنامج الأسبوعي — ' + secName,
      title: 'اضغط لفتح وتكبير صورة البرنامج الأسبوعي',
      onclick: function () { openParentProgramImageViewer(p); }
    });

    var currentDataUrl = '';
    buildParentProgramCanvasDataUrl(p, function (dataUrl) {
      currentDataUrl = dataUrl;
      imgEl.src = dataUrl;
    });

    var openBtn = h('button', {
      type: 'button',
      class: 'btn small gold',
      text: 'فتح وتكبير صورة البرنامج كاملة',
      onclick: function () { openParentProgramImageViewer(p); }
    });

    var dlBtn = h('button', {
      type: 'button',
      class: 'btn small light',
      text: 'حفظ الصورة في الهاتف',
      onclick: function () {
        if (!currentDataUrl) return;
        var a = document.createElement('a');
        a.download = 'البرنامج_الأسبوعي_' + String(secName).replace(/\s+/g, '_') + '.png';
        a.href = currentDataUrl;
        a.click();
      }
    });

    return h('div', { class: 'card wk-parent-card' },
      h('div', { class: 'bar-sub' },
        h('div', null,
          h('h2', { text: 'البرنامج الأسبوعي — ' + secName }),
          h('span', { class: 'muted small', text: 'الموسم الدراسي: ' + acYear + ' — اضغط على الصورة لتكبيرها ورؤية كل البرنامج بوضوح' })
        ),
        h('div', { class: 'row-actions no-print' }, openBtn, dlBtn)
      ),
      h('div', { class: 'wk-img-card-wrap' }, imgEl)
    );
  }

  function getBuiltInTamhinDemo(secId, secName) {
    var cleanDomains = [
      { domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skills: ['غسل اليدين بالماء والصابون بشكل صحيح', 'لبس المئزر بشكل صحيح', 'مسك أدوات الطعام بشكل صحيح'] },
      { domain: 'مجال المهارات الحركية الدقيقة', skills: ['مسك المقص بشكل صحيح', 'قص الورقة على خطوط مستقيمة عريضة', 'ترتيب مجموعة من الأوراق فوق بعضها'] },
      { domain: 'مجال المهارات الحركية الكبرى', skills: ['المشي بطريقة صحيحة', 'دفع جهاز متحرك لمسافة 2 م بطريقة صحيحة'] },
      { domain: 'مجال مهارات الحضور والانتباه', skills: ['الاتصال البصري أثناء التعليم الجماعي', 'الاستجابة للتعليمات اللفظية (أمران متسلسلان)'] },
      { domain: 'مجال التواصل', skills: ['يسمي الأشياء المألوفة في البيئة', 'يستجيب للأوامر المتسلسلة (أكثر من أمر)'] }
    ];
    var notesTxt = 'برنامج أسبوعي معتمد لقسم التمهين (مركز المساعدة على العمل) — يشمل الفترات الصباحية والمسائية والحصص البينية.';
    var days = [
      { day: 'sun', label: 'الأحد', sessions: [
        { kind: 'break', title: 'الاعتماد على الذات', start: '08:00', end: '09:00', items: [{ domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skill: 'لبس المئزر بشكل صحيح' }] },
        { kind: 'session', title: 'ورشة التأهيل المهني الأولي', start: '09:00', end: '10:30', items: [{ domain: 'مجال المهارات الحركية الدقيقة', skill: 'مسك المقص بشكل صحيح' }, { domain: 'مجال مهارات الحضور والانتباه', skill: 'الاتصال البصري أثناء التعليم الجماعي' }] },
        { kind: 'break', title: 'فسحة', start: '10:30', end: '11:00', items: [] },
        { kind: 'session', title: 'تنمية المهارات العملية', start: '12:00', end: '13:40', items: [{ domain: 'مجال التواصل', skill: 'يستجيب للأوامر المتسلسلة (أكثر من أمر)' }] },
        { kind: 'break', title: 'التحضير للخروج', start: '13:40', end: '14:00', items: [] }
      ]},
      { day: 'mon', label: 'الإثنين', sessions: [
        { kind: 'break', title: 'الاعتماد على الذات', start: '08:00', end: '09:00', items: [{ domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skill: 'غسل اليدين بالماء والصابون بشكل صحيح' }] },
        { kind: 'session', title: 'نشاط الفرز والترتيب المهني', start: '09:00', end: '10:30', items: [{ domain: 'مجال المهارات الحركية الدقيقة', skill: 'ترتيب مجموعة من الأوراق فوق بعضها' }] },
        { kind: 'break', title: 'فسحة', start: '10:30', end: '11:00', items: [] },
        { kind: 'session', title: 'ورشة القص والتشكيل', start: '12:00', end: '13:40', items: [{ domain: 'مجال المهارات الحركية الدقيقة', skill: 'قص الورقة على خطوط مستقيمة عريضة' }] },
        { kind: 'break', title: 'التحضير للخروج', start: '13:40', end: '14:00', items: [] }
      ]},
      { day: 'tue', label: 'الثلاثاء', sessions: [
        { kind: 'break', title: 'الاعتماد على الذات', start: '08:00', end: '09:00', items: [] },
        { kind: 'session', title: 'رياضة وتوافق حركي مهني', start: '09:00', end: '10:30', items: [{ domain: 'مجال المهارات الحركية الكبرى', skill: 'دفع جهاز متحرك لمسافة 2 م بطريقة صحيحة' }] },
        { kind: 'break', title: 'فسحة', start: '10:30', end: '11:00', items: [] },
        { kind: 'session', title: 'تواصل وتفاعل اجتماعي بالورشة', start: '12:00', end: '13:40', items: [{ domain: 'مجال التواصل', skill: 'يسمي الأشياء المألوفة في البيئة' }] },
        { kind: 'break', title: 'التحضير للخروج', start: '13:40', end: '14:00', items: [] }
      ]},
      { day: 'wed', label: 'الأربعاء', sessions: [
        { kind: 'break', title: 'الاعتماد على الذات', start: '08:00', end: '09:00', items: [] },
        { kind: 'session', title: 'ورشة التمهين التطبيقي', start: '09:00', end: '10:30', items: [{ domain: 'مجال مهارات الحضور والانتباه', skill: 'الاستجابة للتعليمات اللفظية (أمران متسلسلان)' }, { domain: 'مجال المهارات الحركية الدقيقة', skill: 'مسك المقص بشكل صحيح' }] },
        { kind: 'break', title: 'فسحة', start: '10:30', end: '11:00', items: [] },
        { kind: 'session', title: 'استقلالية الحياة اليومية', start: '12:00', end: '13:40', items: [{ domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skill: 'مسك أدوات الطعام بشكل صحيح' }] },
        { kind: 'break', title: 'التحضير للخروج', start: '13:40', end: '14:00', items: [] }
      ]},
      { day: 'thu', label: 'الخميس', sessions: [
        { kind: 'break', title: 'الاعتماد على الذات', start: '08:00', end: '09:00', items: [] },
        { kind: 'session', title: 'تقييم أسبوعي للمهارات المهنية', start: '09:00', end: '10:30', items: [{ domain: 'مجال المهارات الحركية الدقيقة', skill: 'ترتيب مجموعة من الأوراق فوق بعضها' }, { domain: 'مجال التواصل', skill: 'يستجيب للأوامر المتسلسلة (أكثر من أمر)' }] },
        { kind: 'break', title: 'فسحة', start: '10:30', end: '11:00', items: [] },
        { kind: 'session', title: 'أنشطة جماعية ومراجعة', start: '12:00', end: '13:40', items: [{ domain: 'مجال المهارات الحركية الكبرى', skill: 'المشي بطريقة صحيحة' }] },
        { kind: 'break', title: 'التحضير للخروج', start: '13:40', end: '14:00', items: [] }
      ]}
    ];
    return {
      id: 'demo-tamhin',
      section_id: secId || '',
      title: 'البرنامج الأسبوعي — ' + (secName || 'التمهين م م ع'),
      academic_year: currentAcademicYear('/'),
      published_at: new Date().toISOString(),
      schedule: days.map(function (dy) {
        return {
          day: dy.day,
          label: dy.label,
          section_name: secName || 'التمهين م م ع',
          academic_year: currentAcademicYear('/'),
          notes: notesTxt,
          domains: cleanDomains,
          sessions: dy.sessions
        };
      })
    };
  }

  function vPrograms(v) {
    v.appendChild(h('div', { class: 'bar-sub' }, h('h2', { text: t('tabPrograms') })));
    var progList = (S.d && S.d.programs ? S.d.programs.slice() : []);
    if (!progList.length) {
      var kids = (S.d && S.d.children) || [];
      var tamhinKid = kids.filter(function (c) {
        return (c.section && c.section.indexOf('التمهين') >= 0) || c.center === 'work';
      })[0];
      if (tamhinKid) {
        progList.push(getBuiltInTamhinDemo(tamhinKid.section_id, tamhinKid.section || 'التمهين م م ع'));
      }
    }
    if (!progList.length) return v.appendChild(empty(t('emptyPrograms')));

    progList.forEach(function (p) {
      v.appendChild(renderParentWeeklySheet(p));
    });
  }

  /* تبويب التقارير التربوية واستمارات التقييم البيداغوجي */
  var EVAL_MARKER = '/*DE_EVAL_V1*/';

  function isEvalReport(r) {
    return r && typeof r.activities === 'string' && r.activities.indexOf(EVAL_MARKER) === 0;
  }

  function buildParentEvalTable(r) {
    var domainKeys = Object.keys(EMBEDDED_CURRICULUM);
    var parsedDomains = [];
    try {
      var raw = JSON.parse(r.activities.slice(EVAL_MARKER.length));
      if (raw && Array.isArray(raw.domains)) {
        parsedDomains = raw.domains.map(function (dm) {
          var domName = typeof dm.d === 'number' ? (domainKeys[dm.d] || domainKeys[0]) : (dm.domain || domainKeys[0]);
          var skList = EMBEDDED_CURRICULUM[domName] || [];
          var rMap = {};
          (dm.r || []).forEach(function (entry) {
            rMap[entry[0]] = { score: entry[1] != null ? String(entry[1]) : '', yn: entry[2] || '', note: entry[3] || '' };
          });
          return {
            domain: domName,
            ratings: skList.map(function (sk, idx) {
              var sv = rMap[idx] || {};
              return { num: idx + 1, skill: sk, score: sv.score || '', yn: sv.yn || '', note: sv.note || '' };
            })
          };
        });
      }
    } catch (e) {}

    return h('div', { class: 'eval-parent-wrap' },
      parsedDomains.map(function (dm) {
        var isComm = dm.domain.indexOf('التواصل') >= 0;
        var thead = h('thead', null,
          h('tr', { class: 'eval-dom-banner-row' },
            h('th', { colspan: isComm ? '10' : '8', class: 'eval-dom-banner-th', text: '' + dm.domain })
          ),
          h('tr', { class: 'eval-col-hdr-row' },
            h('th', { class: 'eval-col-num', text: 'الرقم' }),
            h('th', { class: 'eval-col-skill', text: 'المجال والمهارات' }),
            isComm ? h('th', { class: 'eval-col-yn', text: 'نعم' }) : null,
            isComm ? h('th', { class: 'eval-col-yn', text: 'لا' }) : null,
            h('th', { class: 'eval-col-sc', text: '1' }),
            h('th', { class: 'eval-col-sc', text: '2' }),
            h('th', { class: 'eval-col-sc', text: '3' }),
            h('th', { class: 'eval-col-sc', text: '4' }),
            h('th', { class: 'eval-col-sc', text: '5' }),
            h('th', { class: 'eval-col-deg', text: 'الدرجة' }),
            h('th', { class: 'eval-col-note', text: 'ملاحظات' })
          )
        );
        var tbody = h('tbody');
        dm.ratings.forEach(function (it) {
          tbody.appendChild(h('tr', { class: (it.score || it.yn) ? 'eval-row-rated' : '' },
            h('td', { class: 'eval-col-num', text: String(it.num) }),
            h('td', { class: 'eval-col-skill', text: it.skill }),
            isComm ? h('td', { class: 'eval-col-yn' + (it.yn === 'نعم' ? ' eval-cell-checked' : ''), text: it.yn === 'نعم' ? '' : '' }) : null,
            isComm ? h('td', { class: 'eval-col-yn' + (it.yn === 'لا' ? ' eval-cell-checked' : ''), text: it.yn === 'لا' ? '' : '' }) : null,
            ['1', '2', '3', '4', '5'].map(function (g) {
              var active = String(it.score) === g;
              return h('td', { class: 'eval-col-sc' + (active ? ' eval-cell-checked' : ''), text: active ? '' : '' });
            }),
            h('td', { class: 'eval-col-deg' }, h('strong', { text: it.score ? (it.score + ' / 5') : (it.yn || '—') })),
            h('td', { class: 'eval-col-note', text: it.note || '—' })
          ));
        });
        return h('div', { class: 'eval-table-wrap' }, h('table', { class: 'eval-official-table' }, thead, tbody));
      })
    );
  }

  function vReports(v) {
    if (!S.d.reports.length) return v.appendChild(empty(t('emptyReports')));
    S.d.reports.forEach(function (r) {
      var isEv = isEvalReport(r);
      var card = h('div', { class: 'card' },
        h('div', { class: 'bar-sub' },
          h('h2', { text: (isEv ? '' : '') + r.title }),
          h('span', { class: 'badge ' + (isEv ? 'gold' : 'ok'), text: isEv ? 'استمارة تقييم بيداغوجي' : 'تقرير دوري' })
        ),
        h('div', { class: 'meta' },
          h('span', { text: childName(r.child_id) }),
          h('span', { text: t('datePrefix') + fmtDate(r.report_date) })
        )
      );

      if (isEv) {
        if (r.achievements) {
          card.appendChild(h('div', { class: 'wk-sheet-notes' },
            h('strong', { text: 'ملخص المجالات المقيمة: ' }),
            h('p', { class: 'txt pre', text: r.achievements })
          ));
        }
        card.appendChild(buildParentEvalTable(r));
        if (r.notes) {
          card.appendChild(h('div', { class: 'wk-sheet-notes' },
            h('strong', { text: t('notes') + ': ' }),
            h('span', { text: r.notes })
          ));
        }
      } else {
        [[t('achievements'), r.achievements], [t('activities'), r.activities], [t('notes'), r.notes]].forEach(function (p) {
          if (p[1]) card.appendChild(h('div', null, h('h3', { text: p[0] }), h('p', { class: 'txt', text: p[1] })));
        });
      }

      if (r.attachment_path) {
        card.appendChild(h('div', { class: 'row-actions' }, fileBtn(r.attachment_path, t('openAttachment'))));
      }
      v.appendChild(card);
    });
  }

  /* تبويب المواعيد والأنشطة */
  function apptCard(a) {
    var isPast = new Date(a.starts_at) < new Date();
    var isCancelled = (a.status === 'cancelled');
    var badgeKind = isCancelled ? 'bad' : isPast ? 'gray' : 'ok';
    var badgeTxt = isCancelled ? t('cancelled') : t('scheduled');

    var card = h('div', { class: 'card' },
      h('h2', { text: a.title }),
      h('div', { class: 'meta' },
        h('span', { text: fmtDate(a.starts_at, true) }),
        a.location ? h('span', { text: a.location }) : null,
        h('span', { class: 'badge ' + badgeKind, text: badgeTxt }),
        h('span', { text: a.audience === 'all' ? t('forAll') : t('forChildPrefix') + childName(a.child_id) })
      )
    );
    if (a.description) card.appendChild(h('p', { class: 'txt', text: a.description }));
    return card;
  }

  function vAppts(v) {
    var now = new Date();
    var up = S.d.appts.filter(function (a) { return new Date(a.starts_at) >= now && a.status !== 'cancelled'; });
    var past = S.d.appts.filter(function (a) { return new Date(a.starts_at) < now || a.status === 'cancelled'; });

    v.appendChild(h('div', { class: 'bar-sub' }, h('h2', { text: t('apptsUpcoming') })));
    if (!up.length) v.appendChild(empty(t('emptyAppts'))); else up.forEach(function (a) { v.appendChild(apptCard(a)); });

    if (past.length) {
      v.appendChild(h('div', { class: 'bar-sub' }, h('h2', { text: t('apptsPast') })));
      past.forEach(function (a) { v.appendChild(apptCard(a)); });
    }
  }

  /* تبويب الرسائل والإعلانات */
  function vMsgs(v) {
    if (!S.d.msgs.length) return v.appendChild(empty(t('emptyMsgs')));
    S.d.msgs.forEach(function (m) {
      var isUnread = !S.reads[m.id];
      var card = h('div', { class: 'card' },
        h('h2', { text: m.title }),
        h('div', { class: 'meta' },
          h('span', { text: fmtDate(m.published_at) }),
          h('span', { class: 'badge ' + (m.kind === 'message' ? 'gold' : 'ok'), text: m.kind === 'message' ? t('personalMsg') : t('announcement') }),
          isUnread ? h('span', { class: 'badge bad', text: t('newBadge') }) : null
        ),
        h('p', { class: 'txt pre', text: m.body })
      );
      if (isUnread) {
        var markBtn = h('button', { class: 'btn small light', type: 'button', text: t('markAsRead') });
        markBtn.addEventListener('click', function () {
          lockBtn(markBtn, async function () {
            try {
              await C.rest('POST', '/message_reads', { message_id: m.id, parent_id: S.me });
              S.reads[m.id] = true;
              render();
            } catch (er) { toast(er.message, 'bad'); }
          });
        });
        card.appendChild(h('div', { class: 'row-actions' }, markBtn));
      }
      v.appendChild(card);
    });
  }

  /* تبويب الوثائق الخاصة */
  function vDocs(v) {
    if (!S.d.docs.length) return v.appendChild(empty(t('emptyDocs')));
    S.d.docs.forEach(function (d) {
      var card = h('div', { class: 'card' },
        h('h2', { text: d.title }),
        h('div', { class: 'meta' },
          h('span', { text: childName(d.child_id) }),
          d.category ? h('span', { text: d.category }) : null,
          h('span', { text: fmtDate(d.created_at) })
        ),
        h('div', { class: 'row-actions' }, fileBtn(d.storage_path, t('openDoc')))
      );
      v.appendChild(card);
    });
  }

  /* تبويب التواصل مع المركز */
  function vContact(v) {
    var card = h('div', { class: 'contact-card' });
    card.appendChild(h('h2', { text: t('contactTitle') }));
    card.appendChild(h('p', { text: t('contactSub') }));

    function cItem(symId, label, valNode) {
      var row = h('div', { class: 'contact-item' },
        h('div', { class: 'ci-icon' }, icon(symId)),
        h('div', { class: 'ci-body' },
          h('div', { class: 'ci-label', text: label }),
          h('div', { class: 'ci-val' }, valNode)
        )
      );
      card.appendChild(row);
    }

    cItem('i-pin', t('contactAddrLabel'), document.createTextNode(t('contactAddrVal')));
    cItem('i-mail', t('contactEmailLabel'), h('a', { href: 'https://mail.google.com/mail/?view=cm&to=cppdarelihcen@gmail.com', target: '_blank', rel: 'noopener noreferrer', text: 'cppdarelihcen@gmail.com' }));
    cItem('i-phone', t('contactPhoneLabel'), document.createTextNode('044 44 48 34 / 0664 42 14 44 / 0540 81 77 75 / 0668 03 41 47'));

    var socialLinks = h('div', { class: 'contact-btn-wrap' },
      h('a', { class: 'contact-btn', href: 'https://wa.me/213668034147', target: '_blank', rel: 'noopener noreferrer', text: t('contactWa') }),
      h('a', { class: 'contact-btn', href: 'https://www.facebook.com/apehme', target: '_blank', rel: 'noopener noreferrer', text: t('contactFb') })
    );
    cItem('i-globe', t('contactSocialLabel'), socialLinks);

    var siteA = document.createElement('a');
    siteA.setAttribute('href', './index.html');
    siteA.textContent = t('contactSiteLink');
    cItem('i-home', t('contactSiteLabel'), siteA);

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
    ({
      children: vChildren,
      programs: vPrograms,
      reports: vReports,
      appts: vAppts,
      msgs: vMsgs,
      docs: vDocs,
      contact: vContact
    })[S.tab](v);
  }

  /* ---------- التشغيل والربط ---------- */
  async function init() {
    applyLang();
    if (!CFG.supabaseUrl || !CFG.supabaseKey) { $('#boot').textContent = 'إعدادات الاتصال غير مضبوطة.'; return; }
    C.onExpire(function () { showLogin('انتهت الجلسة. سجّل الدخول من جديد.'); });

    $('#loginForm').addEventListener('submit', submitLogin);
    $('#forgotBtn').addEventListener('click', function () { setMode('forgot'); });
    $('#backBtn').addEventListener('click', function () { setMode('login'); });
    $('#logoutBtn').addEventListener('click', function () { logout(); });
    var menuBtn = $('#menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', function () { document.body.classList.toggle('nav-toggled'); });
    var sideCloseBtn = $('#sideCloseBtn');
    if (sideCloseBtn) sideCloseBtn.addEventListener('click', function () { document.body.classList.remove('nav-toggled'); });
    var scrim = $('#scrim');
    if (scrim) scrim.addEventListener('click', function () { document.body.classList.remove('nav-toggled'); });
    var sideLogoutBtn = $('#sideLogoutBtn');
    if (sideLogoutBtn) sideLogoutBtn.addEventListener('click', function () { logout(); });

    var btnLoginLang = $('#loginLangBtn'); if (btnLoginLang) btnLoginLang.addEventListener('click', toggleLang);
    var btnBarLang = $('#barLangBtn'); if (btnBarLang) btnBarLang.addEventListener('click', toggleLang);

    var m = $('#modal');
    if (m) {
      m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && m && !m.hidden) closeModal();
    });

    /* دعم زر الرجوع في الهاتف للعودة خطوة للخلف داخل فضاء الأولياء وعدم الخروج منه */
    window.addEventListener('popstate', function () {
      if ($('#login') && !$('#login').hidden && mode !== 'login') {
        setMode('login');
        try { window.history.pushState({ deParentLogin: true }, ''); } catch (e) {}
        return;
      }
      if (!C.loggedIn() || !S.d || ($('#app') && $('#app').hidden)) return;
      if (m && !m.hidden) {
        closeModal();
        return;
      }
      while (S.tabStack && S.tabStack.length > 0) {
        var prevTab = S.tabStack.pop();
        if (prevTab && prevTab !== S.tab) {
          S.tab = prevTab;
          render();
          window.scrollTo(0, 0);
          try { window.history.pushState({ deParent: true, tab: S.tab }, ''); } catch (e) {}
          return;
        }
      }
      if (S.tab !== 'children') {
        S.tab = 'children';
        render();
        window.scrollTo(0, 0);
        try { window.history.pushState({ deParent: true, tab: 'children' }, ''); } catch (e) {}
        return;
      }
      try { window.history.pushState({ deParent: true, tab: 'children' }, ''); } catch (e) {}
    });

    try {
      var pu = (new URLSearchParams(window.location.search).get('u') || '').trim().toLowerCase();
      if (/^[a-z0-9._-]{3,30}$/.test(pu) && $('#email')) { $('#email').value = pu; var pwEl = $('#password'); if (pwEl) setTimeout(function () { pwEl.focus(); }, 0); }
    } catch (e) {}
    try {
      if (!new URLSearchParams(window.location.search).get('u')) {
        var last = (sessionStorage.getItem('de_parent_user') || '').trim().toLowerCase();
        if (last && last.length <= 254 && $('#email')) $('#email').value = last;
      }
    } catch (e3) {}

    var hash = await C.adoptHash();
    if (hash && hash.error) { showLogin(hash.error); return; }
    if (hash && (hash.type === 'invite' || hash.type === 'recovery')) {
      show('login');
      var userEmail = hash.email || '';
      if ($('#setEmail')) $('#setEmail').value = userEmail;
      if ($('#email')) $('#email').value = userEmail;
      setMode('set', hash.type === 'invite' ? t('hintInvite') : t('hintSet'));
      return;
    }
    if (C.load()) enter(); else showLogin();
  }

  init();
})();
