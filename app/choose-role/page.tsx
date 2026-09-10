'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    description: 'Enroll in courses and learn',
    Icon: AcademicCapIcon,
    color: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
  },
  {
    value: 'user',
    label: 'General User',
    description: 'Browse content and explore',
    Icon: UserIcon,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
  },
  {
    value: 'owner',
    label: 'Owner',
    description: 'Manage an academy or business',
    Icon: BriefcaseIcon,
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
  },
] as const;

export default function ChooseRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selected) {
      setError('Please select a role to continue.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/google/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: selected }),
      });

      const data = await res.json();

      if (res.ok) {
        const role = data.user?.role;
        if (role === 'owner') {
          router.push('/owner/dashboard');
        } else if (role === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Failed to create account.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-green-50/30 to-white py-12 px-4"
    >
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <motion.div
            className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-green-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-600/20"
            whileHover={{ scale: 1.05 }}
          >
            <CheckCircleIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-black">
            Welcome! Choose Your Role
          </h2>
          <p className="mt-2 text-sm text-black/60">
            One last step to complete your account setup
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-black/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {ROLES.map((role) => {
              const Icon = role.Icon;
              const isSelected = selected === role.value;

              return (
                <motion.button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    setSelected(role.value);
                    setError('');
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? `${role.bg} ${role.border} ring-2 ring-offset-2 ring-green-500`
                      : 'border-black/10 hover:border-black/20 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-r ${role.color} flex items-center justify-center mb-3`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-black mb-1">
                    {role.label}
                  </h3>
                  <p className={`text-xs ${role.text}`}>
                    {role.description}
                  </p>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-3 flex items-center gap-1 text-xs font-medium text-green-700"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Selected
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            onClick={handleSubmit}
            disabled={loading || !selected}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Continue'}
          </motion.button>

          <p className="mt-6 text-center text-xs text-black/40">
            You won&apos;t be able to change your role later, so choose carefully.
          </p>
        </div>
      </div>
    </motion.div>
  );
}