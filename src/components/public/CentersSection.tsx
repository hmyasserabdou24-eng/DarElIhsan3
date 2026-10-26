import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, ExternalLink, Phone, ShieldCheck } from 'lucide-react';

export const CentersSection: React.FC = () => {
  const { branches, t } = useApp();

  return (
    <section id="annexes" className="py-20 bg-slate-100/70 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-sm font-bold tracking-wider text-[#B4873A] uppercase font-['Cairo']">
            {t.annexTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C2D55] font-['Cairo']">
            {t.annexSub}
          </h2>
          <div className="w-16 h-1 bg-[#B4873A] mx-auto rounded-full" />
        </div>

        {/* Centers Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {branches.map(branch => (
            <div
              key={branch.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Image banner */}
              <div className="relative h-56 overflow-hidden bg-slate-200">
                <img
                  src={branch.image}
                  alt={branch.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // fallback if image not loaded
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-4 right-4 bg-[#0C2D55]/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>معتمد رسميًا</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#0C2D55] font-['Cairo'] leading-snug">
                    {branch.name}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-['Tajawal'] text-justify">
                    {branch.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-[#B4873A] flex-shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Phone className="w-4 h-4 text-[#0C2D55] flex-shrink-0" />
                    <span dir="ltr">{branch.phone}</span>
                  </div>

                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full mt-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-[#0C2D55] text-slate-800 hover:text-white transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{t.map}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
