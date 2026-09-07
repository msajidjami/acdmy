'use client';

import {
  CalendarDays,
  Clock,
  Video,
} from 'lucide-react';

const classes = [

  {
    course: 'Quran Reading',

    teacher: 'Ustadh Abdullah',

    date: '20 July',

    time: '07:00 PM',

    duration: '30 Minutes',

    status: 'Upcoming',

  },

  {
    course: 'Tajweed',

    teacher: 'Ustadh Ibrahim',

    date: '22 July',

    time: '08:00 PM',

    duration: '45 Minutes',

    status: 'Upcoming',

  },

];

export default function UpcomingClasses() {

  return (

    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <div className="flex items-center justify-between">

        <h2 className="text-2xl font-bold">

          Upcoming Classes

        </h2>

      </div>

      <div className="space-y-5 mt-6">

        {classes.map((item, index) => (

          <div
            key={index}
            className="border rounded-xl p-5 hover:border-green-600 transition"
          >

            <div className="flex justify-between">

              <div>

                <h3 className="text-xl font-semibold">

                  {item.course}

                </h3>

                <p className="text-gray-500 mt-1">

                  {item.teacher}

                </p>

              </div>

              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">

                {item.status}

              </span>

            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-5">

              <div className="flex items-center gap-2">

                <CalendarDays size={18} />

                {item.date}

              </div>

              <div className="flex items-center gap-2">

                <Clock size={18} />

                {item.time}

              </div>

              <div>

                {item.duration}

              </div>

            </div>

            <button
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2"
            >

              <Video size={18} />

              Join Class

            </button>

          </div>

        ))}

      </div>

    </div>

  );
}