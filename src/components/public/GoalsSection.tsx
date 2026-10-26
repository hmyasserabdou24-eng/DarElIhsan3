import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, Award } from 'lucide-react';

export const GoalsSection: React.FC = () => {
  const { t } = useApp();

  const goals = [
    t.g1,
    t.g2,
    t.g3,
    t.g4,
    t.g5,
    t.g6,
    t.g7,
    t.g8
  ];

  return (
    <section id="goals" className="py-20 bg-white text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-sm font-bold tracking-wider text-[#B4873A] uppercase font-['Cairo']">
            {t.goalsTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C2D55] font-['Cairo']">
            {t.goalsSub}
          </h2>
          <div className="w-16 h-1 bg-[#B4873A] mx-auto rounded-full" />
        </div>

        {/* Goals Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {goals.map((goal, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#0C2D55]/30 hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-[#0C2D55]/10 text-[#0C2D55] font-bold font-mono text-sm flex items-center justify-center group-hover:bg-[#0C2D55] group-hover:text-white transition-colors">
                  0{idx + 1}
                </div>
                <p className="font-bold text-base text-slate-800 font-['Cairo'] leading-relaxed">
                  {goal}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/50 flex items-center gap-1.5 text-xs text-[#B4873A] font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>هدف استراتيجي معتمد</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
