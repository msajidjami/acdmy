'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Calendar, Clock, Video, Search, X, Users,
} from 'lucide-react';

import TeacherLiveKitClassroomLoader from '@/app/components/teacher/TeacherLiveKitClassroomLoader';

type ClassRow = {
  _id: string;
  studentName: string;
  fatherName: string;
  courseName: string;
  courseId: string;
  totalPages: number;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  livekitRoomName: string;
  livekitHostIdentity: string;
  livekitProvider: string;
};

type PlanReason =
  | 'active' | 'no-subscription' | 'pending' | 'expired' | 'unpaid' | 'no-academy';

type Props = {
  teacherName: string;
  teacherEmail: string;
  classes: ClassRow[];
  hasPlan: boolean;
  academyName: string;
  planReason: PlanReason;
};

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

function todayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function formatStatus(s: string): string {
  return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------- No plan view ---------- */
function NoPlanView({ planReason, academyName }: { planReason: PlanReason; academyName: string }) {
  const title =
    planReason === 'no-academy' ? 'Academy setup incomplete'
    : planReason === 'no-subscription' ? 'No active plan'
    : planReason === 'pending' ? 'Payment under review'
    : planReason === 'expired' ? 'Plan expired'
    : 'Payment not confirmed';

  const description =
    planReason === 'no-academy' ? 'Your academy has not been set up yet. Contact your academy owner to complete the setup.'
    : planReason === 'no-subscription' ? 'Your academy does not have an active subscription. Classes will appear once the owner subscribes.'
    : planReason === 'pending' ? 'The subscription payment is under review. Classes will appear once it is verified.'
    : planReason === 'expired' ? 'The subscription has expired. Ask the owner to renew the plan to restore access.'
    : 'The subscription payment is not confirmed yet. Classes will appear once payment is completed.';

  return (
    <div className="max-w-lg mx-auto py-12 px-4 text-center">
      <div className="h-14 w-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
        <BookOpen className="h-7 w-7 text-slate-400" />
      </div>
      <h1 className="mt-5 text-xl font-semibold text-slate-900">{title}</h1>
      {academyName && <p className="mt-1 text-sm text-slate-500">{academyName}</p>}
      <p className="mt-3 text-sm text-slate-500 leading-relaxed">{description}</p>
      <p className="mt-5 text-xs text-slate-400">Only the academy owner can manage subscriptions.</p>
    </div>
  );
}

/* ---------- Main ---------- */
export default function ClassesView({
  teacherName, teacherEmail, classes, hasPlan, academyName, planReason,
}: Props) {
  const today = todayName();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'scheduled' | 'ongoing'>('all');
  const [day, setDay] = useState('all');
  const [todayOnly, setTodayOnly] = useState(false);
  const [activeClass, setActiveClass] = useState<ClassRow | null>(null);

  useEffect(() => {
    if (activeClass) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [activeClass]);

  const isToday = (row: ClassRow) => row.daysOfWeek.includes(today);

  const stats = useMemo(() => ({
    total: classes.length,
    today: classes.filter(isToday).length,
    scheduled: classes.filter((c) => c.status === 'scheduled').length,
    ongoing: classes.filter((c) => c.status === 'ongoing').length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [classes, today]);

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
    if (status !== 'all') result = result.filter((c) => c.status === status);
    if (day !== 'all') result = result.filter((c) => c.daysOfWeek.includes(day));
    if (todayOnly) result = result.filter(isToday);

    return [...result].sort((a, b) => {
      const at = isToday(a) ? 0 : 1;
      const bt = isToday(b) ? 0 : 1;
      if (at !== bt) return at - bt;
      const ao = a.status === 'ongoing' ? 0 : 1;
      const bo = b.status === 'ongoing' ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return String(a.startTime).localeCompare(String(b.startTime));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, search, status, day, todayOnly, today]);

  const hasFilters = search.trim() !== '' || status !== 'all' || day !== 'all' || todayOnly;

  const clearAll = () => {
    setSearch(''); setStatus('all'); setDay('all'); setTodayOnly(false);
  };

  if (!hasPlan) return <NoPlanView planReason={planReason} academyName={academyName} />;

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Classes</h1>
          <p className="text-sm text-slate-500 mt-1 truncate">{teacherName} · {teacherEmail}</p>
        </div>

        {/* Stats — 2 cols mobile, 4 desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Stat label="Total" value={stats.total} />
          <Stat label="Today" value={stats.today} accent={stats.today > 0} />
          <Stat label="Scheduled" value={stats.scheduled} />
          <Stat label="Ongoing" value={stats.ongoing} />
        </div>

        {/* Filters */}
        {classes.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search classes..."
                className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-400 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterPill active={status === 'all'} onClick={() => setStatus('all')}>
                All ({classes.length})
              </FilterPill>
              <FilterPill active={status === 'scheduled'} onClick={() => setStatus('scheduled')}>
                Scheduled ({stats.scheduled})
              </FilterPill>
              <FilterPill active={status === 'ongoing'} onClick={() => setStatus('ongoing')}>
                Ongoing ({stats.ongoing})
              </FilterPill>
              <FilterPill
                active={todayOnly}
                disabled={stats.today === 0}
                onClick={() => setTodayOnly((v) => !v)}
              >
                Today
              </FilterPill>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400 mr-1">Day:</span>
              <FilterPill active={day === 'all'} onClick={() => setDay('all')}>All</FilterPill>
              {DAYS.map((d) => {
                const count = classes.filter((c) => c.daysOfWeek.includes(d)).length;
                if (count === 0) return null;
                return (
                  <FilterPill key={d} active={day === d} onClick={() => setDay(d)} today={d === today}>
                    {DAY_SHORT[d]} ({count})
                  </FilterPill>
                );
              })}
            </div>

            {hasFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">Showing {filtered.length} of {classes.length}</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* List */}
        {classes.length === 0 ? (
          <EmptyState
            title="No classes assigned yet"
            message="Your academy owner has not assigned any active classes to you yet."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matches found"
            message="Try adjusting your search or filters."
            action={hasFilters ? { label: 'Clear filters', onClick: clearAll } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
            {filtered.map((row) => (
              <ClassCard key={row._id} row={row} today={today} onStart={() => setActiveClass(row)} />
            ))}
          </div>
        )}
      </div>

      {/* ================= FULLSCREEN CLASSROOM ================= */}
      {activeClass && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 bg-slate-950/60 backdrop-blur">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{activeClass.courseName}</p>
              <p className="text-xs text-white/50 truncate">
                {activeClass.studentName}
                {activeClass.fatherName ? ` · ${activeClass.fatherName}` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveClass(null)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <TeacherLiveKitClassroomLoader
              assignmentId={activeClass._id}
              roomName={activeClass.livekitRoomName}
              hostIdentity={activeClass.livekitHostIdentity}
              teacherName={teacherName}
              teacherEmail={teacherEmail}
              courseName={activeClass.courseName}
              studentName={activeClass.studentName}
              courseId={activeClass.courseId}
              totalPages={activeClass.totalPages}
              pagesCompletedSoFar={0}
              autoConnect
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   Small components
   ============================================================ */

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <p className={`text-xl sm:text-2xl font-semibold ${accent ? 'text-rose-600' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function FilterPill({
  children, active, disabled, today, onClick,
}: {
  children: React.ReactNode; active: boolean; disabled?: boolean; today?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'px-2.5 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap',
        disabled ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-500'
        : active ? 'bg-slate-900 text-white'
        : today ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function EmptyState({
  title, message, action,
}: {
  title: string; message: string; action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-12 sm:py-14 px-6 text-center">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function ClassCard({ row, today, onStart }: { row: ClassRow; today: string; onStart: () => void }) {
  const ready = Boolean(row.livekitRoomName);
  const isToday = row.daysOfWeek.includes(today);
  const isOngoing = row.status === 'ongoing';

  return (
    <article
      className={[
        'bg-white border rounded-2xl p-4 sm:p-5 transition',
        isToday ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-200',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">{row.courseName}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-medium truncate">{row.studentName}</span>
            {row.fatherName && <span className="text-slate-400 truncate">· {row.fatherName}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {isToday && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
              Today
            </span>
          )}
          <span
            className={[
              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
              isOngoing ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600',
            ].join(' ')}
          >
            {formatStatus(row.status)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-700 mb-3">
        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="font-medium">{row.startTime || '--:--'}</span>
        <span className="text-slate-300">–</span>
        <span className="font-medium">{row.endTime || '--:--'}</span>
      </div>

      {row.daysOfWeek.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {row.daysOfWeek.map((d) => {
            const isDayToday = d === today;
            return (
              <span
                key={d}
                className={[
                  'px-2 py-0.5 text-[11px] font-medium rounded-md',
                  isDayToday ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600',
                ].join(' ')}
              >
                {DAY_SHORT[d] || d}
              </span>
            );
          })}
        </div>
      )}

      {row.notes && (
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">{row.notes}</p>
      )}

      {ready ? (
        <button
          type="button"
          onClick={onStart}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
        >
          <Video className="h-4 w-4" />
          Start class
        </button>
      ) : (
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          Classroom not ready yet
        </p>
      )}
    </article>
  );
}