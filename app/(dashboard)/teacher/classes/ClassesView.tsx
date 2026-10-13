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

/* ✅ Sidebar width — layout ke SIDEBAR_W (256) کے برابر */
const SIDEBAR_W = 256;
const DESKTOP_MIN = 1024; // Tailwind lg breakpoint
const NAVBAR_H_FALLBACK = 56;

function todayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function initials(name: string): string {
  return name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';
}

/* ============================================================
   Navbar height — صرف sticky/fixed top navbar measure کریں
   ============================================================ */
function useNavHeight() {
  const [navHeight, setNavHeight] = useState(NAVBAR_H_FALLBACK);

  useEffect(() => {
    const measure = () => {
      const navs = Array.from(document.querySelectorAll('nav'));
      for (const n of navs) {
        const rect = n.getBoundingClientRect();
        if (rect.height === 0) continue;
        const cs = window.getComputedStyle(n);
        if (cs.position === 'sticky' || cs.position === 'fixed') {
          if (cs.bottom !== 'auto') continue; // skip bottom-fixed bars
          setNavHeight(rect.height || NAVBAR_H_FALLBACK);
          return;
        }
      }
      setNavHeight(NAVBAR_H_FALLBACK);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return navHeight;
}

/* ============================================================
   Sidebar offset — desktop pe 256px، mobile pe 0
   ✅ inline style سے لگائیں گے، Tailwind پر انحصار نہیں
   ============================================================ */
function useSidebarOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const check = () => {
      setOffset(window.innerWidth >= DESKTOP_MIN ? SIDEBAR_W : 0);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return offset;
}

/* ---------- No plan view ---------- */
function NoPlanView({
  planReason,
  academyName,
}: {
  planReason: PlanReason;
  academyName: string;
}) {
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

/* ============================================================
   Main
   ============================================================ */
export default function ClassesView({
  teacherName, teacherEmail, classes, hasPlan, academyName, planReason,
}: Props) {
  const today = todayName();
  const navHeight = useNavHeight();
  const sidebarOffset = useSidebarOffset();

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

  const hasFilters =
    search.trim() !== '' || status !== 'all' || day !== 'all' || todayOnly;

  const clearAll = () => {
    setSearch(''); setStatus('all'); setDay('all'); setTodayOnly(false);
  };

  if (!hasPlan) {
    return (
      <div
        style={{
          paddingTop: navHeight + 12,
          paddingLeft: sidebarOffset,
        }}
      >
        <NoPlanView planReason={planReason} academyName={academyName} />
      </div>
    );
  }

  return (
    <>
      {/* ============================================================
          Fixed container — navbar کے نیچے، sidebar کے دائیں طرف
          ✅ `left` inline style سے دیا — Tailwind پر انحصار نہیں
          ✅ z-index: 30 (sidebar سے کم — overlap نہیں ہوگا)
          ============================================================ */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          position: 'fixed',
          top: navHeight,
          left: sidebarOffset,
          right: 0,
          bottom: 0,
          zIndex: 30,
          background: '#f1f5f9',
        }}
      >
        {/* ============================================
            WHATSAPP-STYLE HEADER
            ============================================ */}
        <header
          style={{
            flexShrink: 0,
            background: '#059669',
            color: '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            zIndex: 10,
          }}
        >
          {/* Row 1: avatar + title + count + search */}
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                {initials(teacherName)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-emerald-600 bg-emerald-300" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                My Classes
              </p>
              <p className="text-[11px] opacity-90 leading-tight truncate">
                {stats.total} total · {stats.today} today
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('class-search');
                el?.focus();
              }}
              className="p-2 rounded-full hover:bg-emerald-700 transition"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Row 2: search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <input
                id="class-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search classes..."
                className="w-full pl-9 pr-9 py-1.5 bg-white/20 placeholder:text-white/60 text-white text-sm rounded-lg focus:outline-none focus:bg-white/30 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Row 3: filter pills */}
          <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <FilterPill
              active={status === 'all' && !todayOnly}
              onClick={() => { setStatus('all'); setTodayOnly(false); }}
            >
              All ({stats.total})
            </FilterPill>
            <FilterPill
              active={todayOnly}
              disabled={stats.today === 0}
              onClick={() => setTodayOnly((v) => !v)}
              highlight
            >
              Today ({stats.today})
            </FilterPill>
            <FilterPill
              active={status === 'scheduled'}
              onClick={() => { setStatus('scheduled'); setTodayOnly(false); }}
            >
              Scheduled ({stats.scheduled})
            </FilterPill>
            <FilterPill
              active={status === 'ongoing'}
              onClick={() => { setStatus('ongoing'); setTodayOnly(false); }}
            >
              Ongoing ({stats.ongoing})
            </FilterPill>
            {DAYS.map((d) => {
              const count = classes.filter((c) => c.daysOfWeek.includes(d)).length;
              if (count === 0) return null;
              return (
                <FilterPill
                  key={d}
                  active={day === d}
                  onClick={() => setDay(day === d ? 'all' : d)}
                >
                  {DAY_SHORT[d]} ({count})
                </FilterPill>
              );
            })}
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* ============================================
            LIST
            ============================================ */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ background: '#ffffff' }}
        >
          {classes.length === 0 ? (
            <EmptyState
              icon="empty"
              title="No classes assigned yet"
              message="Your academy owner has not assigned any active classes to you yet."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="No matches found"
              message="Try adjusting your search or filters."
              action={hasFilters ? { label: 'Clear filters', onClick: clearAll } : undefined}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <ClassRowItem
                  key={row._id}
                  row={row}
                  today={today}
                  onStart={() => setActiveClass(row)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ============================================================
          FULLSCREEN CLASSROOM
          ✅ بھی inline `left` سے — sidebar کے دائیں طرف
          ============================================================ */}
      {activeClass && (
        <div
          className="flex flex-col"
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: sidebarOffset,
            right: 0,
            zIndex: 100,
            background: '#0f172a',
          }}
        >
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-white/10 bg-slate-950/60 backdrop-blur shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {initials(activeClass.studentName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {activeClass.courseName}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {activeClass.studentName}
                  {activeClass.fatherName ? ` · ${activeClass.fatherName}` : ''}
                </p>
              </div>
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

          <div className="flex-1 min-h-0 overflow-hidden">
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
   Class Row Item
   ============================================================ */

function ClassRowItem({
  row, today, onStart,
}: {
  row: ClassRow;
  today: string;
  onStart: () => void;
}) {
  const ready = Boolean(row.livekitRoomName);
  const isToday = row.daysOfWeek.includes(today);
  const isOngoing = row.status === 'ongoing';
  const hasUnread = isToday && isOngoing;

  return (
    <li>
      <button
        type="button"
        onClick={onStart}
        disabled={!ready}
        className={[
          'w-full text-left flex items-center gap-3 px-3 sm:px-4 py-3 transition',
          ready
            ? 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer'
            : 'opacity-60 cursor-not-allowed',
        ].join(' ')}
      >
        <div className="relative shrink-0">
          <div
            className={`h-12 w-12 rounded-full ${
              isOngoing
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : isToday
                ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                : 'bg-gradient-to-br from-slate-500 to-slate-600'
            } flex items-center justify-center text-white font-bold text-sm shadow-sm`}
          >
            {initials(row.studentName)}
          </div>

          {isOngoing && ready && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
          )}

          {!ready && (
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-white bg-amber-500 flex items-center justify-center">
              <Clock className="h-2.5 w-2.5 text-white" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className={`text-[15px] truncate ${
                hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'
              }`}
            >
              {row.courseName}
            </p>
            {isToday && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                Today
              </span>
            )}
            {isOngoing && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <Users className="h-3 w-3 text-slate-400 shrink-0" />
            <p className="text-[13px] text-slate-600 truncate">
              {row.studentName}
              {row.fatherName && (
                <span className="text-slate-400"> · {row.fatherName}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
            <p className="text-[12px] text-slate-500 truncate">
              {row.startTime || '--:--'} – {row.endTime || '--:--'}
              {row.daysOfWeek.length > 0 && (
                <span className="text-slate-400">
                  {' · '}
                  {row.daysOfWeek.map((d) => DAY_SHORT[d] || d).join(', ')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {ready ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold ${
                isOngoing
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {isOngoing ? 'Join' : 'Start'}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <Calendar className="h-3 w-3" />
              Not ready
            </span>
          )}

          {row.totalPages > 0 && (
            <span className="text-[10px] text-slate-400">
              {row.totalPages} pages
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

/* ============================================================
   Small components
   ============================================================ */

function FilterPill({
  children, active, disabled, highlight, onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'shrink-0 px-2.5 py-1 text-xs font-medium rounded-full transition whitespace-nowrap',
        disabled
          ? 'opacity-40 cursor-not-allowed bg-white/10 text-white/60'
          : active
          ? 'bg-white text-emerald-700 shadow-sm'
          : highlight
          ? 'bg-rose-500/30 text-white hover:bg-rose-500/40'
          : 'bg-white/15 text-white hover:bg-white/25',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function EmptyState({
  icon, title, message, action,
}: {
  icon: 'empty' | 'search';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="h-20 w-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-5">
        {icon === 'search' ? (
          <Search className="h-10 w-10 text-emerald-600" />
        ) : (
          <BookOpen className="h-10 w-10 text-emerald-600" />
        )}
      </div>
      <p className="text-base font-bold text-slate-800">{title}</p>
      <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}