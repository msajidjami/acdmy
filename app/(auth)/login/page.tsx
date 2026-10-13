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
  PhoneIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type LoginMethod = 'email' | 'phone';

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

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('92')) return `+${digits}`;
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
  return `+92${digits}`;
}

/* ============================================================
   Login Form
   ============================================================ */

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [method, setMethod] = useState<LoginMethod>('email');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: '', password: '' });

  /* WhatsApp login state */
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [seconds, setSeconds] = useState(0);

  /* URL error */
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(decodeURIComponent(urlError));
  }, [searchParams]);

  /* Resend timer */
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const goToRedirect = (target?: string) => {
    router.refresh();
    setTimeout(() => router.replace(target || '/'), 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  /* Email Login */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

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

      let data: any = {};
      try {
        const text = await response.text();
        if (text) data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (response.ok) {
        setSuccess(true);
        goToRedirect('/');
      } else {
        setError(data.message || data.error || 'Login failed');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Google Login */
  const handleGoogleLogin = () => {
    setError('');
    setGoogleLoading(true);
    window.location.href = `${API_BASE}/api/auth/google?redirect=/`;
  };

  /* WhatsApp Login — Send OTP */
  const handleSendOtp = async () => {
    setError('');
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length < 10) {
      setError('Please enter a complete phone number');
      return;
    }

    setLoading(true);
    try {
      const formatted = formatPhone(cleaned);

      const res = await fetch(`${API_BASE}/api/auth/whatsapp/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ phone: formatted }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        if (res.status === 429 && data?.waitSec) {
          setSeconds(Number(data.waitSec));
          setError(`Please wait ${data.waitSec}s before requesting a new OTP`);
          return;
        }
        throw new Error(data?.error || 'Failed to send OTP');
      }

      setPhoneStep('otp');
      setSeconds(60);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* WhatsApp Login — Verify OTP */
  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/whatsapp/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          phone: formatPhone(phone),
          code: otp.trim(),
          mode: 'login',
        }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            'This number is not registered. Please sign up first.'
          );
        }
        throw new Error(data?.error || 'Login failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        router.push(data.redirect || '/');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = () => {
    if (seconds > 0) return;
    setOtp('');
    setPhoneStep('phone');
  };

  const changePhone = () => {
    setOtp('');
    setPhoneStep('phone');
    setError('');
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-green-50/30 to-white py-12 px-4"
    >
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-green-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-600/20"
            whileHover={{ scale: 1.05 }}
          >
            <LockClosedIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-black">Welcome Back</h2>
          <p className="mt-2 text-sm text-black/60">Sign in to your account</p>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">
            <CheckCircleIcon className="h-6 w-6 mx-auto mb-2" />
            Login successful! Redirecting...
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-black/5">
          {/* Google Login */}
          <motion.button
            whileHover={{ scale: googleLoading ? 1 : 1.02 }}
            whileTap={{ scale: googleLoading ? 1 : 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3 mb-5 flex items-center justify-center gap-3 bg-white border border-black/10 hover:bg-black/[0.02] text-black font-medium rounded-xl shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            <span>{googleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
          </motion.button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-black/40 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Method Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                method === 'email'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <EnvelopeIcon className="h-4 w-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('phone');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                method === 'phone'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PhoneIcon className="h-4 w-4" />
              WhatsApp
            </button>
          </div>

          {/* Email Login Form */}
          {method === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-black/80 mb-1">
                  Email
                </label>
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
                  <label className="block text-sm font-medium text-black/80">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline transition"
                  >
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-black/40 hover:text-black/70 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>
          )}

          {/* WhatsApp Login Form */}
          {method === 'phone' && (
            <div className="space-y-5">
              {phoneStep === 'phone' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-black/80 mb-1">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-black/40" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        className="w-full pl-10 pr-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white/50"
                        placeholder="03001234567"
                      />
                    </div>
                    <p className="text-xs text-black/40 mt-1">
                      The same number you used to sign up
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || phone.trim().length < 10}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <PhoneIcon className="h-5 w-5" />
                        Send OTP on WhatsApp
                      </>
                    )}
                  </motion.button>

                  <p className="text-xs text-black/40 text-center">
                    A 6-digit code will be sent to your WhatsApp
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={changePhone}
                    className="inline-flex items-center gap-1.5 text-sm text-black/50 hover:text-black/80 transition"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Change number
                  </button>

                  <div>
                    <p className="text-sm text-black/60 mb-2">
                      OTP has been sent on WhatsApp to{' '}
                      <span className="font-semibold">{formatPhone(phone)}</span>
                    </p>
                    <label className="block text-sm font-medium text-black/80 mb-1">
                      6-digit code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      className="w-full px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono border-2 border-black/10 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                      placeholder="••••••"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Verify and Sign In
                      </>
                    )}
                  </motion.button>

                  <div className="text-center">
                    {seconds > 0 ? (
                      <p className="text-sm text-black/50">
                        Wait{' '}
                        <span className="font-mono font-bold text-black/70">
                          {seconds}s
                        </span>{' '}
                        to resend
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={resendOtp}
                        className="text-sm font-semibold text-green-600 hover:text-green-700 transition"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </>
              )}

              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mt-2">
                <ShieldCheckIcon className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">
                  Your number will be verified via WhatsApp
                </p>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-black/60">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-green-600 font-medium hover:underline hover:text-green-700 transition"
            >
              Sign Up
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-black/30">
          Secured with 🔒 ILMORA786
        </p>
      </div>
    </motion.div>
  );
}

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