import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicPage } from './components/public/PublicPage';
import { ParentLogin } from './components/parent/ParentLogin';
import { ParentPortal } from './components/parent/ParentPortal';
import { ManageLogin } from './components/manage/ManageLogin';
import { ManageShell } from './components/manage/ManageShell';
import { QrVerification } from './components/qr/QrVerification';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainView: React.FC = () => {
  const { currentView, currentUser, toast } = useApp();

  return (
    <div className="relative min-h-screen text-slate-800" dir="rtl">
      {/* Dynamic View Switcher */}
      {currentView === 'public' && <PublicPage />}

      {currentView === 'parent' && (
        currentUser && currentUser.role === 'parent' ? <ParentPortal /> : <ParentLogin />
      )}

      {currentView === 'manage' && (
        currentUser && currentUser.role !== 'parent' ? <ManageShell /> : <ManageLogin />
      )}

      {currentView === 'verify' && <QrVerification />}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
          <div className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : toast.type === 'info' ? 'bg-[#0C2D55] text-white border-blue-800' : 'bg-emerald-900 text-white border-emerald-700'}`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-amber-300 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold font-['Cairo'] flex-1">
              {toast.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainView />
    </AppProvider>
  );
}

export default App;
