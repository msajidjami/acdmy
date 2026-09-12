'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
  UserIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  TagIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

/* ============================================================
   TYPES
   ============================================================ */

interface Teacher {
  _id: string;
  name: string;
  email: string;
  gender: 'male' | 'female';
  subjects: string[];
  isAvailable: boolean;
  profileImage?: string;
  bio?: string;
  audioUrl?: string;
}

const EMPTY_FORM = {
  name: '',
  email: '',
  gender: 'male' as 'male' | 'female',
  selectedSubjects: [] as string[],
  bio: '',
  audioFile: null as File | null,
  existingAudioUrl: '',
  profileImageFile: null as File | null,
  existingProfileImage: '',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 15 * 1024 * 1024;

/* ============================================================
   COMPONENT
   ============================================================ */

export default function OwnerTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academySubjects, setAcademySubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<
    'all' | 'available' | 'unavailable'
  >('all');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);

  /* ------------------ Fetch Data ------------------ */

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/owner/teachers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error loading teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/owner/teachers/subjects');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAcademySubjects(Array.isArray(data?.subjects) ? data.subjects : []);
    } catch {
      console.error('Failed to load subjects');
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  /* ------------------ Image Helpers ------------------ */

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const uploadFile = async (
    file: File,
    endpoint: string,
    fieldName: string
  ): Promise<string> => {
    const fd = new FormData();
    fd.append(fieldName, file);

    const res = await fetch(endpoint, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) {
      throw new Error(data?.error || 'Upload failed');
    }
    return String(data.url);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be smaller than 5 MB');
      return;
    }

    try {
      const preview = await readAsDataUrl(file);
      setImagePreview(preview);
      setFormData((prev) => ({ ...prev, profileImageFile: file }));
    } catch {
      toast.error('Failed to read image');
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData((prev) => ({
      ...prev,
      profileImageFile: null,
      existingProfileImage: '',
    }));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  /* ------------------ Subject toggle ------------------ */

  const toggleSubject = (subject: string) => {
    setFormData((prev) => {
      const has = prev.selectedSubjects.includes(subject);
      return {
        ...prev,
        selectedSubjects: has
          ? prev.selectedSubjects.filter((s) => s !== subject)
          : [...prev.selectedSubjects, subject],
      };
    });
  };

  const selectAllSubjects = () => {
    setFormData((prev) => ({ ...prev, selectedSubjects: [...academySubjects] }));
  };

  const clearSubjects = () => {
    setFormData((prev) => ({ ...prev, selectedSubjects: [] }));
  };

  /* ------------------ Actions ------------------ */

  const toggleAvailability = async (
    teacherId: string,
    currentStatus: boolean
  ) => {
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
    } catch {
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
    } catch {
      toast.error('Error deleting teacher');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      /* ---------- Audio ---------- */
      let audioUrl = formData.existingAudioUrl || '';

      if (formData.audioFile) {
        toast.loading('Uploading audio...', { id: 'audio' });
        audioUrl = await uploadFile(
          formData.audioFile,
          '/api/upload-audio',
          'audio'
        );
        toast.success('Audio uploaded', { id: 'audio' });
      }

      if (!audioUrl) {
        throw new Error('Voice introduction is required');
      }

      /* ---------- Subjects ---------- */
      if (formData.selectedSubjects.length === 0) {
        throw new Error('Please select at least one subject');
      }

      /* ---------- Image (male only) ---------- */
      let profileImage = '';

      if (formData.gender === 'male') {
        if (formData.profileImageFile) {
          toast.loading('Uploading image...', { id: 'img' });
          profileImage = await uploadFile(
            formData.profileImageFile,
            '/api/upload',
            'file'
          );
          toast.success('Image uploaded', { id: 'img' });
        } else if (formData.existingProfileImage) {
          profileImage = formData.existingProfileImage;
        }
      }

      /* ---------- Payload ---------- */
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        gender: formData.gender,
        subjects: formData.selectedSubjects,
        bio: formData.bio.trim(),
        audioUrl,
        profileImage: formData.gender === 'male' ? profileImage : '',
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

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Operation failed');
      }

      toast.success(editingTeacher ? 'Teacher updated' : 'Teacher added');
      setShowModal(false);
      setEditingTeacher(null);
      resetForm();
      fetchTeachers();
    } catch (error: any) {
      toast.error(error?.message || 'Error saving teacher');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImagePreview('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);

    /* Existing subjects کو academy subjects کے ساتھ merge کر دیں
       تاکہ اگر کوئی subject اب category میں نہیں تو بھی visible ہو */
    const merged = new Set([
      ...academySubjects,
      ...(teacher.subjects || []),
    ]);

    setFormData({
      name: teacher.name,
      email: teacher.email,
      gender: teacher.gender || 'male',
      selectedSubjects: teacher.subjects || [],
      bio: teacher.bio || '',
      audioFile: null,
      existingAudioUrl: teacher.audioUrl || '',
      profileImageFile: null,
      existingProfileImage:
        teacher.gender === 'male' ? teacher.profileImage || '' : '',
    });

    /* اگر merged میں کوئی اضافی subject ہے تو اسے بھی دکھائیں */
    if (merged.size > academySubjects.length) {
      setAcademySubjects(Array.from(merged).sort());
    }

    setImagePreview(
      teacher.gender === 'male' ? teacher.profileImage || '' : ''
    );
    setShowModal(true);
  };

  /* ------------------ Derived ------------------ */

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q));

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
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Loading teachers...
          </p>
        </div>
      </div>
    );
  }

  const isMale = formData.gender === 'male';
  const isFemale = formData.gender === 'female';
  const hasSubjects = academySubjects.length > 0;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HERO */}
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

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Team"
          subtitle="Total Teachers"
          value={stats.total}
          icon={<UserGroupIcon className="h-5 w-5" />}
          gradient="from-blue-500 to-indigo-600"
          bg="bg-blue-50"
          text="text-blue-600"
        />
        <StatCard
          title="Active"
          subtitle="Available Now"
          value={stats.available}
          icon={<CheckCircleIcon className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
        <StatCard
          title="Audio"
          subtitle="With Voice Intro"
          value={stats.withAudio}
          icon={<MusicalNoteIcon className="h-5 w-5" />}
          gradient="from-purple-500 to-pink-600"
          bg="bg-purple-50"
          text="text-purple-600"
        />
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
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
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredTeachers.length}
              </span>{' '}
              of {teachers.length} teachers
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

      {/* EMPTY STATES */}
      {teachers.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-emerald-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            No Teachers Yet
          </h3>
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
          {/* DESKTOP TABLE */}
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
                    <tr
                      key={teacher._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <TeacherAvatar teacher={teacher} size={40} />
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

                      <td className="px-5 py-4">
                        {teacher.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {teacher.subjects.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                              >
                                {s}
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

                      <td className="px-5 py-4">
                        {teacher.audioUrl ? (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <MusicalNoteIcon className="h-4 w-4 text-purple-600" />
                            </div>
                            <audio controls className="h-8 w-40">
                              <source
                                src={teacher.audioUrl}
                                type="audio/mpeg"
                              />
                            </audio>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <MicrophoneIcon className="h-3.5 w-3.5" />
                            No audio
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              toggleAvailability(
                                teacher._id,
                                teacher.isAvailable
                              )
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                              teacher.isAvailable
                                ? 'bg-emerald-600'
                                : 'bg-slate-300'
                            }`}
                            aria-label="Toggle availability"
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                teacher.isAvailable
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold ${
                              teacher.isAvailable
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {teacher.isAvailable ? 'Available' : 'Away'}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(teacher)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTeacher(teacher._id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
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
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <TeacherAvatar teacher={teacher} size={48} />
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

                {teacher.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {teacher.subjects.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                      >
                        {s}
                      </span>
                    ))}
                    {teacher.subjects.length > 4 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        +{teacher.subjects.length - 4}
                      </span>
                    )}
                  </div>
                )}

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

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      toggleAvailability(teacher._id, teacher.isAvailable)
                    }
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
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTeacher(teacher._id)}
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
          MODAL
      ============================================ */}

      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => !uploading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[94vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-slate-100 p-5 sm:p-6">
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
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <form
                id="teacher-form"
                onSubmit={handleSubmit}
                className="p-5 sm:p-6 space-y-5"
              >
                {/* Name */}
                <Field
                  label="Full Name"
                  icon={<UserCircleIcon className="h-4 w-4" />}
                  required
                >
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Ahmed Khan"
                    className="input-base"
                  />
                </Field>

                {/* Email */}
                <Field
                  label="Email"
                  icon={<EnvelopeIcon className="h-4 w-4" />}
                  required
                >
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="teacher@example.com"
                    className="input-base"
                  />
                </Field>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    Gender
                    <span className="text-rose-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'male' })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all active:scale-[0.98] ${
                        isMale
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          isMale ? 'bg-blue-500 text-white' : 'bg-slate-100'
                        }`}
                      >
                        <UserIcon className="h-3.5 w-3.5" />
                      </div>
                      Male
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          gender: 'female',
                          profileImageFile: null,
                          existingProfileImage: '',
                        });
                        setImagePreview('');
                        if (imageInputRef.current) {
                          imageInputRef.current.value = '';
                        }
                      }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all active:scale-[0.98] ${
                        isFemale
                          ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          isFemale ? 'bg-pink-500 text-white' : 'bg-slate-100'
                        }`}
                      >
                        <SparklesIcon className="h-3.5 w-3.5" />
                      </div>
                      Female
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    {isMale
                      ? 'Photo upload available for male teachers'
                      : 'Photo upload not available for female teachers'}
                  </p>
                </div>

                {/* Image — Male only */}
                {isMale && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <PhotoIcon className="h-4 w-4 text-slate-400" />
                      Profile Photo
                      <span className="text-slate-400 text-xs font-normal">
                        (optional)
                      </span>
                    </label>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleImageUpload(file);
                      }}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-48 object-cover"
                        />

                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/95 hover:bg-white backdrop-blur-sm text-slate-700 text-xs font-bold shadow-md transition"
                          >
                            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/95 hover:bg-rose-600 backdrop-blur-sm text-white shadow-md transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl cursor-pointer transition group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition">
                          <PhotoIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs sm:text-sm font-semibold text-slate-700">
                            Upload profile photo
                          </p>
                          <p className="text-[11px] text-slate-400">
                            JPG, PNG up to 5 MB
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* ============================================
                    SUBJECTS — Academy کی categories سے
                ============================================ */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <BookOpenIcon className="h-4 w-4 text-slate-400" />
                      Subjects
                      <span className="text-rose-500">*</span>
                    </label>

                    {hasSubjects && !subjectsLoading && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={selectAllSubjects}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition"
                        >
                          Select All
                        </button>
                        {formData.selectedSubjects.length > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <button
                              type="button"
                              onClick={clearSubjects}
                              className="text-[11px] font-bold text-slate-500 hover:text-slate-700 transition"
                            >
                              Clear
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {subjectsLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      <div className="h-3.5 w-3.5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                      Loading academy subjects...
                    </div>
                  ) : !hasSubjects ? (
                    /* Empty state — academy میں کوئی course category نہیں */
                    <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          <InformationCircleIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-amber-900">
                            No subjects available
                          </p>
                          <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                            Add courses to your academy first — their
                            categories will appear here as selectable
                            subjects.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Selected count */}
                      {formData.selectedSubjects.length > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                          <p className="text-[11px] font-bold text-emerald-700">
                            {formData.selectedSubjects.length} selected
                          </p>
                          <p className="text-[10px] text-emerald-600 truncate max-w-[180px]">
                            {formData.selectedSubjects.join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Subject chips */}
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/40 min-h-[56px] max-h-[200px] overflow-y-auto">
                        {academySubjects.map((subject) => {
                          const isSelected = formData.selectedSubjects.includes(subject);
                          return (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => toggleSubject(subject)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                              }`}
                            >
                              {isSelected && (
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                              )}
                              {!isSelected && (
                                <TagIcon className="h-3 w-3 opacity-50" />
                              )}
                              {subject}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Bio */}
                <Field
                  label="Bio"
                  icon={<SparklesIcon className="h-4 w-4" />}
                  optional
                >
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                    placeholder="Short introduction about the teacher..."
                    className="input-base resize-none leading-relaxed"
                  />
                </Field>

                {/* Audio — Required */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MicrophoneIcon className="h-4 w-4 text-slate-400" />
                    Voice Introduction
                    <span className="text-rose-500">*</span>
                    <span className="text-slate-400 text-xs font-normal">
                      (required)
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition group ${
                      formData.audioFile
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
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
                      ) : formData.existingAudioUrl ? (
                        <>
                          <p className="text-xs sm:text-sm font-semibold text-slate-700">
                            Current audio attached
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Click to replace
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs sm:text-sm font-semibold text-slate-700">
                            Click to upload audio
                          </p>
                          <p className="text-[11px] text-slate-400">
                            MP3, WAV up to 15 MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
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
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <MusicalNoteIcon className="h-4 w-4 text-purple-600 shrink-0" />
                      <p className="text-[11px] text-slate-600 flex-1">
                        Current audio
                      </p>
                      <audio controls className="h-7 max-w-[140px]">
                        <source
                          src={editingTeacher.audioUrl}
                          type="audio/mpeg"
                        />
                      </audio>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-5 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="order-2 sm:order-1 sm:flex-1 px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="teacher-form"
                  disabled={uploading || !hasSubjects}
                  className="order-1 sm:order-2 sm:flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      {editingTeacher ? 'Save Changes' : 'Add Teacher'}
                    </>
                  )}
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

function TeacherAvatar({
  teacher,
  size = 40,
}: {
  teacher: Teacher;
  size?: number;
}) {
  const isFemale = teacher.gender === 'female';
  const hasImage = !isFemale && Boolean(teacher.profileImage);

  if (hasImage) {
    return (
      <div
        className="rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-sm"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={teacher.profileImage}
          alt={teacher.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (isFemale) {
    return (
      <div
        className="rounded-full bg-gradient-to-br from-pink-400 via-pink-500 to-fuchsia-600 flex items-center justify-center text-white shrink-0 shadow-sm"
        style={{ width: size, height: size }}
      >
        <SparklesIcon style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm"
      style={{ width: size, height: size }}
    >
      <UserIcon style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}

function StatCard({
  title,
  subtitle,
  value,
  icon,
  gradient,
  bg,
  text,
}: {
  title: string;
  subtitle: string;
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
          className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center ${text}`}
        >
          {icon}
        </div>
        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded-full ${bg} ${text}`}
        >
          {title}
        </span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
        {subtitle}
      </p>
    </div>
  );
}

function Field({
  label,
  icon,
  required,
  optional,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
        {optional && (
          <span className="text-slate-400 text-xs font-normal">(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}