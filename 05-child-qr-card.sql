-- =====================================================================
--  دار الإحسان — 05: بطاقة المنخرط + رمز QR لكل طفل + حذف الطفل بأمان
--  آمن لإعادة التشغيل (idempotent). لا يُنشئ جداول جديدة ولا يحذف بيانات.
--  يُشغَّل بعد 00-full-database-setup.sql و04-hardening.sql.
--  ⚠️ شغّله على فرع تجريبي أولًا إن أمكن، وخذ نسخة احتياطية قبل التطبيق على الإنتاج.
--  ⚠️ لا تُعِد تشغيل 00-full-database-setup.sql أو 02-families-portal.sql بعد هذا الملف: كلاهما يمنح
--     SELECT على جدول children كاملًا، فيعود عمود qr_token للأولياء. إن أعدت تشغيلهما فأعد تشغيل هذا الملف.
-- =====================================================================

-- 1) تسلسل رقم المنخرط + الأعمدة الجديدة
create sequence if not exists public.children_member_no_seq;

alter table public.children
  add column if not exists member_no      bigint,
  add column if not exists enrolled_on    date,
  add column if not exists qr_token       text,
  add column if not exists qr_show_extra  boolean not null default false;

-- تعبئة السجلات الموجودة (الأطفال الحاليون يحصلون على رقم ورمز)
update public.children set member_no = nextval('public.children_member_no_seq') where member_no is null;
update public.children set qr_token = replace(gen_random_uuid()::text, '-', '')   where qr_token is null;

-- القيم الافتراضية: كل طفل جديد يحصل تلقائيًا على رقم منخرط ورمز QR عشوائي (128 بت)
alter table public.children alter column member_no set default nextval('public.children_member_no_seq');
alter table public.children alter column qr_token  set default replace(gen_random_uuid()::text, '-', '');
alter table public.children alter column member_no set not null;
alter table public.children alter column qr_token  set not null;

create unique index if not exists children_member_no_key on public.children (member_no);
create unique index if not exists children_qr_token_key  on public.children (qr_token);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'children_qr_token_fmt') then
    alter table public.children add constraint children_qr_token_fmt check (qr_token ~ '^[0-9a-f]{32}$');
  end if;
end $$;

-- التسلسل يُستعمل داخل INSERT الذي ينفّذه المدير
grant usage, select on sequence public.children_member_no_seq to authenticated;

-- 2) حماية رمز QR: لا يقرأه إلا المدير عبر دالة (لا عبر جدول الأطفال مباشرة)
--    كان للأولياء صلاحية قراءة الصف كاملًا؛ نقصرها الآن على أعمدة محددة لا تشمل qr_token.
revoke select on public.children from authenticated;
grant select (id, full_name, center, section, basic_info, photo_consent, active, created_by,
              created_at, updated_at, member_no, enrolled_on, qr_show_extra) on public.children to authenticated;

-- 3) بطاقة الطفل للمدير (تشمل رمز QR) — المدير فقط
create or replace function public.admin_child_card(p_child_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r public.children%rowtype;
begin
  if not public.can_manage_families() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  select * into r from public.children where id = p_child_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  return jsonb_build_object(
    'id', r.id, 'full_name', r.full_name, 'center', r.center,
    'section', r.section, 'qr_show_extra', r.qr_show_extra,
    'member_no', r.member_no, 'enrolled_on', r.enrolled_on,
    'qr_token', r.qr_token, 'active', r.active
  );
end $$;
revoke all on function public.admin_child_card(uuid) from public, anon;
grant execute on function public.admin_child_card(uuid) to authenticated;

-- 4) إعادة إصدار رمز QR: يُبطل الرمز القديم فورًا
create or replace function public.admin_reissue_child_qr(p_child_id uuid)
returns text language plpgsql security definer set search_path = public, auth as $$
declare v_token text; v_email text;
begin
  if not public.can_manage_families() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  update public.children
     set qr_token = replace(gen_random_uuid()::text, '-', '')
   where id = p_child_id
  returning qr_token into v_token;
  if v_token is null then raise exception 'NOT_FOUND'; end if;

  select email into v_email from auth.users where id = auth.uid();
  insert into public.admin_audit (actor, actor_email, action, target)
  values (auth.uid(), v_email, 'child_qr:reissue', p_child_id::text);
  return v_token;
end $$;
revoke all on function public.admin_reissue_child_qr(uuid) from public, anon;
grant execute on function public.admin_reissue_child_qr(uuid) to authenticated;

-- 5) الصفحة العامة لرمز QR: تقبل رمزًا صالحًا لطفل نشط فقط، وتُرجع الحد الأدنى من المعلومات.
--    لا تُرجع أبدًا: basic_info، الصحة، التقارير، المواعيد، الأولياء، أو معرّف الطفل.
--    لا يوجد أي تمييز في الرد بين «رمز خاطئ» و«ملغى» و«محذوف» و«مؤرشف».
create or replace function public.public_child_card(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
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
end $$;
revoke all on function public.public_child_card(text) from public;
grant execute on function public.public_child_card(text) to anon, authenticated;

-- 6) حذف الطفل بأمان
--    - المدير فقط.
--    - إن كانت لديه تقارير تربوية: يُرفض الحذف للحفاظ على السجلات التاريخية (يُؤرشَف بدلًا منه).
--    - يُحذف الطفل وروابطه (parent_children) ومواعيده ورسائله الخاصة به والوثائق المرتبطة به (cascade).
--    - حسابات الأولياء لا تُحذف أبدًا.
--    - تُرجع مسارات الملفات الخاصة في Storage ليحذفها التطبيق (لا يمكن حذف Storage من SQL).
--    - يختفي رمز QR تلقائيًا لأن الصف نفسه يُحذف، فتعود صفحة QR «غير متاحة».
create or replace function public.admin_delete_child(p_child_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_paths text[];
begin
  if not public.can_manage_families() then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;
  if not exists (select 1 from public.children where id = p_child_id) then
    raise exception 'NOT_FOUND';
  end if;
  if exists (select 1 from public.progress_reports where child_id = p_child_id) then
    raise exception 'HAS_REPORTS';
  end if;
  select coalesce(array_agg(storage_path), '{}') into v_paths
    from public.documents where child_id = p_child_id;
  delete from public.children where id = p_child_id;
  return jsonb_build_object('storage_paths', to_jsonb(v_paths));
end $$;
revoke all on function public.admin_delete_child(uuid) from public, anon;
grant execute on function public.admin_delete_child(uuid) to authenticated;
