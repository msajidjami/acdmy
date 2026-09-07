'use client';

import { useRouter } from 'next/navigation';

interface DeleteAcademyButtonProps {
  academyId: string;
}

export default function DeleteAcademyButton({ academyId }: DeleteAcademyButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your academy? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/owner/academy/delete?id=${academyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/owner/dashboard?deleted=true');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete academy');
      }
    } catch (error) {
      alert('An error occurred while deleting the academy');
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-500 hover:text-red-700 transition-colors"
    >
      🗑️ Delete Academy
    </button>
  );
}