'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Menu,
  X,
  Mail,
  Compass,
  LayoutDashboard,
  ChevronDown,
  School,
  GraduationCap,
  Users,
  CheckCircle2,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useUserDashboards } from '../hooks/useUserDashboards';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const POLL_INTERVAL = 30000;

/* رنگ کی مشترکہ map */
const COLOR_MAP: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  admin: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-600' },
  owner: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: 'text-emerald-600',
  },
  teacher: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    icon: 'text-sky-600',
  },
  student: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    icon: 'text-violet-600',
  },
  user: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    icon: 'text-slate-600',
  },
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  owner: School,
  teacher: GraduationCap,
  student: Users,
  user: User,
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [dashOpen, setDashOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  /* Dashboards list */
  const { dashboards } = useUserDashboards(Boolean(user));

  /* موجودہ dashboard detect کریں (URL سے) */
  const currentDashboard = dashboards.find((d) =>
    pathname?.startsWith(d.href.split('/').slice(0, 2).join('/'))
  );

  /* ---------- Close dropdowns on outside click ---------- */
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
      if (
        dashRef.current &&
        !dashRef.current.contains(event.target as Node)
      ) {
        setDashOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  /* ---------- Admin unread count ---------- */
  const fetchUnreadCount = useCallback(async () => {
    if (!isAdmin) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/messages/count`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(Number(data.unreadCount ?? 0));
      } else {
        setUnreadCount(0);
      }
    } catch {
      setUnreadCount(0);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setUnreadCount(null);
      return;
    }
    void fetchUnreadCount();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchUnreadCount();
    }, POLL_INTERVAL);

    const onVis = () => {
      if (document.visibilityState === 'visible') void fetchUnreadCount();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [isAdmin, fetchUnreadCount]);

  /* ---------- Logout ---------- */
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    if (logout) await logout();
    router.push('/login');
    router.refresh();
  }, [logout, router]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: null },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/courses', label: 'Courses', icon: null },
    { href: '/blog', label: 'Blog', icon: null },
    { href: '/about', label: 'About', icon: null },
    { href: '/contact', label: 'Contact', icon: null },
  ];

  const showDashboardSwitcher = Boolean(user) && dashboards.length > 1;

  return (
    <nav className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-sm z-50 border-b border-slate-200">
      <div className="container mx-auto px-3 sm:px-4 py-1 sm:py-1.5 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center hover:opacity-90 transition-opacity min-w-0 shrink-0"
          aria-label="ilmora786 — Home"
        >
          <Image
            src="/logo.png"
            alt="ilmora786 — Online Academy Hub"
            width={200}
            height={50}
            priority
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-5 xl:gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-teal-700 font-medium text-sm transition-all duration-200 hover:scale-105 inline-flex items-center gap-1.5"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {link.label}
              </Link>
            );
          })}

          {/* ============================================
              ✅ Dashboards Switcher — multiple roles
              ============================================ */}
          {showDashboardSwitcher && (
            <div className="relative" ref={dashRef}>
              <button
                type="button"
                onClick={() => setDashOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white text-xs font-semibold hover:shadow-lg transition-all"
                aria-haspopup="menu"
                aria-expanded={dashOpen}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="max-w-[140px] truncate">
                  {currentDashboard?.label || 'Dashboards'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    dashOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dashOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Your dashboards ({dashboards.length})
                    </p>
                  </div>

                  {dashboards.map((d) => {
                    const c = COLOR_MAP[d.id] || COLOR_MAP.user;
                    const Icon = ICONS[d.id] || User;
                    const isActive = currentDashboard?.id === d.id;

                    return (
                      <Link
                        key={d.id}
                        href={d.href}
                        onClick={() => setDashOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 last:border-0 transition ${
                          isActive
                            ? c.bg
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}
                        >
                          <Icon className={`h-4 w-4 ${c.icon}`} />
                        </div>
                        <span
                          className={`flex-1 text-sm font-semibold truncate ${
                            isActive ? c.text : 'text-slate-800'
                          }`}
                        >
                          {d.label}
                        </span>
                        {isActive && (
                          <CheckCircle2
                            className={`h-4 w-4 ${c.icon} shrink-0`}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Admin messages */}
          {isAdmin && (
            <Link
              href="/admin/messages"
              className="text-slate-700 hover:text-teal-700 font-medium text-sm transition-all duration-200 inline-flex items-center gap-1.5 relative"
            >
              <Mail className="w-4 h-4" />
              Messages
              {unreadCount !== null && unreadCount > 0 && (
                <span className="absolute -top-2 -right-5 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User / Logout */}
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                {isAdmin ? (
                  <Shield className="w-4 h-4 text-amber-600" />
                ) : (
                  <User className="w-4 h-4 text-teal-600" />
                )}
                <span className="text-teal-700 font-medium text-xs max-w-[120px] truncate">
                  {user.name || user.email?.split('@')[0] || 'User'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3.5 py-1 rounded-lg font-medium hover:shadow-lg transition-all text-xs active:scale-95"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-4 py-1.5 rounded-lg font-semibold hover:shadow-lg transition-all text-xs"
            >
              Login / Signup
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden text-slate-700 hover:text-teal-700 transition p-1.5 rounded-lg hover:bg-slate-100"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* ============================================
          MOBILE MENU
          ============================================ */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-lg shadow-2xl border-t border-slate-200 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="container mx-auto px-4 py-3 space-y-1">
            {/* Dashboards section (mobile) */}
            {showDashboardSwitcher && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <LayoutDashboard className="w-4 h-4 text-teal-600" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Your dashboards ({dashboards.length})
                  </p>
                </div>

                {dashboards.map((d) => {
                  const c = COLOR_MAP[d.id] || COLOR_MAP.user;
                  const Icon = ICONS[d.id] || User;
                  const isActive = currentDashboard?.id === d.id;

                  return (
                    <Link
                      key={d.id}
                      href={d.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                        isActive
                          ? c.bg
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`h-4 w-4 ${c.icon}`} />
                      </div>
                      <span
                        className={`flex-1 text-sm font-semibold truncate ${
                          isActive ? c.text : 'text-slate-800'
                        }`}
                      >
                        {d.label}
                      </span>
                      {isActive && (
                        <CheckCircle2
                          className={`h-4 w-4 ${c.icon} shrink-0`}
                        />
                      )}
                    </Link>
                  );
                })}

                <div className="pt-2 border-b border-slate-100" />
              </>
            )}

            {/* Normal nav links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 font-medium text-base py-2.5 px-3 rounded-xl border-b border-slate-100 transition"
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {link.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin/messages"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 font-medium text-base py-2.5 px-3 rounded-xl border-b border-slate-100 transition"
              >
                <Mail className="w-5 h-5" />
                Messages
                {unreadCount !== null && unreadCount > 0 && (
                  <span className="ml-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User / Logout */}
            <div className="pt-3">
              {loading ? (
                <div className="flex items-center gap-2 py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent" />
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                    {isAdmin ? (
                      <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <User className="w-5 h-5 text-teal-600 shrink-0" />
                    )}
                    <span className="text-teal-700 font-medium truncate flex-1 text-sm">
                      {user.name || user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleLogout();
                      closeMobileMenu();
                    }}
                    className="block w-full text-center bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block w-full text-center bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-xl transition-all active:scale-95 text-sm"
                >
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}