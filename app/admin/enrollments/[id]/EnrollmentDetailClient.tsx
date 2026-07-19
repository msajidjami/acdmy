// app/admin/enrollments/[id]/EnrollmentDetailClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, BookOpen, Calendar, UserCheck, Loader2, Save } from 'lucide-react';

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  progress: number;
  enrolledAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Teacher {
  id: string;
  fullName: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  instructor: Teacher | null;
}

interface Props {
  enrollment: Enrollment;
  student: Student | null;
  course: Course | null;
  teachers: Teacher[];
}

export default function EnrollmentDetailClient({
  enrollment,
  student,
  course,
  teachers,
}: Props) {
  const router = useRouter();
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    course?.instructor?.id || ''
  );
  const [status, setStatus] = useState(enrollment.status);
  const [progress, setProgress] = useState(enrollment.progress);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Save All Changes ──────────────────────────────────────────────
  const handleSaveAll = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/enrollments/${enrollment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          progress,
          teacherId: selectedTeacherId || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Update failed');

      setMessage({ type: 'success', text: 'Changes saved successfully!' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Assign Teacher Only ────────────────────────────────────────────
  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) {
      setMessage({ type: 'error', text: 'Please select a teacher.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/assign-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          teacherId: selectedTeacherId,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Assignment failed');

      setMessage({ type: 'success', text: 'Teacher assigned successfully!' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ── Update Status Only (Mock) ──────────────────────────────────────
  const handleUpdateStatus = async () => {
    // Just a mock; use handleSaveAll for actual update
    setMessage({ type: 'success', text: 'Use "Save Changes" to update all.' });
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      {/* Student Info */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Student Information</h2>
        {student ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{student.email}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Student information not available.</p>
        )}
      </div>

      {/* Course Info */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Course Information</h2>
        {course ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{course.title}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <span>
                Current Teacher:{' '}
                {course.instructor ? (
                  <span className="text-emerald-600 font-medium">
                    {course.instructor.fullName}
                  </span>
                ) : (
                  <span className="text-red-500">Not Assigned</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Enrolled: {enrollment.enrolledAt}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Course information not available.</p>
        )}
      </div>

      {/* Status & Progress */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Status & Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Assign Teacher */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Assign Teacher</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Choose a teacher...</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName} ({teacher.email})
              </option>
            ))}
          </select>
          <button
            onClick={handleAssignTeacher}
            disabled={loading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Teacher'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Teacher will be assigned to the course.</p>
      </div>

      {/* Save All Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={loading}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-70 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save All Changes
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}