
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  VideoCameraIcon,
  BookmarkIcon,
  PlusIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

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

type ContactType = 'platform' | 'email' | 'phone';

type Props = {
  title?: string;
  accentColor?: 'emerald' | 'sky' | 'violet';
  profileHref?: string;
  settingsHref?: string;
  homeHref?: string;
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
  },
  sky: {
    bg: 'bg-sky-600',
    bgHover: 'hover:bg-sky-700',
    text: 'text-sky-700',
    light: 'bg-sky-50',
    gradient: 'from-sky-500 to-cyan-600',
    shadow: 'shadow-sky-500/25',
  },
  violet: {
    bg: 'bg-violet-600',
    bgHover: 'hover:bg-violet-700',
    text: 'text-violet-700',
    light: 'bg-violet-50',
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/25',
  },
};

/* ============================================================
   Main component
============================================================ */

export default function ChatListPage({
  accentColor = 'emerald',
}: Props) {
  const router = useRouter();
  const colors = COLORS[accentColor];

  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Prevent overlapping requests.
  const requestInProgressRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const mountedRef = useRef(false);

  /* ============================================================
     Load contacts
  ============================================================ */

  const loadContacts = useCallback(async () => {
    // Do not start another request while one is already running.
    if (requestInProgressRef.current) return;

    requestInProgressRef.current = true;

    if (!hasLoadedRef.current && mountedRef.current) {
      setLoading(true);
    }

    try {
      const res = await fetch('/api/contacts?mode=saved', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      if (res.status === 401) {
        if (mountedRef.current) {
          router.replace('/login');
        }
        return;
      }

      if (!res.ok) {
        throw new Error(`Unable to load contacts (${res.status})`);
      }

      const data = await res.json();

      if (!Array.isArray(data?.contacts)) {
        throw new Error('Invalid contacts response from server');
      }

      if (mountedRef.current) {
        setContacts(data.contacts);
        setLoadError('');
      }
    } catch (error) {
      console.error('[ChatList] Load contacts error:', error);

      if (mountedRef.current) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load contacts. Please try again.'
        );
      }
    } finally {
      requestInProgressRef.current = false;
      hasLoadedRef.current = true;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [router]);

  /* ============================================================
     Initial load + polling
  ============================================================ */

  useEffect(() => {
    mountedRef.current = true;

    loadContacts();

    return () => {
      mountedRef.current = false;
    };
  }, [loadContacts]);

  useEffect(() => {
    const onFocus = () => {
      if (!document.hidden) {
        loadContacts();
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        loadContacts();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadContacts();
      }
    }, 20000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [loadContacts]);

  /* ============================================================
     Filtering
  ============================================================ */

  const filtered = search.trim()
    ? contacts.filter((contact) => {
        const q = search.trim().toLowerCase();

        const name = (
          contact.nickname ||
          contact.name ||
          contact.user?.name ||
          ''
        ).toLowerCase();

        const email = (
          contact.email ||
          contact.user?.email ||
          ''
        ).toLowerCase();

        const phone = (
          contact.phone ||
          contact.user?.phone ||
          ''
        ).toLowerCase();

        const lastMessage = (
          contact.lastMessage || ''
        ).toLowerCase();

        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          lastMessage.includes(q)
        );
      })
    : contacts;

  /* ============================================================
     Helpers
  ============================================================ */

  const initials = (name: string) => {
    if (!name?.trim()) return '?';

    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (diff >= 0 && diff < 2 * dayMs) {
      return 'Yesterday';
    }

    if (diff >= 0 && diff < 7 * dayMs) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
      });
    }

    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit',
    });
  };

  /* ============================================================
     New chat handlers
  ============================================================ */

  const closeNewChat = useCallback(() => {
    setNewChatOpen(false);
  }, []);

  const handleContactCreated = useCallback(
    (payload: {
      userId?: string;
      contactId?: string;
      type: ContactType;
    }) => {
      setNewChatOpen(false);

      if (payload.userId) {
        router.push(`/contacts/${payload.userId}`);
        return;
      }

      if (payload.contactId) {
        router.push(`/contacts/external/${payload.contactId}`);
      }
    },
    [router]
  );

  /* ============================================================
     Delete all chats
  ============================================================ */

  const openDeleteConfirmation = () => {
    setDeleteError('');
    setDeleteAllOpen(true);
  };

  const closeDeleteConfirmation = () => {
    if (deleting) return;

    setDeleteAllOpen(false);
    setDeleteError('');
  };

  const handleDeleteAll = async () => {
    if (deleting) return;

    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/contacts/all', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      let data: any = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data?.error || `Unable to delete chats (${res.status})`
        );
      }

      setContacts([]);
      setSearch('');
      setDeleteAllOpen(false);
      setDeleteError('');
    } catch (error) {
      console.error('[ChatList] Delete all error:', error);

      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to delete chats. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ============================================================
     Render
  ============================================================ */

  return (
    <>
      <div className="flex flex-col bg-white overflow-hidden w-full flex-1 min-h-0">

        {/* Search + Delete action */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">

            <div className="relative flex-1 min-w-0">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats"
                className="w-full pl-9 pr-9 py-2 bg-slate-100 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-4 w-4 text-slate-500" />
                </button>
              )}
            </div>

            {contacts.length > 0 && (
              <button
                type="button"
                onClick={openDeleteConfirmation}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition"
                title="Delete all chats"
                aria-label="Delete all chats"
              >
                <TrashIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Delete all</span>
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* Load error */}
          {loadError && (
            <div className="mx-3 sm:mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800">
                    Unable to load contacts
                  </p>

                  <p className="text-xs text-red-700 mt-1">
                    {loadError}
                  </p>

                  <button
                    type="button"
                    onClick={loadContacts}
                    disabled={loading}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
                  >
                    <ArrowPathIcon
                      className={`h-3.5 w-3.5 ${
                        loading ? 'animate-spin' : ''
                      }`}
                    />
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <ArrowPathIcon
                className={`h-8 w-8 ${colors.text} animate-spin`}
              />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              hasSearch={search.trim().length > 0}
              colors={colors}
              onNewChat={() => setNewChatOpen(true)}
              hasError={!!loadError}
              onRetry={loadContacts}
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
                      ? contact.email || 'Email contact'
                      : contact.phone || 'Phone contact');

                const hasUnread = contact.unreadCount > 0;

                const isOnline =
                  isPlatform && contact.user?.isOnline === true;

                const canCall =
                  isPlatform && !!contact.user?.id;

                return (
                  <li
                    key={contact._id}
                    className="flex items-stretch hover:bg-slate-50 active:bg-slate-100 transition"
                  >

                    {/* Main clickable area */}
                    <Link
                      href={targetHref}
                      className="flex items-center gap-3 flex-1 min-w-0 px-3 sm:px-4 py-3"
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
                    </Link>

                    {/* Time + unread + call buttons */}
                    <div className="flex items-center gap-1 pr-2 sm:pr-3 shrink-0">

                      <div className="flex flex-col items-end gap-1">
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

                      {/* Audio + Video calls */}
                      {canCall && (
                        <div className="flex flex-col gap-0.5 ml-1">
                          <Link
                            href={`/call/${contact.user!.id}?type=audio&name=${encodeURIComponent(
                              displayName
                            )}`}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition"
                            aria-label="Audio call"
                            title="Audio call"
                          >
                            <PhoneIcon className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/call/${contact.user!.id}?type=video&name=${encodeURIComponent(
                              displayName
                            )}`}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-sky-600 hover:bg-sky-50 active:bg-sky-100 transition"
                            aria-label="Video call"
                            title="Video call"
                          >
                            <VideoCameraIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* New chat floating button */}
      <button
        type="button"
        onClick={() => setNewChatOpen(true)}
        className={`fixed z-20 h-14 w-14 rounded-2xl ${colors.bg} ${colors.bgHover} text-white shadow-2xl ${colors.shadow} flex items-center justify-center transition active:scale-95 bottom-20 right-5 lg:bottom-8 lg:right-8`}
        aria-label="New chat"
        title="New chat"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* New chat modal */}
      {newChatOpen && (
        <NewChatModal
          colors={colors}
          onClose={closeNewChat}
          onCreated={handleContactCreated}
        />
      )}

      {/* Delete all confirmation */}
      {deleteAllOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDeleteConfirmation}
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
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                All your contacts and chat history will be permanently removed.
              </p>

              {deleteError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeDeleteConfirmation}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    'Delete all'
                  )}
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
  colors: (typeof COLORS)[keyof typeof COLORS];
  onClose: () => void;
  onCreated: (payload: {
    userId?: string;
    contactId?: string;
    type: ContactType;
  }) => void;
}) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  /* Focus + Escape */
  useEffect(() => {
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, loading]);

  /* Detect email or phone */
  const detectType = (
    input: string
  ): 'email' | 'phone' | null => {
    const trimmed = input.trim();

    if (!trimmed) return null;

    if (trimmed.includes('@')) {
      return 'email';
    }

    if (/^[\d+\-\s()]+$/.test(trimmed)) {
      return 'phone';
    }

    return null;
  };

  /* Submit */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError('');

    const identifier = value.trim();
    const type = detectType(identifier);

    if (!type) {
      setError('Enter a valid email or phone number.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/contacts/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier,
        }),
      });

      let data: any = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || !data?.success) {
        setError(
          data?.error || `Server error (${res.status})`
        );
        return;
      }

      const createdType: ContactType =
        data.type === 'platform' ||
        data.type === 'email' ||
        data.type === 'phone'
          ? data.type
          : type;

      onCreated({
        userId:
          typeof data.userId === 'string'
            ? data.userId
            : undefined,
        contactId:
          typeof data.contactId === 'string'
            ? data.contactId
            : undefined,
        type: createdType,
      });
    } catch (error) {
      console.error('[NewChat] Error:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Network error. Please try again.'
      );
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

        {/* Header */}
        <div className={`${colors.bg} text-white px-5 py-3 flex items-center`}>
          <h2 className="text-lg font-bold flex-1">
            New chat
          </h2>

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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone or email
            </label>

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="+92 300 1234567 or user@example.com"
              disabled={loading}
              autoComplete="off"
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
              className={`flex-1 px-4 py-2.5 rounded-lg ${colors.bg} ${colors.bgHover} text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                'Start chat'
              )}
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
  hasError,
  onRetry,
}: {
  hasSearch: boolean;
  colors: (typeof COLORS)[keyof typeof COLORS];
  onNewChat: () => void;
  hasError: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">

      <div
        className={`h-20 w-20 mx-auto rounded-full ${colors.light} flex items-center justify-center mb-5`}
      >
        {hasSearch ? (
          <MagnifyingGlassIcon className={`h-10 w-10 ${colors.text}`} />
        ) : hasError ? (
          <ExclamationCircleIcon className="h-10 w-10 text-red-500" />
        ) : (
          <ChatBubbleLeftRightIcon className={`h-10 w-10 ${colors.text}`} />
        )}
      </div>

      <p className="text-base font-bold text-slate-800">
        {hasSearch
          ? 'No results found'
          : hasError
            ? 'Could not load contacts'
            : 'No contacts yet'}
      </p>

      <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
        {hasSearch
          ? 'Try searching with a different name, email, or phone.'
          : hasError
            ? 'Please check your connection and try again.'
            : 'Start a new chat by entering a phone number or email address.'}
      </p>

      {hasError ? (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 ${colors.bg} ${colors.bgHover} text-white text-sm font-semibold rounded-xl shadow-md transition`}
        >
          <ArrowPathIcon className="h-4 w-4" />
          Retry
        </button>
      ) : (
        !hasSearch && (
          <button
            type="button"
            onClick={onNewChat}
            className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 ${colors.bg} ${colors.bgHover} text-white text-sm font-semibold rounded-xl shadow-md transition`}
          >
            <PlusIcon className="h-4 w-4" />
            New Chat
          </button>
        )
      )}
    </div>
  );
}
