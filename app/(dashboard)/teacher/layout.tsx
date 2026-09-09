'use client';

import { useState } from 'react';
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
  Menu,
  X,
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

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* =========================================
          MOBILE HEADER
      ========================================= */}
      <header
        className="
          fixed top-0 left-0 right-0 h-16
          bg-white border-b border-gray-200 shadow-sm
          z-[100] lg:hidden
          flex items-center justify-between px-4
        "
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl">👨‍🏫</span>
          <span className="text-xl font-bold text-indigo-700">Teacher</span>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="
            flex items-center justify-center
            h-10 w-10 rounded-lg
            hover:bg-gray-100 active:bg-gray-200
            transition focus:outline-none
          "
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </header>

      {/* =========================================
          MOBILE OVERLAY + DROPDOWN MENU
      ========================================= */}
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed top-16 left-0 right-0 bottom-0 bg-black/30 z-[80] lg:hidden"
            onClick={closeSidebar}
          />
          {/* Dropdown Menu */}
          <div
            className="
              fixed top-16 left-0 right-0
              bg-white border-b border-gray-200 shadow-xl
              z-[90] lg:hidden
            "
          >
            <nav className="p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/teacher/dashboard' &&
                    pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      text-sm font-medium transition
                      ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex items-center gap-3 px-4 py-3 w-full rounded-xl
                  text-sm font-medium text-red-600 hover:bg-red-50 transition
                "
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Logout
              </button>
            </nav>
          </div>
        </>
      )}

      {/* =========================================
          DESKTOP SIDEBAR
      ========================================= */}
      <aside
        className="
          hidden lg:flex fixed top-0 left-0 bottom-0 w-72
          bg-white border-r border-gray-200 flex-col z-50
        "
      >
        {/* Logo / Title */}
        <div className="shrink-0 border-b border-gray-200 p-6">
          <Link
            href="/teacher/dashboard"
            className="flex items-center gap-2"
          >
            <span className="text-3xl">👨‍🏫</span>
            <h1 className="text-2xl font-bold text-indigo-700">
              Teacher Panel
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/teacher/dashboard' &&
                pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition
                  ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
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
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =========================================
          MAIN CONTENT
      ========================================= */}
      <main
        className="
          min-h-screen w-full bg-gray-50
          pt-20 px-4 sm:px-6
          lg:ml-72 lg:pt-8 lg:px-8
        "
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}