'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, UserIcon,
  BookOpenIcon, CalendarIcon, ClockIcon, VideoCameraIcon,
  CheckCircleIcon, AcademicCapIcon, UsersIcon, ClipboardDocumentListIcon,
  ExclamationTriangleIcon, ArrowPathIcon, SparklesIcon,
  MagnifyingGlassIcon, FunnelIcon, LockClosedIcon, BellAlertIcon,
  NoSymbolIcon, CalendarDaysIcon, SunIcon, PlayCircleIcon,
  CheckBadgeIcon, FireIcon, SignalIcon, KeyIcon, GlobeAltIcon,
  BanknotesIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';

/* ============================================================
   TYPES
   ============================================================ */

interface AssignmentPerson { _id: string; name: string; email?: string; }
interface AssignmentTeacher { _id: string; name: string; email?: string; subjects?: string[]; }
interface AssignmentCourse { _id: string; title: string; }

type AssignmentStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
type Currency = 'PKR' | 'USD';
type TimeStatus = 'alarm' | 'ongoing' | 'upcoming' | 'completed' | 'off';

interface Assignment {
  _id: string;
  studentId: AssignmentPerson | null;
  teacherId: AssignmentTeacher | null;
  courseId: AssignmentCourse | null;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
  notes: string;
  feeAmount: number;
  currency: Currency;
  /* ✅ Teacher fee */
  teacherFeeAmount: number;
  teacherCurrency: Currency;
  livekitRoomName: string;
  livekitHostToken?: string;
  livekitHostIdentity: string;
  livekitProvider: string;
  createdAt?: string;
}

interface StudentOption { _id: string; name: string; email?: string; }
interface TeacherOption { _id: string; name: string; email?: string; subjects?: string[]; }
interface CourseOption { _id: string; title: string; }

interface AssignmentFormData {
  studentIds: string[];
  teacherId: string;
  courseId: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: AssignmentStatus;
  notes: string;
  feeAmount: string;
  currency: Currency;
  /* ✅ Teacher fee */
  teacherFeeAmount: string;
  teacherCurrency: Currency;
  livekitRoomName: string;
  livekitHostToken: string;
  livekitHostIdentity: string;
  livekitProvider: string;
}

type FilterKey = 'all' | 'today' | 'alarm' | 'ongoing' | 'upcoming' | 'completed' | 'off';

/* ============================================================
   CONSTANTS
   ============================================================ */

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

const STATUS_META: Record<AssignmentStatus, { label: string; classes: string; dot: string }> = {
  scheduled: { label: 'Scheduled', classes: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
  ongoing: { label: 'Ongoing', classes: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
  completed: { label: 'Completed', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', classes: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500' },
};

const TIME_STATUS_META: Record<TimeStatus, { label: string; classes: string; dot: string; icon: string }> = {
  alarm: { label: 'Starting Soon', classes: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500', icon: '🔔' },
  ongoing: { label: 'Live Now', classes: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', icon: '🟢' },
  upcoming: { label: 'Upcoming', classes: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: '⏰' },
  completed: { label: 'Completed', classes: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', icon: '✓' },
  off: { label: 'Off Today', classes: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-300', icon: '—' },
};

const DEFAULT_FORM: AssignmentFormData = {
  studentIds: [],
  teacherId: '',
  courseId: '',
  daysOfWeek: [],
  startTime: '09:00',
  endTime: '10:00',
  status: 'scheduled',
  notes: '',
  feeAmount: '0',
  currency: 'PKR',
  teacherFeeAmount: '0',
  teacherCurrency: 'PKR',
  livekitRoomName: '',
  livekitHostToken: '',
  livekitHostIdentity: '',
  livekitProvider: 'livekit',
};

/* ============================================================
   HELPERS
   ============================================================ */

async function readJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

function getErrMsg(data: any, fallback: string): string {
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string' && data.error.trim()) return data.error;
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
  }
  return fallback;
}

function formatTime(time: string): string {
  if (!time) return '--:--';
  const [h, m = '00'] = time.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return time;
  const p = hour >= 12 ? 'PM' : 'AM';
  const dh = hour % 12 === 0 ? 12 : hour % 12;
  return `${dh}:${m} ${p}`;
}

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getCurrentDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatMoney(amount: number, currency: Currency = 'PKR'): string {
  const n = Number(amount) || 0;
  return currency === 'USD' ? `$${n.toFixed(2)}` : `₨${n.toLocaleString('en-PK')}`;
}

function getTimeStatus(a: Assignment, now: Date) {
  const today = getCurrentDayName(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const s = timeToMinutes(a.startTime);
  const e = timeToMinutes(a.endTime);
  const isToday = Array.isArray(a.daysOfWeek) && a.daysOfWeek.includes(today);

  if (!isToday) return { status: 'off' as TimeStatus, minutesUntilStart: Infinity, minutesUntilEnd: Infinity, today };
  if (nowMin > e) return { status: 'completed' as TimeStatus, minutesUntilStart: 0, minutesUntilEnd: 0, today };
  if (nowMin >= s && nowMin <= e) return { status: 'ongoing' as TimeStatus, minutesUntilStart: 0, minutesUntilEnd: e - nowMin, today };
  const diff = s - nowMin;
  if (diff <= 30 && diff > 0) return { status: 'alarm' as TimeStatus, minutesUntilStart: diff, minutesUntilEnd: e - nowMin, today };
  return { status: 'upcoming' as TimeStatus, minutesUntilStart: diff, minutesUntilEnd: e - nowMin, today };
}

function formatCountdown(min: number): string {
  if (min <= 0) return 'now';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function AssignmentsClient() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({ ...DEFAULT_FORM });

  const [studentSearch, setStudentSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');

  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  /* ---------- Fetch ---------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ar, sr, tr, cr] = await Promise.all([
        fetch('/api/owner/assignments', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/owner/students', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/owner/teachers', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/owner/courses', { cache: 'no-store', credentials: 'include' }),
      ]);

      if (!ar.ok) {
        const d = await readJson(ar);
        throw new Error(getErrMsg(d, 'Failed to load assignments.'));
      }

      const ad = await readJson(ar);
      setAssignments(Array.isArray(ad) ? ad : []);

      if (sr.ok) { const d = await readJson(sr); setStudents(Array.isArray(d) ? d : []); }
      if (tr.ok) { const d = await readJson(tr); setTeachers(Array.isArray(d) ? d : []); }
      if (cr.ok) { const d = await readJson(cr); setCourses(Array.isArray(d) ? d : []); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  /* ---------- Form actions ---------- */
  const handleDayToggle = (day: string) => {
    setFormData((p) => ({
      ...p,
      daysOfWeek: p.daysOfWeek.includes(day)
        ? p.daysOfWeek.filter((d) => d !== day)
        : [...p.daysOfWeek, day],
    }));
  };

  const toggleStudent = (id: string) => {
    setFormData((p) => ({
      ...p,
      studentIds: p.studentIds.includes(id)
        ? p.studentIds.filter((s) => s !== id)
        : [...p.studentIds, id],
    }));
  };

  const selectAllStudents = () => {
    setFormData((p) => ({ ...p, studentIds: students.map((s) => s._id) }));
  };

  const clearAllStudents = () => {
    setFormData((p) => ({ ...p, studentIds: [] }));
  };

  const openAddModal = (teacherId?: string, studentId?: string) => {
    setEditingAssignment(null);
    setFormData({
      ...DEFAULT_FORM,
      teacherId: teacherId || teachers[0]?._id || '',
      studentIds: studentId ? [studentId] : [],
      courseId: courses[0]?._id || '',
    });
    setStudentSearch('');
    setShowModal(true);
  };

  const openEditModal = (a: Assignment) => {
    setEditingAssignment(a);
    setFormData({
      studentIds: a.studentId?._id ? [a.studentId._id] : [],
      teacherId: a.teacherId?._id || '',
      courseId: a.courseId?._id || '',
      daysOfWeek: Array.isArray(a.daysOfWeek) ? a.daysOfWeek : [],
      startTime: a.startTime || '09:00',
      endTime: a.endTime || '10:00',
      status: a.status || 'scheduled',
      notes: a.notes || '',
      feeAmount: String(a.feeAmount || 0),
      currency: (a.currency as Currency) || 'PKR',
      teacherFeeAmount: String(a.teacherFeeAmount || 0),
      teacherCurrency: (a.teacherCurrency as Currency) || 'PKR',
      livekitRoomName: a.livekitRoomName || '',
      livekitHostToken: a.livekitHostToken || '',
      livekitHostIdentity: a.livekitHostIdentity || '',
      livekitProvider: a.livekitProvider || 'livekit',
    });
    setStudentSearch('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting || creatingRoom) return;
    setShowModal(false);
    setEditingAssignment(null);
    setFormData({ ...DEFAULT_FORM });
    setStudentSearch('');
  };

  const validateForm = (): boolean => {
    if (!formData.teacherId) { toast.error('Please select a teacher.'); return false; }
    if (!editingAssignment && formData.studentIds.length === 0) {
      toast.error('Please select at least one student.'); return false;
    }
    if (editingAssignment && formData.studentIds.length !== 1) {
      toast.error('Please select exactly one student.'); return false;
    }
    if (!formData.courseId) { toast.error('Please select a course.'); return false; }
    if (formData.daysOfWeek.length === 0) { toast.error('Please select at least one day.'); return false; }
    if (!formData.startTime || !formData.endTime) { toast.error('Please select times.'); return false; }
    if (formData.endTime <= formData.startTime) { toast.error('End time must be after start.'); return false; }
    return true;
  };

  /* ---------- LiveKit ---------- */
  const createLiveKitRoom = async () => {
    if (!validateForm()) return;
    const t = teachers.find((x) => x._id === formData.teacherId);
    const s = students.find((x) => x._id === formData.studentIds[0]);
    const c = courses.find((x) => x._id === formData.courseId);
    if (!t || !s || !c) {
      toast.error('Selected data not found.'); return;
    }

    setCreatingRoom(true);
    try {
      const res = await fetch('/api/livekit/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          label: `${c.title} - ${s.name}`,
          teacherId: t._id,
          teacherEmail: t.email || '',
          teacherName: t.name,
          studentId: s._id,
          studentName: s.name,
          courseId: c._id,
          courseTitle: c.title,
          startTime: formData.startTime,
          endTime: formData.endTime,
          daysOfWeek: formData.daysOfWeek,
          timezone: 'Asia/Karachi',
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(getErrMsg(data, 'Failed to create room'));

      const d = (data || {}) as any;
      const roomName = String(d.roomName ?? d.room ?? d.name ?? '').trim();
      if (!roomName) throw new Error('No room name returned.');

      setFormData((p) => ({
        ...p,
        livekitRoomName: roomName,
        livekitHostToken: String(d.hostToken ?? '').trim(),
        livekitHostIdentity: String(d.hostIdentity ?? '').trim(),
        livekitProvider: String(d.provider ?? 'livekit').trim(),
      }));

      toast.success('LiveKit room created.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setCreatingRoom(false);
    }
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    const payload = {
      studentIds: formData.studentIds,
      teacherId: formData.teacherId,
      courseId: formData.courseId,
      daysOfWeek: formData.daysOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status,
      notes: formData.notes.trim(),
      feeAmount: Number(formData.feeAmount) || 0,
      currency: formData.currency,
      teacherFeeAmount: Number(formData.teacherFeeAmount) || 0,
      teacherCurrency: formData.teacherCurrency,
      livekitRoomName: formData.livekitRoomName,
      livekitHostToken: formData.livekitHostToken,
      livekitHostIdentity: formData.livekitHostIdentity,
      livekitProvider: formData.livekitProvider || 'livekit',
    };

    try {
      const isEditing = Boolean(editingAssignment);
      let url = '/api/owner/assignments';
      let method: 'POST' | 'PUT' = 'POST';
      let body: any = payload;

      if (isEditing && editingAssignment) {
        url = `/api/owner/assignments/${editingAssignment._id}`;
        method = 'PUT';
        body = {
          ...payload,
          studentId: formData.studentIds[0],
        };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(body),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(getErrMsg(data, 'Failed to save'));

      if (!isEditing && data?.createdCount !== undefined) {
        const c = Number(data.createdCount) || 0;
        const s = Number(data.skippedCount) || 0;

        if (c > 0 && s === 0) {
          toast.success(`${c} assignment${c > 1 ? 's' : ''} created.`);
        } else if (c > 0 && s > 0) {
          toast.success(`${c} created, ${s} skipped (duplicate).`);
        } else {
          toast.error('No assignments created.');
        }
      } else {
        toast.success(isEditing ? 'Assignment updated.' : 'Assignment created.');
      }

      setShowModal(false);
      setEditingAssignment(null);
      setFormData({ ...DEFAULT_FORM });
      setStudentSearch('');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment and its payments?')) return;
    try {
      const res = await fetch(`/api/owner/assignments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(getErrMsg(data, 'Failed'));
      setAssignments((p) => p.filter((x) => x._id !== id));
      toast.success('Deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  /* ---------- Derived ---------- */
  const assignedStudentIds = useMemo(
    () => new Set(assignments.map((a) => a.studentId?._id).filter(Boolean) as string[]),
    [assignments]
  );
  const assignedStudentsCount = assignedStudentIds.size;
  const unassignedStudentsCount = Math.max(0, students.length - assignedStudentsCount);
  const livekitCount = assignments.filter((a) => Boolean(a.livekitRoomName)).length;
  const scheduledCount = assignments.filter((a) => a.status === 'scheduled').length;

  const totalFeeSum = useMemo(
    () => assignments.reduce((s, a) => s + (Number(a.feeAmount) || 0), 0),
    [assignments]
  );

  const totalTeacherFeeSum = useMemo(
    () => assignments.reduce((s, a) => s + (Number(a.teacherFeeAmount) || 0), 0),
    [assignments]
  );

  const canCreate = teachers.length > 0 && students.length > 0 && courses.length > 0;

  const canCreateRoom = Boolean(
    formData.teacherId &&
      formData.studentIds.length > 0 &&
      formData.courseId &&
      formData.daysOfWeek.length > 0 &&
      formData.startTime &&
      formData.endTime &&
      formData.endTime > formData.startTime
  );

  const assignmentTimeStatuses = useMemo(() => {
    if (!now) return new Map<string, TimeStatus>();
    const m = new Map<string, TimeStatus>();
    for (const a of assignments) m.set(a._id, getTimeStatus(a, now).status);
    return m;
  }, [assignments, now]);

  const todaysClasses = useMemo(() => {
    if (!now) return [];
    const today = getCurrentDayName(now);
    return assignments
      .filter((a) => a.daysOfWeek.includes(today))
      .map((a) => ({ assignment: a, info: getTimeStatus(a, now) }))
      .sort((x, y) => timeToMinutes(x.assignment.startTime) - timeToMinutes(y.assignment.startTime));
  }, [assignments, now]);

  const todaysAlarms = todaysClasses.filter((c) => c.info.status === 'alarm');
  const todaysOngoing = todaysClasses.filter((c) => c.info.status === 'ongoing');
  const todaysUpcoming = todaysClasses.filter((c) => c.info.status === 'upcoming');
  const todaysCompleted = todaysClasses.filter((c) => c.info.status === 'completed');
  const todaysOff = useMemo(() => {
    if (!now) return [];
    const today = getCurrentDayName(now);
    return assignments.filter((a) => !a.daysOfWeek.includes(today));
  }, [assignments, now]);

  const currentDayName = now ? getCurrentDayName(now) : '';
  const currentClock = now
    ? `${String(now.getHours() % 12 === 0 ? 12 : now.getHours() % 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`
    : '';

  const filteredTeachers = useMemo(() => {
    let r = teachers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter((t) => t.name.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q));
    }
    if (filterKey !== 'all' && filterKey !== 'off' && now) {
      r = r.filter((t) =>
        assignments.some((a) => {
          if (a.teacherId?._id !== t._id) return false;
          const s = assignmentTimeStatuses.get(a._id);
          return filterKey === 'today' ? s !== 'off' : s === filterKey;
        })
      );
    }
    return r;
  }, [teachers, searchQuery, filterKey, assignments, assignmentTimeStatuses, now]);

  const filteredStudents = useMemo(() => {
    let r = students;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter((s) => s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q));
    }
    if (filterKey !== 'all' && now) {
      const ids = new Set<string>();
      for (const a of assignments) {
        const sid = a.studentId?._id;
        if (!sid) continue;
        const st = assignmentTimeStatuses.get(a._id);
        if ((filterKey === 'today' ? st !== 'off' : st === filterKey)) ids.add(sid);
      }
      r = r.filter((s) => ids.has(s._id));
    }
    return r;
  }, [students, searchQuery, filterKey, assignments, assignmentTimeStatuses, now]);

  const studentsForModal = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div dir="ltr" className="space-y-6 sm:space-y-8">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <ClipboardDocumentListIcon className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <SparklesIcon className="h-3 w-3" />
                LiveKit Class Management
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight">Assignments</h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base max-w-lg">
                Assign one class to multiple students at once. Track student & teacher payments separately.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {mounted && now && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur border border-white/20 rounded-xl text-white text-sm font-semibold whitespace-nowrap">
                <SunIcon className="h-4 w-4" />
                {currentDayName} · {currentClock}
              </div>
            )}
            <button
              type="button"
              onClick={() => openAddModal()}
              disabled={!canCreate}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-4 w-4" />
              New Assignment
            </button>
          </div>
        </div>
      </div>

      {/* FEE SUMMARY + LINKS TO PAYMENTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Student Fees */}
        <div className="rounded-2xl bg-white border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <BanknotesIcon className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(totalFeeSum)}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
            Student Fees (all classes)
          </p>
        </div>

        {/* Teacher Payouts */}
        <div className="rounded-2xl bg-white border border-violet-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-violet-50 flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(totalTeacherFeeSum)}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
            Teacher Payouts (all classes)
          </p>
        </div>

        {/* Student Payments Link */}
        <Link
          href="/owner/payments"
          className="group rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 shadow-lg hover:shadow-xl transition text-white flex flex-col justify-between"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <WalletIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur rounded-full">
              Payments →
            </span>
          </div>
          <div>
            <p className="text-lg font-bold">Student Payments</p>
            <p className="text-xs text-white/80 mt-1">
              Track which students paid this month
            </p>
          </div>
        </Link>

        {/* Teacher Payments Link */}
        <Link
          href="/owner/teacher-payments"
          className="group rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-5 shadow-lg hover:shadow-xl transition text-white flex flex-col justify-between"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur rounded-full">
              Payouts →
            </span>
          </div>
          <div>
            <p className="text-lg font-bold">Teacher Payouts</p>
            <p className="text-xs text-white/80 mt-1">
              Track what you owe each teacher
            </p>
          </div>
        </Link>
      </div>

      {/* LIVE ALARMS */}
      {mounted && (todaysAlarms.length > 0 || todaysOngoing.length > 0) && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 p-5 shadow-lg animate-pulse-slow">
          <div className="relative flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center shrink-0">
              <BellAlertIcon className="h-6 w-6 text-orange-600 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-orange-900 text-base sm:text-lg">
                  {todaysOngoing.length > 0 && todaysAlarms.length > 0
                    ? '🔴 Live class + upcoming soon'
                    : todaysOngoing.length > 0
                    ? '🔴 A class is happening now'
                    : '🔔 A class is starting soon'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                  <FireIcon className="h-3 w-3" />
                  {todaysOngoing.length + todaysAlarms.length}
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {todaysOngoing.map(({ assignment }) => (
                  <p key={assignment._id} className="text-sm text-orange-800 flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase">Live</span>
                    {assignment.studentId?.name} · {assignment.courseId?.title} · {formatTime(assignment.startTime)}
                  </p>
                ))}
                {todaysAlarms.map(({ assignment, info }) => (
                  <p key={assignment._id} className="text-sm text-orange-800 flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-orange-600 text-white px-1.5 py-0.5 rounded uppercase">
                      In {formatCountdown(info.minutesUntilStart)}
                    </span>
                    {assignment.studentId?.name} · {assignment.courseId?.title} · {formatTime(assignment.startTime)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TODAY'S SCHEDULE */}
      {mounted && now && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Today&apos;s Schedule</h2>
                <p className="text-[11px] text-slate-500">{currentDayName} · {currentClock}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-bold">
                <BellAlertIcon className="h-3.5 w-3.5" /> {todaysAlarms.length} soon
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                <PlayCircleIcon className="h-3.5 w-3.5" /> {todaysOngoing.length} live
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                <ClockIcon className="h-3.5 w-3.5" /> {todaysUpcoming.length} upcoming
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                <CheckBadgeIcon className="h-3.5 w-3.5" /> {todaysCompleted.length} done
              </span>
            </div>
          </div>

          <div className="p-5">
            {todaysClasses.length === 0 ? (
              <div className="py-10 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                  <CalendarIcon className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-600 font-semibold text-sm">No classes scheduled today</p>
                <p className="text-slate-400 text-xs mt-1">Enjoy your day off 🎉</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todaysClasses.map(({ assignment, info }) => {
                  const meta = TIME_STATUS_META[info.status];
                  const isAlarm = info.status === 'alarm';
                  const isOngoing = info.status === 'ongoing';
                  return (
                    <div
                      key={assignment._id}
                      className={`rounded-xl border p-3.5 ${
                        isAlarm
                          ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 ring-2 ring-orange-200'
                          : isOngoing
                          ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 ring-2 ring-emerald-200'
                          : info.status === 'completed'
                          ? 'border-slate-200 bg-slate-50/70 opacity-80'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-20 text-center">
                          <p className="text-sm font-extrabold text-slate-900">
                            {formatTime(assignment.startTime).replace(/\s?(AM|PM)/, '')}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {formatTime(assignment.startTime).match(/AM|PM/)?.[0] || ''}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatTime(assignment.endTime)}
                          </p>
                        </div>
                        <div className="w-px self-stretch bg-slate-200" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.classes}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                              {meta.icon} {meta.label}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-slate-900 truncate">
                            {assignment.studentId?.name || 'Unknown'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <BookOpenIcon className="h-3 w-3" /> {assignment.courseId?.title || 'No Course'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <AcademicCapIcon className="h-3 w-3" /> {assignment.teacherId?.name || 'No Teacher'}
                            </span>
                            {Number(assignment.feeAmount) > 0 && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                <BanknotesIcon className="h-3 w-3" />
                                {formatMoney(assignment.feeAmount, assignment.currency)}
                              </span>
                            )}
                            {Number(assignment.teacherFeeAmount) > 0 && (
                              <span className="inline-flex items-center gap-1 text-violet-600 font-bold">
                                <AcademicCapIcon className="h-3 w-3" />
                                {formatMoney(assignment.teacherFeeAmount, assignment.teacherCurrency)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditModal(assignment)}
                          className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {todaysOff.length > 0 && (
            <div className="px-5 pb-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <NoSymbolIcon className="h-4 w-4 text-slate-500" />
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Off Today ({todaysOff.length})</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todaysOff.slice(0, 8).map((a) => (
                    <span key={a._id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-500">
                      <NoSymbolIcon className="h-3 w-3 text-slate-400" />
                      {a.studentId?.name} · {a.courseId?.title}
                    </span>
                  ))}
                  {todaysOff.length > 8 && (
                    <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-500">
                      +{todaysOff.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { title: 'Teachers', value: teachers.length, icon: AcademicCapIcon, gradient: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { title: 'Students', value: students.length, icon: UsersIcon, gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', text: 'text-blue-600' },
          { title: 'Assignments', value: assignments.length, icon: ClipboardDocumentListIcon, gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-50', text: 'text-purple-600' },
          { title: 'Scheduled', value: scheduledCount, icon: CalendarIcon, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-600' },
          { title: 'LiveKit', value: livekitCount, icon: VideoCameraIcon, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.title} className="group relative bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-xl transition overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-100 transition`} />
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-5 w-5 ${s.text}`} />
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">{s.title}</p>
          </div>
        ))}
      </div>

      {/* REQUIREMENTS */}
      {!canCreate && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm">Requirements</h3>
              <p className="text-xs text-slate-600 mt-1">
                Add at least one teacher, student, and course before creating an assignment.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { name: 'Teachers', ready: teachers.length > 0 },
                  { name: 'Students', ready: students.length > 0 },
                  { name: 'Courses', ready: courses.length > 0 },
                ].map((it) => (
                  <span key={it.name} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${it.ready ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {it.ready ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <XMarkIcon className="h-3.5 w-3.5" />}
                    {it.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH + FILTER */}
      {(teachers.length > 0 || students.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teachers or students..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
              <FunnelIcon className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'today', label: 'Today' },
                  { key: 'alarm', label: 'Soon' },
                  { key: 'ongoing', label: 'Live' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'completed', label: 'Done' },
                  { key: 'off', label: 'Off' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilterKey(opt.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${filterKey === opt.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TEACHER ASSIGNMENTS */}
      {filteredTeachers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <AcademicCapIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Teacher Assignments</h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredTeachers.map((teacher) => {
              const teacherAssignments = assignments.filter((a) => a.teacherId?._id === teacher._id);
              const teacherStudentIds = new Set(teacherAssignments.map((a) => a.studentId?._id).filter(Boolean) as string[]);
              const monthlyTotal = teacherAssignments.reduce((s, a) => s + (Number(a.feeAmount) || 0), 0);
              const teacherMonthlyPayment = teacherAssignments.reduce(
                (s, a) => s + (Number(a.teacherFeeAmount) || 0),
                0
              );
              const teacherPayoutCurrency =
                (teacherAssignments[0]?.teacherCurrency as Currency) || 'PKR';

              return (
                <div key={teacher._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 py-4 text-white overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-base font-bold shrink-0 border border-white/10">
                          {getInitials(teacher.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold truncate">{teacher.name}</h3>
                          <p className="text-indigo-100 text-xs truncate">{teacher.email || 'No email'}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold whitespace-nowrap border border-white/10 shrink-0">
                        {teacherStudentIds.size} Students
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {monthlyTotal > 0 && (
                        <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 inline-flex items-center gap-2">
                          <BanknotesIcon className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-bold">
                            {formatMoney(monthlyTotal)}/month
                          </span>
                        </div>
                      )}
                      {teacherMonthlyPayment > 0 && (
                        <div className="rounded-lg bg-violet-500/30 border border-violet-300/40 px-3 py-1.5 inline-flex items-center gap-2">
                          <AcademicCapIcon className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-bold">
                            Payout: {formatMoney(teacherMonthlyPayment, teacherPayoutCurrency)}/month
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {teacherAssignments.length === 0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <UserIcon className="h-5 w-5 text-slate-400 mx-auto" />
                        <p className="text-slate-500 text-sm mt-2">No students assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {teacherAssignments.map((a) => {
                          const statusMeta = STATUS_META[a.status] || STATUS_META.scheduled;
                          const timeStatus = mounted ? assignmentTimeStatuses.get(a._id) || 'off' : 'off';
                          const timeMeta = TIME_STATUS_META[timeStatus];
                          const isAlarm = timeStatus === 'alarm';
                          const isOngoing = timeStatus === 'ongoing';

                          return (
                            <div
                              key={a._id}
                              className={`rounded-xl border p-3.5 ${
                                isAlarm
                                  ? 'border-orange-300 bg-orange-50/60'
                                  : isOngoing
                                  ? 'border-emerald-300 bg-emerald-50/60'
                                  : 'border-slate-100 bg-slate-50/70'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      {getInitials(a.studentId?.name || 'U')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-sm text-slate-900 truncate">
                                          {a.studentId?.name || 'Unknown'}
                                        </p>
                                        {mounted && (
                                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${timeMeta.classes}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${timeMeta.dot}`} />
                                            {timeMeta.icon} {timeMeta.label}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600">
                                      <BookOpenIcon className="h-3 w-3 text-slate-400" />
                                      <span className="truncate max-w-[110px]">{a.courseId?.title || 'Course'}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600">
                                      <CalendarIcon className="h-3 w-3 text-slate-400" />
                                      <span className="truncate max-w-[110px]">
                                        {a.daysOfWeek?.map((d) => DAY_SHORT[d] || d.slice(0, 3)).join(', ')}
                                      </span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600">
                                      <ClockIcon className="h-3 w-3 text-slate-400" />
                                      {formatTime(a.startTime)} – {formatTime(a.endTime)}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {Number(a.feeAmount) > 0 && (
                                      <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-2">
                                        <BanknotesIcon className="h-3.5 w-3.5 text-emerald-600" />
                                        <span className="text-[11px] font-bold text-emerald-700">
                                          Student: {formatMoney(a.feeAmount, a.currency)}/month
                                        </span>
                                      </div>
                                    )}
                                    {Number(a.teacherFeeAmount) > 0 && (
                                      <div className="flex items-center gap-2 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-lg p-2">
                                        <AcademicCapIcon className="h-3.5 w-3.5 text-violet-600" />
                                        <span className="text-[11px] font-bold text-violet-700">
                                          Teacher: {formatMoney(a.teacherFeeAmount, a.teacherCurrency)}/month
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusMeta.classes}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                                      {statusMeta.label}
                                    </span>
                                    {a.livekitRoomName ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase">
                                        <CheckCircleIcon className="h-3 w-3" /> Room Ready
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase">
                                        <VideoCameraIcon className="h-3 w-3" /> No Room
                                      </span>
                                    )}
                                    {isAlarm && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-600 text-white text-[10px] font-bold uppercase animate-pulse-slow">
                                        <BellAlertIcon className="h-3 w-3" /> Ringing
                                      </span>
                                    )}
                                    {isOngoing && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase animate-pulse-slow">
                                        <PlayCircleIcon className="h-3 w-3" /> Live
                                      </span>
                                    )}
                                  </div>

                                  {a.livekitRoomName && (
                                    <div className="mt-3 rounded-lg bg-white border border-slate-200 p-2.5">
                                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">LiveKit Room</p>
                                      <p className="font-mono text-xs text-slate-700 font-semibold truncate">{a.livekitRoomName}</p>
                                    </div>
                                  )}

                                  {a.notes && (
                                    <p className="mt-2.5 text-xs text-slate-500 line-clamp-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                                      <span className="font-bold text-slate-700">Note:</span> {a.notes}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-col gap-1 shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(a)}
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition"
                                    title="Edit"
                                  >
                                    <PencilSquareIcon className="h-4 w-4" />
                                  </button>
                                  <div className="h-px bg-slate-200 mx-1" />
                                  <button
                                    type="button"
                                    onClick={() => deleteAssignment(a._id)}
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-rose-600 hover:bg-rose-50 transition"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => openAddModal(teacher._id)}
                      disabled={students.length === 0 || courses.length === 0}
                      className="w-full py-2.5 bg-white border-2 border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Assign New Students
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDENT DIRECTORY */}
      {filteredStudents.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UsersIcon className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Student Directory</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold border border-slate-200">
                Total: {students.length}
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200">
                Assigned: {assignedStudentsCount}
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold border border-amber-200">
                Unassigned: {unassignedStudentsCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStudents.map((student) => {
              const isAssigned = assignedStudentIds.has(student._id);
              const studentAssignments = assignments.filter((a) => a.studentId?._id === student._id);
              const studentMonthly = studentAssignments.reduce((s, a) => s + (Number(a.feeAmount) || 0), 0);
              const studentToday = mounted
                ? studentAssignments.map((a) => assignmentTimeStatuses.get(a._id) || 'off').filter((s) => s !== 'off')
                : [];
              const hasAlarm = studentToday.includes('alarm');
              const hasLive = studentToday.includes('ongoing');

              return (
                <div
                  key={student._id}
                  className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-3 transition hover:shadow-lg ${
                    hasAlarm
                      ? 'border-orange-300 ring-1 ring-orange-200'
                      : hasLive
                      ? 'border-emerald-300 ring-1 ring-emerald-200'
                      : isAssigned
                      ? 'border-emerald-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`relative h-11 w-11 rounded-xl flex items-center justify-center font-bold shrink-0 text-sm ${isAssigned ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                      {getInitials(student.name)}
                      {hasAlarm && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center">
                          <BellAlertIcon className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
                      {hasLive && !hasAlarm && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{student.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{student.email || 'No email'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {isAssigned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                            <CheckCircleIcon className="h-3 w-3" />
                            Assigned
                          </span>
                        )}
                        {studentMonthly > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <BanknotesIcon className="h-2.5 w-2.5" />
                            {formatMoney(studentMonthly)}/m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openAddModal(undefined, student._id)}
                    disabled={teachers.length === 0 || courses.length === 0}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition disabled:opacity-50 ${isAssigned ? 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'}`}
                    title={isAssigned ? 'Add another' : 'Assign'}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[92vh] overflow-hidden flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                    {editingAssignment ? <PencilSquareIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Class Management</p>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting || creatingRoom}
                  className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-50"
                >
                  <XMarkIcon className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col bg-slate-50/50">
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">

                {/* TEACHER + COURSE */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <AcademicCapIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    Teacher & Course
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Select Teacher <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.teacherId}
                        onChange={(e) => setFormData((p) => ({ ...p, teacherId: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 text-sm cursor-pointer"
                      >
                        <option value="">Choose a teacher...</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}{t.email ? ` — ${t.email}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Select Course <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.courseId}
                        onChange={(e) => setFormData((p) => ({ ...p, courseId: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 text-sm cursor-pointer"
                      >
                        <option value="">Choose a course...</option>
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* STUDENTS — Multi-select */}
                <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 flex-wrap">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <UsersIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    Students
                    {!editingAssignment && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Multi-select
                      </span>
                    )}
                    <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {formData.studentIds.length} selected
                    </span>
                  </h4>

                  {editingAssignment ? (
                    <select
                      value={formData.studentIds[0] || ''}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, studentIds: e.target.value ? [e.target.value] : [] }))
                      }
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm cursor-pointer"
                    >
                      <option value="">Choose a student...</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}{s.email ? ` — ${s.email}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          type="button"
                          onClick={selectAllStudents}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearAllStudents}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        >
                          Clear
                        </button>
                        <div className="relative flex-1">
                          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Search students..."
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs"
                          />
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/40">
                        {studentsForModal.length === 0 ? (
                          <p className="text-center text-slate-400 text-sm py-6">No students found</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {studentsForModal.map((s) => {
                              const selected = formData.studentIds.includes(s._id);
                              return (
                                <label
                                  key={s._id}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition ${
                                    selected
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-slate-200 bg-white hover:border-blue-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleStudent(s._id)}
                                    className="sr-only"
                                  />
                                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {getInitials(s.name)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{s.email || '—'}</p>
                                  </div>
                                  {selected && (
                                    <CheckCircleIcon className="h-4 w-4 text-blue-600 shrink-0" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {formData.studentIds.length > 0 && (
                        <p className="mt-3 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                          ✅ {formData.studentIds.length} assignment{formData.studentIds.length > 1 ? 's' : ''} will be created (one per student with the same schedule & fee).
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* SCHEDULE */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    Weekly Schedule
                  </h4>

                  <label className="block text-xs font-semibold text-slate-700 mb-3">
                    Class Days <span className="text-rose-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {DAYS.map((day) => {
                      const selected = formData.daysOfWeek.includes(day);
                      const isToday = mounted && currentDayName === day;
                      return (
                        <label
                          key={day}
                          className={`relative cursor-pointer rounded-xl border px-2 py-2.5 text-center transition ${
                            selected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleDayToggle(day)}
                            className="sr-only"
                          />
                          <span className="block text-[11px] font-bold uppercase">{day.slice(0, 3)}</span>
                          {isToday && <span className="block text-[8px] font-bold text-indigo-500 mt-0.5">Today</span>}
                          {selected && <CheckCircleIcon className="absolute -top-2 -right-2 h-5 w-5 text-indigo-600 bg-white rounded-full" />}
                        </label>
                      );
                    })}
                  </div>

                  {formData.daysOfWeek.length === 0 && (
                    <p className="mt-2 text-xs font-medium text-rose-500 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                      Please select at least one day.
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Start Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        End Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* STUDENT FEE */}
                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <BanknotesIcon className="h-4 w-4 text-emerald-600" />
                    </div>
                    Monthly Fee
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Per Student / Month
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value as Currency }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/40 text-sm cursor-pointer font-semibold"
                      >
                        <option value="PKR">₨ PKR</option>
                        <option value="USD">$ USD</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Fee Amount <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          {formData.currency === 'USD' ? '$' : '₨'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={formData.feeAmount}
                          onChange={(e) => setFormData((p) => ({ ...p, feeAmount: e.target.value }))}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/40 text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {Number(formData.feeAmount) > 0 && formData.studentIds.length > 1 && (
                    <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3">
                      <p className="text-xs text-emerald-800">
                        <strong>{formData.studentIds.length} students</strong> × {formatMoney(Number(formData.feeAmount), formData.currency)} ={' '}
                        <strong className="text-emerald-900">{formatMoney(Number(formData.feeAmount) * formData.studentIds.length, formData.currency)}</strong> / month
                      </p>
                    </div>
                  )}
                </div>

                {/* TEACHER PAYMENT */}
                <div className="bg-white p-5 rounded-2xl border-2 border-violet-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 flex-wrap">
                    <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
                      <AcademicCapIcon className="h-4 w-4 text-violet-600" />
                    </div>
                    Teacher Payment
                    <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      Academy → Teacher
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Currency</label>
                      <select
                        value={formData.teacherCurrency}
                        onChange={(e) => setFormData((p) => ({ ...p, teacherCurrency: e.target.value as Currency }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/40 text-sm cursor-pointer font-semibold"
                      >
                        <option value="PKR">₨ PKR</option>
                        <option value="USD">$ USD</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Amount to Pay Teacher
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          {formData.teacherCurrency === 'USD' ? '$' : '₨'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={formData.teacherFeeAmount}
                          onChange={(e) => setFormData((p) => ({ ...p, teacherFeeAmount: e.target.value }))}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/40 text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {Number(formData.teacherFeeAmount) > 0 && (
                    <div className="mt-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 p-3">
                      <p className="text-xs text-violet-800">
                        <strong>
                          {formData.teacherId
                            ? teachers.find((t) => t._id === formData.teacherId)?.name || 'Teacher'
                            : 'Teacher'}
                        </strong>{' '}
                        will receive:{' '}
                        <strong className="text-violet-900">
                          {formatMoney(Number(formData.teacherFeeAmount), formData.teacherCurrency)}
                        </strong>{' '}
                        / month
                      </p>
                    </div>
                  )}
                </div>

                {/* LIVEKIT */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <SignalIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    LiveKit Room
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
                  </h4>

                  <button
                    type="button"
                    onClick={createLiveKitRoom}
                    disabled={creatingRoom || submitting || !canCreateRoom}
                    className="w-full py-3 bg-white border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {creatingRoom ? (
                      <>
                        <span className="h-4 w-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <SignalIcon className="h-5 w-5" />
                        {formData.livekitRoomName ? 'Regenerate LiveKit Room' : 'Create LiveKit Room'}
                      </>
                    )}
                  </button>

                  {!canCreateRoom && !formData.livekitRoomName && (
                    <p className="text-center text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                      Fill participants & schedule first
                    </p>
                  )}

                  {formData.livekitRoomName && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                      <div className="flex items-center gap-2 text-emerald-700 mb-2">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="font-bold text-sm">Room Ready</span>
                      </div>
                      <p className="font-mono text-xs text-slate-700 bg-white p-2 rounded border border-emerald-100 break-all">
                        {formData.livekitRoomName}
                      </p>
                    </div>
                  )}
                </div>

                {/* STATUS + NOTES */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    Additional Info
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as AssignmentStatus }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 text-sm cursor-pointer"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Class Notes <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                        rows={3}
                        maxLength={1000}
                        placeholder="Syllabus, materials, etc..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/40 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-2" />
              </div>

              <div className="shrink-0 bg-white border-t border-slate-200 px-5 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting || creatingRoom}
                    className="sm:w-32 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || creatingRoom}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingAssignment ? <ArrowPathIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                        {editingAssignment
                          ? 'Update Assignment'
                          : `Create ${formData.studentIds.length > 0 ? formData.studentIds.length : ''} Assignment${formData.studentIds.length !== 1 ? 's' : ''}`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}