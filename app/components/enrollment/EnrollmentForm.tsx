// components/enrollment/EnrollmentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, CheckCircle } from 'lucide-react';

// ─── Zod Schema ────────────────────────────────────────────────────

const enrollmentSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  course: z.string().min(1, 'Please select a course'),
  message: z.string().optional(),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

// ─── Props ─────────────────────────────────────────────────────────

interface EnrollmentFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultEmail?: string;
  defaultCourseTitle?: string; // جس کورس پر کلک کیا گیا
}

// ─── Component ────────────────────────────────────────────────────

export default function EnrollmentForm({ 
  onClose, 
  onSuccess, 
  defaultEmail = '', 
  defaultCourseTitle = '' 
}: EnrollmentFormProps) {
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // ── کورسز کو API سے لائیں ─────────────────────────────────────
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch courses');
        setCourses(data.courses || []);
      } catch (err: any) {
        setCoursesError(err.message);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      fullName: '',
      email: defaultEmail,
      phone: '',
      course: '',
      message: '',
    },
  });

  // ── جب کورسز لوڈ ہو جائیں اور defaultCourseTitle موجود ہو تو منتخب کریں ──
  useEffect(() => {
    if (!loadingCourses && defaultCourseTitle && courses.length > 0) {
      const matched = courses.find(c => c.title === defaultCourseTitle);
      if (matched) {
        setValue('course', matched.id);
      }
    }
  }, [loadingCourses, courses, defaultCourseTitle, setValue]);

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (data: EnrollmentFormData) => {
    try {
      setSubmitStatus('idle');

      const selectedCourse = courses.find(c => c.id === data.course);
      const courseTitle = selectedCourse ? selectedCourse.title : data.course;

      const payload = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        courseTitle: courseTitle,
        message: data.message,
      };

      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Enrollment failed');

      setSubmitStatus('success');
      reset();
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 3000);
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Enroll Now
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {defaultEmail 
              ? `You are enrolling with your logged-in email.${defaultCourseTitle ? ` Course: ${defaultCourseTitle}` : ''}` 
              : 'Start your journey with us. Fill in the details below.'}
          </p>

          {submitStatus === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Enrollment Submitted!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                We will contact you shortly. JazakAllah Khair!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <Controller
                  name="fullName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  )}
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      disabled={!!defaultEmail}
                      className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        defaultEmail ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                      }`}
                      placeholder="you@example.com"
                    />
                  )}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
                {defaultEmail && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Using your logged-in email. This cannot be changed.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="tel"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="+1 234 567 890"
                    />
                  )}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Course *
                </label>
                <Controller
                  name="course"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={loadingCourses}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-60"
                    >
                      <option value="">
                        {loadingCourses ? 'Loading courses...' : 'Choose a course...'}
                      </option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {coursesError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{coursesError}</p>}
                {errors.course && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.course.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Message (Optional)
                </label>
                <Controller
                  name="message"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="Any special requests or questions..."
                    />
                  )}
                />
              </div>

              {submitStatus === 'error' && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Enrollment'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}