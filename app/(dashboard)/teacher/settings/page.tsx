import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import ZoomConnection from '@/models/ZoomConnection';

import {
  User,
  Mail,
  School,
  Video,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Zap,
  KeyRound,
  BadgeCheck,
  AlertTriangle,
  RefreshCw,
  Hash,
  IdCard,
  CircleDot,
  Building2,
  GraduationCap,
  Activity,
  Info,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ======================================================
   Types
   ====================================================== */

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

type TeacherData = {
  teacher: any;
  academy: any;
  zoomConnection: any | null;
};

/* ======================================================
   Helpers
   ====================================================== */

function normalizeEmail(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getInitials(name: string): string {
  if (!name) return 'T';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/* ======================================================
   Get Teacher + Zoom Data
   ====================================================== */

async function getTeacherData(email: string): Promise<TeacherData | null> {
  await connectDB();

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const teacher = await Teacher.findOne({ email: normalizedEmail })
    .select('_id academyId name email phone subjects bio isAvailable')
    .lean();

  if (!teacher) return null;

  const academy = teacher.academyId
    ? await Academy.findById(teacher.academyId).select('_id name').lean()
    : null;

  const zoomConnection = await ZoomConnection.findOne({
    academyId: teacher.academyId,
    teacherId: teacher._id,
    zoomConnected: true,
  })
    .select(
      '_id zoomConnected zoomUserId zoomAccountId zoomEmail zoomTokenExpiresAt zoomScope createdAt updatedAt'
    )
    .lean();

  return { teacher, academy, zoomConnection };
}

/* ======================================================
   Teacher Settings Page
   ====================================================== */

export default async function TeacherSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ zoom?: string; message?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

  let decoded: JwtUserPayload;
  try {
    const result = jwt.verify(token, jwtSecret);
    if (typeof result === 'string') redirect('/login');
    decoded = result as JwtUserPayload;
  } catch {
    redirect('/login');
  }

  const userEmail = normalizeEmail(decoded.email);
  if (!userEmail) redirect('/login');

  const data = await getTeacherData(userEmail);

  /* ------------------ No Teacher Profile ------------------ */

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-pink-600" />
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-rose-100 blur-3xl opacity-60 pointer-events-none" />

          <div className="relative p-10 sm:p-14 text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <XCircle className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Teacher Profile Not Found
            </h1>

            <p className="mt-3 text-slate-500 max-w-md mx-auto leading-relaxed">
              Your teacher profile is not registered. Please contact your
              academy administrator.
            </p>

            <Link
              href="/teacher/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { teacher, academy, zoomConnection } = data;

  const params = await searchParams;
  const zoomStatus = String(params?.zoom || '').trim();
  const zoomMessage = String(params?.message || '').trim();
  const isZoomConnected = Boolean(zoomConnection?.zoomConnected);

  const teacherName = teacher.name || 'Teacher';
  const initials = getInitials(teacherName);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-0 pb-10">
      {/* ============================================
          BACK LINK
      ============================================ */}

      <Link
        href="/teacher/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      {/* ============================================
          HERO HEADER
      ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-2xl shadow-purple-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-xl">
                {initials}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-indigo-600 ${
                  teacher.isAvailable
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
                title={teacher.isAvailable ? 'Active' : 'Inactive'}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Teacher Settings
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight truncate">
                {teacherName}
              </h1>

              <p className="mt-1 text-indigo-100 text-sm sm:text-base break-all">
                {teacher.email || 'No email'}
              </p>

              {academy?.name && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-medium">
                  <Building2 className="h-3.5 w-3.5" />
                  {academy.name}
                </div>
              )}
            </div>
          </div>

          <div className="hidden sm:block shrink-0">
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm border font-semibold ${
                  teacher.isAvailable
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
                    : 'bg-slate-500/20 border-slate-400/30 text-slate-100'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                {teacher.isAvailable ? 'Active' : 'Inactive'}
              </div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm border font-semibold ${
                  isZoomConnected
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
                    : 'bg-amber-500/20 border-amber-400/30 text-amber-100'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                Zoom {isZoomConnected ? 'Ready' : 'Setup'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          ZOOM CALLBACK — Success
      ============================================ */}

      {zoomStatus === 'connected' && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-emerald-900">
                Zoom Successfully Connected
              </h2>
              <p className="mt-1 text-sm text-emerald-700 leading-relaxed">
                Your Zoom account is now linked to your teacher account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          ZOOM CALLBACK — Error
      ============================================ */}

      {zoomStatus === 'error' && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-md shadow-rose-500/30">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-rose-900">Zoom Connection Failed</h2>
              <p className="mt-1 break-words text-sm text-rose-700 leading-relaxed">
                {zoomMessage || 'An error occurred while connecting Zoom.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          PROFILE CARD
      ============================================ */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Teacher Account
            </h2>
            <p className="text-xs text-slate-500">Your account information</p>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 p-5 sm:grid-cols-2">
          <InfoTile
            icon={<User className="h-4 w-4" />}
            label="Name"
            value={teacher.name || 'Not provided'}
            tone="indigo"
          />
          <InfoTile
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={teacher.email || 'Not provided'}
            tone="sky"
            breakAll
          />
          <InfoTile
            icon={<School className="h-4 w-4" />}
            label="Academy"
            value={academy?.name || 'Academy not found'}
            tone="violet"
          />
          <InfoTile
            icon={
              teacher.isAvailable ? (
                <BadgeCheck className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )
            }
            label="Status"
            value={teacher.isAvailable ? 'Active' : 'Inactive'}
            tone={teacher.isAvailable ? 'emerald' : 'rose'}
          />
        </div>
      </div>

      {/* ============================================
          ZOOM INTEGRATION CARD
      ============================================ */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 text-white">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/40 blur-3xl" />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg">
                <Video className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
                  <Zap className="h-3 w-3" />
                  Zoom Integration
                </div>
                <h2 className="mt-2 text-xl font-bold">Zoom Classroom</h2>
                <p className="mt-1 text-sm text-indigo-100">
                  Connect Zoom to start your assigned classes.
                </p>
              </div>
            </div>

            {isZoomConnected ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-100 text-xs font-bold uppercase tracking-wider w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 text-amber-100 text-xs font-bold uppercase tracking-wider w-fit">
                <CircleDot className="h-3 w-3" />
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          {!isZoomConnected ? (
            /* ----------------------------------------
               NOT CONNECTED STATE
            ---------------------------------------- */
            <div className="space-y-5">
              {/* Instructions */}
              <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-md shadow-sky-500/30">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sky-900">
                      Before you connect
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-sky-800">
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                        <span>
                          Your Zoom account must already be signed in on this
                          device.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                        <span>
                          Your Zoom account email must match the email you used
                          to sign in to this website.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2">
                <FeaturePill
                  icon={<Video className="h-3.5 w-3.5" />}
                  label="HD Video"
                  tone="sky"
                />
                <FeaturePill
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                  label="Host Controls"
                  tone="violet"
                />
                <FeaturePill
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  label="Secure OAuth"
                  tone="emerald"
                />
              </div>

              {/* CTA */}
              <div>
                <a
                  href="/api/zoom/connect"
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all"
                >
                  <Video className="h-4 w-4" />
                  Connect Zoom Account
                  <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3" />
                  You will be redirected to the Zoom authorization page.
                </p>
              </div>
            </div>
          ) : (
            /* ----------------------------------------
               CONNECTED STATE
            ---------------------------------------- */
            <div className="space-y-5">
              {/* Success banner */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-emerald-900">
                      Zoom is connected
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      Your Zoom account is ready to be used for assigned
                      online classes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Zoom Details Grid */}
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <DetailTile
                  icon={<Mail className="h-4 w-4" />}
                  label="Zoom Account Email"
                  value={zoomConnection.zoomEmail || 'Not available'}
                  tone="indigo"
                  breakAll
                />

                <DetailTile
                  icon={<IdCard className="h-4 w-4" />}
                  label="Zoom User ID"
                  value={zoomConnection.zoomUserId || 'Not available'}
                  tone="violet"
                  mono
                  breakAll
                />

                <DetailTile
                  icon={<Hash className="h-4 w-4" />}
                  label="Zoom Account ID"
                  value={zoomConnection.zoomAccountId || 'Not available'}
                  tone="sky"
                  mono
                  breakAll
                />

                <DetailTile
                  icon={<BadgeCheck className="h-4 w-4" />}
                  label="Connection Status"
                  value="Connected & Verified"
                  tone="emerald"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <a
                  href="/api/zoom/connect"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 px-5 py-3 text-sm font-bold text-indigo-700 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reconnect Zoom
                </a>

                <Link
                  href="/teacher/classes"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-3 text-sm font-bold text-white transition"
                >
                  <GraduationCap className="h-4 w-4" />
                  Go to My Classes
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          SECURITY NOTICE
      ============================================ */}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">Security &amp; Privacy</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Zoom OAuth access and refresh tokens are never exposed to the
              browser. This sensitive information is stored only in the
              server-side database.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" />
                Server-side tokens
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" />
                OAuth 2.0
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                <KeyRound className="h-3 w-3" />
                Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   Sub Components
   ====================================================== */

function InfoTile({
  icon,
  label,
  value,
  tone,
  breakAll,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'indigo' | 'sky' | 'violet' | 'emerald' | 'rose';
  breakAll?: boolean;
}) {
  const toneMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      ring: 'ring-indigo-100',
    },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100' },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      ring: 'ring-violet-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      ring: 'ring-emerald-100',
    },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  }[tone];

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-center gap-3">
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
            className={`text-sm font-bold text-slate-900 mt-0.5 ${
              breakAll ? 'break-all' : 'truncate'
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailTile({
  icon,
  label,
  value,
  tone,
  mono,
  breakAll,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'indigo' | 'sky' | 'violet' | 'emerald';
  mono?: boolean;
  breakAll?: boolean;
}) {
  const toneMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-100',
    },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      border: 'border-violet-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
  }[tone];

  return (
    <div
      className={`rounded-2xl border ${toneMap.border} bg-white p-4 hover:shadow-md transition-all`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className={`h-7 w-7 rounded-lg ${toneMap.bg} ${toneMap.text} flex items-center justify-center`}
        >
          {icon}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p
        className={`text-sm font-semibold text-slate-900 ${
          mono ? 'font-mono' : ''
        } ${breakAll ? 'break-all' : 'truncate'}`}
      >
        {value}
      </p>
    </div>
  );
}

function FeaturePill({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'sky' | 'violet' | 'emerald';
}) {
  const toneMap = {
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${toneMap} text-xs font-semibold`}
    >
      {icon}
      {label}
    </span>
  );
}