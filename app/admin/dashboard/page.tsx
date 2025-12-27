'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/app/components/AdminDashboard';
import { Shield, Lock, Loader2 } from 'lucide-react';

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
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-cache',
        });

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);

          const adminRoles = [
            'admin', 'owner', 'super-admin',
            'education-admin', 'darul-ifta-admin',
            'section1-admin', 'section2-admin'
          ];

          const userRole = data.user.role?.toLowerCase();

          if (userRole && adminRoles.includes(userRole)) {
            setIsAuthenticated(true);
            // محفوظ طریقے سے ADMIN_SECRET استعمال کریں (client پر نہیں بھیجیں!)
            // یہ صرف backend API calls میں استعمال ہو گا
            setAdminSecret('authenticated'); // بس flag کے طور پر
          } else {
            setTimeout(() => router.push('/'), 2000);
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">ایڈمن رسائی چیک ہو رہی ہے...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">رسائی ممنوع ہے</h2>
          <p className="text-gray-600 mb-6">
            آپ کے پاس ایڈمن ڈیش بورڈ تک رسائی نہیں ہے۔
          </p>
          <p className="text-sm text-gray-500 mb-2">
            <strong>رول:</strong> {user?.role || 'نامعلوم'}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            <strong>ای میل:</strong> {user?.email || 'لاگن نہیں'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              دوبارہ کوشش کریں
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              ہوم پر جائیں
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white py-6 px-4 md:px-8 shadow-lg">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">📊 ایڈمن ڈیش بورڈ</h1>
              <p className="mt-2 text-teal-100">
                خوش آمدید، <strong>{user?.name || user?.email}</strong>! 
                آپ کا رول: <span className="font-bold text-amber-300">{user?.role?.toUpperCase()}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center px-4 py-2 bg-white/20 rounded-xl">
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-semibold">{user?.role?.toUpperCase()}</span>
              </div>
              <button
                onClick={() => router.push('/')}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition"
              >
                ← ہوم پر واپس
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <AdminDashboard />
      </div>
    </div>
  );
}