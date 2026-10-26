import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Globe, Users, Shield, Menu, X, QrCode, Smartphone } from 'lucide-react';

const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

export const PublicHeader: React.FC = () => {
  const { lang, setLang, t, setCurrentView, showToast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('تم تثبيت تطبيق دار الإحسان على جهازك بنجاح!', 'success');
      }
      setDeferredPrompt(null);
    } else {
      showToast('لتثبيت التطبيق على أندرويد: افتح قائمة المتصفح (⋮) واختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"', 'info');
    }
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const navLinks = [
    { href: '#home', label: t.navHome },
    { href: '#about', label: t.navAbout },
    { href: '#services', label: t.navServices },
    { href: '#annexes', label: t.navAnnexes },
    { href: '#goals', label: t.navGoals },
    { href: '#contact', label: t.navContact }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0C2D55] text-white shadow-md border-b border-[#1b3d6a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand */}
          <a
            href="#home"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setCurrentView('public')}
          >
            <img
              src="/logo-sq.png"
              alt="Dar El Ihsan"
              className="w-12 h-12 rounded-lg bg-white p-1 shadow-sm transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold font-['Cairo'] tracking-wide text-white group-hover:text-amber-200 transition-colors">
                {t.brand}
              </span>
              <span className="text-xs text-slate-300 font-['Tajawal'] hidden sm:inline">
                المركز النفسي البيداغوجي – العطف غرداية
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-200 hover:text-amber-300 font-medium text-sm transition-colors py-2 px-1 border-b-2 border-transparent hover:border-amber-400"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install PWA Button */}
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all animate-pulse"
              title="تثبيت كتطبيق أندرويد على الهاتف"
            >
              <Smartphone className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">تثبيت التطبيق</span>
            </button>

            {/* Verify QR quick link */}
            <button
              onClick={() => setCurrentView('verify')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#143d70] hover:bg-[#1b4b87] text-amber-200 border border-amber-400/30 transition-all shadow-sm"
              title="التحقق من بطاقة التلميذ"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>{t.navVerifyQr}</span>
            </button>

            {/* Parents Portal Link */}
            <button
              onClick={() => setCurrentView('parent')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold bg-[#B4873A] hover:bg-[#c99843] text-white transition-all shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>{t.navParent}</span>
            </button>

            {/* Admin Management Link */}
            <button
              onClick={() => setCurrentView('manage')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              title="لوحة إدارة المركز"
            >
              <Shield className="w-4 h-4 text-slate-200" />
              <span className="hidden md:inline">{t.navManage}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:text-white bg-black/20 hover:bg-black/30 transition-colors"
              aria-label="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold uppercase">{lang === 'ar' ? 'Fr' : 'عربي'}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a2546] border-t border-[#1a3962] px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-100 hover:bg-white/10 hover:text-amber-300"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setCurrentView('verify');
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-semibold bg-[#143d70] text-amber-200 border border-amber-400/40"
            >
              <QrCode className="w-4 h-4" />
              <span>{t.navVerifyQr}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setCurrentView('parent');
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-bold bg-[#B4873A] text-white"
            >
              <Users className="w-4 h-4" />
              <span>{t.navParent}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setCurrentView('manage');
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-semibold bg-white/10 text-white"
            >
              <Shield className="w-4 h-4" />
              <span>{t.navManage}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
