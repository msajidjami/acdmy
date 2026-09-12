'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Clock,
  Video,
  Flame,
  Activity,
  Radio,
  ArrowRight,
  CheckCircle2,
  School,
  TrendingUp,
  Layers,
  User as UserIcon,
  Info,
  Copy,
  Check,
  ExternalLink,
  PlayCircle,
  CalendarDays,
  Zap,
} from 'lucide-react';

/* ======================================================
   Types
   ====================================================== */

type StudentData = {
  _id: string;
  name: string;
  email: string;
  classLevel: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string | null;
};

type AcademyData = { _id: string; name: string } | null;

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
  hasZoom: boolean;
  zoomLink: string;
  zoomMeetingNumber: string;
  zoomPassword: string;
  zoomTimezone: string;
  isToday: boolean;
};

type Stats = {
  totalClasses: number;
  totalCourses: number;
  totalTeachers: number;
  todayClasses: number;
  upcomingClasses: number;
  ongoingClasses: number;
};

type Props = {
  student: StudentData;
  academy: AcademyData;
  stats: Stats;
  classes: ClassRow[];
};

/* ======================================================
   Helpers
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

function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatStatus(status: string): string {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ======================================================
   Component
   ====================================================== */

export default function StudentDashboardView({
  student,
  academy,
  stats,
  classes,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const initials = getInitials(student.name);

  const todayClasses = useMemo(
    () => classes.filter((c) => c.isToday),
    [classes]
  );
  const otherClasses = useMemo(
    () => classes.filter((c) => !c.isToday),
    [classes]
  );

  const handleCopy = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  };

  /* ======================================================
     Render
     ====================================================== */

  return (
    <div className="space-y-6">
      {/* ============================================
          HERO HEADER
      ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-teal-300/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              {student.imageUrl ? (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white border-2 border-white/40 shadow-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={student.imageUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-xl">
                  {initials}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-sky-500 ${
                  student.isActive
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
                title={student.isActive ? 'Active' : 'Inactive'}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Student Dashboard
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                Welcome back, {student.name}! 👋
              </h1>

              {academy?.name && (
                <p className="mt-1.5 text-cyan-50 text-sm sm:text-base">
                  Studying at {academy.name}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-medium">
                  <Layers className="h-3.5 w-3.5" />
                  {stats.totalClasses} Classes
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-medium">
                  <BookOpen className="h-3.5 w-3.5" />
                  {stats.totalCourses} Courses
                </span>

                {stats.todayClasses > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/25 backdrop-blur-sm border border-white/30 font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    {stats.todayClasses} Today
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          STATS CARDS
      ============================================ */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="My Classes"
          value={stats.totalClasses}
          icon={<Layers className="h-5 w-5" />}
          gradient="from-sky-500 to-cyan-600"
          bg="bg-sky-50"
          text="text-sky-600"
        />
        <StatCard
          title="My Courses"
          value={stats.totalCourses}
          icon={<BookOpen className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
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
          title="Today's Classes"
          value={stats.todayClasses}
          icon={<Flame className="h-5 w-5" />}
          gradient="from-rose-500 to-pink-600"
          bg="bg-rose-50"
          text="text-rose-600"
          highlight={stats.todayClasses > 0}
        />
      </div>

      {/* ============================================
          QUICK ACTIONS
      ============================================ */}

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Zap className="h-4 w-4 text-sky-500" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            href="/student/courses"
            title="My Courses"
            description="View enrolled courses"
            icon={<BookOpen className="h-5 w-5" />}
            bg="bg-sky-50"
            text="text-sky-600"
            border="hover:border-sky-400"
          />
          <QuickAction
            href="/student/teachers"
            title="My Teachers"
            description="Meet your teachers"
            icon={<Users className="h-5 w-5" />}
            bg="bg-emerald-50"
            text="text-emerald-600"
            border="hover:border-emerald-400"
          />
          <QuickAction
            href="/student/schedule"
            title="My Schedule"
            description="Weekly timetable"
            icon={<Calendar className="h-5 w-5" />}
            bg="bg-violet-50"
            text="text-violet-600"
            border="hover:border-violet-400"
          />
          <QuickAction
            href="/student/academy"
            title="My Academy"
            description="Academy details"
            icon={<School className="h-5 w-5" />}
            bg="bg-fuchsia-50"
            text="text-fuchsia-600"
            border="hover:border-fuchsia-400"
          />
        </div>
      </div>

      {/* ============================================
          TODAY'S CLASSES
      ============================================ */}

      {todayClasses.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50/50 to-pink-50/50 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-rose-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/30 shrink-0">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-rose-900">
                  Today&apos;s Classes
                </h2>
                <p className="text-xs text-rose-600">
                  You have {todayClasses.length} class
                  {todayClasses.length > 1 ? 'es' : ''} scheduled today
                </p>
              </div>
            </div>

            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              Live Today
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {todayClasses.map((cls) => (
              <ClassCard
                key={cls._id}
                cls={cls}
                highlight
                copied={copied}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          ALL CLASSES
      ============================================ */}

      <div>
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              My Classes
            </h2>
          </div>
          {otherClasses.length > 0 && (
            <Link
              href="/student/schedule"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition"
            >
              Full Schedule
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-sky-200 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              No classes yet
            </h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
              Your academy has not assigned you any classes yet. Please
              contact your academy administrator.
            </p>
          </div>
        ) : otherClasses.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-sm">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              All your classes are scheduled for today
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherClasses.map((cls) => (
              <ClassCard
                key={cls._id}
                cls={cls}
                copied={copied}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          FOOTER SUMMARY
      ============================================ */}

      {academy && student.createdAt && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm">
              <School className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-800">
                Student at {academy.name}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                You are enrolled as a student. Your classes, teachers, and
                courses are managed through this academy.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
                  Enrolled{' '}
                  {new Date(student.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {student.isActive && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                  <TrendingUp className="h-3 w-3" />
                  {stats.totalClasses} Classes
                </span>
              </div>
            </div>
          </div>
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
      className={`group relative bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-300 overflow-hidden ${
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
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${bg} flex items-center justify-center ${text} ${
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
      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
  bg,
  text,
  border,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 ${border} hover:shadow-lg transition-all duration-300`}
    >
      <div
        className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${bg} flex items-center justify-center shrink-0 ${text} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 hidden sm:block">
        <h3 className="font-bold text-slate-900 text-sm truncate">{title}</h3>
        <p className="text-[10px] text-slate-500 truncate">{description}</p>
      </div>
    </Link>
  );
}

function ClassCard({
  cls,
  highlight,
  copied,
  onCopy,
}: {
  cls: ClassRow;
  highlight?: boolean;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const daysSorted = [...cls.daysOfWeek].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );

  const isOngoing = cls.status === 'ongoing';

  return (
    <article
      className={`relative overflow-hidden rounded-2xl bg-white transition-all duration-300 ${
        highlight
          ? 'border-2 border-rose-300 shadow-lg shadow-rose-500/15 ring-1 ring-rose-100'
          : 'border border-slate-200 shadow-sm hover:shadow-lg'
      }`}
    >
      <div
        className={`h-1 bg-gradient-to-r ${
          highlight
            ? 'from-rose-500 via-pink-500 to-fuchsia-500'
            : isOngoing
            ? 'from-amber-500 to-orange-500'
            : 'from-sky-500 via-cyan-500 to-teal-500'
        }`}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`h-11 w-11 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                highlight
                  ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/30'
                  : isOngoing
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/30'
                  : 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-cyan-500/25'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              {highlight && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {cls.courseName}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                by {cls.teacherName}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {highlight && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-wider">
                <Flame className="h-2.5 w-2.5" />
                Today
              </span>
            )}
            {isOngoing ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider border border-emerald-200">
                <CheckCircle2 className="h-2.5 w-2.5" />
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

        {/* Weekly days */}
        {daysSorted.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {daysSorted.map((d) => {
              const isToday = cls.isToday && d === new Date().toLocaleDateString('en-US', { weekday: 'long' });
              return (
                <span
                  key={d}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    isToday
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/25'
                      : highlight
                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                      : 'bg-sky-50 text-sky-700 border border-sky-100'
                  }`}
                >
                  {DAY_SHORT[d] || d}
                </span>
              );
            })}
          </div>
        )}

        {/* Zoom strip */}
        {cls.hasZoom && (
          <div className="mb-3 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-sky-600" />
                <span className="text-slate-500">Meeting:</span>
                <span className="font-mono font-bold text-slate-800">
                  {cls.zoomMeetingNumber}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(cls.zoomMeetingNumber, `mid-${cls._id}`)
                  }
                  className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition"
                  title="Copy meeting number"
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
                  <span className="text-slate-500">Pass:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {cls.zoomPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(cls.zoomPassword, `pw-${cls._id}`)
                    }
                    className="h-5 w-5 rounded-md flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition"
                    title="Copy password"
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

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {cls.hasZoom && cls.zoomLink ? (
            <a
              href={cls.zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`group/btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition shadow-md ${
                highlight
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:shadow-lg hover:shadow-rose-500/30'
                  : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:shadow-lg hover:shadow-cyan-500/30'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              Join Class
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : cls.hasZoom ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <Info className="h-3.5 w-3.5" />
              Link not ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              <Info className="h-3.5 w-3.5" />
              No Zoom
            </span>
          )}
        </div>
      </div>
    </article>
  );
}