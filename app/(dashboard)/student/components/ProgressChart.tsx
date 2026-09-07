'use client';

import {
  TrendingUp,
} from 'lucide-react';

const progress = [
  { month: 'Jan', value: 25 },
  { month: 'Feb', value: 40 },
  { month: 'Mar', value: 55 },
  { month: 'Apr', value: 72 },
  { month: 'May', value: 84 },
  { month: 'Jun', value: 95 },
];

export default function ProgressChart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      <div className="flex items-center justify-between">

        <h2 className="text-xl font-bold">
          Learning Progress
        </h2>

        <TrendingUp className="text-green-600" />

      </div>

      <div className="flex items-end justify-between h-56 mt-8">

        {progress.map((item) => (

          <div
            key={item.month}
            className="flex flex-col items-center"
          >

            <div
              className="bg-green-600 rounded-t-lg w-10"
              style={{
                height: `${item.value * 1.6}px`,
              }}
            />

            <span className="mt-2 text-sm">
              {item.month}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}