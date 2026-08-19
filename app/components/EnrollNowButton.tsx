// app/components/EnrollNowButton.tsx
'use client';

import { useState } from 'react';
import EnrollmentForm from '@/app/components/enrollment/EnrollmentForm'; // فرض کریں یہ موجود ہے

interface EnrollNowButtonProps {
  courseId: string;
  courseTitle: string;
  className?: string;
}

export default function EnrollNowButton({
  courseId,
  courseTitle,
  className = '',
}: EnrollNowButtonProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className={`${className} bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 rounded-lg text-center transition-colors`}
      >
        Enroll Now
      </button>

      {showForm && (
        <EnrollmentForm
          onClose={() => setShowForm(false)}
          defaultCourseTitle={courseTitle}
        />
      )}
    </>
  );
}