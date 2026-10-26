import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  FileText,
  Calendar,
  Bell,
  BookOpen,
  CreditCard,
  LogOut,
  ChevronDown,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  ShieldCheck,
  Building,
  QrCode
} from 'lucide-react';
import { renderStudentCardToCanvas, downloadStudentCard } from '../../lib/cardRenderer';
import { CURRICULUM_DOMAINS } from '../../data/initialData';

export const ParentPortal: React.FC = () => {
  const {
    currentUser,
    activeChild,
    setActiveChild,
    students,
    logout,
    setCurrentView,
    announcements,
    appointments,
    evaluations,
    progressReports
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'reports' | 'appointments' | 'messages' | 'curriculum' | 'card'>('profile');
  const [selectedChildId, setSelectedChildId] = useState<string>(activeChild?.id || '');
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync selected child
  useEffect(() => {
    if (activeChild) {
      setSelectedChildId(activeChild.id);
    }
  }, [activeChild]);

  // Re-render card when activeTab is card or child changes
  useEffect(() => {
    if (activeTab === 'card' && cardCanvasRef.current && activeChild) {
      renderStudentCardToCanvas(cardCanvasRef.current, activeChild);
    }
  }, [activeTab, activeChild]);

  if (!activeChild) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-slate-600 font-['Cairo']">لم يتم العثور على ملف التلميذ المرتبط.</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-[#0C2D55] text-white rounded-xl font-bold"
          >
            تسجيل الدخول مرة أخرى
          </button>
        </div>
      </div>
    );
  }

  // Filter child specific data
  const childAppointments = appointments.filter(a => a.child_id === activeChild.id || !a.child_id);
  const childEvals = evaluations.filter(e => e.child_id === activeChild.id);
  const report = progressReports.find(r => r.child_id === activeChild.id);

  const handlePrintCard = () => {
    if (!cardCanvasRef.current) return;
    const dataUrl = cardCanvasRef.current.toDataURL('image/jpeg', 0.95);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>طباعة بطاقة التلميذ – ${activeChild.full_name}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; font-family: sans-serif; }
            img { max-width: 90vw; height: auto; border: 1px solid #ccc; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            @media print {
              body { background: transparent; }
              img { max-width: 100%; border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();" />
        </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col font-['Tajawal'] text-slate-800">
      {/* Top Bar */}
      <header className="bg-[#0C2D55] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Brand & Child Selector */}
            <div className="flex items-center gap-3">
              <img
                src="/logo-sq.png"
                alt="Logo"
                className="w-10 h-10 rounded-lg bg-white p-1 hidden sm:block"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold font-['Cairo'] text-white">
                    فضاء الأولياء
                  </h1>
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-mono">
                    2026/2027
                  </span>
                </div>
                <p className="text-xs text-slate-300 hidden md:block">
                  المركز النفسي البيداغوجي دار الإحسان – العطف
                </p>
              </div>
            </div>

            {/* Child Selector Dropdown */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <select
                  value={selectedChildId}
                  onChange={e => {
                    const found = students.find(s => s.id === e.target.value);
                    if (found) {
                      setSelectedChildId(found.id);
                      setActiveChild(found);
                    }
                  }}
                  className="bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold font-['Cairo'] py-1.5 px-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  {students.slice(0, 15).map(s => (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      التلميذ: {s.full_name} ({s.membership_no})
                    </option>
                  ))}
                </select>
              </div>

              {/* Logout & Exit */}
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="border-t border-white/10 bg-[#092240]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1 py-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold font-['Cairo'] whitespace-nowrap transition-colors ${activeTab === 'profile' ? 'bg-[#B4873A] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <User className="w-4 h-4" />
              <span>ملف التلميذ</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold font-['Cairo'] whitespace-nowrap transition-colors ${activeTab === 'reports' ? 'bg-[#B4873A] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <FileText className="w-4 h-4" />
              <span>التقارير والتقييم</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold font-['Cairo'] whitespace-nowrap transition-colors ${activeTab === 'appointments' ? 'bg-[#B4873A] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <Calendar className="w-4 h-4" />
              <span>المواعيد والأنشطة</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold font-['Cairo'] whitespace-nowrap transition-colors ${activeTab === 'messages' ? 'bg-[#B4873A] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <Bell className="w-4 h-4" />
              <span>الرسائل والإعلانات</span>
            </button>

            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold font-['Cairo'] whitespace-nowrap transition-colors ${activeTab === 'curriculum' ? 'bg-[#B4873A] text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <BookOpen className="w-4 h-4" />
              <span>البرنامج التربوي</span>
            </button>

            <button
              onClick={() => setActiveTab('card')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold font-['Cairo'] whitespace-nowrap transition-colors ${activeTab === 'card' ? 'bg-amber-400 text-slate-900 shadow-xs' : 'text-amber-300 hover:text-white hover:bg-white/5'}`}
            >
              <CreditCard className="w-4 h-4" />
              <span>بطاقة التلميذ المعتمدة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Child Banner Quick Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0C2D55] text-white flex items-center justify-center font-bold text-2xl font-['Cairo'] shadow-sm">
              {activeChild.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-[#0C2D55] font-['Cairo']">
                  {activeChild.full_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  منخرط مسجل
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                رقم المنخرط: <strong className="font-mono text-slate-900">{activeChild.membership_no}</strong> | الفوج: <strong>{activeChild.section}</strong> | التشخيص: <strong>{activeChild.disability}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('card')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0C2D55] hover:bg-[#153e70] text-white transition-colors"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>عرض البطاقة الرقمية</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Student Profile */}
        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-[#0C2D55] font-['Cairo'] border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-[#B4873A]" />
                <span>البيانات الرسمية والملف الإداري</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">الاسم واللقب الكامل</span>
                  <span className="font-bold text-[#0C2D55]">{activeChild.full_name}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">رقم القيد / المنخرط الرسمي</span>
                  <span className="font-bold font-mono text-slate-800">{activeChild.membership_no}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">تاريخ الميلاد</span>
                  <span className="font-bold text-slate-800" dir="ltr">{activeChild.dob}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">طبيعة الإعاقة / التشخيص المعتمد</span>
                  <span className="font-bold text-amber-700">{activeChild.disability}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">المركز والملحقة</span>
                  <span className="font-bold text-slate-800">
                    {activeChild.center === 'main' ? 'المركز الرئيسي دار الإحسان (العطف)' : activeChild.center === 'work' ? 'مركز المساعدة على العمل' : 'المزرعة البيداغوجية'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">الفوج / القسم التربوي</span>
                  <span className="font-bold text-slate-800">{activeChild.section}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">رقم هاتف الولي للتواصل</span>
                  <span className="font-bold font-mono text-slate-800" dir="ltr">{activeChild.phone}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">الموسم الدراسي الحالي</span>
                  <span className="font-bold text-slate-800">{activeChild.academic_year}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 leading-relaxed font-['Tajawal']">
                <strong>ملاحظة بيداغوجية عامة:</strong> {activeChild.notes}
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-[#0C2D55] font-['Cairo'] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>حالة التكفل والمتابعة</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">حالة القيد:</span>
                    <span className="font-bold text-emerald-700">نشط ومسجل رسميًا</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">رمز التسجيل المعتمد:</span>
                    <span className="font-mono font-bold text-[#0C2D55]">{activeChild.registration_code}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">تقويم النطق (أرطفونيا):</span>
                    <span className="font-bold text-slate-800">مدرج في الجداول</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">الرعاية النفسية:</span>
                    <span className="font-bold text-slate-800">متابعة عيادية</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#0C2D55] to-[#123e75] text-white rounded-2xl p-6 shadow-md space-y-4">
                <h4 className="font-bold text-sm font-['Cairo'] text-amber-300">
                  تواصل مباشر مع الإدارة
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-['Tajawal']">
                  هل لديك استفسار أو ترغب في مقابلة المربية أو الأخصائي النفسي؟ يمكنك حجز موعد مباشر أو الاتصال بالرقم الداخلي.
                </p>
                <div className="pt-2">
                  <a
                    href="tel:044444834"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-[#0C2D55] text-xs font-bold hover:bg-amber-300 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>اتصال بالمركز: 044 44 48 34</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Progress Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {report && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-[#0C2D55] font-['Cairo']">
                      تقرير التقييم البيداغوجي والفردي ({report.term})
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      الموسم: {report.academic_year} | تاريخ التقييم: {report.date} | المؤطر: {report.educatorName}
                    </p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="block text-2xl font-black text-emerald-700 font-['Cairo']">
                      %{report.overallScore}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800">معدل التطور العام</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm leading-relaxed text-slate-700">
                  <strong className="text-[#0C2D55]">ملاحظات الفريق المتخصص:</strong> {report.generalNotes}
                </div>

                {/* Domains progress bars */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-base font-bold text-[#0C2D55] font-['Cairo']">
                    نسبة اكتساب المهارات حسب المجالات الثمانية المعتمدة
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {report.domainScores.map((dom, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>{dom.domain}</span>
                          <span className="font-mono text-[#0C2D55]">%{dom.percentage}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[#0C2D55] h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${dom.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Individual evaluated skills log */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-[#0C2D55] font-['Cairo']">
                سجل المهارات المقيّمة مؤخرًا
              </h3>
              <div className="divide-y divide-slate-100">
                {childEvals.map(ev => (
                  <div key={ev.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0C2D55]">{ev.domain}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{ev.date}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{ev.skill}</p>
                      {ev.notes && <p className="text-xs text-slate-500 font-['Tajawal']">{ev.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {ev.status === 'acquired' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مكتسبة</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>في طور الاكتساب</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Appointments */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-[#0C2D55] font-['Cairo'] border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#B4873A]" />
              <span>الجلسات والمواعيد المقررة للتلميذ</span>
            </h3>

            <div className="space-y-4">
              {childAppointments.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">لا توجد مواعيد مبرمجة حاليًا.</p>
              ) : (
                childAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-[#0C2D55]/30 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#0C2D55] text-white text-[11px] font-bold font-mono">
                          {apt.date} الساعة {apt.time}
                        </span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {apt.specialist}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 font-['Cairo'] pt-1">
                        {apt.title}
                      </h4>
                      <p className="text-xs text-slate-600">المكان: {apt.location}</p>
                      {apt.notes && <p className="text-xs text-slate-500 italic">{apt.notes}</p>}
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      مؤكد
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Messages & Announcements */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {announcements.map(ann => (
              <div
                key={ann.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-[#0C2D55]">{ann.author} – {ann.author_role}</span>
                  <span className="font-mono">{ann.date}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 font-['Cairo']">
                  {ann.title}
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-['Tajawal']">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: Educational Curriculum */}
        {activeTab === 'curriculum' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#0C2D55] font-['Cairo']">
                البرنامج البيداغوجي المعتمد لقسم {activeChild.section}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                دليل المجالات والمهارات التربوية الرسمية لمركز دار الإحسان (195 مهارة عبر 8 مجالات)
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(CURRICULUM_DOMAINS).map(([domain, skills], idx) => (
                <details
                  key={idx}
                  className="group rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50"
                  open={idx === 0}
                >
                  <summary className="p-4 cursor-pointer font-bold text-sm text-[#0C2D55] font-['Cairo'] flex items-center justify-between hover:bg-slate-100 transition-colors">
                    <span>{domain} ({skills.length} مهارة)</span>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform text-slate-500" />
                  </summary>
                  <div className="p-4 pt-1 bg-white border-t border-slate-200">
                    <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      {skills.map((sk, sIdx) => (
                        <li key={sIdx} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B4873A] flex-shrink-0" />
                          <span>{sk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Official Card & QR */}
        {activeTab === 'card' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#0C2D55] font-['Cairo']">
                  بطاقة انخراط ورعاية التلميذ الرسمية (300 DPI)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  البطاقة المعتمدة رقميًا للمركز النفسي البيداغوجي دار الإحسان المزودة برمز QR للتحقق السريع.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadStudentCard(activeChild)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0C2D55] hover:bg-[#143e72] text-white shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل البطاقة (JPG)</span>
                </button>
                <button
                  onClick={handlePrintCard}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="flex justify-center p-4 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
              <canvas
                ref={cardCanvasRef}
                className="max-w-full h-auto rounded-xl shadow-lg border border-slate-300"
                style={{ width: '600px', aspectRatio: '85.6 / 54' }}
              />
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>معلومات الأمان:</strong> رمز QR الموجود على هذه البطاقة مرتبط برقم المنخرط المعتمد. يمكن لأي جهة معنية مسحه بكاميرا الهاتف للتحقق الفوري من صحة تسجيل الطالب في دار الإحسان دون كشف أي بيانات شخصية حساسة.
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
