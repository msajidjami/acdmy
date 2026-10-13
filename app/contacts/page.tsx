'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  StarIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  UserCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

type SavedContact = {
  _id: string;
  type: 'platform' | 'email' | 'phone';
  nickname: string;
  name: string;
  email?: string;
  phone?: string;
  isFavorite: boolean;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  invited?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar: string;
  } | null;
};

type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  isSaved: boolean;
};

export default function ContactsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<'contacts' | 'find' | 'add'>('contacts');
  const [saved, setSaved] = useState<SavedContact[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  /* Add form state */
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);

  /* ---------- Load ---------- */
  useEffect(() => {
    if (tab === 'contacts') loadSaved();
    else if (tab === 'find') loadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== 'find') return;
    const t = setTimeout(() => loadDirectory(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function loadSaved() {
    setLoading(true);
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
      setSaved(data.contacts || []);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDirectory() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/contacts?mode=directory&q=${encodeURIComponent(search)}`,
        { credentials: 'include', cache: 'no-store' }
      );
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setDirectory(data.users || []);
    } catch {
      setDirectory([]);
    } finally {
      setLoading(false);
    }
  }

  async function savePlatformUser(userId: string) {
    setSavingId(userId);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contactId: userId }),
      });
      if (res.ok) {
        setDirectory((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isSaved: true } : u))
        );
      }
    } catch {}
    setSavingId(null);
  }

  async function removeContact(contactId: string) {
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setSaved((prev) => prev.filter((c) => c._id !== contactId));
    } catch {}
  }

  /* ---------- Add external contact ---------- */
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddMsg('');
    setFoundUser(null);

    if (!addEmail && !addPhone) {
      setAddMsg('Enter email or phone');
      setAddLoading(false);
      return;
    }

    try {
      const body: any = {
        name: addName.trim(),
      };
      if (addEmail.trim()) body.email = addEmail.trim();
      if (addPhone.trim()) body.phone = addPhone.trim();

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddMsg(data?.error || 'Failed to save');
        return;
      }

      if (data.contact?.type === 'platform') {
        setAddMsg('✅ Found on platform — saved as user');
        setFoundUser(data.contact);
      } else {
        setAddMsg('✅ Saved. They will appear when they join.');
      }

      /* reset */
      setAddName('');
      setAddEmail('');
      setAddPhone('');

      /* reload */
      setTimeout(() => {
        setTab('contacts');
        loadSaved();
      }, 1000);
    } catch (err: any) {
      setAddMsg(err?.message || 'Network error');
    } finally {
      setAddLoading(false);
    }
  }

  /* initials */
  const initials = (name: string) =>
    name
      ? name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : '?';

  /* type icon */
  const TypeBadge = ({ type }: { type: string }) => {
    if (type === 'platform') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
          User
        </span>
      );
    }
    if (type === 'email') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
          Email
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
        Phone
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Contacts</h1>
            <button
              onClick={() => setTab('add')}
              className="p-2 rounded-full hover:bg-emerald-700 transition"
              aria-label="Add contact"
            >
              <UserPlusIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setTab('contacts')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                tab === 'contacts'
                  ? 'bg-white text-emerald-700'
                  : 'text-white/80 hover:bg-emerald-700'
              }`}
            >
              My Contacts
            </button>
            <button
              onClick={() => setTab('find')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                tab === 'find'
                  ? 'bg-white text-emerald-700'
                  : 'text-white/80 hover:bg-emerald-700'
              }`}
            >
              Find Users
            </button>
            <button
              onClick={() => setTab('add')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                tab === 'add'
                  ? 'bg-white text-emerald-700'
                  : 'text-white/80 hover:bg-emerald-700'
              }`}
            >
              Add New
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* ============================================
            SEARCH (Find tab)
            ============================================ */}
        {tab === 'find' && (
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && tab !== 'add' && (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="h-6 w-6 text-emerald-600 animate-spin" />
          </div>
        )}

        {/* ============================================
            MY CONTACTS
            ============================================ */}
        {!loading && tab === 'contacts' && (
          <>
            {saved.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-slate-700 font-semibold">No contacts yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Add friends from your phone contacts or email
                </p>
                <div className="mt-5 flex gap-2 justify-center">
                  <button
                    onClick={() => setTab('add')}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition inline-flex items-center gap-2"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    Add Contact
                  </button>
                  <button
                    onClick={() => setTab('find')}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition inline-flex items-center gap-2"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    Find Users
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                {saved.map((c) => {
                  const displayName =
                    c.nickname ||
                    c.name ||
                    c.user?.name ||
                    c.email ||
                    c.phone ||
                    'Unknown';

                  const isExternal = c.type !== 'platform';
                  const targetHref = c.user?.id
                    ? `/contacts/${c.user.id}`
                    : `/contacts/external/${c._id}`;

                  return (
                    <div
                      key={c._id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition group"
                    >
                      <Link
                        href={targetHref}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        {/* Avatar */}
                        <div
                          className={`relative h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                            c.type === 'platform'
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                              : c.type === 'email'
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                              : 'bg-gradient-to-br from-amber-500 to-orange-600'
                          }`}
                        >
                          {initials(displayName)}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {displayName}
                            </p>
                            {c.isFavorite && (
                              <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                            )}
                            <TypeBadge type={c.type} />
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {c.type === 'platform'
                              ? c.lastMessage || c.user?.phone || c.user?.email || 'Tap to chat'
                              : c.type === 'email'
                              ? c.email
                              : c.phone}
                          </p>
                        </div>

                        {c.unreadCount > 0 && (
                          <span className="shrink-0 h-6 min-w-6 px-2 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">
                            {c.unreadCount}
                          </span>
                        )}
                      </Link>

                      <button
                        onClick={() => removeContact(c._id)}
                        className="shrink-0 p-2 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ============================================
            FIND USERS (platform)
            ============================================ */}
        {!loading && tab === 'find' && (
          <>
            {directory.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-700 font-semibold">No users found</p>
                <p className="text-slate-500 text-sm mt-1">
                  Try different search or use Add New
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                {directory.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {initials(u.name || u.phone || u.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {u.name || u.phone || u.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {u.phone || u.email || 'No info'}
                      </p>
                    </div>
                    {u.isSaved ? (
                      <Link
                        href={`/contacts/${u.id}`}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition inline-flex items-center gap-1.5"
                      >
                        <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                        Chat
                      </Link>
                    ) : (
                      <button
                        onClick={() => savePlatformUser(u.id)}
                        disabled={savingId === u.id}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {savingId === u.id ? (
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserPlusIcon className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================
            ADD NEW (external email/phone)
            ============================================ */}
        {tab === 'add' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="text-center mb-5">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md mb-3">
                <UserPlusIcon className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Add New Contact
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Save any email or phone — even if they're not on ILMORA786 yet
              </p>
            </div>

            {addMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
                  addMsg.includes('✅')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {addMsg.includes('✅') && (
                  <CheckCircleIcon className="h-4 w-4 shrink-0" />
                )}
                {addMsg}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Ahmed Khan"
                    maxLength={60}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Gmail / Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <GlobeAltIcon className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  اگر یہ email/phone ILMORA786 پر موجود ہے تو وہ خودبخود user کے طور پر جڑ جائے گا — ورنہ external contact کے طور پر محفوظ رہے گا۔
                </p>
              </div>

              <button
                type="submit"
                disabled={addLoading || (!addEmail.trim() && !addPhone.trim())}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {addLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-5 w-5" />
                    Save Contact
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Floating home */}
      <div className="fixed bottom-4 right-4 z-40">
        <Link
          href="/"
          className="h-14 w-14 rounded-full bg-emerald-600 shadow-lg flex items-center justify-center text-white hover:bg-emerald-700 transition"
          aria-label="Home"
        >
          <UserCircleIcon className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}