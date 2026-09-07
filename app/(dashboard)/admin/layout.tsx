'use client';
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
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Academies', href: '/admin/academies', icon: School },
  { name: 'Create Academy', href: '/owner/academy', icon: PlusCircle },
  { name: 'Inquiries', href: '/admin/inquiries', icon: Mail },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
            <UserCog className="h-6 w-6" /> Admin Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage everything from here</p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}