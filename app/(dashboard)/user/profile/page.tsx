import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

async function getMe() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const secret = process.env.JWT_SECRET;
  if (!secret) redirect('/login');

  let decoded: any;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    redirect('/login');
  }
  if (!decoded?.userId) redirect('/login');

  await connectDB();

  const user: any = await User.findById(decoded.userId)
    .select('name email phone avatar role provider city country createdAt')
    .lean();

  if (!user) redirect('/login');

  return {
    id: String(user._id),
    name: String(user.name || ''),
    email: String(user.email || ''),
    phone: String(user.phone || ''),
    avatar: String(user.avatar || ''),
    role: String(user.role || 'user'),
    provider: String(user.provider || 'credentials'),
    city: String(user.city || ''),
    country: String(user.country || ''),
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  };
}

export default async function UserProfilePage() {
  const me = await getMe();

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-3xl mx-auto">
      <ProfileForm user={me} />
    </div>
  );
}