import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Search, ArrowRight, ArrowLeft, Building2, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export const QrVerification: React.FC = () => {
  const { students, verifyCode, setVerifyCode, setCurrentView, lang } = useApp();
  const [inputCode, setInputCode] = useState(verifyCode || '187');
  const [activeCode, setActiveCode] = useState(verifyCode || '187');

  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (verifyCode) {
      setInputCode(verifyCode);
      setActiveCode(verifyCode);
    }
  }, [verifyCode]);

  // Lookup student
  const matchedStudent = students.find(
    s =>
      s.membership_no === activeCode ||
      s.membership_no.padStart(3, '0') === activeCode.padStart(3, '0') ||
      s.public_uuid.toLowerCase() === activeCode.toLowerCase()
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setActiveCode(inputCode.trim());
      setVerifyCode(inputCode.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12 relative overflow-hidden font-['Tajawal'] text-slate-800">
      {/* Background glow */}
      <div className="absolute top-1/4 -right-28 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-28 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        {/* Official Republic Header */}
        <div className="bg-[#0C2D55] text-white p-6 text-center space-y-2 border-b-4 border-[#B4873A]">
          <p className="text-xs font-semibold text-slate-200">الجمهورية الجزائرية الديمقراطية الشعبية</p>
          <p className="text-xs text-amber-300 font-bold">جمعية أولياء الأطفال المعاقين ذهنيًا – ولاية غرداية</p>

          <img
            src="/logo-sq.png"
            alt="Dar El Ihsan"
            className="w-16 h-16 rounded-2xl mx-auto bg-white p-1 shadow-md my-2"
          />

          <h1 className="text-lg font-bold font-['Cairo'] text-white">
            المركز النفسي البيداغوجي دار الإحسان
          </h1>
          <p className="text-xs text-slate-300">
            العطف – ولاية غرداية
          </p>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm mt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>نظام التحقق الرقمي من بطاقات الانخراط</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                placeholder="أدخل رقم المنخرط (مثال: 187 أو 004)..."
                className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0C2D55] text-xs sm:text-sm font-mono text-slate-800"
                dir="ltr"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#0C2D55] hover:bg-[#153e70] text-white text-xs font-bold font-['Cairo'] transition-colors"
            >
              تحقق
            </button>
          </form>

          {/* Verification Result Card */}
          {matchedStudent ? (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>بطاقة انخراط معتمدة ومسجلة رسميًا</span>
              </div>

              <div className="divide-y divide-emerald-200/60 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">رقم المنخرط الرسمي:</span>
                  <span className="font-mono font-bold text-lg text-[#0C2D55]">{matchedStudent.membership_no}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">اسم ولقب التلميذ:</span>
                  <span className="font-bold text-sm text-slate-900 font-['Cairo']">{matchedStudent.full_name}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">المركز / الملحقة:</span>
                  <span className="font-bold text-slate-800">
                    {matchedStudent.center === 'main' ? 'المركز الرئيسي (العطف)' : matchedStudent.center === 'work' ? 'مركز المساعدة على العمل' : 'المزرعة البيداغوجية'}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">الفوج / القسم التربوي:</span>
                  <span className="font-bold text-slate-800">{matchedStudent.section}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">تاريخ الميلاد:</span>
                  <span className="font-mono font-bold text-slate-800" dir="ltr">{matchedStudent.dob}</span>
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">الموسم الدراسي:</span>
                  <span className="font-bold text-slate-800">{matchedStudent.academic_year || '2026-2027'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-white/80 p-3 rounded-xl border border-emerald-100 leading-relaxed text-justify">
                🔒 هذه معلومات التحقق العامة من البطاقة الرسمية فقط. الملف السريري والتقارير المفصلة متاحة لولي التلميذ بعد تسجيل الدخول في فضاء الأولياء.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="font-bold text-sm text-amber-900 font-['Cairo']">
                لم يتم العثور على تلميذ بهذا الرقم ({activeCode})
              </h3>
              <p className="text-xs text-amber-800 font-['Tajawal']">
                يرجى التأكد من كتابة رقم المنخرط بشكل صحيح، أو تجربة أحد الأرقام المعتمدة: 187، 004، 170، 118.
              </p>
            </div>
          )}

          {/* Quick links footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold font-['Cairo']">
            <button
              onClick={() => setCurrentView('public')}
              className="text-slate-500 hover:text-[#0C2D55] flex items-center gap-1"
            >
              <Arrow className="w-4 h-4" />
              <span>العودة للموقع الرئيسي</span>
            </button>

            <button
              onClick={() => setCurrentView('parent')}
              className="text-[#B4873A] hover:underline"
            >
              دخول فضاء الأولياء ←
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
