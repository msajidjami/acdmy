'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  LayoutDashboard,
  Users,
  School,
  Mail,
  Settings,
  LogOut,
  UserCog,
  PlusCircle,
  Menu,
  X,
  Shield,
  ChevronRight,
  Sparkles,
  Receipt,
  Crown,
  Palette,
  BrainCircuit,
  MoreHorizontal,
  MessageCircle,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

/* ============================================================
   TYPES
============================================================ */

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'rose' | 'amber' | 'emerald' | 'indigo';
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

/* ============================================================
   CONSTANTS
============================================================ */

const TOP_BAR_HEIGHT = '4rem';

/* ============================================================
   NAVIGATION
============================================================ */

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Academies', href: '/admin/academies', icon: School },
  { name: 'Inquiries', href: '/admin/inquiries', icon: Mail },
];

const aiDesignNavItems: NavItem[] = [
  {
    name: 'AI Advertisement Studio',
    href: '/ai-studio',
    icon: Palette,
    badge: 'AI',
    badgeColor: 'indigo',
  },
  {
    name: 'AI Design Training',
    href: '/admin/ai-design-training',
    icon: BrainCircuit,
    badge: 'New',
    badgeColor: 'emerald',
  },
];

const paymentNavItems: NavItem[] = [
  {
    name: 'Payment Proofs',
    href: '/admin/payment-proofs',
    icon: Receipt,
    badge: 'New',
    badgeColor: 'amber',
  },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: Crown },
];

const systemNavItems: NavItem[] = [
  { name: 'Create Academy', href: '/owner/academy', icon: PlusCircle },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

/* ✅ Mobile bottom tabs */
const mobileTabs: NavItem[] = [
  { name: 'Home', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Academies', href: '/admin/academies', icon: School },
  { name: 'Messages', href: '/admin/messages', icon: MessageCircle },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  /* Close sheets on route change */
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMoreOpen(false);
  }, [pathname]);

  /* Lock body scroll when sheet is open */
  useEffect(() => {
    if (isMoreOpen || isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMoreOpen, isSidebarOpen]);

  /* Escape closes sheets */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; secure';
    setIsSidebarOpen(false);
    setIsMoreOpen(false);
    router.replace('/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return (
        pathname === '/admin/dashboard' ||
        pathname === '/admin' ||
        pathname === '/admin/'
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const badgeColorMap: Record<NonNullable<NavItem['badgeColor']>, string> = {
    rose: 'bg-rose-100 text-rose-600',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };

  /* ==========================================================
     NAV ITEM
  ========================================================== */

  const renderNavItem = (item: NavItem, onClick?: () => void) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={`
          group relative flex items-center gap-3
          px-3.5 py-2.5 rounded-xl
          text-sm font-medium
          transition-all duration-200
          ${
            active
              ? 'bg-gradient-to-r from-indigo-50 to-indigo-50/40 text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-indigo-600 rounded-r-full" />
        )}

        <span
          className={`
            flex items-center justify-center
            h-8 w-8 rounded-lg
            transition-all duration-200
            ${
              active
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-600'
            }
          `}
        >
          <Icon className="h-4 w-4" />
        </span>

        <span className="flex-1 truncate">{item.name}</span>

        {item.badge && (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
              badgeColorMap[item.badgeColor || 'rose']
            }`}
          >
            {item.badge}
          </span>
        )}

        {active && <ChevronRight className="h-4 w-4 text-indigo-500 shrink-0" />}
      </Link>
    );
  };

  const renderSection = (
    label: string,
    items: NavItem[],
    onClick?: () => void
  ) => {
    return (
      <div className="mb-2">
        <p className="px-3 pt-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <div className="space-y-1">
          {items.map((item) => renderNavItem(item, onClick))}
        </div>
      </div>
    );
  };

  const renderNavigation = (onClick?: () => void) => {
    return (
      <>
        {renderSection('Main Menu', mainNavItems, onClick)}
        {renderSection('AI Studio', aiDesignNavItems, onClick)}
        {renderSection('Payments', paymentNavItems, onClick)}
        {renderSection('System', systemNavItems, onClick)}
      </>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-slate-50" style={{ paddingTop: TOP_BAR_HEIGHT }}>
      {/* ======================================================
          MOBILE HEADER — WhatsApp style (green)
      ====================================================== */}
      <header
        className="
          fixed left-0 right-0 z-50 lg:hidden
          bg-emerald-600 text-white
          shadow-sm
          flex items-center justify-between px-3
        "
        style={{
          top: TOP_BAR_HEIGHT,
          height: '3.25rem',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              Admin Panel
            </p>
            <p className="text-[10px] opacity-85 leading-tight">Control Center</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="p-1.5 rounded-full hover:bg-emerald-700 transition"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ======================================================
          MOBILE DRAWER (full menu)
      ====================================================== */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed top-0 left-0 bottom-0 z-[70] lg:hidden w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 leading-tight">
                    Admin Panel
                  </h1>
                  <p className="text-[10px] text-slate-500 leading-tight flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-500" />
                    Control Center
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 overflow-y-auto">
              {renderNavigation(() => setIsSidebarOpen(false))}
            </nav>

            {/* User + Logout */}
            <div className="p-3 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 mb-2">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <UserCog className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Administrator
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Full access
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-100 text-rose-600">
                  <LogOut className="h-4 w-4" />
                </span>
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* ======================================================
          DESKTOP + MAIN LAYOUT
      ====================================================== */}
      <div className="lg:flex lg:items-start lg:min-h-[calc(100vh-4rem)]">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div
            className="sticky bg-white border-r border-slate-200 flex flex-col"
            style={{
              top: TOP_BAR_HEIGHT,
              height: `calc(100vh - ${TOP_BAR_HEIGHT})`,
            }}
          >
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    Admin Panel
                  </h1>
                  <p className="text-[11px] text-slate-500 leading-tight flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-500" />
                    Control Center
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto">{renderNavigation()}</nav>

            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 mb-2">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <UserCog className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    Administrator
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Full access
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-100 text-rose-600">
                  <LogOut className="h-4 w-4" />
                </span>
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-16 lg:pt-8 pb-24 lg:pb-10">
            {children}
          </div>
        </main>
      </div>

      {/* ======================================================
          MOBILE BOTTOM TAB BAR
      ====================================================== */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-40 lg:hidden
          bg-white/98 backdrop-blur-md
          border-t border-slate-200
          shadow-[0_-4px_20px_-8px_rgba(15,23,42,0.15)]
        "
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 h-16">
          {mobileTabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <span
                  className={`relative flex items-center justify-center h-8 w-12 rounded-full transition-all ${
                    active ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`text-[10px] font-medium leading-none ${
                    active ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1 transition-colors"
            aria-label="More"
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

      {/* ======================================================
          MOBILE "MORE" BOTTOM SHEET
      ====================================================== */}
      <div
        className={`lg:hidden fixed inset-0 z-[80] transition-opacity duration-300 ${
          isMoreOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMoreOpen}
      >
        <div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          onClick={() => setIsMoreOpen(false)}
        />

        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col transition-transform duration-300 ease-out ${
            isMoreOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <div className="h-1.5 w-12 rounded-full bg-slate-300" />
          </div>

          <div className="px-4 pb-3 pt-2 flex items-center justify-between border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <UserCog className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  Administrator
                </p>
                <p className="text-[11px] text-slate-500">Full access</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-slate-700" />
            </button>
          </div>

          <div className="overflow-y-auto px-3 py-3">
            <p className="px-3 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              All sections
            </p>
            <div className="space-y-0.5">
              {renderNavigation(() => setIsMoreOpen(false))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-rose-100 text-rose-600">
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