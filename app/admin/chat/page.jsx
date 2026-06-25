'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminChatPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/login');
    }
  }, [isLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllChats();
    }
  }, [isAdmin]);

  const fetchAllChats = async () => {
    try {
      const res = await fetch('/api/admin/chat/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const markAsRead = async (email) => {
    try {
      await fetch('/api/admin/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email }),
      });
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const handleUserSelect = (email) => {
    setSelectedEmail(email);
    markAsRead(email);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedEmail) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Chat Support</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-slate-700 mb-4">Users</h2>
            <ul className="space-y-2">
              {users.map((u) => (
                <li
                  key={u.email}
                  onClick={() => handleUserSelect(u.email)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedEmail === u.email ? 'bg-teal-100' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="font-medium">{u.name || 'Guest'}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                  <div className="text-xs text-slate-400">{u.messages.length} messages</div>
                </li>
              ))}
              {users.length === 0 && <div className="text-slate-500 text-sm">No users yet.</div>}
            </ul>
          </div>

          {/* Conversation */}
          <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
            {selectedEmail ? (
              <>
                <h3 className="font-semibold text-slate-700 mb-4">Conversation with {selectedEmail}</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                  {users
                    .find((u) => u.email === selectedEmail)
                    ?.messages.map((msg, idx) => (
                      <div key={idx}>
                        {msg.isAdmin ? (
                          // ایڈمن کا اپنا جواب – دائیں جانب، ٹیل رنگ
                          <div className="flex flex-col items-end">
                            <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-teal-600 text-white">
                              <div className="font-medium text-xs mb-1">Support</div>
                              <div>{msg.message}</div>
                              <div className="text-[10px] opacity-70 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // صارف کا پیغام – بائیں جانب، ہلکا سرمئی
                          <div className="flex flex-col items-start">
                            <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-gray-100 text-slate-800">
                              <div className="font-medium text-xs mb-1">{msg.userName || 'User'}</div>
                              <div>{msg.message}</div>
                              <div className="text-[10px] opacity-70 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                <form onSubmit={sendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !reply.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-4 py-2 rounded-lg transition"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center text-slate-500 py-12">
                Select a user to view conversation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}