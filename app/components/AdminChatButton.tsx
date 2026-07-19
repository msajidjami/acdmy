'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider';

export default function AdminChatButton() {
  const { user, isAdmin, loading } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/admin/chat/unread', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) return;

        const data = await res.json();

        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Unread Count Error:', error);
      }
    };

    fetchUnread();

    const interval = setInterval(fetchUnread, 30000);

    return () => clearInterval(interval);
  }, [loading, user, isAdmin]);

  if (loading) return null;

  if (!user || !isAdmin) return null;

  return (
    <Link
      href="/admin/chat"
      className="relative flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-teal-700"
    >
      <span className="text-lg">💬</span>

      <span>Support Chat</span>

      {unreadCount > 0 && (
        <span
          className="
            absolute
            -top-2
            -right-2
            flex
            h-6
            w-6
            items-center
            justify-center
            rounded-full
            bg-red-600
            text-xs
            font-bold
            text-white
          "
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}