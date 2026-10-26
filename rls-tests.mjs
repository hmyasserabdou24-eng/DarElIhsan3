// اختبارات صلاحيات حقيقية ضد مشروع Supabase (يتطلب Node 18+).
// التشغيل:  node --env-file=.env rls-tests.mjs
// يحتاج 3 حسابات تجريبية أنشأتها يدويًا من Authentication ▸ Users (مدير بدور admin + وليّان تجريبيان)، لا حسابات حقيقية.
// ينشئ بيانات وهمية بوسم ZZ-TEST ويحذفها في النهاية. لا يطبع كلمات مرور ولا رموز.
const E = process.env;
for (const k of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD', 'TEST_PARENT_A_EMAIL', 'TEST_PARENT_A_PASSWORD', 'TEST_PARENT_B_EMAIL', 'TEST_PARENT_B_PASSWORD']) {
  if (!E[k]) { console.error('متغير بيئة ناقص:', k); process.exit(2); }
}
const URL_ = E.SUPABASE_URL.replace(/\/$/, ''), KEY = E.SUPABASE_PUBLISHABLE_KEY;
let pass = 0, fail = 0;
const ok = (c, name) => { if (c) { pass++; console.log('  ✅', name); } else { fail++; console.log('  ❌', name); } };

async function login(email, password) {
  const r = await fetch(URL_ + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const j = await r.json();
  if (!r.ok) throw new Error('فشل تسجيل دخول حساب اختبار (' + r.status + ')');
  return { token: j.access_token, id: j.user.id };
}
async function api(method, path, token, body, extra = {}) {
  const r = await fetch(URL_ + path, { method, headers: { apikey: KEY, ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { /* نص */ }
  return { status: r.status, json: j };
}
const rest = (m, p, t, b, rep = true) => api(m, '/rest/v1' + p, t, b, rep ? { Prefer: 'return=representation' } : {});
const rows = (r) => (Array.isArray(r.json) ? r.json : []);
const denied = (r) => r.status === 401 || r.status === 403 || (r.status < 300 && rows(r).length === 0);   // رفض صريح أو لا صفوف
async function upload(token, path, bytes, mime) {
  const r = await fetch(URL_ + '/storage/v1/object/private-docs/' + path, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + token, 'Content-Type': mime, 'x-upsert': 'false' }, body: bytes });
  return r.status;
}
async function download(token, path) {
  const r = await fetch(URL_ + '/storage/v1/object/authenticated/private-docs/' + path, { headers: { apikey: KEY, ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  return r.status;
}
const PDF = new TextEncoder().encode('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');

const admin = await login(E.TEST_ADMIN_EMAIL, E.TEST_ADMIN_PASSWORD);
const A = await login(E.TEST_PARENT_A_EMAIL, E.TEST_PARENT_A_PASSWORD);
const B = await login(E.TEST_PARENT_B_EMAIL, E.TEST_PARENT_B_PASSWORD);
const made = { storage: [] };

try {
  // ---------- تجهيز بيانات وهمية بواسطة المدير ----------
  ok((await rest('POST', '/rpc/can_manage_families', admin.token, {}, false)).json === true, 'حساب المدير الاختباري يملك دور admin');
  for (const [p, n] of [[A, 'ZZ-TEST ولي أ'], [B, 'ZZ-TEST ولي ب']]) {
    await api('POST', '/rest/v1/parent_profiles?on_conflict=user_id', admin.token, { user_id: p.id, full_name: n }, { Prefer: 'resolution=merge-duplicates' });
  }
  const cA = rows(await rest('POST', '/children', admin.token, { full_name: 'ZZ-TEST طفل أ', center: 'main' }))[0];
  const cB = rows(await rest('POST', '/children', admin.token, { full_name: 'ZZ-TEST طفل ب', center: 'main' }))[0];
  ok(cA && cB, 'المدير ينشئ ملفي طفلين');
  await rest('POST', '/parent_children', admin.token, [{ parent_id: A.id, child_id: cA.id }, { parent_id: B.id, child_id: cB.id }]);
  const period = { period_start: '2026-09-01', period_end: '2026-09-30' };
  const rDraftA = rows(await rest('POST', '/progress_reports', admin.token, { child_id: cA.id, title: 'ZZ-TEST مسودة أ', notes: 'x', ...period }))[0];
  const rPubA = rows(await rest('POST', '/progress_reports', admin.token, { child_id: cA.id, title: 'ZZ-TEST منشور أ', notes: 'x', status: 'published', ...period }))[0];
  const rPubB = rows(await rest('POST', '/progress_reports', admin.token, { child_id: cB.id, title: 'ZZ-TEST منشور ب', notes: 'x', status: 'published', ...period }))[0];
  const when = new Date(Date.now() + 864e5).toISOString();
  await rest('POST', '/appointments', admin.token, [
    { title: 'ZZ-TEST موعد طفل أ', starts_at: when, audience: 'child', child_id: cA.id },
    { title: 'ZZ-TEST موعد طفل ب', starts_at: when, audience: 'child', child_id: cB.id },
    { title: 'ZZ-TEST موعد عام', starts_at: when, audience: 'all' }]);
  const mB = rows(await rest('POST', '/messages', admin.token, { kind: 'message', audience: 'parent', parent_id: B.id, title: 'ZZ-TEST لـ ب', body: 'x', published_at: new Date(Date.now() - 1000).toISOString() }))[0];
  const mDraft = rows(await rest('POST', '/messages', admin.token, { audience: 'all', title: 'ZZ-TEST مسودة إعلان', body: 'x' }))[0];
  const mkDoc = async (child, shared) => {
    const path = `children/${child.id}/${crypto.randomUUID()}.pdf`;
    const st = await upload(admin.token, path, PDF, 'application/pdf'); if (st < 300) made.storage.push(path);
    const d = rows(await rest('POST', '/documents', admin.token, { title: 'ZZ-TEST وثيقة', child_id: child.id, storage_path: path, mime_type: 'application/pdf', size_bytes: PDF.length, shared_with_parent: shared }))[0];
    return { path, d, st };
  };
  const dASh = await mkDoc(cA, true), dAPriv = await mkDoc(cA, false), dB = await mkDoc(cB, true);
  ok(dASh.st < 300, 'المدير يرفع ملفًا إلى الحاوية الخاصة');

  // ---------- اختبار 1: زائر غير مسجَّل ----------
  console.log('\nاختبار 1 — زائر غير مسجَّل');
  for (const t of ['children', 'parent_profiles', 'parent_children', 'progress_reports', 'appointments', 'messages', 'message_reads', 'documents', 'admins', 'admin_audit', 'rate_limits']) {
    ok(denied(await rest('GET', '/' + t + '?select=*', null, undefined, false)), 'القراءة مرفوضة: ' + t);
  }
  ok(denied(await rest('POST', '/children', null, { full_name: 'ZZ-TEST hack', center: 'main' })), 'الإدراج مرفوض: children');
  ok(denied(await rest('POST', '/rpc/admin_family_counts', null, {}, false)), 'RPC الإحصاءات مرفوض');
  ok(denied(await rest('POST', '/rpc/admin_audit_list', null, {}, false)), 'RPC سجل العمليات مرفوض');
  ok((await download(null, dASh.path)) >= 400, 'تنزيل ملف خاص دون جلسة مرفوض');
  ok((await upload(KEY, 'children/' + cA.id + '/' + crypto.randomUUID() + '.pdf', PDF, 'application/pdf')) >= 400, 'رفع دون جلسة مرفوض');

  // ---------- اختبار 2: الولي الأول ----------
  console.log('\nاختبار 2 — الولي الأول');
  const aCh = rows(await rest('GET', '/children?select=id', A.token, undefined, false));
  ok(aCh.length === 1 && aCh[0].id === cA.id, 'يرى طفله فقط');
  ok(rows(await rest('GET', '/children?id=eq.' + cB.id, A.token, undefined, false)).length === 0, 'لا يرى طفل ولي آخر (تغيير المعرّف)');
  const aRep = rows(await rest('GET', '/progress_reports?select=id', A.token, undefined, false)).map((x) => x.id);
  ok(aRep.length === 1 && aRep[0] === rPubA.id, 'يرى التقرير المنشور لطفله فقط (لا مسودة ولا تقرير غيره)');
  ok(rows(await rest('GET', '/appointments?select=title', A.token, undefined, false)).length === 2, 'يرى موعد طفله والموعد العام فقط');
  ok(rows(await rest('GET', '/messages?select=id', A.token, undefined, false)).length === 0, 'لا يرى رسالة موجهة لولي آخر ولا مسودة');
  ok(rows(await rest('GET', '/documents?select=id', A.token, undefined, false)).length === 1, 'يرى الوثيقة المشاركة فقط');
  ok(rows(await rest('GET', '/parent_children?select=child_id', A.token, undefined, false)).length === 1, 'يرى ارتباطه هو فقط');
  ok(denied(await rest('PATCH', '/progress_reports?id=eq.' + rPubA.id, A.token, { notes: 'تعديل' })), 'لا يستطيع تعديل تقرير');
  ok(denied(await rest('DELETE', '/messages?id=eq.' + mB.id, A.token)), 'لا يستطيع حذف رسالة');
  ok(denied(await rest('POST', '/children', A.token, { full_name: 'ZZ-TEST hack', center: 'main' })), 'لا يستطيع إنشاء طفل');
  ok(denied(await rest('POST', '/parent_children', A.token, { parent_id: A.id, child_id: cB.id })), 'لا يستطيع ربط نفسه بطفل آخر');
  ok(denied(await rest('POST', '/admins', A.token, { user_id: A.id })), 'لا يستطيع إنشاء حساب إداري');
  ok(denied(await rest('POST', '/rpc/admin_add_user', A.token, { p_email: 'x@example.com', p_password: 'Abcdefg1' }, false)), 'RPC إضافة مستخدم مرفوض');
  ok(denied(await rest('POST', '/rpc/admin_family_counts', A.token, {}, false)), 'RPC الإحصاءات مرفوض');
  ok((await download(A.token, dASh.path)) === 200, 'ينزّل ملفه المشارك');
  ok((await download(A.token, dAPriv.path)) >= 400, 'لا ينزّل ملفًا غير مشارك');
  ok((await download(A.token, dB.path)) >= 400, 'لا ينزّل ملف طفل آخر');
  ok((await upload(A.token, 'children/' + cA.id + '/' + crypto.randomUUID() + '.pdf', PDF, 'application/pdf')) >= 400, 'لا يستطيع الرفع');

  // ---------- اختبار 3: الولي الثاني ----------
  console.log('\nاختبار 3 — الولي الثاني');
  ok(rows(await rest('GET', '/children?select=id', B.token, undefined, false)).every((x) => x.id === cB.id), 'لا يرى أبناء الولي الأول');
  ok(rows(await rest('GET', '/progress_reports?id=eq.' + rPubA.id, B.token, undefined, false)).length === 0, 'لا يرى تقرير الولي الأول');
  ok((await download(B.token, dASh.path)) >= 400, 'لا ينزّل ملف الولي الأول');
  ok(rows(await rest('GET', '/messages?select=id', B.token, undefined, false)).length === 1, 'يرى رسالته المنشورة فقط');
  ok(denied(await rest('POST', '/message_reads', A.token, { message_id: mB.id, parent_id: A.id })), 'الولي الأول لا يسجّل قراءة رسالة لا تخصه');
  ok(denied(await rest('POST', '/message_reads', B.token, { message_id: mB.id, parent_id: A.id })), 'لا يسجّل قراءة نيابة عن غيره');
  ok(!denied(await rest('POST', '/message_reads', B.token, { message_id: mB.id, parent_id: B.id })), 'يسجّل قراءة رسالته');
  ok(denied(await rest('POST', '/message_reads', B.token, { message_id: mDraft.id, parent_id: B.id })), 'لا يسجّل قراءة مسودة');

  // ---------- اختبار 4: الإدارة ----------
  console.log('\nاختبار 4 — الإدارة');
  const cnt = await rest('POST', '/rpc/admin_family_counts', admin.token, {}, false);
  ok(cnt.status === 200 && typeof cnt.json?.children === 'number', 'الإحصاءات تعمل وهي أعداد فقط');
  ok(rows(await rest('GET', '/progress_reports?id=eq.' + rDraftA.id, admin.token, undefined, false)).length === 1, 'المدير يقرأ المسودات');
  const pub = await rest('PATCH', '/progress_reports?id=eq.' + rDraftA.id, admin.token, { status: 'published' });
  ok(rows(pub)[0]?.published_at, 'نشر تقرير يضبط published_at');
  ok(rows(await rest('GET', '/progress_reports?id=eq.' + rDraftA.id, A.token, undefined, false)).length === 1, 'الولي يرى التقرير بعد النشر');
  await rest('PATCH', '/progress_reports?id=eq.' + rDraftA.id, admin.token, { status: 'draft' });
  ok(rows(await rest('GET', '/progress_reports?id=eq.' + rDraftA.id, A.token, undefined, false)).length === 0, 'إلغاء النشر يخفيه عن الولي فورًا');
  const aud = await rest('POST', '/rpc/admin_audit_list', admin.token, { p_limit: 20 }, false);
  const blob = JSON.stringify(aud.json || []);
  ok(/report:publish/.test(blob) && /report:unpublish/.test(blob), 'سجل العمليات يحوي النشر وإلغاءه');
  ok(!/ZZ-TEST/.test(blob), 'السجل لا يحتوي أسماء أو محتوى');
  // تعطيل ولي: يسقط وصوله فورًا
  await rest('PATCH', '/parent_profiles?user_id=eq.' + B.id, admin.token, { disabled: true });
  ok(rows(await rest('GET', '/children?select=id', B.token, undefined, false)).length === 0, 'تعطيل الولي يسقط وصوله فورًا');
  await rest('PATCH', '/parent_profiles?user_id=eq.' + B.id, admin.token, { disabled: false });
} finally {
  // ---------- تنظيف ----------
  console.log('\nتنظيف بيانات الاختبار…');
  for (const p of made.storage) await fetch(URL_ + '/storage/v1/object/private-docs/' + p, { method: 'DELETE', headers: { apikey: KEY, Authorization: 'Bearer ' + admin.token } });
  for (const t of ['documents', 'messages', 'progress_reports', 'appointments']) await rest('DELETE', '/' + t + '?title=like.ZZ-TEST*', admin.token, undefined, false);
  await rest('DELETE', '/parent_children?parent_id=in.(' + A.id + ',' + B.id + ')', admin.token, undefined, false);
  await rest('DELETE', '/children?full_name=like.ZZ-TEST*', admin.token, undefined, false);
  await rest('DELETE', '/parent_profiles?full_name=like.ZZ-TEST*', admin.token, undefined, false);
}
console.log(`\nالنتيجة: ${pass} نجح، ${fail} فشل`);
process.exit(fail ? 1 : 0);
