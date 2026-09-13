'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

import {
  X,
  Calculator,
  Atom,
  Dna,
  FlaskConical,
  FunctionSquare,
  Play,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Zap,
  Waves,
  Circle,
  Square,
  Triangle,
  Ruler,
  Scale,
  Beaker,
  Thermometer,
  Gauge,
  ArrowRight,
  Layers,
  Settings,
  Save,
  Download,
} from 'lucide-react';

/* ============================================================ */
/* TYPES                                                        */
/* ============================================================ */

type Subject = 'math' | 'physics' | 'biology' | 'chemistry';

interface Props {
  onClose: () => void;
  initialSubject?: Subject;
}

/* ============================================================ */
/* KATEX HELPER                                                 */
/* ============================================================ */

function renderLatex(latex: string, displayMode = true): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
    });
  } catch {
    return `<span class="text-rose-400">Invalid formula</span>`;
  }
}

function KatexBlock({
  latex,
  className = '',
}: {
  latex: string;
  className?: string;
}) {
  const html = useMemo(() => renderLatex(latex), [latex]);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function KatexInline({ latex }: { latex: string }) {
  const html = useMemo(() => renderLatex(latex, false), [latex]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ============================================================ */
/* MAIN COMPONENT                                               */
/* ============================================================ */

export default function STEMBoardOverlay({
  onClose,
  initialSubject = 'math',
}: Props) {
  const [subject, setSubject] = useState<Subject>(initialSubject);
  const [presentMode, setPresentMode] = useState(false);

  /* Keyboard */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (presentMode) setPresentMode(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, presentMode]);

  /* Present mode */
  if (presentMode) {
    return (
      <div className="fixed inset-0 z-[10000] bg-[#0b1220] flex flex-col">
        <div className="shrink-0 h-10 flex items-center justify-between px-3 bg-[#0f172a] border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/70">
              {subject === 'math'
                ? '📐 Math'
                : subject === 'physics'
                ? '⚛️ Physics'
                : subject === 'biology'
                ? '🧬 Biology'
                : '🧪 Chemistry'}{' '}
              — Present Mode
            </span>
          </div>
          <button
            onClick={() => setPresentMode(false)}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-semibold transition"
          >
            <Minimize2 className="h-3 w-3" />
            Exit
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {subject === 'math' && <MathBoard presentMode />}
          {subject === 'physics' && <PhysicsBoard presentMode />}
          {subject === 'biology' && <BiologyBoard presentMode />}
          {subject === 'chemistry' && <ChemistryBoard presentMode />}
        </div>
      </div>
    );
  }

  /* Normal mode */
  return (
    <div className="fixed inset-0 z-[10000] bg-[#0b1220] flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 h-12 flex items-center justify-between gap-2 px-3 bg-[#0f172a] border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <p className="text-xs font-bold text-white/80 hidden sm:block">
            STEM Board
          </p>
        </div>

        {/* Subject tabs */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 overflow-x-auto">
          <SubjectTab
            active={subject === 'math'}
            onClick={() => setSubject('math')}
            icon={<Calculator className="h-3.5 w-3.5" />}
            label="Math"
            color="sky"
          />
          <SubjectTab
            active={subject === 'physics'}
            onClick={() => setSubject('physics')}
            icon={<Atom className="h-3.5 w-3.5" />}
            label="Physics"
            color="violet"
          />
          <SubjectTab
            active={subject === 'biology'}
            onClick={() => setSubject('biology')}
            icon={<Dna className="h-3.5 w-3.5" />}
            label="Biology"
            color="emerald"
          />
          <SubjectTab
            active={subject === 'chemistry'}
            onClick={() => setSubject('chemistry')}
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            label="Chemistry"
            color="amber"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPresentMode(true)}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Present</span>
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-auto">
        {subject === 'math' && <MathBoard />}
        {subject === 'physics' && <PhysicsBoard />}
        {subject === 'biology' && <BiologyBoard />}
        {subject === 'chemistry' && <ChemistryBoard />}
      </div>
    </div>
  );
}

/* ============================================================ */
/* SUBJECT TAB                                                  */
/* ============================================================ */

function SubjectTab({
  active,
  onClick,
  icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: 'sky' | 'violet' | 'emerald' | 'amber';
}) {
  const colorMap = {
    sky: 'from-sky-500 to-blue-600',
    violet: 'from-violet-500 to-purple-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-bold transition whitespace-nowrap ${
        active
          ? `bg-gradient-to-r ${colorMap} text-white shadow-md`
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* ============================================================ */
/* MATH BOARD                                                   */
/* ============================================================ */

function MathBoard({ presentMode = false }: { presentMode?: boolean }) {
  const [formula, setFormula] = useState('\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}');
  const [formulaInput, setFormulaInput] = useState(formula);
  const [funcInput, setFuncInput] = useState('x^2');
  const [showGraph, setShowGraph] = useState(true);
  const [activeShape, setActiveShape] = useState<'triangle' | 'circle' | 'square'>('triangle');

  const applyFormula = () => setFormula(formulaInput);

  return (
    <div className={`grid ${presentMode ? 'grid-cols-1' : 'lg:grid-cols-[1fr_360px]'} gap-3 p-3 sm:p-4`}>
      {/* LEFT — Main formula display + graph */}
      <div className="space-y-3">
        {/* Formula display */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-bold uppercase tracking-wider">
              <FunctionSquare className="h-3 w-3" />
              Formula Display
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(formula);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/40 hover:text-white/80 transition"
            >
              <Copy className="h-3 w-3" />
              Copy LaTeX
            </button>
          </div>

          <div className={`flex items-center justify-center py-6 sm:py-10 ${presentMode ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-4xl'}`}>
            <div className="text-white overflow-x-auto max-w-full">
              <KatexBlock latex={formula} />
            </div>
          </div>
        </div>

        {/* Graph */}
        {showGraph && (
          <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-400/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                <Waves className="h-3 w-3" />
                Function Grapher
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">f(x) =</span>
                <input
                  type="text"
                  value={funcInput}
                  onChange={(e) => setFuncInput(e.target.value)}
                  className="h-7 px-2 w-32 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-white outline-none focus:border-violet-400/60"
                />
              </div>
            </div>
            <FunctionPlot fn={funcInput} />
          </div>
        )}

        {/* Geometry quick view */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Ruler className="h-3 w-3" />
              Geometry Formulas
            </div>
            <div className="flex items-center gap-1">
              {(['triangle', 'circle', 'square'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveShape(s)}
                  className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition ${
                    activeShape === s
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  {s === 'triangle' && <Triangle className="h-3.5 w-3.5" />}
                  {s === 'circle' && <Circle className="h-3.5 w-3.5" />}
                  {s === 'square' && <Square className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-center bg-white/5 rounded-xl p-4 min-h-[160px]">
              {activeShape === 'triangle' && <TriangleSVG />}
              {activeShape === 'circle' && <CircleSVG />}
              {activeShape === 'square' && <SquareSVG />}
            </div>
            <div className="space-y-2 text-white/80 text-sm">
              {activeShape === 'triangle' && (
                <>
                  <p><KatexInline latex="A = \tfrac{1}{2} b h" /></p>
                  <p><KatexInline latex="P = a + b + c" /></p>
                  <p><KatexInline latex="\angle A + \angle B + \angle C = 180°" /></p>
                </>
              )}
              {activeShape === 'circle' && (
                <>
                  <p><KatexInline latex="A = \pi r^2" /></p>
                  <p><KatexInline latex="C = 2\pi r" /></p>
                  <p><KatexInline latex="d = 2r" /></p>
                </>
              )}
              {activeShape === 'square' && (
                <>
                  <p><KatexInline latex="A = a^2" /></p>
                  <p><KatexInline latex="P = 4a" /></p>
                  <p><KatexInline latex="d = a\sqrt{2}" /></p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Formula editor */}
      <aside className="space-y-3">
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FunctionSquare className="h-4 w-4 text-sky-400" />
            <span className="text-sm font-bold text-white">Formula Editor</span>
          </div>
          <textarea
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            rows={4}
            placeholder="Write LaTeX here..."
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/90 outline-none focus:border-sky-400/60 resize-none"
          />
          <button
            onClick={applyFormula}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition"
          >
            <Play className="h-3.5 w-3.5" />
            Render Formula
          </button>
        </div>

        {/* Quick insert */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Quick Insert</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_MATH.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  const next = formulaInput + ' ' + item.latex;
                  setFormulaInput(next);
                  setFormula(next);
                }}
                className="inline-flex items-center justify-center h-9 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition text-xs"
                title={item.name}
              >
                <KatexInline latex={item.display} />
              </button>
            ))}
          </div>
        </div>

        {/* Preset formulas */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-bold text-white">Preset Formulas</span>
          </div>
          <div className="space-y-1.5">
            {PRESET_MATH.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setFormulaInput(p.latex);
                  setFormula(p.latex);
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <div className="text-white/80">
                  <KatexInline latex={p.latex} />
                </div>
                <p className="text-[10px] text-white/40 mt-0.5">{p.name}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Function Plot (SVG) ---------- */

function FunctionPlot({ fn }: { fn: string }) {
  const W = 500;
  const H = 240;
  const range = 5;

  const toPixel = (x: number, y: number) => ({
    px: (x / range) * (W / 2) + W / 2,
    py: -((y / range) * (H / 2)) + H / 2,
  });

  const points = useMemo(() => {
    const pts: string[] = [];
    const N = 200;
    let lastValid = false;

    for (let i = 0; i <= N; i++) {
      const x = -range + (2 * range * i) / N;
      let y: number;
      try {
        // eslint-disable-next-line no-new-func
        y = new Function('x', `return (${fn});`)(x);
        if (!Number.isFinite(y) || Math.abs(y) > 50) {
          lastValid = false;
          continue;
        }
      } catch {
        lastValid = false;
        continue;
      }
      const { px, py } = toPixel(x, y);
      if (py < -200 || py > H + 200) {
        lastValid = false;
        continue;
      }
      pts.push(`${lastValid ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`);
      lastValid = true;
    }
    return pts.join(' ');
  }, [fn]);

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid */}
        {Array.from({ length: 11 }).map((_, i) => {
          const x = (i / 10) * W;
          return (
            <line
              key={`v${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={H}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = (i / 5) * H;
          return (
            <line
              key={`h${i}`}
              x1={0}
              y1={y}
              x2={W}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}
        {/* Axes */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        {/* Function */}
        <path
          d={points}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Origin label */}
        <text x={W / 2 + 6} y={H / 2 - 6} fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">
          0
        </text>
      </svg>
    </div>
  );
}

/* ---------- Geometry SVGs ---------- */

function TriangleSVG() {
  return (
    <svg viewBox="0 0 160 140" className="w-40 h-auto">
      <polygon
        points="80,20 20,120 140,120"
        fill="rgba(251,191,36,0.15)"
        stroke="#fbbf24"
        strokeWidth="2"
      />
      <line x1="80" y1="20" x2="80" y2="120" stroke="rgba(255,255,255,0.4)" strokeDasharray="4 3" strokeWidth="1.5" />
      <text x="84" y="75" fill="#fff" fontSize="12" fontFamily="monospace">h</text>
      <text x="45" y="135" fill="#fff" fontSize="12" fontFamily="monospace">b</text>
    </svg>
  );
}

function CircleSVG() {
  return (
    <svg viewBox="0 0 160 140" className="w-40 h-auto">
      <circle cx="80" cy="70" r="50" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="2" />
      <line x1="80" y1="70" x2="130" y2="70" stroke="#fff" strokeWidth="1.5" />
      <circle cx="80" cy="70" r="3" fill="#fff" />
      <text x="100" y="65" fill="#fff" fontSize="12" fontFamily="monospace">r</text>
    </svg>
  );
}

function SquareSVG() {
  return (
    <svg viewBox="0 0 160 140" className="w-40 h-auto">
      <rect x="30" y="20" width="100" height="100" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="2" />
      <text x="75" y="135" fill="#fff" fontSize="12" fontFamily="monospace">a</text>
      <text x="20" y="75" fill="#fff" fontSize="12" fontFamily="monospace">a</text>
    </svg>
  );
}

/* ============================================================ */
/* PHYSICS BOARD                                                */
/* ============================================================ */

function PhysicsBoard({ presentMode = false }: { presentMode?: boolean }) {
  const [v, setV] = useState(20); // velocity m/s
  const [a, setA] = useState(2); // acceleration m/s^2
  const [t, setT] = useState(5); // time s
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [selectedFormula, setSelectedFormula] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const start = Date.now() - currentTime * 1000;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed >= t) {
        setCurrentTime(t);
        setIsPlaying(false);
      } else {
        setCurrentTime(elapsed);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isPlaying, t, currentTime]);

  const distance = v * currentTime + 0.5 * a * currentTime * currentTime;
  const currentVelocity = v + a * currentTime;

  const reset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className={`grid ${presentMode ? 'grid-cols-1' : 'lg:grid-cols-[1fr_360px]'} gap-3 p-3 sm:p-4`}>
      {/* LEFT */}
      <div className="space-y-3">
        {/* Simulation */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-400/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="h-3 w-3" />
              Motion Simulator
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition"
              >
                <Play className="h-3.5 w-3.5" />
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative bg-white/5 rounded-xl overflow-hidden">
            <svg viewBox="0 0 600 200" className="w-full h-auto">
              {/* Ground */}
              <line x1="20" y1="160" x2="580" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              {/* Distance ruler */}
              <g>
                {Array.from({ length: 11 }).map((_, i) => {
                  const x = 20 + (i / 10) * 560;
                  return (
                    <g key={i}>
                      <line x1={x} y1="160" x2={x} y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                      <text x={x} y="185" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">
                        {Math.round((i / 10) * (v * t + 0.5 * a * t * t))}m
                      </text>
                    </g>
                  );
                })}
              </g>
              {/* Velocity arrow */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                </marker>
              </defs>
              {/* Ball */}
              <g transform={`translate(${20 + (currentTime / t) * 560}, 140)`}>
                <circle cx="0" cy="0" r="18" fill="url(#ballGradient)" stroke="#a78bfa" strokeWidth="2" />
                <defs>
                  <radialGradient id="ballGradient">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </radialGradient>
                </defs>
                <text x="0" y="5" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  ⚽
                </text>
              </g>
              {/* Vector arrow from ball */}
              <line
                x1={20 + (currentTime / t) * 560}
                y1="140"
                x2={20 + (currentTime / t) * 560 + Math.min(80, currentVelocity * 2)}
                y2="140"
                stroke="#10b981"
                strokeWidth="3"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={20 + (currentTime / t) * 560 + Math.min(80, currentVelocity * 2) + 5}
                y="135"
                fill="#10b981"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                v = {currentVelocity.toFixed(1)} m/s
              </text>
            </svg>
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <LiveStat label="Time" value={`${currentTime.toFixed(1)} s`} tone="sky" />
            <LiveStat label="Velocity" value={`${currentVelocity.toFixed(1)} m/s`} tone="emerald" />
            <LiveStat label="Distance" value={`${distance.toFixed(1)} m`} tone="violet" />
            <LiveStat label="Accel." value={`${a} m/s²`} tone="amber" />
          </div>
        </div>

        {/* Selected formula */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
          <div className="text-white/80 text-center py-4">
            <div className="text-lg sm:text-2xl">
              <KatexBlock latex={PHYSICS_FORMULAS[selectedFormula].latex} />
            </div>
            <p className="text-xs text-white/50 mt-2">
              {PHYSICS_FORMULAS[selectedFormula].name}
            </p>
          </div>
        </div>

        {/* Vector diagram */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-3">
            <ArrowRight className="h-3 w-3" />
            Vector Diagrams
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <svg viewBox="0 0 500 200" className="w-full h-auto">
              {/* F1 vector */}
              <line x1="100" y1="100" x2="200" y2="100" stroke="#60a5fa" strokeWidth="3" markerEnd="url(#arrowBlue)" />
              <defs>
                <marker id="arrowBlue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
                </marker>
                <marker id="arrowRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
                <marker id="arrowGreen" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                </marker>
              </defs>
              <text x="80" y="90" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="monospace">F₁</text>

              {/* F2 vector */}
              <line x1="200" y1="100" x2="200" y2="30" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowRed)" />
              <text x="205" y="25" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace">F₂</text>

              {/* Resultant */}
              <line x1="100" y1="100" x2="200" y2="30" stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowGreen)" strokeDasharray="6 3" />
              <text x="130" y="55" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="monospace">R</text>

              {/* Labels */}
              <text x="200" y="160" fill="rgba(255,255,255,0.5)" fontSize="11" textAnchor="middle">
                Resultant R = √(F₁² + F₂²)
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <aside className="space-y-3">
        {/* Controls */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-bold text-white">Parameters</span>
          </div>
          <div className="space-y-3">
            <SliderInput label="Initial velocity (v₀)" value={v} onChange={setV} min={0} max={50} unit="m/s" />
            <SliderInput label="Acceleration (a)" value={a} onChange={setA} min={-10} max={10} unit="m/s²" />
            <SliderInput label="Duration (t)" value={t} onChange={setT} min={1} max={20} unit="s" />
          </div>
        </div>

        {/* Formula library */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Physics Formulas</span>
          </div>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {PHYSICS_FORMULAS.map((f, i) => (
              <button
                key={i}
                onClick={() => setSelectedFormula(i)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                  selectedFormula === i
                    ? 'bg-violet-500/20 border-violet-400/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-white/90 text-xs">
                  <KatexInline latex={f.latex} />
                </div>
                <p className="text-[10px] text-white/40 mt-0.5">{f.name}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function SliderInput({
  label, value, onChange, min, max, unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-white/70">{label}</label>
        <span className="text-[11px] font-mono font-bold text-violet-300">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-violet-500"
      />
    </div>
  );
}

function LiveStat({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone: 'sky' | 'emerald' | 'violet' | 'amber';
}) {
  const colorMap = {
    sky: 'bg-sky-500/10 border-sky-400/30 text-sky-300',
    emerald: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300',
    violet: 'bg-violet-500/10 border-violet-400/30 text-violet-300',
    amber: 'bg-amber-500/10 border-amber-400/30 text-amber-300',
  }[tone];

  return (
    <div className={`rounded-lg border ${colorMap} px-3 py-2`}>
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5 font-mono">{value}</p>
    </div>
  );
}

/* ============================================================ */
/* BIOLOGY BOARD                                                */
/* ============================================================ */

function BiologyBoard({ presentMode = false }: { presentMode?: boolean }) {
  const [activeSystem, setActiveSystem] = useState<'cell' | 'dna' | 'heart' | 'digestive' | 'photosynthesis'>('cell');
  const [cellType, setCellType] = useState<'plant' | 'animal'>('plant');
  const [selectedPart, setSelectedPart] = useState<string>('');

  return (
    <div className={`grid ${presentMode ? 'grid-cols-1' : 'lg:grid-cols-[260px_1fr]'} gap-3 p-3 sm:p-4`}>
      {/* LEFT sidebar */}
      <aside className="space-y-3">
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Dna className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Biology Topics</span>
          </div>
          <div className="space-y-1.5">
            {[
              { id: 'cell', icon: Circle, label: 'Cell Structure' },
              { id: 'dna', icon: Dna, label: 'DNA & RNA' },
              { id: 'heart', icon: Gauge, label: 'Human Heart' },
              { id: 'digestive', icon: Beaker, label: 'Digestive System' },
              { id: 'photosynthesis', icon: Thermometer, label: 'Photosynthesis' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSystem(item.id as any)}
                  className={`w-full inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeSystem === item.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                  <ChevronRight className="h-3 w-3 ml-auto" />
                </button>
              );
            })}
          </div>
        </div>

        {activeSystem === 'cell' && (
          <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">
              Cell Type
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCellType('plant')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  cellType === 'plant'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                🌱 Plant
              </button>
              <button
                onClick={() => setCellType('animal')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  cellType === 'animal'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                🐾 Animal
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main canvas */}
      <div className="space-y-3">
        {activeSystem === 'cell' && (
          <CellDiagram
            type={cellType}
            onSelect={setSelectedPart}
            selected={selectedPart}
          />
        )}
        {activeSystem === 'dna' && <DNADiagram />}
        {activeSystem === 'heart' && <HeartDiagram onSelect={setSelectedPart} selected={selectedPart} />}
        {activeSystem === 'digestive' && <DigestiveDiagram />}
        {activeSystem === 'photosynthesis' && <PhotosynthesisDiagram />}
      </div>
    </div>
  );
}

function CellDiagram({
  type,
  onSelect,
  selected,
}: {
  type: 'plant' | 'animal';
  onSelect: (s: string) => void;
  selected: string;
}) {
  const parts = type === 'plant'
    ? [
        { id: 'wall', name: 'Cell Wall', desc: 'Rigid outer layer — provides structure', color: '#84cc16' },
        { id: 'membrane', name: 'Cell Membrane', desc: 'Controls what enters/exits the cell', color: '#f59e0b' },
        { id: 'nucleus', name: 'Nucleus', desc: 'Contains DNA — the control center', color: '#a78bfa' },
        { id: 'chloroplast', name: 'Chloroplast', desc: 'Photosynthesis — makes food using sunlight', color: '#10b981' },
        { id: 'vacuole', name: 'Vacuole', desc: 'Stores water and nutrients', color: '#38bdf8' },
        { id: 'mitochondria', name: 'Mitochondria', desc: 'Powerhouse — produces energy (ATP)', color: '#ef4444' },
      ]
    : [
        { id: 'membrane', name: 'Cell Membrane', desc: 'Controls what enters/exits the cell', color: '#f59e0b' },
        { id: 'nucleus', name: 'Nucleus', desc: 'Contains DNA — the control center', color: '#a78bfa' },
        { id: 'mitochondria', name: 'Mitochondria', desc: 'Powerhouse — produces energy (ATP)', color: '#ef4444' },
        { id: 'ribosome', name: 'Ribosome', desc: 'Makes proteins', color: '#fb7185' },
        { id: 'er', name: 'Endoplasmic Reticulum', desc: 'Transports materials', color: '#60a5fa' },
        { id: 'golgi', name: 'Golgi Apparatus', desc: 'Packages and ships proteins', color: '#fbbf24' },
      ];

  const current = parts.find((p) => p.id === selected);

  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-4">
        <Circle className="h-3 w-3" />
        {type === 'plant' ? 'Plant Cell' : 'Animal Cell'}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* SVG Cell */}
        <div className="bg-white/5 rounded-xl p-4 flex items-center justify-center">
          <svg viewBox="0 0 400 400" className="w-full max-w-[400px]">
            {type === 'plant' ? (
              <>
                {/* Cell wall */}
                <rect
                  x="20"
                  y="20"
                  width="360"
                  height="360"
                  rx="20"
                  fill="rgba(132,204,22,0.15)"
                  stroke="#84cc16"
                  strokeWidth={selected === 'wall' ? 4 : 3}
                  onClick={() => onSelect('wall')}
                  className="cursor-pointer"
                />
                {/* Membrane */}
                <rect
                  x="40"
                  y="40"
                  width="320"
                  height="320"
                  rx="15"
                  fill="rgba(245,158,11,0.1)"
                  stroke="#f59e0b"
                  strokeWidth={selected === 'membrane' ? 3 : 2}
                  onClick={() => onSelect('membrane')}
                  className="cursor-pointer"
                />
                {/* Vacuole */}
                <ellipse
                  cx="200"
                  cy="220"
                  rx="90"
                  ry="70"
                  fill="rgba(56,189,248,0.25)"
                  stroke="#38bdf8"
                  strokeWidth={selected === 'vacuole' ? 3 : 2}
                  onClick={() => onSelect('vacuole')}
                  className="cursor-pointer"
                />
                {/* Nucleus */}
                <circle
                  cx="130"
                  cy="150"
                  r="45"
                  fill="rgba(167,139,250,0.3)"
                  stroke="#a78bfa"
                  strokeWidth={selected === 'nucleus' ? 3 : 2}
                  onClick={() => onSelect('nucleus')}
                  className="cursor-pointer"
                />
                <circle cx="130" cy="150" r="15" fill="#a78bfa" opacity="0.6" />
                {/* Chloroplasts */}
                {[[280, 120], [300, 180], [280, 260]].map(([x, y], i) => (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx="22"
                    ry="14"
                    fill="rgba(16,185,129,0.35)"
                    stroke="#10b981"
                    strokeWidth={selected === 'chloroplast' ? 3 : 2}
                    transform={`rotate(-30 ${x} ${y})`}
                    onClick={() => onSelect('chloroplast')}
                    className="cursor-pointer"
                  />
                ))}
                {/* Mitochondria */}
                <ellipse
                  cx="200"
                  cy="80"
                  rx="30"
                  ry="16"
                  fill="rgba(239,68,68,0.3)"
                  stroke="#ef4444"
                  strokeWidth={selected === 'mitochondria' ? 3 : 2}
                  onClick={() => onSelect('mitochondria')}
                  className="cursor-pointer"
                />
              </>
            ) : (
              <>
                {/* Membrane */}
                <circle
                  cx="200"
                  cy="200"
                  r="170"
                  fill="rgba(245,158,11,0.1)"
                  stroke="#f59e0b"
                  strokeWidth={selected === 'membrane' ? 4 : 2.5}
                  onClick={() => onSelect('membrane')}
                  className="cursor-pointer"
                />
                {/* Nucleus */}
                <circle
                  cx="150"
                  cy="160"
                  r="50"
                  fill="rgba(167,139,250,0.3)"
                  stroke="#a78bfa"
                  strokeWidth={selected === 'nucleus' ? 3 : 2}
                  onClick={() => onSelect('nucleus')}
                  className="cursor-pointer"
                />
                <circle cx="150" cy="160" r="18" fill="#a78bfa" opacity="0.6" />
                {/* Mitochondria */}
                {[[280, 150], [300, 250], [250, 300]].map(([x, y], i) => (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx="28"
                    ry="15"
                    fill="rgba(239,68,68,0.3)"
                    stroke="#ef4444"
                    strokeWidth={selected === 'mitochondria' ? 3 : 2}
                    onClick={() => onSelect('mitochondria')}
                    transform={`rotate(${i * 40} ${x} ${y})`}
                    className="cursor-pointer"
                  />
                ))}
                {/* Ribosomes */}
                {[[100, 280], [130, 300], [160, 280], [180, 310]].map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="7"
                    fill="#fb7185"
                    stroke={selected === 'ribosome' ? '#fff' : 'transparent'}
                    strokeWidth="2"
                    onClick={() => onSelect('ribosome')}
                    className="cursor-pointer"
                  />
                ))}
                {/* ER */}
                <path
                  d="M 100 100 Q 130 80 160 100 T 220 100"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth={selected === 'er' ? 3 : 2}
                  onClick={() => onSelect('er')}
                  className="cursor-pointer"
                />
                {/* Golgi */}
                <path
                  d="M 250 100 Q 270 90 290 100 Q 270 110 250 100"
                  fill="rgba(251,191,36,0.3)"
                  stroke="#fbbf24"
                  strokeWidth={selected === 'golgi' ? 3 : 2}
                  onClick={() => onSelect('golgi')}
                  className="cursor-pointer"
                />
              </>
            )}
          </svg>
        </div>

        {/* Parts legend */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
            Click parts to learn
          </div>
          {parts.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                selected === p.id
                  ? 'bg-emerald-500/15 border border-emerald-400/40'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">{p.name}</p>
                {selected === p.id && (
                  <p className="text-[10px] text-white/60 mt-0.5 leading-relaxed">
                    {p.desc}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DNADiagram() {
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-4">
        <Dna className="h-3 w-3" />
        DNA Double Helix
      </div>

      <div className="bg-white/5 rounded-xl p-6">
        <svg viewBox="0 0 500 300" className="w-full h-auto">
          {/* Two helical strands */}
          <path
            d="M 50 150 Q 100 50, 150 150 T 250 150 T 350 150 T 450 150"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="4"
          />
          <path
            d="M 50 150 Q 100 250, 150 150 T 250 150 T 350 150 T 450 150"
            fill="none"
            stroke="#f472b6"
            strokeWidth="4"
          />

          {/* Base pairs */}
          {[
            { x: 100, color1: '#fbbf24', color2: '#10b981' },
            { x: 150, color1: '#ef4444', color2: '#8b5cf6' },
            { x: 200, color1: '#10b981', color2: '#fbbf24' },
            { x: 250, color1: '#8b5cf6', color2: '#ef4444' },
            { x: 300, color1: '#fbbf24', color2: '#10b981' },
            { x: 350, color1: '#ef4444', color2: '#8b5cf6' },
            { x: 400, color1: '#10b981', color2: '#fbbf24' },
          ].map((bp, i) => {
            const y1 = 150 - Math.sin((bp.x - 50) / 100 * Math.PI) * 50;
            const y2 = 150 + Math.sin((bp.x - 50) / 100 * Math.PI) * 50;
            return (
              <g key={i}>
                <line x1={bp.x} y1={y1} x2={bp.x} y2={y2} stroke="rgba(255,255,255,0.15)" strokeWidth="6" strokeLinecap="round" />
                <circle cx={bp.x} cy={y1 + 8} r="5" fill={bp.color1} />
                <circle cx={bp.x} cy={y2 - 8} r="5" fill={bp.color2} />
              </g>
            );
          })}

          <text x="250" y="280" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">
            A-T and G-C base pairing
          </text>
        </svg>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4 text-white/80 text-sm">
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="font-bold text-white mb-1">Adenine (A) ↔ Thymine (T)</p>
          <p className="text-xs text-white/50">2 hydrogen bonds</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="font-bold text-white mb-1">Guanine (G) ↔ Cytosine (C)</p>
          <p className="text-xs text-white/50">3 hydrogen bonds</p>
        </div>
      </div>
    </div>
  );
}

function HeartDiagram({ onSelect, selected }: { onSelect: (s: string) => void; selected: string }) {
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-400/30 text-red-300 text-[10px] font-bold uppercase tracking-wider mb-4">
        <Gauge className="h-3 w-3" />
        Human Heart
      </div>

      <div className="bg-white/5 rounded-xl p-6 flex items-center justify-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-[400px]">
          {/* Heart shape */}
          <path
            d="M 200 100 C 200 60, 260 40, 290 80 C 320 120, 300 180, 200 320 C 100 180, 80 120, 110 80 C 140 40, 200 60, 200 100 Z"
            fill="rgba(239,68,68,0.2)"
            stroke="#ef4444"
            strokeWidth="3"
          />

          {/* Atria (top chambers) */}
          <ellipse
            cx="150"
            cy="140"
            rx="35"
            ry="30"
            fill="rgba(96,165,250,0.3)"
            stroke="#60a5fa"
            strokeWidth={selected === 'ra' ? 3 : 2}
            onClick={() => onSelect('ra')}
            className="cursor-pointer"
          />
          <ellipse
            cx="250"
            cy="140"
            rx="35"
            ry="30"
            fill="rgba(96,165,250,0.3)"
            stroke="#60a5fa"
            strokeWidth={selected === 'la' ? 3 : 2}
            onClick={() => onSelect('la')}
            className="cursor-pointer"
          />

          {/* Ventricles (bottom chambers) */}
          <ellipse
            cx="160"
            cy="240"
            rx="45"
            ry="55"
            fill="rgba(251,191,36,0.25)"
            stroke="#fbbf24"
            strokeWidth={selected === 'rv' ? 3 : 2}
            onClick={() => onSelect('rv')}
            className="cursor-pointer"
          />
          <ellipse
            cx="240"
            cy="240"
            rx="45"
            ry="55"
            fill="rgba(251,191,36,0.25)"
            stroke="#fbbf24"
            strokeWidth={selected === 'lv' ? 3 : 2}
            onClick={() => onSelect('lv')}
            className="cursor-pointer"
          />

          {/* Labels */}
          <text x="150" y="145" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">RA</text>
          <text x="250" y="145" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">LA</text>
          <text x="160" y="245" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">RV</text>
          <text x="240" y="245" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">LV</text>
        </svg>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs font-bold text-sky-300">Atria (RA, LA)</p>
          <p className="text-[11px] text-white/60 mt-1">Receive blood from body & lungs</p>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs font-bold text-amber-300">Ventricles (RV, LV)</p>
          <p className="text-[11px] text-white/60 mt-1">Pump blood to body & lungs</p>
        </div>
      </div>
    </div>
  );
}

function DigestiveDiagram() {
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-orange-500/15 border border-orange-400/30 text-orange-300 text-[10px] font-bold uppercase tracking-wider mb-4">
        <Beaker className="h-3 w-3" />
        Digestive System
      </div>

      <div className="bg-white/5 rounded-xl p-6">
        <svg viewBox="0 0 400 500" className="w-full h-auto max-w-[400px] mx-auto">
          {/* Mouth */}
          <ellipse cx="200" cy="40" rx="30" ry="20" fill="rgba(251,113,133,0.3)" stroke="#fb7185" strokeWidth="2" />
          <text x="200" y="45" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Mouth</text>

          {/* Esophagus */}
          <rect x="192" y="60" width="16" height="80" fill="rgba(96,165,250,0.3)" stroke="#60a5fa" strokeWidth="2" />
          <text x="240" y="105" fill="white" fontSize="10">Esophagus</text>

          {/* Stomach */}
          <ellipse cx="190" cy="200" rx="55" ry="50" fill="rgba(239,68,68,0.25)" stroke="#ef4444" strokeWidth="2" />
          <text x="190" y="205" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Stomach</text>

          {/* Small intestine (coiled) */}
          <path
            d="M 190 260 Q 140 300, 190 340 T 190 420 Q 240 440, 200 460"
            fill="none"
            stroke="#10b981"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.5"
          />
          <text x="270" y="360" fill="white" fontSize="10">Small</text>
          <text x="270" y="375" fill="white" fontSize="10">Intestine</text>

          {/* Large intestine outline */}
          <path
            d="M 130 280 L 130 440 L 270 440 L 270 280"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.35"
          />
          <text x="60" y="360" fill="white" fontSize="10">Large</text>
          <text x="60" y="375" fill="white" fontSize="10">Intestine</text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        {[
          { name: 'Mouth', desc: 'Chewing & saliva' },
          { name: 'Stomach', desc: 'Acid digestion' },
          { name: 'Small Intestine', desc: 'Nutrient absorption' },
          { name: 'Large Intestine', desc: 'Water absorption' },
        ].map((s) => (
          <div key={s.name} className="rounded-lg bg-white/5 border border-white/10 p-2.5">
            <p className="font-bold text-white">{s.name}</p>
            <p className="text-white/50 mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotosynthesisDiagram() {
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-4">
        <Thermometer className="h-3 w-3" />
        Photosynthesis
      </div>

      <div className="bg-white/5 rounded-xl p-6">
        <div className="text-center py-4 text-white">
          <div className="text-lg sm:text-2xl">
            <KatexBlock latex="6CO_2 + 6H_2O \xrightarrow{light} C_6H_{12}O_6 + 6O_2" />
          </div>
        </div>

        <svg viewBox="0 0 500 250" className="w-full h-auto mt-4">
          {/* Sun */}
          <circle cx="80" cy="60" r="35" fill="rgba(251,191,36,0.6)" stroke="#fbbf24" strokeWidth="2" />
          <text x="80" y="65" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">☀️</text>

          {/* Sun rays */}
          {[0, 45, 90, 135].map((angle) => (
            <line
              key={angle}
              x1={80 + Math.cos((angle * Math.PI) / 180) * 40}
              y1={60 + Math.sin((angle * Math.PI) / 180) * 40}
              x2={80 + Math.cos((angle * Math.PI) / 180) * 80}
              y2={60 + Math.sin((angle * Math.PI) / 180) * 80}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          ))}

          {/* Plant */}
          <g transform="translate(250, 130)">
            {/* Stem */}
            <line x1="0" y1="50" x2="0" y2="-30" stroke="#10b981" strokeWidth="6" />
            {/* Leaves */}
            <ellipse cx="-40" cy="-10" rx="35" ry="18" fill="rgba(16,185,129,0.4)" stroke="#10b981" strokeWidth="2" transform="rotate(-20 -40 -10)" />
            <ellipse cx="40" cy="-30" rx="35" ry="18" fill="rgba(16,185,129,0.4)" stroke="#10b981" strokeWidth="2" transform="rotate(20 40 -30)" />
            {/* Roots */}
            <line x1="0" y1="50" x2="-20" y2="80" stroke="#78716c" strokeWidth="3" />
            <line x1="0" y1="50" x2="20" y2="80" stroke="#78716c" strokeWidth="3" />
            {/* Water drops */}
            <text x="-60" y="70" fill="#60a5fa" fontSize="10">💧 H₂O</text>
          </g>

          {/* CO2 */}
          <text x="350" y="80" fill="#94a3b8" fontSize="11">CO₂</text>
          <text x="350" y="100" fill="#94a3b8" fontSize="11">↓</text>

          {/* O2 out */}
          <text x="350" y="220" fill="#38bdf8" fontSize="11">O₂ ↑</text>

          {/* Glucose */}
          <text x="50" y="220" fill="#fbbf24" fontSize="11">C₆H₁₂O₆</text>
        </svg>
      </div>
    </div>
  );
}

/* ============================================================ */
/* CHEMISTRY BOARD                                              */
/* ============================================================ */

function ChemistryBoard({ presentMode = false }: { presentMode?: boolean }) {
  const [equation, setEquation] = useState('2H_2 + O_2 \\rightarrow 2H_2O');
  const [input, setInput] = useState(equation);
  const [ph, setPh] = useState(7);

  return (
    <div className={`grid ${presentMode ? 'grid-cols-1' : 'lg:grid-cols-[1fr_360px]'} gap-3 p-3 sm:p-4`}>
      <div className="space-y-3">
        {/* Equation display */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-4">
            <FlaskConical className="h-3 w-3" />
            Chemical Equation
          </div>
          <div className="text-center py-8">
            <div className="text-2xl sm:text-3xl text-white overflow-x-auto">
              <KatexBlock latex={equation} />
            </div>
          </div>
        </div>

        {/* pH Scale */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-400/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider mb-4">
            <Beaker className="h-3 w-3" />
            pH Scale
          </div>

          <div className="relative">
            <div className="h-8 rounded-lg overflow-hidden flex">
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

            <input
              type="range"
              min="0"
              max="14"
              value={ph}
              onChange={(e) => setPh(Number(e.target.value))}
              className="w-full mt-3 accent-white"
            />

            <div className="flex justify-between text-[10px] text-white/60 mt-1 font-mono">
              <span>0</span>
              <span>7 (neutral)</span>
              <span>14</span>
            </div>

            <div className="mt-3 text-center">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  ph < 7
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    : ph === 7
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                }`}
              >
                pH = {ph} · {ph < 7 ? 'Acidic' : ph === 7 ? 'Neutral' : 'Basic'}
              </span>
            </div>
          </div>
        </div>

        {/* Mini periodic table */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-400/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider mb-4">
            <Atom className="h-3 w-3" />
            Common Elements
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {COMMON_ELEMENTS.map((el) => (
              <div
                key={el.symbol}
                className="rounded-lg bg-white/5 border border-white/10 p-2 text-center hover:bg-white/10 transition cursor-pointer"
                title={el.name}
              >
                <div className="text-[9px] text-white/40 font-mono">{el.number}</div>
                <div className="text-base font-bold text-white">{el.symbol}</div>
                <div className="text-[9px] text-white/60 truncate">{el.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        {/* Equation editor */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-bold text-white">Equation Editor</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/90 outline-none focus:border-amber-400/60 resize-none"
          />
          <button
            onClick={() => setEquation(input)}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold transition"
          >
            <Play className="h-3.5 w-3.5" />
            Render
          </button>
        </div>

        {/* Preset equations */}
        <div className="rounded-2xl bg-[#0f172a] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Common Reactions</span>
          </div>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {CHEMISTRY_EQUATIONS.map((e, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(e.latex);
                  setEquation(e.latex);
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                <div className="text-white/80 text-xs overflow-x-auto">
                  <KatexInline latex={e.latex} />
                </div>
                <p className="text-[10px] text-white/40 mt-0.5">{e.name}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================ */
/* DATA                                                         */
/* ============================================================ */

const QUICK_MATH = [
  { name: 'Sum', display: '\\sum', latex: '\\sum_{i=1}^{n}' },
  { name: 'Integral', display: '\\int', latex: '\\int_{a}^{b}' },
  { name: 'Fraction', display: '\\frac{a}{b}', latex: '\\frac{a}{b}' },
  { name: 'Square root', display: '\\sqrt{x}', latex: '\\sqrt{x}' },
  { name: 'Pi', display: '\\pi', latex: '\\pi' },
  { name: 'Infinity', display: '\\infty', latex: '\\infty' },
  { name: 'Limit', display: '\\lim', latex: '\\lim_{x \\to 0}' },
  { name: 'Derivative', display: "f'", latex: "f'(x)" },
  { name: 'Arrow', display: '\\to', latex: '\\to' },
  { name: 'Alpha', display: '\\alpha', latex: '\\alpha' },
  { name: 'Beta', display: '\\beta', latex: '\\beta' },
  { name: 'Theta', display: '\\theta', latex: '\\theta' },
];

const PRESET_MATH = [
  {
    name: 'Quadratic Formula',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  },
  {
    name: "Pythagorean Theorem",
    latex: 'a^2 + b^2 = c^2',
  },
  {
    name: "Euler's Identity",
    latex: 'e^{i\\pi} + 1 = 0',
  },
  {
    name: 'Gaussian Integral',
    latex: '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
  },
  {
    name: 'Derivative Power Rule',
    latex: '\\frac{d}{dx} x^n = n x^{n-1}',
  },
  {
    name: 'Binomial Expansion',
    latex: '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k',
  },
];

const PHYSICS_FORMULAS = [
  { name: 'Newton\'s 2nd Law', latex: 'F = m \\cdot a' },
  { name: 'Kinematic Equation', latex: 'v = v_0 + a t' },
  { name: 'Distance', latex: 's = v_0 t + \\tfrac{1}{2} a t^2' },
  { name: 'Kinetic Energy', latex: 'KE = \\tfrac{1}{2} m v^2' },
  { name: 'Potential Energy', latex: 'PE = m g h' },
  { name: 'Work', latex: 'W = F \\cdot d \\cdot \\cos\\theta' },
  { name: 'Power', latex: 'P = \\frac{W}{t}' },
  { name: 'Momentum', latex: 'p = m v' },
  { name: 'Impulse', latex: 'J = F \\cdot \\Delta t = \\Delta p' },
  { name: 'Gravitational Force', latex: 'F = G\\frac{m_1 m_2}{r^2}' },
  { name: 'Ohm\'s Law', latex: 'V = I \\cdot R' },
  { name: 'Wave Equation', latex: 'v = f \\cdot \\lambda' },
  { name: 'Einstein\'s Energy', latex: 'E = m c^2' },
  { name: 'Pressure', latex: 'P = \\frac{F}{A}' },
];

const COMMON_ELEMENTS = [
  { number: 1, symbol: 'H', name: 'Hydrogen' },
  { number: 2, symbol: 'He', name: 'Helium' },
  { number: 3, symbol: 'Li', name: 'Lithium' },
  { number: 6, symbol: 'C', name: 'Carbon' },
  { number: 7, symbol: 'N', name: 'Nitrogen' },
  { number: 8, symbol: 'O', name: 'Oxygen' },
  { number: 9, symbol: 'F', name: 'Fluorine' },
  { number: 11, symbol: 'Na', name: 'Sodium' },
  { number: 12, symbol: 'Mg', name: 'Magnesium' },
  { number: 13, symbol: 'Al', name: 'Aluminium' },
  { number: 14, symbol: 'Si', name: 'Silicon' },
  { number: 15, symbol: 'P', name: 'Phosphorus' },
  { number: 16, symbol: 'S', name: 'Sulfur' },
  { number: 17, symbol: 'Cl', name: 'Chlorine' },
  { number: 19, symbol: 'K', name: 'Potassium' },
  { number: 20, symbol: 'Ca', name: 'Calcium' },
  { number: 26, symbol: 'Fe', name: 'Iron' },
  { number: 29, symbol: 'Cu', name: 'Copper' },
  { number: 30, symbol: 'Zn', name: 'Zinc' },
  { number: 47, symbol: 'Ag', name: 'Silver' },
  { number: 79, symbol: 'Au', name: 'Gold' },
  { number: 80, symbol: 'Hg', name: 'Mercury' },
  { number: 82, symbol: 'Pb', name: 'Lead' },
  { number: 92, symbol: 'U', name: 'Uranium' },
];

const CHEMISTRY_EQUATIONS = [
  { name: 'Water Formation', latex: '2H_2 + O_2 \\rightarrow 2H_2O' },
  { name: 'Combustion of Methane', latex: 'CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O' },
  { name: 'Photosynthesis', latex: '6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2' },
  { name: 'Respiration', latex: 'C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O' },
  { name: 'Acid-Base', latex: 'HCl + NaOH \\rightarrow NaCl + H_2O' },
  { name: 'Rusting', latex: '4Fe + 3O_2 \\rightarrow 2Fe_2O_3' },
  { name: 'Ammonia Synthesis', latex: 'N_2 + 3H_2 \\rightleftharpoons 2NH_3' },
  { name: 'Calcium Carbonate', latex: 'CaCO_3 \\rightarrow CaO + CO_2' },
];