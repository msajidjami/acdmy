'use client';

import {
  BookOpen,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const homework = [
  {
    id: 1,
    title: 'Memorize Surah Al-Mulk (1-10)',
    subject: 'Hifz',
    due: 'Tomorrow',
    status: 'Pending',
  },
  {
    id: 2,
    title: 'Practice Noon Sakin Rules',
    subject: 'Tajweed',
    due: 'Friday',
    status: 'Completed',
  },
  {
    id: 3,
    title: 'Arabic Workbook Page 12',
    subject: 'Arabic',
    due: 'Sunday',
    status: 'Pending',
  },
];

export default function HomeworkCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">

          <BookOpen className="text-green-600" />

          <h2 className="text-xl font-bold">
            Homework
          </h2>

        </div>

        <button className="text-green-600 text-sm font-semibold hover:underline">
          View All
        </button>

      </div>

      <div className="space-y-4">

        {homework.map((item) => (

          <div
            key={item.id}
            className="border rounded-xl p-4 hover:shadow transition"
          >

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-semibold">

                  {item.title}

                </h3>

                <p className="text-sm text-gray-500 mt-1">

                  {item.subject}

                </p>

              </div>

              {item.status === 'Completed' ? (

                <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">

                  <CheckCircle2 size={18} />

                  Completed

                </span>

              ) : (

                <span className="flex items-center gap-1 text-orange-600 text-sm font-semibold">

                  <AlertCircle size={18} />

                  Pending

                </span>

              )}

            </div>

            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">

              <Clock3 size={16} />

              Due: {item.due}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}