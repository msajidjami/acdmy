'use client';

import {
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  Award,
} from 'lucide-react';

const stats = [

  {
    title: 'My Courses',
    value: 3,
    icon: BookOpen,
    color: 'bg-green-100 text-green-700',
  },

  {
    title: 'Attendance',
    value: '98%',
    icon: CalendarCheck,
    color: 'bg-blue-100 text-blue-700',
  },

  {
    title: 'Homework',
    value: 2,
    icon: ClipboardCheck,
    color: 'bg-orange-100 text-orange-700',
  },

  {
    title: 'Certificates',
    value: 1,
    icon: Award,
    color: 'bg-purple-100 text-purple-700',
  },

];

export default function StudentStats() {

  return (

    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      {stats.map((item) => {

        const Icon = item.icon;

        return (

          <div
            key={item.title}
            className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition"
          >

            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color}`}
            >

              <Icon size={28} />

            </div>

            <h3 className="text-gray-500 mt-5">
              {item.title}
            </h3>

            <p className="text-3xl font-bold mt-2">
              {item.value}
            </p>

          </div>

        );

      })}

    </div>

  );
}