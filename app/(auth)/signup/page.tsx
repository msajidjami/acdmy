'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  CheckCircleIcon,
  PhoneIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  QrCodeIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

type SignupMethod = 'email' | 'phone';
type WhatsAppStatus = 'checking' | 'disconnected' | 'qr' | 'connected' | 'error';

interface EmailFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  secretCode: string;
}

interface ApiResponse {
  message?: string;
  error?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const ADMIN_TRIGGER = process.env.NEXT_PUBLIC_ADMIN_TRIGGER || 'admin';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

/* ============================================================
   Inline QR — uses public API
   ============================================================ */

function InlineQRCode({ value, size = 220 }: { value: string; size?: number }) {
  if (!value) return null;

  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(
    value
  )}`;

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt="WhatsApp QR Code"
      width={size}
      height={size}
      className="rounded-xl bg-white"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [method, setMethod] = useState<SignupMethod>('email');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<EmailFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretCode: '',
  });

  /* WhatsApp signup state */
  const [phoneName, setPhoneName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [seconds, setSeconds] = useState(0);

  /* WhatsApp connection status */
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>('checking');
  const [waQR, setWaQR] = useState<string>('');

  /* Development OTP display */
  const [devCode, setDevCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const showSecretCode =
    ADMIN_TRIGGER.length > 0 && formData.password.includes(ADMIN_TRIGGER);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  /* ============================================================
     Poll WhatsApp status when on phone tab
     ============================================================ */
  useEffect(() => {
    if (method !== 'phone') return;

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/auth/whatsapp/qr-data', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();

        if (cancelled) return;

        /* Connected */
        if (data?.ready || data?.status === 'connected') {
          setWaStatus('connected');
          setWaQR('');
          if (intervalId) clearInterval(intervalId);
          return;
        }

        /* QR available */
        if (data?.qr) {
          setWaStatus('qr');
          setWaQR(String(data.qr));
          return;
        }

        /* Disconnected — try starting */
        if (data?.status === 'disconnected') {
          setWaStatus('disconnected');
          try {
            await fetch('/api/auth/whatsapp/qr', {
              method: 'POST',
              credentials: 'include',
            });
          } catch {}
          return;
        }

        if (data?.status === 'error') {
          setWaStatus('error');
          setError(data?.error || 'WhatsApp connection error');
        }
      } catch {
        /* ignore */
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 2500);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [method]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleGoogleSignup = () => {
    setError('');
    setGoogleLoading(true);
    window.location.href = `${API_BASE}/api/auth/google?redirect=/`;
  };

  /* Email Signup */
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;
    const secretCode = formData.secretCode.trim();

    if (!name || !email || !password || !confirmPassword) {
      setError('All required fields are required.');
      return;
    }
    if (!email.endsWith('@gmail.com')) {
      setError('Only Gmail addresses are allowed.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (showSecretCode && !secretCode) {
      setError('Please enter the admin secret code.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          name,
          email,
          password,
          secretCode: showSecretCode ? secretCode : undefined,
        }),
      });

      let data: ApiResponse = {};
      try {
        data = await response.json();
      } catch {}

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          router.push('/login');
        }, 1500);
      } else {
        setError(data.message || data.error || 'Signup failed.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* WhatsApp phone format */
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('92')) return `+${digits}`;
    if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
    return `+92${digits}`;
  };

  /* WhatsApp Signup — Send OTP */
  const handleSendOtp = async () => {
    setError('');
    setDevCode('');
    const cleaned = phone.replace(/\D/g, '');

    if (!phoneName.trim() || phoneName.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
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
        if (data?.needsQr) {
          setWaStatus('qr');
        }
        throw new Error(data?.error || 'Failed to send OTP');
      }

      if (data?.devCode) {
        setDevCode(String(data.devCode));
      }

      setPhoneStep('otp');
      setSeconds(60);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* WhatsApp Signup — Verify OTP */
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
          name: phoneName.trim(),
          mode: 'signup',
        }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error(data?.error || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        router.push(data.redirect || '/');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = () => {
    if (seconds > 0) return;
    setOtp('');
    setDevCode('');
    setPhoneStep('phone');
  };

  const changePhone = () => {
    setOtp('');
    setDevCode('');
    setPhoneStep('phone');
    setError('');
  };

  const copyOtp = () => {
    if (!devCode) return;
    navigator.clipboard.writeText(devCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fillOtp = () => {
    if (!devCode) return;
    setOtp(devCode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4"
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <motion.div
            className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <UserIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our learning platform
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">
            <CheckCircleIcon className="h-6 w-6 mx-auto mb-2" />
            Account created successfully! Redirecting...
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-200">
          {/* Google Signup */}
          <motion.button
            whileHover={{ scale: googleLoading ? 1 : 1.02 }}
            whileTap={{ scale: googleLoading ? 1 : 0.98 }}
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full py-3 mb-5 flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium rounded-lg shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            <span>{googleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
          </motion.button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-500 font-medium">
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
                setDevCode('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                method === 'email'
                  ? 'bg-white text-indigo-700 shadow-sm'
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
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PhoneIcon className="h-4 w-4" />
              WhatsApp
            </button>
          </div>

          {/* Email Signup Form */}
          {method === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="example@gmail.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only Gmail addresses are allowed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-3"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {showSecretCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
                      Admin Secret Code
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-amber-500" />
                      <input
                        type="password"
                        name="secretCode"
                        value={formData.secretCode}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter admin secret code"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                      Admin access requires the correct secret code.
                    </p>
                  </div>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </motion.button>
            </form>
          )}

          {/* ============================================
              WhatsApp Signup — QR shows HERE
              ============================================ */}
          {method === 'phone' && (
            <div className="space-y-5">
              {/* Checking / Loading */}
              {waStatus === 'checking' && (
                <div className="text-center py-6">
                  <ArrowPathIcon className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Connecting to WhatsApp...
                  </p>
                </div>
              )}

              {/* QR available */}
              {waStatus === 'qr' && waQR && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 sm:p-5"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                      <QrCodeIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-900">
                        Link WhatsApp (one time setup)
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Admin: scan this QR with your WhatsApp
                      </p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="p-3 bg-white rounded-2xl shadow-md border-4 border-emerald-500">
                      <InlineQRCode value={waQR} size={220} />
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="mt-4 space-y-1.5 text-[12px] text-emerald-900">
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Open WhatsApp on your phone</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Go to Settings → Linked Devices</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Tap &quot;Link a Device&quot;</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <span>Scan the QR above</span>
                    </div>
                  </div>

                  {/* Waiting indicator */}
                  <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-emerald-700">
                    <SignalIcon className="h-3.5 w-3.5 animate-pulse" />
                    Waiting for scan...
                  </div>
                </motion.div>
              )}

              {/* Disconnected */}
              {waStatus === 'disconnected' && !waQR && (
                <div className="text-center py-6">
                  <ArrowPathIcon className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Starting WhatsApp connection...
                  </p>
                </div>
              )}

              {/* Connected — OTP flow */}
              {waStatus === 'connected' && (
                <>
                  {phoneStep === 'phone' ? (
                    <>
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 mb-3">
                        <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <p className="text-[11px] text-emerald-800">
                          WhatsApp connected — ready to send OTP
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={phoneName}
                            onChange={(e) => setPhoneName(e.target.value)}
                            autoComplete="name"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          WhatsApp Number
                        </label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            autoComplete="tel"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="03001234567"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          The number must have WhatsApp active
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        type="button"
                        onClick={handleSendOtp}
                        disabled={
                          loading || !phone.trim() || !phoneName.trim()
                        }
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
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

                      <p className="text-xs text-gray-400 text-center">
                        A 6-digit code will be sent to your WhatsApp
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={changePhone}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
                      >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Change number
                      </button>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          OTP has been sent on WhatsApp to{' '}
                          <span className="font-semibold">
                            {formatPhone(phone)}
                          </span>
                        </p>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          6-digit code
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={otp}
                          onChange={(e) =>
                            setOtp(e.target.value.replace(/\D/g, ''))
                          }
                          autoFocus
                          className="w-full px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                          placeholder="------"
                        />
                      </div>

                      {devCode && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4"
                        >
                          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                            🔧 Dev Mode — Your OTP
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white rounded-lg border-2 border-amber-300 px-3 py-2 text-center">
                              <span className="text-2xl font-mono font-bold text-amber-900 tracking-widest">
                                {devCode}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={copyOtp}
                              className="p-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition"
                              title="Copy OTP"
                            >
                              <ClipboardDocumentIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[11px] text-amber-700">
                              {copied
                                ? '✓ Copied!'
                                : 'Development only'}
                            </p>
                            <button
                              type="button"
                              onClick={fillOtp}
                              className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline"
                            >
                              Auto-fill
                            </button>
                          </div>
                        </motion.div>
                      )}

                      <motion.button
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length !== 6}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-5 w-5" />
                            Verify and Create Account
                          </>
                        )}
                      </motion.button>

                      <div className="text-center">
                        {seconds > 0 ? (
                          <p className="text-sm text-gray-500">
                            Wait{' '}
                            <span className="font-mono font-bold text-gray-700">
                              {seconds}s
                            </span>{' '}
                            to resend
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={resendOtp}
                            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mt-2">
                    <ShieldCheckIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700">
                      Your number will be verified via WhatsApp
                    </p>
                  </div>
                </>
              )}

              {/* Error state */}
              {waStatus === 'error' && (
                <div className="text-center py-6">
                  <p className="text-sm text-rose-600 mb-3">
                    WhatsApp connection error
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setWaStatus('checking');
                      setError('');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Secured with 🔒 ILMORA786
        </p>
      </div>
    </motion.div>
  );
}