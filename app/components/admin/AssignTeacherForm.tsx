// components/admin/AssignTeacherForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

interface Props {
  teachers: { _id: string; fullName: string }[];
  students: { _id: string; name: string; email: string }[];
  courses: { _id: string; title: string }[];
}

export default function AssignTeacherForm({ teachers, students, courses }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/assign-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Assignment failed');
      setMessage({ type: 'success', text: 'Teacher assigned successfully!' });
      reset();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Student *</label>
          <select
            {...register('studentId', { required: true })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1"
          >
            <option value="">Select student</option>
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Course *</label>
          <select
            {...register('courseId', { required: true })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1"
          >
            <option value="">Select course</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Teacher *</label>
          <select
            {...register('teacherId', { required: true })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1"
          >
            <option value="">Select teacher</option>
            {teachers.map(t => (
              <option key={t._id} value={t._id}>{t.fullName}</option>
            ))}
          </select>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
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
    </div>
  );
}