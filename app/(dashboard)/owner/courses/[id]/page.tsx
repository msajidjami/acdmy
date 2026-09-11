// app/owner/courses/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
} from '@heroicons/react/24/outline';

/* ------------------ Types ------------------ */

interface Course {
  _id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------ Helpers ------------------ */

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

/* ------------------ Component ------------------ */

export default function OwnerCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    price: '',
    duration: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: '',
    isActive: true,
  });

  /* ------------------ Data ------------------ */

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/owner/courses/${courseId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Course not found');
          router.push('/owner/courses');
        }
        throw new Error('Failed to fetch course');
      }
      const data = await res.json();
      setCourse(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        image: data.image || '',
        price: data.price.toString(),
        duration: data.duration || '',
        level: data.level,
        category: data.category || '',
        isActive: data.isActive,
      });
    } catch (error) {
      toast.error('Error loading course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  /* ------------------ Actions ------------------ */

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
    };

    try {
      const res = await fetch(`/api/owner/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Update failed');
      }

      const updated = await res.json();
      setCourse(updated);
      setEditing(false);
      toast.success('Course updated successfully');
      setFormData({
        title: updated.title,
        description: updated.description || '',
        image: updated.image || '',
        price: updated.price.toString(),
        duration: updated.duration || '',
        level: updated.level,
        category: updated.category || '',
        isActive: updated.isActive,
      });
    } catch (error: any) {
      toast.error(error.message || 'Error updating course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/owner/courses/${courseId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Course deleted');
      router.push('/owner/courses');
    } catch (error) {
      toast.error('Error deleting course');
    }
  };

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Loading course...</p>
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

  const level = LEVEL_META[course.level];

  /* ------------------ Render ------------------ */

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ============================================
          BACK BUTTON
      ============================================ */}
      <Link
        href="/owner/courses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition group"
      >
        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Courses
      </Link>

      {/* ============================================
          HERO HEADER
      ============================================ */}
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
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-800 shadow-sm`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
                    {level.label}
                  </span>
                  {course.category && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-slate-700 shadow-sm">
                      <TagIcon className="h-3 w-3" />
                      {course.category}
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

      {/* ============================================
          CONTENT
      ============================================ */}
      {!editing ? (
        <div className="space-y-4">
          {/* Image */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {course.image ? (
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-56 sm:h-72 object-cover"
              />
            ) : (
              <div className="w-full h-56 sm:h-72 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center relative">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/10 rounded-full" />
                <BookOpenIcon className="h-16 w-16 text-white relative z-10 drop-shadow-lg" />
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <CurrencyDollarIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Price
                </p>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {course.price > 0 ? `$${course.price}` : 'Free'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Duration
                </p>
              </div>
              <p className="text-lg font-bold text-slate-900 truncate">
                {course.duration || '—'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AcademicCapIcon className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Level
                </p>
              </div>
              <p className="text-lg font-bold text-slate-900 capitalize">
                {course.level}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TagIcon className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Category
                </p>
              </div>
              <p className="text-lg font-bold text-slate-900 truncate">
                {course.category || '—'}
              </p>
            </div>
          </div>

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
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Created
                  </p>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">
                    {new Date(course.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <ClockIcon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Last Updated
                  </p>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">
                    {new Date(course.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <EyeIcon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Visibility
                  </p>
                  <p
                    className={`text-xs sm:text-sm font-semibold mt-0.5 ${
                      course.isActive ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    {course.isActive ? 'Visible to students' : 'Hidden'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <GlobeAltIcon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Course ID
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    {course._id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================
            EDIT FORM
        ============================================ */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Form header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <PencilIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Edit Course</h2>
                <p className="text-[11px] text-slate-500">
                  Update the course information below
                </p>
              </div>
            </div>

            <button
              onClick={() => setEditing(false)}
              disabled={submitting}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form body */}
          <form onSubmit={handleUpdate} className="p-5 sm:p-6 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <label
                htmlFor="edit-title"
                className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <BookOpenIcon className="h-3.5 w-3.5 text-slate-400" />
                Course Title
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="edit-description"
                className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <SparklesIcon className="h-3.5 w-3.5 text-slate-400" />
                Description
              </label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm resize-none leading-relaxed"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label
                htmlFor="edit-image"
                className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <PhotoIcon className="h-3.5 w-3.5 text-slate-400" />
                Cover Image URL
              </label>
              <input
                id="edit-image"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
              />
              {formData.image && (
                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Price + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="edit-price"
                  className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <CurrencyDollarIcon className="h-3.5 w-3.5 text-slate-400" />
                  Price ($)
                </label>
                <input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-duration"
                  className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                  Duration
                </label>
                <input
                  id="edit-duration"
                  type="text"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="4 weeks"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Level + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="edit-level"
                  className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <AcademicCapIcon className="h-3.5 w-3.5 text-slate-400" />
                  Level
                </label>
                <select
                  id="edit-level"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level: e.target.value as typeof formData.level,
                    })
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-category"
                  className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <TagIcon className="h-3.5 w-3.5 text-slate-400" />
                  Category
                </label>
                <input
                  id="edit-category"
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Quran, Math"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                />
              </div>
            </div>

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
                disabled={submitting}
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
                disabled={submitting}
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