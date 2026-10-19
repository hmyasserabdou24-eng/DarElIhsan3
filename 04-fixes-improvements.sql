-- =====================================================================
--  دار الإحسان — المرحلة 4: إصلاحات وتحسينات (آمن لإعادة التشغيل)
--  يتطلب تشغيل schema.sql ثم users-setup.sql ثم 02-families-portal.sql أولًا.
--  شغّله في Supabase Dashboard ▸ SQL Editor ▸ New query ▸ Run
-- =====================================================================

-- 1) تحسين دالة admin_audit_list لدعم تصفية أفضل
create or replace function public.admin_audit_list(p_limit int default 50, p_action_filter text default null)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
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

-- احتفظ بالتوقيع القديم (p_limit فقط) للتوافق مع manage.js الحالي
create or replace function public.admin_audit_list(p_limit int)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select public.admin_audit_list(p_limit, null);
$$;
revoke all on function public.admin_audit_list(int) from public, anon;
grant execute on function public.admin_audit_list(int) to authenticated;

-- 2) إحصائيات موسّعة تشمل عدد الأولياء الكلي والمعطَّلين والإعلانات المنشورة
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

-- 3) فهرس على parent_profiles لتسريع البحث بالاسم
create index if not exists parent_profiles_name_idx on public.parent_profiles using gin(to_tsvector('simple', full_name));

-- 4) فهرس على children لتسريع البحث بالاسم
create index if not exists children_name_idx on public.children using gin(to_tsvector('simple', full_name));

-- 5) تأكد من وجود عمود email في parent_profiles (قد تكون موجودة من 02-families-portal.sql)
alter table public.parent_profiles add column if not exists email text check (email is null or char_length(email) <= 254);

-- 6) إعادة تعريف سياسات audit_log لتدعم عمليات الأولياء (إذا لم تكن موجودة)
-- دالة audit_log موجودة في users-setup.sql، لا نعيد تعريفها هنا

-- 7) منح صلاحيات مناسبة على جدول rate_limits للـ service_role
grant all on public.rate_limits to service_role;
grant all on public.admin_audit to service_role;

-- 8) مزامنة تلقائية لملفات الأولياء عند دعوة أو إنشاء أي مستخدم من لوحة تحكم Supabase (Auth > Users)
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

notify pgrst, 'reload schema';
