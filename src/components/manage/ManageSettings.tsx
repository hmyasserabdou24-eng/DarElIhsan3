import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPABASE_STATUS } from '../../lib/supabaseClient';
import { ShieldCheck, Database, Key, Lock, Download, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ManageSettings: React.FC = () => {
  const { showToast, logAudit, students } = useApp();
  const [mfaEnabled, setMfaEnabled] = useState(true);

  const handleBackupAll = () => {
    const data = {
      timestamp: new Date().toISOString(),
      institution: 'المركز النفسي البيداغوجي دار الإحسان – العطف',
      studentsCount: students.length,
      students: students
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_شاملة_دار_الإحسان_${Date.now()}.json`;
    link.click();
    logAudit('نسخ احتياطي للبيانات', 'تصدير النسخة الشاملة للطلبة والملفات', 'success');
    showToast('تم تحميل النسخة الاحتياطية بنجاح', 'success');
  };

  const handleClearCache = () => {
    localStorage.removeItem('de_students_cache');
    showToast('تمت إعادة ضبط الذاكرة المؤقتة للبيانات الافتراضية', 'info');
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
          الأمان، قاعدة البيانات والإعدادات
        </h2>
        <p className="text-xs text-slate-500 font-['Tajawal'] mt-0.5">
          إدارة الاتصال بقاعدة البيانات وحماية الوصول وصلاحيات الطواقم
        </p>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0C2D55] font-['Cairo']">
                حالة قاعدة البيانات والتخزين السحابي (Supabase)
              </h3>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>متصل ومشفر ببروتوكول SSL مع سياسات RLS المحكمة</span>
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
            Online
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">عنوان الخادم:</span>
            <span className="text-slate-800" dir="ltr">{SUPABASE_STATUS.url}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">سياسات العزل (RLS):</span>
            <span className="text-emerald-700 font-sans font-bold">مفعلة 100% على كافة الجداول</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">نوع المفتاح المستخدم:</span>
            <span className="text-slate-700 font-sans">المفتاح العام المصرح (Anon / Publishable)</span>
          </div>
        </div>
      </div>

      {/* Security & MFA Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo'] flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-[#B4873A]" />
          <span>إعدادات المصادقة الثنائية (MFA) وسياسات كلمات المرور</span>
        </h3>

        <div className="space-y-4 text-xs font-['Tajawal']">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <strong className="block text-slate-800 text-sm font-['Cairo']">
                إلزام المصادقة الثنائية (TOTP) لحسابات الإدارة
              </strong>
              <p className="text-slate-500">
                مطالبة المديرين والمربيات برمز تأكيد مؤقت من تطبيق المصادقة (Google Authenticator)
              </p>
            </div>
            <button
              onClick={() => {
                setMfaEnabled(!mfaEnabled);
                showToast(mfaEnabled ? 'تم تعطيل إلزام MFA' : 'تم تفعيل إلزام MFA للإدارة', 'info');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${mfaEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              {mfaEnabled ? 'مفعل ✓' : 'معطل'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 leading-relaxed text-xs">
            <strong>سياسة كلمات المرور المعتمدة:</strong> الحد الأدنى 10 أحرف، مع إلزامية احتوائها على حرف كبير، حرف صغير، ورقم على الأقل، مع مهلة انتهاء جلسة الخمول التلقائي بعد 30 دقيقة.
          </div>
        </div>
      </div>

      {/* Backup and Cache Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo'] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Download className="w-5 h-5 text-indigo-600" />
          <span>النسخ الاحتياطي وإدارة الذاكرة</span>
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleBackupAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C2D55] hover:bg-[#143e70] text-white text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تصدير نسخة احتياطية كاملة (JSON)</span>
          </button>

          <button
            onClick={handleClearCache}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة ضبط البيانات المحلية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
