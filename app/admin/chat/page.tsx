'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  message: string;
  createdAt: string;
  isAdmin: boolean;
  userName?: string;
}

interface ChatUser {
  name: string;
  email: string;
  messages: ChatMessage[];
}

export default function AdminChatPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }

      if (!isAdmin) {
        router.replace('/');
      }
    }
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllChats();
    }
  }, [user, isAdmin]);

  const fetchAllChats = async () => {
    try {
      const res = await fetch('/api/admin/chat/users');

      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const markAsRead = async (email: string) => {
    try {
      await fetch('/api/admin/chat/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: email,
        }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUserSelect = (email: string) => {
    setSelectedEmail(email);
    markAsRead(email);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reply.trim() || !selectedEmail) return;

    setSending(true);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: selectedEmail,
          userName: 'Support',
          message: reply,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setReply('');
        await fetchAllChats();
        await markAsRead(selectedEmail);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const selectedUser = users.find(
    (u) => u.email === selectedEmail
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          Admin Support Chat
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Users */}

          <div className="bg-white rounded-xl shadow p-5">

            <h2 className="font-bold mb-4">
              Users
            </h2>

            <div className="space-y-3">

              {users.map((u) => (

                <button
                  key={u.email}
                  onClick={() => handleUserSelect(u.email)}
                  className={`w-full text-left rounded-xl p-4 transition

                  ${
                    selectedEmail === u.email
                      ? 'bg-green-100 border border-green-500'
                      : 'hover:bg-gray-100'
                  }
                  `}
                >

                  <h3 className="font-semibold">
                    {u.name || 'Guest'}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {u.email}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {u.messages.length} Messages
                  </p>

                </button>

              ))}

            </div>

          </div>

          {/* Conversation */}

          <div className="lg:col-span-2 bg-white rounded-xl shadow flex flex-col">

            {selectedUser ? (
              <>

                <div className="border-b p-5">

                  <h2 className="font-bold text-xl">
                    {selectedUser.name}
                  </h2>

                  <p className="text-gray-500">
                    {selectedUser.email}
                  </p>

                </div>

                <div className="flex-1 p-6 space-y-4 overflow-y-auto h-[500px]">

                  {selectedUser.messages.map((msg, index) => (

                    <div
                      key={index}
                      className={`flex

                      ${
                        msg.isAdmin
                          ? 'justify-end'
                          : 'justify-start'
                      }
                      `}
                    >

                      <div
                        className={`rounded-xl px-4 py-3 max-w-lg

                        ${
                          msg.isAdmin
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100'
                        }
                        `}
                      >

                        <p className="font-semibold text-xs mb-2">

                          {msg.isAdmin
                            ? 'Support'
                            : msg.userName || 'User'}

                        </p>

                        <p>
                          {msg.message}
                        </p>

                        <p className="text-xs mt-2 opacity-70">

                          {new Date(
                            msg.createdAt
                          ).toLocaleString()}

                        </p>

                      </div>

                    </div>

                  ))}

                </div>

                <form
                  onSubmit={sendReply}
                  className="border-t p-5 flex gap-3"
                >

                  <input
                    value={reply}
                    onChange={(e) =>
                      setReply(e.target.value)
                    }
                    placeholder="Type reply..."
                    className="flex-1 border rounded-xl px-4 py-3 outline-none"
                  />

                  <button
                    type="submit"
                    disabled={sending}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl"
                  >

                    {sending ? 'Sending...' : 'Send'}

                  </button>

                </form>

              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">

                Select a user to start chatting.

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}