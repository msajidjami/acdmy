'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type Props = {
  slug: string;
  status: string;
};

export default function ApproveButton({ slug, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const reason = window.prompt('Rejection reason (optional):') || '';
      if (reason === null) return; // cancel
    }

    setLoading(action);

    try {
      const res = await fetch(`/api/articles/${slug}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          reason:
            action === 'reject'
              ? window.prompt('Rejection reason (optional):') || ''
              : '',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Action failed');
      }

      toast.success(
        action === 'approve'
          ? 'Article approved & published!'
          : 'Article rejected'
      );

      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed');
    } finally {
      setLoading(null);
    }
  };

  // اگر article published یا rejected ہے تو buttons نہ دکھائیں
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Live
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-60"
      >
        {loading === 'approve' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        Approve
      </button>

      <button
        type="button"
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition disabled:opacity-60"
      >
        {loading === 'reject' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        Reject
      </button>
    </div>
  );
}