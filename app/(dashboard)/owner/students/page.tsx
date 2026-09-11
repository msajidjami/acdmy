'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
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

/* ------------------ Types ------------------ */

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  address: string;
  subjects: string[];
  status: 'active' | 'inactive' | 'pending';
  enrollmentDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------ Helpers ------------------ */

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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

/* ------------------ Component ------------------ */

export default function OwnerStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [formData, setFormData] = useState({
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
  const [submitting, setSubmitting] = useState(false);

  /* ------------------ Data ------------------ */

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/owner/students');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      toast.error('Error loading students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ------------------ Actions ------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      subjects: formData.subjects.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      const url = editingStudent
        ? `/api/owner/students/${editingStudent._id}`
        : '/api/owner/students';
      const method = editingStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Operation failed');
      }

      toast.success(editingStudent ? 'Student updated' : 'Student added');
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Error saving student');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/owner/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Student deleted');
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (error) {
      toast.error('Error deleting student');
    }
  };

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

  const openAddModal = () => {
    setEditingStudent(null);
    resetForm();
    setShowModal(true);
  };

  /* ------------------ Derived ------------------ */

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.parentName && s.parentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.subjects.some((sub) => sub.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter = filterStatus === 'all' || s.status === filterStatus;

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

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Loading students...</p>
        </div>
      </div>
    );
  }

  /* ------------------ Render ------------------ */

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
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap shrink-0"
          >
            <UserPlusIcon className="h-4 w-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* ============================================
          STATS CARDS
      ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1 font-medium">
            Total Students
          </p>
        </div>

        {/* Active */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-slate-900">{stats.active}</p>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1 font-medium">Active</p>
        </div>

        {/* Pending */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-slate-900">{stats.pending}</p>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1 font-medium">Pending</p>
        </div>

        {/* Inactive */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-100 flex items-center justify-center">
              <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-slate-900">{stats.inactive}</p>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1 font-medium">Inactive</p>
        </div>
      </div>

      {/* ============================================
          SEARCH + FILTER BAR
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
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

          {/* Filter pills */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
            <FunnelIcon className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'pending', label: 'Pending' },
                { key: 'inactive', label: 'Inactive' },
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
          EMPTY STATES
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
            Start growing your academy by enrolling your first student.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 mt-6 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 transition"
          >
            <UserPlusIcon className="h-5 w-5" />
            Add Your First Student
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <MagnifyingGlassIcon className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No matches found</h3>
          <p className="text-slate-500 mt-1 text-sm">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          {/* ============================================
              DESKTOP TABLE
          ============================================ */}
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
                      {/* Student */}
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

                      {/* Contact */}
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

                      {/* Parent */}
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

                      {/* Subjects */}
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

                      {/* Status */}
                      <td className="px-5 py-4">
                        {student.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircleIcon className="h-3 w-3" />
                            Active
                          </span>
                        )}
                        {student.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            <ClockIcon className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                        {student.status === 'inactive' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircleIcon className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Enrolled */}
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(student.enrollmentDate)}
                      </td>

                      {/* Actions */}
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

          {/* ============================================
              MOBILE CARDS
          ============================================ */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                {/* Header */}
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
                  {student.status === 'active' && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  )}
                  {student.status === 'pending' && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      Pending
                    </span>
                  )}
                  {student.status === 'inactive' && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Details grid */}
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

                {/* Subjects */}
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

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    Enrolled {formatDate(student.enrollmentDate)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(student)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                      aria-label="Edit student"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteStudent(student._id)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                      aria-label="Delete student"
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
          MODAL
      ============================================ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {/* Section: Basic Info */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5" />
                  Student Information
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="student-name"
                      className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      Full Name
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="student-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="e.g. Muhammad Ali"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label
                      htmlFor="student-email"
                      className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400" />
                      Email
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="student-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      placeholder="student@example.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label
                      htmlFor="student-phone"
                      className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
                      Phone
                    </label>
                    <input
                      id="student-phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+92 300 1234567"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Guardian */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UsersIcon className="h-3.5 w-3.5" />
                  Guardian Information
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Parent Name */}
                  <div className="space-y-2">
                    <label
                      htmlFor="parent-name"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Parent Name
                    </label>
                    <input
                      id="parent-name"
                      type="text"
                      value={formData.parentName}
                      onChange={(e) =>
                        setFormData({ ...formData, parentName: e.target.value })
                      }
                      placeholder="e.g. Ahmed Khan"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                    />
                  </div>

                  {/* Parent Phone */}
                  <div className="space-y-2">
                    <label
                      htmlFor="parent-phone"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Parent Phone
                    </label>
                    <input
                      id="parent-phone"
                      type="text"
                      value={formData.parentPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, parentPhone: e.target.value })
                      }
                      placeholder="+92 300 7654321"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Academic */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpenIcon className="h-3.5 w-3.5" />
                  Academic Details
                </p>

                {/* Status */}
                <div className="space-y-2 mb-4">
                  <label
                    htmlFor="student-status"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
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
                      ] as const
                    ).map(({ key, label, Icon, color }) => {
                      const isSelected = formData.status === key;
                      const colorClasses = {
                        emerald: isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30',
                        amber: isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 text-slate-600 hover:border-amber-200 hover:bg-amber-50/30',
                        slate: isSelected
                          ? 'border-slate-500 bg-slate-100 text-slate-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                      }[color];

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, status: key })
                          }
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition text-xs font-semibold ${colorClasses}`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subjects */}
                <div className="space-y-2">
                  <label
                    htmlFor="student-subjects"
                    className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <BookOpenIcon className="h-3.5 w-3.5 text-slate-400" />
                    Subjects
                  </label>
                  <input
                    id="student-subjects"
                    type="text"
                    value={formData.subjects}
                    onChange={(e) =>
                      setFormData({ ...formData, subjects: e.target.value })
                    }
                    placeholder="Quran, Math, English"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-400">
                    Separate multiple subjects with commas.
                  </p>
                </div>
              </div>

              {/* Section: Additional */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="h-3.5 w-3.5" />
                  Additional Information
                </p>

                {/* Address */}
                <div className="space-y-2 mb-4">
                  <label
                    htmlFor="student-address"
                    className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                    Address
                  </label>
                  <input
                    id="student-address"
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="House #12, Street 5, Islamabad"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label
                    htmlFor="student-notes"
                    className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <SparklesIcon className="h-3.5 w-3.5 text-slate-400" />
                    Notes
                    <span className="text-slate-400 text-xs font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="student-notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Any additional information about the student..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm resize-none placeholder:text-slate-400 leading-relaxed"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
    </div>
  );
}