-- =====================================================================
-- 06) مزامنة ملفات الإعداد مع قاعدة البيانات الحية (2026-10-22)
-- آمن لإعادة التشغيل أكثر من مرة (idempotent). لا يحذف أي بيانات.
-- يُطبَّق بعد 00/02/05. يوثّق تعديلات أُجريت مباشرة على القاعدة:
--   1) عمود اسم المستخدم لحسابات الأولياء + فهرسه الفريد.
--   2) دالة QR العامة تُرجع: الاسم، المركز، رقم القيد، القسم، تاريخ الميلاد،
--      طبيعة الإعاقة، الموسم الدراسي. (ملاحظات الولي basic_info لا تُعاد أبدًا.)
--   3) دالة get_public_child كما هي حاليًا.
--   4) دالة سجل العمليات بتوقيعها الحالي (مع الفلترة والإزاحة).
-- ملاحظة: حسابات الأولياء تُنشأ عبر الدالة الخلفية parent-accounts (الإصدار 2)
--         وليس عبر SQL؛ ملفها في مجلد supabase-functions/parent-accounts.
-- =====================================================================

-- 1) اسم المستخدم لحساب الولي
alter table public.parent_profiles add column if not exists username text;
create unique index if not exists parent_profiles_username_uq
  on public.parent_profiles (lower(username)) where username is not null;

-- 2) دالة QR العامة (بطاقة التلميذ)
create or replace function public.public_child_card(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare r public.children%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return jsonb_build_object('found', false);
  end if;
  select * into r from public.children where qr_token = p_token and active;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  return jsonb_build_object(
    'found', true,
    'full_name', r.full_name,
    'center', r.center,
    'membership_no', r.membership_no,
    'member_no', r.membership_no,
    'section', case when coalesce(r.qr_show_extra, false) then r.section else null end,
    'dob', case when coalesce(r.qr_show_extra, false) then r.dob else null end,
    'disability', null,
    'academic_year', r.academic_year
  );
end $function$;
revoke all on function public.public_child_card(text) from public;
grant execute on function public.public_child_card(text) to anon, authenticated;

-- 3) get_public_child (للروابط القديمة المطبوعة)
create or replace function public.get_public_child(p_uuid uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select jsonb_build_object(
    'membership_no', coalesce(c.membership_no, '—'),
    'full_name', c.full_name,
    'branch', coalesce(b.name, 'المركز الرئيسي لدار الإحسان')
  )
  from public.children c
  left join public.sections s on s.id = c.section_id
  left join public.branches b on b.id = coalesce(c.branch_id, s.branch_id)
  where c.public_uuid = p_uuid and c.active;
$function$;

-- 4) سجل العمليات بتوقيعه الحالي
create or replace function public.admin_audit_list(
  p_limit integer default 100, p_action_filter text default null, p_offset integer default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'غير مصرّح' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('at', t.at, 'actor_email', t.actor_email, 'action', t.action, 'target', t.target) order by t.id desc)
    from (select * from public.admin_audit
           where (p_action_filter is null or action like p_action_filter || '%')
           order by id desc
           limit least(greatest(coalesce(p_limit, 100), 1), 500)
           offset greatest(coalesce(p_offset, 0), 0)) t
  ), '[]'::jsonb);
end $function$;


-- =====================================================================
-- 7) إنشاء وتفعيل حسابات جميع الموظفين الـ 16 (برقم الهاتف + DIتاريخ_الميلاد)
--    وإسناد كل موظف ومربية إلى مركزه وقسمه وحذف أي مربية في قسم الاستثارة
-- =====================================================================
create or replace function public.import_official_staff_accounts()
returns int
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  r record;
  v_email text;
  v_pw text;
  v_uid uuid;
  v_sec_id uuid;
  v_count int := 0;
  v_educators jsonb := '[]'::jsonb;
  v_acc_meta jsonb := '{}'::jsonb;
  v_draft_data jsonb;
begin
  -- جدول مؤقت لبيانات الموظفين الـ 16 من القائمة الرسمية
  drop table if exists temp_staff_data;
  create temporary table temp_staff_data (
    staff_id     text,
    emp_no       text,
    full_name    text,
    dob          date,
    phone        text,
    center_code  text,
    role_kind    text,
    job_title    text,
    section_slug text,
    section_name text
  ) on commit drop;

  insert into temp_staff_data (staff_id, emp_no, full_name, dob, phone, center_code, role_kind, job_title, section_slug, section_name) values
    -- المركز الرئيسي دار الإحسان (المركز النفسي البيداغوجي)
    ('staff-001', '1',   'أمير زكرياء بن عبد الله',           '1993-05-11', '0540817775', 'main', 'admin',    'مدير المركز',              null,                'المركز الرئيسي دار الإحسان'),
    ('staff-002', '2',   'الخلفاوي حمودة بن يحي',             '1986-05-03', '0550647516', 'main', 'admin',    'عون إداري',                null,                'المركز الرئيسي دار الإحسان'),
    ('staff-010', '10',  'نواري اسماء بنت جيلالي',            '2001-08-14', '0655806951', 'main', 'admin',    'أخصائية نفسانية',          null,                'المركز الرئيسي دار الإحسان'),
    ('staff-017', '17',  'فضاض خولة بنت الشيخ بن أحمد',       '1998-02-05', '0555905565', 'main', 'educator', 'مربية',                    'sec_tafatan_1',     'التفطين 1 تأخر ذهني'),
    ('staff-047', '47',  'الرمة فاطمة الزهراء بنت أحمد',      '1998-07-28', '0663412874', 'main', 'educator', 'مربية',                    'sec_autism_1',      'توحد 01'),
    ('staff-058', '58',  'قوطارة جميلة بنت مبروك',            '1993-06-19', '0676160618', 'main', 'educator', 'مربية',                    'sec_shibh_madrasi', 'قسم الشبه مدرسي مكيف'),
    ('staff-103', '103', 'بوقانون فيروز بنت مسعود',           '1980-10-10', '0657929247', 'main', 'educator', 'مربية',                    'sec_observation',   'الملاحظة جدد'),
    ('staff-104', '104', 'ميزات صارة بنت أحمد',               '1991-02-09', '0697626616', 'main', 'educator', 'مربية',                    'sec_khariji',       'الخارجي اعاقة شديدة'),
    ('staff-105', '105', 'قريدة عيدة بنت موسى',               '1970-02-18', '0657929291', 'main', 'educator', 'مربية',                    'sec_tafatan_2',     'التفطين 2 متلازمة داون'),
    ('staff-111', '111', 'باحمد صليحة بنت نور الدين',         '1996-11-19', '0552698775', 'main', 'educator', 'مربية',                    'sec_autism_2',      'التوحد 02'),
    ('staff-113', '113', 'بن دربال نسيبة بنت محمد',           '1985-11-25', '0667941590', 'main', 'educator', 'مربية',                    'sec_autism_3',      'توحد 03'),

    -- مركز المساعدة على العمل (مركز التمهين CAT)
    ('staff-099', '99',  'عبد الصمد عصام بن خميسي',           '1981-12-17', '0662744988', 'work', 'admin',    'رئيس مصلحة',               'sec_tamhin',        'التمهين م م ع'),
    ('staff-004', '4',   'لهزيل زينب بنت أحمد',               '1984-10-14', '0668640481', 'work', 'educator', 'مربية',                    'sec_tamhin',        'التمهين م م ع'),
    ('staff-038', '38',  'جلود عبد السلام بن الشيخ بن قويدر', '1996-09-30', '0657855528', 'work', 'educator', 'مربي',                     'sec_tamhin',        'التمهين م م ع'),
    ('staff-107', '107', 'سيروكان بشرى بنت احمد',             '2011-04-25', '0652676768', 'work', 'educator', 'مساعدة مربية',             'sec_tamhin',        'التمهين م م ع'),

    -- المزرعة البيداغوجية (البستنة)
    ('staff-074', '74',  'طالب باحمد ياسين بن عيسى',          '2007-10-22', '0664359676', 'farm', 'educator', 'مربي المزرعة البيداغوجية', 'sec_bostana',       'المزرعة البستنة');

  for r in select * from temp_staff_data loop
    v_email := 'edu.' || r.phone || '@darelihsan.org';
    -- كلمة المرور = DI + اليوم والشهر والسنة (DDMMYYYY) من تاريخ الميلاد
    v_pw := 'DI' || to_char(r.dob, 'DDMMYYYY');

    v_sec_id := null;
    if r.section_slug is not null then
      select id into v_sec_id from public.sections where slug = r.section_slug limit 1;
    end if;

    select u.id into v_uid from auth.users u where lower(u.email) = v_email limit 1;
    if v_uid is null then
      v_uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
        extensions.crypt(v_pw, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', r.full_name, 'phone', r.phone, 'center', r.center_code, 'job_title', r.job_title),
        now(), now(),
        '', '', '', '', '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', v_uid::text, now(), now(), now()
      );
    else
      update auth.users
         set encrypted_password = extensions.crypt(v_pw, extensions.gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', r.full_name, 'phone', r.phone, 'center', r.center_code, 'job_title', r.job_title),
             updated_at = now()
       where id = v_uid;
    end if;

    insert into public.admins (user_id, role, disabled)
    values (v_uid, 'admin', false)
    on conflict (user_id) do update set role = 'admin', disabled = false;

    if r.role_kind = 'educator' then
      v_educators := v_educators || jsonb_build_array(jsonb_build_object(
        'id', r.staff_id,
        'emp_no', r.emp_no,
        'full_name', r.full_name,
        'dob', to_char(r.dob, 'YYYY-MM-DD'),
        'phone', r.phone,
        'email', v_email,
        'center', r.center_code,
        'job_title', r.job_title,
        'section_id', coalesce(v_sec_id::text, ''),
        'section_name', r.section_name,
        'has_account', true,
        'updated_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ));
    end if;

    v_acc_meta := v_acc_meta || jsonb_build_object(
      v_email, jsonb_build_object(
        'role', r.role_kind,
        'educator_id', case when r.role_kind = 'educator' then r.staff_id else null end,
        'emp_no', r.emp_no,
        'full_name', r.full_name,
        'dob', to_char(r.dob, 'YYYY-MM-DD'),
        'phone', r.phone,
        'center', r.center_code,
        'center_access', r.center_code,
        'job_title', r.job_title,
        'section_id', coalesce(v_sec_id::text, ''),
        'section_name', r.section_name,
        'has_account', true,
        'updated_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
    );

    v_count := v_count + 1;
  end loop;

  -- حفظ بيانات المربيات وحسابات المراكز في site_content (draft) مع إزالة أي مربية تجريبية في قسم الاستثارة
  select coalesce(data, '{}'::jsonb) into v_draft_data from public.site_content where id = 'draft';
  v_draft_data := jsonb_set(
    coalesce(v_draft_data, '{}'::jsonb),
    '{_portal_meta}',
    jsonb_build_object('educators', v_educators, 'account_meta', v_acc_meta),
    true
  );

  insert into public.site_content (id, data, updated_at)
  values ('draft', v_draft_data, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();

  return v_count;
end;
$$;
revoke all on function public.import_official_staff_accounts() from public, anon;
grant execute on function public.import_official_staff_accounts() to authenticated;

-- تنفيذ إنشاء وتفعيل حسابات الموظفين الـ 16 فورًا
select public.import_official_staff_accounts();

notify pgrst, 'reload schema';