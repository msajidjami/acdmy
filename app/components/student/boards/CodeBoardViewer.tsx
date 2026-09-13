'use client';

import { useMemo } from 'react';
import { Code2, FileCode2 } from 'lucide-react';

import type { CodeBoardState } from '@/app/lib/livekit/whiteboardChannel';

export default function CodeBoardViewer({ state }: { state: CodeBoardState }) {
  const code = state?.code || '// Waiting for teacher...';
  const language = state?.language || 'javascript';
  const fileName = state?.fileName || 'main.js';

  const lines = useMemo(() => code.split('\n'), [code]);

  return (
    <div className="h-full overflow-auto bg-[#0b1220]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#0f172a] border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <Code2 className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-sky-400" />
          <span className="font-mono text-sm text-white/80">{fileName}</span>
          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase">
            {language}
          </span>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Code */}
      <div className="flex font-mono text-sm">
        {/* Line numbers */}
        <div className="shrink-0 py-4 px-3 text-right text-white/25 select-none bg-[#0b1220] border-r border-white/5">
          {lines.map((_, i) => (
            <div key={i} style={{ lineHeight: '1.6' }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <div className="flex-1 py-4 px-4 overflow-x-auto">
          {lines.map((line, i) => (
            <div
              key={i}
              className="text-white/85 whitespace-pre"
              style={{ lineHeight: '1.6' }}
            >
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}