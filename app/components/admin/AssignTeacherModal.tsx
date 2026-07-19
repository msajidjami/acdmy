// components/admin/AssignTeacherModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface Teacher {
  _id: string;
  fullName: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Course {
  _id: string;
  title: string;
}

export default function AssignTeacherModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm();

  // Fetch data on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/assign-teacher/data')
        .then(res => res.json())
        .then(data => {
          setTeachers(data.teachers || []);
          setStudents(data.students || []);
          setCourses(data.courses || []);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/assign-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Assignment failed');
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        reset();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium flex items-center gap-2 shadow transition"
      >
        <UserPlus size={20} /> Assign Teacher to Student
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Teacher</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Teacher Assigned!</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">The teacher has been assigned successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Student */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student *</label>
              <select
                {...register('studentId', { required: true })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 mt-1"
              >
                <option value="">Select student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course *</label>
              <select
                {...register('courseId', { required: true })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 mt-1"
              >
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teacher *</label>
              <select
                {...register('teacherId', { required: true })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 mt-1"
              >
                <option value="">Select teacher</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.fullName}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Teacher'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}