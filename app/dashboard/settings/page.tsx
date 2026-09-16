// app/dashboard/settings/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Account Settings',
  description: 'Manage your profile, password, and preferences.',
};

type JwtPayload = { userId?: string };

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (!decoded?.userId) return null;

    await connectDB();
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();

    if (!user) return null;

    return {
      id: String((user as any)._id),
      name: String((user as any).name || ''),
      email: String((user as any).email || ''),
      phone: String((user as any).phone || ''),
      avatar: String((user as any).avatar || ''),
      role: String((user as any).role || 'user'),
      country: String((user as any).country || ''),
      city: String((user as any).city || ''),
      createdAt: (user as any).createdAt
        ? new Date((user as any).createdAt).toISOString()
        : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/settings');
  }

  return <SettingsClient user={user} />;
}