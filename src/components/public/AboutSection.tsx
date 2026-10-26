import React from 'react';
import { useApp } from '../../context/AppContext';
import { Target, Eye, Calendar, Sparkles, Building2, Users } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { t } = useApp();

  const values = [t.v1, t.v2, t.v3, t.v4, t.v5, t.v6];

  return (
    <section id="about" className="py-20 bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-sm font-bold tracking-wider text-[#B4873A] uppercase font-['Cairo']">
            {t.aboutTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C2D55] font-['Cairo']">
            {t.histTitle}
          </h2>
          <div className="w-16 h-1 bg-[#B4873A] mx-auto rounded-full" />
        </div>

        {/* Story & History */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-['Tajawal'] text-justify">
            {t.histText}
          </p>
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-sm font-semibold flex items-center gap-3">
            <Building2 className="w-5 h-5 text-[#B4873A] flex-shrink-0" />
            <span>{t.seat}</span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-slate-100">
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-3xl sm:text-4xl font-black text-[#0C2D55] font-['Cairo']">
                {t.statYearsValue}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 font-['Tajawal']">
                {t.statYears}
              </span>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-3xl sm:text-4xl font-black text-[#B4873A] font-['Cairo']">
                {t.statServicesValue}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 font-['Tajawal']">
                {t.statServices}
              </span>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-3xl sm:text-4xl font-black text-[#0C2D55] font-['Cairo']">
                {t.statBeneficiariesValue}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 font-['Tajawal']">
                {t.statBeneficiaries}
              </span>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-3xl sm:text-4xl font-black text-[#B4873A] font-['Cairo']">
                3
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 font-['Tajawal']">
                {t.statBranches}
              </span>
            </div>
          </div>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0C2D55] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-[#0C2D55]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0C2D55] font-['Cairo'] mb-3">
              {t.missionTitle}
            </h3>
            <p className="text-slate-600 leading-relaxed font-['Tajawal'] text-justify">
              {t.missionText}
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#B4873A] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6 text-[#B4873A]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0C2D55] font-['Cairo'] mb-3">
              {t.visionTitle}
            </h3>
            <p className="text-slate-600 leading-relaxed font-['Tajawal'] text-justify">
              {t.visionText}
            </p>
          </div>
        </div>

        {/* Values Chips */}
        <div className="space-y-4 text-center">
          <h4 className="text-lg font-bold text-slate-700 font-['Cairo']">
            {t.valuesTitle}
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {values.map((v, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-semibold shadow-xs hover:border-[#B4873A] hover:text-[#B4873A] transition-colors"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
