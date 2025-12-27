'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/app/components/AdminDashboard';
import { Shield, Lock, Loader2, AlertCircle } from 'lucide-react';

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  isVerified?: boolean;
  name?: string;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      setError(null);
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Session API Response:', data);

      if (data.success && data.user) {
        const userRole = data.user.role?.toLowerCase();

        const adminRoles = [
          'admin', 'owner', 'super-admin',
          'education-admin', 'darul-ifta-admin',
          'section1-admin', 'section2-admin'
        ];

        if (userRole && adminRoles.includes(userRole)) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setError('آپ کے پاس ایڈمن تک رسائی کا اختیار نہیں ہے۔');
          setTimeout(() => router.push('/'), 3000);
        }
      } else {
        setError(data.error || 'لاگن نہیں ہے۔');
        router.push('/login');
      }
    } catch (error: any) {
      console.error('ایڈمن رسائی چیک کرنے میں ایرر:', error);
      setError('سرور سے رابطہ نہیں ہو سکا۔');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [router]);

  // لوڈنگ اسٹیٹ
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">ایڈمن رسائی کی تصدیق ہو رہی ہے...</p>
          <p className="text-sm text-gray-500 mt-2">براہ مہربانی انتظار کریں</p>
        </div>
      </div>
    );
  }

  // ایرر اسٹیٹ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-2xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ایرر</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              دوبارہ کوشش کریں
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
            >
              لاگن کریں
            </button>
          </div>
        </div>
      </div>
    );
  }

  // رسائی ممنوع
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-2xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">رسائی ممنوع ہے</h2>
          <p className="text-gray-600 mb-6">
            آپ کے پاس ایڈمن ڈیش بورڈ تک رسائی کا اختیار نہیں ہے۔
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-right">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">موجودہ رول:</span> {user?.role || 'نامعلوم'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-semibold">ای میل:</span> {user?.email || 'لاگن نہیں'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              دوبارہ کوشش کریں
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
            >
              ہوم پیج پر جائیں
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ایڈمن ڈیش بورڈ
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ہیڈر */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white py-8 px-6 shadow-xl">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">📊 ایڈمن ڈیش بورڈ</h1>
              <p className="text-teal-100 text-lg">
                خوش آمدید، <strong>{user?.name || user?.email.split('@')[0]}</strong>! 
                آپ کا رول: <span className="font-bold text-amber-300">{user?.role?.toUpperCase()}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center px-5 py-3 bg-white/20 backdrop-blur rounded-xl">
                <Shield className="w-6 h-6 ml-3" />
                <span className="font-semibold text-lg">{user?.role?.toUpperCase()}</span>
              </div>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2">
                ← ہوم پر واپس
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* مین ڈیش بورڈ کمپوننٹ */}
      <div className="container mx-auto px-6 py-10">
        <AdminDashboard />
      </div>
    </div>
  );
}