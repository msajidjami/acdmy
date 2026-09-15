'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Wallet,
  Users,
  BookOpen,
  Calendar,
  Search,
  X,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Receipt,
  GraduationCap,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/* ============================================================
   TYPES
   ============================================================ */

type PaymentStatus = 'pending' | 'paid' | 'partial';

interface EarningRow {
  _id: string;
  studentName: string;
  fatherName: string;
  teacherName: string;
  teacherId: string;
  courseName: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  status: string;
  feeAmount: number;
  teacherShareAmount: number;
  profit: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentDate: string | null;
  paymentMethod: string;
  paymentNotes: string;
  createdAt: string;
}

interface TeacherStat {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  classesCount: number;
  revenue: number;
  teacherShare: number;
  profit: number;
}

interface Summary {
  totalRevenue: number;
  totalTeacherPayments: number;
  totalProfit: number;
  paidRevenue: number;
  paidTeacherPayments: number;
  paidProfit: number;
  pendingRevenue: number;
  totalClasses: number;
  totalTeachers: number;
}

interface EarningsData {
  success: boolean;
  summary: Summary;
  rows: EarningRow[];
  teacherStats: TeacherStat[];
  teachersList: { _id: string; name: string; email: string }[];
}

/* ============================================================
   HELPERS
   ============================================================ */

function formatMoney(amount: number, currency = 'PKR'): string {
  const n = Number(amount) || 0;
  if (currency === 'USD') {
    return `$${n.toFixed(2)}`;
  }
  return `₨${n.toLocaleString('en-PK')}`;
}

function formatDate(d: string | null | Date): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/* ============================================================
   MAIN
   ============================================================ */

export default function EarningsClient({
  academyName,
}: {
  academyName: string;
}) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (teacherFilter !== 'all') params.set('teacher', teacherFilter);
      if (monthFilter !== 'all') params.set('month', monthFilter);

      const res = await fetch(`/api/owner/earnings?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }

      const d: EarningsData = await res.json();
      setData(d);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
      toast.error(err?.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, teacherFilter, monthFilter]);

  /* Filtered rows (client-side search) */
  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.teacherName.toLowerCase().includes(q) ||
        r.courseName.toLowerCase().includes(q)
    );
  }, [data?.rows, search]);

  const hasFilters =
    statusFilter !== 'all' ||
    teacherFilter !== 'all' ||
    monthFilter !== 'all' ||
    search.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setTeacherFilter('all');
    setMonthFilter('all');
    setSearch('');
  };

  /* ============================================================
     LOADING
     ============================================================ */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-violet-600 animate-spin mx-auto" />
          <p className="text-slate-500 mt-3 text-sm">
            Loading earnings data...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto mb-3" />
          <h2 className="font-bold text-rose-900">Could not load earnings</h2>
          <p className="text-sm text-rose-700 mt-2">
            {error || 'Unknown error'}
          </p>
          <button
            onClick={() => fetchData(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { summary, teacherStats, teachersList } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 pb-12">
      {/* ============================================
          HEADER
      ============================================ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3" />
            Owner Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Earnings & Profit
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Track revenue, teacher payments, and profit for{' '}
            <strong className="text-slate-700">{academyName}</strong>
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ============================================
          SUMMARY CARDS
      ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <SummaryCard
          label="Total Revenue"
          value={formatMoney(summary.totalRevenue)}
          subtitle={`${summary.totalClasses} class${
            summary.totalClasses !== 1 ? 'es' : ''
          }`}
          icon={<DollarSign className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />

        {/* Teacher Payments */}
        <SummaryCard
          label="Teacher Payments"
          value={formatMoney(summary.totalTeacherPayments)}
          subtitle={`${summary.totalTeachers} teacher${
            summary.totalTeachers !== 1 ? 's' : ''
          }`}
          icon={<Wallet className="h-5 w-5" />}
          gradient="from-amber-500 to-orange-600"
          bg="bg-amber-50"
          text="text-amber-600"
        />

        {/* Profit */}
        <SummaryCard
          label="Your Profit"
          value={formatMoney(summary.totalProfit)}
          subtitle={
            summary.totalRevenue > 0
              ? `${Math.round(
                  (summary.totalProfit / summary.totalRevenue) * 100
                )}% margin`
              : 'No revenue yet'
          }
          icon={<TrendingUp className="h-5 w-5" />}
          gradient="from-violet-500 to-fuchsia-600"
          bg="bg-violet-50"
          text="text-violet-600"
          highlight
        />

        {/* Pending */}
        <SummaryCard
          label="Pending Revenue"
          value={formatMoney(summary.pendingRevenue)}
          subtitle="Awaiting collection"
          icon={<Clock className="h-5 w-5" />}
          gradient="from-rose-500 to-pink-600"
          bg="bg-rose-50"
          text="text-rose-600"
        />
      </div>

      {/* ============================================
          FILTERS
      ============================================ */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, teacher, or course..."
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition bg-slate-50/50 focus:bg-white text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"
              >
                <X className="h-3 w-3 text-slate-600" />
              </button>
            )}
          </div>

          {/* Status Filter */}
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

          {/* Teacher Filter */}
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            <option value="all">All Teachers</option>
            {teachersList.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Month Filter */}
          <input
            type="month"
            value={monthFilter === 'all' ? '' : monthFilter}
            onChange={(e) =>
              setMonthFilter(e.target.value || 'all')
            }
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition whitespace-nowrap"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Showing <strong className="text-slate-800">{filteredRows.length}</strong>{' '}
          of {data.rows.length} classes
        </p>
      </div>

      {/* ============================================
          TEACHER STATS
      ============================================ */}
      {teacherStats.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-violet-600" />
            </div>
            <h2 className="font-bold text-slate-900">
              Teacher-wise Breakdown
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {teacherStats.map((t) => (
              <div
                key={t.teacherId}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                    {t.teacherName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {t.teacherName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {t.teacherEmail || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                  <MiniStat
                    label="Classes"
                    value={String(t.classesCount)}
                    color="text-slate-700"
                  />
                  <MiniStat
                    label="Revenue"
                    value={formatMoney(t.revenue)}
                    color="text-emerald-600"
                  />
                  <MiniStat
                    label="Teacher Cut"
                    value={formatMoney(t.teacherShare)}
                    color="text-amber-600"
                  />
                  <MiniStat
                    label="Profit"
                    value={formatMoney(t.profit)}
                    color="text-violet-600"
                    highlight
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          ROWS TABLE
      ============================================ */}
      {filteredRows.length === 0 ? (
        <div className="rounded-3xl bg-white border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            No earnings records
          </h3>
          <p className="text-slate-500 mt-2 text-sm">
            {data.rows.length === 0
              ? 'Create assignments with fees to start tracking earnings.'
              : 'No records match your filters.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="font-bold text-slate-900">All Class Fees</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRows.map((r) => (
              <RowCard key={r._id} row={r} />
            ))}
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
  label,
  value,
  subtitle,
  icon,
  gradient,
  bg,
  text,
  highlight,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative bg-white rounded-2xl p-5 border transition-all duration-300 overflow-hidden ${
        highlight
          ? 'border-violet-200 shadow-lg shadow-violet-500/10 ring-1 ring-violet-100'
          : 'border-slate-200 hover:shadow-xl hover:border-transparent'
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition ${
          highlight ? '!opacity-100' : ''
        }`}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className={`h-11 w-11 rounded-xl ${bg} ${text} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`text-right ${
        highlight
          ? 'px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200'
          : ''
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function RowCard({ row }: { row: EarningRow }) {
  const statusMeta: Record<
    PaymentStatus,
    { label: string; classes: string; icon: React.ReactNode }
  > = {
    paid: {
      label: 'Paid',
      classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    pending: {
      label: 'Pending',
      classes: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: <Clock className="h-3 w-3" />,
    },
    partial: {
      label: 'Partial',
      classes: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const meta = statusMeta[row.paymentStatus] || statusMeta.pending;

  return (
    <div className="p-4 sm:p-5 hover:bg-slate-50/50 transition">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Student + Course */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            {row.studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-900 text-sm truncate">
                {row.studentName}
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.classes}`}
              >
                {meta.icon}
                {meta.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              <BookOpen className="inline h-3 w-3 -mt-0.5 mr-1" />
              {row.courseName}
              <span className="mx-1.5 text-slate-300">·</span>
              <GraduationCap className="inline h-3 w-3 -mt-0.5 mr-1" />
              {row.teacherName}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <Calendar className="inline h-3 w-3 -mt-0.5 mr-1" />
              {row.daysOfWeek.join(', ')}
              <span className="mx-1.5 text-slate-300">·</span>
              {row.startTime} – {row.endTime}
            </p>
            {row.paymentNotes && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {row.paymentNotes}
              </p>
            )}
          </div>
        </div>

        {/* Right: Money breakdown */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:flex-nowrap">
          <MoneyBlock
            label="Fee"
            value={formatMoney(row.feeAmount, row.currency)}
            color="text-slate-900"
          />
          <MoneyBlock
            label="Teacher"
            value={formatMoney(row.teacherShareAmount, row.currency)}
            color="text-amber-600"
          />
          <div className="px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
              Profit
            </p>
            <p className="text-sm font-bold text-violet-700">
              {formatMoney(row.profit, row.currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoneyBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}