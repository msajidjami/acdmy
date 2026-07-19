// components/home/TeacherHome.tsx
'use client';

import { DashboardCard } from './shared/DashboardCard';
import { QuickActions } from './shared/QuickActions';
import { RecentActivities } from './shared/RecentActivities';
import {
  Calendar,
  Users,
  Clock,
  FileText,
  MessageCircle,
  UserPlus,
  Video,
  Upload,
  Edit,
  BookOpen,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface TeacherData {
  todayClasses: Array<{ time: string; subject: string; students: number }>;
  upcomingClasses: Array<{ time: string; subject: string; students: number }>;
  studentsCount: number;
  attendance: Array<{ date: string; present: number; total: number }>;
  assignmentsToCheck: number;
  recentMessages: Array<{ from: string; message: string; time: string }>;
  schedule: Array<{ day: string; time: string; subject: string }>;
}

interface TeacherHomeProps {
  user: AuthUser;
  todayClasses: TeacherData['todayClasses'];
  upcomingClasses: TeacherData['upcomingClasses'];
  studentsCount: number;
  attendance: TeacherData['attendance'];
  assignmentsToCheck: number;
  recentMessages: TeacherData['recentMessages'];
  schedule: TeacherData['schedule'];
}

export default function TeacherHome({
  user,
  todayClasses,
  upcomingClasses,
  studentsCount,
  attendance,
  assignmentsToCheck,
  recentMessages,
  schedule,
}: TeacherHomeProps) {
  const stats = [
    { title: "Today's Classes", value: todayClasses.length, icon: Calendar },
    { title: 'Upcoming Classes', value: upcomingClasses.length, icon: Clock },
    { title: 'Students', value: studentsCount, icon: Users },
    { title: 'Assignments to Check', value: assignmentsToCheck, icon: FileText },
  ];

  const quickActions = [
    { label: 'Take Attendance', icon: CheckSquare, href: '/teacher/attendance', color: 'text-blue-600' },
    { label: 'Start Zoom Class', icon: Video, href: '/teacher/zoom', color: 'text-green-600' },
    { label: 'Upload Notes', icon: Upload, href: '/teacher/notes', color: 'text-purple-600' },
    { label: 'Create Assignment', icon: Edit, href: '/teacher/assignments/create', color: 'text-orange-600' },
    { label: 'View Students', icon: Users, href: '/teacher/students', color: 'text-pink-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
        <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-green-100 mt-1">You have {todayClasses.length} classes today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <DashboardCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.title === 'Students' ? 8 : undefined}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Today's Classes</h3>
            {todayClasses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No classes today.</p>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                    <span className="font-medium">{cls.time}</span>
                    <span>{cls.subject}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{cls.students} students</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Classes */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Upcoming Classes</h3>
            {upcomingClasses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No upcoming classes.</p>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((cls, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                    <span className="font-medium">{cls.time}</span>
                    <span>{cls.subject}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{cls.students} students</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activities (can be used for attendance or assignment updates) */}
          <RecentActivities
            activities={[
              { id: '1', user: 'Student A', action: 'Submitted assignment', date: '2025-03-10', status: 'Pending' },
              { id: '2', user: 'Student B', action: 'Sent message', date: '2025-03-09', status: 'Completed' },
            ]}
            title="Recent Student Activity"
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <QuickActions actions={quickActions} title="Quick Actions" />

          {/* Recent Messages */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
            {recentMessages.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No messages.</p>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      {msg.from.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{msg.from}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{msg.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Schedule Preview */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
            <div className="space-y-2">
              {schedule.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                  <span className="font-medium">{item.day}</span>
                  <span>{item.time}</span>
                  <span className="text-gray-500 dark:text-gray-400">{item.subject}</span>
                </div>
              ))}
              {schedule.length > 3 && (
                <Link href="/teacher/schedule" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                  View full schedule →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}