'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  teacherId: string;
  initialAvg?: number;
  initialCount?: number;
  accentColor?: string;
};

export default function TeacherRating({
  teacherId,
  initialAvg = 0,
  initialCount = 0,
  accentColor = '#10b981',
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

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/teachers/${teacherId}/rate`, {
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
      } catch {}
    };
    load();
    return () => {
      ignore = true;
    };
  }, [teacherId]);

  const submit = async (stars: number) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/rate`, {
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
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const display = hover || yourStars || Math.round(avg);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`text-lg ${
                i <= Math.round(avg) ? 'text-amber-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-xs font-bold text-gray-900">
          {avg.toFixed(1)}
        </span>
        <span className="text-[11px] text-gray-500">
          ({count} {count === 1 ? 'rating' : 'ratings'})
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left text-xs font-semibold text-gray-700 hover:text-emerald-600 transition flex items-center justify-between"
      >
        <span>
          {yourStars > 0 ? `Your rating: ${yourStars}★ (edit)` : 'Tap to rate'}
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => submit(i)}
                disabled={loading}
                className="text-2xl transition hover:scale-110 disabled:opacity-50"
              >
                <span
                  className={i <= display ? 'text-amber-400' : 'text-gray-300'}
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
            placeholder="Optional comment..."
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />

          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-[10px] text-gray-500">
              {comment.length}/500
            </span>
            <button
              type="button"
              onClick={() => yourStars && submit(yourStars)}
              disabled={loading || !yourStars}
              className="px-2.5 py-1 text-[11px] font-bold text-white rounded-lg disabled:opacity-50"
              style={{ background: accentColor }}
            >
              {loading ? 'Saving...' : yourStars ? 'Update' : 'Pick stars'}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-[11px] text-red-600 font-medium">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}