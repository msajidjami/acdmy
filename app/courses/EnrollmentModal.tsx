'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  X,
  User,
  Mail,
  Phone,
  UserCheck,
  MessageSquare,
  Clock,
  Loader2,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import type { PublicCourse } from '@/app/lib/data/coursesData';

/* ============================================================
   TYPES
   ============================================================ */

type Props = {
  course: PublicCourse;
  currentUser: { name: string; email: string } | null;
  onClose: () => void;
  onSuccess: () => void;
};

type ApiError = {
  error?: string;
  code?: string;
  enrollmentId?: string;
};

/* ============================================================
   MAIN
   ============================================================ */

export default function EnrollmentModal({
  course,
  currentUser,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [preferredTiming, setPreferredTiming] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  /* Body scroll lock */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  /* Escape key close */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Please enter your full name (at least 2 characters)');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: course._id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          fatherName: fatherName.trim(),
          preferredTiming: preferredTiming.trim(),
          message: message.trim(),
          timezone: 'Asia/Karachi',
        }),
      });

      const data = (await res.json().catch(() => ({}))) as ApiError & {
        success?: boolean;
        enrollmentId?: string;
      };

      /* ---------- Handle specific errors ---------- */
      if (!res.ok) {
        /* 409 — Already enrolled */
        if (res.status === 409) {
          setEnrollmentId(data.enrollmentId || null);
          setSuccess(true);
          toast.success('You already have an enrollment request for this course');
          onSuccess();
          return;
        }

        /* 400 — Validation */
        if (res.status === 400) {
          throw new Error(data?.error || 'Please check your details and try again.');
        }

        /* 404 — Course/student not found */
        if (res.status === 404) {
          throw new Error(
            data?.error || 'This course is not available anymore.'
          );
        }

        /* 402 — Payment (shouldn't happen for enrollment, but safe) */
        if (res.status === 402) {
          throw new Error(
            data?.error || 'Enrollment is not allowed at the moment.'
          );
        }

        /* Generic error */
        throw new Error(data?.error || 'Failed to submit request');
      }

      /* ---------- Success ---------- */
      setEnrollmentId(data.enrollmentId || null);
      setSuccess(true);
      toast.success('Enrollment request sent!');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ============================================
            HEADER
        ============================================ */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                Course Enrollment
              </p>
              <h2 className="text-base font-bold text-slate-900 truncate">
                {success ? 'Request Submitted' : 'Enroll in This Course'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-50 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* ============================================
            SUCCESS STATE
        ============================================ */}
        {success ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-700" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Request submitted successfully
            </h3>
            <p className="text-slate-600 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              Your enrollment request for{' '}
              <strong className="text-slate-900">{course.title}</strong> has
              been sent to{' '}
              <strong className="text-slate-900">{course.academyName}</strong>.
              They will contact you via email or phone shortly.
            </p>

            {/* Summary */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Submission summary
              </p>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>
                  <span className="text-slate-500">Name:</span>{' '}
                  <span className="font-semibold">{name}</span>
                </p>
                <p>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="font-semibold">{email}</span>
                </p>
                <p>
                  <span className="text-slate-500">Phone:</span>{' '}
                  <span className="font-semibold">{phone}</span>
                </p>
                {enrollmentId && (
                  <p>
                    <span className="text-slate-500">Request ID:</span>{' '}
                    <span className="font-mono font-semibold text-[10px]">
                      {enrollmentId.slice(-8)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Info note */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-left">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Check your email for future updates. You can also track this
                request from your dashboard once approved.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
              >
                Close
              </button>
              {currentUser && (
                <Link
                  href="/dashboard"
                  className="flex-1 py-3 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Dashboard
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* ============================================
              FORM STATE
          ============================================ */
          <form
            onSubmit={handleSubmit}
            className="flex-1 min-h-0 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
              {/* Course summary */}
              <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-3 bg-slate-50/50">
                {course.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-white/60" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {course.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {course.academyName} · {course.category}
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    maxLength={120}
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      maxLength={160}
                      autoComplete="email"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-900 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      required
                      maxLength={40}
                      autoComplete="tel"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Father name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Father&apos;s Name{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Father's name"
                    maxLength={120}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              {/* Preferred timing */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Timing{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={preferredTiming}
                    onChange={(e) => setPreferredTiming(e.target.value)}
                    placeholder="e.g. Weekdays after 5 PM"
                    maxLength={120}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Message{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Any questions or additional information..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-900 resize-none transition"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Your details will be sent directly to the academy. They will
                  review your request and reach out via email or phone.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-100 px-5 sm:px-6 py-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="sm:w-32 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Send Enrollment Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}