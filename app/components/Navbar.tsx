// app/components/Navbar.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  User,
  Shield,
  Menu,
  X,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function Navbar() {
  const router = useRouter();

  // 🔧 FIX: Use the correct property name from your AuthContext.
  // If your context uses 'loading' instead of 'isLoading', change here.
  const { user, isAdmin, logout } = useAuth();

  // Fallback loading state: if 'useAuth' does not provide a loading flag,
  // we assume loading is true until the user object is defined.
  // You can also add a 'loading' property from the context if available.
  const isLoading = false; // Replace this with actual loading state from context if available.

  // If your context provides a 'loading' property, use it like this:
  // const { user, isAdmin, logout, loading: isLoading } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch unread message count (only if admin)
  const fetchUnreadCount = async () => {
    if (!isAdmin) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch('/api/admin/messages/count', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  // Poll for unread count when admin
  useEffect(() => {
    if (isAdmin) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(null);
    }
  }, [isAdmin]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg z-50 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent">
            Quran & Islamic Academy
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          <Link
            href="/"
            className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105"
          >
            Home
          </Link>
          <Link
            href="/courses"
            className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105"
          >
            Courses
          </Link>
          <Link
            href="/articles"
            className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105"
          >
            Articles
          </Link>
          <Link
            href="/about"
            className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105"
          >
            Contact
          </Link>

          {/* Admin Messages Link with Badge */}
          {isAdmin && (
            <Link
              href="/admin/messages"
              className="text-slate-700 hover:text-teal-700 font-medium text-lg transition-all duration-300 hover:scale-105 flex items-center gap-1 relative"
            >
              <Mail className="w-5 h-5" />
              Messages
              {unreadCount !== null && unreadCount > 0 && (
                <span className="absolute -top-2 -right-5 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User Section - Desktop */}
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
              <span className="text-slate-600">Loading...</span>
            </div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                {isAdmin ? (
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                ) : (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                )}
                <span className="text-teal-700 font-medium text-sm sm:text-base">
                  {user.name || user.email?.split('@')[0] || 'User'}
                </span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-xl font-medium hover:shadow-lg transition-all text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-4 py-2 sm:px-8 sm:py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base"
            >
              Login / Signup
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden text-slate-700 text-2xl hover:text-teal-700 transition p-2"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg border-t border-slate-200 z-40"
        >
          <div className="container mx-auto px-4 py-6 space-y-4">
            <Link
              href="/"
              className="block text-slate-700 hover:text-teal-700 font-medium text-lg py-3 border-b border-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/courses"
              className="block text-slate-700 hover:text-teal-700 font-medium text-lg py-3 border-b border-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Courses
            </Link>
            <Link
              href="/articles"
              className="block text-slate-700 hover:text-teal-700 font-medium text-lg py-3 border-b border-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Articles
            </Link>
            <Link
              href="/about"
              className="block text-slate-700 hover:text-teal-700 font-medium text-lg py-3 border-b border-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block text-slate-700 hover:text-teal-700 font-medium text-lg py-3 border-b border-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {/* Admin Messages Link - Mobile with Badge */}
            {isAdmin && (
              <Link
                href="/admin/messages"
                className="block text-slate-700 hover:text-teal-700 font-medium text-lg py-3 border-b border-slate-100 flex items-center gap-2 relative"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Mail className="w-5 h-5" />
                Messages
                {unreadCount !== null && unreadCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Section - Mobile */}
            {isLoading ? (
              <div className="flex items-center space-x-2 py-3 border-b border-slate-100">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                <span className="text-slate-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="space-y-4 py-4 border-b border-slate-100">
                <div className="flex items-center space-x-3 px-3 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                  {isAdmin ? (
                    <Shield className="w-5 h-5 text-amber-600" />
                  ) : (
                    <User className="w-5 h-5 text-teal-600" />
                  )}
                  <span className="text-teal-700 font-medium">
                    {user.name || user.email?.split('@')[0] || 'User'}
                  </span>
                  {isAdmin && (
                    <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded">
                      ADMIN
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-center bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block w-full text-center bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login / Signup
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}