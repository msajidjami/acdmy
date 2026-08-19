// components/student/LearningProgress.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Unit {
  unitNumber: number;
  title: string;
  description?: string;
}

interface ProgressData {
  course: {
    id: string;
    title: string;
    syllabus: Unit[];
  };
  units: {
    unitNumber: number;
    completed: boolean;
    completedAt?: string;
  }[];
  progress: number;
}

export default function LearningProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/student/progress');
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to fetch progress');
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!data || !data.course) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
        No course enrolled yet.
      </div>
    );
  }

  const { course, units, progress } = data;

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-xl">Learning Progress</h2>
        <span className="text-sm font-semibold text-emerald-600">{progress}% Complete</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">{course.title}</p>

      {/* پروگریس بار (اوور آل) */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
        <div
          className="bg-emerald-600 h-3 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* نصاب کی فہرست – ہر یونٹ */}
      <div className="space-y-4">
        {course.syllabus.map((unit) => {
          const unitProgress = units.find(u => u.unitNumber === unit.unitNumber);
          const completed = unitProgress?.completed || false;

          return (
            <div key={unit.unitNumber} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
              <div className="flex-shrink-0 mt-0.5">
                <span className={`inline-block w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  completed ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {completed ? '✓' : unit.unitNumber}
                </span>
              </div>
              <div className="flex-1">
                <p className={`font-medium ${completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {unit.title}
                </p>
                {unit.description && (
                  <p className="text-sm text-gray-500">{unit.description}</p>
                )}
                {completed && unitProgress?.completedAt && (
                  <p className="text-xs text-emerald-500">
                    Completed: {new Date(unitProgress.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}