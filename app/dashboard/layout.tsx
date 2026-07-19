'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/hooks/useAuth';

import DashboardNavbar from '@/app/components/dashboard/DashboardNavbar';
import DashboardSidebar from '@/app/components/dashboard/DashboardSidebar';

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { user, loading } = useAuth();

  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {

    if (!loading && !user) {

      router.replace('/login');

    }

  }, [loading, user, router]);

  if (loading) {

    return (

      <div className="flex items-center justify-center min-h-screen">

        Loading...

      </div>

    );

  }

  if (!user) return null;

  return (

    <div className="min-h-screen bg-gray-100 flex">

      {/* Desktop Sidebar */}

      <div className="hidden lg:block">

        <DashboardSidebar />

      </div>

      {/* Mobile Sidebar */}

      {sidebarOpen && (

        <div className="fixed inset-0 z-50 flex">

          <div className="w-72 bg-white shadow-xl">

            <DashboardSidebar />

          </div>

          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />

        </div>

      )}

      {/* Main */}

      <div className="flex-1 flex flex-col min-w-0">

        <DashboardNavbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto">

          {children}

        </main>

      </div>

    </div>

  );
}