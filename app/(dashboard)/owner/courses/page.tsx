// app/owner/courses/page.tsx
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  TagIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BookmarkIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  SwatchIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

/* ============================================================
   TYPES
   ============================================================ */

interface Course {
  _id: string;
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  bookTitle: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  isActive: boolean;
  totalPages: number;
  accentColor: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  bookTitle: string;
  price: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  isActive: boolean;
  totalPages: string;
  accentColor: string;
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const LEVEL_META = {
  beginner: {
    label: 'Beginner',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dot: 'bg-emerald-500',
  },
  intermediate: {
    label: 'Intermediate',
    classes: 'bg-amber-50 text-amber-700 border-amber-100',
    dot: 'bg-amber-500',
  },
  advanced: {
    label: 'Advanced',
    classes: 'bg-rose-50 text-rose-700 border-rose-100',
    dot: 'bg-rose-500',
  },
} as const;

const GRADIENTS = [
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-blue-500 via-cyan-500 to-teal-500',
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-violet-500 via-purple-500 to-indigo-500',
];

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  image: '',
  thumbnail: '',
  bookTitle: '',
  price: '',
  duration: '',
  level: 'beginner',
  category: '',
  isActive: true,
  totalPages: '',
  accentColor: '#6366f1',
};

const ACCENT_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#14b8a6',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
];

/* ✅ 10 MB — server پر check ہوگا */
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/* ============================================================
   COMPONENT
   ============================================================ */

export default function OwnerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<
    'all' | 'beginner' | 'intermediate' | 'advanced'
  >('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Image upload state */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ------------------ Data ------------------ */

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/owner/courses');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  /* ============================================================
     IMAGE HANDLING — Upload to /api/upload
     ============================================================ */

  const validateImage = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file (JPG, PNG, WebP)';
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      return 'Image must be smaller than 10 MB';
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const error = validateImage(file);
    if (error) {
      setImageError(error);
      toast.error(error);
      return;
    }

    setImageError('');
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Upload failed');
      }

      const url = String(data.url);
      setImagePreview(url);
      setFormData((prev) => ({
        ...prev,
        image: url,
        thumbnail: url,
      }));

      toast.success('Image uploaded');
    } catch (err: any) {
      setImageError(err?.message || 'Failed to upload image');
      toast.error(err?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setImageError('');
    setFormData((prev) => ({ ...prev, image: '', thumbnail: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url, thumbnail: url }));
    setImagePreview(url);
    setImageError('');
  };

  /* ------------------ Actions ------------------ */

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImagePreview('');
    setImageError('');
    setImageMode('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      image: formData.image.trim(),
      thumbnail: formData.thumbnail.trim() || formData.image.trim(),
      bookTitle: formData.bookTitle.trim(),
      price: Number(formData.price) || 0,
      duration: formData.duration.trim(),
      level: formData.level,
      category: formData.category.trim(),
      isActive: formData.isActive,
      totalPages: Math.max(0, Math.floor(Number(formData.totalPages) || 0)),
      accentColor: formData.accentColor || '#6366f1',
    };

    try {
      const url = editingCourse
        ? `/api/owner/courses/${editingCourse._id}`
        : '/api/owner/courses';
      const method = editingCourse ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Operation failed');
      }

      toast.success(editingCourse ? 'Course updated' : 'Course added');
      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Error saving course');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/owner/courses/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Course deleted');
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch {
      toast.error('Error deleting course');
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      image: course.image || '',
      thumbnail: course.thumbnail || '',
      bookTitle: course.bookTitle || '',
      price: course.price != null ? String(course.price) : '',
      duration: course.duration || '',
      level: course.level || 'beginner',
      category: course.category || '',
      isActive: course.isActive !== false,
      totalPages: course.totalPages != null ? String(course.totalPages) : '',
      accentColor: course.accentColor || '#6366f1',
    });
    setImagePreview(course.thumbnail || course.image || '');

    const img = course.image || '';
    setImageMode(
      img.startsWith('data:') || img.startsWith('/uploads/')
        ? 'upload'
        : img
        ? 'url'
        : 'upload'
    );
    setImageError('');
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingCourse(null);
    resetForm();
    setShowModal(true);
  };

  /* ------------------ Escape key ------------------ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal && !submitting) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal, submitting]);

  /* ------------------ Derived ------------------ */

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.bookTitle?.toLowerCase().includes(q);

      const matchesLevel = filterLevel === 'all' || c.level === filterLevel;

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && c.isActive) ||
        (filterStatus === 'inactive' && !c.isActive);

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [courses, searchQuery, filterLevel, filterStatus]);

  const stats = useMemo(
    () => ({
      total: courses.length,
      active: courses.filter((c) => c.isActive).length,
      free: courses.filter((c) => c.price === 0).length,
      withBooks: courses.filter((c) => c.totalPages > 0).length,
    }),
    [courses]
  );

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Loading courses...
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
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <BookOpenIcon className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <SparklesIcon className="h-3 w-3" />
                Course Management
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight">
                Courses
              </h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base max-w-lg">
                Create, organize, and publish courses for your academy.
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap shrink-0 active:scale-95"
          >
            <PlusIcon className="h-4 w-4" />
            Add Course
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          subtitle="All Courses"
          value={stats.total}
          icon={<BookOpenIcon className="h-5 w-5" />}
          gradient="from-indigo-500 to-purple-600"
          bg="bg-indigo-50"
          text="text-indigo-600"
        />
        <StatCard
          title="Active"
          subtitle="Active Courses"
          value={stats.active}
          icon={<CheckCircleIcon className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
        <StatCard
          title="Free"
          subtitle="Free Courses"
          value={stats.free}
          icon={<SparklesIcon className="h-5 w-5" />}
          gradient="from-amber-500 to-orange-600"
          bg="bg-amber-50"
          text="text-amber-600"
        />
        <StatCard
          title="With Books"
          subtitle="Courses with Books"
          value={stats.withBooks}
          icon={<BookmarkIcon className="h-5 w-5" />}
          gradient="from-fuchsia-500 to-pink-600"
          bg="bg-fuchsia-50"
          text="text-fuchsia-600"
        />
      </div>

      {/* SEARCH + FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, book, or category..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
            <FunnelIcon className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
            {(
              [
                { key: 'all', label: 'All Levels' },
                { key: 'beginner', label: 'Beginner' },
                { key: 'intermediate', label: 'Inter.' },
                { key: 'advanced', label: 'Advanced' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilterLevel(opt.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  filterLevel === opt.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
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

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:bg-white'
              }`}
              aria-label="Grid view"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:bg-white'
              }`}
              aria-label="List view"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(searchQuery || filterLevel !== 'all' || filterStatus !== 'all') && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredCourses.length}
              </span>{' '}
              of {courses.length} courses
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterLevel('all');
                setFilterStatus('all');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* EMPTY STATES */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-indigo-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            No Courses Yet
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
            Start adding courses to your academy and attract more students.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 mt-6 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 transition"
          >
            <PlusIcon className="h-5 w-5" />
            Add Your First Course
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <MagnifyingGlassIcon className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No matches found</h3>
          <p className="text-slate-500 mt-1 text-sm">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses.map((course, idx) => {
            const fallbackGradient = GRADIENTS[idx % GRADIENTS.length];
            const accent = course.accentColor || '#6366f1';
            const level = LEVEL_META[course.level] || LEVEL_META.beginner;
            const cover = course.thumbnail || course.image;

            return (
              <div
                key={course._id}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div
                  className="h-1"
                  style={{
                    background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                  }}
                />

                <div className="relative h-44 sm:h-48 overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center relative`}
                    >
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
                      <BookOpenIcon className="h-12 w-12 text-white relative z-10 drop-shadow-lg" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    {course.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-sm text-emerald-700 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-sm text-slate-500 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    {course.price > 0 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-indigo-700 shadow-sm">
                        ${course.price}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
                        FREE
                      </span>
                    )}
                  </div>

                  {course.totalPages > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-sm text-white shadow-sm">
                        <BookmarkIcon className="h-3 w-3" />
                        {course.totalPages} pages
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${level.classes}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${level.dot}`}
                      />
                      {level.label}
                    </span>
                    {course.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        <TagIcon className="h-2.5 w-2.5" />
                        {course.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                    {course.title}
                  </h3>

                  {course.bookTitle && (
                    <p className="mt-1 text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <BookmarkIcon className="h-3 w-3 text-slate-400 shrink-0" />
                      {course.bookTitle}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed flex-1">
                    {course.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500 flex-wrap">
                    {course.duration && (
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {course.duration}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <AcademicCapIcon className="h-3 w-3" />
                      {level.label}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/owner/courses/${course._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      View
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(course)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        aria-label="Edit course"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCourse(course._id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        aria-label="Delete course"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {filteredCourses.map((course, idx) => {
            const fallbackGradient = GRADIENTS[idx % GRADIENTS.length];
            const level = LEVEL_META[course.level] || LEVEL_META.beginner;
            const cover = course.thumbnail || course.image;

            return (
              <div
                key={course._id}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-transparent hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-40 h-32 sm:h-auto shrink-0 relative overflow-hidden">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}
                      >
                        <BookOpenIcon className="h-10 w-10 text-white drop-shadow-lg" />
                      </div>
                    )}

                    {course.totalPages > 0 && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-sm text-white">
                        <BookmarkIcon className="h-2.5 w-2.5" />
                        {course.totalPages}p
                      </span>
                    )}
                  </div>

                  <div className="flex-1 p-4 sm:p-5 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${level.classes}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${level.dot}`}
                            />
                            {level.label}
                          </span>
                          {course.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                              <TagIcon className="h-2.5 w-2.5" />
                              {course.category}
                            </span>
                          )}
                          {!course.isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              Inactive
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                          {course.title}
                        </h3>

                        {course.bookTitle && (
                          <p className="mt-0.5 text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <BookmarkIcon className="h-3 w-3 text-slate-400 shrink-0" />
                            {course.bookTitle}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {course.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                          {course.duration && (
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {course.duration}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <CurrencyDollarIcon className="h-3 w-3" />
                            {course.price > 0 ? `$${course.price}` : 'Free'}
                          </span>
                          {course.totalPages > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <BookmarkIcon className="h-3 w-3" />
                              {course.totalPages} pages
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/owner/courses/${course._id}`}
                          className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          aria-label="View course"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(course)}
                          className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          aria-label="Edit course"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCourse(course._id)}
                          className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          aria-label="Delete course"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================
          MODAL — CREATE / EDIT
      ============================================================ */}

      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => !submitting && !uploading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[94vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="shrink-0 bg-white border-b border-slate-100 px-5 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      editingCourse
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {editingCourse ? (
                      <PencilSquareIcon className="h-5 w-5" />
                    ) : (
                      <PlusIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </h2>
                    <p className="text-[11px] text-slate-500 truncate">
                      {editingCourse
                        ? 'Update course information'
                        : 'Fill in the details below'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !submitting && setShowModal(false)}
                  disabled={submitting}
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 shrink-0"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal scroll area */}
            <div className="flex-1 overflow-y-auto">
              <form
                id="course-form"
                onSubmit={handleSubmit}
                className="p-5 sm:p-6 space-y-5"
              >
                {/* Title */}
                <Field
                  label="Course Title"
                  icon={<BookOpenIcon className="h-3.5 w-3.5" />}
                  required
                >
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="e.g. Advanced Tajweed"
                    className="input-base"
                  />
                </Field>

                {/* Description */}
                <Field
                  label="Description"
                  icon={<SparklesIcon className="h-3.5 w-3.5" />}
                >
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="What will students learn in this course?"
                    className="input-base resize-none leading-relaxed"
                  />
                </Field>

                {/* ============================================
                    IMAGE UPLOAD
                ============================================ */}

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <PhotoIcon className="h-3.5 w-3.5 text-slate-400" />
                      Cover Image
                    </label>

                    <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setImageMode('upload')}
                        className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-bold transition ${
                          imageMode === 'upload'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <ArrowUpTrayIcon className="h-3 w-3" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode('url')}
                        className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-bold transition ${
                          imageMode === 'url'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <LinkIcon className="h-3 w-3" />
                        URL
                      </button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Course cover"
                        className="w-full h-52 object-cover"
                      />

                      {/* Uploading overlay */}
                      {uploading && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                          <div className="text-center">
                            <ArrowPathIcon className="mx-auto h-8 w-8 text-white animate-spin" />
                            <p className="mt-2 text-xs font-bold text-white">
                              Uploading...
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/95 hover:bg-white backdrop-blur-sm text-slate-700 text-xs font-bold shadow-md transition disabled:opacity-60"
                        >
                          <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={uploading}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/95 hover:bg-rose-600 backdrop-blur-sm text-white shadow-md transition disabled:opacity-60"
                          title="Remove image"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {!uploading && (
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                            <CheckCircleIcon className="h-3 w-3" />
                            Image Ready
                          </span>
                        </div>
                      )}
                    </div>
                  ) : imageMode === 'upload' ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 text-center ${
                        isDragging
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                      } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      <div
                        className={`mx-auto h-14 w-14 rounded-2xl flex items-center justify-center shadow-md transition-transform ${
                          isDragging
                            ? 'bg-indigo-500 scale-110'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        }`}
                      >
                        {uploading ? (
                          <ArrowPathIcon className="h-7 w-7 text-white animate-spin" />
                        ) : (
                          <ArrowUpTrayIcon className="h-7 w-7 text-white" />
                        )}
                      </div>

                      <p className="mt-4 text-sm font-bold text-slate-800">
                        {uploading
                          ? 'Uploading...'
                          : isDragging
                          ? 'Drop image here'
                          : 'Click to upload or drag & drop'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        JPG, PNG, WebP · Max 10 MB
                      </p>

                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        <PhotoIcon className="h-3 w-3" />
                        Choose from device
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          type="url"
                          value={
                            formData.image.startsWith('data:') ||
                            formData.image.startsWith('/uploads/')
                              ? ''
                              : formData.image
                          }
                          onChange={(e) => handleUrlChange(e.target.value)}
                          placeholder="https://example.com/cover.jpg"
                          className="input-base pl-10"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Paste a public image URL (jpg, png, webp)
                      </p>
                    </div>
                  )}

                  {imageError && (
                    <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5">
                      <XCircleIcon className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-rose-700 font-semibold">
                        {imageError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Book Title + Total Pages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Book Title"
                    icon={<BookmarkIcon className="h-3.5 w-3.5" />}
                  >
                    <input
                      type="text"
                      value={formData.bookTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, bookTitle: e.target.value })
                      }
                      placeholder="e.g. Quran Juz 1"
                      className="input-base"
                    />
                  </Field>

                  <Field
                    label="Total Book Pages"
                    icon={<BookmarkIcon className="h-3.5 w-3.5" />}
                  >
                    <input
                      type="number"
                      min="0"
                      value={formData.totalPages}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalPages: e.target.value,
                        })
                      }
                      placeholder="e.g. 200"
                      className="input-base"
                    />
                  </Field>
                </div>

                {/* Price + Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Price ($)"
                    icon={<CurrencyDollarIcon className="h-3.5 w-3.5" />}
                  >
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0"
                      className="input-base"
                    />
                  </Field>

                  <Field
                    label="Duration"
                    icon={<ClockIcon className="h-3.5 w-3.5" />}
                  >
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="4 weeks"
                      className="input-base"
                    />
                  </Field>
                </div>

                {/* Level + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Level"
                    icon={<AcademicCapIcon className="h-3.5 w-3.5" />}
                  >
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: e.target.value as FormData['level'],
                        })
                      }
                      className="input-base cursor-pointer"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </Field>

                  <Field
                    label="Category"
                    icon={<TagIcon className="h-3.5 w-3.5" />}
                  >
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="Quran, Math"
                      className="input-base"
                    />
                  </Field>
                </div>

                {/* Accent Color */}
                <Field
                  label="Accent Color"
                  icon={<SwatchIcon className="h-3.5 w-3.5" />}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, accentColor: c })
                        }
                        className={`h-8 w-8 rounded-lg border-2 transition hover:scale-110 active:scale-95 ${
                          formData.accentColor.toLowerCase() === c.toLowerCase()
                            ? 'border-slate-900 ring-2 ring-slate-900/20'
                            : 'border-slate-200'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Use ${c}`}
                      />
                    ))}

                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accentColor: e.target.value,
                        })
                      }
                      className="h-8 w-10 rounded-lg border border-slate-200 cursor-pointer p-0"
                      title="Custom color"
                    />

                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accentColor: e.target.value,
                        })
                      }
                      className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-mono"
                    />
                  </div>
                </Field>

                {/* Active toggle */}
                <label className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-white transition">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        formData.isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {formData.isActive ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <XCircleIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formData.isActive
                          ? 'Visible to students'
                          : 'Hidden from students'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </label>
              </form>
            </div>

            {/* Modal footer */}
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-5 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting || uploading}
                  className="order-2 sm:order-1 sm:flex-1 px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="course-form"
                  disabled={submitting || uploading}
                  className="order-1 sm:order-2 sm:flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : uploading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      {editingCourse ? 'Save Changes' : 'Add Course'}
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
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}