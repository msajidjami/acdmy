'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import StarInput from './StarInput';

export default function RatingForm({
  slug,
  initialRating = 0,
  initialComment = '',
  disabled = false,
  onSubmitted,
}: {
  slug: string;
  initialRating?: number;
  initialComment?: string;
  disabled?: boolean;
  onSubmitted?: (avg: number, count: number) => void;
}) {
  const [stars, setStars] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(!initialRating);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/academy/${slug}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stars, comment: comment.trim() }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to submit');
      }

      toast.success(data.updated ? 'Rating updated!' : 'Thanks for rating!');
      setSubmitted(true);
      setEditing(false);
      onSubmitted?.(Number(data.avgRating) || 0, Number(data.ratingCount) || 0);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  /* Confirmation view */
  if (submitted && !editing) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-800">
            Your rating: {stars} star{stars > 1 ? 's' : ''}
          </p>
          {comment && (
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              {comment}
            </p>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
          >
            <PencilSquareIcon className="h-3 w-3" />
            Edit rating
          </button>
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-500">
          Only students can rate this academy.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/40 to-white p-4 space-y-3"
    >
      <div className="flex flex-col items-center gap-2 py-2">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Rate this academy
        </p>
        <StarInput
          value={stars}
          onChange={setStars}
          size={36}
          disabled={loading}
        />
        {stars > 0 && (
          <p className="text-[11px] text-amber-700 font-semibold">
            {stars} star{stars > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Share your experience (optional)"
          disabled={loading}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 transition resize-none placeholder:text-slate-400"
        />
        <p className="text-[10px] text-slate-400 text-right mt-0.5">
          {comment.length} / 500
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || stars < 1}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-4 w-4" />
            {initialRating > 0 ? 'Update Rating' : 'Submit Rating'}
          </>
        )}
      </button>
    </form>
  );
}