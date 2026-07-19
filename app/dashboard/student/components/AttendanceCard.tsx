'use client';

import { CheckCircle2 } from 'lucide-react';

export default function AttendanceCard() {
  const attendance = {
    present: 24,
    absent: 2,
    percentage: 92,
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <div className="flex items-center justify-between">

        <h2 className="font-bold text-xl">
          Attendance
        </h2>

        <CheckCircle2 className="text-green-600" />
      </div>

      <div className="mt-6">

        <div className="flex justify-between text-sm mb-2">
          <span>Attendance Rate</span>
          <span>{attendance.percentage}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full"
            style={{
              width: `${attendance.percentage}%`,
            }}
          />
        </div>

      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">

        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">
            {attendance.present}
          </p>
          <p className="text-gray-500">
            Present
          </p>
        </div>

        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">
            {attendance.absent}
          </p>
          <p className="text-gray-500">
            Absent
          </p>
        </div>

      </div>

    </div>
  );
}