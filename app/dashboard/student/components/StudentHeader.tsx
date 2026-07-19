'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { CalendarDays, Clock } from 'lucide-react';

export default function StudentHeader() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="rounded-3xl bg-gradient-to-r from-green-700 to-emerald-500 p-8 text-white shadow-lg">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">

        <div>

          <p className="text-green-100 text-sm">
            Assalamu Alaikum 👋
          </p>

          <h1 className="text-4xl font-bold mt-2">
            {user?.name}
          </h1>

          <p className="mt-3 text-green-100 max-w-xl">
            Welcome back to Quran & Islamic Academy.
            Continue your learning journey today.
          </p>

        </div>

        <div className="mt-8 lg:mt-0 bg-white/10 rounded-2xl p-5">

          <div className="flex items-center gap-2">

            <CalendarDays size={18} />

            <span>{today}</span>

          </div>

          <div className="flex items-center gap-2 mt-3">

            <Clock size={18} />

            <span>Next Class : 07:00 PM</span>

          </div>

        </div>

      </div>

    </div>
  );
}