// app/admin/messages/MessagesClient.tsx

'use client';

import { useState } from 'react';
import { Mail, Check, Clock, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesClient({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const markAsRead = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id, read: !currentStatus }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === id ? { ...msg, read: !currentStatus } : msg
          )
        );
        if (selectedMessage?._id === id) {
          setSelectedMessage({ ...selectedMessage, read: !currentStatus });
        }
      }
    } catch (error) {
      console.error('Error updating message:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
        if (selectedMessage?._id === id) setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Mail className="w-8 h-8 text-teal-600" />
            Inbox
            <span className="text-sm font-normal text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
              {messages.filter(m => !m.read).length} unread
            </span>
          </h1>
          <Link
            href="/admin/dashboard"
            className="text-sm text-teal-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No messages yet.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition ${!msg.read ? 'bg-teal-50/50' : ''
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {msg.name}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {msg.subject || 'No subject'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(msg.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!msg.read && (
                        <span className="w-2 h-2 bg-teal-600 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {selectedMessage ? (
              <div>
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {selectedMessage.subject || 'No Subject'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      From: {selectedMessage.name} ({selectedMessage.email})
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(selectedMessage.createdAt).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markAsRead(selectedMessage._id, selectedMessage.read)}
                      className={`p-2 rounded-lg transition ${selectedMessage.read
                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                        }`}
                      title={selectedMessage.read ? 'Mark as unread' : 'Mark as read'}
                      disabled={loading}
                    >
                      {selectedMessage.read ? <Clock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteMessage(selectedMessage._id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>Reply: {selectedMessage.email}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Mail className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a message to read</p>
                <p className="text-sm">Click on any message from the list</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}