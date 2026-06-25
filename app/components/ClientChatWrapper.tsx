'use client';

import dynamic from 'next/dynamic';
import ChatWidget from './ChatWidget'; // ✅ براہِ راست import

// صرف AdminChatButton کو dynamic رکھیں
const AdminChatButton = dynamic(() => import('./AdminChatButton'), {
  ssr: false,
  loading: () => null,
});

export default function ClientChatWrapper({ isAdmin }: { isAdmin: boolean }) {
  return (
    <>
      {isAdmin && <AdminChatButton />}
      <ChatWidget /> {/* یہ ہمیشہ رینڈر ہوگا */}
    </>
  );
}