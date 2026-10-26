import React from 'react';
import { Smartphone, Download, CheckCircle2, X, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

const GithubIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  onInstallPwa
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-['Tajawal'] text-slate-800">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-fadeIn my-8 text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0C2D55] text-white flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0C2D55] font-['Cairo']">
                تحميل تطبيق دار الإحسان للهواتف
              </h3>
              <span className="text-xs text-slate-500">
                ملف APK المترجم الجاهز لنظام أندرويد
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: Direct APK Download (Ready Now!) */}
        <div className="p-5 rounded-2xl bg-[#0C2D55] text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold">
              جاهز للتحميل الآن (5.8 ميغابايت)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <h4 className="font-bold text-base text-white font-['Cairo']">
            تحميل ملف APK المباشر (دار الإحسان)
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed text-justify">
            تم استخراج وبناء ملف الـ APK بنجاح! يمكنك تنزيله وتثبيته مباشرة على هاتفك أو مشاركته عبر واتساب.
          </p>

          <a
            href="/dar-el-ihsan.apk"
            download="dar-el-ihsan.apk"
            className="w-full py-3 rounded-xl bg-[#B4873A] hover:bg-[#c99843] text-white font-bold text-xs sm:text-sm font-['Cairo'] shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل ملف dar-el-ihsan.apk مباشرة</span>
          </a>
        </div>

        {/* Option 2: GitHub Actions Artifacts Link */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800 font-['Cairo']">
            <div className="flex items-center gap-1.5">
              <GithubIcon />
              <span>مستودع GitHub Actions المكتمل</span>
            </div>
            <span className="text-emerald-700 font-mono font-bold">✓ مكتمل بنجاح</span>
          </div>

          <p className="text-slate-600 leading-relaxed">
            تم الانتهاء من تجميع ملف الـ APK في GitHub بنجاح تام:
          </p>

          <a
            href="https://github.com/hmyasserabdou24-eng/DarElIhsan3/actions/runs/40344509133"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold transition-colors"
          >
            <span>فتح صفحة البناء #3 على GitHub وتحميل الملف</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>

        {/* Option 3: PWA Instant Install */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-emerald-950 font-['Cairo']">
            <span>تثبيت فوري على شاشة الهاتف (WebAPK)</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-emerald-900 leading-relaxed">
            يمكنك أيضًا تثبيت التطبيق مباشرة من المتصفح بدون أي ملفات إضافية.
          </p>
          <button
            onClick={() => {
              onInstallPwa();
              onClose();
            }}
            className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors"
          >
            تثبيت على الشاشة الرئيسية
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
