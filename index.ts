// الملف: index.ts (الدالة الخلفية admin-users). انشرها من Supabase ▸ Edge Functions ▸ Deploy a new function ▸ الاسم admin-users ▸ الصق هذا الملف.
// Edge Function: admin-users — إنشاء حسابات الأولياء والمديرين بدعوة بريدية (بلا كلمات مرور تمر عبر المتصفح).
// المفتاح السري SUPABASE_SERVICE_ROLE_KEY يُحقن تلقائيًا في بيئة Supabase ولا يوضع في أي ملف.
// الأسرار المطلوبة: supabase secrets set ALLOWED_ORIGINS="https://<user>.github.io" SITE_URL="https://<user>.github.io/<repo>"
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_BODY = 10_000;

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

function cors(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': (!ALLOWED.length || !ALLOWED[0]) ? (origin || '*') : (ALLOWED.includes(origin || '') ? (origin || '*') : '*'),
  };
  return h;
}
const json = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });

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
  if (allowed !== true) return json(429, { error: 'محاولات كثيرة. انتظر دقيقة.' }, origin);

  // 5) التحقق من المدخلات
  let input: z.infer<typeof Body>;
  try { input = Body.parse(JSON.parse(raw)); } catch { return json(400, { error: 'بيانات غير صالحة.' }, origin); }

  const audit = (action: string, target: string) =>
    svc.from('admin_audit').insert({ actor: actor.id, actor_email: actor.email, action, target: target.slice(0, 200) });
  const fail = (e: unknown, msg: string, status = 500) => {
    console.error('admin-users error:', (e as { message?: string })?.message ?? 'unknown');   // لا نسجّل المدخلات
    return json(status, { error: msg }, origin);
  };
  const redirect = (path: string) => (SITE_URL ? SITE_URL + path : undefined);

  try {
    if (input.action === 'invite_parent') {
      if (input.child_ids.length) {
        const { data: found } = await svc.from('children').select('id').in('id', input.child_ids);
        if ((found?.length ?? 0) !== new Set(input.child_ids).size) return json(400, { error: 'أحد الأطفال المحدَّدين غير موجود.' }, origin);
      }
      const inv = await svc.auth.admin.inviteUserByEmail(input.email, { redirectTo: redirect('/parent.html') });
      if (inv.error || !inv.data.user) {
        const exists = /already|registered|exists/i.test(inv.error?.message ?? '');
        return fail(inv.error, exists ? 'هذا البريد مسجَّل مسبقًا.' : 'تعذّر إرسال الدعوة. تحقق من إعداد البريد (SMTP) في Supabase.', exists ? 409 : 500);
      }
      const uid = inv.data.user.id;
      const prof = await svc.from('parent_profiles').insert({ user_id: uid, full_name: input.full_name, email: input.email, phone: input.phone ?? null, created_by: actor.id });
      let linkErr = prof.error;
      if (!linkErr && input.child_ids.length) {
        linkErr = (await svc.from('parent_children').insert(input.child_ids.map((c) => ({ parent_id: uid, child_id: c })))).error;
      }
      if (linkErr) {
        await svc.auth.admin.deleteUser(uid);          // تراجع كامل كي لا يبقى حساب بلا ملف
        return fail(linkErr, 'تعذّر إنشاء الحساب.');
      }
      await audit('parent:invite', uid);
      return json(200, { ok: true, user_id: uid }, origin);
    }

    if (input.action === 'resend_parent_invite') {
      const { data: prof, error: profErr } = await svc.from('parent_profiles').select('email, full_name, disabled').eq('user_id', input.user_id).single();
      if (profErr || !prof) return fail(profErr, 'ملف ولي الأمر غير موجود.', 404);
      if (prof.disabled) return fail(null, 'لا يمكن إرسال دعوة لحساب معطّل. قم بتفعيل الحساب أولًا.', 400);
      if (!prof.email) return fail(null, 'البريد الإلكتروني للولي غير مسجّل.', 400);

      const { data: uObj, error: uErr } = await svc.auth.admin.getUserById(input.user_id);
      if (uErr || !uObj?.user) return fail(uErr, 'حساب المستخدم غير موجود في نظام المصادقة.', 404);

      let sendErr: Error | null = null;
      if (!uObj.user.email_confirmed_at) {
        const inv = await svc.auth.admin.inviteUserByEmail(prof.email, { redirectTo: redirect('/parent.html') });
        if (inv.error) sendErr = inv.error;
      } else {
        const rst = await svc.auth.resetPasswordForEmail(prof.email, { redirectTo: redirect('/parent.html') });
        if (rst.error) sendErr = rst.error;
      }
      if (sendErr) {
        return fail(sendErr, 'تعذّر إرسال البريد. تحقق من إعدادات SMTP في Supabase.');
      }
      await audit('parent:resend_invite', input.user_id);
      return json(200, { ok: true, email: prof.email }, origin);
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
        const exists = /already|registered|exists/i.test(inv.error?.message ?? '');
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
