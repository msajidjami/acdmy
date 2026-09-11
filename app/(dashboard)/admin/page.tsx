import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Inquiry from '@/models/Inquiry';
import Teacher from '@/models/Teacher';
import Enrollment from '@/models/Enrollment';
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
} from 'lucide-react';

/* ------------------ Types ------------------ */

interface DecodedToken extends jwt.JwtPayload {
  role: string;
  name?: string;
  email?: string;
}

/* ------------------ Data Fetching ------------------ */

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
    recentAcademies,
    recentInquiries,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'owner' }),
    Teacher.countDocuments(),
    User.countDocuments({ role: 'student' }),
    Academy.countDocuments(),
    Inquiry.countDocuments({ status: 'pending' }),
    Enrollment.countDocuments(),
    Academy.find().sort({ createdAt: -1 }).limit(4).lean(),
    Inquiry.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(4)
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
    recentAcademies: recentAcademies.map((a) => ({
      _id: a._id.toString(),
      name: a.name,
      slug: a.slug,
      logo: a.logo,
      createdAt: a.createdAt,
    })),
    recentInquiries: recentInquiries.map((i) => ({
      _id: i._id.toString(),
      visitorName: i.visitorName || 'Guest',
      visitorEmail: i.visitorEmail || '',
      createdAt: i.createdAt,
    })),
  };
}

/* ------------------ Helpers ------------------ */

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

/* ------------------ Page ------------------ */

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  let decoded: DecodedToken;
  try {
    decoded = jwt.verify(token, secret) as DecodedToken;
    if (decoded.role !== 'admin') {
      redirect('/');
    }
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
      change: '+12%',
    },
    {
      label: 'Academies',
      value: stats.academiesCount,
      icon: School,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      change: '+8%',
    },
    {
      label: 'Teachers',
      value: stats.teachersCount,
      icon: UserCheck,
      gradient: 'from-purple-500 to-pink-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      change: '+15%',
    },
    {
      label: 'Students',
      value: stats.studentsCount,
      icon: GraduationCap,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      change: '+23%',
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
        {/* Decorative blobs */}
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
              Here&apos;s a snapshot of your platform&apos;s activity today. Manage users, academies,
              and inquiries — all from one place.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
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
          PRIMARY STATS CARDS
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
                {/* Gradient accent on hover */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
                />

                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center`}
                  >
                    <Icon className={`h-5 w-5 ${stat.text}`} />
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full ${stat.bg} ${stat.text}`}
                  >
                    {stat.change}
                  </span>
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
          SECONDARY STATS + ACTIVITY
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Secondary stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
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

        {/* Recent Inquiries */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Recent Inquiries
              </h3>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              View all
            </Link>
          </div>

          {stats.recentInquiries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No pending inquiries
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recentInquiries.map((i) => (
                <div
                  key={i._id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {i.visitorName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {i.visitorEmail || 'No email'} · {timeAgo(i.createdAt as Date)}
                    </p>
                  </div>
                </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition">
                  Manage Users
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  View, edit, or delete registered users
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </Link>

          <Link
            href="/admin/academies"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <School className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition">
                  Manage Academies
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Approve, edit, or deactivate academies
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </Link>

          <Link
            href="/admin/inquiries"
            className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden sm:col-span-2 lg:col-span-1"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800 group-hover:text-rose-700 transition">
                  View Inquiries
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Check all pending messages and reply
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      {/* ============================================
          FOOTER TIP
      ============================================ */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200 p-5 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-lg">💡</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Pro Tip
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            You can quickly approve pending academies from the Academies page. Keep your platform clean by reviewing inquiries daily.
          </p>
        </div>
      </div>
    </div>
  );
}