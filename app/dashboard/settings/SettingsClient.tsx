'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Bell,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Camera,
  Shield,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Globe,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  country: string;
  city: string;
  createdAt: string;
};

type TabKey = 'profile' | 'password' | 'notifications' | 'danger';

/* ============================================================
   HELPERS
   ============================================================ */

async function readJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length === 1
    ? p[0].charAt(0).toUpperCase()
    : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
}

/* ============================================================
   MAIN
   ============================================================ */

export default function SettingsClient({ user }: { user: SettingsUser }) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  /* ---------- Profile form ---------- */
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [city, setCity] = useState(user.city);
  const [country, setCountry] = useState(user.country);
  const [avatar, setAvatar] = useState(user.avatar);
  const [savingProfile, setSavingProfile] = useState(false);

  /* ---------- Password form ---------- */
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  /* ---------- Notifications ---------- */
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);

  /* ---------- Danger zone ---------- */
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* ============================================================
     PROFILE SAVE
     ============================================================ */
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          city: city.trim(),
          country: country.trim(),
          avatar: avatar.trim(),
        }),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to update profile');

      toast.success('Profile updated successfully');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSavingProfile(false);
    }
  };

  /* ============================================================
     AVATAR UPLOAD
     ============================================================ */
  const handleAvatarChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      const url = data?.url || data?.avatar || '';
      if (url) setAvatar(url);

      toast.success('Avatar uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  /* ============================================================
     PASSWORD SAVE
     ============================================================ */
  const handleSavePassword = async () => {
    if (!currentPwd) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPwd.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPwd(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to change password');

      toast.success('Password changed successfully');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSavingPwd(false);
    }
  };

  /* ============================================================
     NOTIFICATIONS SAVE
     ============================================================ */
  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notifications: {
            email: notifEmail,
            sms: notifSms,
            marketing: notifMarketing,
          },
        }),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to save');

      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSavingNotif(false);
    }
  };

  /* ============================================================
     DELETE ACCOUNT
     ============================================================ */
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    if (
      !confirm(
        'Are you absolutely sure? This will permanently delete your account and all data.'
      )
    ) {
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to delete account');

      toast.success('Account deleted');
      document.cookie =
        'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setDeletingAccount(false);
    }
  };

  /* ============================================================
     LOGOUT
     ============================================================ */
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
    router.refresh();
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="pt-24 sm:pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* ============================================
          HEADER
      ============================================ */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/dashboard"
          className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Account Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your profile, password and preferences
          </p>
        </div>
      </div>

      {/* ============================================
          TABS
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 flex items-center gap-1 px-2 overflow-x-auto">
          {(
            [
              { key: 'profile', label: 'Profile', icon: User },
              { key: 'password', label: 'Password', icon: Lock },
              { key: 'notifications', label: 'Notifications', icon: Bell },
              { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const isDanger = tab.key === 'danger';

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? isDanger
                      ? 'border-rose-600 text-rose-700'
                      : 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 sm:p-6">
          {/* ============================================
              PROFILE TAB
          ============================================ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="h-20 w-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {getInitials(name || email)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center shadow-md transition"
                    aria-label="Change avatar"
                  >
                    <Camera className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleAvatarChange(f);
                      e.target.value = '';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">Profile Picture</p>
                  <p className="text-xs text-slate-500 mt-1">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
                    >
                      Upload New
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/40 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/40 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/40 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Karachi"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/40 text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Pakistan"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/40 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Account info */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-800">
                    Role: <span className="capitalize">{user.role}</span>
                  </p>
                  <p className="mt-0.5">
                    Member since{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 transition text-sm"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================
              PASSWORD TAB
          ============================================ */}
          {activeTab === 'password' && (
            <div className="space-y-5 max-w-lg">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Choose a strong password with at least 6 characters. Use a mix
                  of letters, numbers, and symbols.
                </p>
              </div>

              {/* Current */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/40 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/40 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Strength indicator */}
                {newPwd && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          newPwd.length < 6
                            ? 'bg-rose-500 w-1/4'
                            : newPwd.length < 8
                            ? 'bg-amber-500 w-2/4'
                            : newPwd.length < 12
                            ? 'bg-blue-500 w-3/4'
                            : 'bg-emerald-500 w-full'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {newPwd.length < 6
                        ? 'Weak'
                        : newPwd.length < 8
                        ? 'Fair'
                        : newPwd.length < 12
                        ? 'Good'
                        : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/40 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {confirmPwd && newPwd !== confirmPwd && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
                {confirmPwd && newPwd === confirmPwd && newPwd.length >= 6 && (
                  <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={savingPwd}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 transition text-sm"
                >
                  {savingPwd ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingPwd ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================
              NOTIFICATIONS TAB
          ============================================ */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 max-w-lg">
              <div className="space-y-3">
                {[
                  {
                    label: 'Email Notifications',
                    desc: 'Get updates about inquiries and messages via email',
                    value: notifEmail,
                    setter: setNotifEmail,
                  },
                  {
                    label: 'SMS Notifications',
                    desc: 'Receive important updates via SMS',
                    value: notifSms,
                    setter: setNotifSms,
                  },
                  {
                    label: 'Marketing Emails',
                    desc: 'Receive tips, news, and offers from ilmora786',
                    value: notifMarketing,
                    setter: setNotifMarketing,
                  },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-300 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={item.value}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={`mt-0.5 h-5 w-9 rounded-full transition relative shrink-0 ${
                        item.value ? 'bg-teal-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                          item.value ? 'left-4' : 'left-0.5'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveNotif}
                  disabled={savingNotif}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 transition text-sm"
                >
                  {savingNotif ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingNotif ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================
              DANGER TAB
          ============================================ */}
          {activeTab === 'danger' && (
            <div className="space-y-5 max-w-lg">
              {/* Logout */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <LogOut className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900">
                      Sign out from this device
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      You will be logged out and redirected to login page.
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logout Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Delete Account */}
              <div className="rounded-xl border-2 border-rose-200 bg-rose-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-rose-900">
                      Delete Account
                    </p>
                    <p className="text-xs text-rose-700 mt-1">
                      Once deleted, your account and all associated data will be
                      permanently removed. This action cannot be undone.
                    </p>

                    <div className="mt-4">
                      <label className="block text-xs font-bold text-rose-800 mb-2">
                        Type <span className="font-mono">DELETE</span> to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="DELETE"
                        className="w-full px-4 py-2.5 bg-white border border-rose-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/40 text-sm font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={
                        deletingAccount || deleteConfirm !== 'DELETE'
                      }
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition"
                    >
                      {deletingAccount ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      {deletingAccount
                        ? 'Deleting...'
                        : 'Permanently Delete My Account'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}