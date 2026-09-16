'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Loader2,
  Phone,
  User,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  MessageSquare,
  UserCheck,
  Sparkles,
  Calendar,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

type Status = 'pending' | 'approved' | 'rejected' | 'active' | 'cancelled';

interface Msg {
  _id: string;
  senderRole: 'owner' | 'user' | 'system';
  senderName: string;
  content: string;
  createdAt: string;
}

interface Enrollment {
  _id: string;
  name: string;
  email: string;
  phone: string;
  fatherName: string;
  message: string;
  preferredTiming: string;
  status: Status;
  responseNote: string;
  courseId: { _id: string; title: string } | null;
  studentId: string | null;
  createdAt: string;
}

/* ============================================================
   HELPERS
   ============================================================ */

function timeFmt(d: string) {
  return new Date(d).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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
  Status,
  { label: string; classes: string; Icon: any }
> = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Clock,
  },
  approved: {
    label: 'Approved',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  active: {
    label: 'Active',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
    Icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    Icon: XCircle,
  },
};

/* ============================================================
   MAIN
   ============================================================ */

export default function EnrollmentDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [text, setText] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  /* ---------- Load ---------- */
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/owner/enrollments/${id}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Failed');
      setEnrollment(d.enrollment);
      setMessages(d.messages || []);
      setResponseNote(d.enrollment?.responseNote || '');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---------- Auto-scroll ---------- */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  /* ---------- Send message ---------- */
  const sendMessage = async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/owner/enrollments/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Failed');
      setMessages((p) => [...p, d.message]);
      setText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  /* ---------- Update status ---------- */
  const updateStatus = async (status: Status) => {
    if (updating) return;

    /* Confirm before approve */
    if (status === 'approved') {
      const ok = confirm(
        `Accept enrollment for "${enrollment?.name}"?\n\nThis will:\n• Create a student in your academy\n• Notify the applicant via chat`
      );
      if (!ok) return;
    }

    /* Confirm before reject */
    if (status === 'rejected') {
      const ok = confirm(
        `Reject enrollment for "${enrollment?.name}"?\n\nThis action cannot be undone.`
      );
      if (!ok) return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/owner/enrollments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, responseNote }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || 'Failed');

      toast.success(
        status === 'approved'
          ? '✅ Enrollment approved — student added'
          : status === 'rejected'
          ? 'Enrollment rejected'
          : 'Status updated'
      );
      await load();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setUpdating(false);
    }
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  /* ---------- Not found ---------- */
  if (!enrollment) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">
          Enrollment not found
        </h2>
        <Link
          href="/owner/enrollments"
          className="mt-4 inline-flex items-center gap-2 text-emerald-700 font-bold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[enrollment.status];
  const MetaIcon = meta.Icon;
  const isPending = enrollment.status === 'pending';
  const isClosed =
    enrollment.status === 'rejected' || enrollment.status === 'cancelled';

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="space-y-6">
      {/* ============================================
          HEADER
      ============================================ */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/owner/enrollments"
          className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Enrollment Request
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {enrollment.name}
          </h1>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${meta.classes}`}
        >
          <MetaIcon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ============================================
            LEFT — Applicant Details + Actions
        ============================================ */}
        <div className="lg:col-span-1 space-y-4">
          {/* Applicant card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                {initials(enrollment.name)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">
                  {enrollment.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {enrollment.email}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{enrollment.phone}</span>
              </div>
              {enrollment.fatherName && (
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    Father: {enrollment.fatherName}
                  </span>
                </div>
              )}
              {enrollment.courseId && (
                <div className="flex items-center gap-2 text-slate-700">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {enrollment.courseId.title}
                  </span>
                </div>
              )}
              {enrollment.preferredTiming && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {enrollment.preferredTiming}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {new Date(enrollment.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>

            {enrollment.message && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Applicant&apos;s note
                </p>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">
                  {enrollment.message}
                </p>
              </div>
            )}
          </div>

          {/* ============================================
              Decision Card
          ============================================ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Decision
            </p>

            {/* ---------- APPROVED ---------- */}
            {enrollment.status === 'approved' && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs flex-1">
                  <p className="font-bold text-emerald-900">Approved</p>
                  <p className="text-emerald-700 mt-0.5">
                    Student added to your academy
                  </p>
                  {enrollment.studentId && (
                    <Link
                      href="/owner/students"
                      className="mt-2 inline-flex items-center gap-1 text-emerald-800 font-bold hover:underline"
                    >
                      View in Students →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* ---------- REJECTED ---------- */}
            {enrollment.status === 'rejected' && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2">
                <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-rose-900">Rejected</p>
                  <p className="text-rose-700 mt-0.5">Applicant was notified</p>
                </div>
              </div>
            )}

            {/* ---------- CANCELLED ---------- */}
            {enrollment.status === 'cancelled' && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                <XCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Cancelled</p>
                  <p className="text-slate-600 mt-0.5">No action taken</p>
                </div>
              </div>
            )}

            {/* ---------- PENDING: Actions ---------- */}
            {isPending && (
              <>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Optional note for the applicant (will be sent as a message)..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 resize-none transition"
                />

                {/* ✅ ACCEPT BUTTON — BLACK & prominent */}
                <button
                  type="button"
                  onClick={() => updateStatus('approved')}
                  disabled={updating}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Accept & Add as Student
                    </>
                  )}
                </button>

                {/* ✅ REJECT BUTTON */}
                <button
                  type="button"
                  onClick={() => updateStatus('rejected')}
                  disabled={updating}
                  className="w-full py-2.5 rounded-xl bg-white border-2 border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold transition disabled:opacity-50"
                >
                  Reject Request
                </button>

                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  Accepting will create a student record in your academy.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ============================================
            RIGHT — Chat (Owner messages BLACK)
        ============================================ */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 shrink-0 bg-white">
            <MessageSquare className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Conversation</h2>
            <span className="ml-auto text-[10px] text-slate-400">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Messages list */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[320px] max-h-[500px] bg-slate-50/50"
          >
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No messages yet</p>
                <p className="text-slate-400 text-xs mt-1">
                  Start the conversation with the applicant
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isOwner = m.senderRole === 'owner';
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

                /* ---------- OWNER / USER ---------- */
                return (
                  <div
                    key={m._id}
                    className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isOwner
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-900'
                      }`}
                    >
                      {!isOwner && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="h-3 w-3 text-slate-400" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {m.senderName || enrollment.name}
                          </p>
                        </div>
                      )}
                      <p
                        className={`text-sm whitespace-pre-wrap break-words ${
                          isOwner ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {m.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwner ? 'text-slate-300' : 'text-slate-400'
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

          {/* Input area */}
          <div className="border-t border-slate-100 p-4 shrink-0 bg-white">
            {isClosed ? (
              <div className="text-center py-2">
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

                {/* ✅ BLACK Send button */}
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
                      <span className="hidden sm:inline text-sm">
                        Sending
                      </span>
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
    </div>
  );
}