'use client';

import { useState, useEffect } from 'react';
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
  X,
  GraduationCap,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type TeacherLayoutProps = {
  children: ReactNode;
};

/* ============================================================
   NAVIGATION
   ============================================================ */

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { name: 'My Academy', href: '/teacher/academy', icon: School },
  { name: 'My Classes', href: '/teacher/classes', icon: BookOpen },
  { name: 'My Students', href: '/teacher/students', icon: Users },
  { name: 'Schedule', href: '/teacher/schedule', icon: Calendar },
  { name: 'Profile', href: '/teacher/profile', icon: User },
  { name: 'Settings', href: '/teacher/settings', icon: Settings },
];

/* Bottom tab bar — 4 main + More */
const bottomTabs: NavItem[] = [
  { name: 'Home', href: '/teacher/dashboard', icon: LayoutDashboard },
  { name: 'Classes', href: '/teacher/classes', icon: BookOpen },
  { name: 'Students', href: '/teacher/students', icon: Users },
  { name: 'Schedule', href: '/teacher/schedule', icon: Calendar },
];

/* ============================================================
   LAYOUT
   ============================================================ */

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  /* Close "More" sheet when route changes */
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  /* Lock body scroll when sheet is open */
  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMoreOpen]);

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  const isItemActive = (href: string) =>
    pathname === href ||
    (href !== '/teacher/dashboard' && pathname.startsWith(`${href}/`));

  /* ---------- Desktop Nav Item ---------- */
  const renderDesktopNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={[
          'group relative flex items-center gap-3 rounded-xl px-3.5 py-3',
          'text-sm font-semibold transition-all duration-200',
          isActive
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        ].join(' ')}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-600" />
        )}
        <div
          className={[
            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition',
            isActive
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700',
          ].join(' ')}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="flex-1">{item.name}</span>
        {isActive && (
          <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
        )}
      </Link>
    );
  };

  /* ---------- Mobile Sheet Row ---------- */
  const renderSheetRow = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={[
          'flex items-center gap-3 px-3 py-3 rounded-2xl',
          'text-sm font-semibold transition-all',
          isActive
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700'
            : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100',
        ].join(' ')}
      >
        <span
          className={[
            'flex items-center justify-center h-10 w-10 rounded-xl shrink-0',
            isActive
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-purple-500/25'
              : 'bg-slate-100 text-slate-500',
          ].join(' ')}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="flex-1">{item.name}</span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =========================================
          MOBILE TOP HEADER
      ========================================= */}
      <header
        className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4"
        style={{ height: '4rem' }}
      >
        <Link
          href="/teacher/dashboard"
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-md shadow-purple-500/25">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              Teacher Panel
            </p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Manage your classes
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/teacher/settings"
            aria-label="Settings"
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-100 active:bg-slate-200 transition"
          >
            <Settings className="h-5 w-5 text-slate-700" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-rose-50 active:bg-rose-100 transition"
          >
            <LogOut className="h-5 w-5 text-rose-600" />
          </button>
        </div>
      </header>

      {/* =========================================
          LAYOUT WRAPPER
      ========================================= */}
      <div
        className="mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 flex gap-0 lg:gap-6"
        style={{ paddingTop: 'calc(4rem + 0.75rem)' }}
      >
        {/* =========================================
            DESKTOP SIDEBAR
        ========================================= */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 sticky top-20 self-start h-[calc(100vh-6rem)] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="relative shrink-0 p-5 border-b border-slate-100">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <Link
              href="/teacher/dashboard"
              className="relative flex items-center gap-3 group"
            >
              <div className="relative shrink-0">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
              </div>
              <div className="min-w-0 leading-tight">
                <h1 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition">
                  Teacher Panel
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Manage your classes
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Navigation
              </p>
            </div>

            {navItems.map(renderDesktopNavItem)}
          </nav>

          <div className="shrink-0 border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl p-3 text-sm font-semibold text-rose-600 text-left hover:bg-rose-50 transition-all active:scale-[0.98]"
            >
              <div className="h-9 w-9 rounded-lg bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center shrink-0 transition">
                <LogOut className="h-4 w-4 text-rose-600" />
              </div>
              <span className="flex-1">Logout</span>
            </button>
          </div>
        </aside>

        {/* =========================================
            MAIN CONTENT
        ========================================= */}
        <main className="flex-1 min-w-0 pb-28 lg:pb-6">{children}</main>
      </div>

      {/* =========================================
          MOBILE BOTTOM TAB BAR
      ========================================= */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/98 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_-8px_rgba(15,23,42,0.15)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 h-16">
          {bottomTabs.map((tab) => {
            const active = isItemActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="relative flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <span
                  className={[
                    'flex items-center justify-center h-8 w-12 rounded-full transition-all',
                    active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={[
                    'text-[10px] font-medium leading-none',
                    active ? 'text-indigo-700' : 'text-slate-500',
                  ].join(' ')}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-label="More"
            className="relative flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <span className="flex items-center justify-center h-8 w-12 rounded-full text-slate-500">
              <MoreHorizontal className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-medium leading-none text-slate-500">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* =========================================
          MOBILE "MORE" BOTTOM SHEET
          (always mounted → smooth transition, no keyframes)
      ========================================= */}
      <div
        className={[
          'lg:hidden fixed inset-0 z-50 transition-opacity duration-300',
          isMoreOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        ].join(' ')}
        aria-hidden={!isMoreOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          onClick={() => setIsMoreOpen(false)}
        />

        {/* Sheet */}
        <div
          className={[
            'absolute bottom-0 left-0 right-0',
            'bg-white rounded-t-3xl shadow-2xl',
            'max-h-[80vh] flex flex-col',
            'transition-transform duration-300 ease-out',
            isMoreOpen ? 'translate-y-0' : 'translate-y-full',
          ].join(' ')}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Handle */}
          <div className="pt-3 pb-1 flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 pt-2 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  Teacher Panel
                </p>
                <p className="text-[11px] text-slate-500">Manage your classes</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              aria-label="Close"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 transition"
            >
              <X className="h-4 w-4 text-slate-700" />
            </button>
          </div>

          {/* Scroll content */}
          <div className="overflow-y-auto px-3 py-3">
            <p className="px-3 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </p>
            <div className="space-y-1">{navItems.map(renderSheetRow)}</div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 w-full rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition"
              >
                <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-rose-100 text-rose-600">
                  <LogOut className="h-5 w-5" />
                </span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}