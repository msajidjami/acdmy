// components/home/AdminHome.tsx
'use client';

// ✅ AuthUser کو مقامی طور پر ڈیفائن کریں
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

import { DashboardCard } from './shared/DashboardCard';
import { QuickActions } from './shared/QuickActions';
import { RecentActivities } from './shared/RecentActivities';
import {
  Users,
  GraduationCap,
  BookOpen,
  UserPlus,
  TrendingUp,
  DollarSign,
  Newspaper,
  Star,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  Settings,
  FileText,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────

interface AdminData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalAdmissions: number;
    pendingAdmissions: number;
    activeClasses: number;
    revenue: number;
    totalArticles: number;
    totalReviews: number;
  };
  recentAdmissions: Array<{
    id: string;
    studentName: string;
    course: string;
    date: string;
    status: string;
  }>;
  recentStudents: Array<{ id: string; name: string; email: string; joined: string }>;
  recentTeachers: Array<{ id: string; name: string; subject: string; joined: string }>;
  recentPayments: Array<{ id: string; student: string; amount: number; date: string; status: string }>;
  monthlyAdmissions: Array<{ month: string; count: number }>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  latestActivities: Array<{
    id: string;
    user: string;
    action: string;
    date: string;
    status?: string;
  }>;
}

interface AdminHomeProps {
  user: AuthUser;
  stats: AdminData['stats'];
  recentAdmissions: AdminData['recentAdmissions'];
  recentStudents: AdminData['recentStudents'];
  recentTeachers: AdminData['recentTeachers'];
  recentPayments: AdminData['recentPayments'];
  monthlyAdmissions: AdminData['monthlyAdmissions'];
  monthlyRevenue: AdminData['monthlyRevenue'];
  latestActivities: AdminData['latestActivities'];
}

// ─── AdminHome Component ──────────────────────────────────────────

export default function AdminHome({
  user,
  stats,
  recentAdmissions,
  recentStudents,
  recentTeachers,
  recentPayments,
  monthlyAdmissions,
  monthlyRevenue,
  latestActivities,
}: AdminHomeProps) {
  // Quick management actions
  const managementActions = [
    { label: 'Manage Students', icon: Users, href: '/admin/students', color: 'text-blue-600' },
    { label: 'Manage Teachers', icon: GraduationCap, href: '/admin/teachers', color: 'text-green-600' },
    { label: 'Manage Courses', icon: BookOpen, href: '/admin/courses', color: 'text-purple-600' },
    { label: 'Manage Articles', icon: Newspaper, href: '/admin/articles', color: 'text-orange-600' },
    { label: 'Manage Admissions', icon: UserPlus, href: '/admin/admissions', color: 'text-pink-600' },
    { label: 'Manage Reviews', icon: Star, href: '/admin/reviews', color: 'text-yellow-600' },
    { label: 'Manage Payments', icon: DollarSign, href: '/admin/payments', color: 'text-emerald-600' },
    { label: 'Manage Users', icon: ShieldCheck, href: '/admin/users', color: 'text-indigo-600' },
  ];

  // Build stats cards data
  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, trend: 8 },
    { title: 'Total Teachers', value: stats.totalTeachers, icon: GraduationCap, trend: 4 },
    { title: 'Total Courses', value: stats.totalCourses, icon: BookOpen, trend: 12 },
    { title: 'Admissions', value: stats.totalAdmissions, icon: UserPlus, trend: 15 },
    { title: 'Pending Admissions', value: stats.pendingAdmissions, icon: Calendar, trend: -3 },
    { title: 'Active Classes', value: stats.activeClasses, icon: Activity, trend: 6 },
    { title: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, trend: 22 },
    { title: 'Articles', value: stats.totalArticles, icon: Newspaper, trend: 5 },
    { title: 'Reviews', value: stats.totalReviews, icon: Star, trend: 18 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 mt-30 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Admin Info */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-indigo-100 mt-1">Admin Dashboard • {new Date().toLocaleDateString()}</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium">
              Role: {user.role}
            </span>
            <Link
              href="/admin/settings"
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <DashboardCard
            key={idx}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendLabel="vs last month"
          />
        ))}
      </div>

      {/* Charts Section (Placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Monthly Admissions
          </h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyAdmissions.map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-indigo-500 dark:bg-indigo-400 rounded-t-lg transition-all hover:bg-indigo-600 dark:hover:bg-indigo-300"
                  style={{ height: `${(item.count / Math.max(...monthlyAdmissions.map(m => m.count))) * 100}%` }}
                />
                <span className="text-xs mt-2 text-gray-500 dark:text-gray-400">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Monthly Revenue
          </h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyRevenue.map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-emerald-500 dark:bg-emerald-400 rounded-t-lg transition-all hover:bg-emerald-600 dark:hover:bg-emerald-300"
                  style={{ height: `${(item.amount / Math.max(...monthlyRevenue.map(m => m.amount))) * 100}%` }}
                />
                <span className="text-xs mt-2 text-gray-500 dark:text-gray-400">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tables & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Recent Admissions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Recent Admissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 font-medium">Student</th>
                    <th className="text-left py-2 font-medium">Course</th>
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAdmissions.map((admission) => (
                    <tr key={admission.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-2">{admission.studentName}</td>
                      <td className="py-2">{admission.course}</td>
                      <td className="py-2">{admission.date}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          admission.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          admission.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {admission.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link href="/admin/admissions" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline mt-2 inline-block">
                View all admissions →
              </Link>
            </div>
          </div>

          {/* Latest Activities */}
          <RecentActivities activities={latestActivities} title="Latest Activities" />
        </div>

        {/* Right column: Quick Actions and Recent Payments */}
        <div className="space-y-6">
          <QuickActions actions={managementActions} title="Management Quick Actions" />

          {/* Recent Payments */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{payment.student}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{payment.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${payment.amount}</p>
                    <span className={`text-xs font-medium ${
                      payment.status === 'Completed' ? 'text-green-600' :
                      payment.status === 'Pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/payments" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline mt-3 inline-block">
              View all payments →
            </Link>
          </div>

          {/* Quick Stats: Recent Students & Teachers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <h4 className="font-semibold text-sm mb-2">Recent Students</h4>
              <ul className="text-xs space-y-1">
                {recentStudents.slice(0, 3).map((s) => (
                  <li key={s.id} className="truncate">{s.name}</li>
                ))}
              </ul>
              <Link href="/admin/students" className="text-indigo-600 dark:text-indigo-400 text-xs hover:underline mt-1 inline-block">
                View all
              </Link>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <h4 className="font-semibold text-sm mb-2">Recent Teachers</h4>
              <ul className="text-xs space-y-1">
                {recentTeachers.slice(0, 3).map((t) => (
                  <li key={t.id} className="truncate">{t.name}</li>
                ))}
              </ul>
              <Link href="/admin/teachers" className="text-indigo-600 dark:text-indigo-400 text-xs hover:underline mt-1 inline-block">
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}