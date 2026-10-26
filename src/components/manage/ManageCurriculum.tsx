import React, { useState } from 'react';
import { CURRICULUM_DOMAINS } from '../../data/initialData';
import { BookOpen, Search, Layers, CheckCircle2 } from 'lucide-react';

export const ManageCurriculum: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  const domainNames = Object.keys(CURRICULUM_DOMAINS);
  const totalSkillsCount = domainNames.reduce((acc, d) => acc + CURRICULUM_DOMAINS[d].length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
          البرامج التربوية ودليل المهارات المعتمد ({totalSkillsCount} مهارة)
        </h2>
        <p className="text-xs text-slate-500 font-['Tajawal'] mt-0.5">
          الوثيقة البيداغوجية الرسمية للمركز النفسي البيداغوجي دار الإحسان عبر 8 مجالات نمائية متكاملة
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث في المهارات (مثال: غسل اليدين، الحروف، مسك القلم، المشي)..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        <div className="w-full md:w-72">
          <select
            value={selectedDomain}
            onChange={e => setSelectedDomain(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
          >
            <option value="all">جميع المجالات (8 مجالات)</option>
            {domainNames.map((d, i) => (
              <option key={i} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Domains accordion list */}
      <div className="space-y-4">
        {domainNames
          .filter(d => selectedDomain === 'all' || d === selectedDomain)
          .map((domain, dIdx) => {
            const allSkills = CURRICULUM_DOMAINS[domain];
            const filteredSkills = allSkills.filter(sk =>
              sk.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (searchTerm && filteredSkills.length === 0) return null;

            return (
              <div
                key={dIdx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0C2D55] text-white flex items-center justify-center font-bold text-sm font-mono">
                      0{dIdx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo']">
                        {domain}
                      </h3>
                      <span className="text-xs text-slate-500 font-['Tajawal']">
                        {filteredSkills.length} مهارة معتمدة للتقييم والتأهيل
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-bold font-mono">
                    {allSkills.length} مهارة
                  </span>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredSkills.map((skill, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 hover:bg-slate-100 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-slate-800 leading-snug">
                          {skill}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
