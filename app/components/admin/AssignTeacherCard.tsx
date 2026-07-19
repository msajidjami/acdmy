// components/admin/AssignTeacherCard.tsx
'use client';

import { useState } from 'react';
import { Loader2, User, Mail, BookOpen, UserCheck, Clock } from 'lucide-react';

interface Teacher {
  _id: string;
  fullName: string;
}

interface AssignTeacherCardProps {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  currentTeacher: string;
  teachers: Teacher[];
}

export default function AssignTeacherCard({
  enrollmentId,
  studentName,
  studentEmail,
  courseTitle,
  currentTeacher,
  teachers,
}: AssignTeacherCardProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAssign = async () => {
    if (!selectedTeacherId) {
      setMessage({ type: 'error', text: 'Please select a teacher.' });
      return;
    }
    if (!selectedTime) {
      setMessage({ type: 'error', text: 'Please select a time.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/assign-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          teacherId: selectedTeacherId,
          time: selectedTime,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Assignment failed');
      setMessage({ type: 'success', text: 'Teacher assigned successfully!' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Student Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-gray-800">{studentName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Mail className="w-4 h-4" />
            <span>{studentEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BookOpen className="w-4 h-4" />
            <span>{courseTitle}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <UserCheck className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Current Teacher: <span className={currentTeacher !== 'Not Assigned' ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                {currentTeacher}
              </span>
            </span>
          </div>
        </div>

        {/* Assignment Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Teacher</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">Choose teacher...</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Class Time</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAssign}
            disabled={submitting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-70 flex items-center gap-2 whitespace-nowrap"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Teacher'
            )}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mt-3 p-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}