// app/owner/inquiries/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Tag,
  Calendar,
  Clock,
  Eye,
  Archive,
  Reply,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  User,
  CheckCircle2,
  PhoneCall,
  MailOpen,
} from 'lucide-react';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  UserCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

type InquiryStatus = 'new' | 'pending' | 'read' | 'replied' | 'archived';

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

/* ------------------ Status Meta ------------------ */

const STATUS_META: Record<
  InquiryStatus,
  {
    label: string;
    classes: string;
    dot: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  new: {
    label: 'New',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    Icon: Clock,
  },
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    Icon: Clock,
  },
  read: {
    label: 'Read',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    Icon: Eye,
  },
  replied: {
    label: 'Replied',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    Icon: Reply,
  },
  archived: {
    label: 'Archived',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    Icon: Archive,
  },
};

/* ------------------ Helpers ------------------ */

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatFullDate(date: string): string {
  try {
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

function timeAgo(date: string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ------------------ Component ------------------ */

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  /* ✅ خودکار Read */
  const markAsRead = async (inquiryId: string) => {
    try {
      const res = await fetch('/api/owner/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, status: 'read' }),
      });
      if (!res.ok) {
        console.error('Failed to mark as read:', await res.text());
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const fetchInquiry = async () => {
    try {
      const res = await fetch(`/api/owner/inquiries/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (data.status === 'new' || data.status === 'pending') {
        setInquiry({ ...data, status: 'read' });
        await markAsRead(data._id);
      } else {
        setInquiry(data);
      }
    } catch (error) {
      console.error('Error loading inquiry:', error);
      toast.error('Error loading inquiry');
      router.push('/owner/inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  /* ------------------ Loading ------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Loading inquiry...
          </p>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <EnvelopeIcon className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Inquiry not found</h2>
        <p className="text-slate-500 mt-2 text-sm">
          The inquiry you&apos;re looking for doesn&apos;t exist or was removed.
        </p>
        <button
          onClick={() => router.push('/owner/inquiries')}
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Inquiries
        </button>
      </div>
    );
  }

  const displayName = inquiry.name || 'Unknown';
  const displayEmail = inquiry.email || 'No email';
  const displayPhone = inquiry.phone || '';
  const displayMessage = inquiry.message || 'No message';
  const displayNotes = inquiry.notes || '';

  const meta = STATUS_META[inquiry.status];
  const StatusIcon = meta.Icon;

  /* ------------------ Render ------------------ */

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ============================================
          BACK BUTTON
      ============================================ */}
      <Link
        href="/owner/inquiries"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition group"
      >
        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Inquiries
      </Link>

      {/* ============================================
          HERO HEADER
      ============================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-teal-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold text-white border border-white/20 shadow-lg">
                {getInitials(displayName)}
              </div>
              {inquiry.status === 'new' && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <SparklesIcon className="h-3 w-3" />
                Inquiry Details
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight break-words">
                {displayName}
              </h1>

              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border bg-white/95 ${meta.classes}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {meta.label}
                </span>
                <span className="text-white/70 text-xs">
                  {timeAgo(inquiry.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          CONTACT INFO
      ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Email */}
        <div className="group bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <EnvelopeIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                  {displayEmail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(displayEmail, 'email')}
                className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title="Copy email"
              >
                {copiedField === 'email' ? (
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                ) : (
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                )}
              </button>
              <a
                href={`mailto:${displayEmail}`}
                className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title="Send email"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Phone */}
        {displayPhone && (
          <div className="group bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <PhoneIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                    {displayPhone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(displayPhone, 'phone')}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                  title="Copy phone"
                >
                  {copiedField === 'phone' ? (
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={`tel:${displayPhone}`}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                  title="Call"
                >
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Received */}
        <div className="group bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <CalendarIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Received
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {formatFullDate(inquiry.createdAt)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {timeAgo(inquiry.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          MESSAGE
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Message</h2>
              <p className="text-[11px] text-slate-500">
                Sent by the visitor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(displayMessage, 'message')}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
            title="Copy message"
          >
            {copiedField === 'message' ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-100 p-4 sm:p-5">
            <p className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap leading-relaxed">
              {displayMessage}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          NOTES
      ============================================ */}
      {displayNotes && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                <TagIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Internal Notes
                </h2>
                <p className="text-[11px] text-slate-500">
                  Only visible to you
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 sm:p-5">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {displayNotes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          QUICK ACTIONS
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-800">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`mailto:${displayEmail}?subject=Re: Your inquiry to our academy`}
            className="group inline-flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
              <ArrowUturnLeftIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition">
                Reply via Email
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Send a response to {displayName}
              </p>
            </div>
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </a>

          {displayPhone ? (
            <a
              href={`tel:${displayPhone}`}
              className="group inline-flex items-center gap-3 p-4 rounded-xl border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                <PhoneIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition">
                  Call Now
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {displayPhone}
                </p>
              </div>
              <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </a>
          ) : (
            <div className="inline-flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 opacity-60">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <PhoneIcon className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-500">No Phone</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Phone number not provided
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          TIMELINE
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-800">
            Activity Timeline
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="relative flex flex-col items-center shrink-0">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="min-w-0 pb-3">
              <p className="text-sm font-semibold text-slate-800">
                Inquiry received
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {formatFullDate(inquiry.createdAt)}
              </p>
            </div>
          </div>

          {inquiry.updatedAt !== inquiry.createdAt && (
            <div className="flex items-start gap-3">
              <div className="relative flex flex-col items-center shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <EyeIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="min-w-0 pb-3">
                <p className="text-sm font-semibold text-slate-800">
                  Last updated
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {formatFullDate(inquiry.updatedAt)}
                </p>
              </div>
            </div>
          )}

          {inquiry.repliedAt && (
            <div className="flex items-start gap-3">
              <div className="relative flex flex-col items-center shrink-0">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ArrowUturnLeftIcon className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">Replied</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {formatFullDate(inquiry.repliedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}