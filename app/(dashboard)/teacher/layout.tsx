'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  School,
  Users,
  Calendar,
  User,
  Settings,
  LogOut,
  BookOpen,
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
};

type TeacherLayoutProps = {
  children: ReactNode;
};

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/teacher/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Academy',
    href: '/teacher/academy',
    icon: School,
  },
  {
    name: 'My Classes',
    href: '/teacher/classes',
    icon: BookOpen,
  },
  {
    name: 'My Students',
    href: '/teacher/students',
    icon: Users,
  },
  {
    name: 'Schedule',
    href: '/teacher/schedule',
    icon: Calendar,
  },
  {
    name: 'Profile',
    href: '/teacher/profile',
    icon: User,
  },
  {
    name: 'Settings',
    href: '/teacher/settings',
    icon: Settings,
  },
];

export default function TeacherLayout({
  children,
}: TeacherLayoutProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ================================================================ */}
      {/* Sidebar                                                          */}
      {/* ================================================================ */}

      <aside className="flex h-full w-72 shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm">

        {/* Logo / Title */}
        <div className="shrink-0 border-b border-gray-200 p-6">

          <Link
            href="/teacher/dashboard"
            className="flex items-center gap-2"
          >
            <span className="text-3xl">
              👨‍🏫
            </span>

            <h1 className="text-2xl font-bold text-indigo-700">
              Teacher Panel
            </h1>
          </Link>

        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">

          {navItems.map((item) => {
            const Icon = item.icon;

            /*
             * Exact match کے علاوہ nested pages بھی active رہیں۔
             *
             * مثال:
             * /teacher/classroom/123
             * کو My Classes active دکھائے گا۔
             */
            const isActive =
              pathname === item.href ||
              (item.href !== '/teacher/dashboard' &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span>
                  {item.name}
                </span>
              </Link>
            );
          })}

        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-gray-200 p-4">

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-red-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 shrink-0" />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* ================================================================ */}
      {/* Main Content                                                      */}
      {/* ================================================================ */}

      <main className="min-w-0 flex-1 overflow-y-auto p-6">
        {children}
      </main>

    </div>
  );
}