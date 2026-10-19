-- =====================================================================
--  دار الإحسان — التثبيت الشامل لقاعدة البيانات والأمان (Supabase)
--  المركز النفسي البيداغوجي دار الإحسان — العطف، غرداية
--  
--  تشغيل هذا الملف يُنشئ النظام بالكامل دفعة واحدة:
--  1. جداول الإدارة ومحتوى الموقع العام (CMS)
--  2. جداول فضاء الأولياء (أطفال، أولياء، تقارير، مواعيد، رسائل، وثائق)
--  3. سجل العمليات والتدقيق (Audit Log)
--  4. سياسات الأمان Row Level Security (RLS) الصارمة
--  5. إعدادات حاويات التخزين (media العامة و private-docs المحمية)
--  6. مؤشرات وإحصائيات لوحة التحكم
--  
--  شغّله في: Supabase Dashboard ▸ SQL Editor ▸ New query ▸ Run
--  آمن للتشغيل مرة أولى أو إعادة التشغيل على قاعدة قائمة (Idempotent).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- =====================================================================
-- 1) جدول المديرين ودوال الصلاحيات الأساسية
-- =====================================================================
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'admin' check (role in ('admin', 'editor')),
  disabled   boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- هل المستخدم مدير نشط؟
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and not disabled);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- هل المستخدم مدير يملك صلاحية إدارة العائلات (admin وليس editor فقط)؟
create or replace function public.can_manage_families()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and not disabled and role = 'admin');
$$;
revoke all on function public.can_manage_families() from public, anon;
grant execute on function public.can_manage_families() to authenticated;

-- هل المستخدم هو المالك (أول مدير تم إنشاؤه)؟
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
     and auth.uid() = (select a.user_id from public.admins a order by a.created_at asc, a.user_id asc limit 1);
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- =====================================================================
-- 2) محتوى الموقع العام (CMS) + سجل النسخ المنشورة
-- =====================================================================
create table if not exists public.site_content (
  id         text primary key check (id in ('draft', 'published')),
  data       jsonb not null default '{}'::jsonb check (octet_length(data::text) < 1000000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

drop policy if exists "الزوار يقرؤون المنشور فقط" on public.site_content;
create policy "الزوار يقرؤون المنشور فقط" on public.site_content
  for select to anon, authenticated using (id = 'published');

drop policy if exists "المدير يقرأ المسودة" on public.site_content;
create policy "المدير يقرأ المسودة" on public.site_content
  for select to authenticated using (public.is_admin());

drop policy if exists "المدير ينشئ المسودة" on public.site_content;
create policy "المدير ينشئ المسودة" on public.site_content
  for insert to authenticated with check (public.is_admin() and id = 'draft');

drop policy if exists "المدير يعدّل المسودة" on public.site_content;
create policy "المدير يعدّل المسودة" on public.site_content
  for update to authenticated
  using (public.is_admin() and id = 'draft')
  with check (public.is_admin() and id = 'draft');

insert into public.site_content (id, data) values ('draft', '{}'::jsonb), ('published', '{}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.site_content_history (
  id           bigint generated always as identity primary key,
  data         jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid
);
alter table public.site_content_history enable row level security;
revoke all on public.site_content_history from anon, authenticated;
grant select on public.site_content_history to authenticated;

drop policy if exists "المدير يقرأ السجل" on public.site_content_history;
create policy "المدير يقرأ السجل" on public.site_content_history
  for select to authenticated using (public.is_admin());

-- =====================================================================
-- 3) سجل التدقيق والعمليات الحساسة (Audit Log)
-- =====================================================================
create table if not exists public.admin_audit (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor       uuid,
  actor_email text,
  action      text not null,
  target      text
);
alter table public.admin_audit enable row level security;
revoke all on public.admin_audit from anon, authenticated;
grant all on public.admin_audit to service_role;

create or replace function public.audit_log(p_action text, p_target text default null)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.admin_audit (actor, actor_email, action, target)
    values (auth.uid(), (select u.email from auth.users u where u.id = auth.uid()), p_action, left(p_target, 200));
  delete from public.admin_audit where id <= (select coalesce(max(x.id), 0) from public.admin_audit x) - 1000;
end $$;
revoke all on function public.audit_log(text, text) from public, anon, authenticated;

create or replace function public.admin_audit_list(p_limit int default 50, p_action_filter text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'at', t.at,
      'actor_email', t.actor_email,
      'action', t.action,
      'target', t.target
    ) order by t.id desc)
    from (
      select * from public.admin_audit
      where (p_action_filter is null or action like p_action_filter || '%')
      order by id desc
      limit least(greatest(coalesce(p_limit, 50), 1), 100)
    ) t
  ), '[]'::jsonb);
end $$;
revoke all on function public.admin_audit_list(int, text) from public, anon;
grant execute on function public.admin_audit_list(int, text) to authenticated;

create or replace function public.admin_audit_list(p_limit int)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.admin_audit_list(p_limit, null);
$$;
revoke all on function public.admin_audit_list(int) from public, anon;
grant execute on function public.admin_audit_list(int) to authenticated;

-- دوال نشر الموقع
create or replace function public.publish_content()
returns timestamptz language plpgsql security definer set search_path = public as $$
declare d jsonb; t timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select data into d from public.site_content where id = 'draft';
  if d is null then raise exception 'لا توجد مسودة'; end if;

  insert into public.site_content_history (data, published_by)
    select data, auth.uid() from public.site_content where id = 'published' and data <> '{}'::jsonb;

  insert into public.site_content (id, data, updated_at, updated_by)
    values ('published', d, t, auth.uid())
  on conflict (id) do update
    set data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by;

  delete from public.site_content_history
   where id not in (select id from public.site_content_history order by id desc limit 30);
  perform public.audit_log('publish');
  return t;
end $$;
revoke all on function public.publish_content() from public, anon;
grant execute on function public.publish_content() to authenticated;

create or replace function public.load_version_to_draft(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  update public.site_content
     set data = (select data from public.site_content_history where id = p_id),
         updated_at = now(), updated_by = auth.uid()
   where id = 'draft'
     and exists (select 1 from public.site_content_history where id = p_id);
  perform public.audit_log('load_version', p_id::text);
end $$;
revoke all on function public.load_version_to_draft(bigint) from public, anon;
grant execute on function public.load_version_to_draft(bigint) to authenticated;

-- =====================================================================
-- 4) جداول فضاء الأولياء والأطفال
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- جدول الأطفال
create table if not exists public.children (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (char_length(btrim(full_name)) between 2 and 120),
  center        text not null check (center in ('main', 'work', 'farm')),
  section       text check (section is null or char_length(section) <= 80),
  basic_info    text check (basic_info is null or char_length(basic_info) <= 1000),
  photo_consent boolean not null default false,
  active        boolean not null default true,
  created_by    uuid default auth.uid() references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists children_name_idx on public.children using gin(to_tsvector('simple', full_name));
drop trigger if exists children_touch on public.children;
create trigger children_touch before update on public.children for each row execute function public.touch_updated_at();

-- جدول ملفات الأولياء
create table if not exists public.parent_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null check (char_length(btrim(full_name)) between 2 and 120),
  phone      text check (phone is null or phone ~ '^[0-9+()\s.-]{5,25}$'),
  email      text check (email is null or char_length(email) <= 254),
  disabled   boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger parent_profiles_touch before update on public.parent_profiles for each row execute function public.touch_updated_at();

-- مزامنة تلقائية لملفات الأولياء عند إنشاء أو دعوة أي مستخدم من لوحة تحكم Supabase
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins where user_id = new.id) then
    insert into public.parent_profiles (user_id, full_name, email, disabled)
    values (
      new.id,
      coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), split_part(coalesce(new.email, 'ولي أمر'), '@', 1)),
      new.email,
      false
    )
    on conflict (user_id) do update
      set email = coalesce(excluded.email, public.parent_profiles.email);
  end if;
  return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public, anon;
grant execute on function public.handle_new_auth_user() to service_role, postgres;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- جدول ربط الولي بالأطفال المصرح لهم
create table if not exists public.parent_children (
  parent_id  uuid not null references public.parent_profiles(user_id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  relation   text check (relation is null or char_length(relation) <= 40),
  created_at timestamptz not null default now(),
  primary key (parent_id, child_id)
);
create index if not exists parent_children_child_idx on public.parent_children (child_id);

-- جدول التقارير التربوية
create table if not exists public.progress_reports (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references public.children(id) on delete restrict,
  title           text not null check (char_length(btrim(title)) between 1 and 150),
  report_date     date not null default current_date,
  period_start    date not null,
  period_end      date not null,
  achievements    text check (achievements is null or char_length(achievements) <= 5000),
  activities      text check (activities is null or char_length(activities) <= 5000),
  notes           text check (notes is null or char_length(notes) <= 5000),
  attachment_path text check (attachment_path is null or attachment_path ~ '^children/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$'),
  status          text not null default 'draft' check (status in ('draft', 'published')),
  created_by      uuid default auth.uid() references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz,
  check (period_end >= period_start),
  check (status = 'draft' or coalesce(nullif(btrim(achievements), ''), nullif(btrim(activities), ''), nullif(btrim(notes), '')) is not null)
);
create index if not exists progress_reports_child_idx on public.progress_reports (child_id, status);

create or replace function public.reports_state()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end $$;
drop trigger if exists progress_reports_state on public.progress_reports;
create trigger progress_reports_state before insert or update on public.progress_reports for each row execute function public.reports_state();

-- جدول المواعيد والأنشطة
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 1 and 150),
  description text check (description is null or char_length(description) <= 2000),
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text check (location is null or char_length(location) <= 150),
  audience    text not null check (audience in ('all', 'child')),
  child_id    uuid references public.children(id) on delete cascade,
  status      text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at),
  check ((audience = 'all' and child_id is null) or (audience = 'child' and child_id is not null))
);
create index if not exists appointments_starts_idx on public.appointments (starts_at);
drop trigger if exists appointments_touch on public.appointments;
create trigger appointments_touch before update on public.appointments for each row execute function public.touch_updated_at();

-- جدول الرسائل والإعلانات
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'announcement' check (kind in ('announcement', 'message')),
  audience     text not null check (audience in ('all', 'parent', 'child')),
  parent_id    uuid references public.parent_profiles(user_id) on delete cascade,
  child_id     uuid references public.children(id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 150),
  body         text not null check (char_length(btrim(body)) between 1 and 5000),
  published_at timestamptz,
  created_by   uuid default auth.uid() references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check ((audience = 'all' and parent_id is null and child_id is null)
      or (audience = 'parent' and parent_id is not null and child_id is null)
      or (audience = 'child' and child_id is not null and parent_id is null))
);
drop trigger if exists messages_touch on public.messages;
create trigger messages_touch before update on public.messages for each row execute function public.touch_updated_at();

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  parent_id  uuid not null references public.parent_profiles(user_id) on delete cascade,
  read_at    timestamptz not null default now(),
  primary key (message_id, parent_id)
);

-- جدول الوثائق الخاصة
create table if not exists public.documents (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(btrim(title)) between 1 and 150),
  category           text check (category is null or char_length(category) <= 60),
  child_id           uuid references public.children(id) on delete cascade,
  storage_path       text not null unique check (storage_path ~ '^children/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$'),
  mime_type          text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes         integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  shared_with_parent boolean not null default false,
  created_by         uuid default auth.uid() references auth.users(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index if not exists documents_child_idx on public.documents (child_id);

-- جدول تحديد المعدل (Rate Limits)
create table if not exists public.rate_limits (
  key    text not null,
  hit_at timestamptz not null default now()
);
create index if not exists rate_limits_key_idx on public.rate_limits (key, hit_at);
grant all on public.rate_limits to service_role;

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.rate_limits where hit_at < now() - interval '1 hour';
  select count(*) into n from public.rate_limits
   where key = p_key and hit_at > now() - make_interval(secs => p_window_seconds);
  if n >= p_max then return false; end if;
  insert into public.rate_limits (key) values (p_key);
  return true;
end $$;
revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;

-- =====================================================================
-- 5) دوال التحقق من هوية الولي وصلاحيته للوصول
-- =====================================================================
create or replace function public.is_active_parent()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.parent_profiles where user_id = auth.uid() and not disabled);
$$;

create or replace function public.is_parent_of(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_children pc
      join public.parent_profiles pp on pp.user_id = pc.parent_id
     where pc.parent_id = auth.uid() and pc.child_id = p_child and not pp.disabled);
$$;

create or replace function public.can_read_message(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_active_parent() and exists (
    select 1 from public.messages m
     where m.id = p_id and m.published_at is not null and m.published_at <= now()
       and (m.audience = 'all'
         or (m.audience = 'parent' and m.parent_id = auth.uid())
         or (m.audience = 'child' and public.is_parent_of(m.child_id))));
$$;

create or replace function public.can_read_private_object(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_active_parent() and (
    exists (select 1 from public.documents d
             where d.storage_path = p_name and d.shared_with_parent and d.child_id is not null and public.is_parent_of(d.child_id))
    or exists (select 1 from public.progress_reports r
             where r.attachment_path = p_name and r.status = 'published' and public.is_parent_of(r.child_id)));
$$;

revoke all on function public.is_active_parent(), public.is_parent_of(uuid), public.can_read_message(uuid), public.can_read_private_object(text) from public, anon;
grant execute on function public.is_active_parent(), public.is_parent_of(uuid), public.can_read_message(uuid), public.can_read_private_object(text) to authenticated;

-- =====================================================================
-- 6) سياسات الأمان Row Level Security (RLS)
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['children','parent_profiles','parent_children','progress_reports','appointments','messages','message_reads','documents','rate_limits']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

grant select, insert, update, delete on public.children, public.parent_profiles, public.parent_children,
  public.progress_reports, public.appointments, public.messages, public.documents to authenticated;
grant select on public.message_reads to authenticated;
grant insert (message_id, parent_id) on public.message_reads to authenticated;

-- children RLS
drop policy if exists "children: read" on public.children;
create policy "children: read" on public.children for select to authenticated
  using (public.can_manage_families() or public.is_parent_of(id));

drop policy if exists "children: admin insert" on public.children;
create policy "children: admin insert" on public.children for insert to authenticated
  with check (public.can_manage_families() and created_by = auth.uid());

drop policy if exists "children: admin update" on public.children;
create policy "children: admin update" on public.children for update to authenticated
  using (public.can_manage_families()) with check (public.can_manage_families());

drop policy if exists "children: admin delete" on public.children;
create policy "children: admin delete" on public.children for delete to authenticated
  using (public.can_manage_families());

-- parent_profiles RLS
drop policy if exists "parent_profiles: read" on public.parent_profiles;
create policy "parent_profiles: read" on public.parent_profiles for select to authenticated
  using (public.can_manage_families() or user_id = auth.uid());

drop policy if exists "parent_profiles: admin write" on public.parent_profiles;
create policy "parent_profiles: admin write" on public.parent_profiles for all to authenticated
  using (public.can_manage_families()) with check (public.can_manage_families());

-- parent_children RLS
drop policy if exists "parent_children: read" on public.parent_children;
create policy "parent_children: read" on public.parent_children for select to authenticated
  using (public.can_manage_families() or (parent_id = auth.uid() and public.is_active_parent()));

drop policy if exists "parent_children: admin write" on public.parent_children;
create policy "parent_children: admin write" on public.parent_children for all to authenticated
  using (public.can_manage_families()) with check (public.can_manage_families());

-- progress_reports RLS
drop policy if exists "reports: read" on public.progress_reports;
create policy "reports: read" on public.progress_reports for select to authenticated
  using (public.can_manage_families() or (status = 'published' and public.is_parent_of(child_id)));

drop policy if exists "reports: admin insert" on public.progress_reports;
create policy "reports: admin insert" on public.progress_reports for insert to authenticated
  with check (public.can_manage_families() and created_by = auth.uid());

drop policy if exists "reports: admin update" on public.progress_reports;
create policy "reports: admin update" on public.progress_reports for update to authenticated
  using (public.can_manage_families()) with check (public.can_manage_families());

drop policy if exists "reports: admin delete" on public.progress_reports;
create policy "reports: admin delete" on public.progress_reports for delete to authenticated
  using (public.can_manage_families());

-- appointments RLS
drop policy if exists "appointments: read" on public.appointments;
create policy "appointments: read" on public.appointments for select to authenticated
  using (public.can_manage_families()
      or (public.is_active_parent() and (audience = 'all' or (audience = 'child' and public.is_parent_of(child_id)))));

drop policy if exists "appointments: admin insert" on public.appointments;
create policy "appointments: admin insert" on public.appointments for insert to authenticated
  with check (public.can_manage_families() and created_by = auth.uid());

drop policy if exists "appointments: admin update" on public.appointments;
create policy "appointments: admin update" on public.appointments for update to authenticated
  using (public.can_manage_families()) with check (public.can_manage_families());

drop policy if exists "appointments: admin delete" on public.appointments;
create policy "appointments: admin delete" on public.appointments for delete to authenticated
  using (public.can_manage_families());

-- messages RLS
drop policy if exists "messages: read" on public.messages;
create policy "messages: read" on public.messages for select to authenticated
  using (public.can_manage_families() or public.can_read_message(id));

drop policy if exists "messages: admin insert" on public.messages;
create policy "messages: admin insert" on public.messages for insert to authenticated
  with check (public.can_manage_families() and created_by = auth.uid());

drop policy if exists "messages: admin update" on public.messages;
create policy "messages: admin update" on public.messages for update to authenticated
  using (public.can_manage_families()) with check (public.can_manage_families());

drop policy if exists "messages: admin delete" on public.messages;
create policy "messages: admin delete" on public.messages for delete to authenticated
  using (public.can_manage_families());

-- message_reads RLS
drop policy if exists "reads: read" on public.message_reads;
create policy "reads: read" on public.message_reads for select to authenticated
  using (public.can_manage_families() or parent_id = auth.uid());

drop policy if exists "reads: parent insert" on public.message_reads;
create policy "reads: parent insert" on public.message_reads for insert to authenticated
  with check (parent_id = auth.uid() and public.can_read_message(message_id));

-- documents RLS
drop policy if exists "documents: read" on public.documents;
create policy "documents: read" on public.documents for select to authenticated
  using (public.can_manage_families()
      or (shared_with_parent and child_id is not null and public.is_active_parent() and public.is_parent_of(child_id)));

drop policy if exists "documents: admin insert" on public.documents;
create policy "documents: admin insert" on public.documents for insert to authenticated
  with check (public.can_manage_families() and created_by = auth.uid());

drop policy if exists "documents: admin update" on public.documents;
create policy "documents: admin update" on public.documents for update to authenticated
  using (public.can_manage_families()) with check (public.can_manage_families());

drop policy if exists "documents: admin delete" on public.documents;
create policy "documents: admin delete" on public.documents for delete to authenticated
  using (public.can_manage_families());

-- =====================================================================
-- 7) حاويات التخزين (Storage Buckets)
-- =====================================================================
-- 1. حاوية media (عامة لقراءة صور وفيديوهات الموقع العام، مقصورة كتابتها على المديرين)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
on conflict (id) do update
  set public = true, file_size_limit = 52428800,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'];

drop policy if exists "media: المدير يسرد الملفات" on storage.objects;
create policy "media: المدير يسرد الملفات" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: المدير يرفع" on storage.objects;
create policy "media: المدير يرفع" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: المدير يستبدل" on storage.objects;
create policy "media: المدير يستبدل" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: المدير يحذف" on storage.objects;
create policy "media: المدير يحذف" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- 2. حاوية private-docs (خاصة ومحمية، لوثائق الأطفال ومرفقات التقارير، لا وصول دون توقيع وخفر RLS)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-docs', 'private-docs', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "private-docs: read" on storage.objects;
create policy "private-docs: read" on storage.objects for select to authenticated
  using (bucket_id = 'private-docs' and (public.can_manage_families() or public.can_read_private_object(name)));

drop policy if exists "private-docs: admin insert" on storage.objects;
create policy "private-docs: admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'private-docs' and public.can_manage_families()
              and name ~ '^children/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$');

drop policy if exists "private-docs: admin update" on storage.objects;
create policy "private-docs: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'private-docs' and public.can_manage_families())
  with check (bucket_id = 'private-docs' and public.can_manage_families());

drop policy if exists "private-docs: admin delete" on storage.objects;
create policy "private-docs: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'private-docs' and public.can_manage_families());

-- =====================================================================
-- 8) مشغلات سجل العمليات التلقائية (Audit Triggers)
-- =====================================================================
create or replace function public.trg_audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare o jsonb; n jsonb; r jsonb; v_action text; v_id text;
begin
  o := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  n := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  r := coalesce(n, o);
  v_id := coalesce(r ->> 'id', (r ->> 'parent_id') || '/' || (r ->> 'child_id'), r ->> 'user_id');
  v_action := tg_table_name || ':' || lower(tg_op);
  if tg_table_name = 'progress_reports' and tg_op = 'UPDATE' and (o ->> 'status') is distinct from (n ->> 'status') then
    v_action := case when (n ->> 'status') = 'published' then 'report:publish' else 'report:unpublish' end;
  elsif tg_table_name = 'parent_profiles' and tg_op = 'UPDATE' then
    v_action := case when (n ->> 'disabled') = 'true' then 'parent:disable' else 'parent:enable' end;
  end if;
  perform public.audit_log(v_action, v_id);
  return null;
end $$;
revoke all on function public.trg_audit_row() from public, anon, authenticated;

do $$
begin
  drop trigger if exists audit_children on public.children;
  create trigger audit_children after insert or delete on public.children for each row execute function public.trg_audit_row();
  drop trigger if exists audit_parent_profiles_cd on public.parent_profiles;
  create trigger audit_parent_profiles_cd after insert or delete on public.parent_profiles for each row execute function public.trg_audit_row();
  drop trigger if exists audit_parent_profiles_u on public.parent_profiles;
  create trigger audit_parent_profiles_u after update on public.parent_profiles for each row
    when (old.disabled is distinct from new.disabled) execute function public.trg_audit_row();
  drop trigger if exists audit_parent_children on public.parent_children;
  create trigger audit_parent_children after insert or delete on public.parent_children for each row execute function public.trg_audit_row();
  drop trigger if exists audit_reports_cd on public.progress_reports;
  create trigger audit_reports_cd after insert or delete on public.progress_reports for each row execute function public.trg_audit_row();
  drop trigger if exists audit_reports_u on public.progress_reports;
  create trigger audit_reports_u after update on public.progress_reports for each row
    when (old.status is distinct from new.status) execute function public.trg_audit_row();
  drop trigger if exists audit_appointments on public.appointments;
  create trigger audit_appointments after insert or update or delete on public.appointments for each row execute function public.trg_audit_row();
  drop trigger if exists audit_messages on public.messages;
  create trigger audit_messages after insert or delete on public.messages for each row execute function public.trg_audit_row();
  drop trigger if exists audit_documents on public.documents;
  create trigger audit_documents after insert or delete on public.documents for each row execute function public.trg_audit_row();
end $$;

-- =====================================================================
-- 9) الإحصائيات الشاملة للوحة التحكم
-- =====================================================================
create or replace function public.admin_family_counts()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_manage_families() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'children',              (select count(*) from public.children where active),
    'children_all',          (select count(*) from public.children),
    'parents_active',        (select count(*) from public.parent_profiles where not disabled),
    'parents_disabled',      (select count(*) from public.parent_profiles where disabled),
    'parents_total',         (select count(*) from public.parent_profiles),
    'reports_draft',         (select count(*) from public.progress_reports where status = 'draft'),
    'reports_published',     (select count(*) from public.progress_reports where status = 'published'),
    'appointments_upcoming', (select count(*) from public.appointments where status = 'scheduled' and starts_at >= now()),
    'messages_draft',        (select count(*) from public.messages where published_at is null),
    'messages_published',    (select count(*) from public.messages where published_at is not null),
    'documents_total',       (select count(*) from public.documents),
    'documents_shared',      (select count(*) from public.documents where shared_with_parent)
  );
end $$;
revoke all on function public.admin_family_counts() from public, anon;
grant execute on function public.admin_family_counts() to authenticated;

-- قائمة المديرين (تُستدعى من لوحة الحسابات الإدارية)
create or replace function public.admin_list()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare v_owner uuid; v_out jsonb;
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select a.user_id into v_owner from public.admins a order by a.created_at asc, a.user_id asc limit 1;
  select jsonb_build_object(
           'can_manage', auth.uid() = v_owner,
           'admins', coalesce(jsonb_agg(jsonb_build_object(
               'id', a.user_id, 'email', u.email, 'created_at', a.created_at,
               'last_sign_in_at', u.last_sign_in_at, 'role', a.role, 'disabled', a.disabled,
               'is_owner', a.user_id = v_owner, 'is_me', a.user_id = auth.uid())
             order by a.created_at asc, a.user_id asc), '[]'::jsonb))
    into v_out
    from public.admins a join auth.users u on u.id = a.user_id;
  return v_out;
end $$;
revoke all on function public.admin_list() from public, anon;
grant execute on function public.admin_list() to authenticated;

notify pgrst, 'reload schema';

-- =====================================================================
-- تهانينا! اكتمل إعداد قاعدة بيانات دار الإحسان بنجاح.
-- الخطوة التالية: تعيين حسابك كمدير رئيسي:
-- 1. أنشئ حسابك من Supabase Dashboard ▸ Authentication ▸ Users ▸ Add user
-- 2. نفّذ هذا الأمر (استبدل بريدك الفعلي):
--    INSERT INTO public.admins (user_id, role)
--    SELECT id, 'admin' FROM auth.users WHERE email = 'ضع-بريدك@example.com';
-- =====================================================================
