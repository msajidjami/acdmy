// app/owner/courses/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
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

const GRADIENTS = [
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-blue-500 via-cyan-500 to-teal-500',
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-violet-500 via-purple-500 to-indigo-500',
];

/* ------------------ Component ------------------ */

export default function OwnerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
  const [submitting, setSubmitting] = useState(false);

  /* ------------------ Data ------------------ */

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/owner/courses');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCourses(data);
    } catch (error) {
      toast.error('Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  /* ------------------ Actions ------------------ */

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      price: '',
      duration: '',
      level: 'beginner',
      category: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
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
        const errorData = await res.json();
        throw new Error(errorData.error || 'Operation failed');
      }

      toast.success(editingCourse ? 'Course updated' : 'Course added');
      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Error saving course');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/owner/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Course deleted');
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      toast.error('Error deleting course');
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      image: course.image || '',
      price: course.price.toString(),
      duration: course.duration || '',
      level: course.level,
      category: course.category || '',
      isActive: course.isActive,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingCourse(null);
    resetForm();
    setShowModal(true);
  };

  /* ------------------ Derived ------------------ */

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase());

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
    }),
    [courses]
  );

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Loading courses...</p>
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
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap shrink-0"
          >
            <PlusIcon className="h-4 w-4" />
            Add Course
          </button>
        </div>
      </div>

      {/* ============================================
          STATS CARDS
      ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center">
              <BookOpenIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
              Total
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">All Courses</p>
        </div>

        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
              Live
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.active}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Active Courses</p>
        </div>

        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
              Free
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.free}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Free Courses</p>
        </div>
      </div>

      {/* ============================================
          SEARCH + FILTERS
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
            />
          </div>

          {/* Level filter */}
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

          {/* Status filter */}
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

          {/* View toggle */}
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

      {/* ============================================
          EMPTY STATES
      ============================================ */}
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
        /* ============================================
            GRID VIEW
        ============================================ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses.map((course, idx) => {
            const gradient = GRADIENTS[idx % GRADIENTS.length];
            const level = LEVEL_META[course.level];

            return (
              <div
                key={course._id}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Image / Cover */}
                <div className="relative h-44 sm:h-48 overflow-hidden">
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`}
                    >
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
                      <BookOpenIcon className="h-12 w-12 text-white relative z-10 drop-shadow-lg" />
                    </div>
                  )}

                  {/* Status badge */}
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

                  {/* Price badge */}
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
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${level.classes}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
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

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed flex-1">
                    {course.description || 'No description provided.'}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
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

                  {/* Actions */}
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
        /* ============================================
            LIST VIEW
        ============================================ */
        <div className="space-y-3">
          {filteredCourses.map((course, idx) => {
            const gradient = GRADIENTS[idx % GRADIENTS.length];
            const level = LEVEL_META[course.level];

            return (
              <div
                key={course._id}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-transparent hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="w-full sm:w-40 h-32 sm:h-auto shrink-0 relative overflow-hidden">
                    {course.image ? (
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
                      >
                        <BookOpenIcon className="h-10 w-10 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-4 sm:p-5 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${level.classes}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
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
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {course.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
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
                        </div>
                      </div>

                      {/* Actions */}
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

      {/* ============================================
          MODAL
      ============================================ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 sm:px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center ${
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
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
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
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <label
                  htmlFor="course-title"
                  className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <BookOpenIcon className="h-3.5 w-3.5 text-slate-400" />
                  Course Title
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="course-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g. Advanced Tajweed"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="course-description"
                  className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <SparklesIcon className="h-3.5 w-3.5 text-slate-400" />
                  Description
                </label>
                <textarea
                  id="course-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="What will students learn in this course?"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm resize-none placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <label
                  htmlFor="course-image"
                  className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <PhotoIcon className="h-3.5 w-3.5 text-slate-400" />
                  Cover Image URL
                </label>
                <input
                  id="course-image"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="course-price"
                    className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <CurrencyDollarIcon className="h-3.5 w-3.5 text-slate-400" />
                    Price ($)
                  </label>
                  <input
                    id="course-price"
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
                    htmlFor="course-duration"
                    className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                    Duration
                  </label>
                  <input
                    id="course-duration"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="course-level"
                    className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <AcademicCapIcon className="h-3.5 w-3.5 text-slate-400" />
                    Level
                  </label>
                  <select
                    id="course-level"
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
                    htmlFor="course-category"
                    className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <TagIcon className="h-3.5 w-3.5 text-slate-400" />
                    Category
                  </label>
                  <input
                    id="course-category"
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
                      {editingCourse ? 'Save Changes' : 'Add Course'}
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