// app/components/home/StudentHome.tsx
'use client';

import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  MessageCircle,
  FileText,
  CreditCard,
  User,
  Award,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface UpcomingClass {
  _id: string;
  title: string;
  time: string;
}

interface Assignment {
  _id: string;
  title: string;
  dueDate: string;
  status: string;
}

interface Attendance {
  date: string;
  present: number;
  total: number;
}

interface Message {
  _id: string;
  from: string;
  message: string;
  time: string;
}

interface StudentHomeProps {
  user: User;
  currentCourse: string;
  progress: number;
  upcomingClasses: UpcomingClass[];
  assignments: Assignment[];
  attendance: Attendance[];
  messages: Message[];
}

// ─── Component ──────────────────────────────────────────────────────

export default function StudentHome({
  user,
  currentCourse,
  progress,
  upcomingClasses = [],
  assignments = [],
  attendance = [],
  messages = [],
}: StudentHomeProps) {
  const quickActions = [
    { label: 'Join Zoom', icon: Calendar, href: '/student/zoom' },
    { label: 'Assignments', icon: FileText, href: '/student/assignments' },
    { label: 'Payments', icon: CreditCard, href: '/student/payments' },
    { label: 'Support', icon: MessageCircle, href: '/student/support' },
  ];

  const announcements = [
    { id: '1', title: 'New Course Added', date: '2025-03-15' },
    { id: '2', title: 'Exam Schedule', date: '2025-03-12' },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Welcome & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl font-bold">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
              <p className="text-slate-600 dark:text-slate-300">Current Course: {currentCourse || 'None'}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mt-1">
              <div
                className="bg-teal-600 h-4 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/student/courses"
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Continue Learning
            </Link>
            <Link
              href="/student/attendance"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              View Attendance
            </Link>
          </div>
        </div>

        {/* Side Card: Today's Schedule */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 className="font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Today's Schedule
          </h3>
          {upcomingClasses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">No classes today.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {upcomingClasses.map((cls) => (
                <li key={cls._id} className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0">
                  <span>{cls.title}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{cls.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <action.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="mt-1 text-xs text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-500" />
            Announcements
          </h3>
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements.</p>
          ) : (
            <ul className="space-y-2">
              {announcements.map((ann) => (
                <li key={ann.id} className="border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0">
                  <p className="font-medium">{ann.title}</p>
                  <p className="text-xs text-slate-500">{ann.date}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Messages */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            Recent Messages
          </h3>
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">No messages.</p>
          ) : (
            <ul className="space-y-2">
              {messages.slice(0, 3).map((msg) => (
                <li key={msg._id} className="border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0">
                  <p className="font-medium">{msg.from}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{msg.message}</p>
                  <p className="text-xs text-slate-400">{msg.time}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Attendance Overview (if needed) */}
      {attendance.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 mt-6">
          <h3 className="font-bold mb-4">Recent Attendance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {attendance.slice(0, 4).map((item, idx) => (
              <div key={idx} className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <p className="text-sm font-medium">{item.date}</p>
                <p className="text-2xl font-bold text-teal-600">{item.present}/{item.total}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}