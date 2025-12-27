'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/app/components/AdminDashboard';
import { Shield, Lock, Loader } from 'lucide-react';

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  isVerified?: boolean;
  name?: string;
  isTempAdmin?: boolean;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (data.success && data.user) {
          setUser(data.user);
          
          // Check admin roles
          const adminRoles = [
            'admin', 'owner', 'super-admin',
            'education-admin', 'darul-ifta-admin', 
            'section1-admin', 'section2-admin'
          ];
          
          if (adminRoles.includes(data.user.role)) {
            setIsAuthenticated(true);
            // You can use a fixed secret or fetch from API
            setAdminSecret(process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret');
          } else {
            router.push('/');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white py-6 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold">📊 Admin Dashboard</h1>
              <p className="text-teal-100 mt-2">
                Welcome back, <span className="font-semibold">{user?.name || user?.email}</span>! 
                You have <span className="font-bold text-amber-300">{user?.role}</span> access.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-medium">{user?.role.toUpperCase()}</span>
              </div>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 md:px-8 py-8">
        <AdminDashboard adminSecret={adminSecret} />
      </div>
    </div>
  );
}