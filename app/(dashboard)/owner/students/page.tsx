'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// ✅ Heroicons — names end with "Icon"
import {
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  UserGroupIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  UsersIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

// ✅ Lucide React — no suffix
import {
  Lock,
  Crown,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  address: string;
  subjects: string[];
  status: 'active' | 'inactive' | 'pending' | 'graduated';
  enrollmentDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanInfo {
  planId: string;
  planName: string;
  studentLimit: number;
  currentCount: number;
  isActive: boolean;
  isPublic: boolean;
  isFree: boolean;
  isUnlimited: boolean;
}

/* ============================================================
   HELPERS
   ============================================================ */

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function OwnerStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'pending' | 'inactive' | 'graduated'
  >('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    address: '',
    subjects: '',
    status: 'active' as Student['status'],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  /* ============================================================
     DATA FETCH
     ============================================================ */

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/owner/students', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error loading students');
    }
  };

  const fetchPlanInfo = async () => {
    try {
      const res = await fetch('/api/subscription/status', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;

      const data = await res.json();
      const sub = data.subscription;
      const academy = data.academy;

      const studentLimit = academy?.studentLimit ?? 0;
      const isUnlimited = studentLimit === -1;

      setPlanInfo({
        planId: academy?.planId || 'free',
        planName: sub?.planName || 'Free',
        studentLimit,
        currentCount: academy?.currentStudentCount ?? 0,
        isActive:
          sub?.status === 'active' || sub?.status === 'trial',
        isPublic: academy?.isPublic ?? false,
        isFree: !sub || academy?.planId === 'free',
        isUnlimited,
      });
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchPlanInfo()]);
      setLoading(false);
    })();
  }, []);

  /* ============================================================
     PLAN CHECKS
     ============================================================ */

  const limitReached = useMemo(() => {
    if (!planInfo) return false;
    if (planInfo.isFree) return true;
    if (planInfo.isUnlimited) return false;
    return planInfo.currentCount >= planInfo.studentLimit;
  }, [planInfo]);

  const usagePercent = useMemo(() => {
    if (!planInfo || planInfo.isUnlimited || planInfo.studentLimit <= 0)
      return 0;
    return Math.min(
      100,
      Math.round((planInfo.currentCount / planInfo.studentLimit) * 100)
    );
  }, [planInfo]);

  const remaining = useMemo(() => {
    if (!planInfo) return 0;
    if (planInfo.isUnlimited) return -1;
    return Math.max(0, planInfo.studentLimit - planInfo.currentCount);
  }, [planInfo]);

  /* ============================================================
     MODAL OPEN
     ============================================================ */

  const openAddModal = () => {
    if (limitReached) {
      setUpgradeReason(
        planInfo?.isFree
          ? 'You are on the Free plan. Upgrade to add students and make your academy public.'
          : `You have reached your limit of ${planInfo?.studentLimit} students. Upgrade your plan to add more.`
      );
      setShowUpgradeModal(true);
      return;
    }
    setEditingStudent(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      address: student.address || '',
      subjects: student.subjects.join(', '),
      status: student.status,
      notes: student.notes || '',
    });
    setShowModal(true);
  };

  /* ============================================================
     SUBMIT
     ============================================================ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      subjects: formData.subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const url = editingStudent
        ? `/api/owner/students/${editingStudent._id}`
        : '/api/owner/students';
      const method = editingStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      /* ✅ 402 — Payment Required */
      if (res.status === 402) {
        const errorData = await res.json();
        setUpgradeReason(
          errorData.error || 'Plan limit reached. Please upgrade.'
        );
        setShowUpgradeModal(true);
        setShowModal(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Operation failed');
      }

      toast.success(editingStudent ? 'Student updated' : 'Student added');
      setShowModal(false);
      setEditingStudent(null);
      resetForm();

      await Promise.all([fetchStudents(), fetchPlanInfo()]);
    } catch (error: any) {
      toast.error(error.message || 'Error saving student');
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     DELETE
     ============================================================ */

  const deleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/owner/students/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Student deleted');
      setStudents((prev) => prev.filter((s) => s._id !== id));
      await fetchPlanInfo();
    } catch {
      toast.error('Error deleting student');
    }
  };

  /* ============================================================
     HELPERS
     ============================================================ */

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      parentName: '',
      parentPhone: '',
      address: '',
      subjects: '',
      status: 'active',
      notes: '',
    });
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.parentName && s.parentName.toLowerCase().includes(q)) ||
        s.subjects.some((sub) => sub.toLowerCase().includes(q));

      const matchesFilter =
        filterStatus === 'all' || s.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [students, searchQuery, filterStatus]);

  const stats = useMemo(
    () => ({
      total: students.length,
      active: students.filter((s) => s.status === 'active').length,
      pending: students.filter((s) => s.status === 'pending').length,
      inactive: students.filter((s) => s.status === 'inactive').length,
    }),
    [students]
  );

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ============================================
          HERO HEADER
      ============================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-teal-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <UsersIcon className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <SparklesIcon className="h-3 w-3" />
                Student Management
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight">
                Students
              </h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base max-w-lg">
                Manage all students enrolled in your academy.
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap shrink-0 ${
              limitReached
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-white text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {limitReached ? (
              <>
                <Lock className="h-4 w-4" />
                Upgrade to Add
              </>
            ) : (
              <>
                <UserPlusIcon className="h-4 w-4" />
                Add Student
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============================================
          PLAN STATUS BANNER
      ============================================ */}
      {planInfo && (
        <div
          className={`rounded-2xl border-2 p-4 sm:p-5 ${
            planInfo.isFree
              ? 'bg-amber-50 border-amber-300'
              : limitReached
              ? 'bg-rose-50 border-rose-300'
              : usagePercent >= 80
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                planInfo.isFree
                  ? 'bg-amber-500'
                  : limitReached
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
            >
              {planInfo.isFree ? (
                <Lock className="h-6 w-6 text-white" />
              ) : limitReached ? (
                <AlertTriangle className="h-6 w-6 text-white" />
              ) : (
                <Crown className="h-6 w-6 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base">
                  {planInfo.isFree
                    ? 'Free Plan — Upgrade Required'
                    : limitReached
                    ? 'Student Limit Reached'
                    : `${planInfo.planName} Plan Active`}
                </h3>

                {!planInfo.isFree && !planInfo.isUnlimited && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      limitReached
                        ? 'bg-rose-100 text-rose-700'
                        : usagePercent >= 80
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {planInfo.currentCount} / {planInfo.studentLimit}
                  </span>
                )}

                {planInfo.isUnlimited && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    Unlimited
                  </span>
                )}
              </div>

              {/* Usage bar */}
              {!planInfo.isUnlimited && planInfo.studentLimit > 0 && (
                <div className="mt-2 max-w-md">
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        limitReached
                          ? 'bg-rose-500'
                          : usagePercent >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 font-medium">
                    {planInfo.isFree
                      ? 'Free plan does not allow adding students.'
                      : limitReached
                      ? `You've used all ${planInfo.studentLimit} student slots.`
                      : `${remaining} student slot${
                          remaining !== 1 ? 's' : ''
                        } remaining.`}
                  </p>
                </div>
              )}

              {(planInfo.isFree || limitReached) && (
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg transition"
                >
                  <TrendingUp className="h-4 w-4" />
                  {planInfo.isFree ? 'View Plans' : 'Upgrade Plan'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          STATS CARDS
      ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats.total}
          icon={<UsersIcon className="h-5 w-5" />}
          gradient="from-blue-500 to-indigo-600"
          bg="bg-blue-50"
          text="text-blue-600"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<CheckCircleIcon className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<ClockIcon className="h-5 w-5" />}
          gradient="from-amber-500 to-orange-600"
          bg="bg-amber-50"
          text="text-amber-600"
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          icon={<XCircleIcon className="h-5 w-5" />}
          gradient="from-slate-400 to-slate-600"
          bg="bg-slate-100"
          text="text-slate-600"
        />
      </div>

      {/* ============================================
          SEARCH + FILTER
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, parent, or subject..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
            <FunnelIcon className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'pending', label: 'Pending' },
                { key: 'inactive', label: 'Inactive' },
                { key: 'graduated', label: 'Graduated' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilterStatus(opt.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  filterStatus === opt.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {(searchQuery || filterStatus !== 'all') && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredStudents.length}
              </span>{' '}
              of {students.length} students
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ============================================
          LIST
      ============================================ */}
      {students.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-emerald-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            No Students Yet
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
            {planInfo?.isFree
              ? 'Upgrade your plan to start adding students.'
              : 'Start growing your academy by enrolling your first student.'}
          </p>
          <button
            onClick={openAddModal}
            className={`inline-flex items-center gap-2 mt-6 px-7 py-3.5 font-semibold rounded-2xl shadow-lg transition ${
              limitReached
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
            }`}
          >
            {limitReached ? (
              <>
                <Crown className="h-5 w-5" />
                Upgrade to Add Students
              </>
            ) : (
              <>
                <UserPlusIcon className="h-5 w-5" />
                Add Your First Student
              </>
            )}
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <MagnifyingGlassIcon className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            No matches found
          </h3>
          <p className="text-slate-500 mt-1 text-sm">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Enrolled
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                            {getInitials(student.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {student.name}
                            </p>
                            {student.notes && (
                              <p className="text-xs text-slate-400 truncate max-w-[180px]">
                                {student.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {student.email}
                          </span>
                        </div>
                        {student.phone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                            <PhoneIcon className="h-3 w-3 shrink-0" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {student.parentName ? (
                          <>
                            <p className="text-xs font-semibold text-slate-700">
                              {student.parentName}
                            </p>
                            {student.parentPhone && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                                <PhoneIcon className="h-3 w-3 shrink-0" />
                                {student.parentPhone}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {student.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {student.subjects.slice(0, 2).map((subject) => (
                              <span
                                key={subject}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                              >
                                {subject}
                              </span>
                            ))}
                            {student.subjects.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                +{student.subjects.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={student.status} />
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(student.enrollmentDate)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(student)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            aria-label="Edit student"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteStudent(student._id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            aria-label="Delete student"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-sm">
                    {getInitials(student.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {student.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <EnvelopeIcon className="h-3 w-3 shrink-0" />
                      {student.email}
                    </p>
                  </div>
                  <StatusBadge status={student.status} compact />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  {student.phone && (
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 rounded-lg px-2.5 py-2">
                      <PhoneIcon className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{student.phone}</span>
                    </div>
                  )}
                  {student.parentName && (
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 rounded-lg px-2.5 py-2 col-span-2 sm:col-span-1">
                      <UsersIcon className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{student.parentName}</span>
                    </div>
                  )}
                </div>

                {student.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {student.subjects.slice(0, 3).map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                      >
                        {subject}
                      </span>
                    ))}
                    {student.subjects.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        +{student.subjects.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    Enrolled {formatDate(student.enrollmentDate)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(student)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteStudent(student._id)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============================================
          STUDENT FORM MODAL
      ============================================ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 sm:px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                      editingStudent
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {editingStudent ? (
                      <PencilSquareIcon className="h-5 w-5" />
                    ) : (
                      <UserPlusIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                      {editingStudent ? 'Edit Student' : 'Add New Student'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {editingStudent
                        ? 'Update student information'
                        : 'Fill in the details below'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !submitting && setShowModal(false)}
                  disabled={submitting}
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {/* Basic Info */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5" />
                  Student Information
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="e.g. Muhammad Ali"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400" />
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      placeholder="student@example.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+92 300 1234567"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Guardian Info */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Guardian Information
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Parent Name
                    </label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parentName: e.target.value,
                        })
                      }
                      placeholder="e.g. Ahmed Khan"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Parent Phone
                    </label>
                    <input
                      type="text"
                      value={formData.parentPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parentPhone: e.target.value,
                        })
                      }
                      placeholder="+92 300 7654321"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Academic */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpenIcon className="h-3.5 w-3.5" />
                  Academic Details
                </p>

                <div className="space-y-2 mb-4">
                  <label className="text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        {
                          key: 'active',
                          label: 'Active',
                          Icon: CheckCircleIcon,
                          color: 'emerald',
                        },
                        {
                          key: 'pending',
                          label: 'Pending',
                          Icon: ClockIcon,
                          color: 'amber',
                        },
                        {
                          key: 'inactive',
                          label: 'Inactive',
                          Icon: XCircleIcon,
                          color: 'slate',
                        },
                        {
                          key: 'graduated',
                          label: 'Graduated',
                          Icon: SparklesIcon,
                          color: 'violet',
                        },
                      ] as const
                    ).map(({ key, label, Icon, color }) => {
                      const isSelected = formData.status === key;
                      const colorClasses = {
                        emerald: isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-emerald-200',
                        amber: isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 text-slate-600 hover:border-amber-200',
                        slate: isSelected
                          ? 'border-slate-500 bg-slate-100 text-slate-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300',
                        violet: isSelected
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 text-slate-600 hover:border-violet-200',
                      }[color];

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              status: key as Student['status'],
                            })
                          }
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition text-[11px] font-semibold ${colorClasses}`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <BookOpenIcon className="h-3.5 w-3.5 text-slate-400" />
                    Subjects
                  </label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) =>
                      setFormData({ ...formData, subjects: e.target.value })
                    }
                    placeholder="Quran, Math, English"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm"
                  />
                  <p className="text-[11px] text-slate-400">
                    Separate multiple subjects with commas.
                  </p>
                </div>
              </div>

              {/* Additional */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="h-3.5 w-3.5" />
                  Additional Information
                </p>

                <div className="space-y-2 mb-4">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="House #12, Street 5, Islamabad"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <SparklesIcon className="h-3.5 w-3.5 text-slate-400" />
                    Notes
                    <span className="text-slate-400 text-xs font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Any additional information about the student..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      {editingStudent ? 'Save Changes' : 'Add Student'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          UPGRADE MODAL
      ============================================ */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 border border-white/30">
                  <Crown className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold">Upgrade Required</h3>
                  <p className="text-sm text-white/90 mt-1">
                    Unlock more students by upgrading your plan.
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {upgradeReason}
                  </p>
                </div>
              </div>

              {/* Plan suggestions */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Starter', students: 10, price: '$3.99' },
                  { name: 'Growth', students: 30, price: '$9.99' },
                  { name: 'Pro', students: 75, price: '$19.99' },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className="rounded-xl border border-slate-200 p-3 text-center"
                  >
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {plan.name}
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {plan.students}
                    </p>
                    <p className="text-[10px] text-slate-500">students</p>
                    <p className="text-xs font-bold text-violet-600 mt-1">
                      {plan.price}/mo
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg hover:from-violet-700 hover:to-fuchsia-700 transition"
                >
                  <TrendingUp className="h-4 w-4" />
                  View All Plans
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function StatCard({
  label,
  value,
  icon,
  gradient,
  bg,
  text,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${bg} flex items-center justify-center ${text}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-xl sm:text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-[11px] sm:text-sm text-slate-500 mt-1 font-medium">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  compact,
}: {
  status: Student['status'];
  compact?: boolean;
}) {
  const map = {
    active: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      Icon: CheckCircleIcon,
      label: 'Active',
    },
    pending: {
      bg: 'bg-amber-50 text-amber-700 border-amber-100',
      Icon: ClockIcon,
      label: 'Pending',
    },
    inactive: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      Icon: XCircleIcon,
      label: 'Inactive',
    },
    graduated: {
      bg: 'bg-violet-50 text-violet-700 border-violet-100',
      Icon: SparklesIcon,
      label: 'Graduated',
    },
  }[status];

  const { Icon } = map;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map.bg} ${
        compact ? 'text-[10px] px-2' : ''
      }`}
    >
      <Icon className="h-3 w-3" />
      {map.label}
    </span>
  );
}