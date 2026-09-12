'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  School,
  BookOpen,
  Users,
  Calendar,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type StudentLayoutProps = {
  children: ReactNode;
};

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'My Academy', href: '/student/academy', icon: School },
  { name: 'My Courses', href: '/student/courses', icon: BookOpen },
  { name: 'My Teachers', href: '/student/teachers', icon: Users },
  { name: 'Schedule', href: '/student/schedule', icon: Calendar },
  { name: 'Messages', href: '/student/messages', icon: MessageSquare },
  { name: 'Profile', href: '/student/profile', icon: User },
  { name: 'Settings', href: '/student/settings', icon: Settings },
];

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isItemActive = (href: string) =>
    pathname === href ||
    (href !== '/student/dashboard' && pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 flex gap-0 lg:gap-6">
        {/* =========================================
            DESKTOP SIDEBAR
        ========================================= */}
        <aside
          className="
            hidden lg:flex flex-col w-72 shrink-0
            sticky top-20 self-start
            h-[calc(100vh-6rem)]
            bg-white border border-slate-200 rounded-2xl
            shadow-sm overflow-hidden
          "
        >
          <div className="relative shrink-0 p-5 border-b border-slate-100">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <Link
              href="/student/dashboard"
              className="relative flex items-center gap-3 group"
            >
              <div className="relative shrink-0">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
              </div>
              <div className="min-w-0 leading-tight">
                <h1 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition">
                  Student Panel
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Learn & grow
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Navigation
              </p>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group relative flex items-center gap-3 rounded-xl px-3.5 py-3
                    text-sm font-semibold transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-sky-500 to-cyan-600" />
                  )}
                  <div
                    className={`
                      h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition
                      ${
                        isActive
                          ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md shadow-cyan-500/25'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="
                group flex w-full items-center gap-3 rounded-xl p-3
                text-sm font-semibold text-rose-600 text-left
                hover:bg-rose-50 transition-all active:scale-[0.98]
              "
            >
              <div className="h-9 w-9 rounded-lg bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center shrink-0 transition">
                <LogOut className="h-4 w-4 text-rose-600" />
              </div>
              <span className="flex-1">Logout</span>
            </button>
          </div>
        </aside>

        {/* =========================================
            MAIN COLUMN
        ========================================= */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* MOBILE HEADER */}
          <header className="lg:hidden sticky top-16 z-[60] -mx-3 sm:-mx-4 mb-3 sm:mb-4">
            <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
              <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4">
                <Link
                  href="/student/dashboard"
                  className="flex items-center gap-2.5 group min-w-0"
                >
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition truncate">
                      Student
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Panel
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isSidebarOpen}
                  className="
                    relative flex items-center justify-center
                    h-10 w-10 rounded-xl shrink-0
                    bg-slate-100 hover:bg-slate-200 active:scale-95
                    text-slate-700 transition-all
                    focus:outline-none focus:ring-2 focus:ring-sky-500/40
                  "
                >
                  <span
                    className={`absolute transition-all duration-300 ${
                      isSidebarOpen
                        ? 'opacity-100 rotate-0'
                        : 'opacity-0 -rotate-90'
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </span>
                  <span
                    className={`absolute transition-all duration-300 ${
                      isSidebarOpen
                        ? 'opacity-0 rotate-90'
                        : 'opacity-100 rotate-0'
                    }`}
                  >
                    <Menu className="h-5 w-5" />
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* MOBILE MENU */}
          {isSidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-40 lg:hidden bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200"
                onClick={closeSidebar}
                aria-hidden="true"
              />

              <div
                className="
                  fixed top-[7.5rem] left-0 right-0 z-50 lg:hidden
                  px-3 sm:px-4 transition-all duration-200
                "
              >
                <div className="rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/30 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500" />

                  <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                      <p className="text-xs font-bold text-slate-700">Menu</p>
                    </div>

                    <button
                      type="button"
                      onClick={closeSidebar}
                      aria-label="Close menu"
                      className="
                        inline-flex items-center gap-1.5 h-8 px-3 rounded-lg
                        bg-slate-100 hover:bg-slate-200 active:scale-95
                        text-slate-700 text-xs font-bold transition
                      "
                    >
                      <X className="h-3.5 w-3.5" />
                      Close
                    </button>
                  </div>

                  <nav className="p-2.5 sm:p-3 space-y-1 max-h-[calc(100vh-14rem)] overflow-y-auto">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isItemActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeSidebar}
                          className={`
                            group relative flex items-center gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl
                            text-sm font-semibold transition-all duration-200
                            ${
                              isActive
                                ? 'bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700 shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]'
                            }
                          `}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-sky-500 to-cyan-600" />
                          )}
                          <div
                            className={`
                              h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition
                              ${
                                isActive
                                  ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md shadow-cyan-500/25'
                                  : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                              }
                            `}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="flex-1">{item.name}</span>
                          {isActive && (
                            <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                          )}
                        </Link>
                      );
                    })}

                    <div className="my-1.5 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="
                        group flex items-center gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3 w-full rounded-xl
                        text-sm font-semibold text-rose-600
                        hover:bg-rose-50 active:scale-[0.98] transition-all
                      "
                    >
                      <div className="h-9 w-9 rounded-lg bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center shrink-0 transition">
                        <LogOut className="h-4 w-4 text-rose-600" />
                      </div>
                      <span className="flex-1 text-left">Logout</span>
                    </button>
                  </nav>

                  <div className="px-3 sm:px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                    <p className="text-[10px] text-slate-400 text-center">
                      Tap outside or press{' '}
                      <kbd className="px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[9px]">
                        Esc
                      </kbd>{' '}
                      to close
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <main className="flex-1 min-w-0 pb-6">{children}</main>
        </div>
      </div>
    </div>
  );
}