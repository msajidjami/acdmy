// app/components/AdminChatButton.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function AdminChatButton() {
  const { isAdmin } = useAuth(); // صرف isAdmin درکار ہے
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/admin/chat/unread', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/chat"
      className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 transition-transform transform hover:-translate-y-1 text-sm relative"
    >
      <span>💬 Messages</span>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}