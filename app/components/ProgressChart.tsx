'use client';

import { useMemo } from 'react';

type Bar = { date: string; pages: number; label?: string };

export default function ProgressChart({
  bars,
  height = 120,
  accentColor = '#6366f1',
  emptyLabel = 'No sessions yet',
}: {
  bars: Bar[];
  height?: number;
  accentColor?: string;
  emptyLabel?: string;
}) {
  const max = useMemo(
    () => Math.max(1, ...bars.map((b) => b.pages)),
    [bars]
  );

  if (bars.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-xs text-slate-400"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className="flex items-end justify-between gap-1.5 rounded-xl bg-slate-50/60 border border-slate-100 p-3"
      style={{ height }}
    >
      {bars.map((b, i) => {
        const pct = (b.pages / max) * 100;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative"
          >
            {/* Tooltip on hover */}
            <div className="absolute -top-8 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
              {b.pages} pages
            </div>

            <div
              className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110"
              style={{
                height: `${Math.max(4, pct)}%`,
                background: `linear-gradient(to top, ${accentColor}, ${accentColor}cc)`,
                minHeight: 4,
              }}
            />
            <span className="text-[9px] font-mono text-slate-400 shrink-0">
              {b.pages}
            </span>
          </div>
        );
      })}
    </div>
  );
}