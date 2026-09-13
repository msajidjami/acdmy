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
  ArrowRight,
  GraduationCap,
  Info,
  X,
  CalendarDays,
  Signal,
  ShieldCheck,
  Lock,
  User as UserIcon,
  Layers,
  Zap,
  Users,
  Award,
  TrendingUp,
  Star,
  Activity,
  AlertCircle,
  PlayCircle,
  Hash,
} from 'lucide-react';

/* ------------------ Types ------------------ */

type ClassRow = {
  _id: string;
  courseName: string;
  teacherName: string;
  teacherEmail: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  // ✅ LiveKit fields
  hasLiveKit: boolean;
  livekitRoomName: string;
  livekitHostIdentity: string;
  livekitProvider: string;
  isToday: boolean;
};

type StudentInfo = {
  _id: string;
  name: string;
  email: string;
  classLevel: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string | null;
};

type AcademyInfo = {
  _id: string;
  name: string;
} | null;

type Stats = {
  totalClasses: number;
  totalCourses: number;
  totalTeachers: number;
  todayClasses: number;
  upcomingClasses: number;
  ongoingClasses: number;
  livekitReadyClasses: number; // ✅ نیا
};

type Props = {
  student: StudentInfo;
  academy: AcademyInfo;
  stats: Stats;
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

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatStatus(status: string): string {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTodayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

/* ------------------ Main Component ------------------ */

export default function StudentDashboardView({
  student,
  academy,
  stats,
  classes,
}: Props) {
  const todayName = getTodayName();
  const [activeTab, setActiveTab] = useState<'overview' | 'today' | 'all'>(
    'overview'
  );
  const [search, setSearch] = useState('');

  /* ------------------ Derived ------------------ */

  const todayClasses = useMemo(
    () => classes.filter((c) => c.isToday),
    [classes]
  );

  const upcomingClasses = useMemo(
    () =>
      classes
        .filter((c) => c.status === 'scheduled' && !c.isToday)
        .slice(0, 5),
    [classes]
  );

  const ongoingClasses = useMemo(
    () => classes.filter((c) => c.status === 'ongoing'),
    [classes]
  );

  const filteredAllClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.trim().toLowerCase();
    return classes.filter(
      (c) =>
        c.courseName.toLowerCase().includes(q) ||
        c.teacherName.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
    );
  }, [classes, search]);

  const initials = getInitials(student.name);

  return (
    <div className="space-y-6 pb-8">
      {/* ================================================= */}
      {/* HERO HEADER                                        */}
      {/* ================================================= */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-teal-300/50 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Avatar */}
          <div className="shrink-0 flex items-center gap-4">
            <div className="relative">
              {student.imageUrl ? (
                <img
                  src={student.imageUrl}
                  alt={student.name}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl object-cover border-4 border-white/30 shadow-xl"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-xl">
                  {initials}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-cyan-500 ${
                  student.isActive ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
                title={student.isActive ? 'Active' : 'Inactive'}
              />
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Student Dashboard
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              Assalam-o-Alaikum, {student.name.split(' ')[0]}! 👋
            </h1>

            <p className="mt-2 text-sm sm:text-base text-cyan-100 break-all">
              {student.email}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {academy?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {academy.name}
                </span>
              )}
              {student.classLevel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold">
                  <Layers className="h-3.5 w-3.5" />
                  {student.classLevel}
                </span>
              )}
              {stats.todayClasses > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/30 backdrop-blur-sm border border-rose-300/40 text-xs font-bold">
                  <Flame className="h-3.5 w-3.5" />
                  {stats.todayClasses} class
                  {stats.todayClasses > 1 ? 'es' : ''} today
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/student/schedule"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition"
            >
              <CalendarDays className="h-4 w-4" />
              My Schedule
            </Link>
            <Link
              href="/student/settings"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-sky-700 px-4 py-2.5 text-sm font-bold hover:bg-white/90 transition shadow-lg shadow-cyan-900/20"
            >
              <UserIcon className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* STATS CARDS                                        */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={<BookOpen className="h-5 w-5" />}
          gradient="from-sky-500 to-blue-600"
          bg="bg-sky-50"
          text="text-sky-600"
        />
        <StatCard
          title="Today"
          value={stats.todayClasses}
          icon={<Flame className="h-5 w-5" />}
          gradient="from-rose-500 to-pink-600"
          bg="bg-rose-50"
          text="text-rose-600"
          highlight={stats.todayClasses > 0}
        />
        <StatCard
          title="My Teachers"
          value={stats.totalTeachers}
          icon={<Users className="h-5 w-5" />}
          gradient="from-violet-500 to-purple-600"
          bg="bg-violet-50"
          text="text-violet-600"
        />
        <StatCard
          title="LiveKit Ready"
          value={stats.livekitReadyClasses}
          icon={<Signal className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
      </div>

      {/* ================================================= */}
      {/* ONGOING CLASSES BANNER                            */}
      {/* ================================================= */}

      {ongoingClasses.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-5 shadow-lg">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-orange-200/50 blur-3xl pointer-events-none" />

          <div className="relative flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center shrink-0 shadow-sm">
              <Radio className="h-6 w-6 text-amber-600 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-amber-900 text-base sm:text-lg">
                  🟡 {ongoingClasses.length} class
                  {ongoingClasses.length > 1 ? 'es' : ''} in progress
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full">
                  <PlayCircle className="h-3 w-3" />
                  Live Now
                </span>
              </div>

              <div className="mt-2 space-y-1.5">
                {ongoingClasses.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center gap-2 text-sm text-amber-800 font-medium flex-wrap"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-bold">{c.courseName}</span>
                    <span className="text-amber-500">·</span>
                    <span>{c.teacherName}</span>
                    <span className="text-amber-500">·</span>
                    <span className="font-mono text-xs">
                      {c.startTime} – {c.endTime}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {ongoingClasses.map((c) =>
                  c.hasLiveKit ? (
                    <Link
                      key={`btn-${c._id}`}
                      href={`/student/classroom/${c._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/30 hover:shadow-lg transition"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join Now
                    </Link>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TABS                                               */}
      {/* ================================================= */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {(
            [
              { key: 'overview', label: 'Overview', icon: Activity },
              { key: 'today', label: "Today's Classes", icon: Flame },
              { key: 'all', label: 'All Classes', icon: BookOpen },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-4 text-xs sm:text-sm font-bold transition border-b-2 ${
                  active
                    ? 'text-sky-600 border-sky-500 bg-sky-50/50'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.key === 'overview'
                    ? 'Overview'
                    : tab.key === 'today'
                    ? 'Today'
                    : 'All'}
                </span>
                {tab.key === 'today' && stats.todayClasses > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {stats.todayClasses}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================================================= */}
        {/* TAB: OVERVIEW                                      */}
        {/* ================================================= */}

        {activeTab === 'overview' && (
          <div className="p-5 space-y-5">
            {/* Quick info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickTile
                icon={<BookOpen className="h-4 w-4" />}
                label="Courses"
                value={String(stats.totalCourses)}
                tone="sky"
              />
              <QuickTile
                icon={<Users className="h-4 w-4" />}
                label="Teachers"
                value={String(stats.totalTeachers)}
                tone="violet"
              />
              <QuickTile
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Scheduled"
                value={String(stats.upcomingClasses)}
                tone="emerald"
              />
              <QuickTile
                icon={<Zap className="h-4 w-4" />}
                label="Ongoing"
                value={String(stats.ongoingClasses)}
                tone="amber"
              />
            </div>

            {/* Today's Classes */}
            {todayClasses.length > 0 ? (
              <div>
                <SectionHeader
                  icon={<Flame className="h-4 w-4 text-rose-500" />}
                  title="Today's Classes"
                  count={todayClasses.length}
                  tone="rose"
                />
                <div className="mt-3 space-y-2.5">
                  {todayClasses.map((c) => (
                    <ClassListItem key={c._id} row={c} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200">
                  <Calendar className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-600 font-semibold text-sm">
                  No classes scheduled today
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Enjoy your day off 🎉
                </p>
              </div>
            )}

            {/* Upcoming Classes */}
            {upcomingClasses.length > 0 && (
              <div>
                <SectionHeader
                  icon={<Clock className="h-4 w-4 text-sky-500" />}
                  title="Upcoming Classes"
                  count={upcomingClasses.length}
                  tone="sky"
                />
                <div className="mt-3 space-y-2.5">
                  {upcomingClasses.map((c) => (
                    <ClassListItem key={c._id} row={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================= */}
        {/* TAB: TODAY                                         */}
        {/* ================================================= */}

        {activeTab === 'today' && (
          <div className="p-5">
            {todayClasses.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200">
                  <Calendar className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">
                  No classes today
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  You have a free day. Relax and enjoy! 🌴
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((c) => (
                  <ClassListItem key={c._id} row={c} expanded />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================= */}
        {/* TAB: ALL                                           */}
        {/* ================================================= */}

        {activeTab === 'all' && (
          <div className="p-5 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search classes by course, teacher, or notes..."
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

            {filteredAllClasses.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Search className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">
                  No matches found
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAllClasses.map((c) => (
                  <ClassListItem key={c._id} row={c} expanded />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* SECURITY NOTICE                                    */}
      {/* ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">
              LiveKit · Privacy &amp; Security
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              All your classes are live-only sessions with end-to-end
              encrypted video and audio. Nothing is recorded.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" />
                Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                <Lock className="h-3 w-3" />
                No Recording
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" />
                LiveKit Cloud
              </span>
            </div>
          </div>
        </div>
      </div>
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

/* ------------------ Quick Tile ------------------ */

function QuickTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'sky' | 'violet' | 'emerald' | 'amber';
}) {
  const toneMap = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  }[tone];

  return (
    <div className={`rounded-xl border ${toneMap} p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="h-6 w-6 rounded-lg bg-white flex items-center justify-center">
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
          {label}
        </p>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

/* ------------------ Section Header ------------------ */

function SectionHeader({
  icon,
  title,
  count,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  tone: 'rose' | 'sky';
}) {
  const toneMap = {
    rose: 'bg-rose-500 text-white',
    sky: 'bg-sky-500 text-white',
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <span
        className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full ${toneMap} text-[10px] font-bold`}
      >
        {count}
      </span>
    </div>
  );
}

/* ------------------ Class List Item ------------------ */

function ClassListItem({
  row,
  expanded = false,
}: {
  row: ClassRow;
  expanded?: boolean;
}) {
  const hasLiveKit = row.hasLiveKit && Boolean(row.livekitRoomName);
  const isOngoing = row.status === 'ongoing';
  const isCompleted = row.status === 'completed';
  const todayName = getTodayName();

  return (
    <div
      className={`rounded-xl border p-3.5 transition-all hover:shadow-sm ${
        row.isToday
          ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 ring-1 ring-rose-100'
          : isOngoing
          ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 ring-1 ring-amber-100'
          : isCompleted
          ? 'border-slate-200 bg-slate-50/70 opacity-90'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            row.isToday
              ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
              : isOngoing
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
              : 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white'
          }`}
        >
          <BookOpen className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  {row.courseName}
                </h4>

                {row.isToday && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                    <Flame className="h-3 w-3" />
                    Today
                  </span>
                )}

                {isOngoing && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <Radio className="h-3 w-3" />
                    Live
                  </span>
                )}

                {hasLiveKit && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                    <Signal className="h-3 w-3" />
                    Ready
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  {row.teacherName}
                </span>
                <span className="opacity-50">·</span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  {row.startTime} – {row.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Days */}
          {expanded && row.daysOfWeek.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {row.daysOfWeek.map((day) => {
                const dayIsToday = day === todayName;
                return (
                  <span
                    key={`${row._id}-${day}`}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      dayIsToday
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                        : 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
                    }`}
                  >
                    {DAY_SHORT[day] || day}
                  </span>
                );
              })}
            </div>
          )}

          {/* Notes (expanded) */}
          {expanded && row.notes && (
            <div className="mt-2.5 rounded-lg bg-white border border-slate-100 px-2.5 py-1.5">
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {row.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {hasLiveKit ? (
              <Link
                href={`/student/classroom/${row._id}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition shadow-sm ${
                  row.isToday
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:shadow-md'
                    : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:shadow-md'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                Join Classroom
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <Info className="h-3.5 w-3.5" />
                Waiting for teacher
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}