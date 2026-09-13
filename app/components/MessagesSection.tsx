'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  EnvelopeIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

// ✅ Shared types سے import
import {
  type SerializedInquiry,
  type InquiryStatus,
  normalizeInquiryStatus,
} from '@/app/types/inquiry';

/* ============================================================
   TYPES
   ============================================================ */

type FilterKey = 'all' | 'new' | 'read' | 'replied' | 'archived';

interface Props {
  initialInquiries: SerializedInquiry[];
  academyId: string;
}

/* ============================================================
   STATUS STYLES
   ============================================================ */

const STATUS_STYLES: Record<
  InquiryStatus,
  { badge: string; dot: string; label: string }
> = {
  new: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    label: 'New',
  },
  read: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Read',
  },
  replied: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Replied',
  },
  archived: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Archived',
  },
};

/* ============================================================
   HELPERS
   ============================================================ */

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function MessagesSection({
  initialInquiries,
  academyId,
}: Props) {
  const [inquiries, setInquiries] =
    useState<SerializedInquiry[]>(initialInquiries);
  const [isVisible, setIsVisible] = useState(true);
  const [replyingTo, setReplyingTo] =
    useState<SerializedInquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  /* ---------- Sync initial data changes ---------- */
  useEffect(() => {
    setInquiries(initialInquiries);
  }, [initialInquiries]);

  /* ---------- Filtered list ---------- */
  const filteredInquiries = useMemo(() => {
    let result = inquiries;

    if (filter !== 'all') {
      result = result.filter((i) => i.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q)
      );
    }

    return result;
  }, [inquiries, filter, search]);

  /* ---------- Counts ---------- */
  const counts = useMemo(() => {
    return {
      all: inquiries.length,
      new: inquiries.filter((i) => i.status === 'new').length,
      read: inquiries.filter((i) => i.status === 'read').length,
      replied: inquiries.filter((i) => i.status === 'replied').length,
      archived: inquiries.filter((i) => i.status === 'archived').length,
    };
  }, [inquiries]);

  /* ---------- Mark as read ---------- */
  const markAsRead = async (inquiry: SerializedInquiry) => {
    if (inquiry.status !== 'new') return;

    try {
      const res = await fetch(`/api/owner/inquiries/${inquiry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      });

      if (!res.ok) return;

      setInquiries((prev) =>
        prev.map((i) =>
          i._id === inquiry._id ? { ...i, status: 'read' } : i
        )
      );
    } catch {
      /* silent fail */
    }
  };

  /* ---------- Delete ---------- */
  const deleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/owner/inquiries/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      toast.success('Message deleted');
      setInquiries((prev) => prev.filter((i) => i._id !== id));
    } catch {
      toast.error('Error deleting message');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Reply ---------- */
  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyText.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/owner/inquiries/${replyingTo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      if (!res.ok) throw new Error('Reply failed');

      toast.success('Reply sent successfully');

      setInquiries((prev) =>
        prev.map((i) =>
          i._id === replyingTo._id
            ? {
                ...i,
                status: 'replied' as InquiryStatus,
                notes: i.notes
                  ? `${i.notes}\n\n✅ Reply from Owner: ${replyText.trim()}`
                  : `✅ Reply from Owner: ${replyText.trim()}`,
                repliedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );

      setReplyingTo(null);
      setReplyText('');
    } catch {
      toast.error('Error sending reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* ============ HEADER ============ */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              type="button"
              onClick={() => setIsVisible((v) => !v)}
              className="flex items-center gap-2 min-w-0 hover:opacity-80 transition"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <EnvelopeIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left min-w-0">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  Messages
                  <span className="text-slate-400 font-medium text-sm ml-2">
                    ({inquiries.length})
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {counts.new > 0
                    ? `${counts.new} new message${
                        counts.new > 1 ? 's' : ''
                      }`
                    : 'All caught up'}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              {counts.new > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {counts.new} unread
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsVisible((v) => !v)}
                className="h-9 w-9 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition"
                aria-label={isVisible ? 'Collapse' : 'Expand'}
              >
                {isVisible ? (
                  <XMarkIcon className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          {isVisible && inquiries.length > 0 && (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or message..."
                  className="w-full pl-10 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition"
                  >
                    <XMarkIcon className="h-3 w-3 text-slate-600" />
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <FunnelIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {(
                  [
                    { key: 'all', label: 'All', count: counts.all },
                    { key: 'new', label: 'New', count: counts.new },
                    { key: 'read', label: 'Read', count: counts.read },
                    {
                      key: 'replied',
                      label: 'Replied',
                      count: counts.replied,
                    },
                    {
                      key: 'archived',
                      label: 'Archived',
                      count: counts.archived,
                    },
                  ] as const
                ).map((opt) => {
                  const active = filter === opt.key;
                  if (opt.count === 0 && opt.key !== 'all') return null;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setFilter(opt.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                        active
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                      <span
                        className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold ${
                          active
                            ? 'bg-white/25 text-white'
                            : 'bg-white text-slate-500'
                        }`}
                      >
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ============ LIST ============ */}
        {isVisible && (
          <div>
            {filteredInquiries.length === 0 ? (
              <div className="py-14 text-center px-6">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                  <InboxIcon className="h-8 w-8 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-700 text-sm">
                  {inquiries.length === 0
                    ? 'No messages yet'
                    : 'No matching messages'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {inquiries.length === 0
                    ? 'New inquiries will appear here'
                    : 'Try adjusting your search or filter'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredInquiries.map((inquiry) => {
                  const statusMeta = STATUS_STYLES[inquiry.status];
                  const isNew = inquiry.status === 'new';

                  return (
                    <li
                      key={inquiry._id}
                      className={`p-5 hover:bg-slate-50/60 transition group relative ${
                        isNew ? 'bg-amber-50/30' : ''
                      }`}
                      onClick={() => markAsRead(inquiry)}
                    >
                      {/* New indicator */}
                      {isNew && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
                      )}

                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar + content */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Avatar */}
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                            {getInitials(inquiry.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Name + status row */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-bold text-slate-900 text-sm truncate">
                                {inquiry.name}
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusMeta.badge}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
                                />
                                {statusMeta.label}
                              </span>
                            </div>

                            {/* Email + time */}
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                <span className="truncate max-w-[180px]">
                                  {inquiry.email || 'No email'}
                                </span>
                              </span>
                              <span className="opacity-40">·</span>
                              <span className="inline-flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                {formatDate(inquiry.createdAt)}
                              </span>
                            </div>

                            {/* Message */}
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                              {inquiry.message}
                            </p>

                            {/* Notes */}
                            {inquiry.notes && (
                              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                <p className="text-xs text-slate-600 line-clamp-2 whitespace-pre-wrap">
                                  📌 {inquiry.notes}
                                </p>
                              </div>
                            )}

                            {/* Replied indicator */}
                            {inquiry.repliedAt && (
                              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircleIcon className="h-3 w-3" />
                                Replied{' '}
                                {formatDate(inquiry.repliedAt)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingTo(inquiry);
                            }}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition"
                            title="Reply"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void deleteInquiry(inquiry._id);
                            }}
                            disabled={deletingId === inquiry._id}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ============ REPLY MODAL ============ */}
      {replyingTo && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setReplyingTo(null);
              setReplyText('');
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
                {getInitials(replyingTo.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Replying to
                </p>
                <p className="font-bold text-slate-900 text-base truncate">
                  {replyingTo.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {replyingTo.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition shrink-0"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={sendReply}
              className="flex-1 min-h-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Original message */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Original Message
                  </p>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {replyingTo.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      {new Date(replyingTo.createdAt).toLocaleString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>
                </div>

                {/* Reply textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Your Reply <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={5}
                    required
                    autoFocus
                    placeholder="Write your reply here..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 focus:bg-white transition outline-none resize-none text-sm leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {replyText.length} characters
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyText.trim()}
                    className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}