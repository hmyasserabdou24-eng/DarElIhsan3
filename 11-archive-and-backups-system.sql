-- =====================================================================
-- 11-archive-and-backups-system.sql
-- دار الإحسان — نظام الأرشفة الشاملة والنسخ الاحتياطي التلقائي
-- =====================================================================

create table if not exists public.archive_runs (
  id              uuid primary key default gen_random_uuid(),
  run_date        timestamptz not null default now(),
  period_year     int not null check (period_year between 2020 and 2100),
  period_month    int not null check (period_month between 1 and 12),
  archive_scope   text not null check (archive_scope in ('all', 'branch', 'section', 'child', 'reports_only', 'docs_only', 'custom', 'monthly_auto')),
  scope_filter    jsonb,
  initiated_by    uuid references auth.users(id) on delete set null,
  initiator_name  text,
  status          text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'completed_with_errors', 'failed')),
  total_records   int not null default 0,
  success_count   int not null default 0,
  failed_count    int not null default 0,
  file_size_bytes bigint default 0,
  storage_path    text,
  download_url    text,
  error_summary   text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists archive_runs_period_idx on public.archive_runs (period_year, period_month);
create index if not exists archive_runs_date_idx on public.archive_runs (run_date desc);

create table if not exists public.archive_records (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null references public.archive_runs(id) on delete cascade,
  child_id        uuid references public.children(id) on delete set null,
  child_name      text,
  branch_name     text,
  section_name    text,
  record_type     text not null check (record_type in ('report', 'evaluation', 'document', 'attachment', 'meta')),
  original_name   text,
  archive_path    text not null,
  file_date       date,
  status          text not null default 'success' check (status in ('success', 'failed')),
  error_message   text,
  created_at      timestamptz not null default now()
);

create index if not exists archive_records_run_idx on public.archive_records (run_id);
create index if not exists archive_records_child_idx on public.archive_records (child_id);

alter table public.archive_runs enable row level security;
alter table public.archive_records enable row level security;

drop policy if exists "archive_runs: admin read" on public.archive_runs;
create policy "archive_runs: admin read" on public.archive_runs for select to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'owner'), false)
  or exists (select 1 from public.admins a where a.user_id = auth.uid() and a.active = true)
);

drop policy if exists "archive_runs: admin write" on public.archive_runs;
create policy "archive_runs: admin write" on public.archive_runs for all to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'owner'), false)
  or exists (select 1 from public.admins a where a.user_id = auth.uid() and a.active = true)
)
with check (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'owner'), false)
  or exists (select 1 from public.admins a where a.user_id = auth.uid() and a.active = true)
);

drop policy if exists "archive_records: admin read" on public.archive_records;
create policy "archive_records: admin read" on public.archive_records for select to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'owner'), false)
  or exists (select 1 from public.admins a where a.user_id = auth.uid() and a.active = true)
);

drop policy if exists "archive_records: admin write" on public.archive_records;
create policy "archive_records: admin write" on public.archive_records for all to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'owner'), false)
  or exists (select 1 from public.admins a where a.user_id = auth.uid() and a.active = true)
)
with check (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'owner'), false)
  or exists (select 1 from public.admins a where a.user_id = auth.uid() and a.active = true)
);

create or replace function public.log_archive_operation(
  p_period_year int,
  p_period_month int,
  p_scope text,
  p_scope_filter jsonb,
  p_initiator_name text,
  p_status text,
  p_total int,
  p_success int,
  p_failed int,
  p_size_bytes bigint,
  p_error_summary text default null
) returns uuid
language plpgsql security definer set search_path = public as 24899
declare
  v_run_id uuid;
begin
  insert into public.archive_runs (
    period_year, period_month, archive_scope, scope_filter,
    initiated_by, initiator_name, status,
    total_records, success_count, failed_count, file_size_bytes,
    error_summary, completed_at
  ) values (
    p_period_year, p_period_month, p_scope, p_scope_filter,
    auth.uid(), p_initiator_name, p_status,
    p_total, p_success, p_failed, p_size_bytes,
    p_error_summary, now()
  ) returning id into v_run_id;

  return v_run_id;
end;
24899;

grant execute on function public.log_archive_operation to authenticated;
notify pgrst, 'reload schema';
