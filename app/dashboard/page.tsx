// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import { fetchUserDashboardData } from '@/app/lib/data/userDashboardData';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type JwtPayload = { userId?: string };

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (!decoded?.userId) return null;

    await connectDB();
    const user = await User.findById(decoded.userId).select('_id').lean();
    if (!user) return null;

    return String((user as any)._id);
  } catch {
    return null;
  }
}

export const metadata = {
  title: 'My Dashboard',
  description: 'Manage your profile, inquiries, and messages.',
};

export default async function DashboardPage() {
  const userId = await getUserId();

  /* ✅ Login nahi → login page */
  if (!userId) {
    redirect('/login?redirect=/dashboard');
  }

  const data = await fetchUserDashboardData(userId);

  if (!data) {
    redirect('/login');
  }

  return <DashboardClient data={data} />;
}