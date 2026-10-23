-- =====================================================================
-- تفعيل وإنشاء حسابات الأولياء الـ 103 دفعة واحدة في Supabase
-- الصق الكود بالكامل في Supabase ▸ SQL Editor واضغط Run
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

do $setup$
declare
  r record;
  v_uid uuid;
  v_cid uuid;
  v_email text;
begin
  for r in
    select * from (values
      ('004', 'حاج ابراهيم مسعود بن قاسم', 'hadj.brahim.004', 'DI01081981'),
      ('021', 'حاج ابراهيم عمر بن سليمان', 'hadj.brahim.021', 'DI26041986'),
      ('022', 'بهون علي يوسف بن يحي', 'behoun.ali.022', 'DI12061986'),
      ('050', 'سعيد مصطفى بن عمر', 'said.mustapha.050', 'DI20091991'),
      ('077', 'بهون علي زوليخة بنت يحي بن عمر', 'behoun.ali.077', 'DI20071988'),
      ('082', 'حاج امحمد محمد بن اسماعيل', 'hadj.mohamed.082', 'DI04081989'),
      ('086', 'حاج ابراهيم بهون بن عبد الرحمان', 'hadj.brahim.086', 'DI24031995'),
      ('087', 'خليف ابراهيم زكرياء بن أحمد', 'khelif.brahim.087', 'DI17032003'),
      ('090', 'اولاد حاجو بكير بن توفيق', 'ouled.hadjou.090', 'DI22052004'),
      ('101', 'طالب باحمد عز الدين بن بكير', 'taleb.bahmed.101', 'DI05042005'),
      ('103', 'بهون عائشة بنت نور الدين', 'behoun.aicha.103', 'DI23082001'),
      ('104', 'بهون وسام بنت ابراهيم', 'behoun.wissam.104', 'DI04062006'),
      ('111', 'بهون زوليخة بنت نور الدين', 'behoun.zoulikha.111', 'DI21121984'),
      ('112', 'قندوزي نصر الدين بن حسين', 'kendouzi.nasr.112', 'DI24092006'),
      ('114', 'اسماوي امين بن ابو عبيدة', 'asmaoui.amine.114', 'DI30092009'),
      ('116', 'صلاح مهدي بن مسعود', 'salah.mehdi.116', 'DI08032002'),
      ('117', 'درين سمية بنت صالح', 'derrine.soumia.117', 'DI27091997'),
      ('118', 'درين منير بن صالح', 'derrine.mounir.118', 'DI02091993'),
      ('119', 'درين بشير بن صالح', 'derrine.bachir.119', 'DI19071995'),
      ('132', 'حمو علي قاسم بن عمر', 'hammou.ali.132', 'DI01082009'),
      ('138', 'حمو علي سمية بنت موسى', 'hammou.ali.138', 'DI09062004'),
      ('142', 'بوحديبة محمد بن ابراهيم', 'bouhdiba.mohamed.142', 'DI25012011'),
      ('146', 'حبيرش جيهان بنت عبد الوهاب', 'habirech.djihane.146', 'DI07122013'),
      ('153', 'العابد حسناء بنت منصور', 'elabed.hasna.153', 'DI28022008'),
      ('159', 'اسماوي محمد بن بلال', 'asmaoui.mohamed.159', 'DI15082010'),
      ('160', 'بهون علي محمد السعيد بن عمر', 'behoun.ali.160', 'DI17072013'),
      ('165', 'حمو علي زكرياء بن ابراهيم', 'hammou.ali.165', 'DI08092014'),
      ('167', 'كليماني انفال بنت محمد', 'klimani.anfel.167', 'DI30112012'),
      ('168', 'كليماني آية بنت محمد', 'klimani.aya.168', 'DI05042009'),
      ('170', 'بن علي فاروق بن احمد', 'ben.ali.170', 'DI02102012'),
      ('173', 'بن يحي الياس بن مختار', 'ben.yahia.173', 'DI27102007'),
      ('176', 'كبير حاج الطيب بن بشير', 'kebir.hadj.176', 'DI21012014'),
      ('180', 'زرقون صفوان بن مصطفى', 'zerguoun.safouane.180', 'DI31052007'),
      ('187', 'خروبي زكرياء بن عيسى', 'kharoubi.zakaria.187', 'DI14042015'),
      ('188', 'اسكوتي عيسى بن عثمان', 'skouti.aissa.188', 'DI19062016'),
      ('189', 'الشرع ريان بن مختار', 'chara.rayan.189', 'DI05012015'),
      ('190', 'بن حمودة أيمن سليمان بن عمر', 'ben.hamouda.190', 'DI06092013'),
      ('192', 'الشرع خالد بن مختار', 'chara.khaled.192', 'DI16102013'),
      ('196', 'بهشو اسماعيل بن سليمان', 'behchou.smail.196', 'DI16052013'),
      ('197', 'كليماني اية', 'klimani.aya.197', 'DI23042014'),
      ('198', 'بن ريم مروة بنت مروان', 'ben.rim.198', 'DI06022009'),
      ('200', 'بن يوسف حاج ابراهيم بن نصر الدين', 'ben.youssef.200', 'DI27122009'),
      ('201', 'باباعمر تيازيط زكرياء بن بشير', 'babaomar.tiaziit.201', 'DI08072010'),
      ('202', 'بكلي الحاج محمد بن احمد', 'bakli.elhadj.202', 'DI13022012'),
      ('204', 'ببو محمد بن العيد', 'bebou.mohamed.204', 'DI01062008'),
      ('206', 'بن عافو يوسف بن عيسى', 'ben.afou.206', 'DI14072013'),
      ('209', 'قومار محمد ياسر بن حمزة', 'goumar.mohamed.209', 'DI13042015'),
      ('213', 'يعقوب نذير بن محمد', 'yacoub.nadir.213', 'DI04112007'),
      ('216', 'ابي اسماعيل ياسين بن بعيسى', 'abi.smail.216', 'DI14012012'),
      ('219', 'حاج امحمد اسماعيل بن ابراهيم', 'hadj.mohamed.219', 'DI01122009'),
      ('223', 'أولاد علي صوفيا بنت محمد', 'ouled.ali.223', 'DI22012014'),
      ('224', 'مسهل لؤي بن خالد', 'mesehel.louai.224', 'DI02062016'),
      ('226', 'دهان عبد القادر بن يحي بن عيسى', 'dahan.abd.226', 'DI19122013'),
      ('227', 'قبسي مهدي عبد الرزاق بن احمد', 'gebsi.mehdi.227', 'DI12052014'),
      ('228', 'حيمود اسامة بن مداني', 'himoud.oussama.228', 'DI20062007'),
      ('231', 'مهيري يوسف الصديق بن موسى', 'mehiri.youssef.231', 'DI23022016'),
      ('236', 'حاج سعيد مسعودة سيرين بنت عمر', 'hadj.said.236', 'DI09072018'),
      ('238', 'بابا عمر تيازيط يحي بن مسعود', 'baba.omar.238', 'DI25072009'),
      ('239', 'بابا عمر تيازيط محمد بن مسعود', 'baba.omar.239', 'DI22122016'),
      ('240', 'بن موسى مريم بنت بلقاسم', 'ben.moussa.240', 'DI23012014'),
      ('243', 'حاج امحمد مصطفى الامين بن ابراه', 'hadj.mohamed.243', 'DI01021993'),
      ('247', 'جرادة ابراهيم بن محمد', 'djarada.brahim.247', 'DI15012018'),
      ('249', 'حاتة سليمان بن بكير', 'hata.slimane.249', 'DI04022001'),
      ('250', 'حاج اسماعيل عائشة بنت محمد بن ا', 'hadj.smail.250', 'DI08062021'),
      ('251', 'سعيد فاطمة الزهراء بنت صلاح الدين', 'said.fatima.251', 'DI26062009'),
      ('254', 'بوال مصطفى بن إدريس', 'boual.mustapha.254', 'DI13042012'),
      ('255', 'بن خليفة ريهام شهد بنت محمد', 'ben.khelifa.255', 'DI25072009'),
      ('256', 'بن احمد انس عبد الجليل بن أحمد', 'ben.ahmed.256', 'DI12112017'),
      ('257', 'الشامخة عبد الرزاق حفيظ بن مصطفى', 'chamikha.abd.257', 'DI03122017'),
      ('258', 'اولاد الشيخ انس عبد العليم بن محمد', 'ouled.cheikh.258', 'DI02072018'),
      ('259', 'عيسى عز الدين بن بكير', 'aissa.ezz.259', 'DI28082010'),
      ('263', 'سالم يوسف بن حمو', 'salem.youssef.263', 'DI09022008'),
      ('264', 'هامل سحر بنت أحمد بن صالح', 'hamel.sihem.264', 'DI04062007'),
      ('265', 'هامل عبد الحي بن أحمد بن صالح', 'hamel.abd.265', 'DI29072010'),
      ('267', 'بلولو الحاج ابراهيم بن رمضان', 'belloulou.elhadj.267', 'DI14082010'),
      ('273', 'الواهج بكير بن صالح', 'elouahedj.bakir.273', 'DI15121988'),
      ('274', 'توهامي ريم بنت توفيق', 'touhami.rim.274', 'DI03062014'),
      ('275', 'أولاد حاجو مامة مالك بنت صالح', 'ouled.hadjou.275', 'DI07052015'),
      ('276', 'صديقي محمد الامين بن مراد', 'seddiki.mohamed.276', 'DI14032014'),
      ('279', 'قندوز نهال بنت نصر الدين', 'kendouz.nihal.279', 'DI18062012'),
      ('280', 'مطياز توفيق بن محمد', 'metiaz.toufik.280', 'DI01092001'),
      ('281', 'عكيف عبد الجليل طه بن أحمد', 'akif.abd.281', 'DI15062003'),
      ('283', 'داودي سهام بنت محمد', 'daoudi.siham.283', 'DI17022015'),
      ('288', 'حاج عيسى فخار عيسى بن يونس', 'hadj.aissa.288', 'DI18081995'),
      ('289', 'بنورة منير بن محمد', 'bennoura.mounir.289', 'DI01012015'),
      ('291', 'داودي ربيع بن بايوب', 'daoudi.rabie.291', 'DI24022014'),
      ('293', 'ريغي اية بنت الشيخ', 'righi.aya.293', 'DI01072021'),
      ('296', 'عباس لقمان بن يحي', 'abbas.lokmane.296', 'DI12052017'),
      ('297', 'الشيخ محمد المهدي بن عيسى', 'cheikh.mohamed.297', 'DI17122016'),
      ('301', 'اسماوي ايوب بن عبد السلام', 'asmaoui.ayoub.301', 'DI15122018'),
      ('305', 'يحي الشريف خديجة بنت فاروق', 'yahia.cherif.305', 'DI23092022'),
      ('306', 'بن صغير ياسين بن احمد', 'ben.seghir.306', 'DI31072015'),
      ('307', 'غبشي نورالهدى بنت يوسف', 'ghebchi.nourelhouda.307', 'DI07092014'),
      ('310', 'داودي الحاج يحي بن باحمد', 'daoudi.elhadj.310', 'DI24062007'),
      ('311', 'الشيخ دحمان مامة بنت دحمان', 'cheikh.dahmane.311', 'DI10022016'),
      ('312', 'بن يونس يسرى بنت مصطفى', 'ben.younes.312', 'DI09092007'),
      ('313', 'لعزيز ياسمين بنت سيراج', 'laaziz.yasmine.313', 'DI30122013'),
      ('314', 'نوح مفنون أمين بن البشير', 'nouh.mefnoun.314', 'DI05012007'),
      ('315', 'بورزمة ابراهيم بن محمد', 'bourezma.brahim.315', 'DI11082021'),
      ('316', 'زيطاري نور سين بنت خليل', 'zitari.nour.316', 'DI21092020'),
      ('317', 'داودي طه بن علي', 'daoudi.taha.317', 'DI06062007'),
      ('318', 'جبريط سعد الدين بن بدر الدين', 'djebrit.saad.318', 'DI10052014'),
      ('320', 'بيتور محمد اسحاق بن بن يعيش', 'bitour.mohamed.320', 'DI24032019')
    ) as t(mno, name, username, password)
  loop
    v_email := lower(r.username) || '@parents.darelihsan.invalid';
    select id into v_cid from public.children where membership_no = r.mno limit 1;
    select id into v_uid from auth.users where lower(email) = v_email limit 1;

    if v_uid is null then
      v_uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
      values (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
        extensions.crypt(r.password, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', 'ولي أمر ' || r.name), now(), now(),
        '', '', '', '', '', '', '', '');

      insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_uid,
              jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
              'email', v_uid::text, now(), now(), now());
    else
      update auth.users
         set encrypted_password = extensions.crypt(r.password, extensions.gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
       where id = v_uid;
    end if;

    insert into public.parent_profiles (user_id, full_name, email, username, disabled)
    values (v_uid, 'ولي أمر ' || r.name, v_email, lower(r.username), false)
    on conflict (user_id) do update
      set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;

    if v_cid is not null then
      insert into public.parent_children (parent_id, child_id)
      values (v_uid, v_cid)
      on conflict (parent_id, child_id) do nothing;
    end if;
  end loop;
end $setup$;

notify pgrst, 'reload schema';
