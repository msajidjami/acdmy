'use client';

import { ReactNode, useState } from 'react';

import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  user?: {
    name?: string;
    role?: string;
  };
}

export default function AdminLayout({
  children,
  title,
  user,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="lg:ml-72">

        {/* Header */}
        <AdminHeader
          title={title}
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}