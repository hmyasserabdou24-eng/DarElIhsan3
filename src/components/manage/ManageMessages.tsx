import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const ManageMessages: React.FC = () => {
  const { announcements, addAnnouncement, currentUser } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<'all' | 'main' | 'work' | 'farm'>('all');
  const [urgent, setUrgent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addAnnouncement({
      title: title.trim(),
      content: content.trim(),
      date: new Date().toISOString().split('T')[0],
      author: currentUser?.name || 'إدارة المركز',
      author_role: currentUser?.roleLabel || 'الإدارة العامة',
      target,
      urgent
    });

    setTitle('');
    setContent('');
    setUrgent(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
          الرسائل والإعلانات الموجهة للأولياء
        </h2>
        <p className="text-xs text-slate-500 font-['Tajawal'] mt-0.5">
          نشر التعميمات، التنبيهات الإدارية، وبرامج النشاطات والخرجات الميدانية
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo'] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Send className="w-5 h-5 text-[#B4873A]" />
            <span>نشر إعلان جديد</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-['Tajawal']">
            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان الإعلان</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: موعد الفحص الأرطفوني الدوري"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الجمهور المستهدف</label>
              <select
                value={target}
                onChange={e => setTarget(e.target.value as any)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 font-medium"
              >
                <option value="all">كل الأولياء والمراكز</option>
                <option value="main">المركز الرئيسي (العطف)</option>
                <option value="work">مركز المساعدة على العمل (التمهين)</option>
                <option value="farm">المزرعة البيداغوجية والزراعة المائية</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نص الإعلان والتفاصيل</label>
              <textarea
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                placeholder="أدخل نص الرسالة الكاملة..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="urgent"
                checked={urgent}
                onChange={e => setUrgent(e.target.checked)}
                className="w-4 h-4 rounded text-[#0C2D55]"
              />
              <label htmlFor="urgent" className="text-xs font-semibold text-slate-700 cursor-pointer">
                وسم الإعلان كتنبيه عاجل وهام
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0C2D55] hover:bg-[#163f73] text-white font-bold text-xs shadow-md transition-all"
            >
              نشر وإرسال لفضاء الأولياء
            </button>
          </form>
        </div>

        {/* Announcements list */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo'] border-b border-slate-100 pb-3">
            الإعلانات المنشورة حاليًا في النظام ({announcements.length})
          </h3>

          <div className="space-y-3.5">
            {announcements.map(ann => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0C2D55] text-sm font-['Cairo']">
                      {ann.title}
                    </span>
                    {ann.urgent && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                        عاجل
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">{ann.date}</span>
                </div>

                <p className="text-slate-700 leading-relaxed font-['Tajawal'] text-justify">
                  {ann.content}
                </p>

                <div className="pt-2 flex items-center justify-between text-slate-500 border-t border-slate-200/60 text-[11px]">
                  <span>الناشر: <strong className="text-slate-800">{ann.author}</strong> ({ann.author_role})</span>
                  <span>المستهدف: {ann.target === 'all' ? 'جميع الأولياء' : ann.target === 'farm' ? 'المزرعة البيداغوجية' : 'المركز'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
