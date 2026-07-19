'use client';

import { useAuth } from '@/app/hooks/useAuth';

export default function WelcomeHero() {
  const { user } = useAuth();

  return (
    <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-500 p-8 text-white shadow-lg">

      <p className="uppercase tracking-wider text-green-100 text-sm">
        Quran & Islamic Academy
      </p>

      <h1 className="text-4xl font-bold mt-3">
        Assalamu Alaikum, {user?.name} 👋
      </h1>

      <p className="mt-4 text-green-100 max-w-2xl">
        Welcome back to your learning dashboard.
        Continue your Quran journey with qualified teachers,
        live classes and Islamic learning tools.
      </p>

    </div>
  );
}