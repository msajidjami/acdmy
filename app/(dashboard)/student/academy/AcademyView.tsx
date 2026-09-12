'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  School,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Sparkles,
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  Building2,
  UserCheck,
  Award,
  ExternalLink,
  Copy,
  Check,
  Info,
  Target,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Briefcase,
} from 'lucide-react';

/* ======================================================
   Types
   ====================================================== */

type AcademyData = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  description: string;
  logoUrl: string;
  ownerName: string;
  createdAt: string | null;
};

type Stats = {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  myTeachers: number;
  myCourses: number;
  myClasses: number;
};

type ListItem = { _id: string; name: string };

type Props = {
  academy: AcademyData;
  stats: Stats;
  myCourses: ListItem[];
  myTeachers: ListItem[];
};

/* ======================================================
   Helpers
   ====================================================== */

function getInitials(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

/* ======================================================
   Component
   ====================================================== */

export default function AcademyView({
  academy,
  stats,
  myCourses,
  myTeachers,
}: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const initials = getInitials(academy.name);

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      /* ignore */
    }
  };

  const hasContactInfo =
    academy.email || academy.phone || academy.address || academy.city;
  const hasLocation = academy.address || academy.city || academy.country;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============================================
          HERO HEADER
      ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-teal-300/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              {academy.logoUrl ? (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white border-2 border-white/40 shadow-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={academy.logoUrl}
                    alt={academy.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-xl">
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-4 border-sky-500 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
                <School className="h-3.5 w-3.5" />
                My Academy
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight truncate">
                {academy.name}
              </h1>

              {academy.ownerName && (
                <p className="mt-1 text-cyan-50 text-sm sm:text-base">
                  Owned by {academy.ownerName}
                </p>
              )}

              {hasLocation && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5" />
                  {[academy.city, academy.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>

          <div className="hidden sm:block shrink-0">
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-100 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Enrolled Student
              </div>
              {academy.createdAt && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  Since {new Date(academy.createdAt).getFullYear()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          ACADEMY OVERVIEW
      ============================================ */}

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Building2 className="h-4 w-4 text-sky-500" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Academy Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Students"
            value={stats.totalStudents}
            icon={<Users className="h-5 w-5" />}
            gradient="from-sky-500 to-cyan-600"
            bg="bg-sky-50"
            text="text-sky-600"
          />
          <StatCard
            title="Teachers"
            value={stats.totalTeachers}
            icon={<UserCheck className="h-5 w-5" />}
            gradient="from-emerald-500 to-teal-600"
            bg="bg-emerald-50"
            text="text-emerald-600"
          />
          <StatCard
            title="Courses"
            value={stats.totalCourses}
            icon={<Layers className="h-5 w-5" />}
            gradient="from-violet-500 to-purple-600"
            bg="bg-violet-50"
            text="text-violet-600"
          />
          <StatCard
            title="Since"
            value={
              academy.createdAt
                ? new Date(academy.createdAt).getFullYear()
                : '—'
            }
            icon={<Calendar className="h-5 w-5" />}
            gradient="from-amber-500 to-orange-600"
            bg="bg-amber-50"
            text="text-amber-600"
            isText
          />
        </div>
      </div>

      {/* ============================================
          MY ACTIVITY
      ============================================ */}

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Target className="h-4 w-4 text-teal-500" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Your Activity
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <ActivityCard
            title="My Courses"
            value={stats.myCourses}
            icon={<BookOpen className="h-5 w-5" />}
            gradient="from-sky-500 to-cyan-600"
            bg="bg-sky-50"
            text="text-sky-600"
            href="/student/courses"
          />
          <ActivityCard
            title="My Teachers"
            value={stats.myTeachers}
            icon={<Users className="h-5 w-5" />}
            gradient="from-emerald-500 to-teal-600"
            bg="bg-emerald-50"
            text="text-emerald-600"
            href="/student/teachers"
          />
          <ActivityCard
            title="My Classes"
            value={stats.myClasses}
            icon={<Briefcase className="h-5 w-5" />}
            gradient="from-violet-500 to-purple-600"
            bg="bg-violet-50"
            text="text-violet-600"
            href="/student/schedule"
          />
        </div>
      </div>

      {/* ============================================
          MY COURSES + TEACHERS LISTS
      ============================================ */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Courses */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900">
                My Courses
              </h2>
              <p className="text-xs text-slate-500">
                Courses you are enrolled in
              </p>
            </div>
            {stats.myCourses > 0 && (
              <span className="shrink-0 inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                {stats.myCourses}
              </span>
            )}
          </div>

          <div className="p-4">
            {myCourses.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No courses enrolled</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myCourses.map((c) => (
                  <span
                    key={c._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 text-sky-700 text-xs font-bold"
                  >
                    <BookOpen className="h-3 w-3" />
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Teachers */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900">
                My Teachers
              </h2>
              <p className="text-xs text-slate-500">
                Teachers who teach you
              </p>
            </div>
            {stats.myTeachers > 0 && (
              <span className="shrink-0 inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                {stats.myTeachers}
              </span>
            )}
          </div>

          <div className="p-4">
            {myTeachers.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No teachers assigned</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myTeachers.map((t) => (
                  <span
                    key={t._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 text-xs font-bold"
                  >
                    <UserCheck className="h-3 w-3" />
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          CONTACT & LOCATION
      ============================================ */}

      {hasContactInfo && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Contact & Location
              </h2>
              <p className="text-xs text-slate-500">
                Academy&apos;s reachable details
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 p-5 sm:grid-cols-2">
            {academy.email && (
              <ContactTile
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={academy.email}
                tone="sky"
                breakAll
                onCopy={() => handleCopy(academy.email, 'email')}
                copied={copiedField === 'email'}
                href={`mailto:${academy.email}`}
              />
            )}

            {academy.phone && (
              <ContactTile
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={academy.phone}
                tone="emerald"
                onCopy={() => handleCopy(academy.phone, 'phone')}
                copied={copiedField === 'phone'}
                href={`tel:${academy.phone}`}
              />
            )}

            {academy.website && (
              <ContactTile
                icon={<Globe className="h-4 w-4" />}
                label="Website"
                value={academy.website}
                tone="violet"
                breakAll
                href={
                  academy.website.startsWith('http')
                    ? academy.website
                    : `https://${academy.website}`
                }
                external
              />
            )}

            {hasLocation && (
              <ContactTile
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={[
                  academy.address,
                  academy.city,
                  academy.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
                tone="amber"
              />
            )}
          </div>
        </div>
      )}

      {/* ============================================
          ABOUT
      ============================================ */}

      {academy.description && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                About the Academy
              </h2>
              <p className="text-xs text-slate-500">
                Introduction and mission
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-sky-50/30 p-5">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {academy.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          QUICK ACTIONS
      ============================================ */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <QuickAction
          href="/student/courses"
          title="My Courses"
          description="See all your enrolled courses"
          icon={<BookOpen className="h-5 w-5" />}
          bg="bg-sky-50"
          text="text-sky-600"
          border="hover:border-sky-400"
        />
        <QuickAction
          href="/student/teachers"
          title="My Teachers"
          description="View your teaching staff"
          icon={<Users className="h-5 w-5" />}
          bg="bg-emerald-50"
          text="text-emerald-600"
          border="hover:border-emerald-400"
        />
        <QuickAction
          href="/student/schedule"
          title="My Schedule"
          description="Check your weekly timetable"
          icon={<Calendar className="h-5 w-5" />}
          bg="bg-violet-50"
          text="text-violet-600"
          border="hover:border-violet-400"
        />
      </div>

      {/* ============================================
          MEMBERSHIP FOOTER
      ============================================ */}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-800">
              Enrolled Student
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              You are an active student at{' '}
              <span className="font-semibold text-slate-700">
                {academy.name}
              </span>
              . Your courses, teachers, and classes are managed through this
              academy.
            </p>
            {academy.createdAt && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
                  Joined {formatDate(academy.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                  <TrendingUp className="h-3 w-3" />
                  {stats.myClasses} Classes
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   Sub Components
   ====================================================== */

function StatCard({
  title,
  value,
  icon,
  gradient,
  bg,
  text,
  isText,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
  isText?: boolean;
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${bg} flex items-center justify-center ${text}`}
        >
          {icon}
        </div>
      </div>
      <p
        className={`${
          isText ? 'text-2xl sm:text-3xl' : 'text-2xl sm:text-3xl'
        } font-bold text-slate-900`}
      >
        {value}
      </p>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
}

function ActivityCard({
  title,
  value,
  icon,
  gradient,
  bg,
  text,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-xl hover:border-transparent transition-all duration-300"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div className="flex items-center gap-4">
        <div
          className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0 ${text} group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
        </div>
        <ArrowRight
          className={`h-4 w-4 shrink-0 ${text} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`}
        />
      </div>
    </Link>
  );
}

function ContactTile({
  icon,
  label,
  value,
  tone,
  breakAll,
  onCopy,
  copied,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'sky' | 'emerald' | 'violet' | 'amber';
  breakAll?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  href?: string;
  external?: boolean;
}) {
  const toneMap = {
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      ring: 'ring-sky-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      ring: 'ring-emerald-100',
    },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      ring: 'ring-violet-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      ring: 'ring-amber-100',
    },
  }[tone];

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 h-9 w-9 rounded-xl ${toneMap.bg} ${toneMap.text} flex items-center justify-center ring-1 ${toneMap.ring}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p
            className={`text-sm font-semibold text-slate-900 mt-0.5 ${
              breakAll ? 'break-all' : 'truncate'
            }`}
          >
            {value}
          </p>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              title="Copy"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {href && (
            <a
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              title="Open"
              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
  bg,
  text,
  border,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 ${border} hover:shadow-lg transition-all duration-300 overflow-hidden`}
    >
      <div
        className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0 ${text} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 group-hover:text-slate-800">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {description}
        </p>
      </div>

      <ArrowRight
        className={`h-4 w-4 shrink-0 ${text} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`}
      />
    </Link>
  );
}