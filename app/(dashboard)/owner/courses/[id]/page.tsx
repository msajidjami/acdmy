// app/owner/courses/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  TagIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  CalendarIcon,
  GlobeAltIcon,
  EyeIcon,
  PencilIcon,
  BookmarkIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  SwatchIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import CourseProgressSection from './progress-section';

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

/* ✅ 10 MB — server پر check ہوگا */
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/* ============================================================
   COMPONENT
   ============================================================ */

export default function OwnerCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params?.id || '');

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  /* Image upload state */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ------------------ Fetch ------------------ */

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/owner/courses/${courseId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Course not found');
          router.push('/owner/courses');
          return;
        }
        throw new Error('Failed to fetch course');
      }
      const data = (await res.json()) as Course;
      setCourse(data);

      setFormData({
        title: data.title || '',
        description: data.description || '',
        image: data.image || '',
        thumbnail: data.thumbnail || '',
        bookTitle: data.bookTitle || '',
        price: data.price != null ? String(data.price) : '',
        duration: data.duration || '',
        level: data.level || 'beginner',
        category: data.category || '',
        isActive: data.isActive !== false,
        totalPages: data.totalPages != null ? String(data.totalPages) : '',
        accentColor: data.accentColor || '#6366f1',
      });

      setImagePreview(data.thumbnail || data.image || '');

      const img = data.image || '';
      setImageMode(
        img.startsWith('data:') || img.startsWith('/uploads/')
          ? 'upload'
          : img
          ? 'url'
          : 'upload'
      );

      setImageError('');
    } catch {
      toast.error('Error loading course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  /* ============================================================
     IMAGE HANDLING — File Upload to /api/upload
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
      /* ✅ Upload to server — returns /uploads/xxx.jpg */
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

  /* ------------------ Update ------------------ */

  const handleUpdate = async (e: React.FormEvent) => {
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
      const res = await fetch(`/api/owner/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Update failed');
      }

      const updated = (await res.json()) as Course;
      setCourse(updated);
      setEditing(false);
      toast.success('Course updated successfully');

      setFormData({
        title: updated.title || '',
        description: updated.description || '',
        image: updated.image || '',
        thumbnail: updated.thumbnail || '',
        bookTitle: updated.bookTitle || '',
        price: updated.price != null ? String(updated.price) : '',
        duration: updated.duration || '',
        level: updated.level || 'beginner',
        category: updated.category || '',
        isActive: updated.isActive !== false,
        totalPages:
          updated.totalPages != null ? String(updated.totalPages) : '',
        accentColor: updated.accentColor || '#6366f1',
      });

      setImagePreview(updated.thumbnail || updated.image || '');
    } catch (error: any) {
      toast.error(error?.message || 'Error updating course');
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------ Delete ------------------ */

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/owner/courses/${courseId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Course deleted');
      router.push('/owner/courses');
    } catch {
      toast.error('Error deleting course');
    }
  };

  /* ------------------ Escape key ------------------ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editing && !submitting) {
        setEditing(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, submitting]);

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Loading course...
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <XCircleIcon className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Course not found</h2>
        <p className="text-slate-500 mt-2 text-sm">
          The course you&apos;re looking for doesn&apos;t exist or was removed.
        </p>
        <button
          onClick={() => router.push('/owner/courses')}
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Courses
        </button>
      </div>
    );
  }

  const level = LEVEL_META[course.level] || LEVEL_META.beginner;
  const accent = course.accentColor || '#6366f1';
  const cover = course.thumbnail || course.image;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* BACK BUTTON */}
      <Link
        href="/owner/courses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition group"
      >
        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Courses
      </Link>

      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <BookOpenIcon className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <SparklesIcon className="h-3 w-3" />
                Course Details
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight">
                {editing ? 'Edit Course' : course.title}
              </h1>

              {!editing && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-800 shadow-sm">
                    <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
                    {level.label}
                  </span>
                  {course.category && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-slate-700 shadow-sm">
                      <TagIcon className="h-3 w-3" />
                      {course.category}
                    </span>
                  )}
                  {course.totalPages > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-slate-700 shadow-sm">
                      <BookmarkIcon className="h-3 w-3" />
                      {course.totalPages} pages
                    </span>
                  )}
                  {course.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm">
                      <CheckCircleIcon className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500 text-white shadow-sm">
                      <XCircleIcon className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {!editing && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm rounded-xl shadow-lg transition"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm rounded-xl shadow-lg transition"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {!editing ? (
        <div className="space-y-4">
          {/* Cover Image */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={course.title}
                className="w-full h-56 sm:h-72 object-cover"
              />
            ) : (
              <div
                className="w-full h-56 sm:h-72 flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}bb, ${accent}88)`,
                }}
              >
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/10 rounded-full" />
                <BookOpenIcon className="h-16 w-16 text-white relative z-10 drop-shadow-lg" />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatBox
              icon={<CurrencyDollarIcon className="h-4 w-4" />}
              label="Price"
              value={course.price > 0 ? `$${course.price}` : 'Free'}
              bg="bg-indigo-50"
              text="text-indigo-600"
            />
            <StatBox
              icon={<ClockIcon className="h-4 w-4" />}
              label="Duration"
              value={course.duration || '—'}
              bg="bg-emerald-50"
              text="text-emerald-600"
            />
            <StatBox
              icon={<AcademicCapIcon className="h-4 w-4" />}
              label="Level"
              value={level.label}
              bg="bg-amber-50"
              text="text-amber-600"
            />
            <StatBox
              icon={<BookmarkIcon className="h-4 w-4" />}
              label="Book Pages"
              value={course.totalPages > 0 ? String(course.totalPages) : '—'}
              bg="bg-purple-50"
              text="text-purple-600"
            />
          </div>

          {/* Book Info */}
          {course.bookTitle && (
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-11 w-11 rounded-xl bg-purple-500 flex items-center justify-center shadow-md shadow-purple-500/30">
                  <BookmarkIcon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">
                    Assigned Book
                  </p>
                  <p className="mt-1 text-base font-bold text-purple-900 truncate">
                    {course.bookTitle}
                  </p>
                  {course.totalPages > 0 && (
                    <p className="mt-0.5 text-xs text-purple-700">
                      {course.totalPages} pages · teachers will log progress
                      against these pages
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Description</h2>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {course.description || 'No description provided.'}
            </p>
          </div>

          {/* Student Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <ChartBarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Student Progress
                </h2>
                <p className="text-[11px] text-slate-500">
                  Book pages covered by each student
                </p>
              </div>
            </div>

            <CourseProgressSection
              courseId={course._id}
              accentColor={accent}
            />
          </div>

          {/* Meta Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">
                Course Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetaTile
                icon={<CalendarIcon className="h-4 w-4" />}
                label="Created"
                value={new Date(course.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />

              <MetaTile
                icon={<ClockIcon className="h-4 w-4" />}
                label="Last Updated"
                value={new Date(course.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />

              <MetaTile
                icon={<EyeIcon className="h-4 w-4" />}
                label="Visibility"
                value={course.isActive ? 'Visible to students' : 'Hidden'}
                valueClass={
                  course.isActive ? 'text-emerald-600' : 'text-slate-500'
                }
              />

              <MetaTile
                icon={<GlobeAltIcon className="h-4 w-4" />}
                label="Course ID"
                value={course._id}
                mono
              />
            </div>
          </div>
        </div>
      ) : (
        /* EDIT MODE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Form header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <PencilIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Edit Course
                </h2>
                <p className="text-[11px] text-slate-500">
                  Update the course information below
                </p>
              </div>
            </div>

            <button
              onClick={() => !submitting && setEditing(false)}
              disabled={submitting}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="p-5 sm:p-6 space-y-5">
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
                rows={4}
                className="input-base resize-none leading-relaxed"
              />
            </Field>

            {/* IMAGE UPLOAD */}
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
                    setFormData({ ...formData, totalPages: e.target.value })
                  }
                  placeholder="e.g. 200"
                  className="input-base"
                />
              </Field>
            </div>

            {/* Price + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <Field label="Category" icon={<TagIcon className="h-3.5 w-3.5" />}>
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
                    setFormData({ ...formData, accentColor: e.target.value })
                  }
                  className="h-8 w-10 rounded-lg border border-slate-200 cursor-pointer p-0"
                  title="Custom color"
                />

                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) =>
                    setFormData({ ...formData, accentColor: e.target.value })
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={submitting || uploading}
                className="flex-1 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function StatBox({
  icon,
  label,
  value,
  bg,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  text: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center ${text}`}
        >
          {icon}
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
    </div>
  );
}

function MetaTile({
  icon,
  label,
  value,
  valueClass,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
      <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm text-slate-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p
          className={`mt-0.5 ${
            mono ? 'text-[11px] font-mono truncate' : 'text-xs sm:text-sm'
          } ${valueClass || 'text-slate-800 font-medium'}`}
        >
          {value}
        </p>
      </div>
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