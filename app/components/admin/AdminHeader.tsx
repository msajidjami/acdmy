'use client';

import { Menu, Bell, Search } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick: () => void;
  title?: string;
  user?: {
    name?: string;
    role?: string;
  };
}

export default function AdminHeader({
  onMenuClick,
  title = 'Dashboard',
  user,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-20 bg-white border-b border-gray-200 shadow-sm">

      <div className="h-full flex items-center justify-between px-6">

        {/* Left */}
        <div className="flex items-center gap-4">

          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>

          <div>

            <h1 className="text-2xl font-bold text-gray-900">
              {title}
            </h1>

            <p className="text-sm text-gray-500">
              Academy Management System
            </p>

          </div>

        </div>

        {/* Search */}
        <div className="hidden md:flex items-center relative w-96">

          <Search
            size={18}
            className="absolute left-4 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-full border rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
          />

        </div>

        {/* Right */}
        <div className="flex items-center gap-5">

          {/* Notification */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100">

            <Bell size={22} />

            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
              3
            </span>

          </button>

          {/* User */}
          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>

            <div className="hidden sm:block">

              <h3 className="font-semibold text-gray-900">
                {user?.name || 'Administrator'}
              </h3>

              <p className="text-sm text-gray-500 capitalize">
                {user?.role || 'Admin'}
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}