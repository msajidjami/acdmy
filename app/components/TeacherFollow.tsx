'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  teacherId: string;
  initialFollowing?: boolean;
  initialCount?: number;
  accentColor?: string;
  size?: 'sm' | 'md';
};

export default function TeacherFollow({
  teacherId,
  initialFollowing = false,
  initialCount = 0,
  accentColor = '#10b981',
  size = 'sm',
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/teachers/${teacherId}/follow`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (ignore) return;
        setFollowing(Boolean(data.following));
        setCount(Number(data.followerCount) || 0);
      } catch {}
    };
    load();
    return () => {
      ignore = true;
    };
  }, [teacherId]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);

    const prevF = following;
    const prevC = count;
    setFollowing(!following);
    setCount(following ? Math.max(0, count - 1) : count + 1);

    try {
      const res = await fetch(`/api/teachers/${teacherId}/follow`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        setFollowing(prevF);
        setCount(prevC);
        router.push(
          '/login?redirect=' + encodeURIComponent(window.location.pathname)
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setFollowing(prevF);
        setCount(prevC);
        return;
      }

      setFollowing(Boolean(data.following));
      setCount(Number(data.followerCount) || 0);
    } catch {
      setFollowing(prevF);
      setCount(prevC);
    } finally {
      setLoading(false);
    }
  };

  const pad = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`${pad} font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 inline-flex items-center justify-center gap-1.5 ${
        following
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
          : 'text-white shadow-md'
      }`}
      style={
        following
          ? undefined
          : {
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            }
      }
    >
      {following ? (
        <>
          <span>✓</span>
          <span>Following</span>
          {count > 0 && <span className="opacity-60">({count})</span>}
        </>
      ) : (
        <>
          <span>+</span>
          <span>Follow</span>
          {count > 0 && <span className="opacity-70">({count})</span>}
        </>
      )}
    </button>
  );
}