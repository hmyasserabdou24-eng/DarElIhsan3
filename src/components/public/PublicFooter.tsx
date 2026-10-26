import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Mail, Phone, MessageSquare, ShieldCheck, Heart } from 'lucide-react';

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

export const PublicFooter: React.FC = () => {
  const { t, setCurrentView } = useApp();

  return (
    <footer id="contact" className="bg-[#081E38] text-white pt-16 pb-12 border-t border-[#14325a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Info Grid */}
        <div className="grid md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src="/logo-sq.png"
                alt="Dar El Ihsan"
                className="w-12 h-12 rounded-lg bg-white p-1"
              />
              <div>
                <h3 className="font-bold text-lg font-['Cairo'] text-white">
                  {t.brand}
                </h3>
                <p className="text-xs text-amber-300 font-['Tajawal']">
                  تأسست عام 1990
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 font-['Tajawal'] leading-relaxed text-justify">
              جمعية أولياء الأطفال المعاقين ذهنيًا – المركز النفسي البيداغوجي دار الإحسان، بلدية العطف، ولاية غرداية، الجزائر.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.facebook.com/apehme"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#1877F2] text-white flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/cpp_1990"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-gradient-to-tr hover:from-amber-500 hover:to-pink-500 text-white flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://wa.me/213668034147"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Address */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-amber-300 font-['Cairo']">
              المقر والعنوان
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">المقر الرئيسي:</p>
                  <p>حي المعلمين، بجانب ملحقة التكوين المهني، بلدية العطف، ولاية غرداية</p>
                  <p className="text-slate-400 font-mono mt-1" dir="ltr">BP 203 El Atteuf, Ghardaïa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-amber-300 font-['Cairo']">
              الاتصال الهاتفي والبريد
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span dir="ltr">Tel/Fax: 044 44 48 34</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span dir="ltr">0664 42 14 44 / 0668 03 41 47</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href="mailto:cppdarelihcen@gmail.com" className="hover:text-white" dir="ltr">
                  cppdarelihcen@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href="mailto:contact@darelihsan.com" className="hover:text-white" dir="ltr">
                  contact@darelihsan.com
                </a>
              </div>
            </div>
          </div>

          {/* Col 4: Portals and Direct Access */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-amber-300 font-['Cairo']">
              البوابات والخدمات الرقمية
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentView('parent')}
                className="w-full text-right py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>فضاء متابعة ملفات الأولياء</span>
                <span className="text-amber-400 text-[10px]">دخول ←</span>
              </button>
              <button
                onClick={() => setCurrentView('manage')}
                className="w-full text-right py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>لوحة إدارة المركز وملحقاته</span>
                <span className="text-slate-400 text-[10px]">إدارة ←</span>
              </button>
              <button
                onClick={() => setCurrentView('verify')}
                className="w-full text-right py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>التحقق من بطاقة التلميذ الرسمية</span>
                <span className="text-amber-400 text-[10px]">QR ←</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-['Tajawal']">
          <p>© 1990 - 2026 جمعية أولياء الأطفال المعاقين ذهنيًا – المركز النفسي البيداغوجي دار الإحسان. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span>رعاية متواصلة وأمل متجدد لأطفالنا</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 inline" />
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Action Button */}
      <a
        href="https://wa.me/213668034147"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] text-white font-bold shadow-xl hover:bg-[#20ba5a] hover:scale-105 transition-all focus:outline-none"
        aria-label="WhatsApp Contact"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm hidden sm:inline">{t.waText}</span>
      </a>
    </footer>
  );
};
