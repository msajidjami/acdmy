// app/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import HomeContent from './components/HomeContent';
import UserDashboard from './components/UserDashboard';
import connectDB from '@/app/lib/dbConnect';
import Review from '@/app/models/Review';
import Admission from '@/app/models/Admission';
import Link from 'next/link';
import ClientChatWrapper from './components/ClientChatWrapper';

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  isVerified?: boolean;
  name?: string;
}

// ─── Data Fetching Functions ─────────────────────────────────────────────

async function getReviews() {
  try {
    await connectDB();
    const reviews = await Review.find({}).sort({ date: -1 }).limit(6).lean();
    return reviews.map((review: any) => ({
      ...review,
      _id: review._id.toString(),
      date: review.date?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    return [];
  }
}

async function getArticles() {
  try {
    await connectDB();
    const Article = require('@/app/models/Article').default;
    const articles = await Article.find({}).sort({ createdAt: -1 }).limit(6).lean();
    return articles.map((article: any) => ({
      ...article,
      _id: article._id.toString(),
      createdAt: article.createdAt?.toISOString() || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function getCounter() {
  try {
    await connectDB();
    const enrolledCount = await Admission.countDocuments({
      currentStatus: { $in: ['enrolled', 'in-progress', 'completed'] },
    });
    return { enrolled: enrolledCount || 450, completed: 1200, teachers: 35 };
  } catch (error) {
    return { enrolled: 450, completed: 1200, teachers: 35 };
  }
}

async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isVerified: decoded.isVerified || false,
      name: decoded.name || decoded.email.split('@')[0],
    };
  } catch {
    return null;
  }
}

// ─── Main Component ─────────────────────────────────────────────────────

export default async function Home() {
  const [reviews, counter, articles, session] = await Promise.all([
    getReviews(),
    getCounter(),
    getArticles(),
    getSession(),
  ]);

  const typedSession = session as SessionUser | null;
  const adminRoles = ['admin', 'owner', 'super-admin', 'education-admin'];
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

  const whatsappLink = `https://wa.me/923029151107?text=Hello! I am interested in your courses.`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-[9999] bg-slate-900 text-slate-100 rounded-xl p-4 text-xs shadow-2xl max-w-sm border border-slate-700 backdrop-blur-lg">
          <div className="font-bold text-teal-400 mb-1">🔧 System Status</div>
          <div>Authenticated: {typedSession ? 'Yes' : 'No'}</div>
          <div>Role: {typedSession?.role || 'Guest'}</div>
        </div>
      )}

      {/* User Dashboard */}
      {dashboardUser && !isAdmin && (
        <section className="py-6 bg-white border-b border-slate-200">
          <div className="container mx-auto px-6">
            <UserDashboard user={dashboardUser} />
          </div>
        </section>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-6 z-[9999] flex flex-col space-y-3 items-end">
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 transition-transform transform hover:-translate-y-1 text-sm"
          >
            <span>Management Console</span>
          </Link>
        )}

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-xl shadow-2xl font-bold flex items-center gap-2 transition-transform transform hover:-translate-y-1 text-sm"
        >
          <span>Direct WhatsApp Support</span>
        </a>

        {!typedSession ? (
          <Link
            href="/login"
            className="bg-white hover:bg-slate-100 text-slate-900 px-5 py-3 rounded-xl shadow-lg font-semibold border border-slate-200 text-sm"
          >
            <span>Student Portal Access</span>
          </Link>
        ) : (
          <a
            href="/api/auth/logout"
            className="bg-red-50 hover:bg-red-100 text-red-700 px-5 py-3 rounded-xl shadow-lg font-semibold border border-red-200 text-sm"
          >
            <span>Secure Logout</span>
          </a>
        )}
      </div>

      <main>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center text-teal-600 font-bold text-xl">
              Loading Experience...
            </div>
          }
        >
          <HomeContent reviews={reviews} counter={counter} articles={articles} />
        </Suspense>
      </main>

      {/* Chat Widget & Admin Chat Button */}
      <ClientChatWrapper isAdmin={isAdmin} />
    </div>
  );
}