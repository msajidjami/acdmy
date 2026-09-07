'use client';

import { BookOpen } from 'lucide-react';

export default function DailyAyah() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <div className="flex items-center gap-3 mb-5">

        <BookOpen className="text-green-600" />

        <h2 className="font-bold text-xl">
          Daily Quran
        </h2>

      </div>

      <p className="text-right text-2xl leading-10 font-arabic">

        إِنَّ مَعَ الْعُسْرِ يُسْرًا

      </p>

      <p className="mt-5 text-gray-700">

        "Indeed, with hardship comes ease."

      </p>

      <p className="mt-2 text-sm text-gray-500">

        Surah Ash-Sharh • 94:6

      </p>

      <button className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl">

        Read Tafsir

      </button>

    </div>
  );
}