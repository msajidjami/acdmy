'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  provider: string;
  isVerified: boolean;
  createdAt: string | null;
  lastLogin: string | null;
  loginCount: number;
};

type AcademyInfo = {
  id: string;
  name: string;
  slug: string;
  logo: string;
} | null;

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [academy, setAcademy] = useState<AcademyInfo>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  /* ---------- Load profile ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/user/profile', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          router.replace('/login');
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (!data?.success || !data?.user) {
          setError(data?.error || 'Could not load profile');
          return;
        }

        setProfile(data.user);
        setAcademy(data.academy || null);
        setEditName(data.user.name);
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ---------- Save name ---------- */
  const handleSave = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/user/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to update');
      }

      if (profile) {
        setProfile({ ...profile, name: editName.trim() });
      }

      setSuccessMsg('Profile updated successfully');
      setEditing(false);

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- initials ---------- */
  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <p className="text-slate-500">{error || 'Profile not found'}</p>
        <Link
          href="/login"
          className="mt-4 inline-block text-emerald-600 font-semibold"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Home
      </Link>

      {/* Success message */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm"
        >
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          {successMsg}
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
          <XMarkIcon className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ============================================================
          WhatsApp-style header
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden"
      >
        {/* Green top banner */}
        <div className="h-24 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>
        </div>

        <div className="px-5 sm:px-8 pb-6 sm:pb-8">
          {/* Avatar — WhatsApp style */}
          <div className="flex items-end justify-between -mt-14 mb-4">
            <div className="relative">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-white p-1 shadow-xl">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl font-bold">
                  {initials || <UserIcon className="h-12 w-12" />}
                </div>
              </div>

              {profile.isVerified && (
                <span className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center">
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                </span>
              )}
            </div>

            {!editing && (
              <button
                onClick={() => {
                  setEditing(true);
                  setEditName(profile.name);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>

          {/* Name + role */}
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
                className="w-full text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 pb-1 focus:outline-none bg-transparent"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {saving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditName(profile.name);
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold capitalize">
                  {profile.role}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                  {profile.provider}
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ============================================================
          Account info — WhatsApp style
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Account
          </p>
        </div>

        {/* Email */}
        <InfoRow
          icon={<EnvelopeIcon className="h-5 w-5" />}
          label="Email"
          value={profile.email || 'Not linked'}
          empty={!profile.email}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        {/* Phone */}
        <InfoRow
          icon={<PhoneIcon className="h-5 w-5" />}
          label="Phone"
          value={profile.phone || 'Not linked'}
          empty={!profile.phone}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        {/* Role */}
        <InfoRow
          icon={<ShieldCheckIcon className="h-5 w-5" />}
          label="Account type"
          value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />

        {/* Provider */}
        <InfoRow
          icon={<KeyIcon className="h-5 w-5" />}
          label="Sign-in method"
          value={
            profile.provider === 'phone'
              ? 'WhatsApp / Phone'
              : profile.provider === 'google'
              ? 'Google'
              : 'Email & Password'
          }
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </motion.div>

      {/* ============================================================
          Academy (if owner)
          ============================================================ */}
      {academy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              My Academy
            </p>
          </div>

          <Link
            href="/owner/dashboard"
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition"
          >
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
              <BuildingOfficeIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {academy.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                /{academy.slug}
              </p>
            </div>
            <span className="text-slate-400 text-sm">→</span>
          </Link>
        </motion.div>
      )}

      {/* ============================================================
          Activity
          ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Activity
          </p>
        </div>

        <InfoRow
          icon={<CalendarIcon className="h-5 w-5" />}
          label="Joined"
          value={
            profile.createdAt
              ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Unknown'
          }
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />

        <InfoRow
          icon={<ClockIcon className="h-5 w-5" />}
          label="Last login"
          value={
            profile.lastLogin
              ? new Date(profile.lastLogin).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Never'
          }
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />

        <InfoRow
          icon={<UserIcon className="h-5 w-5" />}
          label="Total logins"
          value={String(profile.loginCount)}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
      </motion.div>
    </div>
  );
}

/* ============================================================
   InfoRow
   ============================================================ */

function InfoRow({
  icon,
  label,
  value,
  empty,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  empty?: boolean;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 last:border-b-0">
      <div
        className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ${iconColor}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <p
          className={`text-sm mt-0.5 truncate ${
            empty ? 'text-slate-400 italic' : 'text-slate-900 font-medium'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}