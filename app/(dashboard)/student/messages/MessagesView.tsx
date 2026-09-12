'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  X,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Inbox,
  Sparkles,
  ArrowRight,
  Mail,
  Tag,
  ChevronDown,
  Loader2,
  Reply,
  Archive,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

type Reply = {
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
  replies: Reply[];
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
  } | null;
  student: {
    _id: string;
    name: string;
    email: string;
    classLevel: string;
  };
  initialMessages: Message[];
};

const CATEGORIES = [
  { value: 'general', label: 'General', icon: '💬' },
  { value: 'fee', label: 'Fee / Payment', icon: '💰' },
  { value: 'course', label: 'Course Info', icon: '📚' },
  { value: 'schedule', label: 'Schedule', icon: '📅' },
  { value: 'complaint', label: 'Complaint', icon: '⚠️' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'normal', label: 'Normal', color: 'bg-sky-100 text-sky-700' },
  { value: 'high', label: 'High', color: 'bg-rose-100 text-rose-700' },
];

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  unread: { label: 'Unread', bg: 'bg-rose-100', text: 'text-rose-700' },
  read: { label: 'Read', bg: 'bg-sky-100', text: 'text-sky-700' },
  replied: { label: 'Replied', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  archived: { label: 'Archived', bg: 'bg-slate-100', text: 'text-slate-600' },
};

/* ============================================================
   HELPERS
   ============================================================ */

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
    year: 'numeric',
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
   COMPONENT
   ============================================================ */

export default function MessagesView({
  academy,
  student,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'replied' | 'archived'>('all');

  const accent = academy?.accentColor || '#0ea5e9';

  /* ---------- Send message ---------- */

  const handleSend = async (payload: {
    subject: string;
    text: string;
    category: string;
    priority: string;
  }) => {
    const res = await fetch('/api/student/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to send');
    }

    /* Refresh list */
    const refresh = await fetch('/api/student/messages', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (refresh.ok) {
      const refreshed = await refresh.json();
      if (Array.isArray(refreshed?.messages)) {
        setMessages(refreshed.messages);
      }
    }

    setShowCompose(false);
    toast.success('Message sent to academy!');
  };

  /* ---------- Filtered ---------- */

  const filtered = messages.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.subject.toLowerCase().includes(q) ||
        m.text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: messages.length,
    unread: messages.filter((m) => m.status === 'unread').length,
    replied: messages.filter((m) => m.status === 'replied').length,
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="space-y-6">
      {/* ============================================
          HERO
      ============================================ */}

      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}cc, #0f172a)`,
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
              Messages
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-bold">
              Contact Your Academy 💬
            </h1>

            <p className="mt-1.5 text-white/85 text-sm">
              {academy?.name
                ? `Send messages directly to ${academy.name}`
                : 'Send messages directly to your academy'}
            </p>

            {academy?.name && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-xs font-semibold">
                <span className="text-base">🏫</span>
                {academy.name}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm shadow-lg transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Message
          </button>
        </div>
      </div>

      {/* ============================================
          STATS
      ============================================ */}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<Inbox className="h-5 w-5" />}
          gradient="from-sky-500 to-cyan-600"
          bg="bg-sky-50"
          text="text-sky-600"
        />
        <StatCard
          title="Unread"
          value={stats.unread}
          icon={<AlertCircle className="h-5 w-5" />}
          gradient="from-rose-500 to-pink-600"
          bg="bg-rose-50"
          text="text-rose-600"
        />
        <StatCard
          title="Replied"
          value={stats.replied}
          icon={<CheckCircle2 className="h-5 w-5" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />
      </div>

      {/* ============================================
          SEARCH + FILTER
      ============================================ */}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 transition bg-slate-50/50 focus:bg-white text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Filter className="h-3.5 w-3.5" />
            Status
          </div>
          {(
            [
              { key: 'all', label: 'All', count: messages.length },
              { key: 'unread', label: 'Unread', count: stats.unread },
              { key: 'replied', label: 'Replied', count: stats.replied },
              {
                key: 'archived',
                label: 'Archived',
                count: messages.filter((m) => m.status === 'archived').length,
              },
            ] as const
          ).map((opt) => {
            const active = statusFilter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  active
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md'
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
      </div>

      {/* ============================================
          MESSAGES LIST
      ============================================ */}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-sky-200 shadow-sm">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-sky-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {messages.length === 0 ? 'No messages yet' : 'No matches'}
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            {messages.length === 0
              ? `Send your first message to ${academy?.name || 'your academy'}.`
              : 'Try adjusting your search or filter.'}
          </p>
          {messages.length === 0 && (
            <button
              onClick={() => setShowCompose(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg transition"
            >
              <Plus className="h-4 w-4" />
              Send First Message
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <MessageCard
              key={m._id}
              message={m}
              accent={accent}
              onOpen={() => setSelectedMessage(m)}
            />
          ))}
        </div>
      )}

      {/* ============================================
          COMPOSE MODAL
      ============================================ */}

      {showCompose && academy && (
        <ComposeModal
          academy={academy}
          student={student}
          onClose={() => setShowCompose(false)}
          onSend={handleSend}
        />
      )}

      {/* ============================================
          VIEW MESSAGE MODAL
      ============================================ */}

      {selectedMessage && (
        <ViewModal
          message={selectedMessage}
          accent={accent}
          onClose={() => setSelectedMessage(null)}
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
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-lg transition-all overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
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
  const category = CATEGORIES.find((c) => c.value === message.category);
  const priority = PRIORITIES.find((p) => p.value === message.priority);

  return (
    <button
      onClick={onOpen}
      className="group w-full text-left bg-white rounded-2xl border border-slate-200 hover:shadow-xl hover:border-transparent transition-all overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            }}
          >
            <MessageSquare className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {message.subject}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}
                  >
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

              <span className="text-[10px] text-slate-400 shrink-0">
                {timeAgo(message.createdAt)}
              </span>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {message.text}
            </p>

            {/* Replies count */}
            {message.replies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <Reply className="h-3 w-3" />
                  {message.replies.length} repl
                  {message.replies.length !== 1 ? 'ies' : 'y'} from academy
                </span>
                <ArrowRight className="h-3 w-3 text-slate-300 ml-auto group-hover:translate-x-0.5 group-hover:text-slate-500 transition" />
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function ComposeModal({
  academy,
  student,
  onClose,
  onSend,
}: {
  academy: { name: string; accentColor: string };
  student: { name: string; email: string };
  onClose: () => void;
  onSend: (payload: {
    subject: string;
    text: string;
    category: string;
    priority: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    subject: '',
    text: '',
    category: 'general',
    priority: 'normal',
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!form.text.trim()) {
      toast.error('Please write your message');
      return;
    }

    setSending(true);
    try {
      await onSend({
        subject: form.subject.trim(),
        text: form.text.trim(),
        category: form.category,
        priority: form.priority,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => !sending && onClose()}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 p-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${academy.accentColor}, ${academy.accentColor}cc)`,
              }}
            >
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                New Message
              </h2>
              <p className="text-xs text-slate-500">To {academy.name}</p>
            </div>
          </div>

          <button
            onClick={() => !sending && onClose()}
            disabled={sending}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white/60 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* From */}
          <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 flex items-center gap-2 text-xs">
            <span className="text-slate-500">From:</span>
            <span className="font-bold text-slate-800">{student.name}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 truncate">{student.email}</span>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: c.value })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    form.category === c.value
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition ${
                    form.priority === p.value
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Subject *
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              maxLength={150}
              placeholder="e.g., Question about upcoming exams"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 transition bg-slate-50/50 focus:bg-white text-sm"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Message *
            </label>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              required
              rows={6}
              maxLength={5000}
              placeholder="Write your message here..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 transition bg-slate-50/50 focus:bg-white text-sm resize-none leading-relaxed"
            />
            <p className="mt-1 text-[10px] text-slate-400 text-right">
              {form.text.length} / 5000
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/70 flex gap-3">
          <button
            type="button"
            onClick={() => !sending && onClose()}
            disabled={sending}
            className="flex-1 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            onClick={handleSubmit as any}
            className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewModal({
  message,
  accent,
  onClose,
}: {
  message: Message;
  accent: string;
  onClose: () => void;
}) {
  const status = STATUS_META[message.status] || STATUS_META.unread;
  const category = CATEGORIES.find((c) => c.value === message.category);

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-sky-50/50 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              }}
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                {message.subject}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}
                >
                  {status.label}
                </span>
                {category && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {category.icon} {category.label}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">
                  {formatFull(message.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Original message */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                You
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">You</p>
                <p className="text-[10px] text-slate-400">
                  {formatFull(message.createdAt)}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {message.text}
            </p>
          </div>

          {/* Replies */}
          {message.replies.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Reply className="h-3 w-3" />
                {message.replies.length} repl
                {message.replies.length !== 1 ? 'ies' : 'y'}
              </p>

              {message.replies.map((r) => (
                <div
                  key={r._id}
                  className="rounded-2xl border p-4"
                  style={{
                    background: `${accent}10`,
                    borderColor: `${accent}40`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: accent }}
                    >
                      {r.senderName.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {r.senderName || 'Academy'} ·{' '}
                        <span className="text-[10px] text-slate-400 capitalize">
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
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Waiting for reply
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Academy has not replied yet. Please be patient.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}