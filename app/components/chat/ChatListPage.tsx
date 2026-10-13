'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  PhoneIcon,
  BookmarkIcon,
  PlusIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useAuth } from '@/app/hooks/useAuth';

/* ============================================================
   Types
   ============================================================ */

type SavedContact = {
  _id: string;
  type: 'platform' | 'email' | 'phone';
  nickname: string;
  name: string;
  email?: string;
  phone?: string;
  isFavorite: boolean;
  isSaved: boolean;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar: string;
    isOnline?: boolean;
    lastSeen?: string | null;
  } | null;
};

type Props = {
  title: string;
  accentColor?: 'emerald' | 'sky' | 'violet';
  profileHref: string;
  settingsHref: string;
  homeHref: string;
};

/* ============================================================
   Colors
   ============================================================ */

const COLORS = {
  emerald: {
    bg: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-700',
    text: 'text-emerald-700',
    light: 'bg-emerald-50',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/25',
    accent: 'emerald',
  },
  sky: {
    bg: 'bg-sky-600',
    bgHover: 'hover:bg-sky-700',
    text: 'text-sky-700',
    light: 'bg-sky-50',
    gradient: 'from-sky-500 to-cyan-600',
    shadow: 'shadow-sky-500/25',
    accent: 'sky',
  },
  violet: {
    bg: 'bg-violet-600',
    bgHover: 'hover:bg-violet-700',
    text: 'text-violet-700',
    light: 'bg-violet-50',
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/25',
    accent: 'violet',
  },
};

/* ============================================================
   Main component
   ============================================================ */

export default function ChatListPage({
  title,
  accentColor = 'emerald',
  profileHref,
  settingsHref,
  homeHref,
}: Props) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colors = COLORS[accentColor];

  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ---------- Own user info ---------- */

  const myName = user?.name || user?.email?.split('@')[0] || 'You';
  const myAvatar = (user as any)?.avatar as string | undefined;
  const myInitials = myName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  /* ---------- Load contacts ---------- */

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/contacts?mode=saved', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/login');
        return;
      }

      const data = await res.json();
      setContacts(Array.isArray(data?.contacts) ? data.contacts : []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const onFocus = () => loadContacts();
    window.addEventListener('focus', onFocus);

    const interval = setInterval(() => {
      if (!document.hidden) loadContacts();
    }, 20000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [loadContacts]);

  /* ---------- Filtering ---------- */

  const filtered = search.trim()
    ? contacts.filter((c) => {
        const q = search.toLowerCase();
        const name = (c.nickname || c.name || c.user?.name || '').toLowerCase();
        const email = (c.email || c.user?.email || '').toLowerCase();
        const phone = (c.phone || c.user?.phone || '').toLowerCase();
        const last = (c.lastMessage || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          last.includes(q)
        );
      })
    : contacts;

  /* ---------- Helpers ---------- */

  const initials = (name: string) =>
    name
      ? name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : '?';

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (diff < dayMs && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diff < 2 * dayMs) return 'Yesterday';
    if (diff < 7 * dayMs) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit',
    });
  };

  /* ---------- Navigate after new contact created ---------- */

  const handleContactCreated = (payload: {
    userId?: string;
    contactId?: string;
    type: 'platform' | 'email' | 'phone';
  }) => {
    setNewChatOpen(false);
    if (payload.userId) {
      router.push(`/contacts/${payload.userId}`);
    } else if (payload.contactId) {
      router.push(`/contacts/external/${payload.contactId}`);
    }
  };

  /* ---------- Delete all chats ---------- */

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/contacts/all', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setContacts([]);
        setDeleteAllOpen(false);
      }
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- Logout ---------- */

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    if (logout) await logout();
    router.push('/login');
    router.refresh();
  };

  /* ============================================================
     Render
     ============================================================ */

  return (
    <>
      {/* ✅ Container — Navbar کے نیچے سے براہِ راست، full height */}
      <div
        className="
          flex flex-col bg-white overflow-hidden
          h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)]
          w-full
        "
      >
        {/* ============================================
            WHATSAPP-STYLE HEADER
            ============================================ */}
        <header className={`shrink-0 ${colors.bg} text-white shadow-sm z-10`}>
          {/* Row 1: own avatar + name + online + actions */}
          <div className="px-3 py-2 flex items-center gap-3">
            {/* My avatar */}
            <div className="relative shrink-0">
              {myAvatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={myAvatar}
                  alt={myName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  {myInitials}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                {myName}
              </p>
              <p className="text-[11px] opacity-90 leading-tight">
                Online
              </p>
            </div>

            {/* New chat */}
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              className={`p-2 rounded-full ${colors.bgHover} transition`}
              aria-label="New chat"
              title="New chat"
            >
              <PlusIcon className="h-5 w-5" />
            </button>

            {/* Search focus */}
            <button
              type="button"
              className={`p-2 rounded-full ${colors.bgHover} transition`}
              aria-label="Search"
              onClick={() => {
                const el = document.getElementById('chat-search');
                el?.focus();
              }}
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* 3-dot menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={`p-2 rounded-full ${colors.bgHover} transition`}
                aria-label="Menu"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMenuOpen(false)}
                  />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 z-40 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-700">
                    <Link
                      href={profileHref}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm"
                    >
                      <UserCircleIcon className="h-4 w-4 text-slate-500" />
                      My Profile
                    </Link>

                    <Link
                      href="/settings/privacy"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm"
                    >
                      <ShieldCheckIcon className="h-4 w-4 text-slate-500" />
                      Privacy Settings
                    </Link>

                    <Link
                      href="/settings/privacy"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm"
                    >
                      <NoSymbolIcon className="h-4 w-4 text-slate-500" />
                      Blocked Users
                    </Link>

                    <div className="border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteAllOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-sm text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete all chats
                    </button>

                    <div className="border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-slate-500" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 2: search bar */}
          <div className="px-3 pb-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <input
                id="chat-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${title.toLowerCase()}`}
                className="w-full pl-9 pr-9 py-1.5 bg-white/20 placeholder:text-white/60 text-white text-sm rounded-lg focus:outline-none focus:bg-white/30 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition"
                  aria-label="Clear"
                >
                  <XMarkIcon className="h-3.5 w-3.5 text-white" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ============================================
            LIST
            ============================================ */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <ArrowPathIcon className={`h-8 w-8 ${colors.text} animate-spin`} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              hasSearch={search.trim().length > 0}
              colors={colors}
              onNewChat={() => setNewChatOpen(true)}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((contact) => {
                const savedName =
                  contact.nickname ||
                  contact.name ||
                  contact.user?.name ||
                  '';

                const unsavedLabel =
                  contact.phone ||
                  contact.user?.phone ||
                  contact.email ||
                  contact.user?.email ||
                  contact.name ||
                  'Unknown';

                const displayName = contact.isSaved
                  ? savedName || unsavedLabel
                  : unsavedLabel;

                const isPlatform = contact.type === 'platform';
                const targetHref = contact.user?.id
                  ? `/contacts/${contact.user.id}`
                  : `/contacts/external/${contact._id}`;

                const subtitle =
                  contact.lastMessage ||
                  (isPlatform
                    ? contact.user?.isOnline
                      ? 'Online'
                      : contact.user?.phone ||
                        contact.user?.email ||
                        'Tap to chat'
                    : contact.type === 'email'
                    ? contact.email
                    : contact.phone);

                const hasUnread = contact.unreadCount > 0;
                const isOnline =
                  isPlatform && contact.user?.isOnline === true;

                return (
                  <li key={contact._id}>
                    <Link
                      href={targetHref}
                      className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`h-12 w-12 rounded-full ${
                            isPlatform
                              ? `bg-gradient-to-br ${colors.gradient}`
                              : contact.type === 'email'
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                              : 'bg-gradient-to-br from-amber-500 to-orange-600'
                          } flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                        >
                          {initials(displayName)}
                        </div>

                        {isOnline && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
                            title="Online"
                          />
                        )}

                        {!isPlatform && (
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center ${
                              contact.type === 'email'
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                          >
                            {contact.type === 'email' ? (
                              <EnvelopeIcon className="h-2.5 w-2.5 text-white" />
                            ) : (
                              <PhoneIcon className="h-2.5 w-2.5 text-white" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Name + subtitle */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-[15px] truncate ${
                              hasUnread
                                ? 'font-bold text-slate-900'
                                : 'font-semibold text-slate-900'
                            }`}
                          >
                            {displayName}
                          </p>
                          {contact.isFavorite && (
                            <StarSolid className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          )}

                          {!contact.isSaved && (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              <BookmarkIcon className="h-2.5 w-2.5" />
                              New
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[13px] truncate mt-0.5 ${
                            hasUnread
                              ? 'text-slate-800 font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          {subtitle}
                        </p>
                      </div>

                      {/* Time + unread */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {contact.lastMessageAt && (
                          <span
                            className={`text-[11px] ${
                              hasUnread
                                ? `${colors.text} font-bold`
                                : 'text-slate-400'
                            }`}
                          >
                            {formatTime(contact.lastMessageAt)}
                          </span>
                        )}
                        {hasUnread && (
                          <span
                            className={`h-5 min-w-5 px-1.5 rounded-full ${colors.bg} text-white text-[11px] font-bold flex items-center justify-center`}
                          >
                            {contact.unreadCount > 99
                              ? '99+'
                              : contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ============================================
          FAB — New chat
          ============================================ */}
      <button
        type="button"
        onClick={() => setNewChatOpen(true)}
        className={`fixed bottom-24 right-5 sm:bottom-24 lg:bottom-8 lg:right-8 z-20 h-14 w-14 rounded-2xl ${colors.bg} ${colors.bgHover} text-white shadow-2xl ${colors.shadow} flex items-center justify-center transition active:scale-95`}
        aria-label="New chat"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* ============================================
          NEW CHAT MODAL
          ============================================ */}
      {newChatOpen && (
        <NewChatModal
          colors={colors}
          onClose={() => setNewChatOpen(false)}
          onCreated={handleContactCreated}
        />
      )}

      {/* ============================================
          DELETE ALL CHATS — Confirmation
          ============================================ */}
      {deleteAllOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setDeleteAllOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Delete all chats?
                  </h2>
                  <p className="text-sm text-slate-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                All your contacts and chat history will be permanently removed
                from your list. The other person will still be able to message
                you if your privacy settings allow it.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteAllOpen(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete all'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   NEW CHAT MODAL
   ============================================================ */

function NewChatModal({
  colors,
  onClose,
  onCreated,
}: {
  colors: typeof COLORS.emerald;
  onClose: () => void;
  onCreated: (payload: {
    userId?: string;
    contactId?: string;
    type: 'platform' | 'email' | 'phone';
  }) => void;
}) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  const detectType = (v: string): 'email' | 'phone' | null => {
    const t = v.trim();
    if (!t) return null;
    if (t.includes('@')) return 'email';
    if (/^[\d+\-\s()]+$/.test(t)) return 'phone';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const type = detectType(value);
    if (!type) {
      setError('Enter a valid email or phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contacts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: value.trim() }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || !data?.success) {
        setError(data?.error || `Server error (${res.status})`);
        return;
      }

      onCreated({
        userId: data.userId,
        contactId: data.contactId,
        type: data.type,
      });
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${colors.bg} text-white px-5 py-3 flex items-center`}>
          <h2 className="text-lg font-bold flex-1">New chat</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-full hover:bg-white/20 transition disabled:opacity-50"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone or email
            </label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="+92 300 1234567  or  user@example.com"
              disabled={loading}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 disabled:bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-1">
              The message will be delivered if this contact is registered on
              the platform and allows your message.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className={`flex-1 px-4 py-2.5 rounded-lg ${colors.bg} ${colors.bgHover} text-white font-semibold transition disabled:opacity-50`}
            >
              {loading ? 'Starting…' : 'Start chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

function EmptyState({
  hasSearch,
  colors,
  onNewChat,
}: {
  hasSearch: boolean;
  colors: typeof COLORS.emerald;
  onNewChat: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div
        className={`h-20 w-20 mx-auto rounded-full ${colors.light} flex items-center justify-center mb-5`}
      >
        {hasSearch ? (
          <MagnifyingGlassIcon className={`h-10 w-10 ${colors.text}`} />
        ) : (
          <ChatBubbleLeftRightIcon className={`h-10 w-10 ${colors.text}`} />
        )}
      </div>

      <p className="text-base font-bold text-slate-800">
        {hasSearch ? 'No results found' : 'No contacts yet'}
      </p>
      <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
        {hasSearch
          ? 'Try searching with a different name, email, or phone'
          : 'Start a new chat by entering a phone number or email address'}
      </p>

      {!hasSearch && (
        <button
          type="button"
          onClick={onNewChat}
          className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 ${colors.bg} ${colors.bgHover} text-white text-sm font-semibold rounded-xl shadow-md transition`}
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </button>
      )}
    </div>
  );
}