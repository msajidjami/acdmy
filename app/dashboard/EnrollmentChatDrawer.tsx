'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  Send,
  Loader2,
  MessageSquare,
  User as UserIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
} from 'lucide-react';

type Msg = {
  _id: string;
  senderRole: 'owner' | 'user' | 'system';
  senderName: string;
  content: string;
  createdAt: string;
};

type EnrollmentInfo = {
  _id: string;
  status: string;
  responseNote: string;
  courseId: { _id: string; title: string } | null;
  academyId: { _id: string; name: string; slug: string; logo: string } | null;
};

const STATUS_META: Record<
  string,
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

function timeFmt(d: string) {
  return new Date(d).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EnrollmentChatDrawer({
  enrollmentId,
  onClose,
  onMessageSent,
}: {
  enrollmentId: string;
  onClose: () => void;
  onMessageSent?: () => void;
}) {
  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  /* ---------- Load ---------- */
  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/user/enrollments/${enrollmentId}/messages`,
        { credentials: 'include', cache: 'no-store' }
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Failed');
      setEnrollment(d.enrollment);
      setMessages(d.messages || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---------- Auto-scroll ---------- */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  /* ---------- Body scroll lock ---------- */
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  /* ---------- Escape close ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sending]);

  /* ---------- Send ---------- */
  const sendMessage = async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await fetch(
        `/api/user/enrollments/${enrollmentId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content }),
        }
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Failed');
      setMessages((p) => [...p, d.message]);
      setText('');
      onMessageSent?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  const isFinal =
    enrollment?.status === 'rejected' || enrollment?.status === 'cancelled';

  const meta = enrollment
    ? STATUS_META[enrollment.status] || STATUS_META.pending
    : STATUS_META.pending;
  const StatusIcon = meta.icon;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl h-[95vh] sm:h-[85vh] overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ============================================
            HEADER
        ============================================ */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {enrollment?.academyId?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={enrollment.academyId.logo}
                  alt={enrollment.academyId.name}
                  className="h-11 w-11 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  {enrollment?.academyId?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Enrollment Conversation
                </p>
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {enrollment?.academyId?.name || 'Academy'}
                </h2>
                <p className="text-[11px] text-slate-500 truncate">
                  {enrollment?.courseId?.title || 'Course'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-50 transition shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          {/* Status row */}
          {enrollment && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${meta.classes}`}
              >
                <StatusIcon className="h-3 w-3" />
                {meta.label}
              </span>
              <span className="text-[10px] text-slate-400">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* ============================================
            MESSAGES
        ============================================ */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50"
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No messages yet</p>
              <p className="text-slate-400 text-xs mt-1">
                The academy will respond soon
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderRole === 'user';
              const isSystem = m.senderRole === 'system';

              /* ---------- SYSTEM MESSAGE ---------- */
              if (isSystem) {
                return (
                  <div key={m._id} className="flex justify-center">
                    <div className="max-w-[85%] rounded-xl bg-slate-100 border border-slate-200 px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Sparkles className="h-3 w-3 text-slate-500" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          System
                        </p>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">
                        {m.content}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {timeFmt(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              }

              /* ---------- USER / OWNER MESSAGE ---------- */
              return (
                <div
                  key={m._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMine
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-900'
                    }`}
                  >
                    {!isMine && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <UserIcon className="h-3 w-3 text-slate-400" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {m.senderName || 'Academy'}
                        </p>
                      </div>
                    )}
                    <p
                      className={`text-sm whitespace-pre-wrap break-words ${
                        isMine ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {m.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMine ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {timeFmt(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ============================================
            INPUT + SEND BUTTON
        ============================================ */}
        <div className="shrink-0 border-t border-slate-100 p-4 bg-white">
          {isFinal ? (
            <div className="text-center py-3">
              <p className="text-xs text-slate-500 font-medium">
                This conversation is closed.
              </p>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 resize-none transition"
              />

              {/* ✅ Send Button — Black & prominent */}
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !text.trim()}
                className="h-12 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md active:scale-95"
                aria-label="Send message"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline text-sm">Sending</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">Send</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}