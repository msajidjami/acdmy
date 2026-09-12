'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Search,
  X,
  Filter,
  ArrowRight,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  Award,
  Layers,
  Target,
  Play,
  GraduationCap,
  BookMarked,
  History,
  LayoutGrid,
  List,
  Star,
  Activity,
} from 'lucide-react';
import ProgressRing from '@/app/components/ProgressRing';

/* ======================================================
   Types
   ====================================================== */

type CourseRow = {
  _id: string;
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  bookTitle: string;
  level: string;
  category: string;
  duration: string;
  price: number;
  totalPages: number;
  accentColor: string;
  isActive: boolean;
  teacherNames: string[];
  teacherCount: number;
  pagesCompleted: number;
  pagesRemaining: number;
  percent: number;
  sessionsCount: number;
  lastSessionAt: string | null;
  isCompleted: boolean;
  hasProgress: boolean;
};

type Props = {
  student: {
    _id: string;
    name: string;
    email: string;
    classLevel: string;
    imageUrl: string;
  };
  academy: { _id: string; name: string } | null;
  courses: CourseRow[];
};

/* ======================================================
   Constants
   ====================================================== */

const LEVEL_META: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  beginner: {
    label: 'Beginner',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  intermediate: {
    label: 'Intermediate',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  advanced: {
    label: 'Advanced',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
};

/* ======================================================
   Helpers
   ====================================================== */

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* ======================================================
   Main Component
   ====================================================== */

export default function CoursesView({ student, academy, courses }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'progress' | 'completed' | 'not-started'
  >('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  /* ---------- Stats ---------- */

  const stats = useMemo(() => {
    const total = courses.length;
    const completed = courses.filter((c) => c.isCompleted).length;
    const inProgress = courses.filter(
      (c) => c.hasProgress && !c.isCompleted
    ).length;
    const notStarted = total - completed - inProgress;
    const totalPagesDone = courses.reduce(
      (sum, c) => sum + c.pagesCompleted,
      0
    );
    const totalPagesAll = courses.reduce((sum, c) => sum + c.totalPages, 0);
    const avgPercent =
      total > 0
        ? Math.round(
            courses.reduce((sum, c) => sum + c.percent, 0) / total
          )
        : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      totalPagesDone,
      totalPagesAll,
      avgPercent,
    };
  }, [courses]);

  /* ---------- Filter ---------- */

  const filtered = useMemo(() => {
    let list = [...courses];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.bookTitle.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.teacherNames.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'progress') {
      list = list.filter((c) => c.hasProgress && !c.isCompleted);
    } else if (statusFilter === 'completed') {
      list = list.filter((c) => c.isCompleted);
    } else if (statusFilter === 'not-started') {
      list = list.filter((c) => !c.hasProgress);
    }

    return list;
  }, [courses, search, statusFilter]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  /* ======================================================
     Render
     ====================================================== */

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============================================
          HERO HEADER
      ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-teal-300/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              My Courses
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              My Courses 📚
            </h1>

            <p className="mt-2 text-cyan-50 text-sm sm:text-base">
              {academy?.name
                ? `Your enrolled courses at ${academy.name}`
                : 'Your enrolled courses'}
            </p>

            {/* Overall progress pill */}
            {stats.totalPagesAll > 0 && (
              <div className="mt-4 inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25">
                <TrendingUp className="h-4 w-4" />
                <div className="text-xs sm:text-sm font-semibold">
                  Overall:{' '}
                  <span className="font-mono font-bold">
                    {stats.totalPagesDone}/{stats.totalPagesAll}
                  </span>{' '}
                  pages ·{' '}
                  <span className="font-bold">{stats.avgPercent}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:block shrink-0">
            <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-xl">
              <BookOpen className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          STATS CARDS
      ============================================ */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Courses"
          value={stats.total}
          icon={<BookOpen className="h-5 w-5" />}
          gradient="from-sky-500 to-cyan-600"
          bg="bg-sky-50"
          text="text-sky-600"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={<Activity className="h-5 w-5" />}
          gradient="from-amber-500 to-orange-600"
          bg="bg-amber-50"
          text="text-amber-600"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<Award className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
        <StatCard
          title="Not Started"
          value={stats.notStarted}
          icon={<Clock className="h-5 w-5" />}
          gradient="from-slate-500 to-slate-600"
          bg="bg-slate-100"
          text="text-slate-600"
        />
      </div>

      {/* ============================================
          FILTERS
      ============================================ */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, book, category, or teacher..."
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition"
              >
                <X className="h-3 w-3 text-slate-600" />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Filter className="h-3.5 w-3.5" />
            Status
          </div>
          {(
            [
              { key: 'all', label: 'All', count: stats.total },
              { key: 'progress', label: 'In Progress', count: stats.inProgress },
              { key: 'completed', label: 'Completed', count: stats.completed },
              {
                key: 'not-started',
                label: 'Not Started',
                count: stats.notStarted,
              },
            ] as const
          ).map((opt) => {
            const active = statusFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md shadow-cyan-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold ${
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-white text-slate-500'
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        {(hasFilters || filtered.length !== courses.length) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-800">
                {filtered.length}
              </span>{' '}
              of {courses.length} courses
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================
          EMPTY STATES
      ============================================ */}

      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-sky-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-sky-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            No courses yet
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            Your academy has not enrolled you in any courses yet. Please
            contact your administrator.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-slate-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            No courses match
          </h3>
          <p className="text-slate-500 mt-2 text-sm">
            Try adjusting your search or filters.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ============================================
            GRID VIEW
        ============================================ */

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      ) : (
        /* ============================================
            LIST VIEW
        ============================================ */

        <div className="space-y-3">
          {filtered.map((course) => (
            <CourseListRow key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================================================
   Sub Components
   ====================================================== */

function StatCard({
  title,
  value,
  icon,
  gradient,
  bg,
  text,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div className="flex items-start justify-between mb-2">
        <div
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${bg} flex items-center justify-center ${text}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
}

/* ======================================================
   Course Card (Grid)
   ====================================================== */

function CourseCard({ course }: { course: CourseRow }) {
  const level = LEVEL_META[course.level] || LEVEL_META.beginner;
  const accent = course.accentColor || '#0ea5e9';

  return (
    <Link
      href={`/student/courses/${course._id}`}
      className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300 flex flex-col"
    >
      {/* Top strip */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
        }}
      />

      {/* Cover / Thumbnail */}
      <div className="relative h-36 sm:h-40 overflow-hidden bg-slate-100">
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}bb, ${accent}88)`,
            }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
            <BookOpen className="h-12 w-12 text-white relative z-10 drop-shadow-lg" />
          </div>
        )}

        {/* Completed badge */}
        {course.isCompleted && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              <Award className="h-3 w-3" />
              Completed
            </span>
          </div>
        )}

        {/* Pages badge */}
        {course.totalPages > 0 && !course.isCompleted && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold shadow-md">
              <BookMarked className="h-3 w-3" />
              {course.pagesCompleted}/{course.totalPages}
            </span>
          </div>
        )}

        {/* Progress ring overlay */}
        {course.totalPages > 0 && (
          <div className="absolute top-3 right-3">
            <div className="h-12 w-12 rounded-full bg-white/95 backdrop-blur-sm p-0.5 shadow-md">
              <ProgressRing
                percent={course.percent}
                size={44}
                stroke={4}
                color={accent}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${level.bg} ${level.text} border border-slate-100`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
            {level.label}
          </span>
          {course.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
              {course.category}
            </span>
          )}
          {course.teacherCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700">
              <Users className="h-2.5 w-2.5" />
              {course.teacherCount}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-sky-600 transition truncate">
          {course.title}
        </h3>

        {/* Book title */}
        {course.bookTitle && (
          <p className="mt-1 text-[11px] text-slate-500 truncate flex items-center gap-1">
            <BookMarked className="h-3 w-3 text-slate-400 shrink-0" />
            {course.bookTitle}
          </p>
        )}

        {/* Teacher names */}
        {course.teacherNames.length > 0 && (
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            by {course.teacherNames.slice(0, 2).join(', ')}
            {course.teacherNames.length > 2 &&
              ` +${course.teacherNames.length - 2}`}
          </p>
        )}

        {/* Progress block */}
        {course.totalPages > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-500 font-medium">Progress</span>
              <span className="font-mono font-bold text-slate-800">
                {course.percent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${course.percent}%`,
                  background: course.isCompleted
                    ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                    : `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
              <span>
                {course.pagesCompleted} of {course.totalPages} pages
              </span>
              <span>
                {course.pagesRemaining > 0
                  ? `${course.pagesRemaining} left`
                  : 'Done ✓'}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 min-w-0">
            {course.sessionsCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <History className="h-3 w-3" />
                {course.sessionsCount} session
                {course.sessionsCount !== 1 ? 's' : ''}
              </span>
            )}
            {course.lastSessionAt && (
              <span className="truncate">· {timeAgo(course.lastSessionAt)}</span>
            )}
          </div>

          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 group-hover:gap-2 transition-all">
            View
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ======================================================
   Course List Row
   ====================================================== */

function CourseListRow({ course }: { course: CourseRow }) {
  const level = LEVEL_META[course.level] || LEVEL_META.beginner;
  const accent = course.accentColor || '#0ea5e9';

  return (
    <Link
      href={`/student/courses/${course._id}`}
      className="group block rounded-2xl bg-white border border-slate-200 hover:shadow-lg hover:border-transparent transition-all overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="w-full sm:w-40 h-32 sm:h-auto shrink-0 relative overflow-hidden">
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
              }}
            >
              <BookOpen className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
          )}

          {course.isCompleted && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider">
              <Award className="h-2.5 w-2.5" />
              Done
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${level.bg} ${level.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
                  {level.label}
                </span>
                {course.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {course.category}
                  </span>
                )}
                {course.teacherNames.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 truncate max-w-[180px]">
                    <Users className="h-2.5 w-2.5 shrink-0" />
                    {course.teacherNames.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition truncate">
                {course.title}
              </h3>

              {course.bookTitle && (
                <p className="mt-0.5 text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <BookMarked className="h-3 w-3 text-slate-400 shrink-0" />
                  {course.bookTitle}
                </p>
              )}

              {/* Progress inline */}
              {course.totalPages > 0 && (
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${course.percent}%`,
                        background: course.isCompleted
                          ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                          : `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 shrink-0">
                    {course.pagesCompleted}/{course.totalPages}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">
                    {course.percent}%
                  </span>
                </div>
              )}
            </div>

            {/* Ring */}
            {course.totalPages > 0 && (
              <div className="shrink-0">
                <ProgressRing
                  percent={course.percent}
                  size={56}
                  stroke={5}
                  color={accent}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}