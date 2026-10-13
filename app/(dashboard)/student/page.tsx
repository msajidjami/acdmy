import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import ChatListPage from '@/app/components/chat/ChatListPage';

export const dynamic = 'force-dynamic';

export default async function StudentHomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  try {
    const decoded: any = jwt.verify(token, secret);
    const role = String(decoded?.role || '');
    if (role !== 'student' && role !== 'admin') redirect('/');
  } catch {
    redirect('/login');
  }

  return (
    <ChatListPage
      title="Chats"
      accentColor="violet"
      profileHref="/profile"
      settingsHref="/student/settings"
      homeHref="/student/dashboard"
    />
  );
}