'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { UserPlusIcon, UserMinusIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function FollowButton({
  slug,
  initialFollowing = false,
  initialCount = 0,
  disabled = false,
}: {
  slug: string;
  initialFollowing?: boolean;
  initialCount?: number;
  disabled?: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/academy/${slug}/follow`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to follow');
      }

      setIsFollowing(Boolean(data.isFollowing));
      setCount(Number(data.followerCount) || 0);

      toast.success(data.isFollowing ? 'Following!' : 'Unfollowed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle follow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 ${
        isFollowing
          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
          : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/25'
      }`}
    >
      {isFollowing ? (
        <>
          <CheckIcon className="h-4 w-4" />
          Following · {count}
        </>
      ) : (
        <>
          <UserPlusIcon className="h-4 w-4" />
          Follow · {count}
        </>
      )}
    </button>
  );
}