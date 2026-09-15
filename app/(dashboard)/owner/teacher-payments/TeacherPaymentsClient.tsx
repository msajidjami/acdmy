'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Banknote,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  Calendar,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  X,
  FileText,
  GraduationCap,
  Users,
  TrendingUp,
  Percent,
  Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/* ============================================================
   TYPES
   ============================================================ */

type PaymentStatus = 'pending' | 'paid' | 'partial';

interface PaymentRow {
  _id: string;
  assignmentId: string;
  teacherId: { _id: string; name: string; email: string } | null;
  studentId: { _id: string; name: string; email: string } | null;
  courseId: { _id: string; title: string } | null;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  month: string;
  amount: number;
  currency: 'PKR' | 'USD';
  status: PaymentStatus;
  paidAmount: number;
  paidAt: string | null;
  paymentMethod: string;
  notes: string;
}

interface PaymentsData {
  success: boolean;
  month: string;
  summary: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    paidCount: number;
    pendingCount: number;
    partialCount: number;
    totalCount: number;
    currency: 'PKR' | 'USD';
  };
  rows: PaymentRow[];
  teachers: { _id: string; name: string }[];
}

interface TeacherBreakdown {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  studentsCount: number;
  classesCount: number;
  totalExpected: number;
  totalPaid: number;
  totalOutstanding: number;
  fullyPaid: number;
  partiallyPaid: number;
  unpaid: number;
  rows: PaymentRow[];
  currency: 'PKR' | 'USD';
}

/* ============================================================
   HELPERS
   ============================================================ */

function formatMoney(n: number, c: 'PKR' | 'USD' = 'PKR'): string {
  const v = Number(n) || 0;
  return c === 'USD' ? `$${v.toFixed(2)}` : `₨${v.toLocaleString('en-PK')}`;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getInitials(name: string): string {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length === 1
    ? p[0].charAt(0).toUpperCase()
    : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
}

function getRowOutstanding(row: PaymentRow): number {
  if (row.status === 'paid') return 0;
  if (row.status === 'partial') {
    return Math.max(0, row.amount - (row.paidAmount || 0));
  }
  return row.amount;
}

function getRowPaid(row: PaymentRow): number {
  if (row.status === 'paid') return row.amount;
  if (row.status === 'partial') return row.paidAmount || 0;
  return 0;
}

const STATUS_META: Record<
  PaymentStatus,
  { label: string; classes: string; dot: string }
> = {
  paid: {
    label: 'Paid',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  partial: {
    label: 'Partial',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
};

/* ============================================================
   MAIN
   ============================================================ */

export default function TeacherPaymentsClient({
  academyName,
}: {
  academyName: string;
}) {
  const [month, setMonth] = useState(currentMonth());
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [data, setData] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const params = new URLSearchParams();
        params.set('month', month);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (teacherFilter !== 'all') params.set('teacher', teacherFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(
          `/api/owner/teacher-payments?${params.toString()}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || `HTTP ${res.status}`);
        }

        const d: PaymentsData = await res.json();
        setData(d);
        setError('');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [month, statusFilter, teacherFilter, search]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  /* ---------- Actions ---------- */
  const updatePayment = async (
    row: PaymentRow,
    updates: {
      status?: PaymentStatus;
      paidAmount?: number;
      paymentMethod?: string;
      notes?: string;
    }
  ) => {
    const targetId = row._id || row.assignmentId;
    if (!targetId) {
      toast.error('Payment record missing.');
      return;
    }
    setUpdating(targetId);
    try {
      const res = await fetch(`/api/owner/teacher-payments/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...updates, month: row.month }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Failed');
      toast.success('Teacher payment updated');
      await fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setUpdating(null);
      setEditing(null);
    }
  };

  const markPaid = (row: PaymentRow) => updatePayment(row, { status: 'paid' });
  const markPending = (row: PaymentRow) =>
    updatePayment(row, { status: 'pending' });

  const filteredRows = data?.rows || [];

  /* ============================================================
     COMPUTED
     ============================================================ */
  const summary = useMemo(() => {
    const rows = filteredRows;
    let expected = 0;
    let paid = 0;
    let outstanding = 0;
    let fullyPaid = 0;
    let partialPaid = 0;
    let unpaid = 0;

    for (const r of rows) {
      expected += r.amount || 0;
      paid += getRowPaid(r);
      outstanding += getRowOutstanding(r);

      if (r.status === 'paid') fullyPaid++;
      else if (r.status === 'partial') partialPaid++;
      else unpaid++;
    }

    const percentPaid =
      expected > 0 ? Math.round((paid / expected) * 100) : 0;

    return {
      expected,
      paid,
      outstanding,
      fullyPaid,
      partialPaid,
      unpaid,
      totalCount: rows.length,
      percentPaid,
      currency: rows[0]?.currency || 'PKR',
    };
  }, [filteredRows]);

  const teacherBreakdowns = useMemo<TeacherBreakdown[]>(() => {
    const map = new Map<string, TeacherBreakdown>();

    for (const row of filteredRows) {
      const tid = row.teacherId?._id || '__none__';
      const tname = row.teacherId?.name || 'No Teacher';
      const temail = row.teacherId?.email || '';

      let entry = map.get(tid);
      if (!entry) {
        entry = {
          teacherId: tid,
          teacherName: tname,
          teacherEmail: temail,
          studentsCount: 0,
          classesCount: 0,
          totalExpected: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          fullyPaid: 0,
          partiallyPaid: 0,
          unpaid: 0,
          rows: [],
          currency: row.currency || 'PKR',
        };
        map.set(tid, entry);
      }

      entry.classesCount++;
      entry.totalExpected += row.amount || 0;
      entry.totalPaid += getRowPaid(row);
      entry.totalOutstanding += getRowOutstanding(row);
      if (row.status === 'paid') entry.fullyPaid++;
      else if (row.status === 'partial') entry.partiallyPaid++;
      else entry.unpaid++;

      entry.rows.push(row);
    }

    for (const e of map.values()) {
      const sidSet = new Set(
        e.rows.map((r) => r.studentId?._id).filter(Boolean) as string[]
      );
      e.studentsCount = sidSet.size;
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.totalOutstanding !== a.totalOutstanding) {
        return b.totalOutstanding - a.totalOutstanding;
      }
      return a.teacherName.localeCompare(b.teacherName);
    });
  }, [filteredRows]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 pb-12">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider mb-3">
            <GraduationCap className="h-3 w-3" />
            Teacher Payouts
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Teacher Payments
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Track how much to pay each teacher for{' '}
            <strong className="text-slate-700">{monthLabel(month)}</strong> at{' '}
            <strong className="text-slate-700">{academyName}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/owner/payments"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition"
          >
            <Wallet className="h-4 w-4" />
            Student Payments
          </Link>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* MONTH SELECTOR */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonth(m, -1))}
            className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || currentMonth())}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            <button
              type="button"
              onClick={() => setMonth(currentMonth())}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 px-2"
            >
              This Month
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMonth((m) => addMonth(m, 1))}
            className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Payable"
              value={formatMoney(summary.expected, summary.currency)}
              subtitle={`${summary.totalCount} class${
                summary.totalCount !== 1 ? 'es' : ''
              } · Amount to pay teachers`}
              icon={<Banknote className="h-5 w-5" />}
              bg="bg-violet-50"
              text="text-violet-600"
            />

            <SummaryCard
              label="Paid Out"
              value={formatMoney(summary.paid, summary.currency)}
              subtitle={`${summary.fullyPaid} fully paid · ${summary.partialPaid} partial`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              bg="bg-emerald-50"
              text="text-emerald-600"
              footer={
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{ width: `${summary.percentPaid}%` }}
                  />
                </div>
              }
            />

            <SummaryCard
              label="Outstanding / باقی"
              value={formatMoney(summary.outstanding, summary.currency)}
              subtitle={`${summary.unpaid} pending · ${summary.partialPaid} partial`}
              icon={<Clock className="h-5 w-5" />}
              bg="bg-amber-50"
              text="text-amber-600"
              highlight={summary.outstanding > 0}
            />

            <SummaryCard
              label="Payout Progress"
              value={`${summary.percentPaid}%`}
              subtitle={`${summary.fullyPaid} / ${summary.totalCount} fully paid`}
              icon={<Percent className="h-5 w-5" />}
              bg="bg-blue-50"
              text="text-blue-600"
            />
          </div>

          {summary.expected > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <p className="font-bold">Teacher Payout Progress</p>
                </div>
                <p className="text-2xl font-bold">{summary.percentPaid}%</p>
              </div>
              <div className="h-3 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 to-emerald-300 rounded-full transition-all"
                  style={{ width: `${summary.percentPaid}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/90">
                <span>
                  ✅ Paid:{' '}
                  <strong>{formatMoney(summary.paid, summary.currency)}</strong>
                </span>
                <span>
                  ⏰ Remaining:{' '}
                  <strong>
                    {formatMoney(summary.outstanding, summary.currency)}
                  </strong>
                </span>
                <span>
                  📊 Total:{' '}
                  <strong>
                    {formatMoney(summary.expected, summary.currency)}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* TEACHER BREAKDOWN */}
          {filteredRows.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBreakdown((v) => !v)}
                className="w-full p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                      Teacher-wise Breakdown
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Amount owed to each teacher for this month
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-slate-500 transition-transform ${
                    showBreakdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showBreakdown && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {teacherBreakdowns.length === 0 ? (
                    <p className="p-6 text-center text-slate-400 text-sm">
                      No teacher data
                    </p>
                  ) : (
                    teacherBreakdowns.map((t) => {
                      const isExpanded = expandedTeacher === t.teacherId;
                      const percent =
                        t.totalExpected > 0
                          ? Math.round((t.totalPaid / t.totalExpected) * 100)
                          : 0;
                      const isFullyPaid = t.totalOutstanding === 0;

                      return (
                        <div key={t.teacherId}>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTeacher(
                                isExpanded ? null : t.teacherId
                              )
                            }
                            className="w-full p-4 sm:p-5 text-left hover:bg-slate-50 transition"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center font-bold shrink-0">
                                {getInitials(t.teacherName)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-slate-900 text-sm">
                                    {t.teacherName}
                                  </p>
                                  {isFullyPaid ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Fully Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                                      <Clock className="h-3 w-3" />
                                      Pending
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {t.studentsCount} students ·{' '}
                                  {t.classesCount} classes
                                </p>
                              </div>
                              <ChevronDown
                                className={`h-4 w-4 text-slate-400 shrink-0 mt-1 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-violet-600">
                                  Payable
                                </p>
                                <p className="text-xs font-bold text-violet-900 mt-0.5">
                                  {formatMoney(t.totalExpected, t.currency)}
                                </p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                                  Paid
                                </p>
                                <p className="text-xs font-bold text-emerald-900 mt-0.5">
                                  {formatMoney(t.totalPaid, t.currency)}
                                </p>
                              </div>
                              <div
                                className={`rounded-lg px-3 py-2 ${
                                  t.totalOutstanding > 0
                                    ? 'bg-rose-50 border border-rose-100'
                                    : 'bg-slate-50 border border-slate-100'
                                }`}
                              >
                                <p
                                  className={`text-[9px] font-bold uppercase tracking-wider ${
                                    t.totalOutstanding > 0
                                      ? 'text-rose-600'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  Remaining
                                </p>
                                <p
                                  className={`text-xs font-bold mt-0.5 ${
                                    t.totalOutstanding > 0
                                      ? 'text-rose-900'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {formatMoney(t.totalOutstanding, t.currency)}
                                </p>
                              </div>
                            </div>

                            {t.totalExpected > 0 && (
                              <div className="mt-3">
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      percent === 100
                                        ? 'bg-emerald-500'
                                        : percent >= 50
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  {percent}% paid out
                                </p>
                              </div>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-4 bg-slate-50/50">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 pt-3">
                                Classes ({t.classesCount})
                              </p>
                              <div className="space-y-2">
                                {t.rows.map((r) => {
                                  const meta = STATUS_META[r.status];
                                  const outstanding = getRowOutstanding(r);
                                  return (
                                    <div
                                      key={r._id || r.assignmentId}
                                      className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-3"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                          {getInitials(r.studentId?.name || 'U')}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-slate-900 truncate">
                                            {r.studentId?.name || 'Unknown'}
                                          </p>
                                          <p className="text-[10px] text-slate-500 truncate">
                                            {r.courseId?.title || 'Course'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${meta.classes}`}
                                        >
                                          <span
                                            className={`h-1 w-1 rounded-full ${meta.dot}`}
                                          />
                                          {meta.label}
                                        </span>
                                        <p className="text-xs font-bold text-slate-900 min-w-[60px] text-right">
                                          {formatMoney(r.amount, r.currency)}
                                        </p>
                                        {outstanding > 0 && (
                                          <p className="text-[10px] font-bold text-rose-600 min-w-[55px] text-right">
                                            -
                                            {formatMoney(
                                              outstanding,
                                              r.currency
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* FILTERS */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by teacher, student, course..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </select>

          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            <option value="all">All Teachers</option>
            {data?.teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing{' '}
            <strong className="text-slate-800">{filteredRows.length}</strong> of{' '}
            {data?.summary.totalCount || 0} records
          </p>
          {(statusFilter !== 'all' || teacherFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTeacherFilter('all');
                setSearch('');
              }}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* LIST HEADER */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <FileText className="h-4 w-4 text-violet-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          All Teacher Payment Records
        </h2>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-violet-600 animate-spin mx-auto" />
            <p className="text-slate-500 mt-3 text-sm">
              Loading teacher payments...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto mb-3" />
          <h2 className="font-bold text-rose-900">Could not load</h2>
          <p className="text-sm text-rose-700 mt-2">{error}</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-3xl bg-white border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            No teacher payments for this month
          </h3>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            {data?.summary.totalCount === 0
              ? 'Create assignments with a Teacher Fee first. Payout records will appear here automatically.'
              : 'No records match your filters.'}
          </p>
          <Link
            href="/owner/assignments"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition"
          >
            Go to Assignments →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredRows.map((row) => {
              const meta = STATUS_META[row.status];
              const isUpdating = updating === (row._id || row.assignmentId);
              const outstanding = getRowOutstanding(row);

              return (
                <div
                  key={row._id || row.assignmentId}
                  className="p-4 sm:p-5 hover:bg-slate-50/50 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center font-bold shrink-0">
                        {getInitials(row.teacherId?.name || 'T')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 text-sm">
                            {row.teacherId?.name || 'Unknown Teacher'}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${meta.classes}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                            />
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Student: {row.studentId?.name || 'Unknown'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {row.courseId?.title || 'Course'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {row.daysOfWeek?.join(', ') || '—'}
                          </span>
                        </div>
                        {row.paidAt && (
                          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                            Paid on{' '}
                            {new Date(row.paidAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {row.paymentMethod
                              ? ` · ${row.paymentMethod}`
                              : ''}
                          </p>
                        )}
                        {row.notes && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            <FileText className="inline h-3 w-3 -mt-0.5 mr-1" />
                            {row.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 lg:text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Amount to Pay
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatMoney(row.amount, row.currency)}
                      </p>
                      {row.status === 'partial' && row.paidAmount > 0 && (
                        <p className="text-[11px] text-blue-600 font-semibold">
                          Paid: {formatMoney(row.paidAmount, row.currency)}
                        </p>
                      )}
                      {outstanding > 0 && row.status !== 'pending' && (
                        <p className="text-[11px] text-rose-600 font-bold">
                          Due: {formatMoney(outstanding, row.currency)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {row.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => markPaid(row)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Mark Paid
                        </button>
                      )}
                      {row.status === 'paid' && (
                        <button
                          type="button"
                          onClick={() => markPending(row)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 text-xs font-bold transition disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          Mark Pending
                        </button>
                      )}
                      {row.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...row,
                              status: 'partial',
                              paidAmount: Math.round(row.amount / 2),
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-xs font-bold transition"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Partial
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <EditTeacherPaymentModal
          row={editing}
          onClose={() => setEditing(null)}
          onSave={(updates) => updatePayment(editing, updates)}
          saving={updating === (editing._id || editing.assignmentId)}
        />
      )}
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function SummaryCard({
  label,
  value,
  subtitle,
  icon,
  bg,
  text,
  highlight,
  footer,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  highlight?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl p-5 border ${
        highlight
          ? 'border-amber-300 shadow-lg ring-1 ring-amber-100'
          : 'border-slate-200'
      }`}
    >
      <div
        className={`h-11 w-11 rounded-xl ${bg} ${text} flex items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">
        {label}
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
      {footer}
    </div>
  );
}

function EditTeacherPaymentModal({
  row,
  onClose,
  onSave,
  saving,
}: {
  row: PaymentRow;
  onClose: () => void;
  onSave: (u: {
    status: PaymentStatus;
    paidAmount?: number;
    paymentMethod?: string;
    notes?: string;
  }) => void;
  saving: boolean;
}) {
  const [status, setStatus] = useState<PaymentStatus>(row.status);
  const [paidAmount, setPaidAmount] = useState(String(row.paidAmount || 0));
  const [method, setMethod] = useState(row.paymentMethod || '');
  const [notes, setNotes] = useState(row.notes || '');

  const handleSave = () => {
    const upd: any = { status, paymentMethod: method, notes };
    if (status === 'partial') {
      upd.paidAmount = Math.max(
        0,
        Math.min(Number(paidAmount) || 0, row.amount)
      );
    }
    onSave(upd);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Edit Teacher Payment</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-violet-50 border border-violet-100">
          <p className="text-[10px] uppercase font-bold tracking-wider text-violet-600">
            Teacher
          </p>
          <p className="text-sm font-bold text-slate-900">
            {row.teacherId?.name || 'Unknown'}
          </p>
          <p className="text-[10px] text-slate-500">
            {row.studentId?.name} · {row.courseId?.title}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {status === 'partial' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Paid Amount
              </label>
              <input
                type="number"
                min="0"
                max={row.amount}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Max: {row.amount} {row.currency}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Payment Method
            </label>
            <input
              type="text"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Cash, Bank, JazzCash..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}