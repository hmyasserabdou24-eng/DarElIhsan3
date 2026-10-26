import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Clock, Search, Download, Trash2, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const ManageAudit: React.FC = () => {
  const { auditLogs, showToast, logAudit } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(
    l =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const json = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_تدقيق_دار_الإحسان_${Date.now()}.json`;
    link.click();
    showToast('تم تصدير سجل العمليات بنجاح', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
            سجل العمليات والتدقيق الأمني (Audit Log)
          </h2>
          <p className="text-xs text-slate-500 font-['Tajawal'] mt-0.5">
            توثيق كامل لكافة الإجراءات الإدارية، تسجيلات الدخول، وإصدارات البطاقات والرموز
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>تصدير السجل الكامل</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث في سجل العمليات بالفاعل، الإجراء، أو الهدف..."
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 font-['Cairo']">
              <tr>
                <th className="py-3 px-4">التوقيت</th>
                <th className="py-3 px-4">الفاعل (المستخدم)</th>
                <th className="py-3 px-4">البريد الإلكتروني</th>
                <th className="py-3 px-4">نوع الإجراء</th>
                <th className="py-3 px-4">الهدف / المعني</th>
                <th className="py-3 px-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-[#0C2D55]">
                    {log.actor}
                  </td>
                  <td className="py-3 px-4 text-slate-500" dir="ltr">
                    {log.actor_email}
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700">
                    {log.target}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {log.status === 'success' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ناجح
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        معلومات
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
