import React from 'react';
import { useApp } from '../../context/AppContext';
import { HeartHandshake, ShieldCheck, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export const PublicHero: React.FC = () => {
  const { lang, t, setCurrentView } = useApp();
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section id="home" className="relative overflow-hidden bg-[#0C2D55] text-white py-16 lg:py-24">
      {/* Background decoration & overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay"
        style={{ backgroundImage: `url('/cover.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0C2D55]/95 via-[#0C2D55]/85 to-[#092240]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs sm:text-sm font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>جمعية أولياء الأطفال المعاقين ذهنيًا – تأسست سنة 1990</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-['Cairo'] tracking-tight leading-tight text-white drop-shadow-sm">
            {t.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-200 font-['Tajawal'] font-normal leading-relaxed">
            {t.heroSub}
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setCurrentView('parent')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold bg-[#B4873A] hover:bg-[#c99843] text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <HeartHandshake className="w-5 h-5" />
              <span>{t.loginParent}</span>
              <Arrow className="w-4 h-4" />
            </button>

            <a
              href="#about"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-sm transition-all"
            >
              <span>{t.navAbout}</span>
            </a>

            <button
              onClick={() => setCurrentView('verify')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-[#143d70] hover:bg-[#1b4b87] text-amber-200 border border-amber-400/30 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{t.navVerifyQr}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
