-- =====================================================================
--  دار الإحسان — مخطط قاعدة البيانات والتخزين والأمان (Supabase)
--  شغّله مرة واحدة: Supabase Dashboard ▸ SQL Editor ▸ New query ▸ Run
-- =====================================================================

-- 1) المديرون: جدول لا يمكن قراءته ولا تعديله عبر الـ API إطلاقًا
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;   -- بلا أي سياسة = مغلق أمام الجميع
revoke all on public.admins from anon, authenticated;

-- 2) دالة التحقق من المدير (تُنفَّذ بصلاحيات المالك لقراءة جدول admins)
--    لإلزام المصادقة الثنائية لاحقًا انظر القسم الاختياري في الأسفل.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 3) محتوى الموقع: صف 'draft' (مسودة المدير) وصف 'published' (ما يراه الزوار)
create table if not exists public.site_content (
  id         text primary key check (id in ('draft', 'published')),
  data       jsonb not null default '{}'::jsonb check (octet_length(data::text) < 1000000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
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
-- ملاحظة: لا توجد سياسة تسمح بتعديل 'published' مباشرة؛ النشر يتم فقط عبر publish_content()

insert into public.site_content (id, data) values ('draft', '{}'::jsonb), ('published', '{}'::jsonb)
on conflict (id) do nothing;

-- 4) سجل النسخ المنشورة (آخر 30 نسخة) للرجوع إليها
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

-- 5) النشر: ينسخ المسودة إلى المنشور بشكل ذري بعد التحقق من أن المستدعي مدير
create or replace function public.publish_content()
returns timestamptz
language plpgsql security definer
set search_path = public
as $$
declare d jsonb; t timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select (data - '_portal_meta') into d from public.site_content where id = 'draft';
  if d is null then raise exception 'لا توجد مسودة'; end if;

  insert into public.site_content_history (data, published_by)
    select data, auth.uid() from public.site_content where id = 'published' and data <> '{}'::jsonb;

  insert into public.site_content (id, data, updated_at, updated_by)
    values ('published', d, t, auth.uid())
  on conflict (id) do update
    set data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by;

  delete from public.site_content_history
   where id not in (select id from public.site_content_history order by id desc limit 30);
  return t;
end $$;
revoke all on function public.publish_content() from public, anon;
grant execute on function public.publish_content() to authenticated;

-- 6) تحميل نسخة قديمة إلى المسودة (للمعاينة ثم النشر) — لا تمسّ المنشور
create or replace function public.load_version_to_draft(p_id bigint)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  update public.site_content
     set data = (select data from public.site_content_history where id = p_id),
         updated_at = now(), updated_by = auth.uid()
   where id = 'draft'
     and exists (select 1 from public.site_content_history where id = p_id);
end $$;
revoke all on function public.load_version_to_draft(bigint) from public, anon;
grant execute on function public.load_version_to_draft(bigint) to authenticated;

-- 7) التخزين: حاوية عامة للقراءة (لعرض الصور للزوار) وللكتابة/الحذف للمدير فقط
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

-- =====================================================================
-- 8) بعد إنشاء حساب المدير من Authentication ▸ Users ▸ Add user:
--    شغّل هذا السطر مرة واحدة مع بريدك الحقيقي لمنحه صلاحية الإدارة.
-- =====================================================================
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'ضع-بريدك-هنا@example.com';

-- =====================================================================
-- 9) اختياري (موصى به): إلزام المصادقة الثنائية TOTP على مستوى قاعدة البيانات.
--    نفّذه فقط بعد تفعيل المصادقة الثنائية من لوحة الإدارة (تبويب «النشر والأمان»)،
--    وإلا ستُقفل عن نفسك.
-- =====================================================================
-- create or replace function public.is_admin()
-- returns boolean language sql stable security definer set search_path = public as $$
--   select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
--      and exists (select 1 from public.admins where user_id = auth.uid());
-- $$;
