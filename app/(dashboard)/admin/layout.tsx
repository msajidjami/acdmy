'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

// Define the shape of navigation items
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Academies', href: '/admin/academies', icon: School },
  { name: 'Create Academy', href: '/owner/academy', icon: PlusCircle },
  { name: 'Inquiries', href: '/admin/inquiries', icon: Mail },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen mt-30 bg-slate-50">
      {/* =========================================
          MOBILE HEADER
      ========================================= */}
      <header
        className="
          fixed top-[1px] left-0 right-0 h-16
          bg-white border-b border-slate-200 shadow-sm
          z-[100] lg:hidden
          flex items-center justify-between px-4
        "
      >
        <div className="flex items-center  gap-2">
          <UserCog className="h-6 w-6 text-indigo-600" />
          <span className="text-xl font-bold text-indigo-700">Admin</span>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="
            flex items-center justify-center
            h-10 w-10 rounded-lg
            hover:bg-slate-100 active:bg-slate-200
            transition focus:outline-none
          "
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6 text-slate-700" />
          ) : (
            <Menu className="h-6 w-6 text-slate-700" />
          )}
        </button>
      </header>

      {/* =========================================
          MOBILE MENU + OVERLAY
      ========================================= */}
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="
              fixed top-16 left-0 right-0 bottom-0
              bg-black/30 z-[80] lg:hidden
            "
            onClick={closeSidebar}
          />
          {/* Dropdown Menu */}
          <div
            className="
              fixed top-16 left-0 right-0
              bg-white border-b border-slate-200 shadow-xl
              z-[90] lg:hidden
            "
          >
            <nav
              className="
                p-4 space-y-2
                max-h-[calc(100vh-4rem)] overflow-y-auto
              "
            >
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      text-sm font-medium transition
                      ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : 'text-slate-600 hover:bg-slate-100'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        h-5 w-5
                        ${isActive ? 'text-indigo-600' : 'text-slate-400'}
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex items-center gap-3 px-4 py-3 w-full rounded-xl
                  text-sm font-medium text-red-600 hover:bg-red-50 transition
                "
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </nav>
          </div>
        </>
      )}

      {/* =========================================
          DESKTOP SIDEBAR
      ========================================= */}
      <aside
        className="
          hidden lg:flex fixed top-0 left-0 bottom-0 w-72
          bg-white border-r border-slate-200 flex-col z-50
        "
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            Admin Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage everything from here
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  text-sm font-medium transition
                  ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                <Icon
                  className={`
                    h-5 w-5
                    ${isActive ? 'text-indigo-600' : 'text-slate-400'}
                  `}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="
              flex items-center gap-3 px-4 py-3 w-full rounded-xl
              text-sm font-medium text-red-600 hover:bg-red-50 transition
            "
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* =========================================
          MAIN CONTENT
      ========================================= */}
      <main
        className="
          min-h-screen w-full bg-slate-50/50
          pt-20 px-4 sm:px-6
          lg:ml-72 lg:pt-8 lg:px-8
        "
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}