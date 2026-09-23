'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Search, Loader2, BookOpen, User } from 'lucide-react';

interface Item {
  _id: string;
  roomName: string;
  courseName: string;
  teacherName: string;
  teacherEmail: string;
  studentName: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  flags: { severity: string; reason: string }[];
}

export default function OwnerTranscriptsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (onlyFlagged) params.set('flagged', '1');
      const res = await fetch(`/api/owner/transcripts?${params}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (active) {
        setItems(data.items || []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [q, onlyFlagged]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Class Transcripts
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          All class conversations from your academy — suspicious activity is
          highlighted in red.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search teacher, student, course..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setOnlyFlagged((v) => !v)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              onlyFlagged
                ? 'bg-red-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <ShieldAlert className="inline h-4 w-4 mr-1" />
            Flagged Only
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            No records found
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <Link
                key={it._id}
                href={`/owner/transcripts/${it._id}`}
                className="block rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md p-4 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <BookOpen className="h-3 w-3" />
                        {it.courseName || 'Course'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <User className="h-3 w-3" />
                        {it.teacherName || it.teacherEmail || 'Teacher'}
                        {it.studentName && <> → {it.studentName}</>}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {it.roomName}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(it.startedAt).toLocaleString()} ·{' '}
                      {Math.round(it.durationSec / 60)} min
                    </p>
                  </div>
                  {it.flags.length > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                      <ShieldAlert className="h-3 w-3" />
                      {it.flags.length} alert
                      {it.flags.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}