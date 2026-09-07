'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  School,
  Users,
  Mail,
  UserPlus,
  Settings,
  LogOut,
  User,
  BookOpen,
  CalendarIcon, // ✅ Assignments کے لیے نیا آئیکن
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { name: 'My Academy', href: '/owner/academy', icon: School },
  { name: 'Teachers', href: '/owner/teachers', icon: Users },
  { name: 'Students', href: '/owner/students', icon: User },
  { name: 'Courses', href: '/owner/courses', icon: BookOpen },
  { name: 'Assignments', href: '/owner/assignments', icon: CalendarIcon }, // ✅ نیا آپشن
  { name: 'Inquiries', href: '/owner/inquiries', icon: Mail },
  { name: 'Settings', href: '/owner/settings', icon: Settings },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-indigo-700">🎓 Owner Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={() => {
              document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 text-red-600 hover:bg-red-50 w-full p-3 rounded-xl"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}