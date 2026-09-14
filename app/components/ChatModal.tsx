'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Reply = {
  _id: string;
  clientKey: string;
  senderType: 'user' | 'owner' | 'bot';
  senderName: string;
  text: string;
  createdAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  academySlug?: string;
  academyId?: string;
  academyName: string;
  teacherId?: string;      // ✅ نیا
  teacherName?: string;
  accentColor?: string;
  enrollHref?: string;
};

let __counter = 0;
function uid(prefix = 'r') {
  __counter += 1;
  return `${prefix}-${Date.now()}-${__counter}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export default function ChatModal({
  open,
  onClose,
  academySlug,
  academyId,
  academyName,
  teacherId,
  teacherName,
  accentColor = '#10b981',
  enrollHref,
}: Props) {
  const router = useRouter();
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && !sending) onClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, sending, onClose]);

  useEffect(() => {
    if (!open) {
      setInquiryId(null);
      setReplies([]);
      setInput('');
      setError('');
      setLoading(false);
      setSending(false);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  /* ✅ academySlug یا academyId میں سے کم از کم ایک ہونا چاہیے */
  const hasAcademyRef = Boolean(
    (academySlug && academySlug.trim()) ||
    (academyId && academyId.trim())
  );

  const sendFirst = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasAcademyRef) {
      setError('Academy information missing. Please refresh the page.');
      return;
    }

    const text = input.trim();
    if (text.length < 2) return;
    setLoading(true);

    const userKey = uid('cu');
    setReplies([
      {
        _id: '',
        clientKey: userKey,
        senderType: 'user',
        senderName: 'You',
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput('');

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          slug: academySlug || undefined,
          academyId: academyId || undefined,
          teacherId: teacherId || undefined,   // ✅ teacherId بھیجیں
          message: text,
        }),
      });

      if (res.status === 401) {
        onClose();
        router.push(
          '/login?redirect=' + encodeURIComponent(window.location.pathname)
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send');
        setReplies([]);
        setInput(text);
        return;
      }

      const botKey = uid('cb');
      const botText = data.botReply || 'Thank you for your message!';

      setReplies([
        {
          _id: '',
          clientKey: userKey,
          senderType: 'user',
          senderName: 'You',
          text,
          createdAt: new Date().toISOString(),
        },
        {
          _id: '',
          clientKey: botKey,
          senderType: 'bot',
          senderName: teacherName
            ? `${teacherName}'s Assistant`
            : `${academyName} Assistant`,
          text: botText,
          createdAt: new Date().toISOString(),
        },
      ]);

      setInquiryId(data.inquiryId);
    } catch {
      setError('Network error. Please try again.');
      setReplies([]);
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const sendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!inquiryId || input.trim().length < 1) return;

    const text = input.trim();
    setInput('');
    setSending(true);

    const userKey = uid('cu');
    setReplies((prev) => [
      ...prev,
      {
        _id: '',
        clientKey: userKey,
        senderType: 'user',
        senderName: 'You',
        text,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send');
        setReplies((prev) => prev.filter((r) => r.clientKey !== userKey));
        setInput(text);
        return;
      }

      if (data.botReply && data.botReply.text) {
        const botKey = uid('cb');
        setReplies((prev) => [
          ...prev,
          {
            _id: '',
            clientKey: botKey,
            senderType: 'bot',
            senderName:
              data.botReply.senderName ||
              (teacherName
                ? `${teacherName}'s Assistant`
                : `${academyName} Assistant`),
            text: data.botReply.text,
            createdAt: data.botReply.createdAt || new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setError('Network error');
      setReplies((prev) => prev.filter((r) => r.clientKey !== userKey));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && !sending && onClose()}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-2 bottom-2 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
              <div
                className="p-4 text-white relative flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                }}
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center text-lg flex-shrink-0">
                    🤖
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold truncate">
                      {teacherName || academyName}
                    </h3>
                    <p className="text-[11px] opacity-90 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      {teacherName
                        ? `AI Assistant — about ${teacherName}`
                        : 'AI Assistant — online'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading || sending}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-white disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50"
                style={{ minHeight: '220px', maxHeight: '400px' }}
              >
                {!hasAcademyRef && (
                  <div className="text-center py-8 text-red-500 text-xs font-semibold">
                    ⚠️ Academy information missing
                  </div>
                )}

                {replies.length === 0 && !loading && hasAcademyRef && (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    <div className="text-4xl mb-2">👋</div>
                    {teacherName
                      ? `Ask about ${teacherName} — courses, timing, or enrollment`
                      : 'Ask in any language — اردو، English، or Roman Urdu'}
                  </div>
                )}

                {replies.map((r) => (
                  <div
                    key={r.clientKey}
                    className={`flex gap-2 ${
                      r.senderType === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {r.senderType !== 'user' && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                        style={{
                          background:
                            r.senderType === 'bot'
                              ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                              : '#1e293b',
                        }}
                      >
                        {r.senderType === 'bot' ? '🤖' : '🏫'}
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                        r.senderType === 'user'
                          ? 'text-white rounded-br-md'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                      }`}
                      style={
                        r.senderType === 'user'
                          ? {
                              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                            }
                          : undefined
                      }
                    >
                      {r.senderType === 'owner' && (
                        <p className="text-[9px] font-bold text-indigo-600 mb-1">
                          🏫 Academy Owner
                        </p>
                      )}
                      {r.senderType === 'bot' && (
                        <p className="text-[9px] font-bold text-emerald-600 mb-1">
                          AI Assistant
                        </p>
                      )}
                      {r.text}
                      <p
                        className={`text-[9px] mt-1 ${
                          r.senderType === 'user'
                            ? 'text-white/70'
                            : 'text-gray-400'
                        }`}
                      >
                        {new Date(r.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {(loading || sending) && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">
                      🤖
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '0.15s' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '0.3s' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {enrollHref && (
                <div className="px-4 pt-3 pb-2 bg-white border-t border-gray-100 flex-shrink-0">
                  <a
                    href={enrollHref}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-white shadow-md"
                    style={{ background: accentColor }}
                  >
                    🎓 Enroll Now
                  </a>
                </div>
              )}

              <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                {error && (
                  <p className="text-[11px] text-red-600 mb-2 px-1">{error}</p>
                )}

                <form
                  onSubmit={inquiryId ? sendFollowUp : sendFirst}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      inquiryId
                        ? 'Type a message...'
                        : teacherName
                        ? `Ask about ${teacherName}...`
                        : 'Ask a question...'
                    }
                    maxLength={2000}
                    disabled={loading || sending || !hasAcademyRef}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      sending ||
                      input.trim().length < 1 ||
                      !hasAcademyRef
                    }
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{ background: accentColor }}
                  >
                    {loading || sending ? '...' : '➤'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}