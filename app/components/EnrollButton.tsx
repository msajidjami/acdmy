'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface EnrollButtonProps {
  courseId: string;
  user: any; // user object from server
}

export default function EnrollButton({ courseId, user }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    // Optionally check if user is a student (you can also rely on the API)
    // But we'll let the API handle the validation.

    setLoading(true);
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Enrollment successful!');
        router.refresh(); // Refresh to update any state
      } else {
        toast.error(data.error || 'Failed to enroll');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in, show "Login to Enroll"
  if (!user) {
    return (
      <button
        onClick={handleEnroll}
        className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition"
      >
        Login to Enroll
      </button>
    );
  }

  // If user is logged in but not a student, we'll still show enroll button; API will handle error.
  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
        loading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
      }`}
    >
      {loading ? 'Enrolling...' : 'Enroll'}
    </button>
  );
}