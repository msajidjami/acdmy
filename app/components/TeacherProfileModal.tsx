'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface TeacherProfileModalProps {
  teacher: Teacher;
  onClose: () => void;
}

export default function TeacherProfileModal({
  teacher,
  onClose,
}: TeacherProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-gray-100 rounded-t-3xl flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-3xl">👨‍🏫</span>
            Teacher Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Profile Image & Name */}
          <div className="flex items-center gap-6">
            {teacher.profileImage ? (
              <img
                src={teacher.profileImage}
                alt={teacher.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-3xl shadow-md">
                {teacher.name?.charAt(0) || 'T'}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{teacher.name || 'Unknown'}</h3>
              {/* ✅ Email ہٹا دیا گیا */}
              <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${
                teacher.isAvailable
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {teacher.isAvailable ? '✅ Available' : '❌ Unavailable'}
              </span>
            </div>
          </div>

          {/* Subjects */}
          {teacher.subjects?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Subjects</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {teacher.subjects.map((subject) => (
                  <span key={subject} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {teacher.bio && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Bio</h4>
              <p className="mt-1 text-gray-700 whitespace-pre-wrap">{teacher.bio}</p>
            </div>
          )}

          {/* Audio */}
          {teacher.audioUrl && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Audio Introduction</h4>
              <audio controls className="w-full mt-2 rounded-lg">
                <source src={teacher.audioUrl} type="audio/mpeg" />
              </audio>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 flex flex-wrap gap-4">
            <span>Joined: {new Date(teacher.createdAt).toLocaleDateString()}</span>
            <span>Last updated: {new Date(teacher.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}