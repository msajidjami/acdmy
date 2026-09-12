// app/owner/courses/[id]/progress-section.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  UsersIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  ArrowPathIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import ProgressChart from '@/app/components/ProgressChart';
import ProgressRing from '@/app/components/ProgressRing';

/* ============================================================
   TYPES
   ============================================================ */

type StudentRow = {
  studentId: string;
  name: string;
  classLevel: string;
  imageUrl: string;
  pagesCompleted: number;
  pagesRemaining: number;
  totalPages: number;
  percent: number;
  sessionsCount: number;
  recentBars: { date: string; pages: number }[];
  lastSessionAt: string | null;
};

type Summary = {
  totalStudents: number;
  avgPercent: number;
  completed: number;
};

type CourseInfo = {
  _id: string;
  title: string;
  bookTitle: string;
  totalPages: number;
};

type ApiResponse = {
  course: CourseInfo;
  students: StudentRow[];
  summary: Summary;
};

type Props = {
  courseId: string;
  accentColor?: string;
};

/* ============================================================
   HELPERS
   ============================================================ */

function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function CourseProgressSection({
  courseId,
  accentColor = '#6366f1',
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* ------------------ Fetch ------------------ */

  const fetchProgress = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const res = await fetch(`/api/owner/courses/${courseId}/progress`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error('Course not found');
        throw new Error('Failed to load progress');
      }

      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Loading progress...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Fetching student data for this course
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------ Error ------------------ */

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-md shadow-rose-500/30">
            <ExclamationTriangleIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-900">
              Couldn&apos;t load progress
            </p>
            <p className="mt-1 text-xs text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchProgress(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------ Empty ------------------ */

  if (!data || data.students.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 sm:p-10 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
          <UserGroupIcon className="h-7 w-7 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          No students enrolled yet
        </h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Progress will appear here once students are assigned to this
          course through the owner assignments page.
        </p>
      </div>
    );
  }

  const { course, students, summary } = data;
  const hasBook = course.totalPages > 0;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="space-y-4">
      {/* ============================================
          HEADER — Book Info + Refresh
      ============================================ */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `${accentColor}15` }}
          >
            <BookmarkIcon
              className="h-5 w-5"
              style={{ color: accentColor }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {hasBook ? 'Book' : 'Course'}
            </p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {hasBook
                ? course.bookTitle || course.title
                : course.title}
            </p>
            {hasBook && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {course.totalPages} total pages
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchProgress(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-60 shrink-0 self-start sm:self-center"
        >
          <ArrowPathIcon
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ============================================
          SUMMARY CARDS
      ============================================ */}

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<UsersIcon className="h-4 w-4" />}
          label="Students"
          value={String(summary.totalStudents)}
          bg="bg-sky-50"
          text="text-sky-600"
        />

        <SummaryCard
          icon={<ArrowTrendingUpIcon className="h-4 w-4" />}
          label="Avg Progress"
          value={`${summary.avgPercent}%`}
          bg="bg-emerald-50"
          text="text-emerald-600"
        />

        <SummaryCard
          icon={<TrophyIcon className="h-4 w-4" />}
          label="Completed"
          value={String(summary.completed)}
          bg="bg-violet-50"
          text="text-violet-600"
        />
      </div>

      {/* ============================================
          STUDENT LIST
      ============================================ */}

      <div className="space-y-3">
        {students.map((s, index) => (
          <StudentProgressCard
            key={s.studentId}
            student={s}
            rank={index + 1}
            accentColor={accentColor}
            hasBook={hasBook}
          />
        ))}
      </div>

      {/* ============================================
          FOOTER NOTE
      ============================================ */}

      {hasBook && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex items-start gap-3">
          <div className="shrink-0 h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
            <ChartBarIcon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">
              Progress is logged by teachers
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
              Each time a teacher finishes a class, they log the pages
              covered. This view updates automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function SummaryCard({
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
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div
        className={`h-8 w-8 rounded-lg ${bg} ${text} flex items-center justify-center mb-2`}
      >
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
        {value}
      </p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

/* ============================================================
   STUDENT PROGRESS CARD
   ============================================================ */

function StudentProgressCard({
  student,
  rank,
  accentColor,
  hasBook,
}: {
  student: StudentRow;
  rank: number;
  accentColor: string;
  hasBook: boolean;
}) {
  const isCompleted = hasBook && student.percent >= 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Rank badge */}
        <div className="shrink-0 relative">
          {student.imageUrl ? (
            <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={student.imageUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md"
              style={{ background: accentColor }}
            >
              {getInitials(student.name)}
            </div>
          )}

          {/* Rank dot */}
          <span
            className={`absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold shadow-sm ${
              rank === 1
                ? 'bg-amber-400 text-amber-900'
                : rank === 2
                ? 'bg-slate-300 text-slate-700'
                : rank === 3
                ? 'bg-orange-300 text-orange-900'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            {rank}
          </span>
        </div>

        {/* Name + class */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 truncate">
              {student.name}
            </p>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                <CheckCircleIcon className="h-2.5 w-2.5" />
                Done
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
            {student.classLevel && (
              <span className="truncate">{student.classLevel}</span>
            )}
            {student.classLevel && student.sessionsCount > 0 && (
              <span className="text-slate-300">·</span>
            )}
            {student.sessionsCount > 0 && (
              <span className="shrink-0">
                {student.sessionsCount} session
                {student.sessionsCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Ring */}
        {hasBook && (
          <div className="shrink-0">
            <ProgressRing
              percent={student.percent}
              size={54}
              stroke={5}
              color={isCompleted ? '#10b981' : accentColor}
            />
          </div>
        )}
      </div>

      {/* Progress bar (only if has book) */}
      {hasBook && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium">Book progress</span>
            <span className="font-mono font-bold text-slate-800">
              {student.pagesCompleted} / {student.totalPages} pages
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, student.percent)}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                  : `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Mini chart */}
      {student.recentBars.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ChartBarIcon className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Recent Sessions
            </span>
          </div>
          <ProgressChart
            bars={student.recentBars}
            height={64}
            accentColor={isCompleted ? '#10b981' : accentColor}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          {hasBook ? (
            student.pagesRemaining > 0 ? (
              <>
                <BookmarkIcon className="h-3 w-3" />
                <span>
                  {student.pagesRemaining} page
                  {student.pagesRemaining !== 1 ? 's' : ''} remaining
                </span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">
                  Book completed
                </span>
              </>
            )
          ) : (
            <>
              <BookmarkIcon className="h-3 w-3" />
              <span>No book attached</span>
            </>
          )}
        </div>

        {student.lastSessionAt && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <ClockIcon className="h-3 w-3" />
            <span>Last: {timeAgo(student.lastSessionAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}