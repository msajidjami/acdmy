'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/app/hooks/useAuth';
import AdminLayout from '@/app/components/admin/AdminLayout';

interface Props {
  children: ReactNode;
}

const ADMIN_ROLES = [
  'owner',
  'super-admin',
  'admin',
  'education-admin',
  'darul-ifta-admin',
  'section1-admin',
  'section2-admin',
];

export default function Layout({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">

          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />

          <h2 className="text-xl font-semibold">
            Loading Admin Panel...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait...
          </p>

        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">

        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">

          <h1 className="text-3xl font-bold text-red-600">
            Access Denied
          </h1>

          <p className="text-gray-500 mt-3">
            You don't have permission to access this page.
          </p>

        </div>

      </div>
    );
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      user={{
        name: user.name,
        role: user.role,
      }}
    >
      {children}
    </AdminLayout>
  );
}