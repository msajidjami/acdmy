'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Inbox,
  Sparkles,
  ArrowRight,
  Loader2,
  Reply,
  Archive,
  Mail,
  User as UserIcon,
  Trash2,
  RotateCcw,
  Flame,
  Zap,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

type ReplyT = {
  _id: string;
  senderRole: string;
  senderName: string;
  text: string;
  createdAt: string | null;
};

type Message = {
  _id: string;
  subject: string;
  text: string;
  category: string;
  priority: string;
  status: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentClassLevel: string;
  studentImageUrl: string;
  replies: ReplyT[];
  createdAt: string | null;
  repliedAt: string | null;
};

type Props = {
  academy: {
    _id: string;
    name: string;
    slug: string;
    logo: string;
    accentColor: string;
  };
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  initialMessages: Message[];
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const CATEGORIES = [
  { value: 'general', label: 'General', icon: '💬' },
  { value: 'fee', label: 'Fee', icon: '💰' },
  { value: 'course', label: 'Course', icon: '📚' },
  { value: 'schedule', label: 'Schedule', icon: '📅' },
  { value: 'complaint', label: 'Complaint', icon: '⚠️' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'normal', label: 'Normal', color: 'bg-sky-100 text-sky-700' },
  { value: 'high', label: 'High', color: 'bg-rose-100 text-rose-700' },
];

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  unread: { label: 'Unread', bg: 'bg-rose-100', text: 'text-rose-700', icon: AlertCircle },
  read: { label: 'Read', bg: 'bg-sky-100', text: 'text-sky-700', icon: Mail },
  replied: { label: 'Replied', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  archived: { label: 'Archived', bg: 'bg-slate-100', text: 'text-slate-600', icon: Archive },
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

function formatFull(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function OwnerMessagesView({
  academy,
  owner,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'unread' | 'read' | 'replied' | 'archived'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const accent = academy.accentColor || '#10b981';

  /* ---------- Refresh ---------- */
  const refresh = async () => {
    try {
      const res = await fetch('/api/owner/messages', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.messages)) {
        setMessages(data.messages);
      }
    } catch {
      /* ignore */
    }
  };

  /* ---------- Send Reply ---------- */
  const handleReply = async (messageId: string, text: string) => {
    const res = await fetch(`/api/owner/messages/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to reply');
    }

    /* Update local state */
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? {
              ...m,
              status: 'replied',
              repliedAt: new Date().toISOString(),
              replies: [...m.replies, data.reply],
            }
          : m
      )
    );

    /* Update selected message too */
    if (selectedMessage?._id === messageId) {
      setSelectedMessage((prev) =>
        prev
          ? {
              ...prev,
              status: 'replied',
              repliedAt: new Date().toISOString(),
              replies: [...prev.replies, data.reply],
            }
          : prev
      );
    }

    toast.success('Reply sent!');
  };

  /* ---------- Update status ---------- */
  const handleStatusChange = async (messageId: string, status: string) => {
    try {
      const res = await fetch(`/api/owner/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed');

      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status } : m))
      );
      if (selectedMessage?._id === messageId) {
        setSelectedMessage((prev) => (prev ? { ...prev, status } : prev));
      }
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/owner/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');

      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setSelectedMessage(null);
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  /* ---------- Filter ---------- */
  const filtered = messages.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.subject.toLowerCase().includes(q) ||
        m.text.toLowerCase().includes(q) ||
        m.studentName.toLowerCase().includes(q) ||
        m.studentEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: messages.length,
    unread: messages.filter((m) => m.status === 'unread').length,
    read: messages.filter((m) => m.status === 'read').length,
    replied: messages.filter((m) => m.status === 'replied').length,
    archived: messages.filter((m) => m.status === 'archived').length,
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}cc, #064e3b)`,
        }}
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Student Inbox
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-bold">
              Messages from Students 📬
            </h1>

            <p className="mt-1.5 text-white/85 text-sm">
              {stats.unread > 0
                ? `You have ${stats.unread} unread message${
                    stats.unread > 1 ? 's' : ''
                  }`
                : 'All messages are up to date'}
            </p>
          </div>

          {stats.unread > 0 && (
            <div className="shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 font-bold text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              {stats.unread} Unread
            </div>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<Inbox className="h-5 w-5" />}
          gradient="from-slate-500 to-slate-600"
          bg="bg-slate-100"
          text="text-slate-600"
        />
        <StatCard
          title="Unread"
          value={stats.unread}
          icon={<AlertCircle className="h-5 w-5" />}
          gradient="from-rose-500 to-pink-600"
          bg="bg-rose-50"
          text="text-rose-600"
          highlight={stats.unread > 0}
        />
        <StatCard
          title="Replied"
          value={stats.replied}
          icon={<CheckCircle2 className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
        <StatCard
          title="Archived"
          value={stats.archived}
          icon={<Archive className="h-5 w-5" />}
          gradient="from-violet-500 to-purple-600"
          bg="bg-violet-50"
          text="text-violet-600"
        />
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, subject, or message..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm"
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Filter className="h-3.5 w-3.5" />
            Status
          </div>
          {(
            [
              { key: 'all', label: 'All', count: stats.total },
              { key: 'unread', label: 'Unread', count: stats.unread },
              { key: 'read', label: 'Read', count: stats.read },
              { key: 'replied', label: 'Replied', count: stats.replied },
              { key: 'archived', label: 'Archived', count: stats.archived },
            ] as const
          ).map((opt) => {
            const active = statusFilter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold ${
                    active ? 'bg-white/25 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Sparkles className="h-3.5 w-3.5" />
            Category
          </div>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => {
            const active = categoryFilter === c.value;
            const count = messages.filter((m) => m.category === c.value).length;
            if (count === 0) return null;
            return (
              <button
                key={c.value}
                onClick={() => setCategoryFilter(c.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
                <span
                  className={`text-[10px] font-bold ${
                    active ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-emerald-200 shadow-sm">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {messages.length === 0 ? 'No messages yet' : 'No matches'}
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            {messages.length === 0
              ? 'Your students will appear here once they message you.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <MessageCard
              key={m._id}
              message={m}
              accent={accent}
              onOpen={() => {
                setSelectedMessage(m);
                /* Auto-mark as read */
                if (m.status === 'unread') {
                  handleStatusChange(m._id, 'read');
                }
              }}
            />
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedMessage && (
        <DetailModal
          message={selectedMessage}
          accent={accent}
          owner={owner}
          onClose={() => setSelectedMessage(null)}
          onReply={handleReply}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

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
      className={`group relative bg-white rounded-2xl p-4 border transition-all overflow-hidden ${
        highlight
          ? 'border-rose-200 shadow-md shadow-rose-500/10 ring-1 ring-rose-100'
          : 'border-slate-200 hover:shadow-lg'
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 ${
          highlight ? '!opacity-100' : ''
        } transition-opacity`}
      />
      <div
        className={`h-9 w-9 rounded-xl ${bg} ${text} flex items-center justify-center mb-2`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
        {title}
      </p>
    </div>
  );
}

function MessageCard({
  message,
  accent,
  onOpen,
}: {
  message: Message;
  accent: string;
  onOpen: () => void;
}) {
  const status = STATUS_META[message.status] || STATUS_META.unread;
  const StatusIcon = status.icon;
  const category = CATEGORIES.find((c) => c.value === message.category);
  const priority = PRIORITIES.find((p) => p.value === message.priority);
  const isUnread = message.status === 'unread';

  return (
    <button
      onClick={onOpen}
      className={`group w-full text-left bg-white rounded-2xl border transition-all overflow-hidden hover:shadow-xl ${
        isUnread
          ? 'border-rose-200 ring-1 ring-rose-100'
          : 'border-slate-200 hover:border-transparent'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Student Avatar */}
          <div className="relative shrink-0">
            {message.studentImageUrl ? (
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.studentImageUrl}
                  alt={message.studentName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                }}
              >
                {getInitials(message.studentName)}
              </div>
            )}
            {isUnread && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {message.studentName}
                  </h3>
                  {priority && priority.value === 'high' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                      <Flame className="h-2.5 w-2.5" />
                      High Priority
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {message.studentEmail}
                  {message.studentClassLevel &&
                    ` · ${message.studentClassLevel}`}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {timeAgo(message.createdAt)}
              </span>
            </div>

            <h4 className="mt-2 text-sm font-semibold text-slate-800 truncate">
              {message.subject}
            </h4>

            <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {message.text}
            </p>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}
                >
                  <StatusIcon className="h-2.5 w-2.5" />
                  {status.label}
                </span>
                {category && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {category.icon} {category.label}
                  </span>
                )}
              </div>

              {message.replies.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <Reply className="h-3 w-3" />
                  {message.replies.length} repl
                  {message.replies.length !== 1 ? 'ies' : 'y'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                  <Clock className="h-3 w-3" />
                  Needs reply
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailModal({
  message,
  accent,
  owner,
  onClose,
  onReply,
  onStatusChange,
  onDelete,
}: {
  message: Message;
  accent: string;
  owner: { _id: string; name: string; email: string };
  onClose: () => void;
  onReply: (id: string, text: string) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const status = STATUS_META[message.status] || STATUS_META.unread;
  const StatusIcon = status.icon;
  const category = CATEGORIES.find((c) => c.value === message.category);
  const priority = PRIORITIES.find((p) => p.value === message.priority);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Please write a reply');
      return;
    }

    setSending(true);
    try {
      await onReply(message._id, replyText.trim());
      setReplyText('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[94vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/50">
          <div className="flex items-start gap-3">
            {/* Student Avatar */}
            <div className="relative shrink-0">
              {message.studentImageUrl ? (
                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.studentImageUrl}
                    alt={message.studentName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  }}
                >
                  {getInitials(message.studentName)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900">
                {message.studentName}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {message.studentEmail}
                {message.studentClassLevel &&
                  ` · ${message.studentClassLevel}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}
                >
                  <StatusIcon className="h-2.5 w-2.5" />
                  {status.label}
                </span>
                {category && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {category.icon} {category.label}
                  </span>
                )}
                {priority && priority.value !== 'normal' && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${priority.color}`}
                  >
                    {priority.label}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onStatusChange(message._id, 'archived')}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition"
                title="Archive"
              >
                <Archive className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(message._id)}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Original message */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-sm font-bold text-slate-900">
                {message.subject}
              </p>
              <span className="text-[10px] text-slate-400">
                {formatFull(message.createdAt)}
              </span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {message.text}
            </p>
          </div>

          {/* Replies */}
          {message.replies.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Reply className="h-3 w-3" />
                Conversation ({message.replies.length})
              </p>

              {message.replies.map((r) => {
                const isOwnerReply = r.senderRole === 'owner';
                return (
                  <div
                    key={r._id}
                    className={`rounded-2xl border p-4 ${
                      isOwnerReply
                        ? 'bg-emerald-50 border-emerald-200 ml-4 sm:ml-8'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          isOwnerReply ? 'bg-emerald-600' : 'bg-slate-600'
                        }`}
                      >
                        {r.senderName.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          {r.senderName || 'User'} ·{' '}
                          <span className="text-[10px] capitalize">
                            {r.senderRole}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFull(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {r.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply form */}
          <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: accent }}
              >
                {owner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Reply as {owner.name}
                </p>
                <p className="text-[10px] text-slate-500">Academy Owner</p>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Type your reply to the student..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-white text-sm resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400">
                  {replyText.length} / 2000
                </p>
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap gap-2">
          {message.status !== 'unread' && (
            <button
              onClick={() => onStatusChange(message._id, 'unread')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <RotateCcw className="h-3 w-3" />
              Mark Unread
            </button>
          )}
          {message.status === 'archived' && (
            <button
              onClick={() => onStatusChange(message._id, 'read')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <Zap className="h-3 w-3" />
              Unarchive
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}