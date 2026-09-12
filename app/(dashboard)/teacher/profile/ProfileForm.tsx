'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  School,
  BookOpen,
  FileText,
  Video,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Sparkles,
  Plus,
  X,
  Activity,
  Award,
  Briefcase,
  Mic,
  Upload,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react';

/* ======================================================
   Types
   ====================================================== */

type TeacherData = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  bio: string;
  isAvailable: boolean;
  audioUrl: string;
  experience: string;
  qualification: string;
};

type AcademyData = { _id: string; name: string } | null;

type Props = {
  teacher: TeacherData;
  academy: AcademyData;
};

/* ======================================================
   Helpers
   ====================================================== */

function getInitials(name: string): string {
  if (!name) return 'T';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

const SUGGESTED_SUBJECTS = [
  'Quran',
  'Tajweed',
  'Hifz',
  'Arabic',
  'Hadith',
  'Fiqh',
  'Islamic Studies',
  'Urdu',
  'English',
  'Mathematics',
  'Science',
  'Computer',
];

/* ======================================================
   Component
   ====================================================== */

export default function ProfileForm({ teacher, academy }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<TeacherData>(teacher);
  const [saving, setSaving] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioUploading, setAudioUploading] = useState(false);

  const initials = getInitials(form.name);

  const dirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(teacher);
  }, [form, teacher]);

  /* ---------- Field helpers ---------- */

  const update = <K extends keyof TeacherData>(
    key: K,
    value: TeacherData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const addSubject = (sub: string) => {
    const trimmed = sub.trim();
    if (!trimmed) return;
    if (form.subjects.includes(trimmed)) {
      toast.error('Subject already added');
      return;
    }
    if (form.subjects.length >= 12) {
      toast.error('Maximum 12 subjects allowed');
      return;
    }
    update('subjects', [...form.subjects, trimmed]);
    setSubjectInput('');
  };

  const removeSubject = (sub: string) => {
    update(
      'subjects',
      form.subjects.filter((s) => s !== sub)
    );
  };

  /* ---------- Audio upload (local file → data URL) ---------- */

  const handleAudioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please choose an audio file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Audio file must be under 5 MB');
      return;
    }

    setAudioUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        update('audioUrl', String(reader.result || ''));
        setAudioUploading(false);
        toast.success('Audio loaded. Save to keep it.');
      };
      reader.onerror = () => {
        toast.error('Failed to read audio file');
        setAudioUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to process audio file');
      setAudioUploading(false);
    }
  };

  const clearAudio = () => {
    update('audioUrl', '');
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  /* ---------- Save ---------- */

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (form.subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          subjects: form.subjects,
          bio: form.bio.trim(),
          isAvailable: form.isAvailable,
          audioUrl: form.audioUrl,
          experience: form.experience.trim(),
          qualification: form.qualification.trim(),
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
    setForm(teacher);
    if (audioInputRef.current) audioInputRef.current.value = '';
    toast.success('Changes reverted');
  };

  /* ---------- Warn on leave ---------- */

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  /* ======================================================
     Render
     ====================================================== */

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============================================
          HERO HEADER
      ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-2xl shadow-purple-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-xl">
                {initials}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-indigo-600 ${
                  form.isAvailable
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Teacher Profile
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight truncate">
                {form.name || 'Teacher'}
              </h1>

              <p className="mt-1 text-indigo-100 text-sm sm:text-base break-all">
                {form.email}
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
                  form.isAvailable
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
                    : 'bg-slate-500/20 border-slate-400/30 text-slate-100'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                {form.isAvailable ? 'Active' : 'Inactive'}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 font-semibold">
                <BookOpen className="h-3.5 w-3.5" />
                {form.subjects.length} Subject
                {form.subjects.length !== 1 ? 's' : ''}
              </div>
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
            value={form.email}
            tone="sky"
          />
          <ReadOnlyField
            icon={<School className="h-4 w-4" />}
            label="Academy"
            value={academy?.name || 'Not assigned'}
            tone="violet"
          />
        </div>
      </Card>

      {/* ============================================
          BASIC INFO
      ============================================ */}

      <Card
        title="Basic Information"
        subtitle="Update your personal details"
        icon={<User className="h-5 w-5" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <FieldLabel icon={<User className="h-3.5 w-3.5" />} label="Full Name" />
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Enter your full name"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Phone */}
          <div>
            <FieldLabel icon={<Phone className="h-3.5 w-3.5" />} label="Phone" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+92 300 0000000"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Qualification */}
          <div>
            <FieldLabel
              icon={<Award className="h-3.5 w-3.5" />}
              label="Qualification"
            />
            <input
              type="text"
              value={form.qualification}
              onChange={(e) => update('qualification', e.target.value)}
              placeholder="e.g. Hafiz, Alim, MA Islamiat"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Experience */}
          <div>
            <FieldLabel
              icon={<Briefcase className="h-3.5 w-3.5" />}
              label="Experience"
            />
            <input
              type="text"
              value={form.experience}
              onChange={(e) => update('experience', e.target.value)}
              placeholder="e.g. 5 years of teaching"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Availability */}
        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${
                form.isAvailable
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Available for classes
              </p>
              <p className="text-xs text-slate-500">
                {form.isAvailable
                  ? 'You are currently accepting assignments'
                  : 'You are currently not accepting assignments'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => update('isAvailable', !form.isAvailable)}
            className={`relative shrink-0 inline-flex h-7 w-12 rounded-full transition-colors ${
              form.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            aria-pressed={form.isAvailable}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform mt-1 ${
                form.isAvailable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* ============================================
          SUBJECTS
      ============================================ */}

      <Card
        title="Subjects"
        subtitle="Choose what you teach"
        icon={<BookOpen className="h-5 w-5" />}
      >
        {/* Selected subjects */}
        {form.subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {form.subjects.map((sub) => (
              <span
                key={sub}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 text-xs font-bold"
              >
                <BookOpen className="h-3 w-3" />
                {sub}
                <button
                  type="button"
                  onClick={() => removeSubject(sub)}
                  className="ml-0.5 h-4 w-4 rounded-full bg-white/60 hover:bg-rose-100 text-indigo-500 hover:text-rose-600 flex items-center justify-center transition"
                  title="Remove"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-xs text-slate-400 italic">
            No subjects added yet.
          </p>
        )}

        {/* Add custom */}
        <div className="flex gap-2">
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSubject(subjectInput);
              }
            }}
            placeholder="Add a subject (press Enter)"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={() => addSubject(subjectInput)}
            disabled={!subjectInput.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Suggestions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SUBJECTS.filter(
              (s) => !form.subjects.includes(s)
            ).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => addSubject(sub)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 text-[11px] font-semibold transition"
              >
                <Plus className="h-2.5 w-2.5" />
                {sub}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ============================================
          BIO
      ============================================ */}

      <Card
        title="About You"
        subtitle="A short introduction visible to your academy"
        icon={<FileText className="h-5 w-5" />}
      >
        <textarea
          value={form.bio}
          onChange={(e) => update('bio', e.target.value)}
          placeholder="Write a short bio — your teaching style, background, and approach..."
          rows={5}
          maxLength={800}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
        />
        <p className="mt-2 text-[10px] text-slate-400 text-right">
          {form.bio.length} / 800 characters
        </p>
      </Card>

      {/* ============================================
          AUDIO INTRODUCTION
      ============================================ */}

      <Card
        title="Audio Introduction"
        subtitle="An optional voice note that students can hear"
        icon={<Mic className="h-5 w-5" />}
      >
        {form.audioUrl ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="shrink-0 h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-emerald-900">
                    Audio loaded
                  </p>
                  <p className="text-xs text-emerald-700">
                    Listen below and save to keep it.
                  </p>
                </div>
              </div>
              <audio controls src={form.audioUrl} className="w-full h-10">
                Your browser does not support audio playback.
              </audio>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <Upload className="h-3.5 w-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={clearAudio}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
              <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <Mic className="h-7 w-7 text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                No audio yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Upload an audio file (MP3, WAV, etc.) up to 5 MB.
              </p>
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={audioUploading}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 transition disabled:opacity-60"
              >
                {audioUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Choose Audio
                  </>
                )}
              </button>
            </div>

            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
          </div>
        )}
      </Card>

      {/* ============================================
          SAVE BAR (sticky bottom)
      ============================================ */}

      <div
        className={`sticky bottom-4 z-20 rounded-2xl border p-4 shadow-lg backdrop-blur transition-all ${
          dirty
            ? 'border-indigo-200 bg-white/95'
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
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
  tone: 'sky' | 'violet';
}) {
  const toneMap = {
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      ring: 'ring-sky-100',
    },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      ring: 'ring-violet-100',
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