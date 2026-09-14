'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Props = {
  slug: string;
  initialFollowing?: boolean;
  initialCount?: number;
  accentColor?: string;
  size?: 'sm' | 'md';
};

export default function FollowButton({
  slug,
  initialFollowing = false,
  initialCount = 0,
  accentColor = '#10b981',
  size = 'md',
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ✅ ہر mount پر fresh state لیں */
  useEffect(() => {
    let ignore = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/academies/${slug}/follow`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) {
          setFollowing(Boolean(data.following));
          setCount(Number(data.followerCount) || 0);
        }
      } catch {
        /* silent */
      }
    };

    fetchStatus();
    return () => {
      ignore = true;
    };
  }, [slug]);

  const toggle = async () => {
    if (loading) return;
    setError('');
    setLoading(true);

    /* Optimistic update */
    const prevFollowing = following;
    const prevCount = count;
    setFollowing(!following);
    setCount(following ? Math.max(0, count - 1) : count + 1);

    try {
      const res = await fetch(`/api/academies/${slug}/follow`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        /* لاگ ان نہیں — login پیج پر بھیجیں */
        setFollowing(prevFollowing);
        setCount(prevCount);
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setFollowing(prevFollowing);
        setCount(prevCount);
        setError(data.error || 'Failed');
        return;
      }

      setFollowing(Boolean(data.following));
      setCount(Number(data.followerCount) || 0);
    } catch {
      setFollowing(prevFollowing);
      setCount(prevCount);
      setError('Network error');
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
          : 'text-white shadow-md hover:shadow-lg'
      }`}
      style={
        following
          ? undefined
          : { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }
      }
      title={error || undefined}
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