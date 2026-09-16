'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  MessageSquare,
  Send,
  BookOpen,
  Compass,
  Settings,
  ChevronRight,
  Search,
  GraduationCap,
  MapPin,
  School,
  Clock,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Hourglass,
  XCircle,
} from 'lucide-react';
import type {
  UserDashboardData,
  UserInquiry,
  EnrollmentConversation,
} from '@/app/lib/data/userDashboardData';
import EnrollmentChatDrawer from './EnrollmentChatDrawer';

/* ============================================================
   HELPERS
   ============================================================ */

function getInitials(name: string): string {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length === 1
    ? p[0].charAt(0).toUpperCase()
    : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const INQUIRY_STATUS_META: Record<
  UserInquiry['status'],
  { label: string; classes: string; icon: string }
> = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: '⏳',
  },
  replied: {
    label: 'Replied',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: '✅',
  },
  closed: {
    label: 'Closed',
    classes: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: '✓',
  },
};

const ENROLLMENT_STATUS_META: Record<
  EnrollmentConversation['status'],
  { label: string; classes: string; Icon: any }
> = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Hourglass,
  },
  approved: {
    label: 'Enrolled',
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

export default function DashboardClient({
  data,
}: {
  data: UserDashboardData;
}) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'enrollments' | 'inquiries' | 'explore'
  >('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [openEnrollmentId, setOpenEnrollmentId] = useState<string | null>(null);
  const [localEnrollments, setLocalEnrollments] = useState(
    data.enrollments || []
  );

  useEffect(() => {
    setLocalEnrollments(data.enrollments || []);
  }, [data.enrollments]);

  const { user, stats, recentInquiries, featuredAcademies } = data;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const filteredAcademies = featuredAcademies.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    );
  });

  /* Reload after sending message to refresh unread counts */
  const handleMessageSent = useCallback(async () => {
    try {
      const res = await fetch('/api/user/enrollments', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!res.ok) return;
      const d = await res.json();
      if (Array.isArray(d?.rows)) {
        setLocalEnrollments(
          d.rows.map((r: any) => ({
            _id: r._id,
            courseId: r.courseId?._id || '',
            courseTitle: r.courseId?.title || 'Course',
            academyId: r.academyId?._id || '',
            academyName: r.academyId?.name || 'Academy',
            academySlug: r.academyId?.slug || '',
            academyLogo: r.academyId?.logo || '',
            status: r.status,
            unreadCount: r.unreadCount || 0,
            lastMessage: null,
            createdAt: r.createdAt,
          }))
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      <div className="pt-24 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 sm:p-8 shadow-xl border border-emerald-800/20">
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-emerald-200 rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-4 border-white/40 shadow-lg shrink-0"
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/20 backdrop-blur border-4 border-white/40 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0 shadow-lg">
                  {getInitials(user.name || user.email)}
                </div>
              )}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-semibold mb-2 border border-white/20">
                  <Sparkles className="h-3 w-3" />
                  Member since {memberSince}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight truncate">
                  {user.name || 'Welcome'}
                </h1>
                <p className="text-white/85 text-sm mt-1 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur border border-white/25 hover:bg-white/25 rounded-xl text-white text-sm font-bold transition"
              >
                <Compass className="h-4 w-4" />
                Explore
              </Link>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-sm font-bold transition shadow-lg"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Enrollments',
              value: stats.totalEnrollments,
              sub:
                stats.pendingEnrollments > 0
                  ? `${stats.pendingEnrollments} pending`
                  : 'All processed',
              icon: GraduationCap,
              bg: 'bg-emerald-50',
              text: 'text-emerald-700',
              border: 'hover:border-emerald-400',
              href: '#',
              onClick: () => setActiveTab('enrollments'),
            },
            {
              label: 'Unread Messages',
              value: stats.unreadMessages,
              sub:
                stats.unreadMessages > 0
                  ? 'From academies'
                  : 'All read',
              icon: MessageSquare,
              bg: 'bg-teal-50',
              text: 'text-teal-700',
              border: 'hover:border-teal-400',
              href: '#',
              onClick: () => setActiveTab('enrollments'),
            },
            {
              label: 'Inquiries',
              value: stats.totalInquiries,
              sub:
                stats.pendingInquiries > 0
                  ? `${stats.pendingInquiries} pending`
                  : 'All replied',
              icon: Send,
              bg: 'bg-slate-100',
              text: 'text-slate-800',
              border: 'hover:border-slate-500',
              href: '#',
              onClick: () => setActiveTab('inquiries'),
            },
            {
              label: 'Explore',
              value: featuredAcademies.length,
              sub: 'New academies',
              icon: Compass,
              bg: 'bg-emerald-100',
              text: 'text-emerald-800',
              border: 'hover:border-emerald-500',
              href: '#',
              onClick: () => setActiveTab('explore'),
            },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={s.onClick}
              className={`group bg-white rounded-2xl p-5 border border-slate-200 ${s.border} hover:shadow-lg transition text-left`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.text}`} />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-600 mt-1 font-semibold uppercase tracking-wider">
                {s.label}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </button>
          ))}
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 flex items-center gap-1 px-2 overflow-x-auto">
            {(
              [
                { key: 'overview', label: 'Overview', icon: TrendingUp },
                {
                  key: 'enrollments',
                  label: 'My Enrollments',
                  icon: GraduationCap,
                  badge: stats.unreadMessages,
                },
                {
                  key: 'inquiries',
                  label: 'My Inquiries',
                  icon: Send,
                  badge: stats.pendingInquiries,
                },
                { key: 'explore', label: 'Explore', icon: Compass },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const badge = 'badge' in tab ? (tab as any).badge : 0;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {/* ============================================
                OVERVIEW TAB
            ============================================ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        href: '/explore',
                        label: 'Explore Academies',
                        desc: 'Find your perfect academy',
                        icon: Compass,
                        color: 'from-emerald-600 to-emerald-700',
                      },
                      {
                        href: '/courses',
                        label: 'Browse Courses',
                        desc: 'Discover new subjects',
                        icon: BookOpen,
                        color: 'from-teal-600 to-teal-700',
                      },
                      {
                        href: '/articles',
                        label: 'Read Articles',
                        desc: 'Learn something new',
                        icon: GraduationCap,
                        color: 'from-slate-800 to-slate-900',
                      },
                    ].map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-4 text-white shadow-lg hover:shadow-xl transition hover:scale-[1.02] border border-black/10`}
                      >
                        <action.icon className="h-6 w-6 mb-3 opacity-90" />
                        <p className="font-bold text-sm">{action.label}</p>
                        <p className="text-xs text-white/80 mt-1">
                          {action.desc}
                        </p>
                        <ChevronRight className="absolute top-4 right-4 h-4 w-4 opacity-70 group-hover:translate-x-1 transition" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Recent Enrollments */}
                {localEnrollments.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-emerald-600" />
                        Recent Enrollments
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('enrollments')}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                      >
                        View all <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {localEnrollments.slice(0, 3).map((e) => {
                        const meta = ENROLLMENT_STATUS_META[e.status];
                        const Icon = meta.Icon;
                        return (
                          <button
                            key={e._id}
                            type="button"
                            onClick={() => setOpenEnrollmentId(e._id)}
                            className="w-full text-left rounded-xl border border-slate-200 p-3.5 hover:border-emerald-300 transition bg-white"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-slate-900 truncate">
                                  {e.academyName}
                                </p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {e.courseTitle}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.classes}`}
                                >
                                  <Icon className="h-3 w-3" />
                                  {meta.label}
                                </span>
                                {e.unreadCount > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                    <MessageSquare className="h-3 w-3" />
                                    {e.unreadCount} new
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent Inquiries */}
                {recentInquiries.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Send className="h-4 w-4 text-emerald-600" />
                        Recent Inquiries
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('inquiries')}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                      >
                        View all <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentInquiries.slice(0, 3).map((inq) => {
                        const meta = INQUIRY_STATUS_META[inq.status];
                        return (
                          <div
                            key={inq._id}
                            className="rounded-xl border border-slate-200 p-3.5 hover:border-emerald-200 transition bg-white"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-slate-900 truncate">
                                  {inq.academyName}
                                </p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {inq.subject}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${meta.classes}`}
                              >
                                {meta.icon} {meta.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================
                ENROLLMENTS TAB
            ============================================ */}
            {activeTab === 'enrollments' && (
              <div>
                {localEnrollments.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="h-7 w-7 text-emerald-400" />
                    </div>
                    <p className="font-bold text-slate-900 text-base">
                      No enrollments yet
                    </p>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                      When you enroll in courses, you&apos;ll be able to chat
                      with academies here.
                    </p>
                    <Link
                      href="/courses"
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition text-sm shadow-md"
                    >
                      <BookOpen className="h-4 w-4" />
                      Browse Courses
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {localEnrollments.map((e) => {
                      const meta = ENROLLMENT_STATUS_META[e.status];
                      const Icon = meta.Icon;
                      return (
                        <button
                          key={e._id}
                          type="button"
                          onClick={() => setOpenEnrollmentId(e._id)}
                          className="w-full text-left rounded-xl border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-md transition bg-white"
                        >
                          <div className="flex items-start gap-3">
                            {e.academyLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={e.academyLogo}
                                alt={e.academyName}
                                className="h-11 w-11 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                                {getInitials(e.academyName)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm text-slate-900 truncate">
                                  {e.academyName}
                                </p>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${meta.classes}`}
                                >
                                  <Icon className="h-3 w-3" />
                                  {meta.label}
                                </span>
                                {e.unreadCount > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                    <MessageSquare className="h-3 w-3" />
                                    {e.unreadCount} new
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {e.courseTitle}
                              </p>
                              {e.lastMessage && (
                                <div className="mt-2 flex items-start gap-2 text-[11px]">
                                  <span
                                    className={`font-bold shrink-0 ${
                                      e.lastMessage.senderRole === 'owner'
                                        ? 'text-emerald-700'
                                        : e.lastMessage.senderRole === 'user'
                                        ? 'text-slate-600'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {e.lastMessage.senderRole === 'owner'
                                      ? 'Academy:'
                                      : e.lastMessage.senderRole === 'user'
                                      ? 'You:'
                                      : 'System:'}
                                  </span>
                                  <span className="text-slate-500 truncate">
                                    {e.lastMessage.content}
                                  </span>
                                </div>
                              )}
                              <p className="text-[10px] text-slate-400 mt-1.5 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(e.createdAt)}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-3" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================
                INQUIRIES TAB
            ============================================ */}
            {activeTab === 'inquiries' && (
              <div>
                {recentInquiries.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <Send className="h-7 w-7 text-emerald-400" />
                    </div>
                    <p className="font-bold text-slate-900 text-base">
                      No inquiries yet
                    </p>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                      When you send inquiries to academies, they&apos;ll show
                      up here.
                    </p>
                    <Link
                      href="/explore"
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition text-sm shadow-md"
                    >
                      <Compass className="h-4 w-4" />
                      Find an Academy
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentInquiries.map((inq) => {
                      const meta = INQUIRY_STATUS_META[inq.status];
                      return (
                        <div
                          key={inq._id}
                          className="rounded-xl border border-slate-200 p-4 hover:border-emerald-400 transition bg-white"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <School className="h-4 w-4 text-emerald-600 shrink-0" />
                                <Link
                                  href={`/academy/${inq.academySlug}`}
                                  className="font-bold text-sm text-slate-900 hover:text-emerald-700 truncate"
                                >
                                  {inq.academyName}
                                </Link>
                              </div>
                              <p className="font-semibold text-xs text-slate-700 mt-1">
                                {inq.subject}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {inq.message}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.classes}`}
                              >
                                {meta.icon} {meta.label}
                              </span>
                              <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(inq.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================
                EXPLORE TAB
            ============================================ */}
            {activeTab === 'explore' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search academies by name, city, country..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm bg-white"
                  />
                </div>

                {filteredAcademies.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-sm">
                    No academies found
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredAcademies.map((acad) => (
                      <Link
                        key={acad._id}
                        href={`/academy/${acad.slug}`}
                        className="group rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-emerald-400 transition bg-white"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {acad.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={acad.logo}
                              alt={acad.name}
                              className="h-11 w-11 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {getInitials(acad.name)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-900 truncate group-hover:text-emerald-700 transition">
                              {acad.name}
                            </p>
                            {(acad.city || acad.country) && (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {[acad.city, acad.country]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        {acad.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {acad.description}
                          </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-700">
                            {acad.totalCourses} courses
                          </span>
                          <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                            Visit <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHAT DRAWER */}
      {openEnrollmentId && (
        <EnrollmentChatDrawer
          enrollmentId={openEnrollmentId}
          onClose={() => setOpenEnrollmentId(null)}
          onMessageSent={handleMessageSent}
        />
      )}
    </>
  );
}