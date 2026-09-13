'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  Video,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  Radio,
  Flame,
  Users,
  ArrowRight,
  GraduationCap,
  Info,
  X,
  CalendarDays,
  Signal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

/* ------------------ Types ------------------ */

type ClassRow = {
  _id: string;
  studentName: string;
  fatherName: string;
  courseName: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  // ✅ LiveKit fields
  livekitRoomName: string;
  livekitHostIdentity: string;
  livekitProvider: string;
};

type Props = {
  teacherName: string;
  teacherEmail: string;
  classes: ClassRow[];
};

/* ------------------ Helpers ------------------ */

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

function formatStatus(status: string): string {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTodayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function isTodayClass(row: ClassRow, todayName: string): boolean {
  return row.daysOfWeek.includes(todayName);
}

/* ------------------ Main Component ------------------ */

export default function ClassesView({
  teacherName,
  teacherEmail,
  classes,
}: Props) {
  const todayName = getTodayName();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'scheduled' | 'ongoing'
  >('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [livekitOnly, setLivekitOnly] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);

  /* ------------------ Derived ------------------ */

  const stats = useMemo(() => {
    const todayCount = classes.filter((c) =>
      isTodayClass(c, todayName)
    ).length;
    return {
      total: classes.length,
      scheduled: classes.filter((c) => c.status === 'scheduled').length,
      ongoing: classes.filter((c) => c.status === 'ongoing').length,
      livekit: classes.filter((c) => Boolean(c.livekitRoomName)).length,
      today: todayCount,
    };
  }, [classes, todayName]);

  const filtered = useMemo(() => {
    let result = classes;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.courseName.toLowerCase().includes(q) ||
          c.studentName.toLowerCase().includes(q) ||
          c.fatherName.toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (dayFilter !== 'all') {
      result = result.filter((c) => c.daysOfWeek.includes(dayFilter));
    }

    if (livekitOnly) {
      result = result.filter((c) => Boolean(c.livekitRoomName));
    }

    if (todayOnly) {
      result = result.filter((c) => isTodayClass(c, todayName));
    }

    /* Sort: today first, ongoing next, then by start time */
    return [...result].sort((a, b) => {
      const aToday = isTodayClass(a, todayName) ? 0 : 1;
      const bToday = isTodayClass(b, todayName) ? 0 : 1;
      if (aToday !== bToday) return aToday - bToday;

      const aOngoing = a.status === 'ongoing' ? 0 : 1;
      const bOngoing = b.status === 'ongoing' ? 0 : 1;
      if (aOngoing !== bOngoing) return aOngoing - bOngoing;

      return String(a.startTime).localeCompare(String(b.startTime));
    });
  }, [
    classes,
    search,
    statusFilter,
    dayFilter,
    livekitOnly,
    todayOnly,
    todayName,
  ]);

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    dayFilter !== 'all' ||
    livekitOnly ||
    todayOnly;

  const clearAll = () => {
    setSearch('');
    setStatusFilter('all');
    setDayFilter('all');
    setLivekitOnly(false);
    setTodayOnly(false);
  };

  const todayCount = stats.today;

  return (
    <div className="space-y-6 pb-8">
      {/* ================================================= */}
      {/* HERO HEADER                                        */}
      {/* ================================================= */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-2xl shadow-purple-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-fuchsia-300/50 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Teacher Panel
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              My Classes 📚
            </h1>

            <p className="mt-2 text-base sm:text-lg text-indigo-100">
              {teacherName}
              <span className="opacity-60 mx-2">·</span>
              <span className="text-sm opacity-90 break-all">
                {teacherEmail}
              </span>
            </p>

            {todayCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur border border-white/25 text-sm font-semibold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                You have{' '}
                <span className="text-white font-bold">{todayCount}</span> class
                {todayCount > 1 ? 'es' : ''} today
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/teacher/schedule"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition"
            >
              <CalendarDays className="h-4 w-4" />
              Schedule
            </Link>
            <Link
              href="/teacher/settings"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-4 py-2.5 text-sm font-bold hover:bg-white/90 transition shadow-lg shadow-purple-900/20"
            >
              <Signal className="h-4 w-4" />
              LiveKit Settings
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* STATS CARDS                                        */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<BookOpen className="h-5 w-5" />}
          gradient="from-indigo-500 to-blue-600"
          bg="bg-indigo-50"
          text="text-indigo-600"
        />
        <StatCard
          title="Today"
          value={stats.today}
          icon={<Flame className="h-5 w-5" />}
          gradient="from-rose-500 to-pink-600"
          bg="bg-rose-50"
          text="text-rose-600"
          highlight={stats.today > 0}
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduled}
          icon={<CheckCircle2 className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
        <StatCard
          title="Ongoing"
          value={stats.ongoing}
          icon={<Radio className="h-5 w-5" />}
          gradient="from-amber-500 to-orange-600"
          bg="bg-amber-50"
          text="text-amber-600"
        />
        <StatCard
          title="LiveKit"
          value={stats.livekit}
          icon={<Video className="h-5 w-5" />}
          gradient="from-sky-500 to-cyan-600"
          bg="bg-sky-50"
          text="text-sky-600"
        />
      </div>

      {/* ================================================= */}
      {/* FILTERS + SEARCH                                   */}
      {/* ================================================= */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course, student, or notes..."
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

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Filter className="h-3.5 w-3.5" />
            Status
          </div>
          {(
            [
              { key: 'all', label: 'All', count: classes.length },
              {
                key: 'scheduled',
                label: 'Scheduled',
                count: classes.filter((c) => c.status === 'scheduled').length,
              },
              {
                key: 'ongoing',
                label: 'Ongoing',
                count: classes.filter((c) => c.status === 'ongoing').length,
              },
            ] as const
          ).map((opt) => {
            const active = statusFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key as any)}
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

          {/* LiveKit Toggle */}
          <button
            type="button"
            onClick={() => setLivekitOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              livekitOnly
                ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md shadow-sky-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            LiveKit only
          </button>

          {/* Today Toggle */}
          <button
            type="button"
            onClick={() => setTodayOnly((v) => !v)}
            disabled={todayCount === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              todayOnly
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            Today only
          </button>
        </div>

        {/* Day Filter Pills */}
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
          {DAYS.map((day) => {
            const isToday = day === todayName;
            const active = dayFilter === day;
            const count = classes.filter((c) =>
              c.daysOfWeek.includes(day)
            ).length;
            if (count === 0) return null;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setDayFilter(day)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-md'
                    : isToday
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {DAY_SHORT[day]}
                {isToday && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? 'bg-rose-300' : 'bg-rose-500 animate-pulse'
                    }`}
                  />
                )}
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

        {/* Active Summary */}
        {(hasActiveFilters || filtered.length !== classes.length) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-800">
                {filtered.length}
              </span>{' '}
              of {classes.length} classes
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

      {/* ================================================= */}
      {/* EMPTY STATE                                        */}
      {/* ================================================= */}

      {classes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-indigo-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            No classes assigned yet
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            Your academy owner has not assigned any active classes to you yet.
            Once assigned, they&apos;ll appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-slate-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No matches found</h3>
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
        /* ================================================= */
        /* CLASSES GRID                                       */
        /* ================================================= */

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((row) => (
            <ClassCard
              key={row._id}
              row={row}
              todayName={todayName}
              isToday={isTodayClass(row, todayName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------ Stat Card ------------------ */

function StatCard({
  title,
  value,
  icon,
  gradient,
  bg,
  text,
  highlight,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative bg-white rounded-2xl p-4 border transition-all duration-300 overflow-hidden ${
        highlight
          ? 'border-rose-200 shadow-md shadow-rose-500/10 ring-1 ring-rose-100'
          : 'border-slate-200 hover:shadow-xl hover:border-transparent'
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity ${
          highlight ? '!opacity-100' : ''
        }`}
      />
      <div className="flex items-start justify-between mb-2">
        <div
          className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center ${text} ${
            highlight ? 'animate-pulse' : ''
          }`}
        >
          {icon}
        </div>
        {highlight && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
            Today
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
}

/* ------------------ Class Card ------------------ */

function ClassCard({
  row,
  todayName,
  isToday,
}: {
  row: ClassRow;
  todayName: string;
  isToday: boolean;
}) {
  const hasLiveKit = Boolean(row.livekitRoomName);
  const isOngoing = row.status === 'ongoing';

  return (
    <article
      className={`relative group overflow-hidden rounded-2xl bg-white transition-all duration-300 ${
        isToday
          ? 'border-2 border-rose-300 shadow-lg shadow-rose-500/15 ring-1 ring-rose-100'
          : isOngoing
          ? 'border border-amber-200 shadow-md shadow-amber-500/10'
          : 'border border-slate-200 shadow-sm hover:shadow-xl hover:border-transparent'
      }`}
    >
      {/* Top gradient strip */}
      <div
        className={`h-1 bg-gradient-to-r ${
          isToday
            ? 'from-rose-500 via-pink-500 to-fuchsia-500'
            : isOngoing
            ? 'from-amber-500 to-orange-500'
            : 'from-indigo-500 via-purple-500 to-fuchsia-500'
        }`}
      />

      {/* TODAY pulsing glow */}
      {isToday && (
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-rose-400/20 blur-3xl pointer-events-none animate-pulse" />
      )}

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`relative h-12 w-12 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                isToday
                  ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/30'
                  : isOngoing
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/30'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-purple-500/25'
              }`}
            >
              <BookOpen className="h-6 w-6" />

              {isToday && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                {row.courseName}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {isToday && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                    <Flame className="h-3 w-3" />
                    Today
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isOngoing
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isOngoing ? (
                    <Radio className="h-3 w-3 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {formatStatus(row.status)}
                </span>
              </div>
            </div>
          </div>

          {hasLiveKit && (
            <span
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[10px] font-bold uppercase tracking-wider"
              title={`LiveKit · ${row.livekitProvider || 'livekit'}`}
            >
              <Signal className="h-3 w-3" />
              LiveKit
            </span>
          )}
        </div>

        {/* Student Info */}
        <div className="flex items-center gap-2 text-sm text-slate-700 mb-3">
          <Users className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="font-semibold truncate">{row.studentName}</span>
          {row.fatherName && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 truncate">{row.fatherName}</span>
            </>
          )}
        </div>

        {/* Time + Timezone */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-800">
              {row.startTime || '--:--'}
            </span>
            <span className="text-slate-400">–</span>
            <span className="font-semibold text-slate-800">
              {row.endTime || '--:--'}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Info className="h-3 w-3" />
            Asia/Karachi
          </span>
        </div>

        {/* Weekly Days */}
        {row.daysOfWeek.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Weekly Schedule
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {row.daysOfWeek.map((day) => {
                const dayIsToday = day === todayName;
                return (
                  <span
                    key={`${row._id}-${day}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      dayIsToday
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/25'
                        : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                    }`}
                  >
                    {dayIsToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    )}
                    {DAY_SHORT[day] || day}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {row.notes && (
          <div className="mb-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-3">
              {row.notes}
            </p>
          </div>
        )}

        {/* LiveKit details strip */}
        {hasLiveKit && (
          <div className="mb-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-slate-500">Room ready</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-500">No recording</span>
              </span>
              {row.livekitProvider && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  <Zap className="h-3 w-3" />
                  {row.livekitProvider}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {hasLiveKit ? (
            <Link
              href={`/teacher/classroom/${row._id}`}
              className={`group/btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition shadow-md ${
                isToday
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:shadow-lg hover:shadow-rose-500/30 shadow-rose-500/25'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 shadow-purple-500/25'
              }`}
            >
              <Video className="h-4 w-4" />
              Open Classroom
              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
              <Info className="h-4 w-4" />
              LiveKit room not created
            </span>
          )}
        </div>
      </div>
    </article>
  );
}