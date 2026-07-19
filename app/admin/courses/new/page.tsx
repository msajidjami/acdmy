// app/admin/courses/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

// ─── Zod Schema ──────────────────────────────────────────────────
const courseSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  instructor: z.string().optional(), // ✅ اختیاری
  price: z.number().min(0, 'Price must be 0 or more'),
  duration: z.string().min(1, 'Duration is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  isActive: z.boolean(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      instructor: '', // خالی
      price: 0,
      duration: '',
      level: 'beginner',
      isActive: true,
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create course');
      router.push('/admin/courses');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Course</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              {...register('title')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select
              {...register('category')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select category</option>
              <option value="Islamic">Islamic</option>
              <option value="Academic">Academic</option>
            </select>
            {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Instructor (Teacher ID)</label>
            <input
              {...register('instructor')}
              placeholder="Optional – leave empty if not assigned"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
            {errors.instructor && <p className="text-sm text-red-600 mt-1">{errors.instructor.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price ($)</label>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
            {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duration *</label>
            <input
              {...register('duration')}
              placeholder="e.g., 8 weeks"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            />
            {errors.duration && <p className="text-sm text-red-600 mt-1">{errors.duration.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Level *</label>
            <select
              {...register('level')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 mt-1 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            {errors.level && <p className="text-sm text-red-600 mt-1">{errors.level.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label className="text-sm text-gray-700">Active (visible to students)</label>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                'Create Course'
              )}
            </button>
            <Link
              href="/admin/courses"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}