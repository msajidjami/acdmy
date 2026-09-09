'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  School,
  Users,
  Mail,
  Settings,
  LogOut,
  User,
  BookOpen,
  CalendarIcon,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { name: 'My Academy', href: '/owner/academy', icon: School },
  { name: 'Teachers', href: '/owner/teachers', icon: Users },
  { name: 'Students', href: '/owner/students', icon: User },
  { name: 'Courses', href: '/owner/courses', icon: BookOpen },
  { name: 'Assignments', href: '/owner/assignments', icon: CalendarIcon },
  { name: 'Inquiries', href: '/owner/inquiries', icon: Mail },
  { name: 'Settings', href: '/owner/settings', icon: Settings },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      {/* =========================================
          MOBILE HEADER
      ========================================= */}
      <header
        className="
          fixed top-1 left-0 right-0 h-16
          bg-white border-b border-slate-200 shadow-sm
          z-[100] lg:hidden
          flex items-center justify-between px-4
        "
      >
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-700">🎓 Owner</span>
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
          MOBILE OVERLAY + DROPDOWN MENU
      ========================================= */}
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed top-16 left-0 right-0 bottom-0 bg-black/30 z-[80] lg:hidden"
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
            <nav className="p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                    <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
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
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-indigo-700">🎓 Owner Panel</h1>
          <p className="text-xs text-slate-500 mt-1">Manage your academy</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
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