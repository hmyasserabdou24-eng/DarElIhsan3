// الملف: index.ts (الدالة الخلفية admin-users). انشرها من Supabase ▸ Edge Functions ▸ admin-users ▸ Deploy (verify_jwt = true).
// Edge Function: admin-users — إنشاء حسابات الأولياء والمديرين بدعوة بريدية (بلا كلمات مرور تمر عبر المتصفح).
// المفتاح السري SUPABASE_SERVICE_ROLE_KEY يُحقن تلقائيًا في بيئة Supabase ولا يوضع في أي ملف.
// الأسرار (Edge Functions ▸ Secrets): ALLOWED_ORIGINS="https://hmyasserabdou24-eng.github.io"  SITE_URL="https://hmyasserabdou24-eng.github.io/DarElIhsan3"
//
// تعديلات 2026-10-20 (إصلاح الدعوات):
//  1) لا نستدعي generateLink أبدًا قبل/بعد إرسال البريد: كل استدعاء يولّد رمزًا جديدًا في GoTrue، وقد يُبطل رمز الرسالة التي أُرسلت،
//     وفي حالة الاستعادة يفعّل حد «طلب واحد كل 59 ثانية» فلا يُرسل بريد الاستعادة أصلًا (ظهر 429 over_email_send_rate_limit في السجلات).
//  2) لا نُرجع action_link إلى المتصفح (رابط يسمح بالدخول بحساب الولي) ولا نكشف نصوص أخطاء قاعدة البيانات.
//  3) كل رد يميّز بين «قبلت خدمة البريد الرسالة» (email_dispatched) و«وصلت فعليًا» (لا يمكن معرفتها من هنا أبدًا).
//  4) رسالة واحدة فقط لكل طلب: لا إعادة محاولة تلقائية ولا إرسال مزدوج.
//  5) الافتراضي لـ SITE_URL يتضمن مسار المستودع /DarElIhsan3 (كان ينقصه فيؤدي لصفحة 404 إن غاب السر).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DEFAULT_SITE_URL = 'https://hmyasserabdou24-eng.github.io/DarElIhsan3';
const SITE_URL = (Deno.env.get('SITE_URL') ?? DEFAULT_SITE_URL).replace(/\/$/, '');
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://hmyasserabdou24-eng.github.io').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_BODY = 10_000;
const MAIL_TIMEOUT_MS = 15_000;

const email = z.string().trim().toLowerCase().email().max(254);
const uuid = z.string().uuid();
const Body = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('invite_parent'),
    email,
    full_name: z.string().trim().min(2).max(120),
    phone: z.string().trim().regex(/^[0-9+()\s.-]{5,25}$/).optional(),
    child_ids: z.array(uuid).max(10).default([]),
  }),
  z.object({ action: z.literal('resend_parent_invite'), user_id: uuid }),
  z.object({ action: z.literal('set_parent_disabled'), user_id: uuid, disabled: z.boolean() }),
  z.object({ action: z.literal('invite_admin'), email, role: z.enum(['admin', 'editor']) }),
  z.object({ action: z.literal('set_admin_disabled'), user_id: uuid, disabled: z.boolean() }),
]);

// سجلات تشخيصية بلا أسرار: تُحجب أي مفاتيح حساسة ويُقنَّع البريد
function logDiag(stage: string, details: Record<string, unknown> = {}) {
  const clean: Record<string, unknown> = { stage };
  for (const [k, v] of Object.entries(details)) {
    if (/token|password|secret|auth|key|headers|link/i.test(k)) continue;
    if (k === 'email' && typeof v === 'string') {
      const parts = v.split('@');
      clean[k] = parts.length === 2 ? `${parts[0].slice(0, 2)}***@${parts[1]}` : '***';
    } else {
      clean[k] = v;
    }
  }
  console.log(`[admin-users:diag] ${JSON.stringify(clean)}`);
}

function cors(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': (!ALLOWED.length || !ALLOWED[0]) ? (origin || '*') : (ALLOWED.includes(origin || '') ? (origin || '*') : '*'),
  };
}
const json = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });

// ---- إرسال بريد المصادقة وتصنيف النتيجة ----
type MailState = 'accepted' | 'already_registered' | 'rate_limited' | 'smtp_rejected' | 'unknown';
const MAIL_TEXT: Record<MailState, string | null> = {
  accepted: null,
  already_registered: null,
  rate_limited: 'يُسمح برسالة واحدة لكل حساب كل دقيقة تقريبًا. انتظر دقيقة ثم أعد المحاولة.',
  smtp_rejected: 'رفض خادم البريد (SMTP) الرسالة. راجع إعدادات SMTP في Supabase (غالبًا اسم المستخدم أو كلمة مرور التطبيق).',
  unknown: 'لم يصل ردّ خادم البريد خلال المهلة؛ قد تكون الرسالة أُرسلت. تحقق من الولي قبل إعادة الإرسال.',
};
function classify(err: { message?: string; code?: string; status?: number } | null): MailState {
  if (!err) return 'accepted';
  const msg = String(err.message ?? ''), code = String(err.code ?? '');
  if (code === 'over_email_send_rate_limit' || err.status === 429 || /only request this after|rate limit/i.test(msg)) return 'rate_limited';
  if (code === 'email_exists' || /already.*registered|already been registered|email_exists/i.test(msg + ' ' + code)) return 'already_registered';
  return 'smtp_rejected';
}
async function timed<T>(p: Promise<T>): Promise<T | 'timeout'> {
  let t: number | undefined;
  const to = new Promise<'timeout'>((res) => { t = setTimeout(() => res('timeout'), MAIL_TIMEOUT_MS) as unknown as number; });
  try { return await Promise.race([p, to]); } finally { if (t !== undefined) clearTimeout(t); }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, origin);

  // 1) حدّ حجم الطلب
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { error: 'الطلب كبير جدًا.' }, origin);

  // 2) هوية المتصل: تُستخرج من الجلسة الموقّعة، لا من أي حقل في الطلب
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json(401, { error: 'غير مصرّح.' }, origin);
  const userClient = createClient(SB_URL, SB_ANON, { global: { headers: { Authorization: auth } } });
  const { data: u, error: uErr } = await userClient.auth.getUser();
  if (uErr || !u?.user) return json(401, { error: 'انتهت الجلسة. سجّل الدخول من جديد.' }, origin);
  const actor = u.user;

  // 3) الصلاحية يتحقق منها قاعدة البيانات نفسها (جدول admins) في كل عملية
  const { data: canFamilies } = await userClient.rpc('can_manage_families');
  if (canFamilies !== true) return json(403, { error: 'ليست لديك صلاحية تنفيذ هذه العملية.' }, origin);
  const { data: isOwner } = await userClient.rpc('is_owner');

  const svc = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  // 4) تحديد المعدل (عدّاد في قاعدة البيانات، لا في المتصفح)
  const { data: allowed } = await svc.rpc('rate_limit_hit', { p_key: 'admin-users:' + actor.id, p_max: 30, p_window_seconds: 60 });
  if (allowed !== true) return json(429, { error: 'محاولات كثيرة. انتظر دقيقة.', code: 'over_email_send_rate_limit' }, origin);

  // 5) التحقق من المدخلات
  let input: z.infer<typeof Body>;
  try { input = Body.parse(JSON.parse(raw)); } catch { return json(400, { error: 'بيانات غير صالحة.' }, origin); }

  const audit = (action: string, target: string) =>
    svc.from('admin_audit').insert({ actor: actor.id, actor_email: actor.email, action, target: target.slice(0, 200) });
  const fail = (e: unknown, msg: string, status = 500) => {
    logDiag('operation_failed', { error: (e as { message?: string })?.message ?? 'unknown', status });
    return json(status, { error: msg }, origin);
  };
  const redirect = (path: string) => `${SITE_URL}${path}`;

  // البحث عن معرّف مستخدم موجود عبر البريد (للحالات التي ينشئ فيها GoTrue الحساب ثم يفشل الإرسال أو يكون الحساب مسجلًا)
  async function findUserId(mail: string): Promise<string | null> {
    const p = await svc.from('parent_profiles').select('user_id').eq('email', mail).maybeSingle();
    if (p.data?.user_id) return p.data.user_id as string;
    for (let page = 1; page <= 5; page++) {                       // مركز صغير: 5×1000 كافية، ونتوقف مبكرًا
      const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users?.length) return null;
      const hit = data.users.find((x) => (x.email ?? '').toLowerCase() === mail);
      if (hit) return hit.id;
      if (data.users.length < 1000) return null;
    }
    return null;
  }

  try {
    if (input.action === 'invite_parent') {
      logDiag('invite_start', { email: input.email, children_count: input.child_ids.length });

      if (input.child_ids.length) {
        const { data: found } = await svc.from('children').select('id').in('id', input.child_ids);
        if ((found?.length ?? 0) !== new Set(input.child_ids).size) return json(400, { error: 'أحد الأطفال المحدَّدين غير موجود.' }, origin);
      }

      const redirectUrl = redirect('/parent.html');
      let uid: string | null = null;
      let state: MailState;

      // محاولة واحدة فقط (لا إعادة محاولة تلقائية ولا إرسال مزدوج)
      const inv = await timed(svc.auth.admin.inviteUserByEmail(input.email, { redirectTo: redirectUrl, data: { full_name: input.full_name } }));
      if (inv === 'timeout') {
        state = 'unknown';
      } else {
        state = classify(inv.error as { message?: string; code?: string; status?: number } | null);
        if (!inv.error && inv.data?.user) uid = inv.data.user.id;
      }
      logDiag('invite_result', { email: input.email, state });

      if (!uid) uid = await findUserId(input.email);   // أُنشئ الحساب رغم فشل الإرسال/الانتهاء، أو كان مسجّلًا من قبل
      if (!uid) return fail(null, 'تعذّر إنشاء الحساب أو تحديده. تحقق من إعداد البريد (SMTP) في Supabase ثم أعد المحاولة.', state === 'rate_limited' ? 429 : 502);

      // حساب موجود ومفعّل: لا يُعاد «دعوته»؛ نرسل له رابط استعادة واحدًا فقط (بلا أي generateLink قبله)
      let reset: MailState | null = null;
      if (state === 'already_registered') {
        const rst = await timed(svc.auth.resetPasswordForEmail(input.email, { redirectTo: redirectUrl }));
        reset = rst === 'timeout' ? 'unknown' : classify(rst.error as { message?: string; code?: string; status?: number } | null);
        logDiag('existing_user_reset_result', { email: input.email, state: reset });
      }

      const prof = await svc.from('parent_profiles').upsert({
        user_id: uid, full_name: input.full_name, email: input.email, phone: input.phone ?? null, created_by: actor.id,
      }, { onConflict: 'user_id' });
      if (prof.error) return fail(prof.error, 'تعذّر حفظ بيانات ملف الولي.');

      if (input.child_ids.length) {
        const { error: linkErr } = await svc.from('parent_children').upsert(
          input.child_ids.map((c) => ({ parent_id: uid!, child_id: c })), { onConflict: 'parent_id,child_id' });
        if (linkErr) return fail(linkErr, 'تعذّر ربط الأبناء بملف الولي.');
      }

      const final: MailState = state === 'already_registered' ? (reset ?? 'unknown') : state;
      await audit(state === 'already_registered' ? 'parent:relink_existing' : 'parent:invite', uid);
      return json(200, {
        ok: true,
        user_id: uid,
        account_created: state !== 'already_registered',
        already_registered: state === 'already_registered',
        email_dispatched: final === 'accepted',   // = قبلت خدمة SMTP الرسالة؛ ليس دليلًا على وصولها لصندوق الوارد
        email_status: final,
        email_error: MAIL_TEXT[final],
      }, origin);
    }

    if (input.action === 'resend_parent_invite') {
      logDiag('resend_start', { user_id: input.user_id });
      const { data: prof, error: profErr } = await svc.from('parent_profiles').select('email, full_name, disabled').eq('user_id', input.user_id).single();
      if (profErr || !prof) return fail(profErr, 'ملف ولي الأمر غير موجود.', 404);
      if (prof.disabled) return fail(null, 'لا يمكن إرسال دعوة لحساب معطّل. قم بتفعيل الحساب أولًا.', 400);
      if (!prof.email) return fail(null, 'البريد الإلكتروني للولي غير مسجّل.', 400);

      const redirectUrl = redirect('/parent.html');
      const { data: uObj, error: uoErr } = await svc.auth.admin.getUserById(input.user_id);
      if (uoErr || !uObj?.user) return fail(uoErr, 'حساب المستخدم غير موجود في نظام المصادقة.', 404);
      const confirmed = !!uObj.user.email_confirmed_at;

      // رسالة واحدة فقط: دعوة لمن لم يفعّل حسابه، واستعادة كلمة المرور لمن فعّله
      const sent = await timed(confirmed
        ? svc.auth.resetPasswordForEmail(prof.email, { redirectTo: redirectUrl })
        : svc.auth.admin.inviteUserByEmail(prof.email, { redirectTo: redirectUrl }));
      const state: MailState = sent === 'timeout' ? 'unknown' : classify(sent.error as { message?: string; code?: string; status?: number } | null);
      logDiag('resend_result', { email: prof.email, is_confirmed: confirmed, state });

      await audit('parent:resend_invite', input.user_id);
      return json(200, {
        ok: true,
        email: prof.email,
        kind: confirmed ? 'password_reset' : 'invite',
        email_dispatched: state === 'accepted',
        email_status: state,
        email_error: MAIL_TEXT[state],
      }, origin);
    }

    if (input.action === 'set_parent_disabled') {
      const up = await svc.from('parent_profiles').update({ disabled: input.disabled }).eq('user_id', input.user_id).select('user_id');
      if (up.error || !up.data?.length) return fail(up.error, 'الحساب غير موجود.', 404);
      await svc.auth.admin.updateUserById(input.user_id, { ban_duration: input.disabled ? '876000h' : 'none' });
      await audit(input.disabled ? 'parent:disable_login' : 'parent:enable_login', input.user_id);
      return json(200, { ok: true }, origin);
    }

    // عمليات حسابات الإدارة: للمالك فقط
    if (isOwner !== true) return json(403, { error: 'هذه العملية للمالك فقط.' }, origin);

    if (input.action === 'invite_admin') {
      const inv = await svc.auth.admin.inviteUserByEmail(input.email, { redirectTo: redirect('/admin.html') });
      if (inv.error || !inv.data.user) {
        const exists = classify(inv.error as { message?: string; code?: string; status?: number } | null) === 'already_registered';
        return fail(inv.error, exists ? 'هذا البريد مسجَّل مسبقًا.' : 'تعذّر إرسال الدعوة.', exists ? 409 : 500);
      }
      const ins = await svc.from('admins').insert({ user_id: inv.data.user.id, role: input.role });
      if (ins.error) { await svc.auth.admin.deleteUser(inv.data.user.id); return fail(ins.error, 'تعذّر إنشاء الحساب.'); }
      await audit('admin:invite', inv.data.user.id + ':' + input.role);
      return json(200, { ok: true, user_id: inv.data.user.id }, origin);
    }

    if (input.action === 'set_admin_disabled') {
      if (input.user_id === actor.id) return json(400, { error: 'لا يمكنك تعطيل حسابك.' }, origin);
      const { data: first } = await svc.from('admins').select('user_id').order('created_at', { ascending: true }).order('user_id', { ascending: true }).limit(1).single();
      if (first?.user_id === input.user_id) return json(400, { error: 'لا يمكن تعطيل حساب المالك.' }, origin);
      const up = await svc.from('admins').update({ disabled: input.disabled }).eq('user_id', input.user_id).select('user_id');
      if (up.error || !up.data?.length) return fail(up.error, 'الحساب غير موجود.', 404);
      await svc.auth.admin.updateUserById(input.user_id, { ban_duration: input.disabled ? '876000h' : 'none' });
      await audit(input.disabled ? 'admin:disable' : 'admin:enable', input.user_id);
      return json(200, { ok: true }, origin);
    }
  } catch (e) {
    return fail(e, 'حدث خطأ غير متوقع.');
  }
  return json(400, { error: 'عملية غير معروفة.' }, origin);
});
