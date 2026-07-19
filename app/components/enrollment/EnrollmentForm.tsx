// components/enrollment/EnrollmentForm.tsx
'use client';

import { useState } from 'react';
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
  defaultEmail?: string; // ✅ نئی پراپ
}

// ─── Courses List ──────────────────────────────────────────────────

const courses = [
  { id: 'quran-tajweed', label: 'Quran with Tajweed' },
  { id: 'quran-hifz', label: 'Quran Hifz (Memorization)' },
  { id: 'arabic-language', label: 'Arabic Language' },
  { id: 'islamic-studies', label: 'Islamic Studies' },
  { id: 'fiqh', label: 'Fiqh (Islamic Jurisprudence)' },
  { id: 'tafsir', label: 'Tafsir (Quran Exegesis)' },
];

// ─── Component ────────────────────────────────────────────────────

export default function EnrollmentForm({ onClose, onSuccess, defaultEmail = '' }: EnrollmentFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
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

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (data: EnrollmentFormData) => {
    try {
      setSubmitStatus('idle');
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Enrollment failed');
      }

      setSubmitStatus('success');
      reset();
      if (onSuccess) onSuccess();
      // خود بند ہونے کے لیے 3 سیکنڈ
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
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
            {defaultEmail ? 'You are enrolling with your logged-in email.' : 'Start your journey with us. Fill in the details below.'}
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
              {/* Full Name */}
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
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
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
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
                {defaultEmail && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Using your logged-in email. This cannot be changed.
                  </p>
                )}
              </div>

              {/* Phone */}
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
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
                )}
              </div>

              {/* Course Selection */}
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
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Choose a course...</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.course && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.course.message}</p>
                )}
              </div>

              {/* Message */}
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

              {/* Submit Button */}
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