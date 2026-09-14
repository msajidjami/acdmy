'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  open: boolean;
  onClose: () => void;
  academySlug: string;
  academyName: string;
  teacherName?: string;
  accentColor?: string;
};

export default function MessageModal({
  open,
  onClose,
  academySlug,
  academyName,
  teacherName,
  accentColor = '#10b981',
}: Props) {
  const router = useRouter();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  useEffect(() => {
    if (open) {
      setError('');
      setSuccess('');
      setMessage('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          slug: academySlug,
          message,
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
        setError(data.error || 'Failed to send message');
        return;
      }

      setSuccess(data.message || 'Message sent successfully!');
      setMessage('');

      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1800);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
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
            onClick={() => !loading && onClose()}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-4 bottom-4 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden pointer-events-auto">
              {/* Header */}
              <div
                className="p-5 text-white relative"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                }}
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full" />

                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                    Send Message
                  </p>
                  <h3 className="text-lg font-bold mt-0.5">Send a Message</h3>
                  <p className="text-xs opacity-90 mt-1">
                    To:{' '}
                    <span className="font-semibold">
                      {teacherName ? `${teacherName} — ` : ''}
                      {academyName}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-white disabled:opacity-50"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    required
                    placeholder="Write your message here..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-400">
                      {message.length}/2000
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs text-center font-semibold">
                    ✅ {success}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || message.trim().length < 5}
                    className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: accentColor }}
                  >
                    {loading ? 'Sending...' : '📤 Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}