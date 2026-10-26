import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Educator } from '../../types';
import { Users, Phone, Mail, Shield, Plus, CheckCircle, Building } from 'lucide-react';

export const ManageEducators: React.FC = () => {
  const { educators, branches, sections, showToast } = useApp();
  const [filterBranch, setFilterBranch] = useState<string>('all');

  const filtered = educators.filter(
    ed => filterBranch === 'all' || ed.branch_slug === filterBranch
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
            فريق المربيات والمؤطرين المتخصصين
          </h2>
          <p className="text-xs text-slate-500 font-['Tajawal'] mt-0.5">
            الكادر البيداغوجي، الأرطفوني، والنفسي لمركز دار الإحسان ومرافقه
          </p>
        </div>

        <button
          onClick={() => showToast('نموذج تسجيل مؤطر جديد متاح للإدارة العامة', 'info')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0C2D55] text-white hover:bg-[#153e70] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة مؤطر جديد</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-bold font-['Cairo']">
        <button
          onClick={() => setFilterBranch('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filterBranch === 'all' ? 'bg-[#0C2D55] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          جميع المراكز ({educators.length})
        </button>
        <button
          onClick={() => setFilterBranch('main')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filterBranch === 'main' ? 'bg-[#0C2D55] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          المركز الرئيسي
        </button>
        <button
          onClick={() => setFilterBranch('work')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filterBranch === 'work' ? 'bg-[#0C2D55] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          مركز المساعدة على العمل
        </button>
        <button
          onClick={() => setFilterBranch('farm')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${filterBranch === 'farm' ? 'bg-[#0C2D55] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          المزرعة البيداغوجية
        </button>
      </div>

      {/* Educators Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(ed => (
          <div
            key={ed.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0C2D55] text-white flex items-center justify-center font-bold text-lg font-['Cairo']">
                  {ed.avatarLetter}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-['Cairo']">
                    {ed.name}
                  </h3>
                  <span className="text-xs font-semibold text-[#B4873A] block">
                    {ed.role}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">التخصص:</span>
                  <span className="font-semibold text-slate-800">{ed.specialty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">الفوج المسؤول عنه:</span>
                  <span className="font-semibold text-[#0C2D55]">{ed.section_name}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span dir="ltr">{ed.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span dir="ltr">{ed.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>حساب نشط</span>
              </span>
              <span className="text-[11px] text-slate-400">موسم 2026/2027</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
