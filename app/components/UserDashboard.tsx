'use client';

import { useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface UserDashboardProps {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    isVerified?: boolean;
  };
}

export default function UserDashboard({ user = {} }: UserDashboardProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ✅ TypeScript safe - Manual logout function (useAuth سے ہٹا دیا)
  const handleLogout = () => {
    // Clear all possible auth cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to login
    window.location.href = '/login';
  };

  // Safe extraction with defaults
  const userName = (user?.name || 'User').trim();
  const userEmail = user?.email || '';
  const userRole = user?.role || 'user';
  const isVerified = user?.isVerified || false;
  const initial = userName.charAt(0).toUpperCase();

  // Show loading state if user data is minimal
  if (!user || Object.keys(user).length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {initial}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Welcome, {userName}!
            </h3>
            {userEmail && (
              <p className="text-slate-600">{userEmail}</p>
            )}
            <div className="flex items-center space-x-3 mt-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                {userRole === 'user' ? 'Student' : userRole}
              </span>
              {!isVerified && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  Not Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition"
          >
            Logout
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition">
            My Profile
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Confirm Logout
            </h3>
            <p className="text-slate-600 mb-8">
              Are you sure you want to logout from your account?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}  // ✅ Manual function استعمال
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
