'use client';

import { useState } from 'react';
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  User,
  BookOpen,
  CreditCard,
  Menu,
} from 'lucide-react';

import { useAuth } from '@/app/hooks/useAuth';

interface Props {
  onMenuClick?: () => void;
}

export default function DashboardNavbar({ onMenuClick }: Props) {
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between">

      {/* Left */}

      <div className="flex items-center gap-4">

        <button
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>

        <div className="relative hidden md:block">

          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search courses..."
            className="w-80 rounded-xl border pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-green-600"
          />

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-5">

        <button className="relative">

          <Bell className="text-gray-600" />

          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>

        </button>

        <div className="relative">

          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3"
          >

            <img
              src={user?.avatar || '/avatar.png'}
              alt="avatar"
              className="w-11 h-11 rounded-full border object-cover"
            />

            <div className="hidden md:block text-left">

              <p className="font-semibold">

                {user?.name}

              </p>

              <p className="text-xs text-gray-500">

                {user?.accountType === 'parent'
                  ? 'Parent'
                  : 'Student'}

              </p>

            </div>

            <ChevronDown size={18} />

          </button>

          {open && (

            <div className="absolute right-0 mt-3 w-64 rounded-xl border bg-white shadow-xl overflow-hidden">

              <div className="px-5 py-4 border-b">

                <p className="font-semibold">

                  {user?.name}

                </p>

                <p className="text-sm text-gray-500">

                  {user?.email}

                </p>

              </div>

              <button className="flex items-center gap-3 w-full px-5 py-3 hover:bg-gray-50">

                <User size={18} />

                My Profile

              </button>

              <button className="flex items-center gap-3 w-full px-5 py-3 hover:bg-gray-50">

                <BookOpen size={18} />

                My Courses

              </button>

              <button className="flex items-center gap-3 w-full px-5 py-3 hover:bg-gray-50">

                <CreditCard size={18} />

                Payments

              </button>

              <button className="flex items-center gap-3 w-full px-5 py-3 hover:bg-gray-50">

                <Settings size={18} />

                Settings

              </button>

              <hr />

              <button
                onClick={logout}
                className="flex items-center gap-3 text-red-600 w-full px-5 py-3 hover:bg-red-50"
              >

                <LogOut size={18} />

                Logout

              </button>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}