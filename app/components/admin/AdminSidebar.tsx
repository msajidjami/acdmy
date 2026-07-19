'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Teachers',
    href: '/admin/teachers',
    icon: Users,
  },
  {
    title: 'Students',
    href: '/admin/students',
    icon: GraduationCap,
  },
  {
    title: 'Courses',
    href: '/admin/courses',
    icon: BookOpen,
  },
  {
    title: 'Attendance',
    href: '/admin/attendance',
    icon: ClipboardList,
  },
  {
    title: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminSidebar({
  open,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen w-72
          bg-slate-900 text-white
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-700">

          <div>
            <h1 className="text-2xl font-bold text-emerald-400">
              Academy
            </h1>

            <p className="text-xs text-slate-400">
              Admin Panel
            </p>
          </div>

          <button
            className="lg:hidden"
            onClick={onClose}
          >
            <X size={22} />
          </button>

        </div>

        {/* Menu */}
        <nav className="mt-6 px-3 space-y-2">

          {menuItems.map((item) => {

            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3
                  px-4 py-3 rounded-xl
                  transition-all
                  ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }
                `}
              >
                <Icon size={20} />

                <span className="font-medium">
                  {item.title}
                </span>
              </Link>
            );
          })}

        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-700">

          <button
            className="
              w-full
              flex items-center gap-3
              px-4 py-3
              rounded-xl
              bg-red-600
              hover:bg-red-700
              transition
            "
          >
            <LogOut size={20} />

            Logout
          </button>

        </div>
      </aside>
    </>
  );
}