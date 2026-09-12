'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  School,
  GraduationCap,
  Sparkles,
  Save,
  RotateCcw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Camera,
  Trash2,
  Calendar,
  Award,
  Info,
  ShieldCheck,
} from 'lucide-react';

/* ======================================================
   Types
   ====================================================== */

type StudentData = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  classLevel: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string | null;
};

type AcademyData = { _id: string; name: string } | null;

type Props = {
  student: StudentData;
  academy: AcademyData;
  initials: string;
};

/* ======================================================
   Helpers
   ====================================================== */

function formatDate(iso: string | null): string {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

/* ======================================================
   Component
   ====================================================== */

export default function ProfileForm({ student, academy, initials }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: student.name,
    phone: student.phone,
  });

  const [avatarPreview, setAvatarPreview] = useState<string>(student.imageUrl);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Dirty check ---------- */

  const dirty = useMemo(() => {
    return (
      form.name.trim() !== student.name ||
      form.phone.trim() !== student.phone ||
      avatarPreview !== student.imageUrl
    );
  }, [form, student, avatarPreview]);

  /* ---------- Beforeunload warning ---------- */

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  /* ---------- Avatar upload ---------- */

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result || ''));
    reader.onerror = () => toast.error('Failed to read image');
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ---------- Save ---------- */

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          imageUrl:
            avatarPreview !== student.imageUrl ? avatarPreview : undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to save profile');
      }

      toast.success('Profile updated successfully');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ name: student.name, phone: student.phone });
    setAvatarPreview(student.imageUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Changes reverted');
  };

  /* ======================================================
     Render
     ====================================================== */

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============================================
          HERO HEADER
      ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 p-6 sm:p-8 text-white shadow-2xl shadow-cyan-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-teal-300/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              {avatarPreview ? (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white border-2 border-white/40 shadow-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarPreview}
                    alt={form.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-xl">
                  {initials}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-sky-500 ${
                  student.isActive
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Student Profile
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight truncate">
                {form.name || 'Student'}
              </h1>

              <p className="mt-1 text-cyan-50 text-sm sm:text-base break-all">
                {student.email}
              </p>

              {academy?.name && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-medium">
                  <School className="h-3.5 w-3.5" />
                  {academy.name}
                </div>
              )}
            </div>
          </div>

          <div className="hidden sm:block shrink-0">
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm border font-semibold ${
                  student.isActive
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
                    : 'bg-slate-500/20 border-slate-400/30 text-slate-100'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                {student.isActive ? 'Active' : 'Inactive'}
              </div>
              {student.classLevel && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {student.classLevel}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          IDENTITY (READ-ONLY)
      ============================================ */}

      <Card
        title="Identity"
        subtitle="Managed by your academy"
        icon={<User className="h-5 w-5" />}
      >
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <ReadOnlyField
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={student.email}
            tone="sky"
          />
          <ReadOnlyField
            icon={<School className="h-4 w-4" />}
            label="Academy"
            value={academy?.name || 'Not assigned'}
            tone="violet"
          />
          <ReadOnlyField
            icon={<Award className="h-4 w-4" />}
            label="Class Level"
            value={student.classLevel || 'Not assigned'}
            tone="emerald"
          />
          <ReadOnlyField
            icon={<Calendar className="h-4 w-4" />}
            label="Joined"
            value={formatDate(student.createdAt)}
            tone="amber"
          />
        </div>
      </Card>

      {/* ============================================
          PROFILE (EDITABLE)
      ============================================ */}

      <Card
        title="Profile"
        subtitle="Update your personal details"
        icon={<User className="h-5 w-5" />}
      >
        {/* Avatar upload */}
        <div className="mb-5 flex items-center gap-4 flex-wrap">
          <div className="relative shrink-0">
            {avatarPreview ? (
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreview}
                  alt={form.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                {initials}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <Camera className="h-3.5 w-3.5" />
              Upload Photo
            </button>
            {avatarPreview && avatarPreview !== student.imageUrl && (
              <button
                type="button"
                onClick={removeAvatar}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Name + Phone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel
              icon={<User className="h-3.5 w-3.5" />}
              label="Full Name"
            />
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your name"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <FieldLabel
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Phone"
            />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+92 300 0000000"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        {/* Info box */}
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-sky-50 border border-sky-100 p-3">
          <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-700 leading-relaxed">
            Your name, phone, and photo can be updated here. Email, class
            level, and academy are managed by your academy administrator.
          </p>
        </div>
      </Card>

      {/* ============================================
          STICKY SAVE BAR
      ============================================ */}

      <div
        className={`sticky bottom-4 z-20 rounded-2xl border p-4 shadow-lg backdrop-blur transition-all ${
          dirty
            ? 'border-sky-200 bg-white/95'
            : 'border-slate-200 bg-white/80'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${
                dirty
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {dirty ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                {dirty ? 'You have unsaved changes' : 'All changes saved'}
              </p>
              <p className="text-xs text-slate-500">
                {dirty
                  ? 'Click Save to update your profile'
                  : 'Your profile is up to date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================
          PRIVACY FOOTER
      ============================================ */}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">Security &amp; Privacy</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Your personal details are securely stored. Only your name,
              phone, and photo can be edited — the rest is managed by your
              academy to keep records consistent.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" />
                Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" />
                Secure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   Sub Components
   ====================================================== */

function Card({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-sm shrink-0">
          <span className="text-white">{icon}</span>
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function FieldLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
      <span className="text-slate-400">{icon}</span>
      {label}
    </label>
  );
}

function ReadOnlyField({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'sky' | 'violet' | 'emerald' | 'amber';
}) {
  const toneMap = {
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100' },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      ring: 'ring-violet-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      ring: 'ring-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      ring: 'ring-amber-100',
    },
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 h-9 w-9 rounded-xl ${toneMap.bg} ${toneMap.text} flex items-center justify-center ring-1 ${toneMap.ring}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5 break-all">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}