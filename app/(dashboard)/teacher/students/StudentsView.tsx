'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  X,
  Sparkles,
  BookOpen,
  Calendar,
  Filter,
  ArrowRight,
  GraduationCap,
  Activity,
  UserCheck,
  UserX,
  Layers,
  Clock,
  Info,
  ShieldAlert,
} from 'lucide-react';

/* ======================================================
   Types
   ====================================================== */

type StudentRow = {
  _id: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
  courses: string[];
  classCount: number;
  days: string[];
  timeSlots: string[];
};

type Props = {
  teacher: { _id: string; name: string; email: string; subjects: string[] };
  academy: { _id: string; name: string } | null;
  students: StudentRow[];
};

/* ======================================================
   Helpers
   ====================================================== */

function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

/* ======================================================
   Component
   ====================================================== */

export default function StudentsView({ teacher, academy, students }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'classes'>('name');

  /* ---------- Derived ---------- */

  const allCourses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.courses.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [students]);

  const allDays = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.days.forEach((d) => set.add(d)));
    return DAY_ORDER.filter((d) => set.has(d));
  }, [students]);

  const stats = useMemo(() => {
    const active = students.filter((s) => s.isActive).length;
    const inactive = students.length - active;
    const totalClasses = students.reduce((acc, s) => acc + s.classCount, 0);
    return {
      total: students.length,
      active,
      inactive,
      totalClasses,
    };
  }, [students]);

  const filtered = useMemo(() => {
    let list = [...students];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.courses.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'active') list = list.filter((s) => s.isActive);
    if (statusFilter === 'inactive') list = list.filter((s) => !s.isActive);

    if (courseFilter !== 'all') {
      list = list.filter((s) => s.courses.includes(courseFilter));
    }

    if (dayFilter !== 'all') {
      list = list.filter((s) => s.days.includes(dayFilter));
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => b.classCount - a.classCount);
    }

    return list;
  }, [students, search, statusFilter, courseFilter, dayFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    courseFilter !== 'all' ||
    dayFilter !== 'all' ||
    sortBy !== 'name';

  const clearAll = () => {
    setSearch('');
    setStatusFilter('all');
    setCourseFilter('all');
    setDayFilter('all');
    setSortBy('name');
  };

  /* ======================================================
     Render
     ====================================================== */

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============================================
          HERO HEADER
      ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-2xl shadow-purple-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              My Students
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              Students 👥
            </h1>

            <p className="mt-2 text-indigo-100 text-sm sm:text-base">
              {academy?.name
                ? `Teaching at ${academy.name}`
                : 'Students you are teaching'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
                <Users className="h-3.5 w-3.5" />
                {stats.total} Total
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
                <BookOpen className="h-3.5 w-3.5" />
                {stats.totalClasses} Classes
              </span>
            </div>
          </div>

          <div className="hidden sm:block shrink-0">
            <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-xl">
              <Users className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          PRIVACY NOTICE
      ============================================ */}

      <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-md shadow-sky-500/30">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-sky-900">
              Teaching Information Only
            </p>
            <p className="mt-0.5 text-xs text-sky-700 leading-relaxed">
              For privacy, student personal contact details are hidden. You
              can only view the courses, class days, and timing needed for
              teaching.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          STATS CARDS
      ============================================ */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Students"
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
          gradient="from-blue-500 to-indigo-600"
          bg="bg-blue-50"
          text="text-blue-600"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<UserCheck className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={<UserX className="h-5 w-5" />}
          gradient="from-slate-500 to-slate-600"
          bg="bg-slate-100"
          text="text-slate-600"
        />
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={<Layers className="h-5 w-5" />}
          gradient="from-violet-500 to-purple-600"
          bg="bg-violet-50"
          text="text-violet-600"
        />
      </div>

      {/* ============================================
          FILTERS
      ============================================ */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or course..."
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/40 transition cursor-pointer shrink-0"
          >
            <option value="name">Sort: Name (A–Z)</option>
            <option value="classes">Sort: Most Classes</option>
          </select>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Filter className="h-3.5 w-3.5" />
            Status
          </div>
          {(
            [
              { key: 'all', label: 'All', count: students.length },
              { key: 'active', label: 'Active', count: stats.active },
              { key: 'inactive', label: 'Inactive', count: stats.inactive },
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
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-purple-500/25'
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

        {/* Course filter */}
        {allCourses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              <BookOpen className="h-3.5 w-3.5" />
              Course
            </div>
            <button
              type="button"
              onClick={() => setCourseFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                courseFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {allCourses.map((course) => {
              const active = courseFilter === course;
              const count = students.filter((s) =>
                s.courses.includes(course)
              ).length;
              return (
                <button
                  key={course}
                  type="button"
                  onClick={() => setCourseFilter(course)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {course}
                  <span
                    className={`text-[10px] font-bold ${
                      active ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Day filter */}
        {allDays.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              <Calendar className="h-3.5 w-3.5" />
              Day
            </div>
            <button
              type="button"
              onClick={() => setDayFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                dayFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {allDays.map((day) => {
              const active = dayFilter === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDayFilter(day)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {DAY_SHORT[day]}
                </button>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {(hasActiveFilters || filtered.length !== students.length) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-800">
                {filtered.length}
              </span>{' '}
              of {students.length} students
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
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

      {students.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-indigo-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            No students assigned yet
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            Your academy owner has not assigned any students to you yet.
            Once assigned, they will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-slate-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            No students match
          </h3>
          <p className="text-slate-500 mt-2 text-sm">
            Try adjusting your search or filters.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        /* ============================================
            STUDENT CARDS GRID
        ============================================ */

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <StudentCard key={student._id} student={student} />
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

function StudentCard({ student }: { student: StudentRow }) {
  const initials = getInitials(student.name);
  const daysSorted = [...student.days].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300">
      <div
        className={`h-1 bg-gradient-to-r ${
          student.isActive
            ? 'from-indigo-500 via-purple-500 to-fuchsia-500'
            : 'from-slate-400 to-slate-500'
        }`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            {student.imageUrl ? (
              <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={student.imageUrl}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md ${
                  student.isActive
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                }`}
              >
                {initials}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${
                student.isActive ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
              title={student.isActive ? 'Active' : 'Inactive'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 leading-tight truncate">
              {student.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  student.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {student.isActive ? (
                  <Activity className="h-3 w-3" />
                ) : (
                  <UserX className="h-3 w-3" />
                )}
                {student.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Courses */}
        {student.courses.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Courses
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {student.courses.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Class count */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-fuchsia-50 border border-fuchsia-100 text-fuchsia-700 text-[11px] font-bold">
            <Layers className="h-3 w-3" />
            {student.classCount} class
            {student.classCount !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Weekly days */}
        {daysSorted.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Weekly Schedule
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {daysSorted.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold"
                >
                  {DAY_SHORT[d] || d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Time slots */}
        {student.timeSlots.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Class Times
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {student.timeSlots.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-mono font-bold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100">
          <Link
            href={`/teacher/students/${student._id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 transition"
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}