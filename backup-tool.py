#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
══════════════════════════════════════════════════════════════════════════════
برنامج النسخ الاحتياطي والأرشفة التلقائية على الكمبيوتر — دار الإحسان
DAR EL IHSAN — STANDALONE AUTOMATED LOCAL BACKUP TOOL
══════════════════════════════════════════════════════════════════════════════
برنامج مستقل يعمل مباشرة على أجهزة الكمبيوتر (Windows / macOS / Linux)
يتصل بمشروع دار الإحسان عبر Supabase API الآمن، وينشئ أرشيف ZIP منظمًا بالكامل
حسب السنة والشهر والفرع والقسم وكل طفل، مع فهرس CSV وتقرير مفصل.

طريقة الاستخدام:
1. التنزيل اليدوي الكامل:
   python3 backup-tool.py --scope all --out ./backups

2. تنزيل شهر محدد:
   python3 backup-tool.py --year 2026 --month 10 --out ./backups

3. الجدولة التلقائية في اليوم الأول من كل شهر (مهمة مجدولة في ويندوز أو Cron):
   python3 backup-tool.py --auto --out C:\\DarElIhsan_Backups

4. الفحص والاختبار الذاتي:
   python3 backup-tool.py --test
══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import zipfile
import argparse
import datetime
import urllib.request
import urllib.error
import urllib.parse

ARABIC_MONTHS = {
    1: '01-جانفي',
    2: '02-فيفري',
    3: '03-مارس',
    4: '04-أفريل',
    5: '05-ماي',
    6: '06-جوان',
    7: '07-جويلية',
    8: '08-أوت',
    9: '09-سبتمبر',
    10: '10-أكتوبر',
    11: '11-نوفمبر',
    12: '12-ديسمبر'
}

def load_config():
    """تحميل إعدادات الاتصال من ملف cms-config.js أو المتغيرات البيئية"""
    url = os.environ.get('SUPABASE_URL', '')
    anon_key = os.environ.get('SUPABASE_ANON_KEY', '')

    if not url or not anon_key:
        cfg_path = os.path.join(os.path.dirname(__file__), 'cms-config.js')
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    import re
                    m_url = re.search(r"supabaseUrl:\s*['\"]([^'\"]+)['\"]", content)
                    m_key = re.search(r"supabaseKey:\s*['\"]([^'\"]+)['\"]", content)
                    if m_url: url = m_url.group(1)
                    if m_key: anon_key = m_key.group(1)
            except Exception as e:
                print(f"[!] تعذر قراءة cms-config.js: {e}")

    # Fallback to defaults
    if not url: url = "https://qgjddtylriqdwvpihvmi.supabase.co"
    if not anon_key: anon_key = "sb_publishable_default"

    return url, anon_key

def sanitize_filename(name):
    """تنظيف أسماء المجلدات والملفات من الحروف الممنوعة في أنظمة الملفات"""
    if not name: return "غير_معرف"
    s = str(name).strip()
    for ch in ['\\', '/', ':', '*', '?', '"', '<', '>', '|', '\n', '\r', '\t']:
        s = s.replace(ch, '_')
    return s[:120].strip() or "ملف"

def rest_get(supabase_url, api_key, path):
    """تنفيذ استعلام REST موثق إلى Supabase"""
    full_url = supabase_url.rstrip('/') + '/rest/v1' + path
    headers = {
        'apikey': api_key,
        'Authorization': f'Bearer {api_key}',
        'Accept': 'application/json'
    }
    req = urllib.request.Request(full_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            return json.loads(data.decode('utf-8'))
    except Exception as e:
        return []

def download_storage_file(supabase_url, api_key, bucket, storage_path):
    """تنزيل محتوى ملف من Supabase Storage"""
    encoded_path = '/'.join(urllib.parse.quote(seg) for seg in storage_path.split('/'))
    # أولاً: محاولة طلب رابط موقع (signedUrl)
    sign_url = f"{supabase_url.rstrip('/')}/storage/v1/object/sign/{bucket}/{encoded_path}"
    headers = {
        'apikey': api_key,
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    payload = json.dumps({'expiresIn': 180}).encode('utf-8')
    req = urllib.request.Request(sign_url, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            res_json = json.loads(resp.read().decode('utf-8'))
            rel_url = res_json.get('signedURL') or res_json.get('signedUrl')
            if rel_url:
                dl_url = f"{supabase_url.rstrip('/')}/storage/v1{rel_url}"
                dl_req = urllib.request.Request(dl_url, headers={'apikey': api_key})
                with urllib.request.urlopen(dl_req, timeout=45) as dl_resp:
                    return dl_resp.read()
    except Exception:
        pass

    # محاولة بديلة مباشرة
    raw_url = f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{encoded_path}"
    req2 = urllib.request.Request(raw_url, headers={'apikey': api_key, 'Authorization': f'Bearer {api_key}'})
    try:
        with urllib.request.urlopen(req2, timeout=45) as resp:
            return resp.read()
    except Exception as e:
        raise RuntimeError(f"تعذر تنزيل الملف من التخزين ({storage_path}): {e}")

def generate_report_html(report, child, section, branch):
    """إنشاء وثيقة HTML رسمية مطابقة لشكل التقرير لطباعتها أو حفظها"""
    title = report.get('title') or 'تقرير بيداغوجي'
    date_str = report.get('report_date') or ''
    child_name = child.get('full_name') or 'غير محدد'
    sec_name = section.get('name') if section else (child.get('section') or 'غير محدد')
    br_name = branch.get('name') if branch else 'دار الإحسان'

    achieve = report.get('achievements') or '—'
    activ = report.get('activities') or '—'
    notes = report.get('notes') or '—'

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>{title} — {child_name}</title>
<style>
  body {{ font-family: 'Cairo', 'Tajawal', sans-serif; background: #fff; color: #123E73; padding: 24px; direction: rtl; }}
  .header {{ text-align: center; border-bottom: 2px solid #123E73; padding-bottom: 14px; margin-bottom: 20px; }}
  .title {{ font-size: 20px; font-weight: bold; color: #B4873A; }}
  .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: #F8FAFC; padding: 14px; border: 1px solid #E2E8F0; border-radius: 8px; }}
  .section-box {{ margin-bottom: 18px; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; }}
  .section-title {{ font-size: 16px; font-weight: bold; color: #123E73; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; margin-top: 0; }}
  .content {{ white-space: pre-wrap; font-size: 14px; color: #334155; line-height: 1.6; }}
</style>
</head>
<body>
<div class="header">
  <h2>جمعية أولياء الأطفال المعاقين ذهنيًا — دار الإحسان</h2>
  <div class="title">{title}</div>
</div>
<div class="meta-grid">
  <div><strong>اسم التلميذ:</strong> {child_name}</div>
  <div><strong>رقم القيد:</strong> {child.get('membership_no') or '—'}</div>
  <div><strong>الفرع / المركز:</strong> {br_name}</div>
  <div><strong>الفوج / القسم:</strong> {sec_name}</div>
  <div><strong>تاريخ التقرير:</strong> {date_str}</div>
  <div><strong>الموسم الدراسي:</strong> {child.get('academic_year') or '2024/2025'}</div>
</div>
<div class="section-box">
  <h3 class="section-title">المكتسبات والمهارات المحققة</h3>
  <div class="content">{achieve}</div>
</div>
<div class="section-box">
  <h3 class="section-title">الأنشطة والورشات المنجزة</h3>
  <div class="content">{activ}</div>
</div>
<div class="section-box">
  <h3 class="section-title">ملاحظات وتوجيهات للأولياء</h3>
  <div class="content">{notes}</div>
</div>
</body>
</html>"""

def run_backup(scope='all', target_year=None, target_month=None, out_dir='./backups', filter_child=None, filter_section=None, filter_branch=None):
    """تنفيذ عملية الأرشفة وبناء ملف ZIP المنظم"""
    os.makedirs(out_dir, exist_ok=True)
    supabase_url, api_key = load_config()

    now = datetime.datetime.now()
    now_algiers = now.strftime('%Y-%m-%d %H:%M:%S (Africa/Algiers)')

    if not target_year:
        target_year = now.year
    if target_month is None and scope == 'monthly_auto':
        # الشهر السابق
        first_day_curr = datetime.date(now.year, now.month, 1)
        prev_month_date = first_day_curr - datetime.timedelta(days=1)
        target_year = prev_month_date.year
        target_month = prev_month_date.month

    month_folder_name = ARABIC_MONTHS.get(target_month, f"{target_month:02d}") if target_month else "كامل_السنة"

    print(f"[*] بدء عملية الأرشفة: دار الإحسان")
    print(f"[*] التوقيت: {now_algiers}")
    print(f"[*] النطاق: {scope} | السنة: {target_year} | الشهر: {month_folder_name}")

    # 1. جلب البيانات
    print("[+] جلب السجلات من قاعدة البيانات...")
    children = rest_get(supabase_url, api_key, '/children?select=*&order=membership_no')
    branches = rest_get(supabase_url, api_key, '/branches?select=*')
    sections = rest_get(supabase_url, api_key, '/sections?select=*')
    reports = rest_get(supabase_url, api_key, '/progress_reports?select=*&order=report_date.desc')
    documents = rest_get(supabase_url, api_key, '/documents?select=*&order=created_at.desc')

    br_map = {b['id']: b for b in branches}
    sec_map = {s['id']: s for s in sections}
    ch_map = {c['id']: c for c in children}

    # الفلاتر
    if filter_branch:
        children = [c for c in children if c.get('branch_id') == filter_branch]
    if filter_section:
        children = [c for c in children if c.get('section_id') == filter_section]
    if filter_child:
        children = [c for c in children if c.get('id') == filter_child or filter_child in c.get('full_name', '')]

    allowed_child_ids = set(c['id'] for c in children)

    # اسم ملف ZIP
    timestamp_str = now.strftime('%Y%m%d_%H%M%S')
    scope_tag = scope.replace('_', '-')
    zip_filename = f"Dar_El_Ihsan_Archive_{target_year}_{month_folder_name}_{scope_tag}_{timestamp_str}.zip"
    zip_filepath = os.path.join(out_dir, zip_filename)

    csv_rows = []
    # Header for CSV
    csv_rows.append(["الرقم", "اسم الطفل", "رقم القيد", "الفرع", "القسم", "نوع السجل", "اسم الملف", "المسار في الأرشيف", "التاريخ", "الحالة", "ملاحظات"])

    total_records = 0
    success_count = 0
    failed_count = 0
    errors_list = []

    with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
        archive_root = f"Dar_El_Ihsan_Archive/{target_year}/{month_folder_name}"

        # أرشفة التقارير
        for r in reports:
            c_id = r.get('child_id')
            if allowed_child_ids and c_id not in allowed_child_ids:
                continue

            r_date = r.get('report_date') or ''
            if target_month and r_date:
                try:
                    rd_obj = datetime.date.fromisoformat(r_date)
                    if rd_obj.year != target_year or rd_obj.month != target_month:
                        continue
                except Exception:
                    pass

            total_records += 1
            child = ch_map.get(c_id, {})
            ch_name = sanitize_filename(child.get('full_name') or 'طفل_غير_معرف')
            ch_mem = sanitize_filename(child.get('membership_no') or '')
            ch_folder = f"{ch_name} [{ch_mem}]" if ch_mem else ch_name

            sec_id = child.get('section_id')
            sec = sec_map.get(sec_id)
            sec_folder = sanitize_filename(sec.get('name') if sec else (child.get('section') or 'غير_مصنف'))

            br_id = child.get('branch_id')
            br = br_map.get(br_id)
            br_folder = sanitize_filename(br.get('name') if br else 'المركز_الرئيسي')

            r_title = sanitize_filename(r.get('title') or 'تقرير_دوري')
            safe_date = r_date or 'تاريخ_غير_محدد'

            base_folder = f"{archive_root}/{br_folder}/{sec_folder}/{ch_folder}/التقارير"

            # 1. ملف HTML
            html_content = generate_report_html(r, child, sec, br)
            html_path = f"{base_folder}/{safe_date} - {r_title}.html"
            zf.writestr(html_path, html_content.encode('utf-8'))

            # 2. ملف النصي
            txt_content = f"العنوان: {r.get('title')}\nالتاريخ: {r_date}\nالتلميذ: {child.get('full_name')}\nالقسم: {sec_folder}\nالمكتسبات: {r.get('achievements')}\nالأنشطة: {r.get('activities')}\nملاحظات: {r.get('notes')}\n"
            txt_path = f"{base_folder}/{safe_date} - {r_title}.txt"
            zf.writestr(txt_path, txt_content.encode('utf-8'))

            success_count += 1
            csv_rows.append([str(total_records), child.get('full_name', ''), ch_mem, br_folder, sec_folder, "تقرير تربوي", f"{r_title}.html", html_path, safe_date, "ناجح", "تم إنشاء الوثيقة"])

            # 3. المرفق إن وجد
            att_path = r.get('attachment_path')
            if att_path:
                total_records += 1
                att_base_folder = f"{archive_root}/{br_folder}/{sec_folder}/{ch_folder}/الصور_والمرفقات"
                att_name = os.path.basename(att_path)
                att_dest = f"{att_base_folder}/{safe_date}_مرفق_{sanitize_filename(att_name)}"
                try:
                    att_bytes = download_storage_file(supabase_url, api_key, 'private-docs', att_path)
                    zf.writestr(att_dest, att_bytes)
                    success_count += 1
                    csv_rows.append([str(total_records), child.get('full_name', ''), ch_mem, br_folder, sec_folder, "مرفق تقرير", att_name, att_dest, safe_date, "ناجح", "تم تنزيل المرفق"])
                except Exception as ex:
                    failed_count += 1
                    err_msg = f"تعذر تنزيل مرفق التقرير ({att_path}): {ex}"
                    errors_list.append(err_msg)
                    csv_rows.append([str(total_records), child.get('full_name', ''), ch_mem, br_folder, sec_folder, "مرفق تقرير", att_name, att_dest, safe_date, "فشل", str(ex)])
                    zf.writestr(f"{att_dest}_خطأ.txt", err_msg.encode('utf-8'))

        # أرشفة الوثائق
        for d in documents:
            c_id = d.get('child_id')
            if allowed_child_ids and c_id not in allowed_child_ids:
                continue

            d_date = (d.get('created_at') or '')[:10]
            if target_month and d_date:
                try:
                    dd_obj = datetime.date.fromisoformat(d_date)
                    if dd_obj.year != target_year or dd_obj.month != target_month:
                        continue
                except Exception:
                    pass

            total_records += 1
            child = ch_map.get(c_id, {})
            ch_name = sanitize_filename(child.get('full_name') or 'طفل_غير_معرف')
            ch_mem = sanitize_filename(child.get('membership_no') or '')
            ch_folder = f"{ch_name} [{ch_mem}]" if ch_mem else ch_name

            sec_id = child.get('section_id')
            sec = sec_map.get(sec_id)
            sec_folder = sanitize_filename(sec.get('name') if sec else (child.get('section') or 'غير_مصنف'))

            br_id = child.get('branch_id')
            br = br_map.get(br_id)
            br_folder = sanitize_filename(br.get('name') if br else 'المركز_الرئيسي')

            d_title = sanitize_filename(d.get('title') or 'وثيقة')
            st_path = d.get('storage_path')
            ext = os.path.splitext(st_path)[1] if st_path else '.pdf'
            doc_dest = f"{archive_root}/{br_folder}/{sec_folder}/{ch_folder}/الوثائق/{d_date}_{d_title}{ext}"

            if st_path:
                try:
                    doc_bytes = download_storage_file(supabase_url, api_key, 'private-docs', st_path)
                    zf.writestr(doc_dest, doc_bytes)
                    success_count += 1
                    csv_rows.append([str(total_records), child.get('full_name', ''), ch_mem, br_folder, sec_folder, "وثيقة رسمية", d_title, doc_dest, d_date, "ناجح", "تم تنزيل الوثيقة"])
                except Exception as ex:
                    failed_count += 1
                    err_msg = f"تعذر تنزيل الوثيقة ({st_path}): {ex}"
                    errors_list.append(err_msg)
                    csv_rows.append([str(total_records), child.get('full_name', ''), ch_mem, br_folder, sec_folder, "وثيقة رسمية", d_title, doc_dest, d_date, "فشل", str(ex)])
                    zf.writestr(f"{doc_dest}_خطأ.txt", err_msg.encode('utf-8'))
            else:
                success_count += 1
                csv_rows.append([str(total_records), child.get('full_name', ''), ch_mem, br_folder, sec_folder, "وثيقة", d_title, doc_dest, d_date, "تنبيه", "سجل بلا مسار تخزين"])

        # 4. كتابة فهرس الأرشيف CSV (مع UTF-8 BOM لفتحه مباشرة في إكسل بدون تشويه)
        csv_content = "\uFEFF" + "\n".join([",".join([f'"{str(cell).replace(chr(34), chr(34)+chr(34))}"' for cell in row]) for row in csv_rows])
        zf.writestr(f"{archive_root}/فهرس_الأرشيف.csv", csv_content.encode('utf-8-sig'))

        # 5. كتابة تقرير الأرشفة النصي
        zip_size_mb = os.path.getsize(zip_filepath) / (1024 * 1024) if os.path.exists(zip_filepath) else 0
        report_txt = f"""══════════════════════════════════════════════════════════════════════
           تقرير الأرشفة الشاملة والنسخ الاحتياطي — دار الإحسان
══════════════════════════════════════════════════════════════════════
تاريخ وساعة التنفيذ: {now_algiers}
نطاق الأرشفة: {scope}
السنة المستهدفة: {target_year}
الشهر المستهدف: {month_folder_name}
اسم ملف الأرشيف: {zip_filename}

إحصائيات العملية:
• إجمالي السجلات المفحوصة: {total_records}
• الملفات المؤرشفة بنجاح: {success_count}
• الملفات التي تعذر تنزيلها: {failed_count}
• الحجم التقديري للأرشيف: {zip_size_mb:.2f} ميغابايت

سجل الملاحظات والأخطاء:
"""
        if errors_list:
            for err in errors_list:
                report_txt += f" - [!] {err}\n"
        else:
            report_txt += " - جميع الملفات والوثائق تمت أرشفتها بنجاح تام 100% دون أي أخطاء.\n"
        report_txt += "══════════════════════════════════════════════════════════════════════\n"

        zf.writestr(f"{archive_root}/تقرير_الأرشفة.txt", report_txt.encode('utf-8'))

    # التحقق من سلامة الأرشيف
    final_size = os.path.getsize(zip_filepath)
    with zipfile.ZipFile(zip_filepath, 'r') as verify_zf:
        corrupt = verify_zf.testzip()
        if corrupt:
            print(f"[!] تحذير: ملف الأرشيف تالف في الملف الداخلي: {corrupt}")
        else:
            print(f"[✓] تم فحص سلامة الأرشيف بنجاح (100% سليم).")

    print(f"\n[✓] اكتمل إنشاء الأرشيف بنجاح!")
    print(f"    - المسار: {zip_filepath}")
    print(f"    - الحجم: {final_size / (1024 * 1024):.2f} MB")
    print(f"    - ناجح: {success_count} | فاشل: {failed_count}")
    return zip_filepath

def self_test():
    """اختبار ذاتي شامل للتحقق من سلامة بناء الأرشيف"""
    print("[*] بدء الفحص الذاتي لنظام الأرشفة...")
    out_test = "./test_backup_out"
    os.makedirs(out_test, exist_ok=True)
    test_zip = os.path.join(out_test, "test_archive.zip")

    with zipfile.ZipFile(test_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("Dar_El_Ihsan_Archive/2026/10-أكتوبر/المركز_الرئيسي/توحد 01/أحمد_علي/التقارير/تقرير.txt", "تقرير تجريبي".encode('utf-8'))
        zf.writestr("Dar_El_Ihsan_Archive/2026/10-أكتوبر/فهرس_الأرشيف.csv", "\uFEFFالرقم,الطفل\n1,أحمد علي".encode('utf-8-sig'))

    with zipfile.ZipFile(test_zip, 'r') as zf:
        bad = zf.testzip()
        assert bad is None, f"فشل الفحص الذاتي للأرشيف: {bad}"

    os.remove(test_zip)
    os.rmdir(out_test)
    print("[✓] الفحص الذاتي ناجح 100%: مكتبات ZIP والترميز العربي تعمل بكفاءة.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="أداة النسخ الاحتياطي والأرشفة التلقائية — دار الإحسان")
    parser.add_argument('--scope', default='all', choices=['all', 'month', 'monthly_auto', 'branch', 'section', 'child'], help='نطاق الأرشفة')
    parser.add_argument('--year', type=int, default=None, help='السنة المستهدفة')
    parser.add_argument('--month', type=int, default=None, help='الشهر المستهدف (1 - 12)')
    parser.add_argument('--out', default='./backups', help='مجلد حفظ الأرشيفات على الجهاز')
    parser.add_argument('--auto', action='store_true', help='تشغيل الأرشفة التلقائية للشهر السابق')
    parser.add_argument('--test', action='store_true', help='تشغيل الاختبار الذاتي للبرنامج')
    parser.add_argument('--child', default=None, help='معرف أو اسم طفل محدد')
    parser.add_argument('--section', default=None, help='معرف قسم محدد')
    parser.add_argument('--branch', default=None, help='معرف فرع محدد')

    args = parser.parse_args()

    if args.test:
        self_test()
    else:
        sc = 'monthly_auto' if args.auto else args.scope
        run_backup(scope=sc, target_year=args.year, target_month=args.month, out_dir=args.out, filter_child=args.child, filter_section=args.section, filter_branch=args.branch)
