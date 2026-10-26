import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, Mail, ArrowLeft, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export const ManageLogin: React.FC = () => {
  const { loginAsStaff, setCurrentView, lang } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني أو اسم المستخدم وكلمة المرور.');
      return;
    }
    // Default staff login
    loginAsStaff('admin', 'المدير العام', 'main');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

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

          <div className="w-16 h-16 rounded-2xl bg-[#0C2D55] mx-auto shadow-md flex items-center justify-center text-white">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>

          <h1 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
            لوحة إدارة المراكز – دار الإحسان
          </h1>
          <p className="text-xs text-slate-500 font-['Tajawal']">
            خاص بالإدارة العامة، مديري الملحقات، والمربيات المؤهلات
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Cairo']">
              البريد الإلكتروني أو اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@darelihsan.dz"
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
            className="w-full py-3.5 rounded-xl bg-[#0C2D55] hover:bg-[#133c6e] text-white font-bold text-sm font-['Cairo'] shadow-md hover:shadow-lg transition-all"
          >
            دخول إلى لوحة التحكم
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-xs font-bold text-slate-600 font-['Cairo'] text-center">
            أو دخول فوري بالأدوار المعتمدة (تجربة):
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => loginAsStaff('admin', 'أ. محمد بن إسماعيل (المدير العام)', 'main')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0C2D55] hover:bg-slate-50 text-right transition-colors"
            >
              <strong className="block text-[#0C2D55] font-['Cairo']">المدير العام</strong>
              <span className="text-[10px] text-slate-500">كامل الصلاحيات</span>
            </button>

            <button
              onClick={() => loginAsStaff('director', 'أ. بلقاسم حاج مسعود', 'farm')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0C2D55] hover:bg-slate-50 text-right transition-colors"
            >
              <strong className="block text-[#0C2D55] font-['Cairo']">المزرعة البيداغوجية</strong>
              <span className="text-[10px] text-slate-500">الزراعة المائية</span>
            </button>

            <button
              onClick={() => loginAsStaff('educator', 'أ. فاطمة الزهراء باحمد', 'main')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0C2D55] hover:bg-slate-50 text-right transition-colors"
            >
              <strong className="block text-[#0C2D55] font-['Cairo']">أخصائية أرطفونيا</strong>
              <span className="text-[10px] text-slate-500">تقويم النطق واللغة</span>
            </button>

            <button
              onClick={() => loginAsStaff('director', 'أ. عمر بن ساسي', 'work')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0C2D55] hover:bg-slate-50 text-right transition-colors"
            >
              <strong className="block text-[#0C2D55] font-['Cairo']">مركز التأهيل المهني</strong>
              <span className="text-[10px] text-slate-500">التمهين والحرف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
