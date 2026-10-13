'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageCircle,
  Video,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bookmark,
  BookmarkCheck,
  Ban,
  Loader2,
  Check,
  GraduationCap,
  School,
  Users,
  AlertCircle,
} from 'lucide-react';

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  provider: string;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string | null;
  nickname: string;
  isSaved: boolean;
  targetBlockedMe: boolean;
  iBlockedTarget: boolean;
  academy: { name: string; slug: string } | null;
  teacher: { name: string; email: string; subjects: string[] } | null;
  student: { name: string; fatherName: string } | null;
};

const ROLE_LABELS: Record<string, { label: string; color: string; Icon: any }> = {
  admin: { label: 'Admin', color: 'bg-rose-100 text-rose-700', Icon: Shield },
  owner: { label: 'Academy Owner', color: 'bg-emerald-100 text-emerald-700', Icon: School },
  teacher: { label: 'Teacher', color: 'bg-sky-100 text-sky-700', Icon: GraduationCap },
  student: { label: 'Student', color: 'bg-violet-100 text-violet-700', Icon: Users },
  user: { label: 'User', color: 'bg-slate-100 text-slate-700', Icon: UserIcon },
};

export default function ProfileView({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [isSaved, setIsSaved] = useState(profile.isSaved);
  const [savingContact, setSavingContact] = useState(false);
  const [iBlocked, setIBlocked] = useState(profile.iBlockedTarget);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState('');

  const displayName = profile.name || profile.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleInfo =
    ROLE_LABELS[profile.role] || ROLE_LABELS.user;
  const RoleIcon = roleInfo.Icon;

  const subtitle = profile.isOnline
    ? 'Online'
    : profile.lastSeen
    ? `Last seen ${new Date(profile.lastSeen).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      })}`
    : '';

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  /* ---------- Save contact ---------- */
  const handleSaveContact = async () => {
    setSavingContact(true);
    setError('');
    try {
      const res = await fetch('/api/contacts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contactId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Failed to save contact');
        return;
      }
      setIsSaved(true);
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setSavingContact(false);
    }
  };

  /* ---------- Block toggle ---------- */
  const handleBlockToggle = async () => {
    setBlocking(true);
    setError('');
    try {
      if (iBlocked) {
        const res = await fetch(`/api/user/block?userId=${profile.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          setIBlocked(false);
          setBlockOpen(false);
        } else {
          setError('Failed to unblock');
        }
      } else {
        const res = await fetch('/api/user/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: profile.id }),
        });
        if (res.ok) {
          setIBlocked(true);
          setBlockOpen(false);
        } else {
          setError('Failed to block');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* ============================================
          HERO — مکمل سبز
          ============================================ */}
      <div className="rounded-2xl bg-emerald-700 text-white p-5 sm:p-6 shadow-lg shadow-emerald-700/25">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.avatar}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-lg"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-white text-emerald-700 border-2 border-white flex items-center justify-center font-bold text-2xl shadow-lg">
                {initials}
              </div>
            )}
            {profile.isOnline && (
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-emerald-700 bg-emerald-300" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold truncate">
                {profile.nickname || displayName}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleInfo.color}`}
              >
                <RoleIcon className="h-3 w-3" />
                {roleInfo.label}
              </span>
            </div>

            {subtitle && (
              <p className="text-xs opacity-85 mt-1 truncate">{subtitle}</p>
            )}

            {profile.nickname && profile.name && profile.nickname !== profile.name && (
              <p className="text-xs opacity-70 mt-0.5 truncate">
                ({profile.name})
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {/* Message */}
          {!iBlocked && !profile.targetBlockedMe && (
            <Link
              href={`/contacts/${profile.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-50 transition shadow-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </Link>
          )}

          {/* Save contact */}
          {!isSaved ? (
            <button
              type="button"
              onClick={handleSaveContact}
              disabled={savingContact}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/50 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 border border-white/20"
            >
              {savingContact ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {savingContact ? 'Saving…' : 'Save contact'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/30">
              <BookmarkCheck className="h-4 w-4" />
              Saved
            </span>
          )}

          {/* Block */}
          <button
            type="button"
            onClick={() => setBlockOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/50 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition border border-white/20"
          >
            <Ban className="h-4 w-4" />
            {iBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Blocked banner */}
      {iBlocked && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
          <Ban className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">
            You blocked this user. Unblock to message them.
          </span>
        </div>
      )}

      {profile.targetBlockedMe && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-900">
          <Ban className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">
            This user has blocked you. You cannot message them.
          </span>
        </div>
      )}

      {/* ============================================
          CONTACT INFO
          ============================================ */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
        <header className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <UserIcon className="h-3.5 w-3.5 text-white" />
          </span>
          <h2 className="text-sm font-bold text-slate-900">Contact info</h2>
        </header>

        <div className="divide-y divide-slate-100">
          {profile.email && (
            <InfoRow icon={Mail} label="Email" value={profile.email} />
          )}
          {profile.phone && (
            <InfoRow
              icon={Phone}
              label="Phone"
              value={formatPhone(profile.phone)}
            />
          )}
          {memberSince && (
            <InfoRow
              icon={Calendar}
              label="Member since"
              value={memberSince}
            />
          )}
        </div>
      </section>

      {/* ============================================
          ACADEMY (اگر owner ہے)
          ============================================ */}
      {profile.academy && (
        <section className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
          <header className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <School className="h-3.5 w-3.5 text-white" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Academy</h2>
          </header>

          <Link
            href={`/academy/${profile.academy.slug}`}
            className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <School className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {profile.academy.name}
              </p>
              <p className="text-xs text-slate-500">View academy →</p>
            </div>
          </Link>
        </section>
      )}

      {/* ============================================
          TEACHER (اگر teacher ہے)
          ============================================ */}
      {profile.teacher && (
        <section className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
          <header className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Teacher</h2>
          </header>

          {profile.teacher.subjects.length > 0 && (
            <div className="px-4 sm:px-5 py-3.5">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Subjects
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.teacher.subjects.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================
          STUDENT (اگر student ہے)
          ============================================ */}
      {profile.student && (
        <section className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
          <header className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-white" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Student</h2>
          </header>

          {profile.student.fatherName && (
            <div className="px-4 sm:px-5 py-3.5">
              <p className="text-xs font-semibold text-slate-500 mb-0.5">
                Father&apos;s name
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {profile.student.fatherName}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ============================================
          BLOCK CONFIRM MODAL
          ============================================ */}
      {blockOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !blocking && setBlockOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                    iBlocked ? 'bg-emerald-100' : 'bg-rose-100'
                  }`}
                >
                  <Ban
                    className={`h-6 w-6 ${
                      iBlocked ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {iBlocked ? 'Unblock user?' : 'Block user?'}
                  </h2>
                  <p className="text-sm text-slate-500">{displayName}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                {iBlocked
                  ? 'They will be able to message you again.'
                  : "They won't be able to message you, and this contact will be removed from your list."}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBlockOpen(false)}
                  disabled={blocking}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBlockToggle}
                  disabled={blocking}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
                    iBlocked
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {blocking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Working…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {iBlocked ? 'Unblock' : 'Block'}
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
   Small components
   ============================================================ */

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
      <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-emerald-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

/* WhatsApp-style phone formatting */
function formatPhone(raw: string): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return raw;

  let local = digits;
  if (local.startsWith('0092')) local = local.slice(4);
  else if (local.startsWith('92')) local = local.slice(2);
  else if (local.startsWith('0')) local = local.slice(1);

  if (local.length === 10) {
    return `+92 ${local.slice(0, 3)} ${local.slice(3)}`;
  }
  return raw.startsWith('+') ? raw : `+${digits}`;
}