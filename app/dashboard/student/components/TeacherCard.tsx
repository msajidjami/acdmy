'use client';

import {
  Star,
  Globe,
  GraduationCap,
} from 'lucide-react';

export default function TeacherCard() {

  const teacher = {
    name: 'Mufti Abdul Rahman',
    country: 'Pakistan',
    experience: '10 Years',
    language: 'English • Arabic • Urdu',
    rating: 4.9,
    avatar: '/teacher.jpg',
  };

  return (

    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <h2 className="font-bold text-xl mb-6">
        Assigned Teacher
      </h2>

      <div className="flex items-center gap-5">

        <img
          src={teacher.avatar}
          alt={teacher.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
        />

        <div>

          <h3 className="font-bold text-xl">
            {teacher.name}
          </h3>

          <div className="flex items-center gap-2 mt-2 text-gray-600">

            <Globe size={16} />

            {teacher.country}

          </div>

          <div className="flex items-center gap-2 mt-2 text-gray-600">

            <GraduationCap size={16} />

            {teacher.experience}

          </div>

          <div className="flex items-center gap-2 mt-2 text-yellow-500">

            <Star fill="currentColor" size={16} />

            {teacher.rating}

          </div>

        </div>

      </div>

      <div className="mt-6 bg-green-50 rounded-xl p-4">

        <p className="text-sm text-gray-500">
          Languages
        </p>

        <p className="font-semibold">
          {teacher.language}
        </p>

      </div>

    </div>

  );
}