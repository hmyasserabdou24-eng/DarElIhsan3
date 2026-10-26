import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import {
  Search,
  Filter,
  Plus,
  CreditCard,
  Edit,
  Download,
  Printer,
  X,
  Check,
  QrCode,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { renderStudentCardToCanvas, downloadStudentCard } from '../../lib/cardRenderer';

export const ManageStudents: React.FC = () => {
  const { students, branches, sections, addStudent, updateStudent, activeBranchSlug, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>(activeBranchSlug);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Modals
  const [activeCardStudent, setActiveCardStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Canvas ref for modal
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // New Student form state
  const [newFullName, setNewFullName] = useState('');
  const [newMembershipNo, setNewMembershipNo] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDisability, setNewDisability] = useState('اضطراب طيف التوحد TSA');
  const [newBranch, setNewBranch] = useState<'main' | 'work' | 'farm'>('main');
  const [newSectionSlug, setNewSectionSlug] = useState('sec_autism_1');

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.membership_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      s.disability.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = selectedBranch === 'all' || s.center === selectedBranch;
    const matchesSection = selectedSection === 'all' || s.section_id === selectedSection;

    return matchesSearch && matchesBranch && matchesSection;
  });

  // Render canvas when activeCardStudent changes
  useEffect(() => {
    if (activeCardStudent && modalCanvasRef.current) {
      renderStudentCardToCanvas(modalCanvasRef.current, activeCardStudent);
    }
  }, [activeCardStudent]);

  const handlePrintModal = () => {
    if (!modalCanvasRef.current || !activeCardStudent) return;
    const dataUrl = modalCanvasRef.current.toDataURL('image/jpeg', 0.95);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>طباعة بطاقة التلميذ – ${activeCardStudent.full_name}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; background: #fff; }
            img { max-width: 90vw; height: auto; }
            @media print { body { background: transparent; } img { max-width: 100%; } }
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

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newMembershipNo.trim()) {
      showToast('يرجى ملء الاسم الكامل ورقم المنخرط.', 'error');
      return;
    }

    const sec = sections.find(s => s.slug === newSectionSlug) || sections[0];
    const br = branches.find(b => b.slug === newBranch) || branches[0];

    addStudent({
      membership_no: newMembershipNo.trim(),
      full_name: newFullName.trim(),
      dob: newDob || '2015-01-01',
      phone: newPhone || '066000000',
      disability: newDisability,
      center: newBranch,
      branch_id: br.id,
      section_id: sec.id,
      section: sec.name,
      academic_year: '2026-2027',
      active: true,
      notes: 'تم التسجيل حديثًا في المركز.'
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewFullName('');
    setNewMembershipNo('');
    setNewDob('');
    setNewPhone('');
  };

  const handleExportCSV = () => {
    const headers = ['رقم المنخرط', 'اسم التلميذ', 'تاريخ الميلاد', 'الهاتف', 'الإعاقة', 'المركز', 'القسم', 'رمز التسجيل'];
    const rows = filteredStudents.map(s => [
      `"${s.membership_no}"`,
      `"${s.full_name}"`,
      `"${s.dob}"`,
      `"${s.phone}"`,
      `"${s.disability}"`,
      `"${s.center}"`,
      `"${s.section}"`,
      `"${s.registration_code}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قائمة_طلبة_دار_الإحسان_${Date.now()}.csv`;
    link.click();
    showToast('تم تصدير قائمة الطلبة بنجاح (CSV متوافق مع Excel)', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0C2D55] font-['Cairo']">
            قائمة الأطفال والطلبة المسجلين ({students.length} طالب)
          </h2>
          <p className="text-xs text-slate-500 font-['Tajawal'] mt-0.5">
            القائمة الاسمية الرسمية المعتمدة للمركز النفسي البيداغوجي دار الإحسان وملحقاته
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0C2D55] hover:bg-[#153e70] text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ تسجيل طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، رقم المنخرط، رقم الهاتف، أو نوع الإعاقة..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C2D55] text-xs sm:text-sm text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        {/* Branch Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
          >
            <option value="all">كل المراكز والملحقات</option>
            <option value="main">المركز الرئيسي (العطف)</option>
            <option value="work">مركز المساعدة على العمل (التمهين)</option>
            <option value="farm">المزرعة البيداغوجية</option>
          </select>
        </div>

        {/* Section Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
          >
            <option value="all">كل الأقسام والأفواج</option>
            {sections.map(sec => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 font-['Cairo']">
              <tr>
                <th className="py-3.5 px-4">رقم القيد</th>
                <th className="py-3.5 px-4">اسم ولقب التلميذ(ة)</th>
                <th className="py-3.5 px-4">تاريخ الميلاد</th>
                <th className="py-3.5 px-4">نوع الإعاقة / التشخيص</th>
                <th className="py-3.5 px-4">المركز والفوج</th>
                <th className="py-3.5 px-4">الهاتف</th>
                <th className="py-3.5 px-4">رمز التسجيل</th>
                <th className="py-3.5 px-4 text-center">بطاقة التلميذ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-['Cairo']">
                    لم يتم العثور على أي طالب يطابق معايير البحث.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0C2D55]">
                      {student.membership_no}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {student.full_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600" dir="ltr">
                      {student.dob}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 font-semibold text-[11px]">
                        {student.disability}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{student.section}</span>
                      <span className="text-[10px] text-slate-400">
                        {student.center === 'main' ? 'الرئيسي' : student.center === 'work' ? 'التأهيل المهني' : 'المزرعة'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600" dir="ltr">
                      {student.phone}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {student.registration_code}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setActiveCardStudent(student)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0C2D55] text-white hover:bg-[#163e72] transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-300" />
                        <span>البطاقة الرسمية</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-['Cairo']">
          <span>يظهر {filteredStudents.length} من أصل {students.length} طالب</span>
          <span>المؤسسة: المركز النفسي البيداغوجي دار الإحسان (العطف)</span>
        </div>
      </div>

      {/* STUDENT CARD & QR MODAL */}
      {activeCardStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-fadeIn my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-[#0C2D55] font-['Cairo']">
                  بطاقة انخراط ورعاية التلميذ الرقمية
                </h3>
                <p className="text-xs text-slate-500 font-['Tajawal']">
                  معتمدة بدقة 300 DPI ومزودة برمز QR للتحقق السريع
                </p>
              </div>
              <button
                onClick={() => setActiveCardStudent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Rendering */}
            <div className="flex justify-center p-3 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
              <canvas
                ref={modalCanvasRef}
                className="max-w-full h-auto rounded-xl shadow-md border border-slate-300"
                style={{ width: '540px', aspectRatio: '85.6 / 54' }}
              />
            </div>

            {/* Quick Details Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block">رقم المنخرط:</span>
                <span className="font-mono font-bold text-[#0C2D55]">{activeCardStudent.membership_no}</span>
              </div>
              <div>
                <span className="text-slate-400 block">تاريخ الميلاد:</span>
                <span className="font-mono font-bold text-slate-800" dir="ltr">{activeCardStudent.dob}</span>
              </div>
              <div>
                <span className="text-slate-400 block">رمز التسجيل للولي:</span>
                <span className="font-mono font-bold text-emerald-700">{activeCardStudent.registration_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block">القسم المعتمد:</span>
                <span className="font-bold text-slate-800">{activeCardStudent.section}</span>
              </div>
            </div>

            {/* Actions: Download JPG, Print, Close */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={() => downloadStudentCard(activeCardStudent)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C2D55] hover:bg-[#153e70] text-white text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>تحميل البطاقة (JPG)</span>
              </button>

              <button
                onClick={handlePrintModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة البطاقة</span>
              </button>

              <button
                onClick={() => setActiveCardStudent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 animate-fadeIn my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#0C2D55] font-['Cairo']">
                تسجيل تلميذ جديد في دار الإحسان
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs font-['Tajawal']">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم ولقب التلميذ</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="مثال: قندوزي أسامة بن عبد الوهاب"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0C2D55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم المنخرط الرسمي</label>
                  <input
                    type="text"
                    required
                    value={newMembershipNo}
                    onChange={e => setNewMembershipNo(e.target.value)}
                    placeholder="مثال: 325"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={e => setNewDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم هاتف الولي</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="0661000000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طبيعة الإعاقة / التشخيص</label>
                  <select
                    value={newDisability}
                    onChange={e => setNewDisability(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="اضطراب طيف التوحد TSA">اضطراب طيف التوحد TSA</option>
                    <option value="متلازمة داون T.21">متلازمة داون T.21</option>
                    <option value="التأخر الذهني R.M">التأخر الذهني R.M</option>
                    <option value="متعدد الاعاقات">متعدد الاعاقات</option>
                    <option value="التأخر الدراسي">التأخر الدراسي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المركز والملحقة</label>
                  <select
                    value={newBranch}
                    onChange={e => setNewBranch(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="main">المركز الرئيسي (العطف)</option>
                    <option value="work">مركز المساعدة على العمل</option>
                    <option value="farm">المزرعة البيداغوجية</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم والفوج التربوي</label>
                  <select
                    value={newSectionSlug}
                    onChange={e => setNewSectionSlug(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 font-medium"
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0C2D55] hover:bg-[#143e72] text-white font-bold font-['Cairo'] shadow-sm"
                >
                  تأكيد وإضافة الطالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
