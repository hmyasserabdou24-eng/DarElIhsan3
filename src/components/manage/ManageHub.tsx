import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Users, Layers, ExternalLink, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export const ManageHub: React.FC<{ onNavigateToSection: (section: string) => void }> = ({ onNavigateToSection }) => {
  const { branches, sections, students, setActiveBranchSlug, activeBranchSlug } = useApp();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
          المركز وملحقاته التربوية
        </h2>
        <p className="text-sm text-slate-500 font-['Tajawal'] mt-1">
          بنية الجمعية المؤسساتية: 3 مراكز رئيسية، 11 قسمًا معتمدًا، و103 تلميذ(ة) متكفل بهم
        </p>
      </div>

      {/* Facilities Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {branches.map(b => {
          const bSections = sections.filter(s => s.branch_slug === b.slug);
          const bStudents = students.filter(s => s.center === b.slug);
          const isSelected = activeBranchSlug === b.slug;

          return (
            <div
              key={b.id}
              className={`bg-white rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between ${isSelected ? 'border-[#0C2D55] ring-2 ring-[#0C2D55]/20 shadow-lg' : 'border-slate-200 shadow-xs hover:border-slate-300'}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${isSelected ? 'bg-[#0C2D55] text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {isSelected ? 'المركز النشط حاليًا' : 'ملحقة تابعة'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>نشط</span>
                  </span>
                </div>

                <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 relative">
                  <img
                    src={b.image}
                    alt={b.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#0C2D55] font-['Cairo'] leading-snug">
                    {b.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {b.description}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="block text-xl font-black text-[#0C2D55] font-['Cairo']">
                      {bStudents.length}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">الأطفال المسجلين</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="block text-xl font-black text-[#B4873A] font-['Cairo']">
                      {bSections.length}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">الأقسام التربوية</span>
                  </div>
                </div>

                {/* Sections list tags */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-slate-700 block">الأقسام التابعة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {bSections.map(sec => (
                      <span
                        key={sec.id}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                      >
                        {sec.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => {
                    setActiveBranchSlug(b.slug);
                    onNavigateToSection('children');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold font-['Cairo'] transition-colors ${isSelected ? 'bg-[#0C2D55] text-white hover:bg-[#163f73]' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                >
                  إدارة طلبة هذا المركز ({bStudents.length} طالب) ←
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
