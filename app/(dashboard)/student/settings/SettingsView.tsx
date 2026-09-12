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
  ShieldCheck,
  Bell,
  Volume2,
  Video,
  Palette,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Loader2,
  KeyRound,
  Info,
  Eye,
  EyeOff,
  LogOut,
  Activity,
  Upload,
  Trash2,
  Camera,
  Zap,
  ExternalLink,
  RefreshCw,
  Hash,
  IdCard,
  CircleDot,
  Calendar,
  Lock,
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
};

type AcademyData = { _id: string; name: string } | null;

type ZoomData = {
  _id: string;
  zoomConnected: boolean;
  zoomUserId: string;
  zoomAccountId: string;
  zoomEmail: string;
  connectedAt: string | null;
} | null;

type Props = {
  student: StudentData;
  academy: AcademyData;
  initials: string;
  zoom: ZoomData;
  zoomStatus: string;
  zoomMessage: string;
};

type Preferences = {
  emailNotifications: boolean;
  classReminders: boolean;
  soundAlerts: boolean;
  autoJoinPrompt: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  emailNotifications: true,
  classReminders: true,
  soundAlerts: true,
  autoJoinPrompt: true,
  reducedMotion: false,
  compactMode: false,
};

/* ======================================================
   Component
   ====================================================== */

export default function SettingsView({
  student,
  academy,
  initials,
  zoom,
  zoomStatus,
  zoomMessage,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: student.name,
    phone: student.phone,
  });

  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(student.imageUrl);

  const isZoomConnected = Boolean(zoom?.zoomConnected);

  /* ---------- Load saved preferences ---------- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem('student-preferences');
      if (raw) {
        const parsed = JSON.parse(raw);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ---------- Dirty check ---------- */

  const dirty = useMemo(() => {
    return (
      form.name.trim() !== student.name ||
      form.phone.trim() !== student.phone ||
      avatarPreview !== student.imageUrl
    );
  }, [form, student, avatarPreview]);

  /* ---------- Profile save ---------- */

  const handleSaveProfile = async () => {
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
        throw new Error(data?.error || 'Failed to save settings');
      }

      toast.success('Settings updated');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetProfile = () => {
    setForm({ name: student.name, phone: student.phone });
    setAvatarPreview(student.imageUrl);
    toast.success('Changes reverted');
  };

  /* ---------- Preferences ---------- */

  const togglePreference = (key: keyof Preferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('student-preferences', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    toast.success('Preference saved');
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.setItem(
        'student-preferences',
        JSON.stringify(DEFAULT_PREFERENCES)
      );
    } catch {
      /* ignore */
    }
    toast.success('Preferences reset to default');
  };

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

  /* ---------- Password change ---------- */

  const handlePasswordChange = async () => {
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.next.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  /* ---------- Logout ---------- */

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
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
                Student Settings
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
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm border font-semibold ${
                  isZoomConnected
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
                    : 'bg-amber-500/20 border-amber-400/30 text-amber-100'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                Zoom {isZoomConnected ? 'Ready' : 'Setup'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          ZOOM CALLBACK — Success
      ============================================ */}

      {zoomStatus === 'connected' && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-emerald-900">
                Zoom Successfully Connected
              </h2>
              <p className="mt-1 text-sm text-emerald-700 leading-relaxed">
                Your Zoom account is now linked. You can join classes with
                your own Zoom identity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          ZOOM CALLBACK — Error
      ============================================ */}

      {zoomStatus === 'error' && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-md shadow-rose-500/30">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-rose-900">
                Zoom Connection Failed
              </h2>
              <p className="mt-1 break-words text-sm text-rose-700 leading-relaxed">
                {zoomMessage || 'An error occurred while connecting Zoom.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          ZOOM INTEGRATION CARD
      ============================================ */}

      {academy && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Header — gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 p-6 text-white">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/40 blur-3xl" />
            </div>

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg">
                  <Video className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
                    <Zap className="h-3 w-3" />
                    Zoom Integration
                  </div>
                  <h2 className="mt-2 text-xl font-bold">Zoom Classroom</h2>
                  <p className="mt-1 text-sm text-cyan-100">
                    Connect Zoom to join classes with your own identity.
                  </p>
                </div>
              </div>

              {isZoomConnected ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-100 text-xs font-bold uppercase tracking-wider w-fit">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 text-amber-100 text-xs font-bold uppercase tracking-wider w-fit">
                  <CircleDot className="h-3 w-3" />
                  Not Connected
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6">
            {!isZoomConnected ? (
              /* ----------------------------------------
                 NOT CONNECTED STATE
              ---------------------------------------- */
              <div className="space-y-5">
                {/* Instructions */}
                <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-md shadow-sky-500/30">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sky-900">
                        Before you connect
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-sky-800">
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                          <span>
                            Your Zoom account must already be signed in on
                            this device.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                          <span>
                            Your Zoom account email must match the email you
                            used to sign in to this website.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2">
                  <FeaturePill
                    icon={<Video className="h-3.5 w-3.5" />}
                    label="HD Video"
                    tone="sky"
                  />
                  <FeaturePill
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    label="Personal Identity"
                    tone="violet"
                  />
                  <FeaturePill
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    label="Secure OAuth"
                    tone="emerald"
                  />
                </div>

                {/* CTA */}
                <div>
                  <a
                    href="/api/zoom/connect?role=student"
                    className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all"
                  >
                    <Video className="h-4 w-4" />
                    Connect Zoom Account
                    <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3" />
                    You will be redirected to the Zoom authorization page.
                  </p>
                </div>
              </div>
            ) : (
              /* ----------------------------------------
                 CONNECTED STATE
              ---------------------------------------- */
              <div className="space-y-5">
                {/* Success banner */}
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-emerald-900">
                        Zoom is connected
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        Your Zoom account is ready. When you join a class,
                        you will appear with your own Zoom identity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zoom Details Grid */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <DetailTile
                    icon={<Mail className="h-4 w-4" />}
                    label="Zoom Account Email"
                    value={zoom?.zoomEmail || 'Not available'}
                    tone="sky"
                    breakAll
                  />

                  <DetailTile
                    icon={<IdCard className="h-4 w-4" />}
                    label="Zoom User ID"
                    value={zoom?.zoomUserId || 'Not available'}
                    tone="violet"
                    mono
                    breakAll
                  />

                  <DetailTile
                    icon={<Hash className="h-4 w-4" />}
                    label="Zoom Account ID"
                    value={zoom?.zoomAccountId || 'Not available'}
                    tone="cyan"
                    mono
                    breakAll
                  />

                  <DetailTile
                    icon={<Calendar className="h-4 w-4" />}
                    label="Connected Since"
                    value={
                      zoom?.connectedAt
                        ? new Date(zoom.connectedAt).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )
                        : 'N/A'
                    }
                    tone="emerald"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/api/zoom/connect?role=student"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-200 bg-sky-50 hover:bg-sky-100 hover:border-sky-300 px-5 py-3 text-sm font-bold text-sky-700 transition"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reconnect Zoom
                  </a>

                  <a
                    href="/student/schedule"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-3 text-sm font-bold text-white transition"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Go to Schedule
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================
          ACCOUNT INFO (READ-ONLY)
      ============================================ */}

      <Card
        title="Account Information"
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
            icon={<GraduationCap className="h-4 w-4" />}
            label="Class Level"
            value={student.classLevel || 'Not assigned'}
            tone="emerald"
          />
          <ReadOnlyField
            icon={<Activity className="h-4 w-4" />}
            label="Status"
            value={student.isActive ? 'Active' : 'Inactive'}
            tone={student.isActive ? 'emerald' : 'rose'}
          />
        </div>
      </Card>

      {/* ============================================
          PROFILE
      ============================================ */}

      <Card
        title="Profile"
        subtitle="Update your personal details"
        icon={<User className="h-5 w-5" />}
      >
        <div className="mb-5 flex items-center gap-4">
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

        <div
          className={`mt-5 rounded-2xl border p-4 transition-all ${
            dirty
              ? 'border-sky-200 bg-sky-50/40'
              : 'border-slate-200 bg-slate-50/60'
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
                onClick={handleResetProfile}
                disabled={!dirty || saving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
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
      </Card>

      {/* ============================================
          PREFERENCES
      ============================================ */}

      <Card
        title="Preferences"
        subtitle="Customize your experience"
        icon={<Bell className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <ToggleRow
            icon={<Mail className="h-4 w-4" />}
            label="Email Notifications"
            description="Receive updates about your classes via email"
            tone="sky"
            checked={preferences.emailNotifications}
            onToggle={() => togglePreference('emailNotifications')}
          />
          <ToggleRow
            icon={<Bell className="h-4 w-4" />}
            label="Class Reminders"
            description="Get notified before your classes start"
            tone="violet"
            checked={preferences.classReminders}
            onToggle={() => togglePreference('classReminders')}
          />
          <ToggleRow
            icon={<Volume2 className="h-4 w-4" />}
            label="Sound Alerts"
            description="Play a sound when a class is about to start"
            tone="amber"
            checked={preferences.soundAlerts}
            onToggle={() => togglePreference('soundAlerts')}
          />
          <ToggleRow
            icon={<Video className="h-4 w-4" />}
            label="Auto-Join Prompt"
            description="Ask to join when a live class begins"
            tone="emerald"
            checked={preferences.autoJoinPrompt}
            onToggle={() => togglePreference('autoJoinPrompt')}
          />
          <ToggleRow
            icon={<Monitor className="h-4 w-4" />}
            label="Reduced Motion"
            description="Minimize animations across the interface"
            tone="slate"
            checked={preferences.reducedMotion}
            onToggle={() => togglePreference('reducedMotion')}
          />
          <ToggleRow
            icon={<Palette className="h-4 w-4" />}
            label="Compact Mode"
            description="Show more content with tighter spacing"
            tone="slate"
            checked={preferences.compactMode}
            onToggle={() => togglePreference('compactMode')}
          />
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={resetPreferences}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </button>
        </div>
      </Card>

      {/* ============================================
          SECURITY — Change Password
      ============================================ */}

      <Card
        title="Security"
        subtitle="Change your password"
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div>
            <FieldLabel
              icon={<KeyRound className="h-3.5 w-3.5" />}
              label="Current Password"
            />
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.current}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current: e.target.value })
                }
                placeholder="Enter current password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-11 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel
                icon={<KeyRound className="h-3.5 w-3.5" />}
                label="New Password"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.next}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, next: e.target.value })
                }
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <FieldLabel
                icon={<KeyRound className="h-3.5 w-3.5" />}
                label="Confirm Password"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.confirm}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirm: e.target.value })
                }
                placeholder="Re-enter new password"
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-100 p-3">
            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Password must be at least 8 characters. Use a mix of letters,
              numbers, and symbols for better security.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePasswordChange}
            disabled={passwordSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-60"
          >
            {passwordSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5" />
                Change Password
              </>
            )}
          </button>
        </div>
      </Card>

      {/* ============================================
          SESSION / LOGOUT
      ============================================ */}

      <Card
        title="Session"
        subtitle="Manage your current session"
        icon={<LogOut className="h-5 w-5" />}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-md shadow-rose-500/30">
              <LogOut className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-rose-900">
                Sign out of this device
              </p>
              <p className="text-xs text-rose-700">
                You will need to log in again to access your account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/25 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </Card>

      {/* ============================================
          PRIVACY FOOTER
      ============================================ */}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">
              Security &amp; Privacy
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Zoom OAuth access and refresh tokens are never exposed to the
              browser. They are stored securely on the server. Your personal
              data is encrypted end-to-end.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" />
                Server-side tokens
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" />
                OAuth 2.0
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                <KeyRound className="h-3 w-3" />
                Encrypted
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
  tone: 'sky' | 'violet' | 'emerald' | 'rose';
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
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
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

function DetailTile({
  icon,
  label,
  value,
  tone,
  mono,
  breakAll,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'sky' | 'violet' | 'cyan' | 'emerald';
  mono?: boolean;
  breakAll?: boolean;
}) {
  const toneMap = {
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-100',
    },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      border: 'border-violet-100',
    },
    cyan: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-600',
      border: 'border-cyan-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
  }[tone];

  return (
    <div
      className={`rounded-2xl border ${toneMap.border} bg-white p-4 hover:shadow-md transition-all`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className={`h-7 w-7 rounded-lg ${toneMap.bg} ${toneMap.text} flex items-center justify-center`}
        >
          {icon}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p
        className={`text-sm font-semibold text-slate-900 ${
          mono ? 'font-mono' : ''
        } ${breakAll ? 'break-all' : 'truncate'}`}
      >
        {value}
      </p>
    </div>
  );
}

function FeaturePill({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'sky' | 'violet' | 'emerald';
}) {
  const toneMap = {
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${toneMap} text-xs font-semibold`}
    >
      {icon}
      {label}
    </span>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  tone,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  tone: 'sky' | 'violet' | 'amber' | 'emerald' | 'slate';
  checked: boolean;
  onToggle: () => void;
}) {
  const toneMap = {
    sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  }[tone];

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`shrink-0 h-10 w-10 rounded-xl ${toneMap.bg} ${toneMap.text} flex items-center justify-center`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={label}
        className={`relative shrink-0 inline-flex h-7 w-12 rounded-full transition-colors ${
          checked ? 'bg-sky-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform mt-1 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}