'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BuildingOffice2Icon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function CreateAcademyPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    tagline: '',
  });

  /* ============================================================
     ✅ پہلے چیک کریں — لاگ ان ہے؟ academy موجود ہے؟
     ============================================================ */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/roles`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          if (!cancelled) router.replace('/login');
          return;
        }

        const data = await res.json();

        /* غیر لاگ ان → login */
        if (!data?.user) {
          if (!cancelled) router.replace('/login');
          return;
        }

        /* academy موجود ہے → dashboard */
        if (data?.academy) {
          if (!cancelled) router.replace('/owner/dashboard');
          return;
        }

        /* ٹھیک ہے → form دکھائیں */
        if (!cancelled) setChecking(false);
      } catch {
        if (!cancelled) router.replace('/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const name = form.name.trim();
    const description = form.description.trim();
    const tagline = form.tagline.trim();

    if (!name || name.length < 2) {
      setError('Academy name must be at least 2 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/academy/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ name, description, tagline }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {}

      /* 401 → login پر */
      if (res.status === 401) {
        router.replace('/login');
        return;
      }

      /* 409 → academy موجود ہے، dashboard پر */
      if (res.status === 409) {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          router.push('/owner/dashboard');
        }, 800);
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create academy');
      }

      /* کامیاب */
      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        router.push(data.redirect || '/owner/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to create academy');
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     Loading state (auth check)
     ============================================================ */
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <ArrowPathIcon className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <BuildingOffice2Icon className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900">
            Create Your Academy
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Start managing your Islamic academy, teachers, students and classes
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm text-center">
            <CheckCircleIcon className="h-6 w-6 mx-auto mb-2" />
            Academy created! Redirecting...
          </div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Academy Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
              maxLength={80}
              placeholder="e.g. Al-Noor Quran Academy"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <p className="text-xs text-slate-400 mt-1">
              {form.name.length}/80 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tagline{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="tagline"
              value={form.tagline}
              onChange={handleChange}
              maxLength={150}
              placeholder="e.g. Learn Quran online with expert teachers"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              placeholder="Tell us about your academy..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              {form.description.length}/500 characters
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <SparklesIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">
              Creating an academy will make you the owner. You can add teachers,
              students and courses right after.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <BuildingOffice2Icon className="h-5 w-5" />
                Create Academy
              </>
            )}
          </button>
        </motion.form>

        <p className="mt-6 text-center text-xs text-slate-400">
          You can update all details later from your academy settings
        </p>
      </div>
    </div>
  );
}