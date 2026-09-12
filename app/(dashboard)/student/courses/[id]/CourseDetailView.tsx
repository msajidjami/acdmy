'use client';

import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  BookMarked,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  Award,
  Target,
  Calendar,
  History,
  Info,
  GraduationCap,
  Mail,
  Play,
  ArrowRight,
  Activity,
  Star,
  Layers,
  BarChart3,
} from 'lucide-react';
import ProgressRing from '@/app/components/ProgressRing';
import ProgressChart from '@/app/components/ProgressChart';

/* ======================================================
   Types
   ====================================================== */

type Course = {
  _id: string;
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  bookTitle: string;
  price: number;
  duration: string;
  level: string;
  category: string;
  accentColor: string;
  totalPages: number;
  isActive: boolean;
};

type Teacher = {
  _id: string;
  name: string;
  email: string;
  imageUrl: string;
  subjects: string[];
};

type SessionRow = {
  date: string | null;
  pagesCovered: number;
  startPage: number;
  endPage: number;
  note: string;
  teacherName: string;
};

type Bar = {
  date: string;
  pages: number;
  startPage: number;
  endPage: number;
  note: string;
  teacherId: string;
};

type Progress = {
  pagesCompleted: number;
  pagesRemaining: number;
  percent: number;
  sessionsCount: number;
  bars: Bar[];
  recentSessions: SessionRow[];
  lastSessionAt: string | null;
};

type ClassSchedule = {
  _id: string;
  teacherName: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: string;
};

type Student = {
  _id: string;
  name: string;
  email: string;
  classLevel: string;
  imageUrl: string;
};

type Props = {
  course: Course;
  teachers: Teacher[];
  progress: Progress;
  classSchedule: ClassSchedule[];
  student: Student;
};

/* ======================================================
   Constants
   ====================================================== */

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const LEVEL_META: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  beginner: {
    label: 'Beginner',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
  },
  intermediate: {
    label: 'Intermediate',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
  },
  advanced: {
    label: 'Advanced',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
  },
};

/* ======================================================
   Helpers
   ====================================================== */

function getInitials(name: string): string {
  if (!name) return 'T';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/* ======================================================
   Main Component
   ====================================================== */

export default function CourseDetailView({
  course,
  teachers,
  progress,
  classSchedule,
  student,
}: Props) {
  const accent = course.accentColor || '#0ea5e9';
  const level = LEVEL_META[course.level] || LEVEL_META.beginner;
  const isCompleted = progress.percent >= 100 && course.totalPages > 0;

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

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Progress Ring */}
          {course.totalPages > 0 && (
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-white/15 backdrop-blur-sm" />
                <ProgressRing
                  percent={progress.percent}
                  size={110}
                  stroke={9}
                  color="#ffffff"
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-[11px] font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Course Progress
              </span>

              <span
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/15 backdrop-blur-sm border border-white/20'
                }`}
              >
                {isCompleted ? (
                  <>
                    <Award className="h-3 w-3" />
                    Completed
                  </>
                ) : (
                  <>
                    <Activity className="h-3 w-3" />
                    In Progress
                  </>
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight break-words">
              {course.title}
            </h1>

            {course.bookTitle && (
              <p className="mt-2 text-cyan-50 text-sm sm:text-base flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                {course.bookTitle}
              </p>
            )}

            {/* Meta pills */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {course.totalPages > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  {progress.pagesCompleted} / {course.totalPages} pages
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
                <History className="h-3.5 w-3.5" />
                {progress.sessionsCount} session
                {progress.sessionsCount !== 1 ? 's' : ''}
              </span>

              {teachers.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
                  <Users className="h-3.5 w-3.5" />
                  {teachers.length} teacher
                  {teachers.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          COMPLETED BANNER
      ============================================ */}

      {isCompleted && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-emerald-900 text-base">
                MashaAllah! Book Completed 🎉
              </h2>
              <p className="mt-1 text-sm text-emerald-700 leading-relaxed">
                You have successfully covered all{' '}
                <span className="font-bold">{course.totalPages}</span> pages
                of this book.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          STATS CARDS
      ============================================ */}

      {course.totalPages > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatBox
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Completed"
            value={String(progress.pagesCompleted)}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatBox
            icon={<Target className="h-5 w-5" />}
            label="Remaining"
            value={String(progress.pagesRemaining)}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatBox
            icon={<TrendingUp className="h-5 w-5" />}
            label="Progress"
            value={`${progress.percent}%`}
            color="text-sky-600"
            bg="bg-sky-50"
          />
          <StatBox
            icon={<History className="h-5 w-5" />}
            label="Sessions"
            value={String(progress.sessionsCount)}
            color="text-violet-600"
            bg="bg-violet-50"
          />
        </div>
      )}

      {/* ============================================
          BOOK PROGRESS BAR
      ============================================ */}

      {course.totalPages > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: `${accent}15` }}
            >
              <BookOpen className="h-5 w-5" style={{ color: accent }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Book Progress
              </h2>
              <p className="text-[11px] text-slate-500">
                {progress.pagesCompleted} of {course.totalPages} pages covered
              </p>
            </div>
          </div>

          {/* Progress bar with markers */}
          <div className="relative">
            <div className="h-3.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, progress.percent)}%`,
                  background: isCompleted
                    ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                    : `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                }}
              />
            </div>

            {/* Percentage label inside */}
            {progress.percent >= 15 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 text-[9px] font-bold text-white"
                style={{
                  left: `calc(${Math.min(100, progress.percent)}% - 32px)`,
                }}
              >
                {progress.percent}%
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
            <span className="inline-flex items-center gap-1">
              <BookMarked className="h-3 w-3" />
              Page 1
            </span>
            <span className="font-mono font-bold text-slate-600">
              {progress.pagesCompleted}/{course.totalPages}
            </span>
            <span>Page {course.totalPages}</span>
          </div>

          {/* Last session info */}
          {progress.lastSessionAt && (
            <p className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Last session: {timeAgo(progress.lastSessionAt)}
            </p>
          )}
        </div>
      )}

      {/* ============================================
          SESSION CHART
      ============================================ */}

      {progress.bars.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Progress Chart
              </h2>
              <p className="text-[11px] text-slate-500">
                Pages covered per session
              </p>
            </div>
          </div>

          <ProgressChart
            bars={progress.bars.map((b) => ({
              date: b.date,
              pages: b.pages,
            }))}
            height={150}
            accentColor={accent}
            emptyLabel="No sessions yet"
          />
        </div>
      )}

      {/* ============================================
          RECENT SESSIONS
      ============================================ */}

      {progress.recentSessions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <History className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Recent Sessions
              </h2>
              <p className="text-[11px] text-slate-500">
                Your latest class activities
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {progress.recentSessions.map((s, i) => (
              <div
                key={i}
                className="p-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                    style={{ background: accent }}
                  >
                    +{s.pagesCovered}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {s.pagesCovered} page
                          {s.pagesCovered !== 1 ? 's' : ''} covered
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pages {s.startPage} – {s.endPage}
                          {s.teacherName && (
                            <>
                              {' · '}
                              <span className="text-slate-600 font-medium">
                                {s.teacherName}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <p className="text-[10px] text-slate-400 shrink-0">
                        {timeAgo(s.date)}
                      </p>
                    </div>

                    {/* Note */}
                    {s.note && (
                      <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {s.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          COURSE DETAILS
      ============================================ */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-sm">
            <Info className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Course Information
            </h2>
            <p className="text-xs text-slate-500">
              Details about this course
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {/* Description */}
          {course.description && (
            <div className="mb-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                About this course
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {course.description}
              </p>
            </div>
          )}

          {/* Info tiles */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              icon={<BookOpen className="h-4 w-4" />}
              label="Book"
              value={course.bookTitle || 'Not set'}
              tone="sky"
            />
            <InfoTile
              icon={<Layers className="h-4 w-4" />}
              label="Level"
              value={level.label}
              tone="emerald"
            />
            {course.category && (
              <InfoTile
                icon={<Star className="h-4 w-4" />}
                label="Category"
                value={course.category}
                tone="violet"
              />
            )}
            {course.duration && (
              <InfoTile
                icon={<Clock className="h-4 w-4" />}
                label="Duration"
                value={course.duration}
                tone="amber"
              />
            )}
            {course.totalPages > 0 && (
              <InfoTile
                icon={<BookMarked className="h-4 w-4" />}
                label="Total Pages"
                value={String(course.totalPages)}
                tone="rose"
              />
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          MY TEACHERS
      ============================================ */}

      {teachers.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                My Teachers
              </h2>
              <p className="text-xs text-slate-500">
                Teachers for this course
              </p>
            </div>
          </div>

          <div className="p-5 grid gap-3 sm:grid-cols-2">
            {teachers.map((t) => (
              <div
                key={t._id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
              >
                {/* Avatar */}
                {t.imageUrl ? (
                  <div className="h-11 w-11 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.imageUrl}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(t.name)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {t.name}
                  </p>
                  {t.subjects.length > 0 && (
                    <p className="text-[11px] text-slate-500 truncate">
                      {t.subjects.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          CLASS SCHEDULE
      ============================================ */}

      {classSchedule.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Class Schedule
                </h2>
                <p className="text-xs text-slate-500">
                  Your weekly classes
                </p>
              </div>
            </div>

            <Link
              href="/student/schedule"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition shrink-0"
            >
              Full Schedule
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-5 space-y-3">
            {classSchedule.map((c) => (
              <div
                key={c._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono">
                      {c.startTime} – {c.endTime}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                    <Users className="h-3 w-3" />
                    {c.teacherName}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    {c.status}
                  </span>
                </div>

                {c.daysOfWeek.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.daysOfWeek.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-50 border border-sky-100 text-sky-700 text-[10px] font-bold"
                      >
                        {DAY_SHORT[d] || d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          FOOTER
      ============================================ */}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">
              You are enrolled in this course
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Your progress is tracked automatically when your teachers log
              pages after each class. Contact your teacher if you notice
              any issue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   Sub Components
   ====================================================== */

function StatBox({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`h-9 w-9 rounded-lg ${bg} ${color} flex items-center justify-center mb-2`}
      >
        {icon}
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose';
}) {
  const toneMap = {
    sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={`h-7 w-7 rounded-lg ${toneMap.bg} ${toneMap.text} flex items-center justify-center`}
        >
          {icon}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
    </div>
  );
}