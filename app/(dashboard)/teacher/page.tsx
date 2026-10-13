import { redirect } from 'next/navigation';

import ChatListPage from '@/app/components/chat/ChatListPage';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const dynamic = 'force-dynamic';

export default async function TeacherHomePage() {
  const me = await getUserFromToken();
  if (!me) redirect('/login');

  return (
    <ChatListPage
      title="Chats"
      accentColor="sky"
      profileHref="/profile"
      settingsHref="/teacher/settings"
      homeHref="/teacher/dashboard"
    />
  );
}