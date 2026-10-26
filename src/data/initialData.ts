import { Branch, Section, Student, Educator, Announcement, Appointment, DocumentRecord, AuditEntry, ProgressReport, EvaluationItem } from '../types';

export const BRANCHES: Branch[] = [
  {
    id: 'b-main',
    slug: 'main',
    name: 'المركز النفسي البيداغوجي دار الإحسان (المركز الرئيسي)',
    nameFr: 'Centre Psychopédagogique Dar El Ihsan (Centre Principal)',
    description: 'يقدم رعاية متعددة التخصصات للأطفال ذوي الإعاقة الذهنية، اضطراب طيف التوحد، والتأخر الذهني مع خطط علاجية وبيداغوجية فردية.',
    descriptionFr: 'Prise en charge pluridisciplinaire des enfants et adolescents avec déficience intellectuelle ou TSA.',
    address: 'حي المعلمين – بجانب ملحقة التكوين المهني – العطف – ولاية غرداية',
    mapUrl: 'https://maps.app.goo.gl/t6nTLCWQ8NMMDG4A9',
    image: '/main-center.jpg',
    phone: '044 44 48 34',
    active: true
  },
  {
    id: 'b-work',
    slug: 'work',
    name: 'مركز المساعدة على العمل (ورشات التأهيل والتمهين)',
    nameFr: 'Centre d\'Aide par le Travail (Ateliers de formation)',
    description: 'يهتم بتأهيل وتدريب الشباب من ذوي الاحتياجات الخاصة مهنياً وحرفياً لإدماجهم في سوق العمل والإنتاج المجتمعي.',
    descriptionFr: 'Réadaptation et insertion socioprofessionnelle pour jeunes adultes en situation de handicap.',
    address: 'العطف – المنطقة الحرفية – ولاية غرداية',
    mapUrl: 'https://maps.app.goo.gl/H6kUhztG2EW298kaA',
    image: '/work-center.jpg',
    phone: '0664 42 14 44',
    active: true
  },
  {
    id: 'b-farm',
    slug: 'farm',
    name: 'المزرعة البيداغوجية والزراعة المائية',
    nameFr: 'Ferme Pédagogique et Hydroponie',
    description: 'بيئة طبيعية توفر نشاطات فلاحية وزراعة مائية علاجية وتأهيلية تسهم في تعزيز الصحة النفسية والمهارات الحركية.',
    descriptionFr: 'Milieu naturel d\'activités agricoles et horticoles thérapeutiques adaptées.',
    address: 'واحات العطف – ولاية غرداية',
    mapUrl: 'https://maps.app.goo.gl/vLLZMdjQfvt87oHr9',
    image: '/farm-hydroponic.jpg',
    phone: '0668 03 41 47',
    active: true
  }
];

export const SECTIONS: Section[] = [
  // المركز الرئيسي (9 أقسام)
  { id: 'sec-1', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_autism_1', name: 'توحد 01', description: 'قسم اضطراب طيف التوحد (فوج 1 - التدخل الأولي)', active: true },
  { id: 'sec-2', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_autism_2', name: 'التوحد 02', description: 'قسم اضطراب طيف التوحد (فوج 2 - تنمية التواصل)', active: true },
  { id: 'sec-3', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_autism_3', name: 'توحد 03', description: 'قسم اضطراب طيف التوحد (فوج 3 - الاستقلالية)', active: true },
  { id: 'sec-4', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_observation', name: 'الملاحظة جدد', description: 'قسم الملاحظة والتشخيص للأطفال الجدد وإعداد الخطط الفردية', active: true },
  { id: 'sec-5', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_tafatan_1', name: 'التفطين 1 تأخر ذهني', description: 'قسم التفطن والتأهيل الذهني (فوج 1)', active: true },
  { id: 'sec-6', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_tafatan_2', name: 'التفطين 2 متلازمة داون', description: 'قسم التفطن لمتلازمة داون (فوج 2)', active: true },
  { id: 'sec-7', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_istithara', name: 'الاستثارة', description: 'قسم الاستثارة الحسية والحركية والتهيئة السلوكية', active: true },
  { id: 'sec-8', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_shibh_madrasi', name: 'قسم الشبه مدرسي مكيف', description: 'قسم التأهيل الشبه مدرسي المكيف والإدماج المعرفي', active: true },
  { id: 'sec-9', branch_id: 'b-main', branch_slug: 'main', slug: 'sec_khariji', name: 'الخارجي اعاقة شديدة', description: 'فوج الرعاية النهارية الخارجية والمتابعة المنزلية للإعاقات الشديدة', active: true },

  // مركز المساعدة على العمل
  { id: 'sec-10', branch_id: 'b-work', branch_slug: 'work', slug: 'sec_tamhin', name: 'التمهين م م ع', description: 'قسم التمهين والتأهيل المهني والورشات التطبيقية', active: true },

  // المزرعة البيداغوجية
  { id: 'sec-11', branch_id: 'b-farm', branch_slug: 'farm', slug: 'sec_bostana', name: 'المزرعة البستنة', description: 'ورشة البستنة والزراعة المائية والأنشطة الخضراء', active: true }
];

export const OFFICIAL_STUDENTS_RAW: Array<{
  no: string;
  name: string;
  dob: string;
  phone: string;
  disability: string;
  branch: 'main' | 'work' | 'farm';
  sectionSlug: string;
}> = [
  // الدفعة الرسمية 1 (29 طالب)
  { no: '004', name: 'حاج ابراهيم مسعود بن قاسم', dob: '1981-08-01', phone: '055948690', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '021', name: 'حاج ابراهيم عمر بن سليمان', dob: '1986-04-26', phone: '055377052', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '022', name: 'بهون علي يوسف بن يحي', dob: '1986-06-12', phone: '065837964', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '050', name: 'سعيد مصطفى بن عمر', dob: '1991-09-20', phone: '056101096', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '077', name: 'بهون علي زوليخة بنت يحي بن عمر', dob: '1988-07-20', phone: '065837964', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '082', name: 'حاج امحمد محمد بن اسماعيل', dob: '1989-08-04', phone: '066442144', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '086', name: 'حاج ابراهيم بهون بن عبد الرحمان', dob: '1995-03-24', phone: '077130718', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '087', name: 'خليف ابراهيم زكرياء بن أحمد', dob: '2003-03-17', phone: '069995077', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '090', name: 'اولاد حاجو بكير بن توفيق', dob: '2004-05-22', phone: '066303199', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '101', name: 'طالب باحمد عز الدين بن بكير', dob: '2005-04-05', phone: '079361303', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '103', name: 'بهون عائشة بنت نور الدين', dob: '2001-08-23', phone: '067147301', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '104', name: 'بهون وسام بنت ابراهيم', dob: '2006-06-04', phone: '055653051', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '111', name: 'بهون زوليخة بنت نور الدين', dob: '1984-12-21', phone: '067147301', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '112', name: 'قندوزي نصر الدين بن حسين', dob: '2006-09-24', phone: '066343469', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '114', name: 'اسماوي امين بن ابو عبيدة', dob: '2009-09-30', phone: '055928584', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '116', name: 'صلاح مهدي بن مسعود', dob: '2002-03-08', phone: '066470243', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '117', name: 'درين سمية بنت صالح', dob: '1997-09-27', phone: '066661649', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '118', name: 'درين منير بن صالح', dob: '1993-09-02', phone: '066661649', disability: 'التأخر الذهني R.M', branch: 'farm', sectionSlug: 'sec_bostana' },
  { no: '119', name: 'درين بشير بن صالح', dob: '1995-07-19', phone: '066661649', disability: 'التأخر الذهني R.M', branch: 'farm', sectionSlug: 'sec_bostana' },
  { no: '132', name: 'حمو علي قاسم بن عمر', dob: '2009-08-01', phone: '066629625', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_khariji' },
  { no: '138', name: 'حمو علي سمية بنت موسى', dob: '2004-06-09', phone: '079759877', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '142', name: 'بوحديبة محمد بن ابراهيم', dob: '2011-01-25', phone: '067364872', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '146', name: 'حبيرش جيهان بنت عبد الوهاب', dob: '2013-12-07', phone: '067341231', disability: 'اضطراب طيف التوحد TSA', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '153', name: 'العابد حسناء بنت منصور', dob: '2008-02-28', phone: '067030546', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '159', name: 'اسماوي محمد بن بلال', dob: '2010-08-15', phone: '065839100', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '160', name: 'بهون علي محمد السعيد بن عمر', dob: '2013-07-17', phone: '055079988', disability: 'متلازمة داون T.21', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '165', name: 'حمو علي زكرياء بن ابراهيم', dob: '2014-09-08', phone: '066744579', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '167', name: 'كليماني انفال بنت محمد', dob: '2012-11-30', phone: '069837174', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_tafatan_1' },
  { no: '168', name: 'كليماني آية بنت محمد', dob: '2009-04-05', phone: '069837174', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },

  // الدفعة 2
  { no: '170', name: 'بن علي فاروق بن احمد', dob: '2012-10-02', phone: '066164908', disability: 'متلازمة داون T.21', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '173', name: 'بن يحي الياس بن مختار', dob: '2007-10-27', phone: '066594864', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '176', name: 'كبير حاج الطيب بن بشير', dob: '2014-01-21', phone: '079274729', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '180', name: 'زرقون صفوان بن مصطفى', dob: '2007-05-31', phone: '066864048', disability: 'اضطراب طيف التوحد TSA', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '187', name: 'خروبي زكرياء بن عيسى', dob: '2015-04-14', phone: '054228492', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_1' },
  { no: '188', name: 'اسكوتي عيسى بن عثمان', dob: '2016-06-19', phone: '069905393', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_1' },
  { no: '189', name: 'الشرع ريان بن مختار', dob: '2015-01-05', phone: '066147475', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_2' },
  { no: '190', name: 'بن حمودة أيمن سليمان بن عمر', dob: '2013-09-06', phone: '066650690', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_2' },
  { no: '192', name: 'الشرع خالد بن مختار', dob: '2013-10-16', phone: '066147475', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_1' },
  { no: '196', name: 'بهشو اسماعيل بن سليمان', dob: '2013-05-16', phone: '066599607', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '197', name: 'كليماني اية', dob: '2014-04-23', phone: '066836902', disability: 'متعدد الاعاقات', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '198', name: 'بن ريم مروة بنت مروان', dob: '2009-02-06', phone: '066569187', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '200', name: 'بن يوسف حاج ابراهيم بن نصر الدين', dob: '2009-12-27', phone: '067642448', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '201', name: 'باباعمر تيازيط زكرياء بن بشير', dob: '2010-07-08', phone: '077712027', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '202', name: 'بكلي الحاج محمد بن احمد', dob: '2012-02-13', phone: '056124727', disability: 'متلازمة داون T.21', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '204', name: 'ببو محمد بن العيد', dob: '2008-06-01', phone: '066887289', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '206', name: 'بن عافو يوسف بن عيسى', dob: '2013-07-14', phone: '069614151', disability: 'متعدد الاعاقات', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '209', name: 'قومار محمد ياسر بن حمزة', dob: '2015-04-13', phone: '066553918', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_2' },
  { no: '213', name: 'يعقوب نذير بن محمد', dob: '2007-11-04', phone: '065706325', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '216', name: 'ابي اسماعيل ياسين بن بعيسى', dob: '2012-01-14', phone: '055825381', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '219', name: 'حاج امحمد اسماعيل بن ابراهيم', dob: '2009-12-01', phone: '077846497', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_khariji' },
  { no: '223', name: 'أولاد علي صوفيا بنت محمد', dob: '2014-01-22', phone: '066167498', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_3' },
  { no: '224', name: 'مسهل لؤي بن خالد', dob: '2016-06-02', phone: '066065559', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_3' },
  { no: '226', name: 'دهان عبد القادر بن يحي بن عيسى', dob: '2013-12-19', phone: '067222373', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '227', name: 'قبسي مهدي عبد الرزاق بن احمد', dob: '2014-05-12', phone: '069797512', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_3' },
  { no: '228', name: 'حيمود اسامة بن مداني', dob: '2007-06-20', phone: '066638904', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '231', name: 'مهيري يوسف الصديق بن موسى', dob: '2016-02-23', phone: '066743252', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_3' },
  { no: '236', name: 'حاج سعيد مسعودة سيرين بنت عمر', dob: '2018-07-09', phone: '055754254', disability: 'متلازمة داون T.21', branch: 'main', sectionSlug: 'sec_tafatan_2' },
  { no: '238', name: 'بابا عمر تيازيط يحي بن مسعود', dob: '2009-07-25', phone: '067135309', disability: 'اضطراب طيف التوحد TSA', branch: 'farm', sectionSlug: 'sec_bostana' },
  { no: '239', name: 'بابا عمر تيازيط محمد بن مسعود', dob: '2016-12-22', phone: '067135309', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '240', name: 'بن موسى مريم بنت بلقاسم', dob: '2014-01-23', phone: '066202193', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '243', name: 'حاج امحمد مصطفى الامين بن ابراه', dob: '1993-02-01', phone: '065931259', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '247', name: 'جرادة ابراهيم بن محمد', dob: '2018-01-15', phone: '066250716', disability: 'متلازمة داون T.21', branch: 'main', sectionSlug: 'sec_tafatan_2' },
  { no: '249', name: 'حاتة سليمان بن بكير', dob: '2001-02-04', phone: '079230020', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },

  // الدفعة 3
  { no: '250', name: 'حاج اسماعيل عائشة بنت محمد', dob: '2021-06-08', phone: '069668368', disability: 'متلازمة داون T.21', branch: 'main', sectionSlug: 'sec_tafatan_2' },
  { no: '251', name: 'سعيد فاطمة الزهراء بنت صلاح الدين', dob: '2009-06-26', phone: '065988655', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '254', name: 'بوال مصطفى بن إدريس', dob: '2012-04-13', phone: '066543656', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '255', name: 'بن خليفة ريهام شهد بنت محمد', dob: '2009-07-25', phone: '069804364', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '256', name: 'بن احمد انس عبد الجليل بن أحمد', dob: '2017-11-12', phone: '069958761', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_tafatan_1' },
  { no: '257', name: 'الشامخة عبد الرزاق حفيظ بن مصطفى', dob: '2017-12-03', phone: '066862720', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_1' },
  { no: '258', name: 'اولاد الشيخ انس عبد العليم بن محمد', dob: '2018-07-02', phone: '066898171', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_observation' },
  { no: '259', name: 'عيسى عز الدين بن بكير', dob: '2010-08-28', phone: '055016841', disability: 'اضطراب طيف التوحد TSA', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '263', name: 'سالم يوسف بن حمو', dob: '2008-02-09', phone: '054111581', disability: 'اضطراب طيف التوحد TSA', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '264', name: 'هامل سحر بنت أحمد بن صالح', dob: '2007-06-04', phone: '077824262', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_khariji' },
  { no: '265', name: 'هامل عبد الحي بن أحمد بن صالح', dob: '2010-07-29', phone: '077824262', disability: 'اضطراب طيف التوحد TSA', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '267', name: 'بلولو الحاج ابراهيم بن رمضان', dob: '2010-08-14', phone: '079654999', disability: 'اضطراب طيف التوحد TSA', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '273', name: 'الواهج بكير بن صالح', dob: '1988-12-15', phone: '055207989', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '274', name: 'توهامي ريم بنت توفيق', dob: '2014-06-03', phone: '055030033', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_observation' },
  { no: '275', name: 'أولاد حاجو مامة مالك بنت صالح', dob: '2015-05-07', phone: '066614780', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '276', name: 'صديقي محمد الامين بن مراد', dob: '2014-03-14', phone: '066276843', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_3' },
  { no: '279', name: 'قندوز نهال بنت نصر الدين', dob: '2012-06-18', phone: '066597050', disability: 'التأخر الدراسي', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '280', name: 'مطياز توفيق بن محمد', dob: '2001-09-01', phone: '066347915', disability: 'التأخر الدراسي', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '281', name: 'عكيف عبد الجليل طه بن أحمد', dob: '2003-06-15', phone: '069998926', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '283', name: 'داودي سهام بنت محمد', dob: '2015-02-17', phone: '055610591', disability: 'التأخر الدراسي', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '288', name: 'حاج عيسى فخار عيسى بن يونس', dob: '1995-08-18', phone: '079794096', disability: 'متعدد الاعاقات', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '289', name: 'بنورة منير بن محمد', dob: '2015-01-01', phone: '055534375', disability: 'متعدد الاعاقات', branch: 'main', sectionSlug: 'sec_khariji' },
  { no: '291', name: 'داودي ربيع بن بايوب', dob: '2014-02-24', phone: '0558694073', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '293', name: 'ريغي اية بنت الشيخ', dob: '2021-07-01', phone: '065250446', disability: 'متلازمة داون T.21', branch: 'main', sectionSlug: 'sec_tafatan_2' },
  { no: '296', name: 'عباس لقمان بن يحي', dob: '2017-05-12', phone: '077071457', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '297', name: 'الشيخ محمد المهدي بن عيسى', dob: '2016-12-17', phone: '067462692', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_autism_2' },
  { no: '301', name: 'اسماوي ايوب بن عبد السلام', dob: '2018-12-15', phone: '055324283', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_shibh_madrasi' },
  { no: '305', name: 'يحي الشريف خديجة بنت فاروق', dob: '2022-09-23', phone: '066864689', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_tafatan_1' },
  { no: '306', name: 'بن صغير ياسين بن احمد', dob: '2015-07-31', phone: '066201480', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_observation' },
  { no: '307', name: 'غبشي نورالهدى بنت يوسف', dob: '2014-09-07', phone: '065951484', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_observation' },
  { no: '310', name: 'داودي الحاج يحي بن باحمد', dob: '2007-06-24', phone: '054113100', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '311', name: 'الشيخ دحمان مامة بنت دحمان', dob: '2016-02-10', phone: '055933674', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '312', name: 'بن يونس يسرى بنت مصطفى', dob: '2007-09-09', phone: '066685208', disability: 'اضطراب طيف التوحد TSA', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '313', name: 'لعزيز ياسمين بنت سيراج', dob: '2013-12-30', phone: '055015858', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_istithara' },

  // الدفعة 4
  { no: '314', name: 'نوح مفنون أمين بن البشير', dob: '2007-01-05', phone: '077830744', disability: 'متلازمة داون T.21', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '315', name: 'بورزمة ابراهيم بن محمد', dob: '2021-08-11', phone: '066333478', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_tafatan_1' },
  { no: '316', name: 'زيطاري نور سين بنت خليل', dob: '2020-09-21', phone: '066241736', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_tafatan_1' },
  { no: '317', name: 'داودي طه بن علي', dob: '2007-06-06', phone: '054148767', disability: 'التأخر الذهني R.M', branch: 'work', sectionSlug: 'sec_tamhin' },
  { no: '318', name: 'جبريط سعد الدين بن بدر الدين', dob: '2014-05-10', phone: '066228078', disability: 'التأخر الذهني R.M', branch: 'main', sectionSlug: 'sec_istithara' },
  { no: '320', name: 'بيتور محمد اسحاق بن بن يعيش', dob: '2019-03-24', phone: '066230749', disability: 'اضطراب طيف التوحد TSA', branch: 'main', sectionSlug: 'sec_observation' }
];

// إنشاء كائنات الطلبة الكاملة
export const INITIAL_STUDENTS: Student[] = OFFICIAL_STUDENTS_RAW.map((r, i) => {
  const section = SECTIONS.find(s => s.slug === r.sectionSlug) || SECTIONS[0];
  const b = BRANCHES.find(br => br.slug === r.branch) || BRANCHES[0];
  return {
    id: `child-${r.no}`,
    membership_no: r.no,
    full_name: r.name,
    dob: r.dob,
    phone: r.phone,
    disability: r.disability,
    center: r.branch,
    branch_id: b.id,
    section_id: section.id,
    section: section.name,
    academic_year: '2026-2027',
    active: true,
    public_uuid: `00000000-0000-4000-8000-${r.no.padStart(12, '0')}`,
    registration_code: `DI-${(100000 + i * 137).toString().substring(0, 6)}`,
    guardian_name: r.name.includes('بنت') ? `ولي أمر الطالبة` : `ولي أمر الطالب`,
    notes: 'متابع بانتظام في البرنامج التربوي الفردي للموسم الحالي.',
    emergency_phone: r.phone
  };
});

export const EDUCATORS: Educator[] = [
  {
    id: 'ed-1',
    name: 'أ. فاطمة الزهراء باحمد',
    role: 'أخصائية أرطفونيا (تقويم النطق واللغة)',
    specialty: 'تقويم النطق والتواصل البديل',
    branch_slug: 'main',
    section_name: 'كل الأقسام',
    phone: '0661 22 33 44',
    email: 'ortho.bahmed@darelihsan.dz',
    avatarLetter: 'ف',
    active: true
  },
  {
    id: 'ed-2',
    name: 'أ. عبد الوهاب قندوزي',
    role: 'أخصائي نفسي عيادي',
    specialty: 'التقييم النفسي والدعم السلوكي',
    branch_slug: 'main',
    section_name: 'كل الأقسام',
    phone: '0662 33 44 55',
    email: 'psy.kendouzi@darelihsan.dz',
    avatarLetter: 'ع',
    active: true
  },
  {
    id: 'ed-3',
    name: 'أ. مريم بن يحي',
    role: 'مربية رئيسية',
    specialty: 'اضطراب طيف التوحد (TSA)',
    branch_slug: 'main',
    section_name: 'توحد 01',
    phone: '0663 44 55 66',
    email: 'm.benyahia@darelihsan.dz',
    avatarLetter: 'م',
    active: true
  },
  {
    id: 'ed-4',
    name: 'أ. خديجة بهون',
    role: 'مربية متخصصة',
    specialty: 'متلازمة داون والتفطن الذهني',
    branch_slug: 'main',
    section_name: 'التفطين 2 متلازمة داون',
    phone: '0664 55 66 77',
    email: 'kh.bahoun@darelihsan.dz',
    avatarLetter: 'خ',
    active: true
  },
  {
    id: 'ed-5',
    name: 'أ. عمر بن ساسي',
    role: 'مؤطر مهني وتقني',
    specialty: 'التأهيل الحرفي والورشات الإنتاجية',
    branch_slug: 'work',
    section_name: 'التمهين م م ع',
    phone: '0665 66 77 88',
    email: 'o.bensassi@darelihsan.dz',
    avatarLetter: 'ع',
    active: true
  },
  {
    id: 'ed-6',
    name: 'أ. بلقاسم حاج مسعود',
    role: 'مهندس زراعي ومؤطر بستنة',
    specialty: 'الزراعة المائية والبستنة العلاجية',
    branch_slug: 'farm',
    section_name: 'المزرعة البستنة',
    phone: '0666 77 88 99',
    email: 'b.hadj@darelihsan.dz',
    avatarLetter: 'ب',
    active: true
  }
];

export const CURRICULUM_DOMAINS: Record<string, string[]> = {
  'مجال الاستقلالية (الحياة اليومية والعناية بالذات)': [
    'غسل اليدين بالماء والصابون بشكل صحيح',
    'غسل الوجه وتجفيفه بالفوطة باستقلالية',
    'استخدام المنديل وتنظيف الأنف بشكل صحيح',
    'خلع ولبس المئزر والسروال بشكل صحيح',
    'فك وربط الأزرار والأحذية',
    'التعرف على أدوات الطعام واستخدامها بشكل مناسب',
    'الشرب بكوب الماء دون انسكاب',
    'طلب الذهاب إلى الحمام عند الحاجة (إشارة / كلمة)',
    'استخدام الحمام وتنظيف اليدين باستقلالية',
    'تنظيف الأسنان بالفرشاة والمعجون'
  ],
  'مجال المهارات الحركية الدقيقة': [
    'القبض على الأشياء وتحويلها بين اليدين',
    'الضغط على كرة إسفنجية ومادة الصلصال',
    'مسك مقبض الباب وتدويره وفتح وإغلاق القوارير',
    'التقاط ونقل الخرز الصغير والكبير',
    'تقليب صفحات الدفتر والكتاب',
    'نظم الخرز في خيط متين',
    'مسك القلم بالقبضة الثلاثية الصحيحة',
    'التلوين المنتظم داخل حيز محدد',
    'توصيل الخطوط المنقطة (أفقية، منحنية)',
    'استخدام المقص وقص الخطوط المستقيمة'
  ],
  'مجال المهارات الحركية الكبرى': [
    'الوقوف والجلوس بوضعية جسمانية صحيحة',
    'المشي المنتظم والجري المتزن في خط محدد',
    'صعود ونزول الدرج بالتناوب دون مساعدة',
    'رمي وركل واستقبال الكرة من مسافة مناسبة',
    'الحجل والقفز بكلتا القدمين معاً',
    'سحب ودفع الأشياء المناسبة لقدراته',
    'التوازن على ساق واحدة لعدة ثوانٍ',
    'الجري المتعرج وتجاوز الحواجز الخفيفة'
  ],
  'مجال ما قبل الأكاديمي': [
    'مطابقة الصور والأشياء المتماثلة',
    'التعرف على الألوان الأساسية (أحمر، أزرق، أصفر، أخضر)',
    'التعرف على الأشكال الهندسية الأساسية (دائرة، مربع، مثلث)',
    'تصنيف الفواكه والخضر والحيوانات الأليفة',
    'التعرف على أعضاء الحواس الخمسة ووظائفها',
    'مطابقة الحروف الهجائية بالبطاقات المصورة',
    'العد الآلي للأرقام من 1 إلى 10',
    'الإشارة إلى مدلول الرقم وكميته المناسبة'
  ],
  'مجال التواصل واللغة': [
    'الاستجابة الفورية عند النداء باسمه',
    'التواصل البصري مع المتحدث أثناء الحوار',
    'التعبير اللفظي أو بالإشارة عن الاحتياجات الأساسية',
    'نطق الكلمات الثنائية والثلاثية بوضوح متزايد',
    'تركيب جملة مفيدة من 3 كلمات للتعبير عن موقف',
    'تنفيذ الأوامر البسيطة والمتسلسلة (أمران متتابعان)',
    'استخدام صيغ التحية والشكر والاستئذان',
    'تسمية الأدوات والمجسمات في البيئة المحيطة'
  ],
  'مجال التقليد والحضور والانتباه': [
    'تقليد حركات اليدين والجسم عن نموذج فوري',
    'تقليد الأصوات اللفظية الأولية والمقاطع الصوتية',
    'التركيز في النشاط البيداغوجي لمدة 15 دقيقة متواصلة',
    'الالتفات الفوري لمصدر الصوت والإشارات التوجيهية',
    'الجلوس الهادئ أثناء التوجيه الجماعي',
    'متابعة حركة الأشياء بدقة بصرية'
  ],
  'المجال الاجتماعي والتكيف النفسي': [
    'المشاركة الإيجابية في ألعاب المجموعات الصغيرة',
    'انتظار الدور ومشاركة الأدوات التعليمية مع زملائه',
    'التعبير عن المشاعر بطريقة آمنة وسليمة',
    'الاستجابة لتعليمات المربية في الساحة والورشة',
    'الاندماج التفاعلي في المناسبات والنشاطات الاحتفالية'
  ],
  'مجال التأهيل المهني والأنشطة البيئية': [
    'فرز وتصنيف الخامات والمنتجات حسب الحجم والنوع',
    'العناية بالنباتات وسقيها في المزرعة البيداغوجية',
    'استخدام أدوات البستنة والزراعة المائية بأمان',
    'التعبئة والتغليف البسيط للمنتوجات الحرفية',
    'احترام قواعد النظافة والسلامة في الورشة والمزرعة'
  ]
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'انطلاق برنامج الزيارات الطبية والمتابعة الأرطفونية للموسم 2026/2027',
    content: 'نعلم جميع أولياء الأطفال الكرام بانطلاق الجداول الدورية لجلسات تقويم النطق واللغة والتقييم النفسي لجميع الأفواج المعتمدة.',
    date: '2026-10-20',
    author: 'أ. باحمد فاطمة الزهراء',
    author_role: 'الإدارة البيداغوجية',
    target: 'all',
    urgent: false
  },
  {
    id: 'ann-2',
    title: 'خرجة تطبيقية لفوج المزرعة البيداغوجية والزراعة المائية',
    content: 'تنظم جمعية دار الإحسان يوم الخميس القادم نشاطاً ميدانياً بالبيوت البلاستيكية والزراعة المائية لتعزيز النشاط الحركي والبيئي لأبنائنا.',
    date: '2026-10-24',
    author: 'أ. بلقاسم حاج مسعود',
    author_role: 'مسؤول المزرعة البيداغوجية',
    target: 'farm',
    urgent: false
  },
  {
    id: 'ann-3',
    title: 'تذكير: توفير الملفات الطبية المحدثة للأطفال الجدد',
    content: 'يُرجى من أولياء أطفال قسم الملاحظة إيداع التقرير العصبي والسمعي المحدث لتثبيت الخطة الفردية الخاصة بكل طفل.',
    date: '2026-10-25',
    author: 'إدارة المركز',
    author_role: 'الإدارة العامة',
    target: 'main',
    urgent: true
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    child_id: 'child-187',
    child_name: 'خروبي زكرياء بن عيسى',
    title: 'جلسة تقويم نطق فردية (أرطفونيا)',
    type: 'speech_therapy',
    date: '2026-10-28',
    time: '09:30',
    specialist: 'أ. فاطمة الزهراء باحمد',
    location: 'قاعة الأرطفونيا - المركز الرئيسي',
    status: 'upcoming',
    notes: 'تنمية التواصل البصري واللفظي'
  },
  {
    id: 'apt-2',
    child_id: 'child-187',
    child_name: 'خروبي زكرياء بن عيسى',
    title: 'لقاء تنسيقي مع ولي الأمر',
    type: 'meeting',
    date: '2026-11-02',
    time: '11:00',
    specialist: 'فريق التكفل المتعدد التخصصات',
    location: 'مكتب الإدارة البيداغوجية',
    status: 'upcoming',
    notes: 'مناقشة تطور استقلالية الطفل في المنزل'
  },
  {
    id: 'apt-3',
    child_id: 'child-118',
    child_name: 'درين منير بن صالح',
    title: 'ورشة زراعية مائية وتأهيل حركي',
    type: 'workshop',
    date: '2026-10-29',
    time: '08:30',
    specialist: 'أ. بلقاسم حاج مسعود',
    location: 'المزرعة البيداغوجية - العطف',
    status: 'upcoming',
    notes: 'أنشطة شتل وتغذية الأحواض المائية'
  }
];

export const INITIAL_AUDIT_LOGS: AuditEntry[] = [
  {
    id: 'aud-1',
    timestamp: '2026-10-26 09:15',
    actor: 'المدير العام',
    actor_email: 'admin@darelihsan.dz',
    action: 'تسجيل دخول ناجح',
    target: 'لوحة التحكم الإدارية',
    status: 'info'
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-26 09:30',
    actor: 'أ. باحمد فاطمة الزهراء',
    actor_email: 'ortho.bahmed@darelihsan.dz',
    action: 'تحديث تقرير تقييم مهارات النطق',
    target: 'التلميذ: خروبي زكرياء (رقم 187)',
    status: 'success'
  },
  {
    id: 'aud-3',
    timestamp: '2026-10-26 10:00',
    actor: 'الإدارة العامة',
    actor_email: 'admin@darelihsan.dz',
    action: 'إصدار بطاقة رقمية معتمدة مع رمز QR',
    target: '103 بطاقة طالب للموسم 2026/2027',
    status: 'success'
  }
];
