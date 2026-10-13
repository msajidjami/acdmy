'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Check,
  Camera,
  AlertCircle,
  Shield,
  Calendar,
} from 'lucide-react';

type Me = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  provider: string;
  city: string;
  country: string;
  createdAt: string | null;
};

export default function ProfileForm({ user }: { user: Me }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    country: user.country,
    avatar: user.avatar,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = form.name || form.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleChange = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError('');
  };

  /* ---------- Upload avatar ---------- */
  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Avatar upload failed');
        return;
      }

      setForm((f) => ({ ...f, avatar: data.url || '' }));
    } catch (err: any) {
      setError(err?.message || 'Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  /* ---------- Save profile ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
          avatar: form.avatar.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.error || `Server error (${res.status})`);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Dates ---------- */
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="space-y-4">
      {/* ============================================
          HERO — avatar + name + role
          ============================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-emerald-700 text-white p-5 sm:p-6 shadow-lg shadow-emerald-700/25">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-900/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-4">
          {/* Avatar + camera */}
          <div className="relative shrink-0">
            {form.avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={form.avatar}
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-white text-emerald-700 border-2 border-white flex items-center justify-center font-bold text-xl">
                {initials}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-900 text-white flex items-center justify-center shadow-lg border-2 border-white hover:bg-emerald-950 transition disabled:opacity-50"
              aria-label="Change avatar"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleAvatarUpload(f);
                e.target.value = '';
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
              <UserIcon className="h-3 w-3" />
              My Profile
            </p>
            <h1 className="text-lg sm:text-2xl font-bold truncate mt-0.5">
              {displayName}
            </h1>
            <p className="text-xs opacity-80 truncate">
              {form.email || form.phone}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          FORM
          ============================================ */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Save className="h-3.5 w-3.5 text-white" />
          </span>
          Account information
        </h2>

        {/* Name */}
        <Field
          icon={UserIcon}
          label="Full name"
          value={form.name}
          onChange={(v) => handleChange('name', v)}
          placeholder="Your full name"
          required
        />

        {/* Email */}
        <Field
          icon={Mail}
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => handleChange('email', v)}
          placeholder="you@example.com"
        />

        {/* Phone */}
        <Field
          icon={Phone}
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(v) => handleChange('phone', v)}
          placeholder="+92 300 1234567"
        />

        {/* City + Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            icon={MapPin}
            label="City"
            value={form.city}
            onChange={(v) => handleChange('city', v)}
            placeholder="e.g. Karachi"
          />
          <Field
            icon={MapPin}
            label="Country"
            value={form.country}
            onChange={(v) => handleChange('country', v)}
            placeholder="e.g. Pakistan"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Save bar */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>

          {saved && (
            <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </form>

      {/* ============================================
          INFO CARD
          ============================================ */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-slate-900 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-white" />
          </span>
          Account details
        </h2>

        <InfoRow label="Role" value={capitalize(user.role)} />
        <InfoRow label="Sign-in method" value={capitalize(user.provider)} />
        {memberSince && (
          <InfoRow label="Member since" value={memberSince} icon={Calendar} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Small components
   ============================================================ */

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-9 pr-3 py-2.5 border-2 border-slate-200 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
        />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-sm font-bold text-slate-900 truncate">
        {value}
      </span>
    </div>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}