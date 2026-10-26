import React from 'react';
import { useApp } from '../../context/AppContext';
import { Mic, Award, Users, HeartHandshake, CheckCircle2 } from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const { t } = useApp();

  const services = [
    {
      icon: Mic,
      titleAr: t.s1a,
      titleFr: t.s1n,
      desc: t.s1d,
      color: 'bg-blue-50 text-[#0C2D55] border-blue-100',
      tag: 'Orthophonie'
    },
    {
      icon: Award,
      titleAr: t.s2a,
      titleFr: t.s2n,
      desc: t.s2d,
      color: 'bg-amber-50 text-[#B4873A] border-amber-100',
      tag: 'Psychologie'
    },
    {
      icon: Users,
      titleAr: t.s3a,
      titleFr: t.s3n,
      desc: t.s3d,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      tag: 'Ateliers'
    },
    {
      icon: HeartHandshake,
      titleAr: t.s4a,
      titleFr: t.s4n,
      desc: t.s4d,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      tag: 'Famille'
    }
  ];

  return (
    <section id="services" className="py-20 bg-white text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-sm font-bold tracking-wider text-[#B4873A] uppercase font-['Cairo']">
            {t.servicesTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C2D55] font-['Cairo']">
            {t.servicesSub}
          </h2>
          <div className="w-16 h-1 bg-[#B4873A] mx-auto rounded-full" />
        </div>

        {/* 4 Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/70 hover:bg-white rounded-2xl p-7 border border-slate-200/80 hover:border-[#B4873A]/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-14 h-14 rounded-xl ${svc.color} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-xs font-semibold font-mono mb-2">
                    {svc.tag}
                  </div>
                  <h3 className="text-xl font-bold text-[#0C2D55] font-['Cairo'] mb-2">
                    {svc.titleAr}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-['Tajawal'] text-justify">
                    {svc.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-[#0C2D55]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تأطير متخصص فردي وجماعي</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
