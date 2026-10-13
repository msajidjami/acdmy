import { redirect } from 'next/navigation';
import ChatListPage from '@/app/components/chat/ChatListPage';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const dynamic = 'force-dynamic';

export default async function UserChatsPage() {
  const me = await getUserFromToken();
  if (!me) redirect('/login');

  return (
    <ChatListPage
      title="Chats"
      accentColor="violet"
      profileHref="/user/profile"
      settingsHref="/user/settings"
      homeHref="/user/dashboard"
    />
  );
}