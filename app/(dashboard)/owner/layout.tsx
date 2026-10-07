'use client';

import { useState, useEffect } from 'react';
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
  ClipboardList,
  ShieldAlert,
  MoreHorizontal,
} from 'lucide-react';

/* ============================================================
   FONT HELPERS
   ============================================================ */

const FONT_HEADING = {
  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
} as const;

const FONT_BODY = {
  fontFamily: 'var(--font-sora), Sora, sans-serif',
} as const;

const FONT_INHERIT = { fontFamily: 'inherit' } as const;

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
   NAVBAR HEIGHT (global top navbar)
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
  { name: 'Enrollments', href: '/owner/enrollments', icon: ClipboardList },
  { name: 'Articles', href: '/owner/articles', icon: FileText },
  { name: 'Student Payments', href: '/owner/payments', icon: Banknote },
  { name: 'Teacher Payouts', href: '/owner/teacher-payments', icon: Wallet },
];

const systemNavItems: NavItem[] = [
  { name: 'Class Transcripts', href: '/owner/transcripts', icon: ShieldAlert },
  { name: 'Messages', href: '/owner/messages', icon: MessageSquare },
  { name: 'Inquiries', href: '/owner/inquiries', icon: Inbox },
  { name: 'Billing', href: '/owner/billing', icon: Sparkles },
  { name: 'Settings', href: '/owner/settings', icon: Settings },
];

/* Bottom tab bar — 4 main + More */
const bottomTabs: NavItem[] = [
  { name: 'Home', href: '/owner/dashboard', icon: LayoutDashboard },
  { name: 'Academy', href: '/owner/academy', icon: School },
  { name: 'Teachers', href: '/owner/teachers', icon: Users },
  { name: 'Students', href: '/owner/students', icon: User },
];

/* ============================================================
   LAYOUT
   ============================================================ */

export default function OwnerLayout({ children }: OwnerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [ownerName, setOwnerName] = useState('Academy Owner');

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

  /* Fetch owner name */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/owner/profile', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        const name = d?.user?.name || d?.name;
        if (name) setOwnerName(String(name));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      /* ignore */
    }

    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

    router.push('/login');
    router.refresh();
  };

  /* ============================================================
     IS ACTIVE
     ============================================================ */
  const isActive = (href: string) => {
    if (href === '/owner/payments') {
      return (
        pathname === '/owner/payments' ||
        pathname.startsWith('/owner/payments/')
      );
    }
    if (href === '/owner/transcripts') {
      return (
        pathname === '/owner/transcripts' ||
        pathname.startsWith('/owner/transcripts/')
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /* ---------- Desktop Nav Item ---------- */
  const renderNavItem = (item: NavItem, onClick?: () => void) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const isTranscript = item.href === '/owner/transcripts';

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
              ? isTranscript
                ? 'bg-red-50 text-red-700 shadow-sm'
                : 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }
        `}
      >
        {active && (
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full ${
              isTranscript ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          />
        )}

        <span
          className={`
            flex items-center justify-center h-8 w-8 rounded-lg transition-colors
            ${
              active
                ? isTranscript
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
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

        {active && (
          <ChevronRight
            className={`h-4 w-4 ${
              isTranscript ? 'text-red-500' : 'text-emerald-500'
            }`}
          />
        )}
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

  /* ---------- Mobile Sheet Row ---------- */
  const renderSheetRow = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const isTranscript = item.href === '/owner/transcripts';

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`
          flex items-center gap-3 px-3 py-3 rounded-2xl
          text-sm font-medium transition-all
          ${
            active
              ? isTranscript
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
              : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
          }
        `}
      >
        <span
          className={`
            flex items-center justify-center h-10 w-10 rounded-xl
            ${
              active
                ? isTranscript
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
                : 'bg-slate-100 text-slate-500'
            }
          `}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="flex-1">{item.name}</span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </Link>
    );
  };

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ paddingTop: NAVBAR_H, ...FONT_BODY }}
    >
      {/* =========================================
          MOBILE HEADER (like WhatsApp top bar)
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
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p
              className="text-lg tracking-wider text-slate-900 leading-none"
              style={FONT_HEADING}
            >
              Owner Panel
            </p>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">
              {ownerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/owner/settings"
            className="
              flex items-center justify-center h-10 w-10 rounded-full
              hover:bg-slate-100 active:bg-slate-200 transition
            "
            aria-label="Settings"
          >
            <Settings className="h-5 w-5 text-slate-700" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            style={FONT_INHERIT}
            className="
              flex items-center justify-center h-10 w-10 rounded-full
              hover:bg-rose-50 active:bg-rose-100 transition
            "
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5 text-rose-600" />
          </button>
        </div>
      </header>

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
                  <h1
                    className="text-2xl tracking-wider text-slate-900 leading-none"
                    style={FONT_HEADING}
                  >
                    Owner Panel
                  </h1>
                  <p className="text-[11px] text-slate-500 leading-tight mt-1 flex items-center gap-1">
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
                    {ownerName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Manage your academy
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={FONT_INHERIT}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-8 pb-28 lg:pb-10">
            {children}
          </div>
        </main>
      </div>

      {/* =========================================
          MOBILE BOTTOM TAB BAR (WhatsApp / Zoom style)
      ========================================= */}
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
          {bottomTabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="
                  relative flex flex-col items-center justify-center gap-1
                  transition-colors
                "
              >
                <span
                  className={`
                    flex items-center justify-center h-8 w-12 rounded-full
                    transition-all
                    ${
                      active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-500'
                    }
                  `}
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

          {/* More button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            style={FONT_INHERIT}
            className="
              relative flex flex-col items-center justify-center gap-1
              transition-colors
            "
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

      {/* =========================================
          MOBILE "MORE" BOTTOM SHEET
      ========================================= */}
      {isMoreOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-50 animate-in fade-in duration-200"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="
              fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-3xl
              shadow-2xl
              animate-in slide-in-from-bottom duration-300
              max-h-[80vh] flex flex-col
            "
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="h-1.5 w-12 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 pt-2 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {ownerName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Academy Manager
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                style={FONT_INHERIT}
                className="
                  flex items-center justify-center h-9 w-9 rounded-full
                  bg-slate-100 hover:bg-slate-200 transition
                "
                aria-label="Close"
              >
                <X className="h-4 w-4 text-slate-700" />
              </button>
            </div>

            {/* Scroll content */}
            <div className="overflow-y-auto px-3 py-3">
              <p className="px-3 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Main Menu
              </p>
              <div className="space-y-1">
                {mainNavItems.map(renderSheetRow)}
              </div>

              <p className="px-3 pt-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Content
              </p>
              <div className="space-y-1">
                {contentNavItems.map(renderSheetRow)}
              </div>

              <p className="px-3 pt-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                System
              </p>
              <div className="space-y-1">
                {systemNavItems.map(renderSheetRow)}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  style={FONT_INHERIT}
                  className="
                    flex items-center gap-3 px-3 py-3 w-full rounded-2xl
                    text-sm font-medium text-rose-600 hover:bg-rose-50
                    active:bg-rose-100 transition
                  "
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
      )}
    </div>
  );
}