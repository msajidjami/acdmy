// app/signup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ایڈمن پاس ورڈ (بیک اینڈ سے میچ)
  const ADMIN_PASSWORD = "Adm!nP@ssw0rd313";

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretCode: '',
  });

  // ایڈمن موڈ چیک
  const isAdminMode = formData.password === ADMIN_PASSWORD;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // بنیادی ویلیڈیشن
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('تمام فیلڈز درکار ہیں');
      return;
    }

    if (!formData.email.endsWith('@gmail.com')) {
      setError('صرف Gmail ای میل ایڈریس کی اجازت ہے');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('پاس ورڈز مماثل نہیں ہیں');
      return;
    }

    if (formData.password.length < 6) {
      setError('پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے');
      return;
    }

    // اگر ایڈمن موڈ ہے تو سیکرٹ کوڈ چیک کریں
    if (isAdminMode && !formData.secretCode.trim()) {
      setError('ایڈمن اکاؤنٹ کے لیے سیکرٹ کوڈ درکار ہے');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          secretCode: isAdminMode ? formData.secretCode : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.message || 'سائن اپ ناکام ہوا');
      }
    } catch (err) {
      setError('سرور سے رابطہ نہیں ہو سکا، دوبارہ کوشش کریں');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4"
    >
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <UserIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900">اکاؤنٹ بنائیں</h2>
          <p className="mt-2 text-sm text-gray-600">Quran Academy میں خوش آمدید</p>
        </div>

        {/* Error / Success Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center">
            <CheckCircleIcon className="h-6 w-6 mx-auto mb-2" />
            اکاؤنٹ کامیابی سے بن گیا! لاگ ان صفحہ پر جا رہے ہیں...
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مکمل نام</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="اپنا مکمل نام درج کریں"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ای میل</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="example@gmail.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">صرف Gmail ای میلز قبول کی جاتی ہیں</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">پاس ورڈ</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="پاس ورڈ درج کریں"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3">
                {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">پاس ورڈ کی تصدیق</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="پاس ورڈ دوبارہ درج کریں"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3">
                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Admin Secret Code – صرف جب ایڈمن پاس ورڈ درج ہو */}
          {isAdminMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 text-center font-medium">
                ایڈمن موڈ فعال ہو گیا! اب سیکرٹ کوڈ درج کریں
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ایڈمن سیکرٹ کوڈ</label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="secretCode"
                  value={formData.secretCode}
                  onChange={handleChange}
                  required={isAdminMode}
                  className="w-full pl-10 pr-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="سیکرٹ کوڈ درج کریں"
                />
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'اکاؤنٹ بنا رہے ہیں...' : isAdminMode ? 'ایڈمن اکاؤنٹ بنائیں' : 'اکاؤنٹ بنائیں'}
          </motion.button>

          <p className="text-center text-sm text-gray-600">
            پہلے سے اکاؤنٹ ہے؟ <Link href="/login" className="text-indigo-600 font-medium hover:underline">لاگ ان کریں</Link>
          </p>
        </form>
      </div>
    </motion.div>
  );
}