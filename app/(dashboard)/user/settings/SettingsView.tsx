'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings as SettingsIcon,
  Bell,
  ShieldCheck,
  Lock,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  User as UserIcon,
  Globe,
  Users,
  Ban,
  MessageSquare,
  Mail,
  Phone,
} from 'lucide-react';

type Me = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  provider: string;
  privacy: {
    allowMessagesFrom: 'everyone' | 'contacts' | 'nobody';
    discoverable: boolean;
    blockedCount: number;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    marketing: boolean;
  };
};

export default function SettingsView({ me }: { me: Me }) {
  const router = useRouter();

  /* ---------- Notification state ---------- */
  const [notifications, setNotifications] = useState(me.notifications);
  const [savingNotif, setSavingNotif] = useState(false);
  const [savedNotif, setSavedNotif] = useState(false);

  /* ---------- Delete account ---------- */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* ---------- Notification toggle ---------- */
  const toggleNotif = async (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    setSavingNotif(true);
    setSavedNotif(false);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notifications: next }),
      });

      if ((await res.json())?.success) {
        setSavedNotif(true);
        setTimeout(() => setSavedNotif(false), 2000);
      }
    } finally {
      setSavingNotif(false);
    }
  };

  /* ---------- Delete account ---------- */
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setDeleteError(data?.error || 'Failed to delete account');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setDeleteError(err?.message || 'Network error');
    } finally {
      setDeleting(false);
    }
  };

  const allowLabels: Record<
    'everyone' | 'contacts' | 'nobody',
    { label: string; desc: string; Icon: any; color: string }
  > = {
    everyone: {
      label: 'Everyone',
      desc: 'Anyone on the platform',
      Icon: Globe,
      color: 'emerald',
    },
    contacts: {
      label: 'Contacts only',
      desc: 'Only saved contacts',
      Icon: Users,
      color: 'sky',
    },
    nobody: {
      label: 'Nobody',
      desc: 'No one can message',
      Icon: Ban,
      color: 'rose',
    },
  };

  const currentAllow = allowLabels[me.privacy.allowMessagesFrom];
  const AllowIcon = currentAllow.Icon;

  return (
    <div className="space-y-4">
      {/* ============================================
          HERO — مکمل سبز، کوئی decoration نہیں
          ============================================ */}
      <div className="rounded-2xl bg-green-700 text-green-500 p-5 sm:p-6 shadow-lg shadow-green-700/25">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center shrink-0">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 bg-green-700 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold">Settings</h1>
            <p className="text-xs opacity-80 truncate">
              Manage your account, privacy & notifications
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          ACCOUNT
          ============================================ */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
        <header className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <UserIcon className="h-3.5 w-3.5 text-white" />
          </span>
          <h2 className="text-sm font-bold text-slate-900">Account</h2>
        </header>

        <Link
          href="/user/profile"
          className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition border-b border-slate-100"
        >
          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <UserIcon className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Edit profile
            </p>
            <p className="text-xs text-slate-500 truncate">
              Name, email, phone, avatar
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </Link>

        <Link
          href="/forgot-password"
          className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition"
        >
          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Lock className="h-4 w-4 text-slate-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Change password
            </p>
            <p className="text-xs text-slate-500 truncate">
              Update your login password
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </Link>
      </section>

      {/* ============================================
          PRIVACY
          ============================================ */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
        <header className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </span>
          <h2 className="text-sm font-bold text-slate-900">Privacy</h2>
        </header>

        <Link
          href="/settings/privacy"
          className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition border-b border-slate-100"
        >
          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <AllowIcon className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Who can message me
            </p>
            <p className="text-xs text-slate-500 truncate">
              Currently: <strong>{currentAllow.label}</strong> — {currentAllow.desc}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </Link>

        <Link
          href="/settings/privacy"
          className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition border-b border-slate-100"
        >
          <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
            <Ban className="h-4 w-4 text-rose-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Blocked users
            </p>
            <p className="text-xs text-slate-500 truncate">
              {me.privacy.blockedCount}{' '}
              {me.privacy.blockedCount === 1 ? 'user' : 'users'} blocked
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </Link>

        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4 text-slate-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Find me on search
            </p>
            <p className="text-xs text-slate-500 truncate">
              {me.privacy.discoverable
                ? 'Others can find you'
                : 'Hidden from search'}
            </p>
          </div>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              me.privacy.discoverable
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {me.privacy.discoverable ? 'ON' : 'OFF'}
          </span>
        </div>
      </section>

      {/* ============================================
          NOTIFICATIONS
          ============================================ */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
        <header className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Bell className="h-3.5 w-3.5 text-white" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
          </div>
          {savedNotif && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
        </header>

        <div className="divide-y divide-slate-100">
          <ToggleRow
            icon={Mail}
            label="Email notifications"
            desc="Receive updates via email"
            value={notifications.email}
            onChange={() => toggleNotif('email')}
            disabled={savingNotif}
          />
          <ToggleRow
            icon={Phone}
            label="SMS notifications"
            desc="Receive important alerts via SMS"
            value={notifications.sms}
            onChange={() => toggleNotif('sms')}
            disabled={savingNotif}
          />
          <ToggleRow
            icon={MessageSquare}
            label="Marketing messages"
            desc="Promotions and product updates"
            value={notifications.marketing}
            onChange={() => toggleNotif('marketing')}
            disabled={savingNotif}
          />
        </div>
      </section>

      {/* ============================================
          DANGER ZONE
          ============================================ */}
      <section className="bg-white border-2 border-rose-200 rounded-2xl overflow-hidden">
        <header className="px-4 sm:px-5 py-3 border-b border-rose-100 flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-rose-600 flex items-center justify-center">
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </span>
          <h2 className="text-sm font-bold text-rose-700">Danger zone</h2>
        </header>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="w-full text-left flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-rose-50 transition"
        >
          <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
            <Trash2 className="h-4 w-4 text-rose-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-700">
              Delete account
            </p>
            <p className="text-xs text-slate-500 truncate">
              Permanently remove your account and data
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-rose-400 shrink-0" />
        </button>
      </section>

      {/* ============================================
          DELETE CONFIRM MODAL
          ============================================ */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setDeleteOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Delete account?
                  </h2>
                  <p className="text-xs text-slate-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                All your data including chats, contacts and profile will be
                permanently deleted. Type{' '}
                <strong className="text-slate-900">DELETE</strong> to confirm.
              </p>

              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="Type DELETE"
                disabled={deleting}
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-500 mb-3"
              />

              {deleteError && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 mb-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{deleteError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteText('');
                    setDeleteError('');
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteText.trim() !== 'DELETE'}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Toggle Row
   ============================================================ */

function ToggleRow({
  icon: Icon,
  label,
  desc,
  value,
  onChange,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
      <div
        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
          value ? 'bg-emerald-50' : 'bg-slate-100'
        }`}
      >
        <Icon
          className={`h-4 w-4 ${value ? 'text-emerald-700' : 'text-slate-500'}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 truncate">{desc}</p>
      </div>

      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${
          value ? 'bg-emerald-600' : 'bg-slate-300'
        } disabled:opacity-50`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}