#!/usr/bin/env python3
"""اختبار مسار «قبول دعوة الولي» في متصفح حقيقي (Chromium بمقاس هاتف) ضد خادم Supabase *وهمي*.
يختبر سلوك صفحة parent.html عند كل أنواع الروابط (hash الضمني، token_hash، منتهٍ، غير صالح، code) ويتأكد أنه لا توجد صفحة بيضاء أبدًا.
لا يختبر: وصول البريد فعليًا، إعدادات Supabase الحقيقية (Site URL / Redirect URLs / SMTP)، ولا RLS الحقيقية. كل البيانات وهمية.
التشغيل:  pip install playwright && playwright install chromium && python3 e2e-invite-test.py"""
import json, re, sys, threading, time, functools, http.server, socketserver, os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8766
MOCK = 'https://mock-project.supabase.co'
PN = 'bbbbbbbb-0000-4000-8000-0000000000aa'
GOOD = 'GOODHASH1234567890abcdef'
STRONG = 'Abcdefghi1'
LOG, USED = [], set()
results = []


def check(cond, name):
    results.append((bool(cond), name)); print(('  ✅ ' if cond else '  ❌ ') + name)


def backend(route, request):
    u = urlparse(request.url); path = u.path; m = request.method
    cors = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}
    if m == 'OPTIONS': return route.fulfill(status=204, headers=cors)
    body = (request.post_data_buffer or b'').decode('utf-8', errors='ignore')
    LOG.append({'m': m, 'p': path, 'b': body, 'auth': request.headers.get('authorization', '')})
    tok = (request.headers.get('authorization') or '').replace('Bearer ', '')
    who = 'NEW' if tok == 'tokNew' else None
    J = lambda o, s=200: route.fulfill(status=s, headers={**cors, 'content-type': 'application/json'}, body=json.dumps(o))
    usr = {'id': PN, 'email': 'parent@example.test', 'factors': []}
    if path == '/auth/v1/verify' and m == 'POST':
        d = json.loads(body or '{}')
        if d.get('token_hash') == GOOD and d.get('type') in ('invite', 'recovery') and GOOD not in USED:
            USED.add(GOOD)      # الرمز يُستعمل مرة واحدة كما في Supabase
            return J({'access_token': 'tokNew', 'refresh_token': 'rNew', 'expires_in': 3600, 'user': usr})
        return J({'code': 'otp_expired', 'error_code': 'otp_expired', 'msg': 'Email link is invalid or has expired'}, 403)
    if path == '/auth/v1/user':
        if m == 'PUT':
            if who != 'NEW': return J({'msg': 'not authorized'}, 401)
            return J(usr)
        return J(usr)
    if path in ('/auth/v1/recover', '/auth/v1/logout'): return J({})
    if path == '/auth/v1/token': return J({'access_token': 'tokNew', 'refresh_token': 'rNew', 'expires_in': 3600, 'user': usr})
    if path == '/rest/v1/rpc/is_active_parent': return J(who == 'NEW')
    if path.startswith('/rest/v1/'):
        tbl = path.split('/')[3]
        return J([{'full_name': 'ولي جديد'}] if tbl == 'parent_profiles' else [])
    return J({'error': 'not mocked'}, 404)


def serve():
    class H(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), functools.partial(H, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv


def new_page(br, block=None):
    ctx = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, locale='ar',
                         user_agent='Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/150 Mobile Safari/537.36')
    ctx.add_init_script("window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI));")
    pg = ctx.new_page(); errs, cons = [], []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda c: cons.append(c.text))

    def router(r, rq):
        if re.match(r'https://fonts\.(googleapis|gstatic)\.com', rq.url): return r.abort()
        if rq.url.startswith(MOCK): return backend(r, rq)
        if block and re.search(block, rq.url): return r.abort()
        if re.search(r'/cms-config\.js', rq.url):
            return r.fulfill(status=200, content_type='application/javascript',
                             body="window.DE_CONFIG={supabaseUrl:'%s',supabaseKey:'sb_publishable_FAKE_TEST_KEY',bucket:'media'};" % MOCK)
        return r.continue_()
    pg.route('**/*', router); return pg, errs, cons


def wf(pg, expr, timeout=8.0):
    end = time.time() + timeout
    while time.time() < end:
        if pg.evaluate(expr): return True
        time.sleep(0.05)
    raise AssertionError('انتهت المهلة: ' + expr)


def visible(pg, sel): return pg.evaluate("s=>{const e=document.querySelector(s);return !!e&&!e.hidden&&e.offsetParent!==null}", sel)
def text(pg, sel): return pg.evaluate("s=>(document.querySelector(s)||{}).textContent||''", sel)
def calls(m, pat): return len([e for e in LOG if e['m'] == m and re.search(pat, e['p'])])
def overflow(pg): return pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+1")
def not_blank(pg): return pg.evaluate("(document.body.innerText||'').trim().length>10")


def main():
    srv = serve(); base = 'http://127.0.0.1:%d/parent.html' % PORT
    all_errs, all_cons, all_csp = [], [], []
    with sync_playwright() as p:
        br = p.chromium.launch()

        print('\n1) رابط دعوة بتدفق hash الضمني (type=invite)')
        pg, errs, cons = new_page(br); LOG.clear()
        pg.goto(base + '#access_token=tokNew&refresh_token=rNew&expires_in=3600&token_type=bearer&type=invite')
        wf(pg, "!document.querySelector('#stSet').hidden")
        check(visible(pg, '#stSet') and not visible(pg, '#stCreds'), 'تظهر شاشة تعيين كلمة المرور (لا صفحة بيضاء)')
        check(pg.evaluate('location.hash') == '' and 'tokNew' not in pg.url, 'الرموز أُزيلت من شريط العنوان فورًا')
        check(pg.evaluate("document.documentElement.dir") == 'rtl' and 'مرحبًا' in text(pg, '#lHint'), 'RTL + نص ترحيب عربي')
        check(not overflow(pg), 'لا تمرير أفقي على شاشة الهاتف 390px')
        pg.fill('#np1', 'abc'); pg.fill('#np2', 'abc'); pg.click('#lBtn')
        wf(pg, "!document.querySelector('#lErr').hidden")
        check(calls('PUT', r'/auth/v1/user') == 0 and '10' in text(pg, '#lErr'), 'كلمة مرور ضعيفة تُرفض في الواجهة دون أي طلب')
        pg.fill('#np1', STRONG); pg.fill('#np2', STRONG + 'x'); pg.click('#lBtn')
        wf(pg, "document.querySelector('#lErr').textContent.includes('غير متطابقتين')")
        check(calls('PUT', r'/auth/v1/user') == 0, 'عدم تطابق الكلمتين يُرفض دون أي طلب')
        pg.fill('#np2', STRONG); pg.click('#lBtn')
        wf(pg, "!document.querySelector('#app').hidden")
        put = [e for e in LOG if e['m'] == 'PUT' and e['p'] == '/auth/v1/user']
        check(len(put) == 1 and json.loads(put[0]['b']).get('password') == STRONG and put[0]['auth'] == 'Bearer tokNew', 'استُدعي PUT /auth/v1/user مرة واحدة بجلسة الدعوة')
        check(visible(pg, '#app') and 'ولي جديد' in text(pg, '#who'), 'بعد النجاح يدخل الولي فضاءه')
        all_errs += errs; all_cons += cons; all_csp += pg.evaluate('window.__csp'); pg.context.close()

        print('\n2) رابط token_hash (يتطلب نقرة تأكيد؛ بحماية من ماسحات الروابط)')
        pg, errs, cons = new_page(br); LOG.clear(); USED.clear()
        pg.goto(base + '?token_hash=%s&type=invite' % GOOD)
        wf(pg, "document.querySelector('#lBtn').textContent.includes('تفعيل')")
        time.sleep(0.6)
        check(calls('POST', r'/auth/v1/verify') == 0, 'لا يُستهلك الرمز بمجرد فتح الصفحة (قبل نقرة المستخدم)')
        check(pg.url.endswith('/parent.html') and GOOD not in pg.url, 'token_hash أُزيل من الشريط فورًا')
        check(visible(pg, '#lBtn') and not visible(pg, '#stCreds') and not visible(pg, '#stSet'), 'تظهر شاشة «تفعيل حسابي» فقط')
        pg.dblclick('#lBtn')                         # نقر مزدوج متعمَّد
        wf(pg, "!document.querySelector('#stSet').hidden")
        check(calls('POST', r'/auth/v1/verify') == 1, 'النقر المزدوج يرسل طلب verify واحدًا فقط')
        v = [e for e in LOG if e['p'] == '/auth/v1/verify'][0]
        check(json.loads(v['b']) == {'type': 'invite', 'token_hash': GOOD}, 'verify يستعمل واجهة Supabase الرسمية بـ type + token_hash')
        pg.fill('#np1', STRONG); pg.fill('#np2', STRONG); pg.click('#lBtn')
        wf(pg, "!document.querySelector('#app').hidden")
        check(visible(pg, '#app'), 'إكمال كلمة المرور ثم دخول الفضاء')
        n = calls('POST', r'/auth/v1/verify'); pg.reload(); wf(pg, "window.__deReady===true")
        check(calls('POST', r'/auth/v1/verify') == n, 'إعادة تحميل الصفحة لا تعيد معالجة الرمز')
        all_errs += errs; all_cons += cons; all_csp += pg.evaluate('window.__csp'); pg.context.close()

        print('\n3) رابط مُستعمل/منتهٍ (token_hash لا يقبله الخادم)')
        pg, errs, cons = new_page(br); LOG.clear()
        pg.goto(base + '?token_hash=%s&type=invite' % GOOD)   # GOOD صار مستعملًا
        wf(pg, "document.querySelector('#lBtn').textContent.includes('تفعيل')"); pg.click('#lBtn')
        wf(pg, "!document.querySelector('#lErr').hidden")
        check('انتهت صلاحيته' in text(pg, '#lErr') and visible(pg, '#newLinkBtn'), 'رسالة عربية «انتهت الصلاحية» + زر «طلب رابط جديد»')
        pg.click('#newLinkBtn'); wf(pg, "!document.querySelector('#stForgot').hidden")
        pg.fill('#fEmail', 'someone@example.test'); pg.click('#lBtn'); wf(pg, "!document.querySelector('#lOk').hidden")
        check(calls('POST', r'/auth/v1/recover') == 1 and 'إن كان البريد مسجَّلًا' in text(pg, '#lOk'), 'طلب رابط جديد عبر مسار الاستعادة برد لا يكشف وجود الحساب')
        all_errs += errs; all_cons += cons; all_csp += pg.evaluate('window.__csp'); pg.context.close()

        print('\n4) أخطاء Supabase في العنوان (hash وquery) وروابط code/غير مكتملة')
        for label, suffix, want in [
            ('#error=otp_expired (hash)', '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired', 'انتهت صلاحيته'),
            ('?error=otp_expired (query)', '?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired', 'انتهت صلاحيته'),
            ('?code=xyz (PKCE)', '?code=abcd1234', 'غير صالح'),
            ('token_hash بلا type', '?token_hash=abcdefgh12345', 'انتهت صلاحيته')]:
            pg, errs, cons = new_page(br)
            pg.goto(base + suffix); wf(pg, "window.__deReady===true")
            check(visible(pg, '#login') and want in text(pg, '#lErr') and not_blank(pg), label + ' → رسالة واضحة وليس صفحة بيضاء')
            check(pg.evaluate("location.hash===''&&location.search===''"), label + ' → مُسحت المعاملات من الشريط')
            all_errs += errs; all_cons += cons; all_csp += pg.evaluate('window.__csp'); pg.context.close()

        print('\n5) رابط استعادة كلمة المرور (type=recovery) + زيارة عادية')
        pg, errs, cons = new_page(br)
        pg.goto(base + '#access_token=tokNew&refresh_token=rNew&expires_in=3600&type=recovery'); wf(pg, "!document.querySelector('#stSet').hidden")
        check(visible(pg, '#stSet'), 'type=recovery يعرض نموذج كلمة المرور الجديدة')
        pg.context.close()
        pg, errs, cons = new_page(br); pg.goto(base); wf(pg, "window.__deReady===true")
        check(visible(pg, '#stCreds') and not visible(pg, '#newLinkBtn'), 'الزيارة العادية تعرض تسجيل الدخول')
        all_errs += errs; all_cons += cons; all_csp += pg.evaluate('window.__csp'); pg.context.close()

        print('\n6) شبكة الأمان ضد الصفحة البيضاء (أعطال تحميل حقيقية)')
        for label, block in [('فشل تحميل de-core.js', r'/de-core\.js'), ('فشل تحميل parent.js', r'/parent\.js')]:
            pg, errs, cons = new_page(br, block=block)
            pg.goto(base + '#access_token=tokNew&refresh_token=rNew&type=invite'); wf(pg, "!!document.querySelector('.boot-fail')", timeout=12)
            check(not_blank(pg) and 'تعذّر' in text(pg, '#boot') and visible(pg, '.boot-fail a'), label + ' → تظهر رسالة وزر «إعادة التحميل» بدل صفحة بيضاء')
            href = pg.evaluate("document.querySelector('.boot-fail a').getAttribute('href')")
            check('access_token' not in (href or ''), 'زر إعادة التحميل لا يحمل رموز الدعوة')
            pg.context.close()

        br.close()
    srv.shutdown()

    print('\n7) فحوص عامة على كل السيناريوهات')
    check(not all_errs, 'لا أخطاء JavaScript غير معالَجة: ' + ('; '.join(all_errs[:3]) if all_errs else 'صفر'))
    check(not all_csp, 'لا انتهاكات CSP: ' + (', '.join(all_csp[:3]) if all_csp else 'صفر'))
    leak = [c for c in all_cons if re.search(r'tokNew|rNew|GOODHASH|%s' % STRONG, c)]
    check(not leak, 'لا رموز دعوة/جلسة/كلمات مرور في سجلّ وحدة التحكم')
    ok = len([r for r in results if r[0]]); bad = len(results) - ok
    print('\nالنتيجة: %d نجح، %d فشل' % (ok, bad)); sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
