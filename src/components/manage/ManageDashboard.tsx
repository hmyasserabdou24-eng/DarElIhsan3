import React from 'react';
import { useApp } from '../../context/AppContext';
import { Users, GraduationCap, Calendar, FileCheck, AlertTriangle, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ManageDashboard: React.FC<{ onNavigateToSection: (sec: string) => void }> = ({ onNavigateToSection }) => {
  const { students, educators, appointments, evaluations, sections } = useApp();

  const acquiredCount = evaluations.filter(e => e.status === 'acquired').length;
  const inProgressCount = evaluations.filter(e => e.status === 'in_progress').length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0C2D55] via-[#123968] to-[#184882] rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>بوابة الإدارة المعتمدة – الموسم 2026/2027</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Cairo']">
            لوحة قيادة ومتابعة أنشطة دار الإحسان
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-['Tajawal']">
            متابعة شاملة لـ 103 طالب موزعين عبر 11 قسمًا وثلاثة مراكز، مع سجلات تقييم مهارات أرطفونية ونفسية فورية.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateToSection('children')}
            className="px-4 py-2.5 rounded-xl bg-[#B4873A] hover:bg-[#c99843] text-white text-xs font-bold font-['Cairo'] shadow-sm transition-colors"
          >
            + إدارة وسجلات الطلبة
          </button>
          <button
            onClick={() => onNavigateToSection('reports')}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold font-['Cairo'] transition-colors"
          >
            سجل التقييمات
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">إجمالي الطلبة</span>
            <span className="block text-2xl sm:text-3xl font-black text-[#0C2D55] font-['Cairo'] mt-1">
              {students.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">100% مسجلون رسميًا</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0C2D55] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">الأقسام التربوية</span>
            <span className="block text-2xl sm:text-3xl font-black text-[#B4873A] font-['Cairo'] mt-1">
              {sections.length}
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">عبر 3 مراكز وملحقات</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#B4873A] flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">فريق التأطير والمربيات</span>
            <span className="block text-2xl sm:text-3xl font-black text-[#0C2D55] font-['Cairo'] mt-1">
              {educators.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">أخصائيون ومؤطرون</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">الجلسات المبرمجة</span>
            <span className="block text-2xl sm:text-3xl font-black text-indigo-900 font-['Cairo'] mt-1">
              {appointments.length}
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold">جلسات فردية وجماعية</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Schedule & Recent Evaluations */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Upcoming Sessions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo'] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#B4873A]" />
              <span>الجلسات والمواعيد القادمة</span>
            </h3>
            <button
              onClick={() => onNavigateToSection('appts')}
              className="text-xs text-[#0C2D55] font-bold hover:underline"
            >
              عرض الكل ←
            </button>
          </div>

          <div className="space-y-3">
            {appointments.slice(0, 4).map(apt => (
              <div
                key={apt.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 text-sm font-['Cairo']">{apt.title}</p>
                  <p className="text-slate-500">
                    التلميذ: <strong className="text-slate-700">{apt.child_name || 'عام'}</strong> | الأخصائي: {apt.specialist}
                  </p>
                </div>
                <div className="text-left font-mono">
                  <span className="block font-bold text-[#0C2D55]">{apt.date}</span>
                  <span className="text-slate-500">{apt.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Evaluation Progress Metrics */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo'] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>مؤشرات اكتساب المهارات البيداغوجية</span>
            </h3>
            <button
              onClick={() => onNavigateToSection('reports')}
              className="text-xs text-[#0C2D55] font-bold hover:underline"
            >
              تسجيل تقييم ←
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-around text-center">
            <div>
              <span className="block text-2xl font-black text-emerald-600 font-['Cairo']">
                {acquiredCount || 18}
              </span>
              <span className="text-xs text-slate-500 font-semibold">مهارات مكتسبة بنجاح</span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <span className="block text-2xl font-black text-amber-600 font-['Cairo']">
                {inProgressCount || 9}
              </span>
              <span className="text-xs text-slate-500 font-semibold">في طور التدريب</span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <span className="block text-2xl font-black text-[#0C2D55] font-['Cairo']">
                195
              </span>
              <span className="text-xs text-slate-500 font-semibold">إجمالي المهارات المعتمدة</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-700">توزيع الطلبة حسب الفروع:</p>
            <div className="space-y-1.5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">المركز الرئيسي دار الإحسان (العطف)</span>
                <span className="font-bold text-[#0C2D55]">52 طالب</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">مركز المساعدة على العمل (التمهين)</span>
                <span className="font-bold text-[#0C2D55]">48 شاب وطالب</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">المزرعة البيداغوجية (البستنة والزراعة المائية)</span>
                <span className="font-bold text-[#0C2D55]">3 طلاب متخصصين</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
