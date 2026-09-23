'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Trash2, Loader2 } from 'lucide-react';

type Props = {
  slug: string;
  title: string;
};

export default function DeleteButton({ slug, title }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm(
      `Are you sure you want to delete "${title}"?\nThis action cannot be undone.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Delete failed');
      }

      toast.success('Article deleted successfully');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Delete
    </button>
  );
}