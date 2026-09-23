'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import {
  highlightText,
  severityClasses,
  type DetectionFlag,
} from '@/app/lib/transcript/detection';

interface Msg {
  _id: string;
  speakerRole: 'teacher' | 'student';
  speakerName: string;
  text: string;
  timestamp: string;
  flagCategories: string[];
}

interface Doc {
  _id: string;
  roomName: string;
  courseName: string;
  teacherName: string;
  teacherEmail: string;
  studentName: string;
  startedAt: string;
  durationSec: number;
  messages: Msg[];
  flags: (DetectionFlag & {
    _id: string;
    timestamp: string;
    speakerRole: string;
  })[];
}

export default function TranscriptDetailPage() {
  const params = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/owner/transcripts/${params.id}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setDoc(data?.error ? null : data);
      setLoading(false);
    })();
  }, [params.id]);

  const flagsByMessageIndex = useMemo(() => {
    if (!doc) return {};
    return doc.messages.reduce<Record<number, DetectionFlag[]>>((acc, m, i) => {
      if (!m.flagCategories?.length) return acc;
      const matched = doc.flags
        .filter((f) =>
          m.text.toLowerCase().includes(f.matchedText.toLowerCase())
        )
        .map((f) => ({
          severity: f.severity,
          category: f.category,
          reason: f.reason,
          matchedText: f.matchedText,
        }));
      if (matched.length) acc[i] = matched;
      return acc;
    }, {});
  }, [doc]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!doc) return <p className="p-6 text-slate-500">Not found</p>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">
          {doc.courseName || 'Class'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {doc.teacherName || doc.teacherEmail}
          {doc.studentName && <> → {doc.studentName}</>}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Room: <span className="font-mono">{doc.roomName}</span> ·{' '}
          {new Date(doc.startedAt).toLocaleString()} ·{' '}
          {Math.round(doc.durationSec / 60)} min · {doc.messages.length}{' '}
          messages · {doc.flags.length} alert
          {doc.flags.length !== 1 ? 's' : ''}
        </p>

        {doc.flags.length > 0 && (
          <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <p className="font-bold text-red-800 text-sm">
                {doc.flags.length} flagged line
                {doc.flags.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ul className="space-y-1">
              {doc.flags.map((f) => (
                <li key={f._id} className="text-xs text-red-700">
                  <span className="font-bold">[{f.severity}]</span> {f.reason} —{' '}
                  <span className="font-mono">&quot;{f.matchedText}&quot;</span>{' '}
                  <span className="text-red-400">({f.speakerRole})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {doc.messages.map((m, i) => {
            const flags = flagsByMessageIndex[i] || [];
            const segments = highlightText(m.text, flags);
            const isTeacher = m.speakerRole === 'teacher';
            return (
              <div
                key={m._id}
                className="rounded-2xl bg-white border border-slate-200 p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                      isTeacher ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}
                  >
                    {isTeacher ? 'TEACHER' : 'STUDENT'}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {m.speakerName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {segments.map((seg, j) =>
                    seg.flagged ? (
                      <span
                        key={j}
                        className={`${severityClasses(seg.severity)} px-1 rounded`}
                        title={seg.reason}
                      >
                        {seg.text}
                      </span>
                    ) : (
                      <span key={j}>{seg.text}</span>
                    )
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}