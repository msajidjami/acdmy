'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { toast } from 'react-hot-toast';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  MusicalNoteIcon,
  UserCircleIcon,
  SparklesIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  subjects: string[];
  isAvailable: boolean;
  profileImage?: string;
  bio?: string;
  audioUrl?: string;
}

export default function OwnerTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subjects: '',
    bio: '',
    audioFile: null as File | null,
  });
  const [uploading, setUploading] = useState(false);

  /* ------------------ Data ------------------ */

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/owner/teachers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      toast.error('Error loading teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  /* ------------------ Actions ------------------ */

  const toggleAvailability = async (teacherId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/owner/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Availability updated');
      setTeachers((prev) =>
        prev.map((t) =>
          t._id === teacherId ? { ...t, isAvailable: !currentStatus } : t
        )
      );
    } catch (error) {
      toast.error('Error updating availability');
    }
  };

  const deleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    try {
      const res = await fetch(`/api/owner/teachers/${teacherId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Teacher deleted');
      setTeachers((prev) => prev.filter((t) => t._id !== teacherId));
    } catch (error) {
      toast.error('Error deleting teacher');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let audioUrl = editingTeacher?.audioUrl || '';
      if (formData.audioFile) {
        const formDataAudio = new FormData();
        formDataAudio.append('audio', formData.audioFile);
        const uploadRes = await fetch('/api/upload-audio', {
          method: 'POST',
          body: formDataAudio,
        });
        if (!uploadRes.ok) throw new Error('Audio upload failed');
        const { url } = await uploadRes.json();
        audioUrl = url;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        subjects: formData.subjects
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        bio: formData.bio,
        audioUrl,
      };

      const url = editingTeacher
        ? `/api/owner/teachers/${editingTeacher._id}`
        : '/api/owner/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Operation failed');

      toast.success(editingTeacher ? 'Teacher updated' : 'Teacher added');
      setShowModal(false);
      setEditingTeacher(null);
      setFormData({ name: '', email: '', subjects: '', bio: '', audioFile: null });
      fetchTeachers();
    } catch (error) {
      toast.error('Error saving teacher');
    } finally {
      setUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({ name: '', email: '', subjects: '', bio: '', audioFile: null });
    setShowModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      subjects: teacher.subjects.join(', '),
      bio: teacher.bio || '',
      audioFile: null,
    });
    setShowModal(true);
  };

  /* ------------------ Derived ------------------ */

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        filterAvailability === 'all' ||
        (filterAvailability === 'available' && t.isAvailable) ||
        (filterAvailability === 'unavailable' && !t.isAvailable);

      return matchesSearch && matchesFilter;
    });
  }, [teachers, searchQuery, filterAvailability]);

  const stats = useMemo(
    () => ({
      total: teachers.length,
      available: teachers.filter((t) => t.isAvailable).length,
      withAudio: teachers.filter((t) => t.audioUrl).length,
    }),
    [teachers]
  );

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ============================================
          HERO HEADER
      ============================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-indigo-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <UserGroupIcon className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <SparklesIcon className="h-3 w-3" />
                Team Management
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight">
                Manage Teachers
              </h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base max-w-lg">
                Add, edit, and organize your academy&apos;s teaching team.
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap shrink-0"
          >
            <PlusIcon className="h-4 w-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* ============================================
          STATS CARDS
      ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600">
              Team
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Total Teachers</p>
        </div>

        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
              Active
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.available}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Available Now</p>
        </div>

        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <MusicalNoteIcon className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-600">
              Audio
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.withAudio}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">With Voice Intro</p>
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
              placeholder="Search by name, email, or subject..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
            <FunnelIcon className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'available', label: 'Available' },
                { key: 'unavailable', label: 'Unavailable' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilterAvailability(opt.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  filterAvailability === opt.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {(searchQuery || filterAvailability !== 'all') && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filteredTeachers.length}</span> of {teachers.length} teachers
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterAvailability('all');
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ============================================
          EMPTY STATE
      ============================================ */}
      {teachers.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-emerald-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">No Teachers Yet</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
            Start building your teaching team by adding your first teacher.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 mt-6 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 transition"
          >
            <PlusIcon className="h-5 w-5" />
            Add Your First Teacher
          </button>
        </div>
      ) : filteredTeachers.length === 0 ? (
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
              DESKTOP TABLE (md+)
          ============================================ */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Voice Intro
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name + Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                            {getInitials(teacher.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">
                              {teacher.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                              <EnvelopeIcon className="h-3 w-3 shrink-0" />
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subjects */}
                      <td className="px-5 py-4">
                        {teacher.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {teacher.subjects.slice(0, 3).map((subject) => (
                              <span
                                key={subject}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                              >
                                {subject}
                              </span>
                            ))}
                            {teacher.subjects.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                +{teacher.subjects.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Audio */}
                      <td className="px-5 py-4">
                        {teacher.audioUrl ? (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <MusicalNoteIcon className="h-4 w-4 text-purple-600" />
                            </div>
                            <audio controls className="h-8 w-40">
                              <source src={teacher.audioUrl} type="audio/mpeg" />
                            </audio>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <MicrophoneIcon className="h-3.5 w-3.5" />
                            No audio
                          </span>
                        )}
                      </td>

                      {/* Availability Toggle */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAvailability(teacher._id, teacher.isAvailable)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                              teacher.isAvailable ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                            aria-label="Toggle availability"
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                teacher.isAvailable ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold ${
                              teacher.isAvailable ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            {teacher.isAvailable ? 'Available' : 'Away'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(teacher)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            aria-label="Edit teacher"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTeacher(teacher._id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            aria-label="Delete teacher"
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
              MOBILE CARDS (below md)
          ============================================ */}
          <div className="md:hidden space-y-3">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-sm">
                    {getInitials(teacher.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {teacher.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <EnvelopeIcon className="h-3 w-3 shrink-0" />
                      {teacher.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${
                      teacher.isAvailable
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {teacher.isAvailable ? 'Available' : 'Away'}
                  </span>
                </div>

                {/* Subjects */}
                {teacher.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {teacher.subjects.slice(0, 4).map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                      >
                        {subject}
                      </span>
                    ))}
                    {teacher.subjects.length > 4 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        +{teacher.subjects.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Audio */}
                {teacher.audioUrl && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <MusicalNoteIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <audio controls className="h-8 w-full">
                      <source src={teacher.audioUrl} type="audio/mpeg" />
                    </audio>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleAvailability(teacher._id, teacher.isAvailable)}
                    className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                      teacher.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {teacher.isAvailable ? (
                      <>
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Set Away
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-3.5 w-3.5" />
                        Set Available
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(teacher)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                      aria-label="Edit teacher"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTeacher(teacher._id)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                      aria-label="Delete teacher"
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
          onClick={() => !uploading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 sm:p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                      editingTeacher
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {editingTeacher ? (
                      <PencilSquareIcon className="h-5 w-5" />
                    ) : (
                      <PlusIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                      {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {editingTeacher
                        ? 'Update teacher information'
                        : 'Fill in the details below'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !uploading && setShowModal(false)}
                  disabled={uploading}
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label
                  htmlFor="teacher-name"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <UserCircleIcon className="h-4 w-4 text-slate-400" />
                  Full Name
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="teacher-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Ahmed Khan"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="teacher-email"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                  Email
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="teacher-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="teacher@example.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <label
                  htmlFor="teacher-subjects"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <AcademicCapIcon className="h-4 w-4 text-slate-400" />
                  Subjects
                </label>
                <input
                  id="teacher-subjects"
                  type="text"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="Math, Physics, Quran"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                />
                <p className="text-[11px] text-slate-400">
                  Separate multiple subjects with commas.
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label
                  htmlFor="teacher-bio"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <SparklesIcon className="h-4 w-4 text-slate-400" />
                  Bio
                  <span className="text-slate-400 text-xs font-normal">(optional)</span>
                </label>
                <textarea
                  id="teacher-bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="Short introduction about the teacher..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm resize-none placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* Audio Upload */}
              <div className="space-y-2">
                <label
                  htmlFor="teacher-audio"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <MicrophoneIcon className="h-4 w-4 text-slate-400" />
                  Voice Introduction
                  <span className="text-slate-400 text-xs font-normal">(MP3)</span>
                </label>

                <label
                  htmlFor="teacher-audio"
                  className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-xl cursor-pointer transition group"
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition">
                    <MusicalNoteIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {formData.audioFile ? (
                      <>
                        <p className="text-xs sm:text-sm font-semibold text-emerald-700 truncate">
                          {formData.audioFile.name}
                        </p>
                        <p className="text-[11px] text-emerald-600">
                          Ready to upload
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm font-semibold text-slate-700">
                          Click to upload audio
                        </p>
                        <p className="text-[11px] text-slate-400">
                          MP3, WAV up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="teacher-audio"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData({ ...formData, audioFile: file });
                    }}
                    className="hidden"
                  />
                </label>

                {editingTeacher?.audioUrl && !formData.audioFile && (
                  <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <MusicalNoteIcon className="h-4 w-4 text-purple-600 shrink-0" />
                    <p className="text-[11px] text-slate-600 flex-1">
                      Current audio attached
                    </p>
                    <audio controls className="h-7 max-w-[140px]">
                      <source src={editingTeacher.audioUrl} type="audio/mpeg" />
                    </audio>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      {editingTeacher ? 'Save Changes' : 'Add Teacher'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
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