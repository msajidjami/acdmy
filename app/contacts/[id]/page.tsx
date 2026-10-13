'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  UserCircleIcon,
  BookmarkIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

/* ============================================================
   Types
   ============================================================ */

type Message = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  isMine: boolean;
};

type OtherUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
};

type ContactInfo = {
  isSaved: boolean;
  nickname: string;
};

/* ============================================================
   ChatPage
   ============================================================ */

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const otherUserId = params.id;

  const [me, setMe] = useState<string>('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [contact, setContact] = useState<ContactInfo>({
    isSaved: true,
    nickname: '',
  });
  const [iBlockedThisUser, setIBlockedThisUser] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  /* ✅ Navbar ki actual height — dynamically measure */
  const [navHeight, setNavHeight] = useState(56);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------- Measure navbar height ---------- */
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector('nav');
      if (nav) {
        const h = nav.getBoundingClientRect().height;
        setNavHeight(h);
      }
    };

    measure();

    window.addEventListener('resize', measure);

    /* Observer — agar navbar ki height change ho (fonts load, etc) */
    let observer: ResizeObserver | null = null;
    const nav = document.querySelector('nav');
    if (nav && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(nav);
    }

    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, []);

  /* ---------- Load me ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        setMe(data?.user?.id || '');
      } catch {}
    })();
  }, [router]);

  /* ---------- Load messages + user ---------- */
  const load = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const res = await fetch(`/api/chat/${otherUserId}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/login');
        return;
      }

      if (res.status === 404) {
        setOtherUser(null);
        return;
      }

      const data = await res.json();
      if (!data?.success) return;

      setOtherUser(data.user || null);
      setMessages(data.messages || []);
      setContact(data.contact || { isSaved: true, nickname: '' });
      setIBlockedThisUser(!!data.iBlockedThisUser);
    } catch {
      /* ignore */
    }
  }, [otherUserId, router]);

  useEffect(() => {
    if (!otherUserId) return;
    let cancelled = false;

    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();

    const interval = setInterval(() => {
      if (!cancelled && !document.hidden) load();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [otherUserId, load]);

  /* ---------- Autoscroll ---------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  /* ---------- Send message ---------- */
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      _id: tempId,
      senderId: me,
      receiverId: otherUserId,
      text,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/chat/${otherUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (res.ok && data?.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId ? { ...data.message, isMine: true } : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setInput(text);
        alert(data?.error || 'Failed to send message');
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  /* ---------- Save contact ---------- */
  async function handleSaveContact() {
    if (!otherUserId) return;
    setSavingContact(true);
    try {
      const res = await fetch('/api/contacts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contactId: otherUserId }),
      });
      if (res.ok) {
        setContact((c) => ({ ...c, isSaved: true }));
      }
    } finally {
      setSavingContact(false);
    }
  }

  /* ---------- Block / Unblock ---------- */
  async function handleBlockToggle() {
    if (!otherUserId) return;
    try {
      if (iBlockedThisUser) {
        await fetch(`/api/user/block?userId=${otherUserId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        setIBlockedThisUser(false);
      } else {
        await fetch('/api/user/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: otherUserId }),
        });
        setIBlockedThisUser(true);
      }
      setBlockOpen(false);
      setMenuOpen(false);
    } catch {}
  }

  /* ---------- Clear chat ---------- */
  async function handleClearChat() {
    if (!otherUserId) return;
    try {
      const res = await fetch(`/api/chat/${otherUserId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMessages([]);
        setClearOpen(false);
        setMenuOpen(false);
      }
    } catch {}
  }

  /* ---------- Helpers ---------- */
  const initials = otherUser?.name
    ? otherUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const displayName =
    contact.nickname ||
    otherUser?.name ||
    otherUser?.phone ||
    otherUser?.email ||
    'User';

  const subtitle = otherUser?.isOnline
    ? 'Online'
    : otherUser?.lastSeen
    ? `Last seen ${new Date(otherUser.lastSeen).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : otherUser?.role || '';

  /* ============================================================
     RENDER
     ============================================================
     ✅ Navbar ki ACTUAL height measure karke chat ko theek uske neeche
     ✅ Messages flex-1 (khali ho to khali jagah)
     ✅ Input bottom-0 = screen ke ekdum end mein
     ============================================================ */

  return (
    <div
      className="fixed inset-x-0 z-30 bottom-0 flex flex-col bg-slate-100 overflow-hidden"
      style={{ top: `${navHeight}px` }}
    >
      {/* ============================================
          HEADER — navbar ke foran neeche
          ============================================ */}
      <header className="bg-emerald-600 text-white shadow-md shrink-0">
        <div className="px-2 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-emerald-700 transition shrink-0"
            aria-label="Back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          {otherUser ? (
            <>
              <div className="relative shrink-0">
                {otherUser.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={otherUser.avatar}
                    alt={displayName}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    {initials}
                  </div>
                )}
                {otherUser.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-emerald-600 bg-emerald-300" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] text-white/80 truncate leading-tight">
                  {subtitle}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm font-bold flex-1">Chat</p>
          )}

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-full hover:bg-emerald-700 transition"
              aria-label="Menu"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-40 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(`/profile/${otherUserId}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm"
                  >
                    <UserCircleIcon className="h-4 w-4 text-slate-500" />
                    View profile
                  </button>

                  {!contact.isSaved && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void handleSaveContact();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm text-emerald-700"
                    >
                      <BookmarkIcon className="h-4 w-4" />
                      Save contact
                    </button>
                  )}

                  <div className="border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setBlockOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm"
                  >
                    <NoSymbolIcon className="h-4 w-4 text-slate-500" />
                    {iBlockedThisUser ? 'Unblock user' : 'Block user'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setReportOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                    Report user
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setClearOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Clear chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* SAVE CONTACT BANNER */}
      {otherUser && !contact.isSaved && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-center gap-2 shrink-0">
          <BookmarkIcon className="h-4 w-4 text-amber-700 shrink-0" />
          <p className="text-xs text-amber-900 flex-1 truncate">
            <span className="font-bold">
              {otherUser.phone || otherUser.email}
            </span>{' '}
            isn&apos;t in your contacts.
          </p>
          <button
            type="button"
            onClick={handleSaveContact}
            disabled={savingContact}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition disabled:opacity-50 shrink-0"
          >
            {savingContact ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {/* BLOCKED BANNER */}
      {iBlockedThisUser && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-2 flex items-center gap-2 shrink-0">
          <NoSymbolIcon className="h-4 w-4 text-red-700 shrink-0" />
          <p className="text-xs text-red-900 flex-1">
            You blocked this contact. Unblock to message them.
          </p>
          <button
            type="button"
            onClick={() => setBlockOpen(true)}
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shrink-0"
          >
            Unblock
          </button>
        </div>
      )}

      {/* ============================================
          MESSAGES — flex-1 = bachi hui saari jagah
          ============================================ */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="h-6 w-6 text-emerald-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4">
              <PaperAirplaneIcon className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-slate-700 font-semibold">No messages yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Send the first message
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => {
              const mine = m.isMine || m.senderId === me;
              return (
                <div
                  key={m._id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    dir="auto"
                    className={`max-w-[80%] sm:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
                      mine
                        ? 'bg-emerald-100 text-slate-900 rounded-br-sm'
                        : 'bg-white text-slate-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {m.text}
                    </p>
                    <p
                      dir="ltr"
                      className={`text-[10px] mt-1 text-right ${
                        mine ? 'text-emerald-700/70' : 'text-slate-400'
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ============================================
          INPUT — screen ke ekdum NEECHE
          ============================================ */}
      <form
        onSubmit={handleSend}
        className="shrink-0 bg-white border-t border-slate-200 px-3 py-2.5 flex items-center gap-2"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.625rem)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          dir="auto"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            iBlockedThisUser ? 'Unblock to send messages' : 'Type a message...'
          }
          autoComplete="off"
          disabled={iBlockedThisUser}
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          style={{ textAlign: 'start' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending || iBlockedThisUser}
          className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition disabled:opacity-50"
          aria-label="Send"
        >
          {sending ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            <PaperAirplaneIcon className="h-5 w-5 -mr-0.5 mt-0.5" />
          )}
        </button>
      </form>

      {/* BLOCK CONFIRM MODAL */}
      {blockOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setBlockOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <NoSymbolIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {iBlockedThisUser ? 'Unblock user?' : 'Block user?'}
                  </h2>
                  <p className="text-sm text-slate-500">{displayName}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                {iBlockedThisUser
                  ? 'They will be able to message you again.'
                  : "They won't be able to message you, and this contact will be removed from your list."}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBlockOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBlockToggle}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-white font-semibold transition ${
                    iBlockedThisUser
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {iBlockedThisUser ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR CHAT CONFIRM */}
      {clearOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setClearOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Clear chat?
                  </h2>
                  <p className="text-sm text-slate-500">All messages</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                All messages with {displayName} will be permanently removed
                from your device. This cannot be undone.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setClearOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportOpen && (
        <ReportModal
          userId={otherUserId}
          userName={displayName}
          onClose={() => setReportOpen(false)}
          onSuccess={() => {
            setReportOpen(false);
            alert('Report submitted. Our team will review it.');
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   REPORT MODAL
   ============================================================ */

function ReportModal({
  userId,
  userName,
  onClose,
  onSuccess,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'abuse', label: 'Abuse' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'fake', label: 'Fake account' },
    { value: 'scam', label: 'Scam' },
    { value: 'other', label: 'Other' },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/user/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, reason, description }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Failed to submit report');
        return;
      }
      onSuccess();
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={() => !sending && onClose()}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-red-600 text-white px-5 py-3 flex items-center shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <h2 className="text-base font-bold flex-1">Report {userName}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="p-1 rounded-full hover:bg-white/20 transition disabled:opacity-50"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`px-3 py-2 rounded-lg border text-sm transition ${
                    reason === r.value
                      ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Explain the issue..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Submit report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}