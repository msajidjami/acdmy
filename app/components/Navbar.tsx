'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  User,
  Shield,
  Menu,
  X,
  Mail,
  Compass,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const POLL_INTERVAL = 30000; // 30 seconds

/* ============================================================
   NAVBAR
   ============================================================ */

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  /* ============================================================
     CLOSE MOBILE MENU ON OUTSIDE CLICK
     ============================================================ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* ============================================================
     FETCH UNREAD COUNT (useCallback)
     ============================================================ */

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

  /* ============================================================
     POLLING — صرف admin کے لیے، اور tab visible ہونے پر
     ============================================================ */

  useEffect(() => {
    if (!isAdmin) {
      setUnreadCount(null);
      return;
    }

    void fetchUnreadCount();

    const interval = setInterval(() => {
      // صرف visible tab پر polling
      if (document.visibilityState === 'visible') {
        void fetchUnreadCount();
      }
    }, POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAdmin, fetchUnreadCount]);

  /* ============================================================
     LOGOUT
     ============================================================ */

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }

    // ✅ صرف token cookie صاف کریں (باقی cookies محفوظ رہیں)
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

    if (logout) await logout();

    router.push('/login');
    router.refresh();
  }, [logout, router]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  /* ============================================================
     NAV LINKS DATA
     ============================================================ */

  const navLinks = [
    { href: '/', label: 'Home', icon: null },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/courses', label: 'Courses', icon: null },
    { href: '/blog', label: 'Blog', icon: null },
    { href: '/about', label: 'About', icon: null },
    { href: '/contact', label: 'Contact', icon: null },
  ];

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg z-50 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">

        {/* ============================================
            LOGO
        ============================================ */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity min-w-0"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent truncate">
            ilmora786
          </h1>
        </Link>

        {/* ============================================
            DESKTOP NAV
        ============================================ */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">

          {/* Links */}
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-teal-700 font-medium text-base transition-all duration-300 hover:scale-105 inline-flex items-center gap-1.5"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {link.label}
              </Link>
            );
          })}

          {/* Admin Messages Link */}
          {isAdmin && (
            <Link
              href="/admin/messages"
              className="text-slate-700 hover:text-teal-700 font-medium text-base transition-all duration-300 hover:scale-105 inline-flex items-center gap-1.5 relative"
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

          {/* User Section */}
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent" />
              <span className="text-slate-600 text-sm">Loading...</span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                {isAdmin ? (
                  <Shield className="w-4 h-4 text-amber-600" />
                ) : (
                  <User className="w-4 h-4 text-teal-600" />
                )}
                <span className="text-teal-700 font-medium text-sm max-w-[120px] truncate">
                  {user.name || user.email?.split('@')[0] || 'User'}
                </span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-red-500 text-white px-5 py-1.5 rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all text-sm active:scale-95"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300 transform hover:-translate-y-0.5 text-sm"
            >
              Login / Signup
            </Link>
          )}
        </div>

        {/* ============================================
            MOBILE MENU BUTTON
        ============================================ */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden text-slate-700 hover:text-teal-700 transition p-2 rounded-lg hover:bg-slate-100"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
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
          <div className="container mx-auto px-4 py-4 space-y-1">

            {/* Nav Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 font-medium text-base py-3 px-3 rounded-xl border-b border-slate-100 transition"
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {link.label}
                </Link>
              );
            })}

            {/* Admin Messages */}
            {isAdmin && (
              <Link
                href="/admin/messages"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 font-medium text-base py-3 px-3 rounded-xl border-b border-slate-100 transition"
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

            {/* User Section */}
            <div className="pt-4">
              {loading ? (
                <div className="flex items-center gap-2 py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent" />
                  <span className="text-slate-600 text-sm">Loading...</span>
                </div>
              ) : user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                    {isAdmin ? (
                      <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <User className="w-5 h-5 text-teal-600 shrink-0" />
                    )}
                    <span className="text-teal-700 font-medium truncate flex-1">
                      {user.name || user.email?.split('@')[0] || 'User'}
                    </span>
                    {isAdmin && (
                      <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded uppercase tracking-wider shrink-0">
                        Admin
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleLogout();
                      closeMobileMenu();
                    }}
                    className="block w-full text-center bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block w-full text-center bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all active:scale-95"
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