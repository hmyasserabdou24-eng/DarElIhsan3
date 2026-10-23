-- =====================================================================
-- 07) إنشاء وتفعيل حسابات جميع الأولياء (103 حسابات) وربطهم بأبنائهم
-- شغّل هذا الملف في Supabase -> SQL Editor دفعة واحدة
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_uid uuid;
  v_cid uuid;
begin
  -- [004] حاج ابراهيم مسعود بن قاسم
  select id into v_cid from public.children where membership_no = '004' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.brahim.004@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.brahim.004@parents.darelihsan.invalid',
      extensions.crypt('DI01081981', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج ابراهيم مسعود بن قاسم"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.brahim.004@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI01081981', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج ابراهيم مسعود بن قاسم', 'hadj.brahim.004@parents.darelihsan.invalid', 'hadj.brahim.004', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [021] حاج ابراهيم عمر بن سليمان
  select id into v_cid from public.children where membership_no = '021' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.brahim.021@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.brahim.021@parents.darelihsan.invalid',
      extensions.crypt('DI26041986', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج ابراهيم عمر بن سليمان"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.brahim.021@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI26041986', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج ابراهيم عمر بن سليمان', 'hadj.brahim.021@parents.darelihsan.invalid', 'hadj.brahim.021', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [022] بهون علي يوسف بن يحي
  select id into v_cid from public.children where membership_no = '022' limit 1;
  select id into v_uid from auth.users where lower(email) = 'behoun.ali.022@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'behoun.ali.022@parents.darelihsan.invalid',
      extensions.crypt('DI12061986', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بهون علي يوسف بن يحي"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'behoun.ali.022@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI12061986', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بهون علي يوسف بن يحي', 'behoun.ali.022@parents.darelihsan.invalid', 'behoun.ali.022', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [050] سعيد مصطفى بن عمر
  select id into v_cid from public.children where membership_no = '050' limit 1;
  select id into v_uid from auth.users where lower(email) = 'said.mustapha.050@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'said.mustapha.050@parents.darelihsan.invalid',
      extensions.crypt('DI20091991', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر سعيد مصطفى بن عمر"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'said.mustapha.050@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI20091991', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر سعيد مصطفى بن عمر', 'said.mustapha.050@parents.darelihsan.invalid', 'said.mustapha.050', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [077] بهون علي زوليخة بنت يحي بن عمر
  select id into v_cid from public.children where membership_no = '077' limit 1;
  select id into v_uid from auth.users where lower(email) = 'behoun.ali.077@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'behoun.ali.077@parents.darelihsan.invalid',
      extensions.crypt('DI20071988', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بهون علي زوليخة بنت يحي بن عمر"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'behoun.ali.077@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI20071988', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بهون علي زوليخة بنت يحي بن عمر', 'behoun.ali.077@parents.darelihsan.invalid', 'behoun.ali.077', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [082] حاج امحمد محمد بن اسماعيل
  select id into v_cid from public.children where membership_no = '082' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.mohamed.082@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.mohamed.082@parents.darelihsan.invalid',
      extensions.crypt('DI04081989', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج امحمد محمد بن اسماعيل"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.mohamed.082@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI04081989', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج امحمد محمد بن اسماعيل', 'hadj.mohamed.082@parents.darelihsan.invalid', 'hadj.mohamed.082', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [086] حاج ابراهيم بهون بن عبد الرحمان
  select id into v_cid from public.children where membership_no = '086' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.brahim.086@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.brahim.086@parents.darelihsan.invalid',
      extensions.crypt('DI24031995', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج ابراهيم بهون بن عبد الرحمان"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.brahim.086@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI24031995', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج ابراهيم بهون بن عبد الرحمان', 'hadj.brahim.086@parents.darelihsan.invalid', 'hadj.brahim.086', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [087] خليف ابراهيم زكرياء بن أحمد
  select id into v_cid from public.children where membership_no = '087' limit 1;
  select id into v_uid from auth.users where lower(email) = 'khelif.brahim.087@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'khelif.brahim.087@parents.darelihsan.invalid',
      extensions.crypt('DI17032003', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر خليف ابراهيم زكرياء بن أحمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'khelif.brahim.087@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI17032003', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر خليف ابراهيم زكرياء بن أحمد', 'khelif.brahim.087@parents.darelihsan.invalid', 'khelif.brahim.087', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [090] اولاد حاجو بكير بن توفيق
  select id into v_cid from public.children where membership_no = '090' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ouled.hadjou.090@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ouled.hadjou.090@parents.darelihsan.invalid',
      extensions.crypt('DI22052004', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر اولاد حاجو بكير بن توفيق"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ouled.hadjou.090@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI22052004', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر اولاد حاجو بكير بن توفيق', 'ouled.hadjou.090@parents.darelihsan.invalid', 'ouled.hadjou.090', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [101] طالب باحمد عز الدين بن بكير
  select id into v_cid from public.children where membership_no = '101' limit 1;
  select id into v_uid from auth.users where lower(email) = 'taleb.bahmed.101@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'taleb.bahmed.101@parents.darelihsan.invalid',
      extensions.crypt('DI05042005', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر طالب باحمد عز الدين بن بكير"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'taleb.bahmed.101@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI05042005', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر طالب باحمد عز الدين بن بكير', 'taleb.bahmed.101@parents.darelihsan.invalid', 'taleb.bahmed.101', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [103] بهون عائشة بنت نور الدين
  select id into v_cid from public.children where membership_no = '103' limit 1;
  select id into v_uid from auth.users where lower(email) = 'behoun.aicha.103@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'behoun.aicha.103@parents.darelihsan.invalid',
      extensions.crypt('DI23082001', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بهون عائشة بنت نور الدين"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'behoun.aicha.103@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI23082001', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بهون عائشة بنت نور الدين', 'behoun.aicha.103@parents.darelihsan.invalid', 'behoun.aicha.103', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [104] بهون وسام بنت ابراهيم
  select id into v_cid from public.children where membership_no = '104' limit 1;
  select id into v_uid from auth.users where lower(email) = 'behoun.wissam.104@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'behoun.wissam.104@parents.darelihsan.invalid',
      extensions.crypt('DI04062006', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بهون وسام بنت ابراهيم"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'behoun.wissam.104@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI04062006', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بهون وسام بنت ابراهيم', 'behoun.wissam.104@parents.darelihsan.invalid', 'behoun.wissam.104', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [111] بهون زوليخة بنت نور الدين
  select id into v_cid from public.children where membership_no = '111' limit 1;
  select id into v_uid from auth.users where lower(email) = 'behoun.zoulikha.111@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'behoun.zoulikha.111@parents.darelihsan.invalid',
      extensions.crypt('DI21121984', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بهون زوليخة بنت نور الدين"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'behoun.zoulikha.111@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI21121984', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بهون زوليخة بنت نور الدين', 'behoun.zoulikha.111@parents.darelihsan.invalid', 'behoun.zoulikha.111', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [112] قندوزي نصر الدين بن حسين
  select id into v_cid from public.children where membership_no = '112' limit 1;
  select id into v_uid from auth.users where lower(email) = 'kendouzi.nasr.112@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'kendouzi.nasr.112@parents.darelihsan.invalid',
      extensions.crypt('DI24092006', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر قندوزي نصر الدين بن حسين"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'kendouzi.nasr.112@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI24092006', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر قندوزي نصر الدين بن حسين', 'kendouzi.nasr.112@parents.darelihsan.invalid', 'kendouzi.nasr.112', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [114] اسماوي امين بن ابو عبيدة
  select id into v_cid from public.children where membership_no = '114' limit 1;
  select id into v_uid from auth.users where lower(email) = 'asmaoui.amine.114@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'asmaoui.amine.114@parents.darelihsan.invalid',
      extensions.crypt('DI30092009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر اسماوي امين بن ابو عبيدة"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'asmaoui.amine.114@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI30092009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر اسماوي امين بن ابو عبيدة', 'asmaoui.amine.114@parents.darelihsan.invalid', 'asmaoui.amine.114', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [116] صلاح مهدي بن مسعود
  select id into v_cid from public.children where membership_no = '116' limit 1;
  select id into v_uid from auth.users where lower(email) = 'salah.mehdi.116@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'salah.mehdi.116@parents.darelihsan.invalid',
      extensions.crypt('DI08032002', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر صلاح مهدي بن مسعود"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'salah.mehdi.116@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI08032002', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر صلاح مهدي بن مسعود', 'salah.mehdi.116@parents.darelihsan.invalid', 'salah.mehdi.116', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [117] درين سمية بنت صالح
  select id into v_cid from public.children where membership_no = '117' limit 1;
  select id into v_uid from auth.users where lower(email) = 'derrine.soumia.117@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'derrine.soumia.117@parents.darelihsan.invalid',
      extensions.crypt('DI27091997', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر درين سمية بنت صالح"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'derrine.soumia.117@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI27091997', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر درين سمية بنت صالح', 'derrine.soumia.117@parents.darelihsan.invalid', 'derrine.soumia.117', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [118] درين منير بن صالح
  select id into v_cid from public.children where membership_no = '118' limit 1;
  select id into v_uid from auth.users where lower(email) = 'derrine.mounir.118@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'derrine.mounir.118@parents.darelihsan.invalid',
      extensions.crypt('DI02091993', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر درين منير بن صالح"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'derrine.mounir.118@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI02091993', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر درين منير بن صالح', 'derrine.mounir.118@parents.darelihsan.invalid', 'derrine.mounir.118', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [119] درين بشير بن صالح
  select id into v_cid from public.children where membership_no = '119' limit 1;
  select id into v_uid from auth.users where lower(email) = 'derrine.bachir.119@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'derrine.bachir.119@parents.darelihsan.invalid',
      extensions.crypt('DI19071995', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر درين بشير بن صالح"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'derrine.bachir.119@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI19071995', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر درين بشير بن صالح', 'derrine.bachir.119@parents.darelihsan.invalid', 'derrine.bachir.119', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [132] حمو علي قاسم بن عمر
  select id into v_cid from public.children where membership_no = '132' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hammou.ali.132@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hammou.ali.132@parents.darelihsan.invalid',
      extensions.crypt('DI01082009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حمو علي قاسم بن عمر"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hammou.ali.132@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI01082009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حمو علي قاسم بن عمر', 'hammou.ali.132@parents.darelihsan.invalid', 'hammou.ali.132', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [138] حمو علي سمية بنت موسى
  select id into v_cid from public.children where membership_no = '138' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hammou.ali.138@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hammou.ali.138@parents.darelihsan.invalid',
      extensions.crypt('DI09062004', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حمو علي سمية بنت موسى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hammou.ali.138@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI09062004', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حمو علي سمية بنت موسى', 'hammou.ali.138@parents.darelihsan.invalid', 'hammou.ali.138', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [142] بوحديبة محمد بن ابراهيم
  select id into v_cid from public.children where membership_no = '142' limit 1;
  select id into v_uid from auth.users where lower(email) = 'bouhdiba.mohamed.142@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'bouhdiba.mohamed.142@parents.darelihsan.invalid',
      extensions.crypt('DI25012011', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بوحديبة محمد بن ابراهيم"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'bouhdiba.mohamed.142@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI25012011', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بوحديبة محمد بن ابراهيم', 'bouhdiba.mohamed.142@parents.darelihsan.invalid', 'bouhdiba.mohamed.142', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [146] حبيرش جيهان بنت عبد الوهاب
  select id into v_cid from public.children where membership_no = '146' limit 1;
  select id into v_uid from auth.users where lower(email) = 'habirech.djihane.146@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'habirech.djihane.146@parents.darelihsan.invalid',
      extensions.crypt('DI07122013', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حبيرش جيهان بنت عبد الوهاب"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'habirech.djihane.146@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI07122013', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حبيرش جيهان بنت عبد الوهاب', 'habirech.djihane.146@parents.darelihsan.invalid', 'habirech.djihane.146', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [153] العابد حسناء بنت منصور
  select id into v_cid from public.children where membership_no = '153' limit 1;
  select id into v_uid from auth.users where lower(email) = 'elabed.hasna.153@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'elabed.hasna.153@parents.darelihsan.invalid',
      extensions.crypt('DI28022008', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر العابد حسناء بنت منصور"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'elabed.hasna.153@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI28022008', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر العابد حسناء بنت منصور', 'elabed.hasna.153@parents.darelihsan.invalid', 'elabed.hasna.153', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [159] اسماوي محمد بن بلال
  select id into v_cid from public.children where membership_no = '159' limit 1;
  select id into v_uid from auth.users where lower(email) = 'asmaoui.mohamed.159@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'asmaoui.mohamed.159@parents.darelihsan.invalid',
      extensions.crypt('DI15082010', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر اسماوي محمد بن بلال"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'asmaoui.mohamed.159@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI15082010', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر اسماوي محمد بن بلال', 'asmaoui.mohamed.159@parents.darelihsan.invalid', 'asmaoui.mohamed.159', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [160] بهون علي محمد السعيد بن عمر
  select id into v_cid from public.children where membership_no = '160' limit 1;
  select id into v_uid from auth.users where lower(email) = 'behoun.ali.160@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'behoun.ali.160@parents.darelihsan.invalid',
      extensions.crypt('DI17072013', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بهون علي محمد السعيد بن عمر"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'behoun.ali.160@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI17072013', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بهون علي محمد السعيد بن عمر', 'behoun.ali.160@parents.darelihsan.invalid', 'behoun.ali.160', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [165] حمو علي زكرياء بن ابراهيم
  select id into v_cid from public.children where membership_no = '165' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hammou.ali.165@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hammou.ali.165@parents.darelihsan.invalid',
      extensions.crypt('DI08092014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حمو علي زكرياء بن ابراهيم"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hammou.ali.165@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI08092014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حمو علي زكرياء بن ابراهيم', 'hammou.ali.165@parents.darelihsan.invalid', 'hammou.ali.165', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [167] كليماني انفال بنت محمد
  select id into v_cid from public.children where membership_no = '167' limit 1;
  select id into v_uid from auth.users where lower(email) = 'klimani.anfel.167@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'klimani.anfel.167@parents.darelihsan.invalid',
      extensions.crypt('DI30112012', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر كليماني انفال بنت محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'klimani.anfel.167@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI30112012', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر كليماني انفال بنت محمد', 'klimani.anfel.167@parents.darelihsan.invalid', 'klimani.anfel.167', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [168] كليماني آية بنت محمد
  select id into v_cid from public.children where membership_no = '168' limit 1;
  select id into v_uid from auth.users where lower(email) = 'klimani.aya.168@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'klimani.aya.168@parents.darelihsan.invalid',
      extensions.crypt('DI05042009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر كليماني آية بنت محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'klimani.aya.168@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI05042009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر كليماني آية بنت محمد', 'klimani.aya.168@parents.darelihsan.invalid', 'klimani.aya.168', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [170] بن علي فاروق بن احمد
  select id into v_cid from public.children where membership_no = '170' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.ali.170@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.ali.170@parents.darelihsan.invalid',
      extensions.crypt('DI02102012', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن علي فاروق بن احمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.ali.170@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI02102012', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن علي فاروق بن احمد', 'ben.ali.170@parents.darelihsan.invalid', 'ben.ali.170', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [173] بن يحي الياس بن مختار
  select id into v_cid from public.children where membership_no = '173' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.yahia.173@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.yahia.173@parents.darelihsan.invalid',
      extensions.crypt('DI27102007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن يحي الياس بن مختار"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.yahia.173@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI27102007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن يحي الياس بن مختار', 'ben.yahia.173@parents.darelihsan.invalid', 'ben.yahia.173', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [176] كبير حاج الطيب بن بشير
  select id into v_cid from public.children where membership_no = '176' limit 1;
  select id into v_uid from auth.users where lower(email) = 'kebir.hadj.176@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'kebir.hadj.176@parents.darelihsan.invalid',
      extensions.crypt('DI21012014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر كبير حاج الطيب بن بشير"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'kebir.hadj.176@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI21012014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر كبير حاج الطيب بن بشير', 'kebir.hadj.176@parents.darelihsan.invalid', 'kebir.hadj.176', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [180] زرقون صفوان بن مصطفى
  select id into v_cid from public.children where membership_no = '180' limit 1;
  select id into v_uid from auth.users where lower(email) = 'zerguoun.safouane.180@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'zerguoun.safouane.180@parents.darelihsan.invalid',
      extensions.crypt('DI31052007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر زرقون صفوان بن مصطفى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'zerguoun.safouane.180@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI31052007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر زرقون صفوان بن مصطفى', 'zerguoun.safouane.180@parents.darelihsan.invalid', 'zerguoun.safouane.180', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [187] خروبي زكرياء بن عيسى
  select id into v_cid from public.children where membership_no = '187' limit 1;
  select id into v_uid from auth.users where lower(email) = 'kharoubi.zakaria.187@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'kharoubi.zakaria.187@parents.darelihsan.invalid',
      extensions.crypt('DI14042015', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر خروبي زكرياء بن عيسى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'kharoubi.zakaria.187@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI14042015', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر خروبي زكرياء بن عيسى', 'kharoubi.zakaria.187@parents.darelihsan.invalid', 'kharoubi.zakaria.187', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [188] اسكوتي عيسى بن عثمان
  select id into v_cid from public.children where membership_no = '188' limit 1;
  select id into v_uid from auth.users where lower(email) = 'skouti.aissa.188@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'skouti.aissa.188@parents.darelihsan.invalid',
      extensions.crypt('DI19062016', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر اسكوتي عيسى بن عثمان"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'skouti.aissa.188@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI19062016', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر اسكوتي عيسى بن عثمان', 'skouti.aissa.188@parents.darelihsan.invalid', 'skouti.aissa.188', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [189] الشرع ريان بن مختار
  select id into v_cid from public.children where membership_no = '189' limit 1;
  select id into v_uid from auth.users where lower(email) = 'chara.rayan.189@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'chara.rayan.189@parents.darelihsan.invalid',
      extensions.crypt('DI05012015', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر الشرع ريان بن مختار"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'chara.rayan.189@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI05012015', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر الشرع ريان بن مختار', 'chara.rayan.189@parents.darelihsan.invalid', 'chara.rayan.189', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [190] بن حمودة أيمن سليمان بن عمر
  select id into v_cid from public.children where membership_no = '190' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.hamouda.190@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.hamouda.190@parents.darelihsan.invalid',
      extensions.crypt('DI06092013', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن حمودة أيمن سليمان بن عمر"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.hamouda.190@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI06092013', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن حمودة أيمن سليمان بن عمر', 'ben.hamouda.190@parents.darelihsan.invalid', 'ben.hamouda.190', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [192] الشرع خالد بن مختار
  select id into v_cid from public.children where membership_no = '192' limit 1;
  select id into v_uid from auth.users where lower(email) = 'chara.khaled.192@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'chara.khaled.192@parents.darelihsan.invalid',
      extensions.crypt('DI16102013', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر الشرع خالد بن مختار"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'chara.khaled.192@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI16102013', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر الشرع خالد بن مختار', 'chara.khaled.192@parents.darelihsan.invalid', 'chara.khaled.192', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [196] بهشو اسماعيل بن سليمان
  select id into v_cid from public.children where membership_no = '196' limit 1;
  select id into v_uid from auth.users where lower(email) = 'behchou.smail.196@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'behchou.smail.196@parents.darelihsan.invalid',
      extensions.crypt('DI16052013', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بهشو اسماعيل بن سليمان"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'behchou.smail.196@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI16052013', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بهشو اسماعيل بن سليمان', 'behchou.smail.196@parents.darelihsan.invalid', 'behchou.smail.196', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [197] كليماني اية
  select id into v_cid from public.children where membership_no = '197' limit 1;
  select id into v_uid from auth.users where lower(email) = 'klimani.aya.197@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'klimani.aya.197@parents.darelihsan.invalid',
      extensions.crypt('DI23042014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر كليماني اية"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'klimani.aya.197@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI23042014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر كليماني اية', 'klimani.aya.197@parents.darelihsan.invalid', 'klimani.aya.197', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [198] بن ريم مروة بنت مروان
  select id into v_cid from public.children where membership_no = '198' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.rim.198@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.rim.198@parents.darelihsan.invalid',
      extensions.crypt('DI06022009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن ريم مروة بنت مروان"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.rim.198@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI06022009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن ريم مروة بنت مروان', 'ben.rim.198@parents.darelihsan.invalid', 'ben.rim.198', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [200] بن يوسف حاج ابراهيم بن نصر الدين
  select id into v_cid from public.children where membership_no = '200' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.youssef.200@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.youssef.200@parents.darelihsan.invalid',
      extensions.crypt('DI27122009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن يوسف حاج ابراهيم بن نصر الدين"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.youssef.200@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI27122009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن يوسف حاج ابراهيم بن نصر الدين', 'ben.youssef.200@parents.darelihsan.invalid', 'ben.youssef.200', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [201] باباعمر تيازيط زكرياء بن بشير
  select id into v_cid from public.children where membership_no = '201' limit 1;
  select id into v_uid from auth.users where lower(email) = 'babaomar.tiaziit.201@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'babaomar.tiaziit.201@parents.darelihsan.invalid',
      extensions.crypt('DI08072010', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر باباعمر تيازيط زكرياء بن بشير"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'babaomar.tiaziit.201@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI08072010', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر باباعمر تيازيط زكرياء بن بشير', 'babaomar.tiaziit.201@parents.darelihsan.invalid', 'babaomar.tiaziit.201', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [202] بكلي الحاج محمد بن احمد
  select id into v_cid from public.children where membership_no = '202' limit 1;
  select id into v_uid from auth.users where lower(email) = 'bakli.elhadj.202@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'bakli.elhadj.202@parents.darelihsan.invalid',
      extensions.crypt('DI13022012', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بكلي الحاج محمد بن احمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'bakli.elhadj.202@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI13022012', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بكلي الحاج محمد بن احمد', 'bakli.elhadj.202@parents.darelihsan.invalid', 'bakli.elhadj.202', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [204] ببو محمد بن العيد
  select id into v_cid from public.children where membership_no = '204' limit 1;
  select id into v_uid from auth.users where lower(email) = 'bebou.mohamed.204@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'bebou.mohamed.204@parents.darelihsan.invalid',
      extensions.crypt('DI01062008', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر ببو محمد بن العيد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'bebou.mohamed.204@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI01062008', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر ببو محمد بن العيد', 'bebou.mohamed.204@parents.darelihsan.invalid', 'bebou.mohamed.204', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [206] بن عافو يوسف بن عيسى
  select id into v_cid from public.children where membership_no = '206' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.afou.206@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.afou.206@parents.darelihsan.invalid',
      extensions.crypt('DI14072013', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن عافو يوسف بن عيسى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.afou.206@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI14072013', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن عافو يوسف بن عيسى', 'ben.afou.206@parents.darelihsan.invalid', 'ben.afou.206', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [209] قومار محمد ياسر بن حمزة
  select id into v_cid from public.children where membership_no = '209' limit 1;
  select id into v_uid from auth.users where lower(email) = 'goumar.mohamed.209@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'goumar.mohamed.209@parents.darelihsan.invalid',
      extensions.crypt('DI13042015', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر قومار محمد ياسر بن حمزة"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'goumar.mohamed.209@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI13042015', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر قومار محمد ياسر بن حمزة', 'goumar.mohamed.209@parents.darelihsan.invalid', 'goumar.mohamed.209', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [213] يعقوب نذير بن محمد
  select id into v_cid from public.children where membership_no = '213' limit 1;
  select id into v_uid from auth.users where lower(email) = 'yacoub.nadir.213@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'yacoub.nadir.213@parents.darelihsan.invalid',
      extensions.crypt('DI04112007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر يعقوب نذير بن محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'yacoub.nadir.213@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI04112007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر يعقوب نذير بن محمد', 'yacoub.nadir.213@parents.darelihsan.invalid', 'yacoub.nadir.213', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [216] ابي اسماعيل ياسين بن بعيسى
  select id into v_cid from public.children where membership_no = '216' limit 1;
  select id into v_uid from auth.users where lower(email) = 'abi.smail.216@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'abi.smail.216@parents.darelihsan.invalid',
      extensions.crypt('DI14012012', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر ابي اسماعيل ياسين بن بعيسى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'abi.smail.216@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI14012012', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر ابي اسماعيل ياسين بن بعيسى', 'abi.smail.216@parents.darelihsan.invalid', 'abi.smail.216', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [219] حاج امحمد اسماعيل بن ابراهيم
  select id into v_cid from public.children where membership_no = '219' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.mohamed.219@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.mohamed.219@parents.darelihsan.invalid',
      extensions.crypt('DI01122009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج امحمد اسماعيل بن ابراهيم"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.mohamed.219@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI01122009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج امحمد اسماعيل بن ابراهيم', 'hadj.mohamed.219@parents.darelihsan.invalid', 'hadj.mohamed.219', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [223] أولاد علي صوفيا بنت محمد
  select id into v_cid from public.children where membership_no = '223' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ouled.ali.223@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ouled.ali.223@parents.darelihsan.invalid',
      extensions.crypt('DI22012014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر أولاد علي صوفيا بنت محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ouled.ali.223@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI22012014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر أولاد علي صوفيا بنت محمد', 'ouled.ali.223@parents.darelihsan.invalid', 'ouled.ali.223', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [224] مسهل لؤي بن خالد
  select id into v_cid from public.children where membership_no = '224' limit 1;
  select id into v_uid from auth.users where lower(email) = 'mesehel.louai.224@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'mesehel.louai.224@parents.darelihsan.invalid',
      extensions.crypt('DI02062016', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر مسهل لؤي بن خالد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'mesehel.louai.224@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI02062016', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر مسهل لؤي بن خالد', 'mesehel.louai.224@parents.darelihsan.invalid', 'mesehel.louai.224', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [226] دهان عبد القادر بن يحي بن عيسى
  select id into v_cid from public.children where membership_no = '226' limit 1;
  select id into v_uid from auth.users where lower(email) = 'dahan.abd.226@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'dahan.abd.226@parents.darelihsan.invalid',
      extensions.crypt('DI19122013', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر دهان عبد القادر بن يحي بن عيسى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'dahan.abd.226@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI19122013', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر دهان عبد القادر بن يحي بن عيسى', 'dahan.abd.226@parents.darelihsan.invalid', 'dahan.abd.226', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [227] قبسي مهدي عبد الرزاق بن احمد
  select id into v_cid from public.children where membership_no = '227' limit 1;
  select id into v_uid from auth.users where lower(email) = 'gebsi.mehdi.227@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'gebsi.mehdi.227@parents.darelihsan.invalid',
      extensions.crypt('DI12052014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر قبسي مهدي عبد الرزاق بن احمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'gebsi.mehdi.227@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI12052014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر قبسي مهدي عبد الرزاق بن احمد', 'gebsi.mehdi.227@parents.darelihsan.invalid', 'gebsi.mehdi.227', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [228] حيمود اسامة بن مداني
  select id into v_cid from public.children where membership_no = '228' limit 1;
  select id into v_uid from auth.users where lower(email) = 'himoud.oussama.228@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'himoud.oussama.228@parents.darelihsan.invalid',
      extensions.crypt('DI20062007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حيمود اسامة بن مداني"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'himoud.oussama.228@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI20062007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حيمود اسامة بن مداني', 'himoud.oussama.228@parents.darelihsan.invalid', 'himoud.oussama.228', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [231] مهيري يوسف الصديق بن موسى
  select id into v_cid from public.children where membership_no = '231' limit 1;
  select id into v_uid from auth.users where lower(email) = 'mehiri.youssef.231@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'mehiri.youssef.231@parents.darelihsan.invalid',
      extensions.crypt('DI23022016', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر مهيري يوسف الصديق بن موسى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'mehiri.youssef.231@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI23022016', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر مهيري يوسف الصديق بن موسى', 'mehiri.youssef.231@parents.darelihsan.invalid', 'mehiri.youssef.231', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [236] حاج سعيد مسعودة سيرين بنت عمر
  select id into v_cid from public.children where membership_no = '236' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.said.236@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.said.236@parents.darelihsan.invalid',
      extensions.crypt('DI09072018', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج سعيد مسعودة سيرين بنت عمر"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.said.236@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI09072018', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج سعيد مسعودة سيرين بنت عمر', 'hadj.said.236@parents.darelihsan.invalid', 'hadj.said.236', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [238] بابا عمر تيازيط يحي بن مسعود
  select id into v_cid from public.children where membership_no = '238' limit 1;
  select id into v_uid from auth.users where lower(email) = 'baba.omar.238@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'baba.omar.238@parents.darelihsan.invalid',
      extensions.crypt('DI25072009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بابا عمر تيازيط يحي بن مسعود"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'baba.omar.238@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI25072009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بابا عمر تيازيط يحي بن مسعود', 'baba.omar.238@parents.darelihsan.invalid', 'baba.omar.238', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [239] بابا عمر تيازيط محمد بن مسعود
  select id into v_cid from public.children where membership_no = '239' limit 1;
  select id into v_uid from auth.users where lower(email) = 'baba.omar.239@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'baba.omar.239@parents.darelihsan.invalid',
      extensions.crypt('DI22122016', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بابا عمر تيازيط محمد بن مسعود"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'baba.omar.239@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI22122016', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بابا عمر تيازيط محمد بن مسعود', 'baba.omar.239@parents.darelihsan.invalid', 'baba.omar.239', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [240] بن موسى مريم بنت بلقاسم
  select id into v_cid from public.children where membership_no = '240' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.moussa.240@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.moussa.240@parents.darelihsan.invalid',
      extensions.crypt('DI23012014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن موسى مريم بنت بلقاسم"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.moussa.240@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI23012014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن موسى مريم بنت بلقاسم', 'ben.moussa.240@parents.darelihsan.invalid', 'ben.moussa.240', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [243] حاج امحمد مصطفى الامين بن ابراه
  select id into v_cid from public.children where membership_no = '243' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.mohamed.243@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.mohamed.243@parents.darelihsan.invalid',
      extensions.crypt('DI01021993', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج امحمد مصطفى الامين بن ابراه"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.mohamed.243@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI01021993', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج امحمد مصطفى الامين بن ابراه', 'hadj.mohamed.243@parents.darelihsan.invalid', 'hadj.mohamed.243', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [247] جرادة ابراهيم بن محمد
  select id into v_cid from public.children where membership_no = '247' limit 1;
  select id into v_uid from auth.users where lower(email) = 'djarada.brahim.247@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'djarada.brahim.247@parents.darelihsan.invalid',
      extensions.crypt('DI15012018', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر جرادة ابراهيم بن محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'djarada.brahim.247@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI15012018', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر جرادة ابراهيم بن محمد', 'djarada.brahim.247@parents.darelihsan.invalid', 'djarada.brahim.247', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [249] حاتة سليمان بن بكير
  select id into v_cid from public.children where membership_no = '249' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hata.slimane.249@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hata.slimane.249@parents.darelihsan.invalid',
      extensions.crypt('DI04022001', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاتة سليمان بن بكير"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hata.slimane.249@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI04022001', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاتة سليمان بن بكير', 'hata.slimane.249@parents.darelihsan.invalid', 'hata.slimane.249', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [250] حاج اسماعيل عائشة بنت محمد بن ا
  select id into v_cid from public.children where membership_no = '250' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.smail.250@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.smail.250@parents.darelihsan.invalid',
      extensions.crypt('DI08062021', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج اسماعيل عائشة بنت محمد بن ا"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.smail.250@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI08062021', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج اسماعيل عائشة بنت محمد بن ا', 'hadj.smail.250@parents.darelihsan.invalid', 'hadj.smail.250', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [251] سعيد فاطمة الزهراء بنت صلاح الدين
  select id into v_cid from public.children where membership_no = '251' limit 1;
  select id into v_uid from auth.users where lower(email) = 'said.fatima.251@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'said.fatima.251@parents.darelihsan.invalid',
      extensions.crypt('DI26062009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر سعيد فاطمة الزهراء بنت صلاح الدين"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'said.fatima.251@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI26062009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر سعيد فاطمة الزهراء بنت صلاح الدين', 'said.fatima.251@parents.darelihsan.invalid', 'said.fatima.251', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [254] بوال مصطفى بن إدريس
  select id into v_cid from public.children where membership_no = '254' limit 1;
  select id into v_uid from auth.users where lower(email) = 'boual.mustapha.254@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'boual.mustapha.254@parents.darelihsan.invalid',
      extensions.crypt('DI13042012', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بوال مصطفى بن إدريس"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'boual.mustapha.254@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI13042012', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بوال مصطفى بن إدريس', 'boual.mustapha.254@parents.darelihsan.invalid', 'boual.mustapha.254', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [255] بن خليفة ريهام شهد بنت محمد
  select id into v_cid from public.children where membership_no = '255' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.khelifa.255@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.khelifa.255@parents.darelihsan.invalid',
      extensions.crypt('DI25072009', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن خليفة ريهام شهد بنت محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.khelifa.255@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI25072009', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن خليفة ريهام شهد بنت محمد', 'ben.khelifa.255@parents.darelihsan.invalid', 'ben.khelifa.255', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [256] بن احمد انس عبد الجليل بن أحمد
  select id into v_cid from public.children where membership_no = '256' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.ahmed.256@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.ahmed.256@parents.darelihsan.invalid',
      extensions.crypt('DI12112017', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن احمد انس عبد الجليل بن أحمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.ahmed.256@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI12112017', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن احمد انس عبد الجليل بن أحمد', 'ben.ahmed.256@parents.darelihsan.invalid', 'ben.ahmed.256', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [257] الشامخة عبد الرزاق حفيظ بن مصطفى
  select id into v_cid from public.children where membership_no = '257' limit 1;
  select id into v_uid from auth.users where lower(email) = 'chamikha.abd.257@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'chamikha.abd.257@parents.darelihsan.invalid',
      extensions.crypt('DI03122017', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر الشامخة عبد الرزاق حفيظ بن مصطفى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'chamikha.abd.257@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI03122017', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر الشامخة عبد الرزاق حفيظ بن مصطفى', 'chamikha.abd.257@parents.darelihsan.invalid', 'chamikha.abd.257', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [258] اولاد الشيخ انس عبد العليم بن محمد
  select id into v_cid from public.children where membership_no = '258' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ouled.cheikh.258@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ouled.cheikh.258@parents.darelihsan.invalid',
      extensions.crypt('DI02072018', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر اولاد الشيخ انس عبد العليم بن محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ouled.cheikh.258@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI02072018', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر اولاد الشيخ انس عبد العليم بن محمد', 'ouled.cheikh.258@parents.darelihsan.invalid', 'ouled.cheikh.258', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [259] عيسى عز الدين بن بكير
  select id into v_cid from public.children where membership_no = '259' limit 1;
  select id into v_uid from auth.users where lower(email) = 'aissa.ezz.259@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'aissa.ezz.259@parents.darelihsan.invalid',
      extensions.crypt('DI28082010', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر عيسى عز الدين بن بكير"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'aissa.ezz.259@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI28082010', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر عيسى عز الدين بن بكير', 'aissa.ezz.259@parents.darelihsan.invalid', 'aissa.ezz.259', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [263] سالم يوسف بن حمو
  select id into v_cid from public.children where membership_no = '263' limit 1;
  select id into v_uid from auth.users where lower(email) = 'salem.youssef.263@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'salem.youssef.263@parents.darelihsan.invalid',
      extensions.crypt('DI09022008', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر سالم يوسف بن حمو"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'salem.youssef.263@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI09022008', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر سالم يوسف بن حمو', 'salem.youssef.263@parents.darelihsan.invalid', 'salem.youssef.263', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [264] هامل سحر بنت أحمد بن صالح
  select id into v_cid from public.children where membership_no = '264' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hamel.sihem.264@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hamel.sihem.264@parents.darelihsan.invalid',
      extensions.crypt('DI04062007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر هامل سحر بنت أحمد بن صالح"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hamel.sihem.264@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI04062007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر هامل سحر بنت أحمد بن صالح', 'hamel.sihem.264@parents.darelihsan.invalid', 'hamel.sihem.264', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [265] هامل عبد الحي بن أحمد بن صالح
  select id into v_cid from public.children where membership_no = '265' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hamel.abd.265@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hamel.abd.265@parents.darelihsan.invalid',
      extensions.crypt('DI29072010', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر هامل عبد الحي بن أحمد بن صالح"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hamel.abd.265@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI29072010', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر هامل عبد الحي بن أحمد بن صالح', 'hamel.abd.265@parents.darelihsan.invalid', 'hamel.abd.265', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [267] بلولو الحاج ابراهيم بن رمضان
  select id into v_cid from public.children where membership_no = '267' limit 1;
  select id into v_uid from auth.users where lower(email) = 'belloulou.elhadj.267@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'belloulou.elhadj.267@parents.darelihsan.invalid',
      extensions.crypt('DI14082010', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بلولو الحاج ابراهيم بن رمضان"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'belloulou.elhadj.267@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI14082010', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بلولو الحاج ابراهيم بن رمضان', 'belloulou.elhadj.267@parents.darelihsan.invalid', 'belloulou.elhadj.267', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [273] الواهج بكير بن صالح
  select id into v_cid from public.children where membership_no = '273' limit 1;
  select id into v_uid from auth.users where lower(email) = 'elouahedj.bakir.273@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'elouahedj.bakir.273@parents.darelihsan.invalid',
      extensions.crypt('DI15121988', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر الواهج بكير بن صالح"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'elouahedj.bakir.273@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI15121988', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر الواهج بكير بن صالح', 'elouahedj.bakir.273@parents.darelihsan.invalid', 'elouahedj.bakir.273', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [274] توهامي ريم بنت توفيق
  select id into v_cid from public.children where membership_no = '274' limit 1;
  select id into v_uid from auth.users where lower(email) = 'touhami.rim.274@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'touhami.rim.274@parents.darelihsan.invalid',
      extensions.crypt('DI03062014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر توهامي ريم بنت توفيق"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'touhami.rim.274@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI03062014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر توهامي ريم بنت توفيق', 'touhami.rim.274@parents.darelihsan.invalid', 'touhami.rim.274', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [275] أولاد حاجو مامة مالك بنت صالح
  select id into v_cid from public.children where membership_no = '275' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ouled.hadjou.275@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ouled.hadjou.275@parents.darelihsan.invalid',
      extensions.crypt('DI07052015', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر أولاد حاجو مامة مالك بنت صالح"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ouled.hadjou.275@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI07052015', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر أولاد حاجو مامة مالك بنت صالح', 'ouled.hadjou.275@parents.darelihsan.invalid', 'ouled.hadjou.275', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [276] صديقي محمد الامين بن مراد
  select id into v_cid from public.children where membership_no = '276' limit 1;
  select id into v_uid from auth.users where lower(email) = 'seddiki.mohamed.276@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'seddiki.mohamed.276@parents.darelihsan.invalid',
      extensions.crypt('DI14032014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر صديقي محمد الامين بن مراد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'seddiki.mohamed.276@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI14032014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر صديقي محمد الامين بن مراد', 'seddiki.mohamed.276@parents.darelihsan.invalid', 'seddiki.mohamed.276', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [279] قندوز نهال بنت نصر الدين
  select id into v_cid from public.children where membership_no = '279' limit 1;
  select id into v_uid from auth.users where lower(email) = 'kendouz.nihal.279@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'kendouz.nihal.279@parents.darelihsan.invalid',
      extensions.crypt('DI18062012', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر قندوز نهال بنت نصر الدين"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'kendouz.nihal.279@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI18062012', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر قندوز نهال بنت نصر الدين', 'kendouz.nihal.279@parents.darelihsan.invalid', 'kendouz.nihal.279', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [280] مطياز توفيق بن محمد
  select id into v_cid from public.children where membership_no = '280' limit 1;
  select id into v_uid from auth.users where lower(email) = 'metiaz.toufik.280@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'metiaz.toufik.280@parents.darelihsan.invalid',
      extensions.crypt('DI01092001', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر مطياز توفيق بن محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'metiaz.toufik.280@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI01092001', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر مطياز توفيق بن محمد', 'metiaz.toufik.280@parents.darelihsan.invalid', 'metiaz.toufik.280', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [281] عكيف عبد الجليل طه بن أحمد
  select id into v_cid from public.children where membership_no = '281' limit 1;
  select id into v_uid from auth.users where lower(email) = 'akif.abd.281@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'akif.abd.281@parents.darelihsan.invalid',
      extensions.crypt('DI15062003', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر عكيف عبد الجليل طه بن أحمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'akif.abd.281@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI15062003', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر عكيف عبد الجليل طه بن أحمد', 'akif.abd.281@parents.darelihsan.invalid', 'akif.abd.281', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [283] داودي سهام بنت محمد
  select id into v_cid from public.children where membership_no = '283' limit 1;
  select id into v_uid from auth.users where lower(email) = 'daoudi.siham.283@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'daoudi.siham.283@parents.darelihsan.invalid',
      extensions.crypt('DI17022015', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر داودي سهام بنت محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'daoudi.siham.283@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI17022015', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر داودي سهام بنت محمد', 'daoudi.siham.283@parents.darelihsan.invalid', 'daoudi.siham.283', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [288] حاج عيسى فخار عيسى بن يونس
  select id into v_cid from public.children where membership_no = '288' limit 1;
  select id into v_uid from auth.users where lower(email) = 'hadj.aissa.288@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'hadj.aissa.288@parents.darelihsan.invalid',
      extensions.crypt('DI18081995', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر حاج عيسى فخار عيسى بن يونس"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'hadj.aissa.288@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI18081995', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر حاج عيسى فخار عيسى بن يونس', 'hadj.aissa.288@parents.darelihsan.invalid', 'hadj.aissa.288', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [289] بنورة منير بن محمد
  select id into v_cid from public.children where membership_no = '289' limit 1;
  select id into v_uid from auth.users where lower(email) = 'bennoura.mounir.289@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'bennoura.mounir.289@parents.darelihsan.invalid',
      extensions.crypt('DI01012015', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بنورة منير بن محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'bennoura.mounir.289@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI01012015', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بنورة منير بن محمد', 'bennoura.mounir.289@parents.darelihsan.invalid', 'bennoura.mounir.289', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [291] داودي ربيع بن بايوب
  select id into v_cid from public.children where membership_no = '291' limit 1;
  select id into v_uid from auth.users where lower(email) = 'daoudi.rabie.291@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'daoudi.rabie.291@parents.darelihsan.invalid',
      extensions.crypt('DI24022014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر داودي ربيع بن بايوب"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'daoudi.rabie.291@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI24022014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر داودي ربيع بن بايوب', 'daoudi.rabie.291@parents.darelihsan.invalid', 'daoudi.rabie.291', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [293] ريغي اية بنت الشيخ
  select id into v_cid from public.children where membership_no = '293' limit 1;
  select id into v_uid from auth.users where lower(email) = 'righi.aya.293@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'righi.aya.293@parents.darelihsan.invalid',
      extensions.crypt('DI01072021', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر ريغي اية بنت الشيخ"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'righi.aya.293@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI01072021', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر ريغي اية بنت الشيخ', 'righi.aya.293@parents.darelihsan.invalid', 'righi.aya.293', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [296] عباس لقمان بن يحي
  select id into v_cid from public.children where membership_no = '296' limit 1;
  select id into v_uid from auth.users where lower(email) = 'abbas.lokmane.296@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'abbas.lokmane.296@parents.darelihsan.invalid',
      extensions.crypt('DI12052017', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر عباس لقمان بن يحي"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'abbas.lokmane.296@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI12052017', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر عباس لقمان بن يحي', 'abbas.lokmane.296@parents.darelihsan.invalid', 'abbas.lokmane.296', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [297] الشيخ محمد المهدي بن عيسى
  select id into v_cid from public.children where membership_no = '297' limit 1;
  select id into v_uid from auth.users where lower(email) = 'cheikh.mohamed.297@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'cheikh.mohamed.297@parents.darelihsan.invalid',
      extensions.crypt('DI17122016', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر الشيخ محمد المهدي بن عيسى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'cheikh.mohamed.297@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI17122016', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر الشيخ محمد المهدي بن عيسى', 'cheikh.mohamed.297@parents.darelihsan.invalid', 'cheikh.mohamed.297', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [301] اسماوي ايوب بن عبد السلام
  select id into v_cid from public.children where membership_no = '301' limit 1;
  select id into v_uid from auth.users where lower(email) = 'asmaoui.ayoub.301@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'asmaoui.ayoub.301@parents.darelihsan.invalid',
      extensions.crypt('DI15122018', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر اسماوي ايوب بن عبد السلام"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'asmaoui.ayoub.301@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI15122018', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر اسماوي ايوب بن عبد السلام', 'asmaoui.ayoub.301@parents.darelihsan.invalid', 'asmaoui.ayoub.301', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [305] يحي الشريف خديجة بنت فاروق
  select id into v_cid from public.children where membership_no = '305' limit 1;
  select id into v_uid from auth.users where lower(email) = 'yahia.cherif.305@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'yahia.cherif.305@parents.darelihsan.invalid',
      extensions.crypt('DI23092022', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر يحي الشريف خديجة بنت فاروق"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'yahia.cherif.305@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI23092022', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر يحي الشريف خديجة بنت فاروق', 'yahia.cherif.305@parents.darelihsan.invalid', 'yahia.cherif.305', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [306] بن صغير ياسين بن احمد
  select id into v_cid from public.children where membership_no = '306' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.seghir.306@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.seghir.306@parents.darelihsan.invalid',
      extensions.crypt('DI31072015', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن صغير ياسين بن احمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.seghir.306@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI31072015', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن صغير ياسين بن احمد', 'ben.seghir.306@parents.darelihsan.invalid', 'ben.seghir.306', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [307] غبشي نورالهدى بنت يوسف
  select id into v_cid from public.children where membership_no = '307' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ghebchi.nourelhouda.307@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ghebchi.nourelhouda.307@parents.darelihsan.invalid',
      extensions.crypt('DI07092014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر غبشي نورالهدى بنت يوسف"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ghebchi.nourelhouda.307@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI07092014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر غبشي نورالهدى بنت يوسف', 'ghebchi.nourelhouda.307@parents.darelihsan.invalid', 'ghebchi.nourelhouda.307', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [310] داودي الحاج يحي بن باحمد
  select id into v_cid from public.children where membership_no = '310' limit 1;
  select id into v_uid from auth.users where lower(email) = 'daoudi.elhadj.310@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'daoudi.elhadj.310@parents.darelihsan.invalid',
      extensions.crypt('DI24062007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر داودي الحاج يحي بن باحمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'daoudi.elhadj.310@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI24062007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر داودي الحاج يحي بن باحمد', 'daoudi.elhadj.310@parents.darelihsan.invalid', 'daoudi.elhadj.310', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [311] الشيخ دحمان مامة بنت دحمان
  select id into v_cid from public.children where membership_no = '311' limit 1;
  select id into v_uid from auth.users where lower(email) = 'cheikh.dahmane.311@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'cheikh.dahmane.311@parents.darelihsan.invalid',
      extensions.crypt('DI10022016', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر الشيخ دحمان مامة بنت دحمان"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'cheikh.dahmane.311@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI10022016', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر الشيخ دحمان مامة بنت دحمان', 'cheikh.dahmane.311@parents.darelihsan.invalid', 'cheikh.dahmane.311', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [312] بن يونس يسرى بنت مصطفى
  select id into v_cid from public.children where membership_no = '312' limit 1;
  select id into v_uid from auth.users where lower(email) = 'ben.younes.312@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'ben.younes.312@parents.darelihsan.invalid',
      extensions.crypt('DI09092007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بن يونس يسرى بنت مصطفى"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'ben.younes.312@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI09092007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن يونس يسرى بنت مصطفى', 'ben.younes.312@parents.darelihsan.invalid', 'ben.younes.312', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [313] لعزيز ياسمين بنت سيراج
  select id into v_cid from public.children where membership_no = '313' limit 1;
  select id into v_uid from auth.users where lower(email) = 'laaziz.yasmine.313@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'laaziz.yasmine.313@parents.darelihsan.invalid',
      extensions.crypt('DI30122013', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر لعزيز ياسمين بنت سيراج"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'laaziz.yasmine.313@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI30122013', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر لعزيز ياسمين بنت سيراج', 'laaziz.yasmine.313@parents.darelihsan.invalid', 'laaziz.yasmine.313', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [314] نوح مفنون أمين بن البشير
  select id into v_cid from public.children where membership_no = '314' limit 1;
  select id into v_uid from auth.users where lower(email) = 'nouh.mefnoun.314@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'nouh.mefnoun.314@parents.darelihsan.invalid',
      extensions.crypt('DI05012007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر نوح مفنون أمين بن البشير"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'nouh.mefnoun.314@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI05012007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر نوح مفنون أمين بن البشير', 'nouh.mefnoun.314@parents.darelihsan.invalid', 'nouh.mefnoun.314', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [315] بورزمة ابراهيم بن محمد
  select id into v_cid from public.children where membership_no = '315' limit 1;
  select id into v_uid from auth.users where lower(email) = 'bourezma.brahim.315@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'bourezma.brahim.315@parents.darelihsan.invalid',
      extensions.crypt('DI11082021', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بورزمة ابراهيم بن محمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'bourezma.brahim.315@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI11082021', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بورزمة ابراهيم بن محمد', 'bourezma.brahim.315@parents.darelihsan.invalid', 'bourezma.brahim.315', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [316] زيطاري نور سين بنت خليل
  select id into v_cid from public.children where membership_no = '316' limit 1;
  select id into v_uid from auth.users where lower(email) = 'zitari.nour.316@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'zitari.nour.316@parents.darelihsan.invalid',
      extensions.crypt('DI21092020', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر زيطاري نور سين بنت خليل"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'zitari.nour.316@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI21092020', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر زيطاري نور سين بنت خليل', 'zitari.nour.316@parents.darelihsan.invalid', 'zitari.nour.316', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [317] داودي طه بن علي
  select id into v_cid from public.children where membership_no = '317' limit 1;
  select id into v_uid from auth.users where lower(email) = 'daoudi.taha.317@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'daoudi.taha.317@parents.darelihsan.invalid',
      extensions.crypt('DI06062007', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر داودي طه بن علي"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'daoudi.taha.317@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI06062007', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر داودي طه بن علي', 'daoudi.taha.317@parents.darelihsan.invalid', 'daoudi.taha.317', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [318] جبريط سعد الدين بن بدر الدين
  select id into v_cid from public.children where membership_no = '318' limit 1;
  select id into v_uid from auth.users where lower(email) = 'djebrit.saad.318@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'djebrit.saad.318@parents.darelihsan.invalid',
      extensions.crypt('DI10052014', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر جبريط سعد الدين بن بدر الدين"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'djebrit.saad.318@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI10052014', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر جبريط سعد الدين بن بدر الدين', 'djebrit.saad.318@parents.darelihsan.invalid', 'djebrit.saad.318', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

  -- [320] بيتور محمد اسحاق بن بن يعيش
  select id into v_cid from public.children where membership_no = '320' limit 1;
  select id into v_uid from auth.users where lower(email) = 'bitour.mohamed.320@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token)
    values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', 'bitour.mohamed.320@parents.darelihsan.invalid',
      extensions.crypt('DI24032019', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"ولي أمر بيتور محمد اسحاق بن بن يعيش"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid,
            jsonb_build_object('sub', v_uid::text, 'email', 'bitour.mohamed.320@parents.darelihsan.invalid', 'email_verified', true),
            'email', v_uid::text, now(), now(), now());
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI24032019', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now()
     where id = v_uid;
  end if;
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بيتور محمد اسحاق بن بن يعيش', 'bitour.mohamed.320@parents.darelihsan.invalid', 'bitour.mohamed.320', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name, email = excluded.email, username = excluded.username, disabled = false;
  if v_cid is not null then
    insert into public.parent_children (parent_id, child_id)
    values (v_uid, v_cid)
    on conflict (parent_id, child_id) do nothing;
  end if;

end $$;

notify pgrst, 'reload schema';
-- تم إنشاء وتفعيل 103 حساب ولي بنجاح.