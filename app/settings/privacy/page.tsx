'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Privacy = {
  allowMessagesFrom: 'everyone' | 'contacts' | 'nobody';
  discoverable: boolean;
  blockedCount: number;
};

type BlockedUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string | null;
};

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [privacy, setPrivacy] = useState<Privacy | null>(null);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, bRes] = await Promise.all([
          fetch('/api/user/privacy', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/user/block', { credentials: 'include', cache: 'no-store' }),
        ]);

        if (pRes.status === 401) {
          router.replace('/login');
          return;
        }

        const pData = await pRes.json();
        const bData = await bRes.json();

        if (pData?.success) setPrivacy(pData.privacy);
        if (bData?.success) setBlocked(bData.blocked || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const save = async (updates: Partial<Privacy>) => {
    if (!privacy) return;
    setSaving(true);
    setSaved(false);
    try {
      const next = { ...privacy, ...updates };
      setPrivacy(next);

      const res = await fetch('/api/user/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if ((await res.json())?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const unblock = async (userId: string) => {
    const res = await fetch(`/api/user/block?userId=${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
      setPrivacy((p) =>
        p ? { ...p, blockedCount: Math.max(0, p.blockedCount - 1) } : p
      );
    }
  };

  if (loading || !privacy) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  const options: Array<{
    value: Privacy['allowMessagesFrom'];
    label: string;
    desc: string;
    icon: string;
  }> = [
    { value: 'everyone', label: 'Everyone', desc: 'Anyone on the platform can message you', icon: '🌍' },
    { value: 'contacts', label: 'My contacts only', desc: 'Only people you have saved can message you', icon: '👥' },
    { value: 'nobody', label: 'Nobody', desc: 'No one can send you new messages', icon: '🚫' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Privacy</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Control who can message and find you
          </p>
        </div>
        {saved && <span className="text-sm text-emerald-600 font-medium">Saved ✓</span>}
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h2 className="text-base font-bold text-slate-800 mb-3">Who can message me?</h2>
        <div className="space-y-2">
          {options.map((opt) => {
            const active = privacy.allowMessagesFrom === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={saving}
                onClick={() => save({ allowMessagesFrom: opt.value })}
                className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">{opt.label}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{opt.desc}</span>
                </span>
                <span
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                  }`}
                >
                  {active && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            <h2 className="text-base font-bold text-slate-800">Find me on search</h2>
            <p className="text-xs text-slate-500 mt-1">
              Allow others to discover you by phone or email
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => save({ discoverable: !privacy.discoverable })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              privacy.discoverable ? 'bg-emerald-500' : 'bg-slate-300'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                privacy.discoverable ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800">Blocked users</h2>
          <span className="text-xs text-slate-500">
            {blocked.length} {blocked.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        {blocked.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">You haven't blocked anyone</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {blocked.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                    {(u.name || u.email || '?')[0].toUpperCase()}
                  </div>
                  {u.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {u.name || u.email || u.phone || 'Unknown'}
                  </p>
                  {u.email && (
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => unblock(u.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}