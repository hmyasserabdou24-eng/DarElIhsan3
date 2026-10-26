import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Plus, Clock, MapPin, User, CheckCircle, X } from 'lucide-react';

export const ManageAppointments: React.FC = () => {
  const { appointments, students, addAppointment } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [childId, setChildId] = useState('');
  const [type, setType] = useState<'consultation' | 'speech_therapy' | 'psychology' | 'meeting' | 'workshop'>('speech_therapy');
  const [date, setDate] = useState('2026-10-30');
  const [time, setTime] = useState('10:00');
  const [specialist, setSpecialist] = useState('أ. فاطمة الزهراء باحمد');
  const [location, setLocation] = useState('قاعة الأرطفونيا - المركز الرئيسي');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const child = students.find(s => s.id === childId);

    addAppointment({
      child_id: childId || undefined,
      child_name: child?.full_name || undefined,
      title: title.trim(),
      type,
      date,
      time,
      specialist,
      location,
      status: 'upcoming',
      notes: notes.trim() || undefined
    });

    setIsAddOpen(false);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
            المواعيد وجداول الجلسات المتخصصة
          </h2>
          <p className="text-xs text-slate-500 font-['Tajawal'] mt-0.5">
            برمجة جلسات الأرطفونيا، الفحوصات النفسية، واللقاءات التنسيقية مع الأولياء
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0C2D55] hover:bg-[#153e70] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ برمجة موعد جديد</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map(apt => (
          <div
            key={apt.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-[#0C2D55] text-white text-[11px] font-bold font-mono">
                  {apt.date} الساعة {apt.time}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800">
                  {apt.status === 'upcoming' ? 'مؤكد' : 'مكتمل'}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 font-['Cairo']">
                {apt.title}
              </h3>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>التلميذ: <strong>{apt.child_name || 'عام لجميع التلاميذ'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>المؤطر: <strong>{apt.specialist}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{apt.location}</span>
                </div>
              </div>

              {apt.notes && (
                <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                  {apt.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#0C2D55] font-['Cairo']">
                برمجة موعد أو جلسة جديدة
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-['Tajawal']">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان الجلسة / الموعد</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: جلسة تقويم نطق فردية"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التلميذ المعني</label>
                <select
                  value={childId}
                  onChange={e => setChildId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200"
                >
                  <option value="">عام (بدون تخصيص تلميذ)</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.membership_no} – {s.section})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الوقت</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الأخصائي أو المؤطر</label>
                <input
                  type="text"
                  value={specialist}
                  onChange={e => setSpecialist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المكان والقاعة</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0C2D55] text-white font-bold"
                >
                  تأكيد الجدولة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
