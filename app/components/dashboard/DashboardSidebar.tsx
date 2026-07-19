'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Brain,
  Library,
  CreditCard,
  Award,
  Settings,
  LogOut,
} from 'lucide-react';

import { useAuth } from '@/app/hooks/useAuth';

const menus = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'My Courses',
    icon: BookOpen,
    href: '/dashboard/my-courses',
  },
  {
    title: 'Classes',
    icon: CalendarDays,
    href: '/dashboard/classes',
  },
  {
    title: 'Homework',
    icon: GraduationCap,
    href: '/dashboard/homework',
  },
  {
    title: 'Islamic AI',
    icon: Brain,
    href: '/dashboard/ai',
  },
  {
    title: 'Library',
    icon: Library,
    href: '/dashboard/library',
  },
  {
    title: 'Payments',
    icon: CreditCard,
    href: '/dashboard/payments',
  },
  {
    title: 'Certificates',
    icon: Award,
    href: '/dashboard/certificates',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  const { logout } = useAuth();

  return (
    <aside className="w-72 bg-white border-r hidden lg:flex flex-col">

      <div className="h-20 flex items-center justify-center border-b">

        <h2 className="font-bold text-2xl text-green-700">

          Quran Academy

        </h2>

      </div>

      <nav className="flex-1 p-5">

        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-2 transition

              ${
                pathname === menu.href
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-green-50'
              }`}
            >
              <Icon size={20} />

              {menu.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t">

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600"
        >
          <LogOut size={20} />

          Logout

        </button>

      </div>
    </aside>
  );
}