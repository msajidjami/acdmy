import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Inquiry from '@/models/Inquiry';
import Teacher from '@/models/Teacher';
import Enrollment from '@/models/Enrollment';
import PaymentProof from '@/models/PaymentProof';
import Link from 'next/link';
import {
  Users,
  School,
  Mail,
  GraduationCap,
  BookOpen,
  UserCheck,
  Crown,
  TrendingUp,
  ArrowRight,
  Activity,
  Clock,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

interface DecodedToken extends jwt.JwtPayload {
  role: string;
  name?: string;
  email?: string;
}

/* ============================================================
   DATA FETCH
   ============================================================ */

async function getAdminStats() {
  await connectDB();

  const [
    usersCount,
    ownersCount,
    teachersCount,
    studentsCount,
    academiesCount,
    inquiriesCount,
    enrollmentsCount,
    pendingProofsCount,
    approvedProofsCount,
    rejectedProofsCount,
    recentAcademies,
    recentInquiries,
    recentProofs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'owner' }),
    Teacher.countDocuments(),
    User.countDocuments({ role: 'student' }),
    Academy.countDocuments(),
    Inquiry.countDocuments({ status: 'pending' }),
    Enrollment.countDocuments(),
    PaymentProof.countDocuments({ status: 'pending' }),
    PaymentProof.countDocuments({ status: 'approved' }),
    PaymentProof.countDocuments({ status: 'rejected' }),
    Academy.find().sort({ createdAt: -1 }).limit(4).lean(),
    Inquiry.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean(),
    PaymentProof.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('ownerId', 'name email')
      .populate('academyId', 'name slug')
      .lean(),
  ]);

  return {
    usersCount,
    ownersCount,
    teachersCount,
    studentsCount,
    academiesCount,
    inquiriesCount,
    enrollmentsCount,
    pendingProofsCount,
    approvedProofsCount,
    rejectedProofsCount,
    recentAcademies: recentAcademies.map((a: any) => ({
      _id: String(a._id),
      name: String(a.name || ''),
      slug: String(a.slug || ''),
      logo: String(a.logo || ''),
      createdAt: a.createdAt,
    })),
    recentInquiries: recentInquiries.map((i: any) => ({
      _id: String(i._id),
      visitorName: String(i.visitorName || 'Guest'),
      visitorEmail: String(i.visitorEmail || ''),
      createdAt: i.createdAt,
    })),
    recentProofs: recentProofs.map((p: any) => ({
      _id: String(p._id),
      planName: String(p.planName || ''),
      amountUSD: Number(p.amountUSD || 0),
      amountPKR: Number(p.amountPKR || 0),
      createdAt: p.createdAt,
      ownerName: String(p.ownerId?.name || 'Unknown'),
      ownerEmail: String(p.ownerId?.email || ''),
      academyName: String(p.academyId?.name || ''),
    })),
  };
}

/* ============================================================
   HELPERS
   ============================================================ */

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not defined');

  let decoded: DecodedToken;
  try {
    decoded = jwt.verify(token, secret) as DecodedToken;
    if (decoded.role !== 'admin') redirect('/');
  } catch {
    redirect('/login');
  }

  const stats = await getAdminStats();

  const primaryStats = [
    {
      label: 'Total Users',
      value: stats.usersCount,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Academies',
      value: stats.academiesCount,
      icon: School,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Teachers',
      value: stats.teachersCount,
      icon: UserCheck,
      gradient: 'from-purple-500 to-pink-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    {
      label: 'Students',
      value: stats.studentsCount,
      icon: GraduationCap,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  ];

  const secondaryStats = [
    {
      label: 'Owners',
      value: stats.ownersCount,
      icon: Crown,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Enrollments',
      value: stats.enrollmentsCount,
      icon: BookOpen,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      label: 'Pending Inquiries',
      value: stats.inquiriesCount,
      icon: Mail,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ============================================
          WELCOME HEADER
      ============================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              System Online
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Welcome back, Admin 👋
            </h1>
            <p className="mt-2 text-indigo-100 text-sm sm:text-base max-w-xl">
              Here&apos;s a snapshot of your platform&apos;s activity today.
              Manage users, academies, and inquiries — all from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {stats.pendingProofsCount > 0 && (
              <Link
                href="/admin/payment-proofs"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap animate-pulse"
              >
                <Receipt className="h-4 w-4" />
                {stats.pendingProofsCount} Payment
                {stats.pendingProofsCount > 1 ? 's' : ''}
              </Link>
            )}
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap"
            >
              Manage Users
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================
          ALERT — PENDING PAYMENTS
      ============================================ */}
      {stats.pendingProofsCount > 0 && (
        <Link
          href="/admin/payment-proofs"
          className="block rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5 hover:shadow-lg transition group"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-lg">
                {stats.pendingProofsCount} payment
                {stats.pendingProofsCount > 1 ? 's' : ''} waiting for review
              </h3>
              <p className="text-sm text-amber-800 mt-1">
                Users have submitted payment receipts. Review and approve them
                to activate their academies.
              </p>
              <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-amber-700 group-hover:gap-3 transition-all">
                Review Now
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* ============================================
          PRIMARY STATS
      ============================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Key metrics at a glance
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full">
            <TrendingUp className="h-3.5 w-3.5" />
            All systems healthy
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
                />

                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center`}
                  >
                    <Icon className={`h-5 w-5 ${stat.text}`} />
                  </div>
                </div>

                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {formatNumber(stat.value)}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================
          PAYMENT STATS
      ============================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Payments
            </h2>
          </div>
          <Link
            href="/admin/payment-proofs"
            className="text-xs text-violet-600 hover:text-violet-700 font-bold inline-flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/payment-proofs?status=pending"
            className="group bg-white rounded-2xl p-5 border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.pendingProofsCount}
                </p>
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">
                  Pending
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/payment-proofs?status=approved"
            className="group bg-white rounded-2xl p-5 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.approvedProofsCount}
                </p>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                  Approved
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/payment-proofs?status=rejected"
            className="group bg-white rounded-2xl p-5 border-2 border-rose-200 hover:border-rose-400 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-rose-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.rejectedProofsCount}
                </p>
                <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">
                  Rejected
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ============================================
          SECONDARY STATS + ACTIVITY
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Secondary stats */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Additional Metrics
            </h3>
          </div>

          <div className="space-y-3">
            {secondaryStats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center`}
                    >
                      <Icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {s.label}
                    </span>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {formatNumber(s.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Academies */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Recent Academies
              </h3>
            </div>
            <Link
              href="/admin/academies"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              View all
            </Link>
          </div>

          {stats.recentAcademies.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No academies yet
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recentAcademies.map((a) => (
                <Link
                  key={a._id}
                  href={`/academy/${a.slug}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-base shadow-sm">
                    {a.logo || '🏛️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {a.name}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(a.createdAt as Date)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Pending Payments */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Pending Payments
              </h3>
            </div>
            <Link
              href="/admin/payment-proofs"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              View all
            </Link>
          </div>

          {stats.recentProofs.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                All caught up!
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                No pending payments
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentProofs.map((p) => (
                <Link
                  key={p._id}
                  href={`/admin/payment-proofs`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition"
                >
                  <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Receipt className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {p.ownerName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {p.planName} ·{' '}
                      {p.amountUSD > 0
                        ? `$${p.amountUSD}`
                        : `₨${p.amountPKR}`}
                      {' · '}
                      {timeAgo(p.createdAt as Date)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          QUICK ACTIONS
      ============================================ */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Quick Actions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your platform with one click
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/payment-proofs"
            className="group relative bg-white p-5 rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-800">
                    Payment Proofs
                  </h3>
                  {stats.pendingProofsCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                      {stats.pendingProofsCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review payments
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800">
                  Manage Users
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View or edit users
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/academies"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <School className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800">
                  Academies
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage academies
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/inquiries"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800">
                  Inquiries
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check messages
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}