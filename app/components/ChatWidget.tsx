// app/components/ChatWidget.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

const COURSES = [
  'Quran & Tajweed Mastery',
  'Islamic Studies & Seerah',
  'Quran Hifz Program',
  'Tafseer & Quranic Exegesis',
  'Arabic Language & Grammar',
  'Fiqh & Islamic Jurisprudence',
  'Advanced Mathematics',
  'Physics & Chemistry',
  'Biology & Pre-Medical',
  'English Language & Literature',
];

// ✅ Safe useAuth – fallback if context missing
let useAuth: any;
try {
  // Dynamic require to avoid build issues if AuthContext is missing
  const authModule = require('@/app/context/AuthContext');
  useAuth = authModule.useAuth;
} catch {
  useAuth = () => ({ user: null });
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEmailSet, setIsEmailSet] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Load email from user or localStorage
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setName(user.name || 'User');
      setIsEmailSet(true);
    } else {
      const savedEmail = localStorage.getItem('chat_email');
      const savedName = localStorage.getItem('chat_name');
      if (savedEmail) {
        setEmail(savedEmail);
        setName(savedName || 'Guest');
        setIsEmailSet(true);
      }
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!email || isOpen) return;
    try {
      const res = await fetch(`/api/chat/unread?email=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
    } catch (error) {
      // Ignore
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!email) return;
    try {
      const res = await fetch(`/api/chat/messages?email=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        if (isOpen) {
          await markMessagesAsRead();
        } else {
          await fetchUnreadCount();
        }
      }
    } catch (error) {
      // Ignore
    }
  };

  // Mark messages as read by user
  const markMessagesAsRead = async () => {
    if (!email) return;
    try {
      await fetch('/api/chat/mark-read-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email }),
      });
      setUnreadCount(0);
    } catch (error) {
      // Ignore
    }
  };

  // Polling
  useEffect(() => {
    if (isEmailSet && email) {
      fetchMessages();
      pollInterval.current = setInterval(fetchMessages, 5000);
      return () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
      };
    }
  }, [isEmailSet, email, isOpen]);

  // Mark read when chat opens
  useEffect(() => {
    if (isOpen && email) {
      markMessagesAsRead();
    }
  }, [isOpen, email]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email, userName: name || 'Guest', message }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data.success) {
        setMessage('');
        await fetchMessages();
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle email submission
  const handleSetEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    localStorage.setItem('chat_email', email.trim());
    localStorage.setItem('chat_name', name.trim() || 'Guest');
    setIsEmailSet(true);
  };

  const handleCourseClick = (course: string) => {
    setMessage(`I'd like to know more about the "${course}" course.`);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[99999] bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 relative"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[99999] w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-teal-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-semibold">Live Chat Support</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
            {!isEmailSet ? (
              <form onSubmit={handleSetEmail} className="space-y-3">
                <p className="text-sm text-slate-600">Please enter your email to start chatting with our support team.</p>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition"
                >
                  Start Chat
                </button>
              </form>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-4">
                    No messages yet. Start a conversation below!
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    {msg.isAdmin ? (
                      <div className="flex flex-col items-start">
                        <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-gray-100 text-slate-800">
                          <div className="font-medium text-xs mb-1">Support</div>
                          <div>{msg.message}</div>
                          <div className="text-[10px] opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-teal-600 text-white">
                          <div className="font-medium text-xs mb-1">You</div>
                          <div>{msg.message}</div>
                          <div className="text-[10px] opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Course suggestions */}
          {isEmailSet && (
            <div className="px-4 py-2 border-t border-slate-200 bg-white overflow-x-auto flex gap-2">
              {COURSES.slice(0, 5).map((course) => (
                <button
                  key={course}
                  onClick={() => handleCourseClick(course)}
                  className="flex-shrink-0 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition"
                >
                  {course}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {isEmailSet && (
            <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-4 py-2 rounded-lg transition"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}