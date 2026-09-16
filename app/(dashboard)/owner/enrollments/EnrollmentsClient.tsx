'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Mail,
  Phone,
  BookOpen,
  ChevronRight,
  Inbox,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type EnrollmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'cancelled';

interface Row {
  _id: string;
  name: string;
  email: string;
  phone: string;
  fatherName: string;
  message: string;
  preferredTiming: string;
  status: EnrollmentStatus;
  courseId: { _id: string; title: string } | null;
  unreadCount: number;
  createdAt: string;
}

interface Data {
  success: boolean;
  academyName: string;
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  rows: Row[];
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function initials(n: string) {
  if (!n) return '?';
  const p = n.trim().split(' ');
  return p.length === 1
    ? p[0][0].toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

const STATUS_META: Record<
  EnrollmentStatus,
  { label: string; classes: string; icon: any }
> = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  active: {
    label: 'Active',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: XCircle,
  },
};

export default function EnrollmentsClient({
  academyName,
}: {
  academyName: string;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | EnrollmentStatus>(
    'all'
  );
  const [search, setSearch] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(
          `/api/owner/enrollments?${params.toString()}`,
          { credentials: 'include', cache: 'no-store' }
        );
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || 'Failed');
        setData(d);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, search]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  /* ---------- Quick Accept ---------- */
  const quickAccept = async (row: Row, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        `Accept enrollment for "${row.name}"?\n\nThis will:\n• Create a student in your academy\n• Notify the applicant`
      )
    ) {
      return;
    }

    setAcceptingId(row._id);
    try {
      const res = await fetch(`/api/owner/enrollments/${row._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'approved',
          responseNote: 'Welcome to our academy!',
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Failed');

      toast.success(`Enrollment approved — student added`);
      await fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setAcceptingId(null);
    }
  };

  const rows = data?.rows || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Inbox className="h-3 w-3" />
            Enrollment Requests
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Manage Enrollments
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Review and respond to enrollment requests for{' '}
            <strong className="text-slate-700">{academyName}</strong>
          </p>
        </div>
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

      {/* STATS */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Total',
              value: data.summary.total,
              color: 'text-slate-700',
              bg: 'bg-slate-50',
            },
            {
              label: 'Pending',
              value: data.summary.pending,
              color: 'text-amber-700',
              bg: 'bg-amber-50',
            },
            {
              label: 'Approved',
              value: data.summary.approved,
              color: 'text-emerald-700',
              bg: 'bg-emerald-50',
            },
            {
              label: 'Rejected',
              value: data.summary.rejected,
              color: 'text-rose-700',
              bg: 'bg-rose-50',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-4 border border-slate-200"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border-2 border-dashed border-slate-200 p-12 text-center">
          <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">
            No enrollment requests
          </h3>
          <p className="text-slate-500 text-sm mt-2">
            When students apply, their requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const meta = STATUS_META[r.status];
            const Icon = meta.icon;
            const canAct = r.status === 'pending';
            const isAccepting = acceptingId === r._id;

            return (
              <div
                key={r._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition overflow-hidden"
              >
                {/* Card body */}
                <Link
                  href={`/owner/enrollments/${r._id}`}
                  className="block p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                      {initials(r.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm">
                          {r.name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${meta.classes}`}
                        >
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                        {r.unreadCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            <MessageSquare className="h-3 w-3" />
                            {r.unreadCount} new
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {r.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </span>
                        {r.courseId && (
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {r.courseId.title}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1">
                        {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Action bar */}
                <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {/* Open chat */}
                  <Link
                    href={`/owner/enrollments/${r._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Open Chat
                    {r.unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {r.unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Accept button (only if pending) */}
                  {canAct && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => quickAccept(r, e)}
                        disabled={isAccepting}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50 shadow-sm"
                      >
                        {isAccepting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        {isAccepting ? 'Accepting...' : 'Accept & Add as Student'}
                      </button>

                      <Link
                        href={`/owner/enrollments/${r._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold transition"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Link>
                    </>
                  )}

                  {r.status === 'approved' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Student Added
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}