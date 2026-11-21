'use client';
import { useEffect, useRef, useState } from 'react';
import { MicrophoneIcon, StopIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function VoiceRecorder({
  onSend,
  accentBg = 'bg-emerald-600',
}: {
  onSend: (blob: Blob, durationSec: number) => Promise<void>;
  accentBg?: string;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const duration = seconds;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (blob.size > 0) {
          setSending(true);
          try {
            await onSend(blob, duration);
          } finally {
            setSending(false);
          }
        }
        setSeconds(0);
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      alert('Microphone permission denied');
    }
  };

  const stop = () => {
    mrRef.current?.stop();
    mrRef.current = null;
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancel = () => {
    chunksRef.current = [];
    mrRef.current?.stop();
    mrRef.current = null;
    setRecording(false);
    setSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (sending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="animate-pulse">Sending voice…</span>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-semibold text-red-600 tabular-nums">{fmt(seconds)}</span>
        <div className="flex-1" />
        <button type="button" onClick={cancel} className="p-2 rounded-full text-slate-600 hover:bg-slate-100">
          <TrashIcon className="h-5 w-5" />
        </button>
        <button type="button" onClick={stop} className={`p-2.5 rounded-full ${accentBg} text-white`}>
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="p-2.5 rounded-full text-slate-600 hover:bg-slate-100"
      aria-label="Record voice"
      title="Record voice"
    >
      <MicrophoneIcon className="h-5 w-5" />
    </button>
  );
}