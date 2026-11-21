'use client';
import { useRef, useState } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

export default function VoicePlayer({
  src,
  durationSec,
  own,
}: {
  src: string;
  durationSec?: number;
  own?: boolean;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  const total = durationSec || 0;
  const display = playing ? Math.floor(current) : total;
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className={`flex items-center gap-2 min-w-[180px] ${own ? 'text-white' : 'text-slate-700'}`}>
      <audio
        ref={ref}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
        preload="metadata"
      />
      <button
        type="button"
        onClick={toggle}
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
          own ? 'bg-white/25' : 'bg-slate-200'
        }`}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
      </button>
      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${own ? 'bg-white/30' : 'bg-slate-300'}`}>
        <div
          className={`h-full ${own ? 'bg-white' : 'bg-emerald-500'}`}
          style={{ width: total ? `${Math.min(100, (current / total) * 100)}%` : '100%' }}
        />
      </div>
      <span className="text-[11px] font-medium tabular-nums shrink-0">{fmt(display)}</span>
    </div>
  );
}