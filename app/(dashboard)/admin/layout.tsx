'use client';

import { useState } from 'react';
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
const MOBILE_HEADER_HEIGHT = '3.5rem';

/* ============================================================
   MAIN NAVIGATION
============================================================ */

const mainNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Academies',
    href: '/admin/academies',
    icon: School,
  },
  {
    name: 'Inquiries',
    href: '/admin/inquiries',
    icon: Mail,
  },
];

/* ============================================================
   AI DESIGN NAVIGATION
============================================================ */

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

/* ============================================================
   PAYMENT NAVIGATION
============================================================ */

const paymentNavItems: NavItem[] = [
  {
    name: 'Payment Proofs',
    href: '/admin/payment-proofs',
    icon: Receipt,
    badge: 'New',
    badgeColor: 'amber',
  },
  {
    name: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: Crown,
  },
];

/* ============================================================
   SYSTEM NAVIGATION
============================================================ */

const systemNavItems: NavItem[] = [
  {
    name: 'Create Academy',
    href: '/owner/academy',
    icon: PlusCircle,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ==========================================================
     SIDEBAR
  ========================================================== */

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = () => {
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';

    // اگر secure cookie بھی موجود ہو
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; secure';

    closeSidebar();

    router.replace('/login');
  };

  /* ==========================================================
     ACTIVE ROUTE
  ========================================================== */

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  /* ==========================================================
     BADGE COLORS
  ========================================================== */

  const badgeColorMap: Record<
    NonNullable<NavItem['badgeColor']>,
    string
  > = {
    rose: 'bg-rose-100 text-rose-600',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };

  /* ==========================================================
     NAV ITEM
  ========================================================== */

  const renderNavItem = (
    item: NavItem,
    onClick?: () => void
  ) => {
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
        {/* Active indicator */}

        {active && (
          <span
            className="
              absolute left-0 top-1/2
              -translate-y-1/2
              h-6 w-1
              bg-indigo-600
              rounded-r-full
            "
          />
        )}

        {/* Icon */}

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

        {/* Name */}

        <span className="flex-1 truncate">
          {item.name}
        </span>

        {/* Badge */}

        {item.badge && (
          <span
            className={`
              px-1.5 py-0.5
              text-[10px]
              font-bold
              rounded-full
              ${badgeColorMap[item.badgeColor || 'rose']}
            `}
          >
            {item.badge}
          </span>
        )}

        {/* Arrow */}

        {active && (
          <ChevronRight
            className="
              h-4 w-4
              text-indigo-500
              shrink-0
            "
          />
        )}
      </Link>
    );
  };

  /* ==========================================================
     SECTION
  ========================================================== */

  const renderSection = (
    label: string,
    items: NavItem[],
    onClick?: () => void
  ) => {
    return (
      <div className="mb-2">
        <p
          className="
            px-3
            pt-4
            pb-2
            text-[10px]
            font-bold
            text-slate-400
            uppercase
            tracking-wider
          "
        >
          {label}
        </p>

        <div className="space-y-1">
          {items.map((item) =>
            renderNavItem(item, onClick)
          )}
        </div>
      </div>
    );
  };

  /* ==========================================================
     NAVIGATION CONTENT
  ========================================================== */

  const renderNavigation = (onClick?: () => void) => {
    return (
      <>
        {renderSection(
          'Main Menu',
          mainNavItems,
          onClick
        )}

        {renderSection(
          'AI Studio',
          aiDesignNavItems,
          onClick
        )}

        {renderSection(
          'Payments',
          paymentNavItems,
          onClick
        )}

        {renderSection(
          'System',
          systemNavItems,
          onClick
        )}
      </>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div
      className="
        min-h-screen
        bg-slate-50
      "
      style={{
        paddingTop: TOP_BAR_HEIGHT,
      }}
    >
      {/* ======================================================
          MOBILE HEADER
      ====================================================== */}

      <header
        className="
          fixed
          left-0
          right-0
          z-50
          lg:hidden

          bg-white/95
          backdrop-blur-md

          border-b
          border-slate-200

          flex
          items-center
          justify-between

          px-4
        "
        style={{
          top: TOP_BAR_HEIGHT,
          height: MOBILE_HEADER_HEIGHT,
        }}
      >
        {/* Brand */}

        <div className="flex items-center gap-2.5">
          <div
            className="
              h-8
              w-8
              rounded-lg
              bg-gradient-to-br
              from-indigo-500
              to-purple-600
              flex
              items-center
              justify-center
              shadow-md
              shadow-indigo-500/20
            "
          >
            <Shield className="h-4 w-4 text-white" />
          </div>

          <div>
            <p
              className="
                text-sm
                font-bold
                text-slate-900
                leading-tight
              "
            >
              Admin Panel
            </p>

            <p
              className="
                text-[10px]
                text-slate-500
                leading-tight
              "
            >
              Control Center
            </p>
          </div>
        </div>

        {/* Menu Button */}

        <button
          type="button"
          onClick={toggleSidebar}
          className="
            flex
            items-center
            justify-center

            h-10
            w-10

            rounded-lg

            hover:bg-slate-100
            active:bg-slate-200

            transition

            focus:outline-none
            focus:ring-2
            focus:ring-indigo-500/30
          "
          aria-label={
            isSidebarOpen
              ? 'Close menu'
              : 'Open menu'
          }
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5 text-slate-700" />
          ) : (
            <Menu className="h-5 w-5 text-slate-700" />
          )}
        </button>
      </header>

      {/* ======================================================
          MOBILE MENU OVERLAY
      ====================================================== */}

      {isSidebarOpen && (
        <>
          {/* Overlay */}

          <button
            type="button"
            aria-label="Close menu"
            onClick={closeSidebar}
            className="
              fixed
              left-0
              right-0
              bottom-0
              z-40

              bg-slate-900/40
              backdrop-blur-[2px]

              lg:hidden

              cursor-default
            "
            style={{
              top: `calc(${TOP_BAR_HEIGHT} + ${MOBILE_HEADER_HEIGHT})`,
            }}
          />

          {/* Menu */}

          <div
            className="
              fixed
              left-0
              right-0

              bg-white

              border-b
              border-slate-200

              shadow-2xl

              z-50

              lg:hidden
            "
            style={{
              top: `calc(${TOP_BAR_HEIGHT} + ${MOBILE_HEADER_HEIGHT})`,
            }}
          >
            <nav
              className="
                p-3
                max-h-[calc(100vh-8rem)]
                overflow-y-auto
              "
            >
              {renderNavigation(closeSidebar)}

              {/* Mobile Logout */}

              <div
                className="
                  mt-4
                  pt-3
                  border-t
                  border-slate-100
                "
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    flex
                    items-center
                    gap-3

                    px-3.5
                    py-2.5

                    w-full

                    rounded-xl

                    text-sm
                    font-medium

                    text-rose-600

                    hover:bg-rose-50

                    transition
                  "
                >
                  <span
                    className="
                      flex
                      items-center
                      justify-center

                      h-8
                      w-8

                      rounded-lg

                      bg-rose-100
                      text-rose-600
                    "
                  >
                    <LogOut className="h-4 w-4" />
                  </span>

                  Logout
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* ======================================================
          DESKTOP + MAIN LAYOUT
      ====================================================== */}

      <div
        className="
          lg:flex
          lg:items-start
          lg:min-h-[calc(100vh-4rem)]
        "
      >
        {/* ====================================================
            DESKTOP SIDEBAR
        ==================================================== */}

        <aside
          className="
            hidden
            lg:block

            w-72
            shrink-0
          "
        >
          <div
            className="
              sticky

              bg-white

              border-r
              border-slate-200

              flex
              flex-col
            "
            style={{
              top: TOP_BAR_HEIGHT,
              height: `calc(100vh - ${TOP_BAR_HEIGHT})`,
            }}
          >
            {/* =================================================
                BRAND
            ================================================= */}

            <div
              className="
                p-5
                border-b
                border-slate-100
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    h-11
                    w-11
                    rounded-xl

                    bg-gradient-to-br
                    from-indigo-500
                    to-purple-600

                    flex
                    items-center
                    justify-center

                    shadow-lg
                    shadow-indigo-500/25
                  "
                >
                  <Shield className="h-5 w-5 text-white" />
                </div>

                <div className="min-w-0">
                  <h1
                    className="
                      text-base
                      font-bold
                      text-slate-900
                      leading-tight
                    "
                  >
                    Admin Panel
                  </h1>

                  <p
                    className="
                      text-[11px]
                      text-slate-500
                      leading-tight

                      flex
                      items-center
                      gap-1
                    "
                  >
                    <Sparkles
                      className="
                        h-3
                        w-3
                        text-indigo-500
                      "
                    />

                    Control Center
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <nav
              className="
                flex-1
                p-3
                overflow-y-auto
              "
            >
              {renderNavigation()}
            </nav>

            {/* =================================================
                ADMIN USER / LOGOUT
            ================================================= */}

            <div
              className="
                p-3
                border-t
                border-slate-100
              "
            >
              {/* User */}

              <div
                className="
                  flex
                  items-center
                  gap-3

                  p-2.5

                  rounded-xl

                  bg-slate-50

                  mb-2
                "
              >
                <div
                  className="
                    h-9
                    w-9
                    rounded-full

                    bg-gradient-to-br
                    from-indigo-500
                    to-purple-600

                    flex
                    items-center
                    justify-center

                    text-white

                    shadow-md
                  "
                >
                  <UserCog className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-slate-900
                      truncate
                    "
                  >
                    Administrator
                  </p>

                  <p
                    className="
                      text-[11px]
                      text-slate-500
                      truncate
                    "
                  >
                    Full access
                  </p>
                </div>
              </div>

              {/* Logout */}

              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex
                  items-center
                  gap-3

                  px-3.5
                  py-2.5

                  w-full

                  rounded-xl

                  text-sm
                  font-medium

                  text-rose-600

                  hover:bg-rose-50

                  transition
                "
              >
                <span
                  className="
                    flex
                    items-center
                    justify-center

                    h-8
                    w-8

                    rounded-lg

                    bg-rose-100
                    text-rose-600
                  "
                >
                  <LogOut className="h-4 w-4" />
                </span>

                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* ====================================================
            MAIN CONTENT
        ==================================================== */}

        <main
          className="
            flex-1
            min-w-0
          "
        >
          <div
            className="
              max-w-7xl
              mx-auto

              px-4
              sm:px-6
              lg:px-8

              pt-20
              lg:pt-8

              pb-10
            "
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}