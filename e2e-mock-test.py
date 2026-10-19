#!/usr/bin/env python3
"""اختبار واجهات فضاء الأولياء ولوحة الإدارة في متصفح حقيقي (Chromium) ضد خادم Supabase *وهمي*.
ما يختبره: سلوك الواجهة (تحقق، XSS، حدود الملفات، منع تكرار الطلبات، CSP، الهاتف).
ما لا يختبره: سياسات RLS الحقيقية (هذا دور rls-tests.mjs على مشروعك). كل البيانات وهمية.
التشغيل:  pip install playwright && playwright install chromium && python3 e2e-mock-test.py
"""
import json, re, sys, threading, time, functools, http.server, socketserver, os
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8765
MOCK = 'https://mock-project.supabase.co'
PA, PB, ADM = ['aaaaaaaa-0000-4000-8000-00000000000%d' % i for i in (1, 2, 3)]
CA, CB = 'cccccccc-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000002'
DOCP = 'children/%s/dddddddd-0000-4000-8000-000000000001.pdf' % CA
R1 = 'eeeeeeee-0000-4000-8000-000000000001'
XSS = ['<img src=x onerror=window.__xss=1>', '<script>window.__xss=2</script>', '"><svg onload=window.__xss=3>']
soon = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(time.time() + 2 * 86400))
past = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(time.time() - 5 * 86400))
now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

PARENT_A = {
    'parent_profiles': [{'full_name': 'ولي <b>أ</b> وهمي'}],
    'children': [{'id': CA, 'full_name': 'طفل وهمي ' + XSS[0], 'center': 'main', 'section': 'قسم أ', 'basic_info': 'معلومات وهمية'}],
    'progress_reports': [{'id': 'r1', 'child_id': CA, 'title': 'تقرير وهمي', 'report_date': '2026-10-01', 'period_start': '2026-09-01', 'period_end': '2026-09-30',
                          'achievements': 'مكتسب', 'activities': None, 'notes': XSS[1], 'attachment_path': DOCP}],
    'appointments': [{'id': 'a1', 'title': 'قادم', 'description': None, 'starts_at': soon, 'ends_at': None, 'location': 'المركز', 'audience': 'all', 'child_id': None, 'status': 'scheduled'},
                     {'id': 'a2', 'title': 'سابق', 'description': None, 'starts_at': past, 'ends_at': None, 'location': None, 'audience': 'child', 'child_id': CA, 'status': 'scheduled'},
                     {'id': 'a3', 'title': 'ملغى', 'description': None, 'starts_at': soon, 'ends_at': None, 'location': None, 'audience': 'all', 'child_id': None, 'status': 'cancelled'}],
    'messages': [{'id': 'm1', 'kind': 'message', 'title': 'رسالة ' + XSS[2], 'body': 'نص', 'published_at': now}, {'id': 'm2', 'kind': 'announcement', 'title': 'إعلان مقروء', 'body': 'نص', 'published_at': past}],
    'message_reads': [{'message_id': 'm2'}],
    'documents': [{'id': 'd1', 'title': 'وثيقة وهمية', 'category': 'عام', 'child_id': CA, 'storage_path': DOCP, 'created_at': past}],
}
ADMIN = {
    'children': [{'id': CA, 'full_name': 'طفل وهمي أ ' + XSS[0], 'center': 'main', 'section': None, 'basic_info': None, 'photo_consent': False, 'active': True},
                 {'id': CB, 'full_name': 'طفل وهمي ب', 'center': 'farm', 'section': None, 'basic_info': None, 'photo_consent': False, 'active': True}],
    'parent_profiles': [{'user_id': PA, 'full_name': 'ولي وهمي أ', 'email': 'a@example.test', 'phone': None, 'disabled': False}],
    'parent_children': [{'parent_id': PA, 'child_id': CA}],
    'progress_reports': [{'id': R1, 'child_id': CA, 'title': 'مسودة وهمية', 'report_date': '2026-10-01', 'period_start': '2026-09-01', 'period_end': '2026-09-30', 'achievements': 'x', 'activities': None, 'notes': None,
                          'attachment_path': None, 'status': 'draft', 'updated_at': now}],
    'appointments': [], 'messages': [], 'message_reads': [], 'documents': [],
}
TOKENS = {'tokA': 'A', 'tokB': 'B', 'tokAdmin': 'ADM', 'tokDis': 'DIS', 'tokInv': 'INV', 'tokMfa': 'MFA', 'tokEditor': 'ED'}
LOG, FAIL = [], {'documents_insert': False}
results = []


def check(cond, name):
    results.append((bool(cond), name))
    print(('  ✅ ' if cond else '  ❌ ') + name)


def backend(route, request):
    u = urlparse(request.url); path = u.path; m = request.method; q = u.query
    cors = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}
    if m == 'OPTIONS':
        return route.fulfill(status=204, headers=cors)
    buf = request.post_data_buffer or b''
    body = buf.decode('utf-8', errors='ignore')   # الملفات الثنائية لا تُفكّ كنص
    LOG.append({'m': m, 'p': path, 'q': q, 'b': body, 'len': len(buf), 'h': request.headers})
    tok = (request.headers.get('authorization') or '').replace('Bearer ', '')
    who = TOKENS.get(tok)

    def J(obj, status=200):
        route.fulfill(status=status, headers={**cors, 'content-type': 'application/json'}, body=json.dumps(obj))

    def user(uid, email, factors=None):
        return {'id': uid, 'email': email, 'factors': factors or []}
    if path == '/auth/v1/token':
        d = json.loads(body or '{}')
        if q.startswith('grant_type=refresh_token'):
            return J({'access_token': 'tokA', 'refresh_token': 'r2', 'expires_in': 3600, 'user': user(PA, 'a@example.test')})
        em, pw = d.get('email'), d.get('password')
        if pw != 'Correct-Pass-123':
            return J({'code': 'invalid_credentials', 'msg': 'Invalid login credentials'}, 400)
        tbl = {'a@example.test': ('tokA', user(PA, em)), 'dis@example.test': ('tokDis', user(PB, em)), 'ed@example.test': ('tokEditor', user(PB, em)),
               'admin@example.test': ('tokMfa', user(ADM, em, [{'id': 'f1', 'status': 'verified', 'factor_type': 'totp'}]))}
        if em in tbl:
            return J({'access_token': tbl[em][0], 'refresh_token': 'r', 'expires_in': 3600, 'user': tbl[em][1]})
        return J({'msg': 'Invalid login credentials'}, 400)
    if path.endswith('/challenge'):
        return J({'id': 'ch1'})
    if path.endswith('/verify'):
        d = json.loads(body or '{}')
        if d.get('code') != '123456':
            return J({'code': 'mfa_verification_failed', 'msg': 'Invalid TOTP code entered'}, 400)
        return J({'access_token': 'tokAdmin', 'refresh_token': 'r', 'expires_in': 3600, 'user': user(ADM, 'admin@example.test', [{'id': 'f1', 'status': 'verified', 'factor_type': 'totp'}])})
    if path == '/auth/v1/user':
        if m == 'PUT':
            return J({'id': PA})
        return J(user(PA, 'a@example.test'))
    if path == '/auth/v1/logout' or path == '/auth/v1/recover':
        return J({})
    if path.startswith('/rest/v1/rpc/'):
        fn = path.split('/')[-1]
        if fn == 'is_active_parent': return J(who == 'A')
        if fn == 'can_manage_families': return J(who == 'ADM')
        if fn == 'is_admin': return J(who in ('ADM', 'ED'))
        if fn == 'admin_family_counts':
            return J({'children': 2, 'parents_active': 1, 'reports_draft': 1, 'reports_published': 0, 'appointments_upcoming': 0, 'messages_draft': 0})
        if fn == 'admin_list':
            return J({'can_manage': True, 'admins': [{'id': ADM, 'email': 'admin@example.test', 'role': 'admin', 'disabled': False, 'is_owner': True, 'is_me': True, 'last_sign_in_at': now}]})
        if fn == 'admin_audit_list':
            return J([{'at': now, 'actor_email': 'admin@example.test', 'action': 'report:publish', 'target': 'r1'}])
        return J({}, 404)
    if path.startswith('/rest/v1/'):
        table = path.split('/')[3]
        if m == 'GET':
            src = PARENT_A if who == 'A' else ADMIN if who == 'ADM' else {}
            return J(src.get(table, []))
        if table == 'documents' and m == 'POST' and FAIL['documents_insert']:
            return J({'code': '23514', 'message': 'violates check constraint'}, 400)
        return route.fulfill(status=201 if m == 'POST' else 204, headers=cors, body='')
    if path.startswith('/storage/v1/object/sign/'):
        return J({'signedURL': '/object/sign/private-docs/x.pdf?token=t0k'})
    if path.startswith('/storage/v1/object/'):
        return J({'Key': 'ok'})
    if path.startswith('/functions/v1/admin-users'):
        return J({'ok': True, 'user_id': PB})
    return J({'error': 'not mocked'}, 404)


def serve():
    class H(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(H, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def new_page(browser, viewport=None):
    ctx = browser.new_context(viewport=viewport or {'width': 1200, 'height': 900}, locale='ar')
    ctx.add_init_script("""window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI));""")
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/*', lambda r, rq: (r.abort() if re.match(r'https://fonts\.(googleapis|gstatic)\.com', rq.url) else
                                    backend(r, rq) if rq.url.startswith(MOCK) else
                                    r.fulfill(status=200, content_type='application/javascript', body="window.DE_CONFIG={supabaseUrl:'%s',supabaseKey:'sb_publishable_FAKE_TEST_KEY',bucket:'media'};" % MOCK) if re.search(r'/cms-config\.js', rq.url) else
                                    r.continue_()))
    return pg, errs



def wf(pg, expr, timeout=8.0):
    """انتظار شرط عبر pg.evaluate (CDP) لأن wait_for_function يستخدم eval وتمنعه CSP الصارمة — وهذا بحد ذاته دليل أن CSP فعّالة."""
    end = time.time() + timeout
    while time.time() < end:
        if pg.evaluate(expr): return True
        time.sleep(0.05)
    raise AssertionError('انتهت المهلة: ' + expr)


def last(m, pat):
    for e in reversed(LOG):
        if e['m'] == m and re.search(pat, e['p'] + ('?' + e['q'] if e['q'] else '')): return e
    return None


def count(m, pat):
    return len([e for e in LOG if e['m'] == m and re.search(pat, e['p'] + ('?' + e['q'] if e['q'] else ''))])


def main():
    srv = serve()
    base = 'http://127.0.0.1:%d/' % PORT
    with sync_playwright() as p:
        br = p.chromium.launch()

        # ================= فضاء الأولياء =================
        print('\nفضاء الأولياء')
        pg, errs = new_page(br)
        pg.goto(base + 'parent.html'); pg.wait_for_selector('#login:not([hidden])')
        check(pg.is_visible('#loginForm'), 'تظهر شاشة الدخول أولًا (لا بيانات بلا جلسة)')
        pg.click('#lBtn'); check('أدخل البريد' in pg.inner_text('#lErr'), 'حقول فارغة → رسالة تحقق')
        pg.fill('#email', 'a@example.test'); pg.fill('#password', 'wrong-pass'); pg.click('#lBtn')
        wf(pg, "document.querySelector('#lErr').textContent.length>0")
        t = pg.inner_text('#lErr'); check('غير صحيحة' in t and 'Invalid' not in t, 'كلمة مرور خاطئة → رسالة عربية مفهومة بلا نص الخادم الخام')

        pg.fill('#password', 'Correct-Pass-123'); pg.click('#lBtn'); pg.wait_for_selector('#app:not([hidden])')
        check(pg.evaluate('window.__xss') is None, 'لا يُنفَّذ أي HTML/سكربت قادم من قاعدة البيانات (XSS)')
        check('<img src=x' in pg.inner_text('#view'), 'الحمولة الخبيثة تُعرض كنص حرفي')
        check(pg.locator('#view img').count() == 0 and pg.locator('#view script').count() == 0, 'لا عناصر img/script مُحقنة في الصفحة')
        check('وهمي' in pg.inner_text('#who') and '<b>' in pg.inner_text('#who'), 'اسم الولي يُعرض كنص')
        check(pg.evaluate("sessionStorage.getItem('de_parent_session')") is not None and pg.evaluate("localStorage.getItem('de_parent_session')") is None, 'الجلسة في sessionStorage فقط (لا localStorage)')
        pg.click('#tabs button:nth-child(2)'); check(pg.locator('#view .card').count() == 1 and 'تقرير وهمي' in pg.inner_text('#view'), 'تبويب التقارير يعرض التقرير المنشور')
        check(pg.evaluate('window.__xss') is None, 'ملاحظات التقرير الخبيثة لا تُنفَّذ')
        pg.click('#view .btn.small'); pg.wait_for_selector('#view a.btn.gold')
        a = pg.locator('#view a.btn.gold'); href = a.get_attribute('href')
        check(href.startswith('https://mock-project.supabase.co/storage/v1/object/sign/') and 'noopener' in a.get_attribute('rel'), 'فتح المرفق: رابط موقَّع مؤقت + rel=noopener')
        check(last('POST', r'/object/sign/')['b'] and json.loads(last('POST', r'/object/sign/')['b']).get('expiresIn') == 60, 'مدة الرابط 60 ثانية')
        pg.click('#tabs button:nth-child(3)'); txt = pg.inner_text('#view')
        check('المواعيد القادمة' in txt and 'ملغى' in txt and 'السابقة' in txt, 'المواعيد مقسَّمة: قادمة / سابقة / ملغاة')
        check(pg.locator('#tabs .dot').inner_text() == '1', 'شارة رسائل غير مقروءة = 1')
        pg.click('#tabs button:nth-child(4)')
        check(pg.evaluate('window.__xss') is None, 'عنوان الرسالة الخبيث لا يُنفَّذ')
        before = count('POST', r'/message_reads')
        pg.evaluate("(()=>{const b=document.querySelector('#view .btn.small');b.click();b.click();b.click();})()")
        wf(pg, "document.querySelectorAll('#tabs .dot').length===0")
        e = last('POST', r'/message_reads')
        check(count('POST', r'/message_reads') - before == 1, 'نقرات متكررة → طلب واحد فقط (منع التكرار)')
        d = json.loads(e['b']); check(d['parent_id'] == PA and d['message_id'] == 'm1' and 'ignore-duplicates' in e['h'].get('prefer', ''), 'تسجيل القراءة بمعرّف الجلسة (وليس من حقل في الصفحة)')
        pg.click('#tabs button:nth-child(5)'); check('وثيقة وهمية' in pg.inner_text('#view'), 'تبويب الوثائق')
        pg.click('#logoutBtn'); pg.wait_for_selector('#login:not([hidden])')
        check(pg.evaluate("sessionStorage.getItem('de_parent_session')") is None, 'تسجيل الخروج يمسح الجلسة')
        check(pg.evaluate('window.__csp.length') == 0, 'لا انتهاكات CSP في فضاء الأولياء')
        check(errs == [], 'لا أخطاء JavaScript في فضاء الأولياء ' + str(errs))
        # حساب معطّل/غير ولي
        pg.fill('#email', 'dis@example.test'); pg.fill('#password', 'Correct-Pass-123'); pg.click('#lBtn')
        wf(pg, "document.querySelector('#lErr').textContent.length>0")
        check('غير مفعّل' in pg.inner_text('#lErr') and pg.evaluate("sessionStorage.getItem('de_parent_session')") is None, 'حساب معطّل/غير ولي → يُرفض وتُمسح الجلسة')
        pg.context.close()

        # دعوة وتعيين كلمة مرور + رابط منتهٍ
        pg, errs = new_page(br)
        pg.goto(base + 'parent.html#access_token=tokInv&refresh_token=rr&expires_in=3600&type=invite'); pg.wait_for_selector('#login:not([hidden])')
        check('#' not in pg.url, 'الرموز تُزال من شريط العنوان فور التقاطها')
        check(pg.is_visible('#stSet') and 'تفعيل حسابك' in pg.inner_text('#lHint'), 'رابط الدعوة → شاشة تعيين كلمة المرور')
        pg.fill('#np1', 'weak'); pg.fill('#np2', 'weak'); pg.click('#lBtn'); check('10 أحرف' in pg.inner_text('#lErr'), 'كلمة مرور ضعيفة مرفوضة')
        pg.fill('#np1', 'Strong-Pass-12345'); pg.fill('#np2', 'Different-Pass-1'); pg.click('#lBtn'); check('غير متطابقتين' in pg.inner_text('#lErr'), 'عدم التطابق مرفوض')
        pg.close()
        pg, errs = new_page(br)
        pg.goto(base + 'parent.html#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'); pg.wait_for_selector('#login:not([hidden])')
        check('انتهت صلاحيته' in pg.inner_text('#lErr'), 'رابط منتهٍ → رسالة مفهومة')
        pg.fill('#email', 'x@example.test'); pg.click('#forgotBtn'); pg.fill('#fEmail', 'x@example.test'); pg.click('#lBtn'); pg.wait_for_selector('#lOk:not([hidden])')
        check('إن كان البريد مسجَّلًا' in pg.inner_text('#lOk'), 'استعادة كلمة المرور لا تكشف وجود البريد')
        pg.context.close()

        # ================= لوحة الإدارة =================
        print('\nلوحة الأطفال والأولياء')
        pg, errs = new_page(br)
        pg.goto(base + 'manage.html'); pg.wait_for_selector('#login:not([hidden])')
        pg.fill('#email', 'admin@example.test'); pg.fill('#password', 'Correct-Pass-123'); pg.click('#lBtn'); pg.wait_for_selector('#stMfa:not([hidden])')
        check(True, 'حساب بمصادقة ثنائية → تُطلب خطوة الرمز')
        pg.fill('#mfaCode', '000000'); pg.click('#lBtn'); wf(pg, "document.querySelector('#lErr').textContent.length>0")
        check('غير صحيح' in pg.inner_text('#lErr'), 'رمز خاطئ → رفض بلغة مفهومة')
        pg.fill('#mfaCode', '123456'); pg.click('#lBtn'); pg.wait_for_selector('#app:not([hidden])'); pg.wait_for_selector('.stat')
        check(pg.locator('.stat').count() == 6 and pg.locator('.stat b').first.inner_text() == '2', 'لوحة التحكم: 6 بطاقات إحصاء (أعداد فقط)')
        # الأطفال
        pg.click('#nav [data-sec=children]'); pg.wait_for_selector('.tbl')
        check(pg.evaluate('window.__xss') is None and pg.locator('.tbl img').count() == 0, 'اسم طفل خبيث لا يُنفَّذ في الجدول')
        pg.fill('.toolbar input[type=search]', 'ب'); check(pg.locator('.tbl tbody tr').count() == 1, 'البحث يصفّي الجدول')
        pg.fill('.toolbar input[type=search]', '')
        pg.click('text=إضافة طفل'); pg.click('.modal-actions .btn:not(.light)')
        check(pg.locator('.fld.bad').count() >= 1, 'نموذج فارغ → أخطاء حقلية ولا إرسال')
        pg.locator('#f_full_name').fill('طفل اختبار وهمي'); pg.locator('#f_center').select_option('farm'); pg.click('.modal-actions .btn:not(.light)')
        wf(pg, "document.querySelector('#modal').hidden")
        e = last('POST', r'/rest/v1/children$'); d = json.loads(e['b'])
        check(d['full_name'] == 'طفل اختبار وهمي' and d['center'] == 'farm' and 'created_by' not in d, 'إنشاء طفل: الحقول صحيحة ولا يُرسل created_by من المتصفح')
        # الأولياء: دعوة
        pg.click('#nav [data-sec=parents]'); pg.wait_for_selector('.tbl'); pg.click('text=دعوة ولي')
        pg.locator('#f_full_name').fill('ولي اختبار'); pg.locator('#f_email').fill('not-an-email'); pg.click('.modal-actions .btn:not(.light)')
        check('غير صالح' in pg.inner_text('#modal'), 'بريد غير صالح مرفوض')
        pg.locator('#f_email').fill('Parent.New@Example.test'); pg.locator('.multi input').first.check(); pg.click('.modal-actions .btn:not(.light)')
        wf(pg, "document.querySelector('#modal').hidden")
        e = last('POST', r'/functions/v1/admin-users'); d = json.loads(e['b'])
        check(d == {'action': 'invite_parent', 'email': 'parent.new@example.test', 'full_name': 'ولي اختبار', 'child_ids': [CA]}, 'الدعوة عبر الدالة الخلفية بدون أي كلمة مرور')
        check(not any('password' in (x['b'] or '').lower() for x in LOG if x['p'].startswith('/functions/') or x['p'].startswith('/rest/v1/parent')), 'لا كلمات مرور في أي طلب خاص بحسابات الأولياء')
        check(e['h'].get('authorization') == 'Bearer tokAdmin', 'الدالة تُستدعى بجلسة المدير (aal2)')
        # التقارير + الملفات
        pg.click('#nav [data-sec=reports]'); pg.wait_for_selector('.tbl'); pg.click('text=تقرير جديد')
        pg.locator('#f_child_id').select_option(CA); pg.locator('#f_title').fill('تقرير اختبار')
        pg.locator('#f_period_start').fill('2026-09-30'); pg.locator('#f_period_end').fill('2026-09-01'); pg.locator('#f_achievements').fill('نص')
        pg.get_by_role('button', name='حفظ كمسودة').click(); check('قبل بدايتها' in pg.inner_text('#modal'), 'نهاية الفترة قبل البداية مرفوضة')
        pg.locator('#f_period_start').fill('2026-09-01'); pg.locator('#f_period_end').fill('2026-09-30')
        n0 = count('POST', r'/storage/v1/object/')
        bad_files = [('fake.pdf', b'this is not a pdf at all, just text content', 'application/pdf', 'لا يطابق'),
                     ('run.exe', b'MZ\x90\x00' + b'0' * 50, 'application/octet-stream', 'غير مسموح'),
                     ('big.pdf', b'%PDF-1.4\n' + b'0' * (5 * 1024 * 1024 + 10), 'application/pdf', '5 ميغابايت'),
                     ('evil.pdf', b'%PDF-1.4\n1 0 obj<</Type/Action/S/JavaScript/JS(app.alert(1))>>endobj', 'application/pdf', 'محتوى نشط'),
                     ('pic.png', b'%PDF-1.4\n%%EOF-----', 'image/png', 'لا يطابق')]
        for name, data, mime, expect in bad_files:
            pg.set_input_files('#f_file', {'name': name, 'mimeType': mime, 'buffer': data}); pg.get_by_role('button', name='حفظ كمسودة').click()
            wf(pg, "document.querySelector('.modal-card .err:not([hidden])')"); check(expect in pg.inner_text('.modal-card .err'), 'رفض ملف: ' + name)
        check(count('POST', r'/storage/v1/object/') == n0, 'لا يُرسل أي ملف مرفوض إلى التخزين')
        pg.set_input_files('#f_file', {'name': 'ok.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF'}); pg.get_by_role('button', name='حفظ كمسودة').click()
        wf(pg, "document.querySelector('#modal').hidden")
        up = last('POST', r'/storage/v1/object/private-docs/'); check(re.fullmatch(r'/storage/v1/object/private-docs/children/%s/[0-9a-f-]{36}\.pdf' % CA, up['p']) is not None and up['h'].get('x-upsert') == 'false', 'الرفع إلى الحاوية الخاصة باسم UUID ودون استبدال')
        rep = json.loads(last('POST', r'/rest/v1/progress_reports$')['b']); check(rep['attachment_path'] == up['p'].split('private-docs/')[1] and rep['status'] == 'draft', 'التقرير يُحفظ مسودة مع مسار المرفق')
        # نشر
        wf(pg, "document.querySelector('#toast') && !document.querySelector('#toast').hidden && document.querySelector('#toast').textContent.indexOf('مسودة')>=0"); time.sleep(0.5)
        pg.wait_for_selector('.tbl'); pg.get_by_role('button', name='نشر', exact=True).first.click(); pg.click('.modal-actions .btn:not(.light)'); wf(pg, "document.querySelector('#modal').hidden")
        for _ in range(300):   # حتى 15 ثانية: كان 3 ثوانٍ ويفشل أحيانًا على أجهزة بطيئة (سباق توقيت في الاختبار وليس في الموقع)
            if last('PATCH', r'/progress_reports\?id=eq\.' + R1): break
            time.sleep(0.05)
        if not (last('PATCH', r'/progress_reports\?id=eq\.' + R1)):   # تشخيص عند الفشل فقط
            print('DIAG patches:', [(x['p'], x['q'], x['b']) for x in LOG if x['m'] == 'PATCH'], file=sys.stderr)
            print('DIAG modal hidden:', pg.evaluate("document.querySelector('#modal').hidden"), 'rows:', pg.evaluate("Array.from(document.querySelectorAll('.tbl tbody tr')).map(function(r){return r.innerText.replace(/\\s+/g,' ').slice(0,60)})"), 'toast:', pg.evaluate("(document.querySelector('#toast')||{}).textContent"), file=sys.stderr)
        e = last('PATCH', r'/progress_reports\?id=eq\.' + R1); check(e and json.loads(e['b']) == {'status': 'published'}, 'النشر بعد نافذة تأكيد')
        pg.get_by_role('button', name='معاينة').first.click(); check('معاينة كما يراها الولي' in pg.inner_text('#modal'), 'معاينة قبل النشر')
        pg.click('.modal-actions .btn.light')
        # وثائق: فشل الإدراج → حذف الملف اليتيم
        pg.click('#nav [data-sec=docs]'); pg.wait_for_selector('.section-title'); FAIL['documents_insert'] = True; pg.click('text=رفع وثيقة')
        pg.locator('#f_child_id').select_option(CA); pg.locator('#f_title').fill('وثيقة اختبار')
        pg.set_input_files('#f_file', {'name': 'a.jpg', 'mimeType': 'image/jpeg', 'buffer': b'\xff\xd8\xff\xe0' + b'0' * 40}); pg.get_by_role('button', name='رفع', exact=True).click()
        wf(pg, "document.querySelector('.modal-card .err:not([hidden])')"); time.sleep(0.4)
        check(count('DELETE', r'/storage/v1/object/private-docs/') >= 1, 'فشل حفظ السجل → حذف الملف المرفوع (لا ملفات يتيمة)')
        FAIL['documents_insert'] = False; pg.click('.modal-actions .btn.light')
        # حسابات وسجل وإعدادات
        pg.click('#nav [data-sec=accounts]'); pg.wait_for_selector('.tbl'); check('المالك' in pg.inner_text('#view'), 'حسابات الإدارة: المالك ظاهر ولا زر تعطيل له')
        pg.click('#nav [data-sec=audit]'); pg.wait_for_selector('.tbl'); check('نشر تقرير' in pg.inner_text('#view'), 'سجل العمليات بعناوين مفهومة')
        pg.click('#nav [data-sec=settings]'); check('مفعّلة' in pg.inner_text('#view'), 'الإعدادات تعرض حالة المصادقة الثنائية')
        check(pg.evaluate('window.__csp.length') == 0, 'لا انتهاكات CSP في لوحة الإدارة')
        check(errs == [], 'لا أخطاء JavaScript في لوحة الإدارة ' + str(errs))
        # هاتف
        pg.close()
        # محرّر
        pg, errs = new_page(br); pg.goto(base + 'manage.html'); pg.wait_for_selector('#login:not([hidden])')
        pg.fill('#email', 'ed@example.test'); pg.fill('#password', 'Correct-Pass-123'); pg.click('#lBtn'); wf(pg, "document.querySelector('#lErr').textContent.length>0")
        check('محرّر' in pg.inner_text('#lErr'), 'حساب محرّر لا يدخل لوحة الأطفال والأولياء')
        pg.context.close()

        # الهاتف: تخطيط
        print('\nالهاتف')
        pg, errs = new_page(br, {'width': 390, 'height': 800})
        pg.goto(base + 'manage.html'); pg.fill('#email', 'admin@example.test'); pg.fill('#password', 'Correct-Pass-123'); pg.click('#lBtn'); pg.wait_for_selector('#stMfa:not([hidden])')
        pg.fill('#mfaCode', '123456'); pg.click('#lBtn'); pg.wait_for_selector('.stat')
        check(not pg.is_visible('#side'), 'القائمة الجانبية مطويّة على الهاتف')
        pg.click('#menuBtn'); check(pg.is_visible('#side'), 'زر القائمة يفتحها')
        pg.click('#nav [data-sec=children]'); pg.wait_for_selector('.tbl')
        check(not pg.is_visible('.tbl thead') and pg.locator('.tbl td').first.get_attribute('data-label'), 'الجدول يتحول إلى بطاقات على الهاتف')
        check(pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), 'لا تمرير أفقي على الهاتف')
        pg.screenshot(path='/tmp/mobile-manage.png')
        pg.set_viewport_size({'width': 1200, 'height': 800}); pg.screenshot(path='/tmp/desktop-manage.png')
        pg.close()

        # ================= الموقع العام: لا أخطاء ولا ملفات مكسورة =================
        print('\nالموقع العام')
        pg, errs = new_page(br)
        failed = []
        pg.on('response', lambda r: failed.append(r.url) if r.url.startswith(base) and r.status >= 400 else None)
        pg.on('requestfailed', lambda r: failed.append('FAILED ' + r.url) if r.url.startswith(base) else None)
        pg.goto(base + 'index.html'); pg.wait_for_load_state('networkidle'); time.sleep(0.6)
        check(pg.evaluate("document.documentElement.dir") == 'rtl' and pg.evaluate("document.documentElement.lang") == 'ar', 'العربية: RTL')
        pg.click('#lang'); time.sleep(0.4)
        check(pg.evaluate("document.documentElement.dir") == 'ltr' and pg.evaluate("document.documentElement.lang") == 'fr', 'الفرنسية: LTR')
        imgs = pg.evaluate("Array.from(document.images).filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)")
        check(imgs == [], 'لا صور مكسورة في الصفحة الرئيسية ' + str(imgs))
        check(failed == [], 'كل ملفات الموقع (CSS/JS/صور) تُحمَّل بلا 404 ' + str(failed))
        check(errs == [], 'لا أخطاء JavaScript في الموقع العام ' + str(errs))
        pg.set_viewport_size({'width': 390, 'height': 800}); time.sleep(0.3)
        check(pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), 'الموقع العام بلا تمرير أفقي على الهاتف')
        for f in ['admin.html', 'parent.html', 'manage.html', 'deploy-check.html']:
            pg2, e2 = new_page(br); fl = []
            pg2.on('response', lambda r, fl=fl: fl.append(r.url) if r.url.startswith(base) and r.status >= 400 else None)
            pg2.goto(base + f); pg2.wait_for_load_state('networkidle'); time.sleep(0.3)
            check(fl == [] and e2 == [], f + ': تُحمَّل كل ملفاتها بلا أخطاء ' + str(fl + e2)); pg2.context.close()
        pg.context.close()
        br.close()
    srv.shutdown()
    bad = [n for ok, n in results if not ok]
    print('\nالنتيجة: %d نجح، %d فشل' % (len(results) - len(bad), len(bad)))
    for n in bad: print('  ✗', n)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
