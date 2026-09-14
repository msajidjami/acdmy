'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Props = {
  slug: string;
  initialAvg?: number;
  initialCount?: number;
  accentColor?: string;
  compact?: boolean; /* کارڈ پر چھوٹا دکھانے کے لیے */
};

export default function RatingStars({
  slug,
  initialAvg = 0,
  initialCount = 0,
  accentColor = '#10b981',
  compact = false,
}: Props) {
  const router = useRouter();

  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [yourStars, setYourStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* Fresh data لوڈ کریں */
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/academies/${slug}/rate`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (ignore) return;
        setAvg(Number(data.avgRating) || 0);
        setCount(Number(data.ratingCount) || 0);
        if (data.yourRating?.stars) {
          setYourStars(Number(data.yourRating.stars));
          setComment(data.yourRating.comment || '');
        }
      } catch {
        /* silent */
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [slug]);

  const submit = async (stars: number) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/academies/${slug}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ stars, comment }),
      });

      if (res.status === 401) {
        router.push(
          '/login?redirect=' + encodeURIComponent(window.location.pathname)
        );
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed');
        return;
      }

      setYourStars(stars);
      setAvg(Number(data.avgRating) || 0);
      setCount(Number(data.ratingCount) || 0);
      setSuccess(data.updated ? 'Rating updated!' : 'Thanks for rating!');
      setTimeout(() => setSuccess(''), 2500);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const display = hover || yourStars || Math.round(avg);

  /* ✅ Compact موڈ — کارڈ پر صرف اوسط دکھائیں */
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
        <span className="text-amber-400">★</span>
        <span>{avg.toFixed(1)}</span>
        {count > 0 && <span className="opacity-70">({count})</span>}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* اوسط rating دکھائیں */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`text-2xl transition ${
                i <= Math.round(avg) ? 'text-amber-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-sm font-bold text-gray-900">
          {avg.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">
          ({count} {count === 1 ? 'rating' : 'ratings'})
        </span>
      </div>

      {/* Your rating */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left text-sm font-semibold text-gray-700 hover:text-emerald-600 transition flex items-center justify-between"
      >
        <span>
          {yourStars > 0
            ? `Your rating: ${yourStars} ★ (click to edit)`
            : 'Tap to rate this academy'}
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => submit(i)}
                disabled={loading}
                className="text-3xl transition hover:scale-110 disabled:opacity-50"
                aria-label={`Rate ${i} stars`}
              >
                <span
                  className={
                    i <= display ? 'text-amber-400' : 'text-gray-300'
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Optional: leave a short comment..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />

          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-[10px] text-gray-500">
              {comment.length}/500
            </span>
            <button
              type="button"
              onClick={() => yourStars && submit(yourStars)}
              disabled={loading || !yourStars}
              className="px-3 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-50"
              style={{ background: accentColor }}
            >
              {loading ? 'Saving...' : yourStars ? 'Update comment' : 'Pick stars above'}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>
          )}
          {success && (
            <p className="mt-2 text-xs text-emerald-600 font-medium">
              {success}
            </p>
          )}
        </div>
      )}
    </div>
  );
}