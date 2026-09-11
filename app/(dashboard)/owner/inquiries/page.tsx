// app/owner/inquiries/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Mail,
  Eye,
  Clock,
  Archive,
  Reply,
  Phone,
  Tag,
  SearchIcon,
  Sparkles,
  CheckCircle2,
  Inbox,
  AlertCircle,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  CheckBadgeIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

type InquiryStatus = 'new' | 'pending' | 'read' | 'replied' | 'archived';

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

/* ------------------ Status Meta ------------------ */

const STATUS_META: Record<
  InquiryStatus,
  {
    label: string;
    classes: string;
    dot: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  new: {
    label: 'New',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    Icon: Clock,
  },
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    Icon: Clock,
  },
  read: {
    label: 'Read',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    Icon: Eye,
  },
  replied: {
    label: 'Replied',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    Icon: Reply,
  },
  archived: {
    label: 'Archived',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    Icon: Archive,
  },
};

/* ------------------ Helpers ------------------ */

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function timeAgo(date: string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatFullDate(date: string): string {
  try {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

/* ------------------ Component ------------------ */

export default function OwnerInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | InquiryStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/owner/inquiries');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInquiries(data);
    } catch (error) {
      toast.error('Error loading inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  /* ------------------ Derived ------------------ */

  const filteredInquiries = useMemo(() => {
    let result = inquiries;

    if (filter !== 'all') {
      result = result.filter((i) => i.status === filter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.message?.toLowerCase().includes(q) ||
          i.phone?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [inquiries, filter, searchQuery]);

  const stats = useMemo(
    () => ({
      total: inquiries.length,
      new: inquiries.filter((i) => i.status === 'new').length,
      pending: inquiries.filter((i) => i.status === 'pending').length,
      replied: inquiries.filter((i) => i.status === 'replied').length,
    }),
    [inquiries]
  );

  const getFilterCount = (status: string) => {
    if (status === 'all') return inquiries.length;
    return inquiries.filter((i) => i.status === status).length;
  };

  const getStatusBadge = (status: InquiryStatus) => {
    const meta = STATUS_META[status];
    const Icon = meta.Icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border ${meta.classes}`}
      >
        <Icon className="h-3 w-3" />
        {meta.label}
      </span>
    );
  };

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Loading inquiries...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------ Render ------------------ */

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ============================================
          HERO HEADER
      ============================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-teal-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <EnvelopeIcon className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <Sparkles className="h-3 w-3" />
                Inbox
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight">
                Inquiries
              </h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base max-w-lg">
                Manage all incoming messages from your academy visitors.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur border border-white/20 rounded-xl text-white text-sm font-semibold whitespace-nowrap shrink-0">
            <Inbox className="h-4 w-4" />
            {inquiries.length} Total
          </div>
        </div>
      </div>

      {/* ============================================
          STATS CARDS
      ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: 'Total',
            value: stats.total,
            Icon: EnvelopeIcon,
            bg: 'bg-indigo-50',
            text: 'text-indigo-600',
            gradient: 'from-indigo-500 to-blue-600',
          },
          {
            title: 'New',
            value: stats.new,
            Icon: AlertCircle,
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            gradient: 'from-rose-500 to-pink-600',
          },
          {
            title: 'Pending',
            value: stats.pending,
            Icon: Clock,
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            gradient: 'from-amber-500 to-orange-600',
          },
          {
            title: 'Replied',
            value: stats.replied,
            Icon: CheckBadgeIcon,
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            gradient: 'from-emerald-500 to-teal-600',
          },
        ].map((stat) => {
          const Icon = stat.Icon;
          return (
            <div
              key={stat.title}
              className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.text}`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* ============================================
          SEARCH + FILTERS
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, or message..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
            <FunnelIcon className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'new', label: 'New' },
                { key: 'pending', label: 'Pending' },
                { key: 'read', label: 'Read' },
                { key: 'replied', label: 'Replied' },
                { key: 'archived', label: 'Archived' },
              ] as const
            ).map((opt) => {
              const count = getFilterCount(opt.key);
              const active = filter === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {opt.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold ${
                      active
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {(searchQuery || filter !== 'all') && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredInquiries.length}
              </span>{' '}
              of {inquiries.length} inquiries
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilter('all');
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ============================================
          EMPTY STATE
      ============================================ */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-emerald-200 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            {filter === 'all' && !searchQuery
              ? 'No Inquiries Yet'
              : 'No matches found'}
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
            {filter === 'all' && !searchQuery
              ? 'When visitors contact your academy, their messages will appear here.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <>
          {/* ============================================
              DESKTOP TABLE
          ============================================ */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInquiries.map((inquiry) => {
                    const displayName = inquiry.name || 'Unknown';
                    const displayEmail = inquiry.email || 'No email';
                    const displayPhone = inquiry.phone || '';
                    const displayMessage = inquiry.message || 'No message';
                    const displayNotes = inquiry.notes || '';
                    const isUnread =
                      inquiry.status === 'new' || inquiry.status === 'pending';

                    return (
                      <tr
                        key={inquiry._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* From */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                {getInitials(displayName)}
                              </div>
                              {isUnread && (
                                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-800 truncate">
                                {displayName}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {displayEmail}
                              </div>
                              {displayPhone && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="h-3 w-3" />
                                  {displayPhone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Message */}
                        <td className="px-5 py-4">
                          <Link
                            href={`/owner/inquiries/${inquiry._id}`}
                            className="block group"
                          >
                            <p className="text-sm text-slate-600 line-clamp-2 max-w-md">
                              {displayMessage}
                            </p>
                            {displayNotes && (
                              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                                <Tag className="h-3 w-3 shrink-0" />
                                {displayNotes}
                              </p>
                            )}
                          </Link>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {getStatusBadge(inquiry.status)}
                        </td>

                        {/* Received */}
                        <td className="px-5 py-4">
                          <div className="text-xs text-slate-500">
                            <p className="font-semibold text-slate-700">
                              {timeAgo(inquiry.createdAt)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {formatFullDate(inquiry.createdAt)}
                            </p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end">
                            <Link
                              href={`/owner/inquiries/${inquiry._id}`}
                              className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================
              MOBILE CARDS
          ============================================ */}
          <div className="lg:hidden space-y-3">
            {filteredInquiries.map((inquiry) => {
              const displayName = inquiry.name || 'Unknown';
              const displayEmail = inquiry.email || 'No email';
              const displayPhone = inquiry.phone || '';
              const displayMessage = inquiry.message || 'No message';
              const isUnread =
                inquiry.status === 'new' || inquiry.status === 'pending';
              const meta = STATUS_META[inquiry.status];
              const StatusIcon = meta.Icon;

              return (
                <Link
                  key={inquiry._id}
                  href={`/owner/inquiries/${inquiry._id}`}
                  className={`group block bg-white rounded-2xl border p-4 shadow-sm hover:shadow-lg transition-all ${
                    isUnread
                      ? 'border-rose-200 ring-1 ring-rose-100'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-base font-bold shadow-sm">
                        {getInitials(displayName)}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {displayEmail}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.classes}`}
                        >
                          <StatusIcon className="h-2.5 w-2.5" />
                          {meta.label}
                        </span>
                      </div>

                      {displayPhone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {displayPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {displayMessage}
                  </p>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-medium">
                      {timeAgo(inquiry.createdAt)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 group-hover:gap-2 transition-all">
                      View
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}