import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

import SettingsView from './SettingsView';

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
    .select('name email phone avatar role provider privacy notifications')
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
    privacy: {
      allowMessagesFrom:
        (user?.privacy?.allowMessagesFrom as 'everyone' | 'contacts' | 'nobody') ||
        'contacts',
      discoverable:
        typeof user?.privacy?.discoverable === 'boolean'
          ? user.privacy.discoverable
          : true,
      blockedCount: Array.isArray(user?.privacy?.blockedUsers)
        ? user.privacy.blockedUsers.length
        : 0,
    },
    notifications: {
      email:
        typeof user?.notifications?.email === 'boolean'
          ? user.notifications.email
          : true,
      sms:
        typeof user?.notifications?.sms === 'boolean'
          ? user.notifications.sms
          : false,
      marketing:
        typeof user?.notifications?.marketing === 'boolean'
          ? user.notifications.marketing
          : false,
    },
  };
}

export default async function UserSettingsPage() {
  const me = await getMe();

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-3xl mx-auto">
      <SettingsView me={me} />
    </div>
  );
}