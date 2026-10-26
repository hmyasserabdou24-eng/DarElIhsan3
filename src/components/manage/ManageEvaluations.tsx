import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CURRICULUM_DOMAINS } from '../../data/initialData';
import { SkillStatus } from '../../types';
import { FileCheck, CheckCircle2, Clock, XCircle, User, Plus, Search } from 'lucide-react';

export const ManageEvaluations: React.FC = () => {
  const { students, evaluations, addEvaluation, currentUser } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedDomain, setSelectedDomain] = useState<string>(Object.keys(CURRICULUM_DOMAINS)[0]);
  const [selectedSkill, setSelectedSkill] = useState<string>(CURRICULUM_DOMAINS[Object.keys(CURRICULUM_DOMAINS)[0]][0]);
  const [status, setStatus] = useState<SkillStatus>('acquired');
  const [notes, setNotes] = useState('');
  const [filterStudent, setFilterStudent] = useState<string>('all');

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDom = e.target.value;
    setSelectedDomain(newDom);
    setSelectedSkill(CURRICULUM_DOMAINS[newDom][0] || '');
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedSkill) return;

    addEvaluation({
      child_id: selectedStudentId,
      domain: selectedDomain,
      skill: selectedSkill,
      status,
      notes: notes.trim() || undefined,
      educator_name: currentUser?.name || 'مربية متخصصة'
    });

    setNotes('');
  };

  const displayedEvaluations = evaluations.filter(
    ev => filterStudent === 'all' || ev.child_id === filterStudent
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
          التقارير وسجل تقييم المهارات البيداغوجية
        </h2>
        <p className="text-xs text-slate-500 font-['Tajawal'] mt-0.5">
          تسجيل المتابعة الفردية الدقيقة لمهارات الأطفال وتتبع مؤشرات التطور
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 1 Col: Record New Evaluation Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo'] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-[#B4873A]" />
            <span>تسجيل تقييم مهارة جديدة</span>
          </h3>

          <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs font-['Tajawal']">
            {/* Student Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">اختر التلميذ</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.membership_no} – {s.section})
                  </option>
                ))}
              </select>
            </div>

            {/* Domain Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">المجال النمائي</label>
              <select
                value={selectedDomain}
                onChange={handleDomainChange}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
              >
                {Object.keys(CURRICULUM_DOMAINS).map((dom, i) => (
                  <option key={i} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">المهارة المستهدفة</label>
              <select
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
              >
                {(CURRICULUM_DOMAINS[selectedDomain] || []).map((sk, i) => (
                  <option key={i} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Rating Radio Buttons */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">درجة الاكتساب</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('acquired')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${status === 'acquired' ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  ✓ مكتسبة
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('in_progress')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${status === 'in_progress' ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  ⏳ في طور الاكتساب
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('not_acquired')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${status === 'not_acquired' ? 'bg-red-500 text-white border-red-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  ✕ غير مكتسبة
                </button>
              </div>
            </div>

            {/* Educator notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">ملاحظات المربية / الأخصائي</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات سريرية أو وسائل مساعدة مستخدمة..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C2D55] text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0C2D55] hover:bg-[#163f73] text-white font-bold font-['Cairo'] text-xs shadow-md transition-all"
            >
              حفظ التقييم وتحديث ملف الطالب
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Evaluations History Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-[#0C2D55] font-['Cairo']">
              سجل التقييمات المحفوظة ({displayedEvaluations.length})
            </h3>

            <div className="w-full sm:w-64">
              <select
                value={filterStudent}
                onChange={e => setFilterStudent(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
              >
                <option value="all">كل الطلبة المقيّمين</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.membership_no})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto pr-1">
            {displayedEvaluations.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400 font-['Cairo']">
                لا توجد تقييمات مسجلة لهذا التلميذ حتى الآن.
              </p>
            ) : (
              displayedEvaluations.map(ev => {
                const child = students.find(s => s.id === ev.child_id);

                return (
                  <div key={ev.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0C2D55]">{child?.full_name || 'تلميذ'}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {child?.membership_no}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{ev.date}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{ev.skill}</p>
                      <p className="text-[11px] text-slate-500">{ev.domain}</p>
                      {ev.notes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 italic">
                          "{ev.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {ev.status === 'acquired' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مكتسبة</span>
                        </span>
                      ) : ev.status === 'in_progress' ? (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>في طور الاكتساب</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>غير مكتسبة</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
