#!/usr/bin/env python3
"""اختبار مسار «دعوة مدير» في متصفح حقيقي (Chromium بمقاس هاتف) ضد خادم Supabase *وهمي*.
يغطي: فتح رابط الدعوة ← شاشة إنشاء كلمة المرور ← الدخول، وإعادة تحميل الصفحة قبل تعيين كلمة المرور،
والرابط المنتهي، وحساب «محرّر»، وإرسال الدعوة من لوحة المالك (نجاح/تعارض/حدّ الرسائل) دون «نجاح» وهمي.
لا يختبر: وصول البريد فعليًا، إعدادات Supabase الحقيقية (Site URL / Redirect URLs / SMTP)،
تنفيذ Edge Function على Deno، ولا RLS الحقيقية. كل البيانات وهمية.
التشغيل:  pip install playwright && playwright install chromium && python3 e2e-admin-invite-test.py [مجلد_المشروع]"""
import base64, json, re, sys, threading, time, functools, http.server, socketserver, os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
PORT = 8767
MOCK = 'https://mock-project.supabase.co'
STRONG = 'Abcdefghi1'
LOG, results = [], []
FN_MODE = {'v': 'ok'}


def b64(o):
    return base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')


def jwt(email, uid):
    return '.'.join([b64({'alg': 'HS256', 'typ': 'JWT'}), b64({'email': email, 'sub': uid}), 'sig'])


NEW_EMAIL, ED_EMAIL, OWNER_EMAIL = 'new.admin@example.test', 'new.editor@example.test', 'owner@example.test'
TOK_NEW, TOK_ED, TOK_OWNER = jwt(NEW_EMAIL, 'u-new'), jwt(ED_EMAIL, 'u-ed'), jwt(OWNER_EMAIL, 'u-owner')
USERS = {TOK_NEW: ('u-new', NEW_EMAIL), TOK_ED: ('u-ed', ED_EMAIL), TOK_OWNER: ('u-owner', OWNER_EMAIL)}


def check(cond, name):
    results.append((bool(cond), name)); print(('  ✅ ' if cond else '  ❌ ') + name)


def backend(route, request):
    u = urlparse(request.url); path = u.path; m = request.method
    cors = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}
    if m == 'OPTIONS': return route.fulfill(status=204, headers=cors)
    body = (request.post_data_buffer or b'').decode('utf-8', errors='ignore')
    LOG.append({'m': m, 'p': path, 'b': body, 'auth': request.headers.get('authorization', '')})
    tok = (request.headers.get('authorization') or '').replace('Bearer ', '')
    J = lambda o, s=200: route.fulfill(status=s, headers={**cors, 'content-type': 'application/json'}, body=json.dumps(o))
    uid, em = USERS.get(tok, (None, None))
    usr = {'id': uid, 'email': em, 'factors': []} if uid else None
    if path == '/auth/v1/token':
        d = json.loads(body or '{}')
        if d.get('email') == OWNER_EMAIL and d.get('password') == 'Owner-Pass-123':
            return J({'access_token': TOK_OWNER, 'refresh_token': 'r', 'expires_in': 3600, 'user': {'id': 'u-owner', 'email': OWNER_EMAIL, 'factors': []}})
        return J({'code': 'invalid_credentials', 'msg': 'Invalid login credentials'}, 400)
    if path == '/auth/v1/user':
        if not usr: return J({'msg': 'not authorized'}, 401)
        return J(usr)
    if path in ('/auth/v1/logout', '/auth/v1/recover'): return J({})
    if path.startswith('/rest/v1/rpc/'):
        fn = path.split('/')[-1]
        if fn == 'can_manage_families': return J(tok in (TOK_NEW, TOK_OWNER))
        if fn == 'is_admin': return J(bool(uid))
        if fn == 'admin_family_counts':
            return J({'children': 0, 'parents_active': 0, 'reports_draft': 0, 'reports_published': 0, 'appointments_upcoming': 0, 'messages_draft': 0})
        if fn == 'admin_list':
            return J({'can_manage': True, 'admins': [
                {'id': 'u-owner', 'email': OWNER_EMAIL, 'role': 'admin', 'disabled': False, 'is_owner': True, 'is_me': True, 'last_sign_in_at': '2026-10-22T10:00:00Z'},
                {'id': '11111111-1111-4111-8111-111111111111', 'email': 'pending@example.test', 'role': 'admin', 'disabled': False, 'is_owner': False, 'is_me': False, 'last_sign_in_at': None}]})
        return J({}, 404)
    if path.startswith('/rest/v1/'): return J([])
    if path.startswith('/functions/v1/admin-users'):
        mode = FN_MODE['v']
        if mode == 'conflict': return J({'error': 'هذا البريد مدير مفعَّل بالفعل.', 'email_status': 'already_registered'}, 409)
        if mode == 'ratelimit': return J({'error': 'بلغتَ حدّ الرسائل في الساعة. انتظر بضع دقائق ثم أعد المحاولة.', 'email_status': 'rate_limited'}, 429)
        return J({'ok': True, 'user_id': 'u-x', 'email_dispatched': True, 'email_status': 'accepted'})
    return J({'error': 'not mocked'}, 404)


def serve():
    class H(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), functools.partial(H, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv


def new_page(br):
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, locale='ar', service_workers='block')
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))

    def router(r, rq):
        if re.match(r'https://fonts\.(googleapis|gstatic)\.com', rq.url): return r.abort()
        if rq.url.startswith(MOCK): return backend(r, rq)
        if re.search(r'/cms-config\.js', rq.url):
            return r.fulfill(status=200, content_type='application/javascript',
                             body="window.DE_CONFIG={supabaseUrl:'%s',supabaseKey:'sb_publishable_FAKE_TEST_KEY',bucket:'media'};" % MOCK)
        return r.continue_()
    pg.route('**/*', router); return pg, errs


def wf(pg, expr, timeout=8.0):
    end = time.time() + timeout
    while time.time() < end:
        if pg.evaluate(expr): return True
        time.sleep(0.05)
    raise AssertionError('انتهت المهلة: ' + expr)


def visible(pg, sel): return pg.evaluate("s=>{const e=document.querySelector(s);return !!e&&!e.hidden&&e.offsetParent!==null}", sel)
def text(pg, sel): return pg.evaluate("s=>(document.querySelector(s)||{}).textContent||''", sel)
def calls(m, pat): return len([e for e in LOG if e['m'] == m and re.search(pat, e['p'])])


def hash_link(tok, typ='invite'):
    return '#access_token=%s&refresh_token=r1&expires_in=3600&token_type=bearer&type=%s' % (tok, typ)


def safe(name, fn):
    try: fn()
    except Exception as e: check(False, name + ' — استثناء: ' + str(e)[:160])


def main():
    srv = serve(); base = 'http://127.0.0.1:%d/manage.html' % PORT
    with sync_playwright() as p:
        br = p.chromium.launch()

        def t1():
            print('\n1) مدير مدعو يفتح رابط الدعوة ← يُطلب منه إنشاء كلمة مرور')
            pg, errs = new_page(br); LOG.clear()
            pg.goto(base + hash_link(TOK_NEW))
            wf(pg, "!document.querySelector('#stSet').hidden")
            check(visible(pg, '#stSet') and not visible(pg, '#stCreds'), 'تظهر شاشة «إنشاء كلمة المرور» لا شاشة الدخول')
            check(not visible(pg, '#app'), 'لا تُفتح لوحة الإدارة بجلسة الدعوة قبل تعيين كلمة المرور')
            check(pg.input_value('#setEmail') == NEW_EMAIL, 'البريد المدعو معروض (للقراءة فقط) كاسم مستخدم')
            check(pg.evaluate('location.hash') == '' and TOK_NEW not in pg.url, 'الرموز أُزيلت من شريط العنوان')
            pg.fill('#np1', 'abc'); pg.fill('#np2', 'abc'); pg.click('#lBtn')
            wf(pg, "!document.querySelector('#lErr').hidden")
            check(calls('PUT', r'/auth/v1/user') == 0, 'كلمة مرور ضعيفة تُرفض دون أي طلب')
            pg.fill('#np1', STRONG); pg.fill('#np2', STRONG + 'x'); pg.click('#lBtn')
            wf(pg, "document.querySelector('#lErr').textContent.includes('غير متطابقتين')")
            check(calls('PUT', r'/auth/v1/user') == 0, 'عدم التطابق يُرفض دون أي طلب')
            pg.fill('#np2', STRONG); pg.click('#lBtn')
            wf(pg, "!document.querySelector('#app').hidden")
            put = [e for e in LOG if e['m'] == 'PUT' and e['p'] == '/auth/v1/user']
            check(len(put) == 1 and json.loads(put[0]['b']).get('password') == STRONG and put[0]['auth'] == 'Bearer ' + TOK_NEW,
                  'PUT /auth/v1/user مرة واحدة بكلمة المرور الجديدة وبجلسة الدعوة')
            check(NEW_EMAIL in text(pg, '#who'), 'بعد النجاح يدخل المدير اللوحة')
            check(not errs, 'لا أخطاء JavaScript في الصفحة: ' + '; '.join(errs)[:120])
            pg.context.close()
        safe('1', t1)

        def t2():
            print('\n2) إعادة تحميل الصفحة قبل تعيين كلمة المرور')
            pg, errs = new_page(br); LOG.clear()
            pg.goto(base + hash_link(TOK_NEW))
            wf(pg, "!document.querySelector('#stSet').hidden")
            pg.reload()
            wf(pg, "!document.querySelector('#stSet').hidden")
            check(visible(pg, '#stSet') and not visible(pg, '#app'), 'بعد إعادة التحميل تعود شاشة إنشاء كلمة المرور ولا تُفتح اللوحة')
            check(pg.input_value('#setEmail') == NEW_EMAIL, 'البريد ما زال معروضًا بعد إعادة التحميل')
            pg.fill('#np1', STRONG); pg.fill('#np2', STRONG); pg.click('#lBtn')
            wf(pg, "!document.querySelector('#app').hidden")
            pg.reload(); wf(pg, "!document.querySelector('#app').hidden")
            check(visible(pg, '#app') and not visible(pg, '#stSet'), 'بعد تعيين كلمة المرور لا تعود الشاشة عند إعادة التحميل')
            pg.context.close()
        safe('2', t2)

        def t3():
            print('\n3) رابط دعوة منتهٍ / مستهلك')
            pg, errs = new_page(br); LOG.clear()
            pg.goto(base + '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
            wf(pg, "!document.querySelector('#lErr').hidden")
            check(visible(pg, '#stCreds') and not visible(pg, '#stSet') and not visible(pg, '#app'), 'تظهر شاشة الدخول لا صفحة بيضاء ولا لوحة')
            check('جديدًا' in text(pg, '#lErr') or 'جديد' in text(pg, '#lErr'), 'رسالة عربية واضحة تطلب رابطًا جديدًا')
            check(visible(pg, '#firstTimeBtn'), 'زر «مدعو جديد؟» ظاهر لطلب رابط جديد')
            check(not errs, 'لا أخطاء JavaScript')
            pg.context.close()
        safe('3', t3)

        def t4():
            print('\n4) محرّر محتوى مدعو (دوره editor)')
            pg, errs = new_page(br); LOG.clear()
            pg.goto(base + hash_link(TOK_ED))
            wf(pg, "!document.querySelector('#stSet').hidden")
            pg.fill('#np1', STRONG); pg.fill('#np2', STRONG); pg.click('#lBtn')
            wf(pg, "document.querySelector('#lOk').textContent.includes('admin.html')")
            check(calls('PUT', r'/auth/v1/user') == 1, 'كلمة المرور عُيِّنت فعلًا')
            check('admin.html' in text(pg, '#lOk') and not visible(pg, '#lErr'), 'رسالة نجاح توجّهه إلى admin.html بدل رسالة خطأ «غير مخوّل»')
            check(visible(pg, '#stCreds') and not visible(pg, '#app'), 'لا يدخل لوحة الأولياء، ويعود لشاشة الدخول')
            pg.context.close()
        safe('4', t4)

        def owner_page():
            pg, errs = new_page(br); LOG.clear(); FN_MODE['v'] = 'ok'
            pg.goto(base); wf(pg, "!document.querySelector('#stCreds').hidden")
            pg.fill('#email', OWNER_EMAIL); pg.fill('#password', 'Owner-Pass-123'); pg.click('#lBtn')
            wf(pg, "!document.querySelector('#app').hidden")
            pg.evaluate("document.querySelector('#nav [data-sec=accounts]').click()"); pg.wait_for_selector('.tbl')
            return pg, errs

        def open_invite(pg):
            pg.get_by_text('دعوة مدير', exact=True).first.click()
            pg.wait_for_selector('#modal input[type=email]')
            pg.fill('#modal input[type=email]', 'someone@example.test')
            pg.select_option('#modal select', 'admin')

        def t5():
            print('\n5) المالك يرسل دعوة مدير من اللوحة — نجاح')
            pg, errs = owner_page()
            check('pending@example.test' in text(pg, '#view') and 'إعادة إرسال الدعوة' in text(pg, '#view'), 'مدير لم يدخل بعد: يظهر زر «إعادة إرسال الدعوة»')
            open_invite(pg); LOG.clear()
            pg.get_by_text('إرسال الدعوة بالبريد', exact=True).click()
            wf(pg, "document.querySelector('#toast') && !document.querySelector('#toast').hidden")
            fn = [e for e in LOG if '/functions/v1/admin-users' in e['p']]
            check(len(fn) == 1 and json.loads(fn[0]['b']).get('action') == 'invite_admin' and json.loads(fn[0]['b']).get('email') == 'someone@example.test',
                  'طلب واحد إلى admin-users بالإجراء invite_admin')
            check('قبلت خدمة البريد' in text(pg, '#toast'), 'الرسالة صادقة: «قبلت خدمة البريد الدعوة» لا «نجاح» مطلق')
            check(calls('POST', r'/auth/v1/recover') == 0, 'لا يُستدعى /recover كمسار بديل صامت')
            check('action_link' not in pg.content() and 'access_token' not in pg.content(), 'لا يظهر رابط دخول مباشر في الصفحة')
            LOG.clear()
            pg.get_by_text('إعادة إرسال الدعوة').first.click()
            wf(pg, "document.querySelector('#toast').textContent.includes('قبلت')")
            fn2 = [e for e in LOG if '/functions/v1/admin-users' in e['p']]
            check(len(fn2) == 1 and json.loads(fn2[0]['b']) == {'action': 'resend_admin_invite', 'user_id': '11111111-1111-4111-8111-111111111111'},
                  'زر إعادة الإرسال يستدعي resend_admin_invite عبر الخادم (لا /recover)')
            check(calls('POST', r'/auth/v1/recover') == 0, 'ولا يستدعي /recover')
            pg.context.close()
        safe('5', t5)

        def t6():
            print('\n6) المالك يرسل دعوة — فشل حقيقي (تعارض ثم حدّ الرسائل)')
            for mode, needle in (('conflict', 'مفعَّل بالفعل'), ('ratelimit', 'حدّ الرسائل')):
                pg, errs = owner_page(); open_invite(pg); LOG.clear(); FN_MODE['v'] = mode
                pg.get_by_text('إرسال الدعوة بالبريد', exact=True).click()
                wf(pg, "document.querySelector('#toast').textContent.includes(%s)" % json.dumps(needle, ensure_ascii=False))
                check(needle in text(pg, '#toast'), '[%s] يُعرض سبب الفشل الحقيقي للمالك' % mode)
                check(calls('POST', r'/auth/v1/recover') == 0, '[%s] لا مسار بديل صامت عبر /recover' % mode)
                check('قبلت خدمة البريد' not in text(pg, '#toast'), '[%s] لا رسالة نجاح وهمية' % mode)
                pg.context.close()
            FN_MODE['v'] = 'ok'
        safe('6', t6)
        br.close()
    srv.shutdown()
    ok = sum(1 for r in results if r[0]); bad = [n for c, n in results if not c]
    print('\nالنتيجة: %d/%d نجح' % (ok, len(results)))
    for n in bad: print('  ❌ فشل: ' + n)
    sys.exit(0 if not bad else 1)


if __name__ == '__main__':
    main()
