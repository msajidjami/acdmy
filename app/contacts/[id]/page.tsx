'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  MicrophoneIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

/* ============================================================
   Types
   ============================================================ */

type MessageType = 'text' | 'voice' | 'image' | 'file' | 'call';

type CallInfo = {
  kind: 'audio' | 'video';
  status: 'missed' | 'completed' | 'declined' | 'no_answer';
  durationSeconds: number;
};

type Message = {
  _id: string;
  senderId: string;
  receiverId: string;
  type?: MessageType;
  text: string;
  audioUrl?: string;
  audioDuration?: number;
  call?: CallInfo;
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

  /* Voice recording state */
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  /* Navbar height */
  const [navHeight, setNavHeight] = useState(56);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---------- Measure navbar ---------- */
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector('nav');
      if (nav) setNavHeight(nav.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener('resize', measure);
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

  /* ---------- Load messages ---------- */
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
    } catch {}
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

  /* ---------- Cleanup recorder on unmount ---------- */
  useEffect(() => {
    return () => {
      mrRef.current?.stream.getTracks().forEach((t) => t.stop());
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, []);

  /* ---------- Send text ---------- */
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
      type: 'text',
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
          prev.map((m) => (m._id === tempId ? { ...data.message, isMine: true } : m))
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

  /* ---------- Voice recording ---------- */
  async function startRecording() {
    if (iBlockedThisUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const duration = recordSecs;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size > 0) await sendVoice(blob, duration);
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      recTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      alert('Microphone permission denied');
    }
  }

  function stopRecording() {
    mrRef.current?.stop();
    mrRef.current = null;
    setRecording(false);
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  }

  function cancelRecording() {
    chunksRef.current = [];
    mrRef.current?.stop();
    mrRef.current = null;
    setRecording(false);
    setRecordSecs(0);
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  }

  async function sendVoice(blob: Blob, duration: number) {
    setUploadingVoice(true);
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'voice.webm');
      fd.append('receiverId', otherUserId);
      fd.append('duration', String(duration));
      const res = await fetch('/api/chat/voice', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, { ...data.message, isMine: true }]);
      } else {
        alert(data?.error || 'Failed to upload voice');
      }
    } catch (err: any) {
      alert(err?.message || 'Voice upload failed');
    } finally {
      setUploadingVoice(false);
      setRecordSecs(0);
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
      if (res.ok) setContact((c) => ({ ...c, isSaved: true }));
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

  const fmtSecs = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div
      className="fixed inset-x-0 z-30 bottom-0 flex flex-col bg-slate-100 overflow-hidden"
      style={{ top: `${navHeight}px` }}
    >
      {/* HEADER */}
      <header className="bg-emerald-600 text-white shadow-md shrink-0">
        <div className="px-2 py-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-emerald-700 transition shrink-0"
            aria-label="Back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          {otherUser ? (
            <Link
              href={`/profile/${otherUserId}`}
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-90"
            >
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
            </Link>
          ) : (
            <p className="text-sm font-bold flex-1">Chat</p>
          )}

          {/* Call buttons — only for platform users */}
          {otherUser && !iBlockedThisUser && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Link
                href={`/call/${otherUserId}?type=audio&name=${encodeURIComponent(displayName)}`}
                className="p-1.5 rounded-full hover:bg-emerald-700 transition"
                aria-label="Audio call"
                title="Audio call"
              >
                <PhoneIcon className="h-5 w-5" />
              </Link>
              <Link
                href={`/call/${otherUserId}?type=video&name=${encodeURIComponent(displayName)}`}
                className="p-1.5 rounded-full hover:bg-emerald-700 transition"
                aria-label="Video call"
                title="Video call"
              >
                <VideoCameraIcon className="h-5 w-5" />
              </Link>
            </div>
          )}

          {/* Menu */}
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
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
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

      {/* SAVE BANNER */}
      {otherUser && !contact.isSaved && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-center gap-2 shrink-0">
          <BookmarkIcon className="h-4 w-4 text-amber-700 shrink-0" />
          <p className="text-xs text-amber-900 flex-1 truncate">
            <span className="font-bold">{otherUser.phone || otherUser.email}</span>{' '}
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

      {/* MESSAGES */}
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
            <p className="text-slate-500 text-sm mt-1">Send the first message</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => {
              const mine = m.isMine || m.senderId === me;
              const type = m.type || 'text';

              /* ---- Call log ---- */
              if (type === 'call' && m.call) {
                const isVideo = m.call.kind === 'video';
                return (
                  <div key={m._id} className="flex justify-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 text-[11px] font-medium text-slate-600">
                      {isVideo ? (
                        <VideoCameraIcon className="h-3.5 w-3.5" />
                      ) : (
                        <PhoneIcon className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isVideo ? 'Video' : 'Audio'} call
                        {m.call.durationSeconds > 0
                          ? ` • ${fmtSecs(m.call.durationSeconds)}`
                          : m.call.status === 'missed'
                          ? ' • Missed'
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              /* ---- Voice message ---- */
              if (type === 'voice' && m.audioUrl) {
                return (
                  <div
                    key={m._id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
                        mine
                          ? 'bg-emerald-100 text-slate-900 rounded-br-sm'
                          : 'bg-white text-slate-900 rounded-bl-sm'
                      }`}
                    >
                      <VoicePlayer
                        src={m.audioUrl}
                        durationSec={m.audioDuration || 0}
                        own={mine}
                      />
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
              }

              /* ---- Text (default) ---- */
              return (
                <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
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

      {/* INPUT / RECORDER */}
      {recording ? (
        <div
          className="shrink-0 bg-white border-t border-slate-200 px-3 py-2.5 flex items-center gap-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.625rem)' }}
        >
          <button
            type="button"
            onClick={cancelRecording}
            className="h-11 w-11 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            aria-label="Cancel"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-red-50 rounded-full">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-600 tabular-nums">
              {fmtSecs(recordSecs)}
            </span>
            <span className="text-xs text-slate-500 ml-1">Recording…</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition"
            aria-label="Send voice"
          >
            <PaperAirplaneIcon className="h-5 w-5 -mr-0.5 mt-0.5" />
          </button>
        </div>
      ) : uploadingVoice ? (
        <div
          className="shrink-0 bg-white border-t border-slate-200 px-3 py-2.5 flex items-center justify-center gap-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.625rem)' }}
        >
          <ArrowPathIcon className="h-5 w-5 text-emerald-600 animate-spin" />
          <span className="text-sm text-slate-600">Sending voice…</span>
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="shrink-0 bg-white border-t border-slate-200 px-3 py-2.5 flex items-center gap-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.625rem)' }}
        >
          {!iBlockedThisUser && (
            <button
              type="button"
              onClick={startRecording}
              className="h-11 w-11 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              aria-label="Record voice"
              title="Record voice"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
          )}
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
      )}

      {/* BLOCK CONFIRM */}
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

      {/* CLEAR CONFIRM */}
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
                  <h2 className="text-lg font-bold text-slate-900">Clear chat?</h2>
                  <p className="text-sm text-slate-500">All messages</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                All messages with {displayName} will be permanently removed from
                your device. This cannot be undone.
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

      {/* REPORT */}
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
   Inline VoicePlayer
   ============================================================ */

function VoicePlayer({
  src,
  durationSec,
  own,
}: {
  src: string;
  durationSec?: number;
  own?: boolean;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  const total = durationSec || 0;
  const display = playing || current > 0 ? Math.floor(current) : total;
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center gap-2 min-w-[180px] ${
        own ? 'text-slate-900' : 'text-slate-700'
      }`}
    >
      <audio
        ref={ref}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(e) =>
          setCurrent((e.target as HTMLAudioElement).currentTime)
        }
        preload="metadata"
      />
      <button
        type="button"
        onClick={toggle}
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
          own ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
        }`}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <PauseIcon className="h-4 w-4" />
        ) : (
          <PlayIcon className="h-4 w-4 ml-0.5" />
        )}
      </button>
      <div
        className={`flex-1 h-1.5 rounded-full overflow-hidden ${
          own ? 'bg-emerald-200' : 'bg-slate-300'
        }`}
      >
        <div
          className={`h-full ${own ? 'bg-emerald-600' : 'bg-emerald-500'}`}
          style={{
            width: total ? `${Math.min(100, (current / total) * 100)}%` : '0%',
          }}
        />
      </div>
      <span className="text-[11px] font-medium tabular-nums shrink-0">
        {fmt(display)}
      </span>
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