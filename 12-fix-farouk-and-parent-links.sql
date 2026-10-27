-- =====================================================================
-- 12-fix-farouk-and-parent-links.sql
-- إصلاح ومزامنة حساب الطالب بن علي فاروق بن احمد وكافة روابط الأولياء
-- المركز النفسي البيداغوجي دار الإحسان — العطف غرداية
-- =====================================================================

do $$
declare
  v_cid uuid;
  v_uid uuid;
  v_sec uuid;
  v_branch uuid;
begin
  -- 1) التأكد من قسم الشبه مدرسي مكيف والفرع الرئيسي
  select id into v_branch from public.branches where slug = 'main' limit 1;
  select id into v_sec from public.sections where slug = 'sec_shibh_madrasi' limit 1;

  -- 2) التأكد من وجود سجل الطالب بن علي فاروق بن احمد (رقم القيد 170)
  select id into v_cid from public.children where membership_no = '170' limit 1;
  if v_cid is null then
    v_cid := '00000000-0000-4000-8000-000000000170'::uuid;
    insert into public.children (
      id, membership_no, full_name, dob, phone, disability,
      center, branch_id, section_id, section, academic_year, active
    ) values (
      v_cid, '170', 'بن علي فاروق بن احمد', '2012-10-02', '066164908', 'متلازمة داون T.21',
      'main', v_branch, v_sec, 'قسم الشبه مدرسي مكيف', '2026-2027', true
    )
    on conflict (membership_no) do update set
      full_name = excluded.full_name,
      dob = excluded.dob,
      phone = excluded.phone,
      disability = excluded.disability,
      center = excluded.center,
      branch_id = excluded.branch_id,
      section_id = excluded.section_id,
      section = excluded.section,
      academic_year = excluded.academic_year,
      active = true;
  else
    update public.children
       set full_name = 'بن علي فاروق بن احمد',
           dob = '2012-10-02',
           phone = '066164908',
           disability = 'متلازمة داون T.21',
           center = 'main',
           section = 'قسم الشبه مدرسي مكيف',
           branch_id = coalesce(branch_id, v_branch),
           section_id = coalesce(section_id, v_sec),
           academic_year = '2026-2027',
           active = true
     where id = v_cid;
  end if;

  -- 3) التأكد من وجود حساب الولي في auth.users
  select id into v_uid from auth.users where lower(email) = 'ben.ali.170@parents.darelihsan.invalid' limit 1;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'ben.ali.170@parents.darelihsan.invalid',
      extensions.crypt('DI02102012', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"ولي أمر بن علي فاروق بن احمد"}'::jsonb, now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'ben.ali.170@parents.darelihsan.invalid', 'email_verified', true),
      'email', v_uid::text, now(), now(), now()
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt('DI02102012', extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_uid;
  end if;

  -- 4) تحديث ملف الولي في public.parent_profiles
  insert into public.parent_profiles (user_id, full_name, email, username, disabled)
  values (v_uid, 'ولي أمر بن علي فاروق بن احمد', 'ben.ali.170@parents.darelihsan.invalid', 'ben.ali.170', false)
  on conflict (user_id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        username = excluded.username,
        disabled = false;

  -- 5) ربط الولي بالطالب في public.parent_children
  insert into public.parent_children (parent_id, child_id, relation)
  values (v_uid, v_cid, 'ولي أمر')
  on conflict (parent_id, child_id) do update
    set relation = excluded.relation;

  raise notice 'تم فحص وتثبيت حساب ورابط الطالب بن علي فاروق بن احمد بنجاح.';
end $$;

-- 6) ربط تلقائي شامل لجميع حسابات الأولياء المتبقية مع أطفالهم حسب رقم القيد
do $$
declare
  r record;
  v_child_id uuid;
begin
  for r in (
    select id as user_id, email,
           substring(lower(email) from '\.([0-9]{3})@') as mno
      from auth.users
     where email like '%@parents.darelihsan.invalid'
  ) loop
    if r.mno is not null then
      select id into v_child_id from public.children where membership_no = r.mno limit 1;
      if v_child_id is not null then
        insert into public.parent_children (parent_id, child_id, relation)
        values (r.user_id, v_child_id, 'ولي أمر')
        on conflict (parent_id, child_id) do nothing;
      end if;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
