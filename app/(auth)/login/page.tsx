'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

/* ✅ یہ اندرونی کمپوننٹ useSearchParams استعمال کرتا ہے */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(decodeURIComponent(urlError));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const goToHome = () => {
    router.refresh();
    setTimeout(() => router.replace('/'), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        goToHome();
      } else {
        setError(data.message || data.error || 'Login failed');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('');
    setGoogleLoading(true);
    window.location.href = `${API_BASE}/api/auth/google?redirect=/`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-green-50/30 to-white py-12 px-4"
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <motion.div
            className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-green-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-600/20"
            whileHover={{ scale: 1.05 }}
          >
            <LockClosedIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-black">Welcome Back</h2>
          <p className="mt-2 text-sm text-black/60">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-black/5">
          <motion.button
            whileHover={{ scale: googleLoading ? 1 : 1.02 }}
            whileTap={{ scale: googleLoading ? 1 : 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3 mb-6 flex items-center justify-center gap-3 bg-white border border-black/10 hover:bg-black/[0.02] text-black font-medium rounded-xl shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            <span>{googleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
          </motion.button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-black/40 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black/80 mb-1">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-black/40" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white/50"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-black/80">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline transition">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-black/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white/50"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-black/40 hover:text-black/70 transition" tabIndex={-1}>
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-black/60">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-green-600 font-medium hover:underline hover:text-green-700 transition">
              Sign Up
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-black/30">
          Secured with 🔒 Islamic Academy Platform
        </p>
      </div>
    </motion.div>
  );
}

/* ✅ اصل پیج — LoginForm کو Suspense میں لپیٹ دیا */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-black/60">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}