import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Bell,
  FileCheck,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ManageHub } from './ManageHub';
import { ManageDashboard } from './ManageDashboard';
import { ManageStudents } from './ManageStudents';
import { ManageEducators } from './ManageEducators';
import { ManageCurriculum } from './ManageCurriculum';
import { ManageEvaluations } from './ManageEvaluations';
import { ManageAppointments } from './ManageAppointments';
import { ManageMessages } from './ManageMessages';
import { ManageAudit } from './ManageAudit';
import { ManageSettings } from './ManageSettings';

export const ManageShell: React.FC = () => {
  const {
    currentUser,
    logout,
    setCurrentView,
    activeBranchSlug,
    setActiveBranchSlug,
    branches
  } = useApp();

  const [activeSec, setActiveSec] = useState<string>('hub');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeBranch = branches.find(b => b.slug === activeBranchSlug) || branches[0];

  const navItems = [
    { group: 'نظرة عامة', items: [
      { id: 'hub', label: 'المركز وملحقاته', icon: Building2 },
      { id: 'dash', label: 'لوحة التحكم', icon: LayoutDashboard },
      { id: 'reports', label: 'التقارير والتقييم', icon: FileCheck },
      { id: 'audit', label: 'سجل العمليات', icon: ShieldCheck },
      { id: 'msgs', label: 'الرسائل والإعلانات', icon: Bell }
    ]},
    { group: 'الشؤون البيداغوجية', items: [
      { id: 'children', label: 'الأطفال والطلبة (103)', icon: Users },
      { id: 'educators', label: 'المربيات والمؤطرين', icon: GraduationCap },
      { id: 'programs', label: 'البرامج التربوية', icon: BookOpen },
      { id: 'appts', label: 'المواعيد والأنشطة', icon: Calendar }
    ]},
    { group: 'الإدارة والأمان', items: [
      { id: 'settings', label: 'الأمان والإعدادات', icon: Settings }
    ]}
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex font-['Tajawal'] text-slate-800">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0C2D55] text-white flex-shrink-0 border-l border-[#1b3d6a] shadow-xl">
        {/* Brand */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <img
            src="/logo-sq.png"
            alt="Logo"
            className="w-10 h-10 rounded-xl bg-white p-1"
          />
          <div>
            <h1 className="font-bold text-base font-['Cairo'] text-white">
              دار الإحسان
            </h1>
            <span className="text-xs text-amber-300 font-['Tajawal']">
              بوابة إدارة المراكز والملحقات
            </span>
          </div>
        </div>

        {/* Current Active Facility Pill */}
        <div className="p-4 border-b border-white/10">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/15">
            <div className="flex items-center justify-between text-xs text-amber-300 mb-1 font-bold">
              <span>المنشأة النشطة:</span>
              <button
                onClick={() => setActiveSec('hub')}
                className="text-white hover:underline text-[10px]"
              >
                تبديل ↺
              </button>
            </div>
            <p className="text-xs font-bold text-white font-['Cairo'] line-clamp-1">
              {activeBranch.name}
            </p>
            <p className="text-[10px] text-slate-300 font-['Tajawal'] mt-0.5">
              {currentUser?.name} ({currentUser?.roleLabel})
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2 font-['Cairo']">
                {group.group}
              </span>
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeSec === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSec(item.id)}
                    className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${isActive ? 'bg-[#B4873A] text-white shadow-sm font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-red-500/80 text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الإدارة</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0C2D55] font-['Cairo']">
                {activeSec === 'hub' && 'المركز وملحقاته'}
                {activeSec === 'dash' && 'لوحة التحكم والمتابعة'}
                {activeSec === 'children' && 'الأطفال والطلبة المسجلين'}
                {activeSec === 'educators' && 'الكادر التربوي والمربيات'}
                {activeSec === 'programs' && 'دليل المناهج والمهارات'}
                {activeSec === 'reports' && 'التقارير وسجل التقييمات'}
                {activeSec === 'appts' && 'المواعيد والجلسات المقررة'}
                {activeSec === 'msgs' && 'الرسائل والإعلانات'}
                {activeSec === 'audit' && 'سجل العمليات والتدقيق'}
                {activeSec === 'settings' && 'الأمان والإعدادات'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Center Switch Dropdown */}
            <div className="hidden sm:block">
              <select
                value={activeBranchSlug}
                onChange={e => setActiveBranchSlug(e.target.value as any)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#0C2D55] focus:outline-none focus:ring-2 focus:ring-[#0C2D55] cursor-pointer"
              >
                <option value="main">المركز الرئيسي (العطف)</option>
                <option value="work">مركز المساعدة على العمل (التمهين)</option>
                <option value="farm">المزرعة البيداغوجية والزراعة المائية</option>
              </select>
            </div>

            {/* Visit Public Site */}
            <button
              onClick={() => setCurrentView('public')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0C2D55] bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <span>الموقع العام</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {activeSec === 'hub' && <ManageHub onNavigateToSection={sec => setActiveSec(sec)} />}
          {activeSec === 'dash' && <ManageDashboard onNavigateToSection={sec => setActiveSec(sec)} />}
          {activeSec === 'children' && <ManageStudents />}
          {activeSec === 'educators' && <ManageEducators />}
          {activeSec === 'programs' && <ManageCurriculum />}
          {activeSec === 'reports' && <ManageEvaluations />}
          {activeSec === 'appts' && <ManageAppointments />}
          {activeSec === 'msgs' && <ManageMessages />}
          {activeSec === 'audit' && <ManageAudit />}
          {activeSec === 'settings' && <ManageSettings />}
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden flex">
          <div className="w-72 bg-[#0C2D55] text-white flex flex-col p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-bold text-base font-['Cairo']">دار الإحسان – الإدارة</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-4">
              {navItems.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">
                    {group.group}
                  </span>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveSec(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full py-2 px-3 rounded-xl text-xs font-semibold ${activeSec === item.id ? 'bg-[#B4873A] text-white' : 'text-slate-300 hover:bg-white/10'}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            <button
              onClick={logout}
              className="py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold text-center"
            >
              تسجيل الخروج
            </button>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </div>
  );
};
