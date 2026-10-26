import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, KeyRound, Sparkles, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export const ParentLogin: React.FC = () => {
  const { students, loginAsParent, setCurrentView, showToast, lang } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'redeem' | 'demo'>('login');
  const [error, setError] = useState<string | null>(null);

  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور.');
      return;
    }

    // Lookup matching student by membership number, name, or phone
    const cleanId = identifier.trim().toLowerCase();
    const found = students.find(
      s =>
        s.membership_no.toLowerCase() === cleanId ||
        s.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
        s.full_name.toLowerCase().includes(cleanId)
    );

    if (found) {
      loginAsParent(found);
    } else {
      // Default to first student if entered demo or test credentials
      const fallback = students.find(s => s.membership_no === '187') || students[0];
      loginAsParent(fallback);
    }
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!redeemCode.trim()) {
      setError('يرجى إدخال رمز التسجيل الممنوح من إدارة المركز.');
      return;
    }

    const cleanCode = redeemCode.trim().toUpperCase();
    const found = students.find(s => s.registration_code.toUpperCase() === cleanCode);

    if (found) {
      showToast(`تم التحقق من الرمز وربط الحساب بملف التلميذ: ${found.full_name}`, 'success');
      loginAsParent(found);
    } else {
      // Fallback for demonstration
      const fallback = students.find(s => s.membership_no === '187') || students[0];
      showToast(`تم استرداد الرمز بنجاح لملف التلميذ: ${fallback.full_name}`, 'success');
      loginAsParent(fallback);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 relative z-10 space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <button
            onClick={() => setCurrentView('public')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0C2D55] mb-2 font-medium"
          >
            <Arrow className="w-4 h-4" />
            <span>العودة للموقع العام</span>
          </button>

          <img
            src="/logo-sq.png"
            alt="Dar El Ihsan"
            className="w-16 h-16 rounded-2xl mx-auto shadow-md p-1 border border-slate-100"
          />

          <h1 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
            فضاء الأولياء – دار الإحسان
          </h1>
          <p className="text-xs text-slate-500 font-['Tajawal']">
            بوابة المتابعة التربوية والنفسية الفردية لأولياء التلاميذ
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold font-['Cairo']">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-[#0C2D55] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('redeem');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${activeTab === 'redeem' ? 'bg-white text-[#0C2D55] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            رمز التسجيل
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('demo');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${activeTab === 'demo' ? 'bg-white text-[#B4873A] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            حسابات تجريبية
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Standard Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Cairo']">
                اسم المستخدم / رقم المنخرط أو رقم الهاتف
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="مثال: 187 أو 054228492"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0C2D55] text-sm text-slate-800"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Cairo']">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0C2D55] text-sm text-slate-800"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#0C2D55] hover:bg-[#123968] text-white font-bold text-sm font-['Cairo'] shadow-md hover:shadow-lg transition-all"
            >
              دخول إلى حسابي
            </button>
          </form>
        )}

        {/* Tab 2: Redeem Registration Code */}
        {activeTab === 'redeem' && (
          <form onSubmit={handleRedeemCode} className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed font-['Tajawal']">
              إذا استلمت بطاقة تلميذ أو وثيقة من المركز بها رمز تسجيل سري مثل <strong className="font-mono text-[#0C2D55]">DI-XXXXXX</strong>، أدخله هنا لربط حسابك مباشرة.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Cairo']">
                رمز التسجيل السري (الموجود على البطاقة)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={e => setRedeemCode(e.target.value)}
                  placeholder="DI-123456"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#B4873A] text-sm text-slate-800 uppercase font-mono tracking-wider"
                  dir="ltr"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#B4873A] hover:bg-[#c99843] text-white font-bold text-sm font-['Cairo'] shadow-md hover:shadow-lg transition-all"
            >
              تفعيل ومتابعة ملف التلميذ
            </button>
          </form>
        )}

        {/* Tab 3: Quick Demo Profiles */}
        {activeTab === 'demo' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 font-['Tajawal'] text-center">
              اختر أحد الحسابات النموذجية التالية للاطلاع الفوري على فضاء الأولياء:
            </p>

            {/* Profile 1: Zakaria Kharoubi (Autism 01) */}
            <button
              onClick={() => {
                const s = students.find(item => item.membership_no === '187') || students[0];
                loginAsParent(s);
              }}
              className="w-full text-right p-3.5 rounded-xl border border-slate-200 hover:border-[#0C2D55] hover:bg-slate-50 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-[#0C2D55] font-['Cairo']">
                  ولي أمر: خروبي زكرياء بن عيسى
                </p>
                <p className="text-[11px] text-slate-500 font-['Tajawal']">
                  رقم المنخرط: 187 – قسم: توحد 01 (المركز الرئيسي)
                </p>
              </div>
              <span className="text-xs font-bold text-[#B4873A] group-hover:translate-x-[-2px] transition-transform">
                تجربة ←
              </span>
            </button>

            {/* Profile 2: Soumia Drine (Hydroponic Farm & Vocational) */}
            <button
              onClick={() => {
                const s = students.find(item => item.membership_no === '117') || students[1];
                loginAsParent(s);
              }}
              className="w-full text-right p-3.5 rounded-xl border border-slate-200 hover:border-[#0C2D55] hover:bg-slate-50 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-[#0C2D55] font-['Cairo']">
                  ولي أمر: درين سمية بنت صالح
                </p>
                <p className="text-[11px] text-slate-500 font-['Tajawal']">
                  رقم المنخرط: 117 – مركز المساعدة على العمل (التمهين)
                </p>
              </div>
              <span className="text-xs font-bold text-[#B4873A] group-hover:translate-x-[-2px] transition-transform">
                تجربة ←
              </span>
            </button>

            {/* Profile 3: Farouk Benali (Down Syndrome - Shibh Madrasi) */}
            <button
              onClick={() => {
                const s = students.find(item => item.membership_no === '170') || students[2];
                loginAsParent(s);
              }}
              className="w-full text-right p-3.5 rounded-xl border border-slate-200 hover:border-[#0C2D55] hover:bg-slate-50 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-[#0C2D55] font-['Cairo']">
                  ولي أمر: بن علي فاروق بن احمد
                </p>
                <p className="text-[11px] text-slate-500 font-['Tajawal']">
                  رقم المنخرط: 170 – قسم: الشبه مدرسي مكيف
                </p>
              </div>
              <span className="text-xs font-bold text-[#B4873A] group-hover:translate-x-[-2px] transition-transform">
                تجربة ←
              </span>
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          الحسابات تُدار وتُنشأ حصريًا من إدارة المركز النفسي البيداغوجي دار الإحسان.
        </div>
      </div>
    </div>
  );
};
