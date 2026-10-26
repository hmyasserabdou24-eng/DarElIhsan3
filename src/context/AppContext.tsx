import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  ActiveUser,
  Student,
  Branch,
  Section,
  Educator,
  Announcement,
  Appointment,
  AuditEntry,
  EvaluationItem,
  ProgressReport
} from '../types';
import {
  BRANCHES,
  SECTIONS,
  INITIAL_STUDENTS,
  EDUCATORS,
  CURRICULUM_DOMAINS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';
import { I18N } from '../data/i18n';

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (typeof I18N)['ar'];
  currentView: 'public' | 'parent' | 'manage' | 'verify';
  setCurrentView: (view: 'public' | 'parent' | 'manage' | 'verify') => void;
  currentUser: ActiveUser | null;
  setCurrentUser: (u: ActiveUser | null) => void;
  branches: Branch[];
  sections: Section[];
  students: Student[];
  educators: Educator[];
  announcements: Announcement[];
  appointments: Appointment[];
  auditLogs: AuditEntry[];
  evaluations: EvaluationItem[];
  progressReports: ProgressReport[];
  activeBranchSlug: 'main' | 'work' | 'farm';
  setActiveBranchSlug: (slug: 'main' | 'work' | 'farm') => void;
  activeChild: Student | null;
  setActiveChild: (s: Student | null) => void;
  verifyCode: string;
  setVerifyCode: (code: string) => void;
  toast: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  addStudent: (s: Omit<Student, 'id' | 'public_uuid' | 'registration_code'>) => Student;
  updateStudent: (id: string, s: Partial<Student>) => void;
  addAppointment: (apt: Omit<Appointment, 'id'>) => void;
  addAnnouncement: (ann: Omit<Announcement, 'id'>) => void;
  addEvaluation: (evalItem: Omit<EvaluationItem, 'id' | 'date'>) => void;
  loginAsParent: (student: Student) => void;
  loginAsStaff: (role: 'admin' | 'director' | 'educator', name: string, branch?: 'main' | 'work' | 'farm') => void;
  logout: () => void;
  logAudit: (action: string, target: string, status?: 'success' | 'warning' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('ar');
  const [currentView, setCurrentView] = useState<'public' | 'parent' | 'manage' | 'verify'>('public');
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);
  const [activeBranchSlug, setActiveBranchSlug] = useState<'main' | 'work' | 'farm'>('main');

  // Core entities
  const [branches] = useState<Branch[]>(BRANCHES);
  const [sections] = useState<Section[]>(SECTIONS);
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('de_students_cache');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_STUDENTS;
  });

  const [educators] = useState<Educator[]>(EDUCATORS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [activeChild, setActiveChild] = useState<Student | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync students to localStorage
  useEffect(() => {
    localStorage.setItem('de_students_cache', JSON.stringify(students));
  }, [students]);

  // Handle URL hashes and routes (e.g., #parent, #manage, #verify?code=187)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash.startsWith('parent')) {
        setCurrentView('parent');
      } else if (hash.startsWith('manage')) {
        setCurrentView('manage');
      } else if (hash.startsWith('verify')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || window.location.search);
        const code = urlParams.get('code') || '';
        setVerifyCode(code);
        setCurrentView('verify');
      } else {
        // default or anchor navigation
        if (currentView === 'verify' && !hash) {
          setCurrentView('public');
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentView]);

  // Set default active child for parent when students load
  useEffect(() => {
    if (!activeChild && students.length > 0) {
      // Default to child-187 (زكرياء خروبي - توحد 01)
      const defaultStudent = students.find(s => s.membership_no === '187') || students[0];
      setActiveChild(defaultStudent);
    }
  }, [students, activeChild]);

  // Initialize sample evaluations for default student
  useEffect(() => {
    if (evaluations.length === 0 && students.length > 0) {
      const child = students.find(s => s.membership_no === '187') || students[0];
      const initialEvals: EvaluationItem[] = [
        { id: 'ev-1', child_id: child.id, domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skill: 'غسل اليدين بالماء والصابون بشكل صحيح', status: 'acquired', date: '2026-10-18', notes: 'أتقن الخطوات بنجاح', educator_name: 'أ. مريم بن يحي' },
        { id: 'ev-2', child_id: child.id, domain: 'مجال الاستقلالية (الحياة اليومية والعناية بالذات)', skill: 'خلع ولبس المئزر والسروال بشكل صحيح', status: 'in_progress', date: '2026-10-19', notes: 'يحتاج مساعدة في فك الأزرار العلوية', educator_name: 'أ. مريم بن يحي' },
        { id: 'ev-3', child_id: child.id, domain: 'مجال المهارات الحركية الدقيقة', skill: 'مسك القلم بالقبضة الثلاثية الصحيحة', status: 'acquired', date: '2026-10-21', notes: 'تحسن كبير في التحكم بالأنامل', educator_name: 'أ. مريم بن يحي' },
        { id: 'ev-4', child_id: child.id, domain: 'مجال التواصل واللغة', skill: 'الاستجابة الفورية عند النداء باسمه', status: 'acquired', date: '2026-10-22', notes: 'تواصل بصري ممتاز لمدة 5 ثوانٍ', educator_name: 'أ. فاطمة الزهراء باحمد' },
        { id: 'ev-5', child_id: child.id, domain: 'مجال التواصل واللغة', skill: 'تركيب جملة مفيدة من 3 كلمات للتعبير عن موقف', status: 'in_progress', date: '2026-10-23', notes: 'يستخدم بطاقات PECS للتعبير عن العطش والجوع', educator_name: 'أ. فاطمة الزهراء باحمد' },
        { id: 'ev-6', child_id: child.id, domain: 'مجال ما قبل الأكاديمي', skill: 'مطابقة الصور والأشياء المتماثلة', status: 'acquired', date: '2026-10-24', notes: 'مطابقة 10 بطاقات بنجاح تام', educator_name: 'أ. مريم بن يحي' },
        { id: 'ev-7', child_id: child.id, domain: 'المجال الاجتماعي والتكيف النفسي', skill: 'المشاركة الإيجابية في ألعاب المجموعات الصغيرة', status: 'in_progress', date: '2026-10-25', notes: 'يشارك مع زملائه في حلقة الأناشيد', educator_name: 'أ. عبد الوهاب قندوزي' }
      ];
      setEvaluations(initialEvals);
    }
  }, [students, evaluations.length]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const logAudit = (action: string, target: string, status: 'success' | 'warning' | 'info' = 'info') => {
    const newEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour12: false }),
      actor: currentUser?.name || 'مستخدم النظام',
      actor_email: currentUser?.email || 'system@darelihsan.dz',
      action,
      target,
      status
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const addStudent = (newS: Omit<Student, 'id' | 'public_uuid' | 'registration_code'>): Student => {
    const id = `child-${newS.membership_no || Date.now()}`;
    const student: Student = {
      ...newS,
      id,
      public_uuid: `00000000-0000-4000-8000-${String(newS.membership_no || '999').padStart(12, '0')}`,
      registration_code: `DI-${Math.floor(100000 + Math.random() * 900000)}`
    };
    setStudents(prev => [student, ...prev]);
    logAudit('إضافة تلميذ جديد', `${student.full_name} (رقم: ${student.membership_no})`, 'success');
    showToast(`تم تسجيل التلميذ(ة) ${student.full_name} بنجاح`, 'success');
    return student;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          logAudit('تعديل بيانات التلميذ', `${updated.full_name} (رقم: ${updated.membership_no})`, 'info');
          return updated;
        }
        return s;
      })
    );
    showToast('تم حفظ التعديلات بنجاح', 'success');
  };

  const addAppointment = (apt: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...apt,
      id: `apt-${Date.now()}`
    };
    setAppointments(prev => [newApt, ...prev]);
    logAudit('جدولة موعد جديد', `${newApt.title} - ${newApt.specialist}`, 'success');
    showToast('تمت جدولة الموعد بنجاح', 'success');
  };

  const addAnnouncement = (ann: Omit<Announcement, 'id'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    logAudit('نشر إعلان جديد', newAnn.title, 'success');
    showToast('تم نشر الإعلان بنجاح في البوابة', 'success');
  };

  const addEvaluation = (evalItem: Omit<EvaluationItem, 'id' | 'date'>) => {
    const newEv: EvaluationItem = {
      ...evalItem,
      id: `ev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setEvaluations(prev => [newEv, ...prev]);
    logAudit('تسجيل تقييم مهارة', `${newEv.domain}: ${newEv.skill}`, 'success');
    showToast('تم حفظ التقييم بنجاح', 'success');
  };

  const loginAsParent = (student: Student) => {
    setActiveChild(student);
    setCurrentUser({
      id: `parent-${student.id}`,
      name: student.guardian_name || `ولي أمر ${student.full_name}`,
      email: `parent.${student.membership_no}@darelihsan.dz`,
      role: 'parent',
      roleLabel: 'ولي أمر تلميذ',
      child_id: student.id,
      branch_slug: student.center
    });
    logAudit('تسجيل دخول ولي أمر', `التلميذ: ${student.full_name} (${student.membership_no})`, 'info');
    showToast(`مرحبًا بك في فضاء الأولياء!`, 'success');
    setCurrentView('parent');
  };

  const loginAsStaff = (role: 'admin' | 'director' | 'educator', name: string, branchSlug: 'main' | 'work' | 'farm' = 'main') => {
    const roleLabels = {
      admin: 'المدير العام',
      director: 'مدير ملحقة',
      educator: 'مربية متخصصة / أخصائي'
    };
    setCurrentUser({
      id: `staff-${Date.now()}`,
      name,
      email: `${role}@darelihsan.dz`,
      role,
      roleLabel: roleLabels[role],
      branch_slug: branchSlug
    });
    setActiveBranchSlug(branchSlug);
    logAudit('تسجيل دخول إداري', `${name} (${roleLabels[role]})`, 'info');
    showToast(`مرحبًا بك ${name} في لوحة إدارة المراكز`, 'success');
    setCurrentView('manage');
  };

  const logout = () => {
    if (currentUser) {
      logAudit('تسجيل خروج', currentUser.name, 'info');
    }
    setCurrentUser(null);
    showToast('تم تسجيل الخروج بنجاح', 'info');
  };

  // Pre-calculated progress report for active child
  const childEvaluations = evaluations.filter(e => e.child_id === activeChild?.id);
  const totalEvaluated = childEvaluations.length;
  const totalAcquired = childEvaluations.filter(e => e.status === 'acquired').length;
  const overallPercentage = totalEvaluated > 0 ? Math.round((totalAcquired / totalEvaluated) * 100) : 75;

  const progressReports: ProgressReport[] = activeChild ? [
    {
      id: `rep-${activeChild.id}`,
      child_id: activeChild.id,
      child_name: activeChild.full_name,
      term: 'الفصل الأول',
      academic_year: '2026-2027',
      date: '2026-10-25',
      overallScore: overallPercentage,
      generalNotes: 'يُظهر التلميذ استجابة ممتازة وتفاعلًا إيجابيًا مع المربية وزملائه. تقدم ملحوظ في مهارات الاستقلالية والتواصل البديل.',
      educatorName: 'أ. مريم بن يحي (مربية رئيسية)',
      domainScores: Object.keys(CURRICULUM_DOMAINS).map(dom => {
        const domEvals = childEvaluations.filter(e => e.domain === dom);
        const acq = domEvals.filter(e => e.status === 'acquired').length;
        const total = domEvals.length || 1;
        return {
          domain: dom,
          percentage: domEvals.length > 0 ? Math.round((acq / total) * 100) : 70 + Math.floor((dom.length * 7) % 25),
          acquiredCount: acq || 3,
          totalCount: total > 0 ? total : 5
        };
      })
    }
  ] : [];

  const t = I18N[lang];

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        currentView,
        setCurrentView,
        currentUser,
        setCurrentUser,
        branches,
        sections,
        students,
        educators,
        announcements,
        appointments,
        auditLogs,
        evaluations,
        progressReports,
        activeBranchSlug,
        setActiveBranchSlug,
        activeChild,
        setActiveChild,
        verifyCode,
        setVerifyCode,
        toast,
        showToast,
        addStudent,
        updateStudent,
        addAppointment,
        addAnnouncement,
        addEvaluation,
        loginAsParent,
        loginAsStaff,
        logout,
        logAudit
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
