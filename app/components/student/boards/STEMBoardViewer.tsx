'use client';

import { useMemo } from 'react';
import katex from 'katex';
import {
  Calculator,
  Atom,
  Dna,
  FlaskConical,
  Zap,
} from 'lucide-react';

import type { STEMBoardState } from '@/app/lib/livekit/whiteboardChannel';

function renderLatex(latex: string, displayMode = true): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return `<span style="color:#f43f5e">Invalid formula</span>`;
  }
}

function KatexBlock({ latex }: { latex: string }) {
  const html = useMemo(() => renderLatex(latex), [latex]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function STEMBoardViewer({ state }: { state: STEMBoardState }) {
  const subject = state?.subject || 'math';

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      {/* Subject header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200">
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
            subject === 'math'
              ? 'bg-gradient-to-br from-sky-500 to-blue-600'
              : subject === 'physics'
              ? 'bg-gradient-to-br from-violet-500 to-purple-600'
              : subject === 'biology'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-amber-500 to-orange-600'
          }`}
        >
          {subject === 'math' && <Calculator className="h-6 w-6 text-white" />}
          {subject === 'physics' && <Atom className="h-6 w-6 text-white" />}
          {subject === 'biology' && <Dna className="h-6 w-6 text-white" />}
          {subject === 'chemistry' && (
            <FlaskConical className="h-6 w-6 text-white" />
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Teacher is showing
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 capitalize">
            {subject} Board
          </h2>
        </div>
      </div>

      {/* MATH */}
      {subject === 'math' && (
        <div className="space-y-4">
          {state.mathFormula && (
            <div className="rounded-2xl bg-white border-2 border-sky-100 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500 mb-3">
                Formula
              </p>
              <div className="text-center text-2xl sm:text-4xl text-slate-900 overflow-x-auto py-4">
                <KatexBlock latex={state.mathFormula} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHYSICS */}
      {subject === 'physics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Velocity" value={`${state.physicsV ?? 0} m/s`} tone="emerald" />
            <StatBox label="Accel." value={`${state.physicsA ?? 0} m/s²`} tone="violet" />
            <StatBox label="Time" value={`${state.physicsT ?? 0} s`} tone="sky" />
            <StatBox label="Formula #" value={`${(state.physicsFormulaIdx ?? 0) + 1}`} tone="amber" />
          </div>
        </div>
      )}

      {/* BIOLOGY */}
      {subject === 'biology' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border-2 border-emerald-100 p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-3">
              System
            </p>
            <p className="text-2xl font-bold text-slate-900 capitalize">
              {state.bioSystem || 'cell'}
            </p>
            {state.bioCellType && (
              <p className="text-sm text-slate-500 mt-1 capitalize">
                Type: {state.bioCellType}
              </p>
            )}
            {state.bioSelectedPart && (
              <p className="text-sm text-emerald-600 mt-2 font-semibold">
                Selected: {state.bioSelectedPart}
              </p>
            )}
          </div>
        </div>
      )}

      {/* CHEMISTRY */}
      {subject === 'chemistry' && (
        <div className="space-y-4">
          {state.chemEquation && (
            <div className="rounded-2xl bg-white border-2 border-amber-100 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-3">
                Equation
              </p>
              <div className="text-center text-2xl sm:text-3xl text-slate-900 overflow-x-auto py-4">
                <KatexBlock latex={state.chemEquation} />
              </div>
            </div>
          )}
          {state.chemPh !== undefined && (
            <div className="rounded-2xl bg-white border-2 border-amber-100 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-3">
                pH = {state.chemPh}
              </p>
              <div className="h-6 rounded-lg overflow-hidden flex">
                {[
                  '#dc2626', '#ea580c', '#f97316', '#f59e0b',
                  '#eab308', '#84cc16', '#22c55e', '#10b981',
                  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
                  '#6366f1', '#8b5cf6',
                ].map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone: string }) {
  const toneMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`rounded-xl border-2 ${toneMap[tone]} p-3`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="text-lg font-bold mt-1 font-mono">{value}</p>
    </div>
  );
}