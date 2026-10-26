// الملف: index.ts (الدالة الخلفية admin-users). انشرها من Supabase ▸ Edge Functions ▸ Deploy a new function ▸ الاسم admin-users ▸ الصق هذا الملف.
// Edge Function: admin-users — إنشاء حسابات الأولياء والمديرين بدعوة بريدية (بلا كلمات مرور تمر عبر المتصفح).
// المفتاح السري SUPABASE_SERVICE_ROLE_KEY يُحقن تلقائيًا في بيئة Supabase ولا يوضع في أي ملف.
// الأسرار المطلوبة: supabase secrets set ALLOWED_ORIGINS="https://hmyasserabdou24-eng.github.io" SITE_URL="https://hmyasserabdou24-eng.github.io"
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DEFAULT_SITE_URL = 'https://hmyasserabdou24-eng.github.io/DarElIhsan3';
const SITE_URL = (Deno.env.get('SITE_URL') ?? DEFAULT_SITE_URL).replace(/\/$/, '');
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://hmyasserabdou24-eng.github.io').split(',').map((s) => s.trim()).filter(Boolean);
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
  z.object({ action: z.literal('remove_admin'), user_id: uuid }),
]);

function logDiag(stage: string, details: Record<string, unknown> = {}) {
  const clean: Record<string, unknown> = { stage, timestamp: new Date().toISOString() };
  for (const [k, v] of Object.entries(details)) {
    if (/token|password|secret|auth|key|headers/i.test(k)) continue;
    if (k === 'email' && typeof v === 'string') {
      const parts = v.split('@');
      clean[k] = parts.length === 2 ? `${parts[0].slice(0, 2)}***@${parts[1]}` : '***';
    } else {
      clean[k] = v;
    }
  }
  console.log(`[admin-users:diag] ${JSON.stringify(clean)}`);
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  if (!ALLOWED.length || !ALLOWED[0]) return false;
  return ALLOWED.includes(origin);
}

function cors(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED.includes(origin) ? origin : (ALLOWED[0] || 'https://hmyasserabdou24-eng.github.io');
  return {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
  };
}
const json = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (!isOriginAllowed(origin)) return json(403, { error: 'النطاق غير مصرّح به (CORS).' }, origin);
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
    logDiag('operation_failed', { error: (e as { message?: string })?.message ?? 'unknown', status });
    return json(status, { error: msg }, origin);
  };
  const redirect = (path: string) => `${SITE_URL}${path}`;

  try {
    if (input.action === 'invite_parent') {
      logDiag('invite_start', { email: input.email, children_count: input.child_ids.length });

      if (input.child_ids.length) {
        const { data: found } = await svc.from('children').select('id').in('id', input.child_ids);
        if ((found?.length ?? 0) !== new Set(input.child_ids).size) return json(400, { error: 'أحد الأطفال المحدَّدين غير موجود.' }, origin);
      }

      let uid: string | null = null;
      let emailDispatched = false;
      let emailError: string | null = null;
      let actionLink: string | null = null;
      let isExisting = false;

      const redirectUrl = redirect('/parent.html');
      logDiag('dispatch_attempt', { email: input.email, redirectTo: redirectUrl });

      // محاولة الإرسال الرسمية عبر inviteUserByEmail مع مهلة 15 ثانية
      try {
        const inv = await Promise.race([
          svc.auth.admin.inviteUserByEmail(input.email, {
            redirectTo: redirectUrl,
            data: { full_name: input.full_name }
          }),
          new Promise<{ data: { user: null }; error: { message: string; status: number; name: string } }>((_, reject) =>
            setTimeout(() => reject(new Error('انتهت مهلة استجابة خادم البريد (Timeout: 15s)')), 15000)
          )
        ]);

        if (inv.error) {
          const errMsg = inv.error.message || '';
          const isRegistered = /already|registered|exists/i.test(errMsg);

          if (isRegistered) {
            isExisting = true;
            logDiag('invite_already_registered', { email: input.email });
            const genRec = await svc.auth.admin.generateLink({
              type: 'magiclink',
              email: input.email,
              options: { redirectTo: redirectUrl }
            });
            if (genRec.data?.user) {
              uid = genRec.data.user.id;
              actionLink = genRec.data.properties?.action_link ?? null;
              try {
                const rst = await svc.auth.resetPasswordForEmail(input.email, { redirectTo: redirectUrl });
                if (!rst.error) emailDispatched = true;
                else emailError = rst.error.message;
              } catch (e: any) {
                emailError = e?.message ?? 'تعذّر إرسال بريد الاستعادة.';
              }
            } else {
              return fail(genRec.error, 'هذا البريد مسجّل مسبقًا، وتعذّر الوصول لبيانات حسابه.', 409);
            }
          } else {
            logDiag('invite_smtp_rejected', { email: input.email, message: errMsg });
            emailError = errMsg;
            emailDispatched = false;

            const genFallback = await svc.auth.admin.generateLink({
              type: 'invite',
              email: input.email,
              options: {
                redirectTo: redirectUrl,
                data: { full_name: input.full_name }
              }
            });
            if (genFallback.data?.user) {
              uid = genFallback.data.user.id;
              actionLink = genFallback.data.properties?.action_link ?? null;
            } else {
              return fail(inv.error, 'فشل إنشاء الحساب وإرسال الدعوة: ' + errMsg, inv.error.status || 500);
            }
          }
        } else if (inv.data?.user) {
          uid = inv.data.user.id;
          emailDispatched = true;
          logDiag('invite_smtp_accepted', { email: input.email, user_id: uid });

          // نولد أيضاً الرابط الاحتياطي ليكون متاحاً للمدير فوراً عند الحاجة
          const genBackup = await svc.auth.admin.generateLink({
            type: 'magiclink',
            email: input.email,
            options: { redirectTo: redirectUrl }
          });
          actionLink = genBackup.data?.properties?.action_link ?? null;
        }
      } catch (timeoutErr: any) {
        logDiag('invite_timeout', { email: input.email, error: timeoutErr?.message });
        emailError = timeoutErr?.message ?? 'انتهت مهلة الطلب';
        emailDispatched = false;

        const genFallback = await svc.auth.admin.generateLink({
          type: 'invite',
          email: input.email,
          options: { redirectTo: redirectUrl, data: { full_name: input.full_name } }
        });
        if (genFallback.data?.user) {
          uid = genFallback.data.user.id;
          actionLink = genFallback.data.properties?.action_link ?? null;
        } else {
          return fail(timeoutErr, 'انتهت مهلة الاتصال بالخادم: ' + timeoutErr.message, 504);
        }
      }

      if (!uid) {
        return fail(null, 'تعذّر تحديد معرّف المستخدم.', 500);
      }

      const prof = await svc.from('parent_profiles').upsert({
        user_id: uid,
        full_name: input.full_name,
        email: input.email,
        phone: input.phone ?? null,
        created_by: actor.id
      }, { onConflict: 'user_id' });

      if (prof.error) {
        logDiag('profile_upsert_failed', { error: prof.error.message });
        return fail(prof.error, 'تعذّر حفظ بيانات ملف الولي: ' + prof.error.message, 500);
      }

      if (input.child_ids.length) {
        const links = input.child_ids.map((c) => ({ parent_id: uid!, child_id: c }));
        const { error: linkErr } = await svc.from('parent_children').upsert(links, { onConflict: 'parent_id,child_id' });
        if (linkErr) {
          logDiag('links_upsert_failed', { error: linkErr.message });
          return fail(linkErr, 'تعذّر ربط الأبناء بملف الولي: ' + linkErr.message, 500);
        }
      }

      await audit(isExisting ? 'parent:relink_existing' : 'parent:invite', uid);
      return json(200, {
        ok: true,
        user_id: uid,
        account_created: !isExisting,
        already_registered: isExisting,
        email_dispatched: emailDispatched,
        email_error: emailError,
        action_link: actionLink
      }, origin);
    }

    if (input.action === 'resend_parent_invite') {
      logDiag('resend_start', { user_id: input.user_id });

      const { data: prof, error: profErr } = await svc.from('parent_profiles').select('email, full_name, disabled').eq('user_id', input.user_id).single();
      if (profErr || !prof) return fail(profErr, 'ملف ولي الأمر غير موجود.', 404);
      if (prof.disabled) return fail(null, 'لا يمكن إرسال دعوة لحساب معطّل. قم بتفعيل الحساب أولًا.', 400);
      if (!prof.email) return fail(null, 'البريد الإلكتروني للولي غير مسجّل.', 400);

      const redirectUrl = redirect('/parent.html');
      let emailDispatched = false;
      let emailError: string | null = null;
      let actionLink: string | null = null;

      const { data: uObj } = await svc.auth.admin.getUserById(input.user_id);
      const isConfirmed = !!uObj?.user?.email_confirmed_at;
      logDiag('resend_dispatch', { email: prof.email, is_confirmed: isConfirmed });

      if (!isConfirmed) {
        const inv = await svc.auth.admin.inviteUserByEmail(prof.email, { redirectTo: redirectUrl });
        if (!inv.error) {
          emailDispatched = true;
        } else {
          emailError = inv.error.message;
          logDiag('resend_invite_error', { error: inv.error.message });
        }
      } else {
        const rst = await svc.auth.resetPasswordForEmail(prof.email, { redirectTo: redirectUrl });
        if (!rst.error) {
          emailDispatched = true;
        } else {
          emailError = rst.error.message;
          logDiag('resend_reset_error', { error: rst.error.message });
        }
      }

      const gen = await svc.auth.admin.generateLink({
        type: isConfirmed ? 'magiclink' : 'invite',
        email: prof.email,
        options: { redirectTo: redirectUrl }
      });
      if (gen.data?.properties?.action_link) {
        actionLink = gen.data.properties.action_link;
      }

      await audit('parent:resend_invite', input.user_id);
      return json(200, {
        ok: true,
        email: prof.email,
        email_dispatched: emailDispatched,
        email_error: emailError,
        action_link: actionLink
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
      // الدعوة تحمل البريد والصلاحية؛ المدعو يختار كلمة مروره بنفسه عند فتح الرابط.
      const redirectUrl = redirect('/manage.html');
      const roleLabel = input.role === 'admin' ? 'مدير شامل' : 'محرّر محتوى';
      const inv = await svc.auth.admin.inviteUserByEmail(input.email, {
        redirectTo: redirectUrl,
        data: { invited_email: input.email, invited_role: input.role, role_label: roleLabel, invited_by: actor.email ?? '' },
      });
      if (inv.error || !inv.data?.user) {
        const exists = /already|registered|exists/i.test(inv.error?.message ?? '');
        return fail(inv.error, exists ? 'هذا البريد مسجَّل مسبقًا.' : 'تعذّر إرسال الدعوة: ' + (inv.error?.message ?? ''), exists ? 409 : 500);
      }
      const uid = inv.data.user.id;
      // الصلاحية تُسجَّل في جدول admins (المصدر الوحيد للصلاحية). إن فشل التسجيل نلغي الحساب المُنشأ.
      const ins = await svc.from('admins').insert({ user_id: uid, role: input.role });
      if (ins.error) {
        await svc.auth.admin.deleteUser(uid);
        return fail(ins.error, 'تعذّر تسجيل صلاحيات المدير: ' + ins.error.message, 500);
      }
      await audit('admin:invite', input.email + ':' + input.role);
      return json(200, { ok: true, user_id: uid, email: input.email, role: input.role, role_label: roleLabel }, origin);
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

    if (input.action === 'remove_admin') {
      if (input.user_id === actor.id) return json(400, { error: 'لا يمكنك حذف حسابك أنت (المالك).' }, origin);
      const { data: first } = await svc.from('admins').select('user_id').order('created_at', { ascending: true }).order('user_id', { ascending: true }).limit(1).single();
      if (first?.user_id === input.user_id) return json(400, { error: 'لا يمكن حذف حساب المالك الرئيسي.' }, origin);
      const { data: u } = await svc.auth.admin.getUserById(input.user_id);
      const email = u?.user?.email ?? input.user_id;
      await svc.from('admins').delete().eq('user_id', input.user_id);
      const del = await svc.auth.admin.deleteUser(input.user_id);
      if (del.error) return fail(del.error, 'تعذّر حذف المستخدم: ' + del.error.message, 500);
      await audit('admin:remove', email);
      return json(200, { ok: true, deleted_email: email }, origin);
    }
  } catch (e: any) {
    return fail(e, 'حدث خطأ غير متوقع: ' + (e?.message ?? ''));
  }
  return json(400, { error: 'عملية غير معروفة.' }, origin);
});
