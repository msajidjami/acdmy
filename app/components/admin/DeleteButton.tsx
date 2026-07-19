// app/components/admin/DeleteButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({ action, id }: { action: string; id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Delete this item?')) return;

    try {
      const res = await fetch(action, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      alert('Error deleting item');
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition"
      aria-label="Delete"
    >
      <Trash2 size={16} />
    </button>
  );
}