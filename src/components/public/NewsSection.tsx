import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Calendar, ArrowLeft, ArrowRight, User } from 'lucide-react';

export const NewsSection: React.FC = () => {
  const { announcements, lang, t } = useApp();
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section id="news" className="py-20 bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-sm font-bold tracking-wider text-[#B4873A] uppercase font-['Cairo']">
            {t.navNews}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C2D55] font-['Cairo']">
            آخر الأخبار والنشاطات الميدانية
          </h2>
          <div className="w-16 h-1 bg-[#B4873A] mx-auto rounded-full" />
        </div>

        {/* Announcements Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {announcements.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-[#B4873A]" />
                    <span>{item.date}</span>
                  </span>
                  {item.urgent && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                      تنبيه هام
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[#0C2D55] font-['Cairo'] leading-snug">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-600 font-['Tajawal'] line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.author}</span>
                </div>
                <span className="font-semibold text-[#0C2D55]">{item.author_role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
