'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  User as UserIcon,
  Video,
  Copy,
  Check,
  ExternalLink,
  Search,
  X,
  Filter,
  Info,
  Flame,
  Radio,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  Layers,
  LayoutGrid,
  List,
  Hash,
  KeyRound,
  PlayCircle,
  Monitor,
  Smartphone,
  Globe,
  Download,
  ChevronDown,
} from 'lucide-react';

/* ======================================================
   Types
   ====================================================== */

type ClassRow = {
  _id: string;
  courseName: string;
  teacherName: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  zoomMeetingNumber: string;
  zoomPassword: string;
  zoomLink: string;
  zoomTimezone: string;
  hasZoom: boolean;
};

type Props = {
  student: { _id: string; name: string; email: string; classLevel: string };
  academy: { _id: string; name: string } | null;
  classes: ClassRow[];
};

/* ======================================================
   Constants
   ====================================================== */

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

const DAY_LABEL: Record<string, string> = {
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
  Sunday: 'Sunday',
};

/* ======================================================
   Helpers
   ====================================================== */

function getTodayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function parseTime(timeStr: string): number | null {
  if (!timeStr) return null;
  const m = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

type ClassTiming = 'live' | 'soon' | 'upcoming' | 'past' | 'other-day';

function getClassTiming(cls: ClassRow, todayName: string): ClassTiming {
  const isToday = cls.daysOfWeek.includes(todayName);
  if (!isToday) return 'other-day';

  const now = getCurrentMinutes();
  const start = parseTime(cls.startTime);
  const end = parseTime(cls.endTime);

  if (start === null || end === null) return 'upcoming';

  if (now >= start && now <= end) return 'live';
  if (now < start && start - now <= 30) return 'soon';
  if (now < start) return 'upcoming';
  return 'past';
}

function formatStatus(status: string): string {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ======================================================
   Main Component
   ====================================================== */

export default function ScheduleView({ student, academy, classes }: Props) {
  const todayName = useMemo(() => getTodayName(), []);

  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'today' | 'zoom'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [now, setNow] = useState(getCurrentMinutes());

  // ✅ Join modal state
  const [joinModalClass, setJoinModalClass] = useState<
    (ClassRow & { isToday: boolean; timing: string }) | null
  >(null);

  useEffect(() => {
    const t = setInterval(() => setNow(getCurrentMinutes()), 30_000);
    return () => clearInterval(t);
  }, []);

  const enriched = useMemo(() => {
    return classes.map((c) => ({
      ...c,
      isToday: c.daysOfWeek.includes(todayName),
      timing: getClassTiming(c, todayName),
    }));
  }, [classes, todayName]);

  const stats = useMemo(() => {
    const today = enriched.filter((c) => c.isToday);
    const live = enriched.filter((c) => c.timing === 'live');
    const soon = enriched.filter((c) => c.timing === 'soon');
    return {
      total: enriched.length,
      today: today.length,
      live: live.length,
      soon: soon.length,
    };
  }, [enriched]);

  const filtered = useMemo(() => {
    let list = [...enriched];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.courseName.toLowerCase().includes(q) ||
          c.teacherName.toLowerCase().includes(q)
      );
    }

    if (dayFilter !== 'all') {
      list = list.filter((c) => c.daysOfWeek.includes(dayFilter));
    }

    if (statusFilter === 'today') {
      list = list.filter((c) => c.isToday);
    } else if (statusFilter === 'zoom') {
      list = list.filter((c) => c.hasZoom);
    }

    const rank: Record<string, number> = {
      live: 0,
      soon: 1,
      upcoming: 2,
      past: 3,
      'other-day': 4,
    };
    list.sort((a, b) => {
      const ra = rank[a.timing] ?? 5;
      const rb = rank[b.timing] ?? 5;
      if (ra !== rb) return ra - rb;
      return String(a.startTime).localeCompare(String(b.startTime));
    });

    return list;
  }, [enriched, search, dayFilter, statusFilter]);

  const hasFilters =
    search.trim() !== '' ||
    dayFilter !== 'all' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setDayFilter('all');
    setStatusFilter('all');
  };

  const handleCopy = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      /* ignore */
    }
  };

  const liveClass = enriched.find((c) => c.timing === 'live');
  const nextClass = enriched.find((c) => c.timing === 'soon');

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

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Weekly Schedule
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            My Schedule 📅
          </h1>

          <p className="mt-2 text-cyan-50 text-sm sm:text-base">
            {academy?.name
              ? `Your weekly classes at ${academy.name}`
              : 'Your weekly classes'}
          </p>

          {(liveClass || nextClass) && (
            <div className="mt-4">
              {liveClass ? (
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/25 backdrop-blur-md border border-white/30 font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  <span className="text-sm">
                    Live now:{' '}
                    <span className="font-bold">{liveClass.courseName}</span>
                  </span>
                </div>
              ) : nextClass ? (
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 font-semibold">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Next: <span className="font-bold">{nextClass.courseName}</span>{' '}
                    at {nextClass.startTime}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
              <Layers className="h-3.5 w-3.5" />
              {stats.total} Weekly
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
              <CalendarCheck className="h-3.5 w-3.5" />
              {stats.today} Today
            </span>
            {stats.live > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/30 backdrop-blur-sm border border-rose-300/40 font-bold">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                {stats.live} Live
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          TODAY'S CLASSES (highlighted)
      ============================================ */}
      {stats.today > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Flame className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Today&apos;s Classes
            </h2>
            <span className="text-[10px] font-bold text-slate-400">
              · {todayName}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enriched
              .filter((c) => c.isToday)
              .map((cls) => (
                <ClassCard
                  key={cls._id}
                  cls={cls}
                  highlight
                  copied={copiedField}
                  onCopy={handleCopy}
                  onJoinClick={() => setJoinModalClass(cls)}
                />
              ))}
          </div>
        </div>
      )}

      {/* ============================================
          FILTERS + VIEW TOGGLE
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course or teacher..."
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

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition ${
                viewMode === 'week'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Filter className="h-3.5 w-3.5" />
            View
          </div>
          {(
            [
              { key: 'all', label: 'All', count: stats.total },
              { key: 'today', label: 'Today', count: stats.today },
              {
                key: 'zoom',
                label: 'With Zoom',
                count: enriched.filter((c) => c.hasZoom).length,
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

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <CalendarDays className="h-3.5 w-3.5" />
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
          {DAY_ORDER.map((day) => {
            const isToday = day === todayName;
            const active = dayFilter === day;
            const count = enriched.filter((c) =>
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

        {(hasFilters || filtered.length !== classes.length) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-800">
                {filtered.length}
              </span>{' '}
              of {classes.length} classes
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
          WEEK GRID / LIST
      ============================================ */}
      {classes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-sky-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-sky-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            No classes scheduled
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            Your academy has not assigned you any classes yet.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-slate-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            No classes match
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
      ) : viewMode === 'week' ? (
        <div className="space-y-4">
          {DAY_ORDER.map((day) => {
            const dayClasses = filtered.filter((c) =>
              c.daysOfWeek.includes(day)
            );
            if (dayClasses.length === 0) return null;
            const isToday = day === todayName;

            return (
              <div
                key={day}
                className={`overflow-hidden rounded-2xl border shadow-sm transition-all ${
                  isToday
                    ? 'border-rose-200 ring-1 ring-rose-100 bg-gradient-to-br from-rose-50/40 to-white'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`p-4 border-b flex items-center justify-between gap-3 ${
                    isToday
                      ? 'border-rose-100 bg-rose-50/40'
                      : 'border-slate-100 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isToday
                          ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-sm font-bold">
                        {DAY_SHORT[day].charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-base font-bold ${
                            isToday ? 'text-rose-900' : 'text-slate-900'
                          }`}
                        >
                          {DAY_LABEL[day]}
                        </h3>
                        {isToday && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            Today
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs ${
                          isToday ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {dayClasses.length} class
                        {dayClasses.length > 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-4 space-y-3">
                  {dayClasses.map((cls) => (
                    <ClassCard
                      key={`${day}-${cls._id}`}
                      cls={cls}
                      highlight={isToday}
                      compact
                      copied={copiedField}
                      onCopy={handleCopy}
                      onJoinClick={() => setJoinModalClass(cls)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((cls) => (
            <ClassCard
              key={cls._id}
              cls={cls}
              highlight={cls.isToday}
              copied={copiedField}
              onCopy={handleCopy}
              onJoinClick={() => setJoinModalClass(cls)}
            />
          ))}
        </div>
      )}

      {/* ============================================
          JOIN MODAL
      ============================================ */}
      {joinModalClass && (
        <JoinModal
          cls={joinModalClass}
          onClose={() => setJoinModalClass(null)}
          copied={copiedField}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}

/* ======================================================
   ClassCard
   ====================================================== */

function ClassCard({
  cls,
  highlight,
  compact,
  copied,
  onCopy,
  onJoinClick,
}: {
  cls: ClassRow & { isToday: boolean; timing: string };
  highlight?: boolean;
  compact?: boolean;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  onJoinClick: () => void;
}) {
  const daysSorted = [...cls.daysOfWeek].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );

  const isLive = cls.timing === 'live';
  const isSoon = cls.timing === 'soon';
  const isPast = cls.timing === 'past';
  const canJoin = cls.hasZoom && Boolean(cls.zoomLink);

  const topStrip = isLive
    ? 'from-rose-500 via-pink-500 to-fuchsia-500'
    : isSoon
    ? 'from-amber-500 via-orange-500 to-red-500'
    : highlight
    ? 'from-sky-500 via-cyan-500 to-teal-500'
    : 'from-slate-300 to-slate-400';

  const cardBorder = isLive
    ? 'border-2 border-rose-400 shadow-lg shadow-rose-500/20 ring-2 ring-rose-200/60'
    : isSoon
    ? 'border-2 border-amber-300 shadow-lg shadow-amber-500/15 ring-1 ring-amber-100'
    : highlight
    ? 'border-2 border-sky-300 shadow-md shadow-sky-500/10 ring-1 ring-sky-100'
    : isPast
    ? 'border border-slate-200 opacity-75'
    : 'border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300';

  return (
    <article
      className={`relative overflow-hidden rounded-2xl bg-white transition-all duration-300 ${cardBorder}`}
    >
      <div className={`h-1 bg-gradient-to-r ${topStrip}`} />

      {isLive && (
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-rose-400/20 blur-3xl pointer-events-none animate-pulse" />
      )}

      <div className={compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`relative h-11 w-11 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                isLive
                  ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/30'
                  : isSoon
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/30'
                  : highlight
                  ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-cyan-500/25'
                  : 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              {isLive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {cls.courseName}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                <UserIcon className="h-3 w-3 shrink-0" />
                {cls.teacherName}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md shadow-rose-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live Now
              </span>
            ) : isSoon ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md shadow-amber-500/30">
                <Clock className="h-3 w-3" />
                Starting Soon
              </span>
            ) : isPast ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                <CheckCircle2 className="h-3 w-3" />
                Ended
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                {formatStatus(cls.status)}
              </span>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono font-semibold text-slate-800">
              {cls.startTime || '--:--'}
            </span>
            <span className="text-slate-400">–</span>
            <span className="font-mono font-semibold text-slate-800">
              {cls.endTime || '--:--'}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
            <Info className="h-3 w-3" />
            {cls.zoomTimezone || 'Asia/Karachi'}
          </span>
        </div>

        {/* Days */}
        {!compact && daysSorted.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {daysSorted.map((d) => {
              const isThisDayToday = cls.isToday && d === getTodayName();
              return (
                <span
                  key={d}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isThisDayToday
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/25'
                      : highlight
                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                      : 'bg-sky-50 text-sky-700 border border-sky-100'
                  }`}
                >
                  {isThisDayToday && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  )}
                  {DAY_SHORT[d] || d}
                </span>
              );
            })}
          </div>
        )}

        {/* Notes */}
        {cls.notes && !compact && (
          <div className="mb-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-2">
              {cls.notes}
            </p>
          </div>
        )}

        {/* Zoom strip */}
        {cls.hasZoom && (
          <div className="mb-3 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-sky-600" />
                <span className="text-slate-500">ID:</span>
                <span className="font-mono font-bold text-slate-800">
                  {cls.zoomMeetingNumber}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(cls.zoomMeetingNumber, `mid-${cls._id}`)
                  }
                  className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition"
                >
                  {copied === `mid-${cls._id}` ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </span>

              {cls.zoomPassword && (
                <span className="inline-flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3 text-sky-600" />
                  <span className="text-slate-500">Pass:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {cls.zoomPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(cls.zoomPassword, `pw-${cls._id}`)}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition"
                  >
                    {copied === `pw-${cls._id}` ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ✅ Single Join button that opens modal */}
        <div className="flex">
          {canJoin ? (
            <button
              type="button"
              onClick={onJoinClick}
              className={`group/btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-md w-full ${
                isLive
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 hover:shadow-lg hover:shadow-rose-500/40 shadow-rose-500/30'
                  : isSoon
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 hover:shadow-lg hover:shadow-amber-500/40 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30 shadow-cyan-500/25'
              }`}
            >
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
              )}
              <Video className="h-4 w-4" />
              {isLive ? 'Join Live Class' : 'Join Class'}
              <ChevronDown className="h-3.5 w-3.5 group-hover/btn:translate-y-0.5 transition-transform" />
            </button>
          ) : cls.hasZoom ? (
            <div className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-700">
              <AlertCircle className="h-4 w-4" />
              Zoom link not ready yet
            </div>
          ) : (
            <div className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500">
              <Info className="h-4 w-4" />
              No Zoom configured
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ======================================================
   Join Modal — Choose how to join
   ====================================================== */

function JoinModal({
  cls,
  onClose,
  copied,
  onCopy,
}: {
  cls: ClassRow & { isToday: boolean; timing: string };
  onClose: () => void;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const isLive = cls.timing === 'live';
  const isSoon = cls.timing === 'soon';
  const isPast = cls.timing === 'past';

  const statusLabel = isLive
    ? 'Live Now'
    : isSoon
    ? 'Starting Soon'
    : isPast
    ? 'Ended'
    : formatStatus(cls.status);

  const statusColor = isLive
    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
    : isSoon
    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
    : isPast
    ? 'bg-slate-100 text-slate-500 border border-slate-200'
    : 'bg-emerald-50 text-emerald-700 border border-emerald-200';

  /* ---- Escape key ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* ---- Body scroll lock ---- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const embedUrl = `/student/classroom/${cls._id}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl shadow-slate-900/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top gradient */}
        <div
          className={`h-1.5 bg-gradient-to-r ${
            isLive
              ? 'from-rose-500 via-pink-500 to-fuchsia-500'
              : isSoon
              ? 'from-amber-500 via-orange-500 to-red-500'
              : 'from-sky-500 via-cyan-500 to-teal-500'
          }`}
        />

        {/* Header */}
        <div className="relative px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-10">
            <div
              className={`shrink-0 h-12 w-12 rounded-xl flex items-center justify-center shadow-md ${
                isLive
                  ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/30'
                  : isSoon
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/30'
                  : 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-cyan-500/30'
              }`}
            >
              <Video className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 truncate">
                  {cls.courseName}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
                >
                  {isLive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  )}
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                <UserIcon className="h-3 w-3 shrink-0" />
                {cls.teacherName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Clock className="h-3 w-3 shrink-0" />
                <span className="font-mono">
                  {cls.startTime} – {cls.endTime}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Prompt */}
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-900">
              How do you want to join?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Choose where to open this class
            </p>
          </div>

          {/* Option 1 — On Website */}
          <Link
            href={embedUrl}
            className="group flex items-start gap-3 p-4 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/20 transition-all active:scale-[0.98]"
          >
            <div className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/30 group-hover:scale-105 transition-transform">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">
                  Join on Website
                </p>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Opens the classroom inside this website. No extra install
                needed — works on any browser.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-sky-500 shrink-0 mt-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Option 2 — Zoom App */}
          <a
            href={cls.zoomLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-[0.98]"
          >
            <div className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">
                Open in Zoom App
              </p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Launches the Zoom desktop or mobile app with this meeting.
                Best for full HD video &amp; audio.
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 shrink-0 mt-3 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </a>

          {/* Meeting info */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-slate-400" />
                <span className="text-slate-500">ID:</span>
                <span className="font-mono font-bold text-slate-800">
                  {cls.zoomMeetingNumber}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onCopy(cls.zoomMeetingNumber, `modal-mid`);
                  }}
                  className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition"
                  title="Copy meeting ID"
                >
                  {copied === 'modal-mid' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </span>

              {cls.zoomPassword && (
                <span className="inline-flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-500">Pass:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {cls.zoomPassword}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onCopy(cls.zoomPassword, `modal-pw`);
                    }}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition"
                    title="Copy password"
                  >
                    {copied === 'modal-pw' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[10px] text-slate-400 text-center">
            Press{' '}
            <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[9px]">
              Esc
            </kbd>{' '}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}