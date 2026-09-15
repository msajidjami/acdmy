'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  School,
  Users,
  Settings,
  LogOut,
  User,
  BookOpen,
  Calendar,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Inbox,
  FileText,
  Banknote,
  Wallet,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface OwnerLayoutProps {
  children: React.ReactNode;
}

/* ============================================================
   NAVBAR HEIGHT
   ============================================================ */

const NAVBAR_H = '4rem';

/* ============================================================
   NAVIGATION
   ============================================================ */

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { name: 'My Academy', href: '/owner/academy', icon: School },
  { name: 'Teachers', href: '/owner/teachers', icon: Users },
  { name: 'Students', href: '/owner/students', icon: User },
];

const contentNavItems: NavItem[] = [
  { name: 'Courses', href: '/owner/courses', icon: BookOpen },
  { name: 'Assignments', href: '/owner/assignments', icon: Calendar },
  { name: 'Articles', href: '/owner/articles', icon: FileText },
  { name: 'Student Payments', href: '/owner/payments', icon: Banknote },
  { name: 'Teacher Payouts', href: '/owner/teacher-payments', icon: Wallet }, // ✅ نیا
];

const systemNavItems: NavItem[] = [
  { name: 'Messages', href: '/owner/messages', icon: MessageSquare },
  { name: 'Inquiries', href: '/owner/inquiries', icon: Inbox },
  { name: 'Billing', href: '/owner/billing', icon: Sparkles },
  { name: 'Settings', href: '/owner/settings', icon: Settings },
];

/* ============================================================
   LAYOUT
   ============================================================ */

export default function OwnerLayout({ children }: OwnerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    router.push('/login');
  };

  const isActive = (href: string) => {
    /* ✅ Teacher Payouts کو Student Payments سے الگ رکھیں
       ورنہ /owner/payments، /owner/teacher-payments کو بھی میچ کر لے گا */
    if (href === '/owner/payments') {
      return pathname === '/owner/payments' || pathname.startsWith('/owner/payments/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /* ---------- Nav Item ---------- */
  const renderNavItem = (item: NavItem, onClick?: () => void) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onClick}
        className={`
          group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl
          text-sm font-medium transition-all duration-200
          ${
            active
              ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/40 text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-emerald-600 rounded-r-full" />
        )}

        <span
          className={`
            flex items-center justify-center h-8 w-8 rounded-lg transition-colors
            ${
              active
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-600'
            }
          `}
        >
          <Icon className="h-4 w-4" />
        </span>

        <span className="flex-1">{item.name}</span>

        {item.badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-600">
            {item.badge}
          </span>
        )}

        {active && <ChevronRight className="h-4 w-4 text-emerald-500" />}
      </Link>
    );
  };

  /* ---------- Section ---------- */
  const renderSection = (
    label: string,
    items: NavItem[],
    onClick?: () => void
  ) => (
    <>
      <p className="px-3 pt-4 first:pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => renderNavItem(item, onClick))}
      </div>
    </>
  );

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ paddingTop: NAVBAR_H }}
    >
      {/* =========================================
          MOBILE HEADER
      ========================================= */}
      <header
        className="
          fixed left-0 right-0 h-14
          bg-white/95 backdrop-blur-md border-b border-slate-200
          z-40 lg:hidden
          flex items-center justify-between px-4
        "
        style={{ top: NAVBAR_H }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              Owner Panel
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              Academy Manager
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="
            flex items-center justify-center
            h-10 w-10 rounded-lg
            hover:bg-slate-100 active:bg-slate-200
            transition focus:outline-none
          "
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5 text-slate-700" />
          ) : (
            <Menu className="h-5 w-5 text-slate-700" />
          )}
        </button>
      </header>

      {/* =========================================
          MOBILE MENU + OVERLAY
      ========================================= */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed left-0 right-0 bottom-0 bg-slate-900/40 backdrop-blur-[2px] z-30 lg:hidden"
            style={{ top: `calc(${NAVBAR_H} + 3.5rem)` }}
            onClick={closeSidebar}
          />

          <div
            className="
              fixed left-0 right-0
              bg-white border-b border-slate-200 shadow-2xl
              z-40 lg:hidden
            "
            style={{ top: `calc(${NAVBAR_H} + 3.5rem)` }}
          >
            <nav className="p-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {renderSection('Main Menu', mainNavItems, closeSidebar)}
              {renderSection('Content', contentNavItems, closeSidebar)}
              {renderSection('System', systemNavItems, closeSidebar)}

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl
                    text-sm font-medium text-rose-600 hover:bg-rose-50 transition
                  "
                >
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-100 text-rose-600">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* =========================================
          LAYOUT WRAPPER
      ========================================= */}
      <div className="lg:flex lg:items-start lg:min-h-[calc(100vh-4rem)]">
        {/* =========================================
            DESKTOP SIDEBAR
        ========================================= */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div
            className="sticky bg-white border-r border-slate-200 flex flex-col"
            style={{
              top: NAVBAR_H,
              height: `calc(100vh - ${NAVBAR_H})`,
            }}
          >
            {/* Brand */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    Owner Panel
                  </h1>
                  <p className="text-[11px] text-slate-500 leading-tight flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    Academy Manager
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 overflow-y-auto">
              {renderSection('Main Menu', mainNavItems)}
              {renderSection('Content', contentNavItems)}
              {renderSection('System', systemNavItems)}
            </nav>

            {/* User / Logout */}
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 mb-2">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Academy Owner
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Manage your academy
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl
                  text-sm font-medium text-rose-600 hover:bg-rose-50 transition
                "
              >
                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-100 text-rose-600">
                  <LogOut className="h-4 w-4" />
                </span>
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* =========================================
            MAIN CONTENT
        ========================================= */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}