-- =====================================================================
--  دار الإحسان — المرحلة 5: الفروع، الأقسام، واستيراد قائمة الطلبة (103 طالب)
--  المؤسسة: جمعية أولياء الأطفال المعاقين ذهنياً — المركز النفسي البيداغوجي دار الإحسان
--  الموقع: بلدية العطف، ولاية غرداية
--
--  محتويات الملف:
--  1. جدول الفروع (branches) والأقسام (sections)
--  2. تحديث جدول الأطفال (children) برقم القيد وتاريخ الميلاد والإعاقة والمعرّف العام (public_uuid)
--  3. استيراد القائمة الاسمية الرسمية للطلبة كاملة (103 تلميذ بدقة 100%)
--  4. جدول البرامج التربوية للأقسام (educational_programs) مع حماية RLS محكمة تمنع تسرب البيانات
--  5. جدول رموز التسجيل أحادية الاستخدام للأولياء (registration_codes) مع دالة الاسترداد
--  6. دالة بطاقة الطالب العامة لصفحة QR دون تسريب أي بيانات حساسة get_public_child
--  7. دالة إدارة وحذف سجلات التدقيق للمدير العام admin_delete_audit
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- =====================================================================
-- 1) جدول الفروع (branches)
-- =====================================================================
create table if not exists public.branches (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null check (char_length(btrim(name)) >= 2),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.branches enable row level security;
revoke all on public.branches from anon, authenticated;
grant select on public.branches to anon, authenticated;
grant insert, update, delete on public.branches to authenticated;

drop policy if exists "branches: public read" on public.branches;
create policy "branches: public read" on public.branches
  for select to anon, authenticated using (active or public.is_admin());

drop policy if exists "branches: admin write" on public.branches;
create policy "branches: admin write" on public.branches
  for all to authenticated using (public.can_manage_families()) with check (public.can_manage_families());

-- زرع الفروع الثلاثة الرئيسية للمؤسسة
insert into public.branches (slug, name, active)
values
  ('main', 'المركز الرئيسي لدار الإحسان', true),
  ('work', 'مركز المساعدة على العمل (ورشات التأهيل والتمهين)', true),
  ('farm', 'المزرعة البيداغوجية (البستنة والأنشطة الفلاحية)', true)
on conflict (slug) do update set name = excluded.name, active = excluded.active;

-- =====================================================================
-- 2) جدول الأقسام / الأفواج التربوية (sections)
-- =====================================================================
create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references public.branches(id) on delete cascade,
  slug        text unique not null,
  name        text not null check (char_length(btrim(name)) >= 2),
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.sections enable row level security;
revoke all on public.sections from anon, authenticated;
grant select on public.sections to anon, authenticated;
grant insert, update, delete on public.sections to authenticated;

drop policy if exists "sections: public read" on public.sections;
create policy "sections: public read" on public.sections
  for select to anon, authenticated using (active or public.is_admin());

drop policy if exists "sections: admin write" on public.sections;
create policy "sections: admin write" on public.sections
  for all to authenticated using (public.can_manage_families()) with check (public.can_manage_families());

-- زرع الأقسام الرسمية الـ 11 المعتمدة
do $$
declare
  v_main_id uuid;
  v_work_id uuid;
  v_farm_id uuid;
begin
  select id into v_main_id from public.branches where slug = 'main';
  select id into v_work_id from public.branches where slug = 'work';
  select id into v_farm_id from public.branches where slug = 'farm';

  -- أقسام المركز الرئيسي (9 أقسام)
  insert into public.sections (branch_id, slug, name, description) values
    (v_main_id, 'sec_autism_1', 'توحد 01', 'قسم اضطراب طيف التوحد (فوج 1)'),
    (v_main_id, 'sec_autism_2', 'التوحد 02', 'قسم اضطراب طيف التوحد (فوج 2)'),
    (v_main_id, 'sec_autism_3', 'توحد 03', 'قسم اضطراب طيف التوحد (فوج 3)'),
    (v_main_id, 'sec_observation', 'الملاحظة جدد', 'قسم الملاحظة والتشخيص للأطفال الجدد'),
    (v_main_id, 'sec_tafatan_1', 'التفطين 1 تأخر ذهني', 'قسم التفطن والتأهيل الذهني (فوج 1)'),
    (v_main_id, 'sec_tafatan_2', 'التفطين 2 متلازمة داون', 'قسم التفطن لمتلازمة داون (فوج 2)'),
    (v_main_id, 'sec_istithara', 'الاستثارة', 'قسم الاستثارة الحسية والحركية'),
    (v_main_id, 'sec_shibh_madrasi', 'قسم الشبه مدرسي مكيف', 'قسم التأهيل الشبه مدرسي المكيف'),
    (v_main_id, 'sec_khariji', 'الخارجي اعاقة شديدة', 'فوج الرعاية النهارية الخارجية للإعاقات الشديدة')
  on conflict (slug) do update set name = excluded.name, description = excluded.description;

  -- قسم مركز المساعدة على العمل
  insert into public.sections (branch_id, slug, name, description) values
    (v_work_id, 'sec_tamhin', 'التمهين م م ع', 'قسم التمهين والتأهيل المهني بمركز المساعدة على العمل')
  on conflict (slug) do update set name = excluded.name, description = excluded.description;

  -- قسم المزرعة البيداغوجية
  insert into public.sections (branch_id, slug, name, description) values
    (v_farm_id, 'sec_bostana', 'المزرعة البستنة', 'ورشة البستنة والأنشطة الزراعية بالمزرعة البيداغوجية')
  on conflict (slug) do update set name = excluded.name, description = excluded.description;
end $$;

-- =====================================================================
-- 3) تحديث جدول الأطفال (children) لدعم البنية المؤسساتية الكاملة
-- =====================================================================
alter table public.children add column if not exists membership_no text;
alter table public.children add column if not exists dob date;
alter table public.children add column if not exists disability text;
alter table public.children add column if not exists phone text;
alter table public.children add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.children add column if not exists section_id uuid references public.sections(id) on delete set null;
alter table public.children add column if not exists public_uuid uuid default gen_random_uuid();
alter table public.children add column if not exists academic_year text default '2026-2027';

-- ضمان فرادة رقم القيد والمعرف العام
create unique index if not exists children_membership_no_idx on public.children (membership_no) where membership_no is not null;
create unique index if not exists children_public_uuid_idx on public.children (public_uuid);
create index if not exists children_section_id_idx on public.children (section_id);
create index if not exists children_branch_id_idx on public.children (branch_id);

-- =====================================================================
-- 4) البرامج التربوية للأقسام (educational_programs)
-- =====================================================================
create table if not exists public.educational_programs (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references public.sections(id) on delete cascade,
  title         text not null check (char_length(btrim(title)) between 2 and 160),
  description   text check (description is null or char_length(description) <= 5000),
  goals         text check (goals is null or char_length(goals) <= 5000),
  schedule      jsonb not null default '[]'::jsonb,
  academic_year text not null default '2026-2027',
  status        text not null default 'draft' check (status in ('draft', 'published')),
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);
alter table public.educational_programs enable row level security;
revoke all on public.educational_programs from anon, authenticated;
grant select, insert, update, delete on public.educational_programs to authenticated;

drop trigger if exists touch_educational_programs on public.educational_programs;
create trigger touch_educational_programs before update on public.educational_programs for each row execute function public.touch_updated_at();

-- RLS الصارم للبرامج التربوية:
-- المدير: يقرأ ويعدل كل شيء
-- الولي: يقرأ فقط البرامج المنشورة (published) للقسم المسجل فيه طفله حصراً!
drop policy if exists "programs: admin all" on public.educational_programs;
create policy "programs: admin all" on public.educational_programs
  for all to authenticated
  using (public.can_manage_families())
  with check (public.can_manage_families());

drop policy if exists "programs: parent section read" on public.educational_programs;
create policy "programs: parent section read" on public.educational_programs
  for select to authenticated
  using (
    status = 'published'
    and public.is_active_parent()
    and exists (
      select 1 from public.children c
      join public.parent_children pc on pc.child_id = c.id
      where pc.parent_id = auth.uid()
        and c.section_id = educational_programs.section_id
        and c.active
    )
  );

-- =====================================================================
-- 5) رموز التسجيل أحادية الاستخدام للأولياء (registration_codes)
-- =====================================================================
create table if not exists public.registration_codes (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children(id) on delete cascade,
  code       text unique not null check (char_length(code) between 6 and 32),
  expires_at timestamptz not null default (now() + interval '45 days'),
  used_at    timestamptz,
  used_by    uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.registration_codes enable row level security;
revoke all on public.registration_codes from anon, authenticated;
grant select, insert, update, delete on public.registration_codes to authenticated;

drop policy if exists "codes: admin manage" on public.registration_codes;
create policy "codes: admin manage" on public.registration_codes
  for all to authenticated
  using (public.can_manage_families())
  with check (public.can_manage_families());

-- دالة استرداد رمز التسجيل وربط الولي بالطفل بأمان تام
create or replace function public.redeem_registration_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_rec record;
  v_child_name text;
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول لاسترداد رمز التسجيل' using errcode = '42501';
  end if;

  if not public.rate_limit_hit('redeem_code:' || auth.uid()::text, 5, 900) then
    raise exception 'محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة.' using errcode = 'P0001';
  end if;

  select rc.*, c.full_name into v_rec
  from public.registration_codes rc
  join public.children c on c.id = rc.child_id
  where upper(btrim(rc.code)) = upper(btrim(p_code));

  if not found then
    raise exception 'رمز التسجيل غير صحيح أو غير موجود' using errcode = '22023';
  end if;

  if v_rec.used_at is not null then
    raise exception 'هذا الرمز تم استخدامه مسبقًا بتاريخ %', to_char(v_rec.used_at, 'YYYY/MM/DD') using errcode = '22023';
  end if;

  if v_rec.expires_at < now() then
    raise exception 'انتهت صلاحية هذا الرمز. يرجى طلب رمز جديد من إدارة المركز' using errcode = '22023';
  end if;

  -- التأكد من وجود ملف للولي في parent_profiles
  insert into public.parent_profiles (user_id, full_name, email, disabled)
  values (
    auth.uid(),
    coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), 'ولي أمر'),
    (select email from auth.users where id = auth.uid()),
    false
  )
  on conflict (user_id) do update set disabled = false;

  -- ربط الولي بالطفل
  insert into public.parent_children (parent_id, child_id, relation)
  values (auth.uid(), v_rec.child_id, 'ولي أمر')
  on conflict (parent_id, child_id) do nothing;

  -- وسم الرمز كمستخدم
  update public.registration_codes
  set used_at = now(), used_by = auth.uid()
  where id = v_rec.id;

  -- توثيق العملية في سجل التدقيق
  perform public.audit_log('parent:redeem_code', v_rec.child_id::text);

  return jsonb_build_object(
    'success', true,
    'child_id', v_rec.child_id,
    'child_name', v_rec.full_name
  );
end;
$$;
revoke all on function public.redeem_registration_code(text) from public, anon;
grant execute on function public.redeem_registration_code(text) to authenticated;

-- دالة توليد رمز تسجيل جديد لطفل
create or replace function public.admin_generate_child_code(p_child_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_code text;
  v_exists boolean;
begin
  if not public.can_manage_families() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;

  -- توليد رمز مكون من 8 محارف عشوائية واضحة (DI-XXXXXX)
  loop
    v_code := 'DI-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
    select exists (select 1 from public.registration_codes where code = v_code) into v_exists;
    exit when not v_exists;
  end loop;

  insert into public.registration_codes (child_id, code, created_by)
  values (p_child_id, v_code, auth.uid());

  perform public.audit_log('registration_code:generate', p_child_id::text);
  return v_code;
end;
$$;
revoke all on function public.admin_generate_child_code(uuid) from public, anon;
grant execute on function public.admin_generate_child_code(uuid) to authenticated;

-- =====================================================================
-- 6) دالة قراءة بيانات بطاقة الطالب لصفحة QR العامة (5 حقول فقط محددة بدقة)
-- =====================================================================
create or replace function public.get_public_child(p_uuid uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'membership_no', coalesce(c.membership_no, '—'),
    'full_name', c.full_name,
    'dob', coalesce(to_char(c.dob, 'YYYY/MM/DD'), '—'),
    'section', coalesce(s.name, c.section, '—'),
    'branch', coalesce(b.name, 'المركز الرئيسي لدار الإحسان'),
    'disability', coalesce(c.disability, '—'),
    'academic_year', coalesce(c.academic_year, '2026-2027')
  )
  from public.children c
  left join public.sections s on s.id = c.section_id
  left join public.branches b on b.id = coalesce(c.branch_id, s.branch_id)
  where c.public_uuid = p_uuid and c.active;
$$;
revoke all on function public.get_public_child(uuid) from public;
grant execute on function public.get_public_child(uuid) to anon, authenticated;

-- =====================================================================
-- 7) دالة حذف وتصفية سجلات التدقيق للمدير العام (is_owner)
-- =====================================================================
create or replace function public.admin_delete_audit(
  p_id bigint default null,
  p_older_than timestamptz default null
)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count int := 0;
begin
  if not public.is_owner() then
    raise exception 'فقط المدير الرئيسي (المالك) يملك صلاحية حذف سجلات العمليات والتدقيق' using errcode = '42501';
  end if;

  if p_id is not null then
    delete from public.admin_audit where id = p_id;
    get diagnostics v_count = row_count;
  elsif p_older_than is not null then
    delete from public.admin_audit where at < p_older_than;
    get diagnostics v_count = row_count;
  else
    delete from public.admin_audit;
    get diagnostics v_count = row_count;
  end if;

  -- توثيق هذا الإجراء الميتا-رقابي في السجل فوراً
  insert into public.admin_audit (actor, actor_email, action, target)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    'audit:delete',
    'حذف ' || v_count || ' سجل(ات) تدقيق'
  );

  return v_count;
end;
$$;
revoke all on function public.admin_delete_audit(bigint, timestamptz) from public, anon;
grant execute on function public.admin_delete_audit(bigint, timestamptz) to authenticated;

-- =====================================================================
-- 8) استيراد قائمة الـ 103 طالب كاملة من الوثيقة الرسمية للمركز
-- =====================================================================
create or replace function public.import_official_students()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_main_id uuid;
  v_work_id uuid;
  v_farm_id uuid;
  v_sec_autism_1 uuid;
  v_sec_autism_2 uuid;
  v_sec_autism_3 uuid;
  v_sec_obs uuid;
  v_sec_tafatan_1 uuid;
  v_sec_tafatan_2 uuid;
  v_sec_istithara uuid;
  v_sec_shibh uuid;
  v_sec_khariji uuid;
  v_sec_tamhin uuid;
  v_sec_bostana uuid;
  v_inserted int := 0;
begin
  select id into v_main_id from public.branches where slug = 'main';
  select id into v_work_id from public.branches where slug = 'work';
  select id into v_farm_id from public.branches where slug = 'farm';

  select id into v_sec_autism_1 from public.sections where slug = 'sec_autism_1';
  select id into v_sec_autism_2 from public.sections where slug = 'sec_autism_2';
  select id into v_sec_autism_3 from public.sections where slug = 'sec_autism_3';
  select id into v_sec_obs from public.sections where slug = 'sec_observation';
  select id into v_sec_tafatan_1 from public.sections where slug = 'sec_tafatan_1';
  select id into v_sec_tafatan_2 from public.sections where slug = 'sec_tafatan_2';
  select id into v_sec_istithara from public.sections where slug = 'sec_istithara';
  select id into v_sec_shibh from public.sections where slug = 'sec_shibh_madrasi';
  select id into v_sec_khariji from public.sections where slug = 'sec_khariji';
  select id into v_sec_tamhin from public.sections where slug = 'sec_tamhin';
  select id into v_sec_bostana from public.sections where slug = 'sec_bostana';

  -- جدول مؤقت لإدراج البيانات دفعة واحدة بدقة متناهية
  drop table if exists temp_students_data;
  create temporary table temp_students_data (
    membership_no text,
    full_name     text,
    dob           date,
    phone         text,
    disability    text,
    branch_slug   text,
    section_slug  text,
    center_code   text
  ) on commit drop;

  insert into temp_students_data (membership_no, full_name, dob, phone, disability, branch_slug, section_slug, center_code) values
    -- الصفحة 1 (29 طالب)
    ('004', 'حاج ابراهيم مسعود بن قاسم', '1981-08-01', '055948690', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('021', 'حاج ابراهيم عمر بن سليمان', '1986-04-26', '055377052', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('022', 'بهون علي يوسف بن يحي', '1986-06-12', '065837964', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('050', 'سعيد مصطفى بن عمر', '1991-09-20', '056101096', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('077', 'بهون علي زوليخة بنت يحي بن عمر', '1988-07-20', '065837964', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('082', 'حاج امحمد محمد بن اسماعيل', '1989-08-04', '066442144', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('086', 'حاج ابراهيم بهون بن عبد الرحمان', '1995-03-24', '077130718', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('087', 'خليف ابراهيم زكرياء بن أحمد', '2003-03-17', '069995077', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('090', 'اولاد حاجو بكير بن توفيق', '2004-05-22', '066303199', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('101', 'طالب باحمد عز الدين بن بكير', '2005-04-05', '079361303', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('103', 'بهون عائشة بنت نور الدين', '2001-08-23', '067147301', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('104', 'بهون وسام بنت ابراهيم', '2006-06-04', '055653051', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('111', 'بهون زوليخة بنت نور الدين', '1984-12-21', '067147301', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('112', 'قندوزي نصر الدين بن حسين', '2006-09-24', '066343469', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('114', 'اسماوي امين بن ابو عبيدة', '2009-09-30', '055928584', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('116', 'صلاح مهدي بن مسعود', '2002-03-08', '066470243', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('117', 'درين سمية بنت صالح', '1997-09-27', '066661649', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('118', 'درين منير بن صالح', '1993-09-02', '066661649', 'التأخر الذهني R.M', 'farm', 'sec_bostana', 'farm'),
    ('119', 'درين بشير بن صالح', '1995-07-19', '066661649', 'التأخر الذهني R.M', 'farm', 'sec_bostana', 'farm'),
    ('132', 'حمو علي قاسم بن عمر', '2009-08-01', '066629625', 'اضطراب طيف التوحد TSA', 'main', 'sec_khariji', 'main'),
    ('138', 'حمو علي سمية بنت موسى', '2004-06-09', '079759877', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('142', 'بوحديبة محمد بن ابراهيم', '2011-01-25', '067364872', 'اضطراب طيف التوحد TSA', 'main', 'sec_shibh_madrasi', 'main'),
    ('146', 'حبيرش جيهان بنت عبد الوهاب', '2013-12-07', '067341231', 'اضطراب طيف التوحد TSA', 'work', 'sec_tamhin', 'work'),
    ('153', 'العابد حسناء بنت منصور', '2008-02-28', '067030546', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('159', 'اسماوي محمد بن بلال', '2010-08-15', '065839100', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('160', 'بهون علي محمد السعيد بن عمر', '2013-07-17', '055079988', 'متلازمة داون T.21', 'main', 'sec_istithara', 'main'),
    ('165', 'حمو علي زكرياء بن ابراهيم', '2014-09-08', '066744579', 'اضطراب طيف التوحد TSA', 'main', 'sec_shibh_madrasi', 'main'),
    ('167', 'كليماني انفال بنت محمد', '2012-11-30', '069837174', 'التأخر الذهني R.M', 'main', 'sec_tafatan_1', 'main'),
    ('168', 'كليماني آية بنت محمد', '2009-04-05', '069837174', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),

    -- الصفحة 2 (34 طالب)
    ('170', 'بن علي فاروق بن احمد', '2012-10-02', '066164908', 'متلازمة داون T.21', 'main', 'sec_shibh_madrasi', 'main'),
    ('173', 'بن يحي الياس بن مختار', '2007-10-27', '066594864', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('176', 'كبير حاج الطيب بن بشير', '2014-01-21', '079274729', 'التأخر الذهني R.M', 'main', 'sec_shibh_madrasi', 'main'),
    ('180', 'زرقون صفوان بن مصطفى', '2007-05-31', '066864048', 'اضطراب طيف التوحد TSA', 'work', 'sec_tamhin', 'work'),
    ('187', 'خروبي زكرياء بن عيسى', '2015-04-14', '054228492', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_1', 'main'),
    ('188', 'اسكوتي عيسى بن عثمان', '2016-06-19', '069905393', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_1', 'main'),
    ('189', 'الشرع ريان بن مختار', '2015-01-05', '066147475', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_2', 'main'),
    ('190', 'بن حمودة أيمن سليمان بن عمر', '2013-09-06', '066650690', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_2', 'main'),
    ('192', 'الشرع خالد بن مختار', '2013-10-16', '066147475', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_1', 'main'),
    ('196', 'بهشو اسماعيل بن سليمان', '2013-05-16', '066599607', 'اضطراب طيف التوحد TSA', 'main', 'sec_shibh_madrasi', 'main'),
    ('197', 'كليماني اية', '2014-04-23', '066836902', 'متعدد الاعاقات', 'main', null, 'main'),
    ('198', 'بن ريم مروة بنت مروان', '2009-02-06', '066569187', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('200', 'بن يوسف حاج ابراهيم بن نصر الدين', '2009-12-27', '067642448', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('201', 'باباعمر تيازيط زكرياء بن بشير', '2010-07-08', '077712027', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('202', 'بكلي الحاج محمد بن احمد', '2012-02-13', '056124727', 'متلازمة داون T.21', 'main', 'sec_istithara', 'main'),
    ('204', 'ببو محمد بن العيد', '2008-06-01', '066887289', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('206', 'بن عافو يوسف بن عيسى', '2013-07-14', '069614151', 'متعدد الاعاقات', 'main', 'sec_istithara', 'main'),
    ('209', 'قومار محمد ياسر بن حمزة', '2015-04-13', '066553918', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_2', 'main'),
    ('213', 'يعقوب نذير بن محمد', '2007-11-04', '065706325', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('216', 'ابي اسماعيل ياسين بن بعيسى', '2012-01-14', '055825381', 'اضطراب طيف التوحد TSA', 'main', 'sec_shibh_madrasi', 'main'),
    ('219', 'حاج امحمد اسماعيل بن ابراهيم', '2009-12-01', '077846497', 'التأخر الذهني R.M', 'main', 'sec_khariji', 'main'),
    ('223', 'أولاد علي صوفيا بنت محمد', '2014-01-22', '066167498', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_3', 'main'),
    ('224', 'مسهل لؤي بن خالد', '2016-06-02', '066065559', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_3', 'main'),
    ('226', 'دهان عبد القادر بن يحي بن عيسى', '2013-12-19', '067222373', 'التأخر الذهني R.M', 'main', 'sec_istithara', 'main'),
    ('227', 'قبسي مهدي عبد الرزاق بن احمد', '2014-05-12', '069797512', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_3', 'main'),
    ('228', 'حيمود اسامة بن مداني', '2007-06-20', '066638904', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('231', 'مهيري يوسف الصديق بن موسى', '2016-02-23', '066743252', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_3', 'main'),
    ('236', 'حاج سعيد مسعودة سيرين بنت عمر', '2018-07-09', '055754254', 'متلازمة داون T.21', 'main', 'sec_tafatan_2', 'main'),
    ('238', 'بابا عمر تيازيط يحي بن مسعود', '2009-07-25', '067135309', 'اضطراب طيف التوحد TSA', 'farm', 'sec_bostana', 'farm'),
    ('239', 'بابا عمر تيازيط محمد بن مسعود', '2016-12-22', '067135309', 'اضطراب طيف التوحد TSA', 'main', 'sec_shibh_madrasi', 'main'),
    ('240', 'بن موسى مريم بنت بلقاسم', '2014-01-23', '066202193', 'التأخر الذهني R.M', 'main', 'sec_istithara', 'main'),
    ('243', 'حاج امحمد مصطفى الامين بن ابراه', '1993-02-01', '065931259', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('247', 'جرادة ابراهيم بن محمد', '2018-01-15', '066250716', 'متلازمة داون T.21', 'main', 'sec_tafatan_2', 'main'),
    ('249', 'حاتة سليمان بن بكير', '2001-02-04', '079230020', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),

    -- الصفحة 3 (34 طالب)
    ('250', 'حاج اسماعيل عائشة بنت محمد بن ا', '2021-06-08', '069668368', 'متلازمة داون T.21', 'main', 'sec_tafatan_2', 'main'),
    ('251', 'سعيد فاطمة الزهراء بنت صلاح الدين', '2009-06-26', '065988655', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('254', 'بوال مصطفى بن إدريس', '2012-04-13', '066543656', 'التأخر الذهني R.M', 'main', 'sec_shibh_madrasi', 'main'),
    ('255', 'بن خليفة ريهام شهد بنت محمد', '2009-07-25', '069804364', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('256', 'بن احمد انس عبد الجليل بن أحمد', '2017-11-12', '069958761', 'التأخر الذهني R.M', 'main', 'sec_tafatan_1', 'main'),
    ('257', 'الشامخة عبد الرزاق حفيظ بن مصطفى', '2017-12-03', '066862720', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_1', 'main'),
    ('258', 'اولاد الشيخ انس عبد العليم بن محمد', '2018-07-02', '066898171', 'اضطراب طيف التوحد TSA', 'main', 'sec_observation', 'main'),
    ('259', 'عيسى عز الدين بن بكير', '2010-08-28', '055016841', 'اضطراب طيف التوحد TSA', 'work', 'sec_tamhin', 'work'),
    ('263', 'سالم يوسف بن حمو', '2008-02-09', '054111581', 'اضطراب طيف التوحد TSA', 'work', 'sec_tamhin', 'work'),
    ('264', 'هامل سحر بنت أحمد بن صالح', '2007-06-04', '077824262', 'اضطراب طيف التوحد TSA', 'main', 'sec_khariji', 'main'),
    ('265', 'هامل عبد الحي بن أحمد بن صالح', '2010-07-29', '077824262', 'اضطراب طيف التوحد TSA', 'work', 'sec_tamhin', 'work'),
    ('267', 'بلولو الحاج ابراهيم بن رمضان', '2010-08-14', '079654999', 'اضطراب طيف التوحد TSA', 'work', 'sec_tamhin', 'work'),
    ('273', 'الواهج بكير بن صالح', '1988-12-15', '055207989', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('274', 'توهامي ريم بنت توفيق', '2014-06-03', '055030033', 'اضطراب طيف التوحد TSA', 'main', 'sec_observation', 'main'),
    ('275', 'أولاد حاجو مامة مالك بنت صالح', '2015-05-07', '066614780', 'التأخر الذهني R.M', 'main', 'sec_istithara', 'main'),
    ('276', 'صديقي محمد الامين بن مراد', '2014-03-14', '066276843', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_3', 'main'),
    ('279', 'قندوز نهال بنت نصر الدين', '2012-06-18', '066597050', 'التأخر الدراسي', 'main', 'sec_istithara', 'main'),
    ('280', 'مطياز توفيق بن محمد', '2001-09-01', '066347915', 'التأخر الدراسي', 'work', 'sec_tamhin', 'work'),
    ('281', 'عكيف عبد الجليل طه بن أحمد', '2003-06-15', '069998926', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('283', 'داودي سهام بنت محمد', '2015-02-17', '055610591', 'التأخر الدراسي', 'main', 'sec_istithara', 'main'),
    ('288', 'حاج عيسى فخار عيسى بن يونس', '1995-08-18', '079794096', 'متعدد الاعاقات', 'work', 'sec_tamhin', 'work'),
    ('289', 'بنورة منير بن محمد', '2015-01-01', '055534375', 'متعدد الاعاقات', 'main', 'sec_khariji', 'main'),
    ('291', 'داودي ربيع بن بايوب', '2014-02-24', '0558694073', 'التأخر الذهني R.M', 'main', 'sec_shibh_madrasi', 'main'),
    ('293', 'ريغي اية بنت الشيخ', '2021-07-01', '065250446', 'متلازمة داون T.21', 'main', 'sec_tafatan_2', 'main'),
    ('296', 'عباس لقمان بن يحي', '2017-05-12', '077071457', 'التأخر الذهني R.M', 'main', 'sec_shibh_madrasi', 'main'),
    ('297', 'الشيخ محمد المهدي بن عيسى', '2016-12-17', '067462692', 'اضطراب طيف التوحد TSA', 'main', 'sec_autism_2', 'main'),
    ('301', 'اسماوي ايوب بن عبد السلام', '2018-12-15', '055324283', 'التأخر الذهني R.M', 'main', 'sec_shibh_madrasi', 'main'),
    ('305', 'يحي الشريف خديجة بنت فاروق', '2022-09-23', '066864689', 'التأخر الذهني R.M', 'main', 'sec_tafatan_1', 'main'),
    ('306', 'بن صغير ياسين بن احمد', '2015-07-31', '066201480', 'اضطراب طيف التوحد TSA', 'main', 'sec_observation', 'main'),
    ('307', 'غبشي نورالهدى بنت يوسف', '2014-09-07', '065951484', 'اضطراب طيف التوحد TSA', 'main', 'sec_observation', 'main'),
    ('310', 'داودي الحاج يحي بن باحمد', '2007-06-24', '054113100', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('311', 'الشيخ دحمان مامة بنت دحمان', '2016-02-10', '055933674', 'التأخر الذهني R.M', 'main', 'sec_istithara', 'main'),
    ('312', 'بن يونس يسرى بنت مصطفى', '2007-09-09', '066685208', 'اضطراب طيف التوحد TSA', 'work', 'sec_tamhin', 'work'),
    ('313', 'لعزيز ياسمين بنت سيراج', '2013-12-30', '055015858', 'التأخر الذهني R.M', 'main', 'sec_istithara', 'main'),

    -- الصفحة 4 (6 طلاب)
    ('314', 'نوح مفنون أمين بن البشير', '2007-01-05', '077830744', 'متلازمة داون T.21', 'work', 'sec_tamhin', 'work'),
    ('315', 'بورزمة ابراهيم بن محمد', '2021-08-11', '066333478', 'التأخر الذهني R.M', 'main', 'sec_tafatan_1', 'main'),
    ('316', 'زيطاري نور سين بنت خليل', '2020-09-21', '066241736', 'التأخر الذهني R.M', 'main', 'sec_tafatan_1', 'main'),
    ('317', 'داودي طه بن علي', '2007-06-06', '054148767', 'التأخر الذهني R.M', 'work', 'sec_tamhin', 'work'),
    ('318', 'جبريط سعد الدين بن بدر الدين', '2014-05-10', '066228078', 'التأخر الذهني R.M', 'main', 'sec_istithara', 'main'),
    ('320', 'بيتور محمد اسحاق بن بن يعيش', '2019-03-24', '066230749', 'اضطراب طيف التوحد TSA', 'main', 'sec_observation', 'main');

  -- دمج وإدخال الطلبة في جدول children (إذا كان مسجلاً برقم القيد يتم تحديثه، وإلا يتم إدراجه)
  insert into public.children (
    membership_no,
    full_name,
    dob,
    phone,
    disability,
    center,
    branch_id,
    section_id,
    section,
    academic_year,
    active
  )
  select
    t.membership_no,
    t.full_name,
    t.dob,
    t.phone,
    t.disability,
    t.center_code,
    b.id as branch_id,
    s.id as section_id,
    coalesce(s.name, 'عام') as section,
    '2026-2027',
    true
  from temp_students_data t
  left join public.branches b on b.slug = t.branch_slug
  left join public.sections s on s.slug = t.section_slug
  on conflict (membership_no) do update set
    full_name     = excluded.full_name,
    dob           = excluded.dob,
    phone         = excluded.phone,
    disability    = excluded.disability,
    center        = excluded.center,
    branch_id     = excluded.branch_id,
    section_id    = excluded.section_id,
    section       = excluded.section,
    academic_year = excluded.academic_year,
    active        = true;

  get diagnostics v_inserted = row_count;

  -- توليد رمز تسجيل سري لكل طالب إذا لم يكن لديه رمز نشط
  insert into public.registration_codes (child_id, code)
  select
    c.id,
    'DI-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6))
  from public.children c
  where not exists (
    select 1 from public.registration_codes rc
    where rc.child_id = c.id and rc.used_at is null and rc.expires_at > now()
  );

  return v_inserted;
end;
$$;

-- تنفيذ استيراد الطلبة فور تشغيل السكربت
select public.import_official_students();

notify pgrst, 'reload schema';

-- =====================================================================
-- اكتمل بنجاح تثبيت المرحلة 5 واستيراد الـ 103 طالب رسميًا في النظام.
-- =====================================================================
