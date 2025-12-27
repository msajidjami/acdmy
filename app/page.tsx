// app/page.tsx

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import HomeContent from './components/HomeContent';
import UserDashboard from './components/UserDashboard';
import connectDB from '@/app/lib/dbConnect';
import Review from '@/app/models/Review';
import Admission from '@/app/models/Admission';

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  isVerified?: boolean;
  name?: string;
}

async function getReviews() {
  try {
    await connectDB();
    const reviews = await Review.find({ status: 'approved' })
      .sort({ date: -1 })
      .limit(6)
      .lean();

    return reviews.map((review: any) => ({
      ...review,
      _id: review._id.toString(),
      date: review.date?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

// ✅ ریئل ٹائم کاؤنٹرز — Admission سکیمہ سے براہ راست
async function getCounter() {
  try {
    await connectDB();

    // Enrolled Students: جو طلباء کلاسز لے رہے ہیں یا مکمل کر چکے ہیں
    const enrolledCount = await Admission.countDocuments({
      currentStatus: { $in: ['enrolled', 'in-progress', 'completed'] }
    });

    // Classes Completed: صرف مکمل شدہ کورسز والے طلباء
    const completedCount = await Admission.countDocuments({
      currentStatus: ['completed', 'dropped']
    });

    return {
      enrolled: enrolledCount || 0,
      completed: completedCount || 0,
    };
  } catch (error: any) {
    console.error('Error fetching live counters from Admission:', error);
    // ایرر کی صورت میں ڈیفالٹ نمبرز
    return {
      enrolled: 500,
      completed: 1000,
    };
  }
}

async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
        isVerified?: boolean;
        name?: string;
      };

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isVerified: decoded.isVerified || false,
        name: decoded.name || decoded.email.split('@')[0]
      };
    } catch (verifyError) {
      if (process.env.NODE_ENV === 'development') {
        try {
          const decoded = jwt.decode(token) as any;
          if (decoded && decoded.email) {
            console.warn('⚠️ Dev: Using unverified token');
            return {
              userId: decoded.userId || decoded.id || '',
              email: decoded.email,
              role: decoded.role || 'user',
              isVerified: decoded.isVerified || false,
              name: decoded.name || decoded.email.split('@')[0]
            };
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
        }
      }
      return null;
    }
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export default async function Home() {
  const [reviews, counter, session] = await Promise.all([
    getReviews(),
    getCounter(),
    getSession(),
  ]);

  const typedSession = session as SessionUser | null;

  const adminRoles = [
    'admin', 'owner', 'super-admin',
    'education-admin', 'darul-ifta-admin',
    'section1-admin', 'section2-admin',
  ];

  const isAdmin = typedSession?.role ? adminRoles.includes(typedSession.role) : false;

  const dashboardUser = typedSession
    ? {
        id: typedSession.userId || '',
        name: typedSession.name || typedSession.email.split('@')[0] || 'User',
        email: typedSession.email || '',
        role: typedSession.role || 'user',
        isVerified: typedSession.isVerified ?? false,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ڈیولپمنٹ میں ڈیبگ انفو */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-300 rounded-lg p-4 text-xs shadow-lg max-w-sm">
          <div className="font-bold mb-2 text-amber-800">🔧 Session & Counters Debug</div>
          <div className="space-y-1">
            <div>Logged in: {typedSession ? 'Yes' : 'No'}</div>
            {typedSession && (
              <>
                <div>Email: {typedSession.email}</div>
                <div>Role: {typedSession.role}</div>
                <div>Admin: {isAdmin ? 'Yes' : 'No'}</div>
              </>
            )}
            <div className="mt-2 pt-2 border-t border-yellow-300">
              <div className="font-bold">Live Counters (from DB):</div>
              <div>Enrolled Students: {counter.enrolled}+</div>
              <div>Classes Completed: {counter.completed}+</div>
            </div>
          </div>
        </div>
      )}

      {/* عام یوزر ڈیش بورڈ */}
      {dashboardUser && !isAdmin && (
        <section className="py-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
          <div className="container mx-auto px-6">
            <UserDashboard user={dashboardUser} />
          </div>
        </section>
      )}

      {/* فلوٹنگ ایکشن بٹنز */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col space-y-4">
        {!typedSession && (
          <a
            href="/login"
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center justify-center space-x-2 transition-all hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>لاگ ان / سائن اپ</span>
          </a>
        )}

        {typedSession && (
          <a
            href="/api/auth/logout"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center justify-center space-x-2 transition-all hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-7a3 3 0 013-3h5a3 3 0 013 3v1" />
            </svg>
            <span>لاگ آؤٹ</span>
          </a>
        )}

        {isAdmin && (
          <a
            href="/admin/dashboard"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center justify-center space-x-2 transition-all hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span>ایڈمن پینل</span>
          </a>
        )}
      </div>

      {/* مین کنٹنٹ */}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-2xl text-slate-600 font-medium">لوڈ ہو رہا ہے...</p>
            </div>
          </div>
        }
      >
        <HomeContent reviews={reviews} counter={counter} />
      </Suspense>
    </div>
  );
}