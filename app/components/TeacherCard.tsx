'use client';

import { useState } from 'react';
import TeacherProfileModal from './TeacherProfileModal';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  subjects: string[];
  bio: string;
  audioUrl: string;
  profileImage: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeacherCardProps {
  teacher: Teacher;
}

export default function TeacherCard({ teacher }: TeacherCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ اگر teacher undefined یا null ہو تو محفوظ طریقے سے ہینڈل کریں
  if (!teacher) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-gray-400">
        Teacher data not available
      </div>
    );
  }

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const displayName = teacher.name || 'Unknown';
  const displaySubjects = teacher.subjects || [];

  return (
    <>
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
            {displayName.charAt(0) || 'T'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">{displayName}</p>
            {displaySubjects.length > 0 && (
              <p className="text-sm text-gray-500">📚 {displaySubjects.slice(0, 2).join(', ')}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={openModal}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition"
          >
            View Full Profile →
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <TeacherProfileModal teacher={teacher} onClose={closeModal} />
      )}
    </>
  );
}