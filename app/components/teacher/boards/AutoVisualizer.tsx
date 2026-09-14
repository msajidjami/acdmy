'use client';

import { useMemo } from 'react';

/* ============================================================
   TYPES
   ============================================================ */

type VizType =
  | 'addition' | 'subtraction' | 'multiplication' | 'division'
  | 'graph' | 'pythagoras' | 'circle' | 'triangle'
  | 'force' | 'einstein' | 'pendulum' | 'wave'
  | 'water_molecule' | 'reaction' | 'atom'
  | 'cell' | 'dna' | 'heart' | 'photosynthesis'
  | 'generic';

interface Props {
  vizType: VizType | string;
  params: Record<string, any>;
}

/* ============================================================
   MAIN
   ============================================================ */

export default function AutoVisualizer({ vizType, params }: Props) {
  switch (vizType) {
    case 'addition':
      return <AdditionViz {...params} />;
    case 'subtraction':
      return <SubtractionViz {...params} />;
    case 'multiplication':
      return <MultiplicationViz {...params} />;
    case 'division':
      return <DivisionViz {...params} />;
    case 'graph':
      return <GraphViz {...params} />;
    case 'pythagoras':
      return <PythagorasViz {...params} />;
    case 'circle':
      return <CircleViz {...params} />;
    case 'triangle':
      return <TriangleViz {...params} />;
    case 'force':
      return <ForceViz {...params} />;
    case 'einstein':
      return <EinsteinViz {...params} />;
    case 'water_molecule':
      return <WaterMoleculeViz />;
    case 'reaction':
      return <ReactionViz {...params} />;
    case 'dna':
      return <DnaViz />;
    case 'heart':
      return <HeartViz />;
    case 'photosynthesis':
      return <PhotosynthesisViz />;
    case 'pendulum':
      return <PendulumViz {...params} />;
    case 'wave':
      return <WaveViz {...params} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-white/40 text-sm">
          No visualization available
        </div>
      );
  }
}

/* ============================================================
   ARITHMETIC — Dots / Groups / Arrays
   ============================================================ */

function Dot({
  color = '#60a5fa',
  size = 16,
  crossed = false,
  delay = 0,
}: {
  color?: string;
  size?: number;
  crossed?: boolean;
  delay?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ animation: `popIn 0.3s ease-out ${delay}s both` }}
    >
      <circle cx="10" cy="10" r="8" fill={color} opacity="0.85" />
      {crossed && (
        <g stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </g>
      )}
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.3); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </svg>
  );
}

function AdditionViz({
  a = 5,
  b = 3,
  result = 8,
}: {
  a?: number;
  b?: number;
  result?: number;
}) {
  const A = Math.min(Math.max(Number(a) || 0, 0), 20);
  const B = Math.min(Math.max(Number(b) || 0, 0), 20);
  const R = Number(result) || A + B;

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-white text-5xl font-bold font-mono flex items-center gap-4">
        <span className="text-blue-400">{A}</span>
        <span className="text-white/40">+</span>
        <span className="text-emerald-400">{B}</span>
        <span className="text-white/40">=</span>
        <span className="text-amber-400">{R}</span>
      </div>

      <div className="flex items-center gap-6 flex-wrap justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-center min-h-[60px] items-center">
            {Array.from({ length: A }).map((_, i) => (
              <Dot key={i} color="#60a5fa" delay={i * 0.03} />
            ))}
          </div>
          <span className="text-xs text-blue-400 font-bold">{A}</span>
        </div>

        <span className="text-white/40 text-3xl font-bold">+</span>

        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-center min-h-[60px] items-center">
            {Array.from({ length: B }).map((_, i) => (
              <Dot key={i} color="#10b981" delay={(A + i) * 0.03} />
            ))}
          </div>
          <span className="text-xs text-emerald-400 font-bold">{B}</span>
        </div>

        <span className="text-white/40 text-3xl font-bold">=</span>

        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap gap-1.5 max-w-[240px] justify-center min-h-[60px] items-center">
            {Array.from({ length: R }).map((_, i) => (
              <Dot key={i} color="#fbbf24" delay={(A + B + i) * 0.03} />
            ))}
          </div>
          <span className="text-xs text-amber-400 font-bold">{R}</span>
        </div>
      </div>

      <p className="text-white/60 text-sm italic">
        {A} dots + {B} dots = {R} dots
      </p>
    </div>
  );
}

function SubtractionViz({
  a = 5,
  b = 2,
  result = 3,
}: {
  a?: number;
  b?: number;
  result?: number;
}) {
  const A = Math.min(Math.max(Number(a) || 0, 0), 20);
  const B = Math.min(Math.max(Number(b) || 0, 0), A);
  const R = Number(result) || A - B;

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-white text-5xl font-bold font-mono flex items-center gap-4">
        <span className="text-blue-400">{A}</span>
        <span className="text-white/40">−</span>
        <span className="text-rose-400">{B}</span>
        <span className="text-white/40">=</span>
        <span className="text-amber-400">{R}</span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap gap-1.5 max-w-[400px] justify-center min-h-[60px] items-center">
          {Array.from({ length: A }).map((_, i) => (
            <Dot
              key={i}
              color={i < B ? '#60a5fa' : '#10b981'}
              crossed={i < B}
              delay={i * 0.03}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-rose-400 font-bold">✕ {B} removed</span>
          <span className="text-emerald-400 font-bold">✓ {R} remain</span>
        </div>
      </div>

      <p className="text-white/60 text-sm italic">
        Start with {A}, remove {B}, {R} remain
      </p>
    </div>
  );
}

function MultiplicationViz({
  a = 3,
  b = 4,
  result = 12,
}: {
  a?: number;
  b?: number;
  result?: number;
}) {
  const A = Math.min(Math.max(Number(a) || 0, 1), 10);
  const B = Math.min(Math.max(Number(b) || 0, 1), 10);
  const R = Number(result) || A * B;

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-white text-5xl font-bold font-mono flex items-center gap-4">
        <span className="text-violet-400">{A}</span>
        <span className="text-white/40">×</span>
        <span className="text-emerald-400">{B}</span>
        <span className="text-white/40">=</span>
        <span className="text-amber-400">{R}</span>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {Array.from({ length: A }).map((_, gi) => (
          <div
            key={gi}
            className="rounded-xl border-2 border-violet-500/40 bg-violet-500/5 p-3"
          >
            <div className="grid grid-cols-2 gap-1.5">
              {Array.from({ length: B }).map((_, i) => (
                <Dot
                  key={i}
                  color="#10b981"
                  size={14}
                  delay={(gi * B + i) * 0.04}
                />
              ))}
            </div>
            <p className="text-[10px] text-violet-300 text-center mt-1 font-bold">
              Group {gi + 1}
            </p>
          </div>
        ))}
      </div>

      <p className="text-white/60 text-sm italic">
        {A} groups of {B} = {R} total
      </p>
    </div>
  );
}

function DivisionViz({
  a = 12,
  b = 3,
  result = 4,
}: {
  a?: number;
  b?: number;
  result?: number;
}) {
  const A = Math.min(Math.max(Number(a) || 0, 1), 30);
  const B = Math.min(Math.max(Number(b) || 0, 1), 10);
  const R = Number(result) || Math.floor(A / B);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-white text-5xl font-bold font-mono flex items-center gap-4">
        <span className="text-blue-400">{A}</span>
        <span className="text-white/40">÷</span>
        <span className="text-emerald-400">{B}</span>
        <span className="text-white/40">=</span>
        <span className="text-amber-400">{R}</span>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        {Array.from({ length: B }).map((_, gi) => (
          <div
            key={gi}
            className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-3 flex flex-col items-center"
          >
            <div className="flex flex-wrap gap-1.5 max-w-[80px] justify-center">
              {Array.from({ length: R }).map((_, i) => (
                <Dot
                  key={i}
                  color="#fbbf24"
                  size={14}
                  delay={(gi * R + i) * 0.04}
                />
              ))}
            </div>
            <p className="text-[10px] text-emerald-300 text-center mt-1 font-bold">
              Group {gi + 1}
            </p>
          </div>
        ))}
      </div>

      <p className="text-white/60 text-sm italic">
        {A} split into {B} groups = {R} each
      </p>
    </div>
  );
}

/* ============================================================
   GRAPH
   ============================================================ */

function GraphViz({ fn = 'x^2' }: { fn?: string }) {
  const W = 480;
  const H = 300;
  const range = 5;

  const toPixel = (x: number, y: number) => ({
    px: (x / range) * (W / 2) + W / 2,
    py: -((y / range) * (H / 2)) + H / 2,
  });

  const points = useMemo(() => {
    const pts: string[] = [];
    const N = 240;
    let lastValid = false;

    for (let i = 0; i <= N; i++) {
      const x = -range + (2 * range * i) / N;
      let y: number;
      try {
        // eslint-disable-next-line no-new-func
        y = new Function('x', `return (${fn});`)(x);
        if (!Number.isFinite(y) || Math.abs(y) > 20) {
          lastValid = false;
          continue;
        }
      } catch {
        lastValid = false;
        continue;
      }
      const { px, py } = toPixel(x, y);
      if (py < -100 || py > H + 100) {
        lastValid = false;
        continue;
      }
      pts.push(`${lastValid ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`);
      lastValid = true;
    }
    return pts.join(' ');
  }, [fn]);

  return (
    <div className="p-6">
      <p className="text-center text-white/70 text-lg font-mono mb-4">
        y = {fn}
      </p>
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
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
              />
            );
          })}
          {Array.from({ length: 8 }).map((_, i) => {
            const y = (i / 7) * H;
            return (
              <line
                key={`h${i}`}
                x1={0}
                y1={y}
                x2={W}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
              />
            );
          })}
          <line
            x1={0}
            y1={H / 2}
            x2={W}
            y2={H / 2}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />
          <line
            x1={W / 2}
            y1={0}
            x2={W / 2}
            y2={H}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />
          <path
            d={points}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text
            x={W / 2 + 6}
            y={H / 2 - 6}
            fill="rgba(255,255,255,0.5)"
            fontSize="10"
          >
            0
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ============================================================
   PYTHAGORAS
   ============================================================ */

function PythagorasViz({
  a = 3,
  b = 4,
  c = 5,
}: {
  a?: number;
  b?: number;
  c?: number;
}) {
  const A = Number(a) || 3;
  const B = Number(b) || 4;
  const C = Number(c) || Math.sqrt(A * A + B * B);

  const scale = 24;
  const aw = A * scale;
  const bw = B * scale;

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-3xl font-bold font-mono">
        a² + b² = c²
      </div>
      <div className="text-white/60 font-mono">
        {A}² + {B}² = {C.toFixed(2)}²
      </div>

      <svg viewBox="0 0 500 400" className="w-full max-w-[500px]">
        {/* Triangle */}
        <polygon
          points={`100,350 ${100 + aw},350 100,${350 - bw}`}
          fill="rgba(96,165,250,0.2)"
          stroke="#60a5fa"
          strokeWidth="2.5"
        />
        {/* a side label */}
        <text
          x={100 + aw / 2}
          y={370}
          textAnchor="middle"
          fill="#60a5fa"
          fontSize="14"
          fontWeight="bold"
        >
          a = {A}
        </text>
        {/* b side label */}
        <text
          x={80}
          y={350 - bw / 2}
          textAnchor="end"
          fill="#10b981"
          fontSize="14"
          fontWeight="bold"
        >
          b = {B}
        </text>
        {/* c side label */}
        <text
          x={100 + aw / 2 + 40}
          y={350 - bw / 2 - 20}
          fill="#fbbf24"
          fontSize="14"
          fontWeight="bold"
        >
          c = {C.toFixed(2)}
        </text>

        {/* Square on a (below) */}
        <rect
          x={100}
          y={350}
          width={aw}
          height={aw}
          fill="rgba(96,165,250,0.15)"
          stroke="#60a5fa"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <text
          x={100 + aw / 2}
          y={350 + aw / 2 + 5}
          textAnchor="middle"
          fill="#60a5fa"
          fontSize="12"
        >
          a² = {A * A}
        </text>

        {/* Square on b (left) */}
        <rect
          x={100 - bw}
          y={350 - bw}
          width={bw}
          height={bw}
          fill="rgba(16,185,129,0.15)"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <text
          x={100 - bw / 2}
          y={350 - bw / 2 + 5}
          textAnchor="middle"
          fill="#10b981"
          fontSize="12"
        >
          b² = {B * B}
        </text>

        {/* Square on c */}
        <text
          x={320}
          y={100}
          textAnchor="middle"
          fill="#fbbf24"
          fontSize="12"
        >
          c² = {(C * C).toFixed(0)}
        </text>

        {/* Right angle marker */}
        <rect
          x={100}
          y={330}
          width="20"
          height="20"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
        />
      </svg>

      <p className="text-white/70 text-sm">
        {A * A} + {B * B} = {(C * C).toFixed(0)}
      </p>
    </div>
  );
}

/* ============================================================
   CIRCLE / TRIANGLE
   ============================================================ */

function CircleViz({ r = 5 }: { r?: number }) {
  const R = Number(r) || 5;
  const area = (Math.PI * R * R).toFixed(2);
  const circ = (2 * Math.PI * R).toFixed(2);

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-3xl font-bold font-mono">
        A = πr², C = 2πr
      </div>
      <svg viewBox="0 0 300 300" className="w-64 h-64">
        <circle
          cx="150"
          cy="150"
          r="120"
          fill="rgba(251,191,36,0.15)"
          stroke="#fbbf24"
          strokeWidth="3"
        />
        <line
          x1="150"
          y1="150"
          x2="270"
          y2="150"
          stroke="#60a5fa"
          strokeWidth="2.5"
        />
        <circle cx="150" cy="150" r="4" fill="#fff" />
        <text
          x="210"
          y="140"
          fill="#60a5fa"
          fontSize="16"
          fontWeight="bold"
        >
          r = {R}
        </text>
      </svg>
      <div className="flex gap-6 text-white/80 text-sm font-mono">
        <span className="text-amber-400">Area = {area}</span>
        <span className="text-emerald-400">Circumference = {circ}</span>
      </div>
    </div>
  );
}

function TriangleViz({
  a = 3,
  b = 4,
  c = 5,
}: {
  a?: number;
  b?: number;
  c?: number;
}) {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-2xl font-bold font-mono">
        A = ½ b·h
      </div>
      <svg viewBox="0 0 300 220" className="w-80 h-60">
        <polygon
          points="50,180 250,180 150,40"
          fill="rgba(251,191,36,0.15)"
          stroke="#fbbf24"
          strokeWidth="3"
        />
        <line
          x1="150"
          y1="40"
          x2="150"
          y2="180"
          stroke="rgba(255,255,255,0.5)"
          strokeDasharray="6 4"
          strokeWidth="2"
        />
        <text x="155" y="115" fill="#fff" fontSize="14" fontWeight="bold">
          h
        </text>
        <text x="150" y="200" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
          b
        </text>
        <text x="90" y="100" fill="#60a5fa" fontSize="12">
          a={a}
        </text>
        <text x="200" y="100" fill="#10b981" fontSize="12">
          c={c}
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
   PHYSICS
   ============================================================ */

function ForceViz({
  mass = 5,
  acceleration = 2,
  force = 10,
}: {
  mass?: number;
  acceleration?: number;
  force?: number;
}) {
  const M = Number(mass) || 5;
  const A = Number(acceleration) || 2;
  const F = Number(force) || M * A;

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-3xl font-bold font-mono">
        F = m · a
      </div>
      <div className="text-white/70 font-mono text-lg">
        F = {M} × {A} = <span className="text-amber-400">{F} N</span>
      </div>

      <svg viewBox="0 0 500 200" className="w-full max-w-[500px]">
        <defs>
          <marker id="forceArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
          </marker>
        </defs>
        {/* Ground */}
        <line x1="20" y1="150" x2="480" y2="150" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        {/* Block */}
        <rect
          x="180"
          y="90"
          width="80"
          height="60"
          fill="rgba(96,165,250,0.3)"
          stroke="#60a5fa"
          strokeWidth="2.5"
          rx="6"
        />
        <text x="220" y="125" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
          {M} kg
        </text>
        {/* Force arrow */}
        <line
          x1="260"
          y1="120"
          x2={260 + Math.min(180, F * 8)}
          y2="120"
          stroke="#10b981"
          strokeWidth="4"
          markerEnd="url(#forceArrow)"
        />
        <text
          x={260 + Math.min(180, F * 8) / 2}
          y="105"
          textAnchor="middle"
          fill="#10b981"
          fontSize="14"
          fontWeight="bold"
        >
          F = {F} N
        </text>
        {/* Acceleration label */}
        <text x="220" y="175" textAnchor="middle" fill="#a78bfa" fontSize="12">
          a = {A} m/s²
        </text>
      </svg>
    </div>
  );
}

function EinsteinViz({ mass = 1 }: { mass?: number }) {
  const M = Number(mass) || 1;
  const c = 3e8;
  const E = M * c * c;

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-4xl font-bold font-mono">
        E = mc²
      </div>
      <div className="text-white/60 text-sm">
        m = {M} kg · c = 3×10⁸ m/s
      </div>
      <div className="text-amber-400 text-2xl font-mono">
        E = {E.toExponential(2)} J
      </div>

      <div className="text-7xl mt-4">⚛️ 💥</div>

      <p className="text-white/70 text-sm text-center max-w-md">
        Mass and energy are interconvertible. Even a tiny mass produces enormous energy.
      </p>
    </div>
  );
}

function PendulumViz({ length = 1, angle = 30 }: { length?: number; angle?: number }) {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-2xl font-bold font-mono">
        T = 2π√(L/g)
      </div>
      <svg viewBox="0 0 300 300" className="w-72 h-72">
        <line x1="40" y1="40" x2="260" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <line x1="150" y1="40" x2="60" y2="220" stroke="#60a5fa" strokeWidth="2" />
        <circle cx="150" cy="40" r="5" fill="#fff" />
        <circle cx="60" cy="220" r="20" fill="rgba(251,191,36,0.6)" stroke="#fbbf24" strokeWidth="2" />
        <text x="150" y="140" fill="rgba(255,255,255,0.5)" fontSize="12">
          L = {length}m
        </text>
        <text x="180" y="80" fill="#a78bfa" fontSize="12">
          θ = {angle}°
        </text>
      </svg>
    </div>
  );
}

function WaveViz({
  amplitude = 1,
  frequency = 1,
}: {
  amplitude?: number;
  frequency?: number;
}) {
  const A = Number(amplitude) || 1;
  const F = Number(frequency) || 1;

  const path = useMemo(() => {
    const pts: string[] = [];
    const W = 500;
    const H = 200;
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * W;
      const y = H / 2 - Math.sin((i / 200) * Math.PI * 2 * F * 2) * A * 60;
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [A, F]);

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-2xl font-bold font-mono">
        y = A·sin(2πft)
      </div>
      <div className="text-white/70 font-mono text-sm">
        A = {A}, f = {F} Hz
      </div>
      <svg viewBox="0 0 500 200" className="w-full max-w-[500px]">
        <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.2)" />
        <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
        <line x1="0" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="#a78bfa" strokeWidth="3" />
      </svg>
    </div>
  );
}

/* ============================================================
   CHEMISTRY
   ============================================================ */

function WaterMoleculeViz() {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-3xl font-bold font-mono">H₂O</div>
      <svg viewBox="0 0 300 260" className="w-72 h-72">
        {/* Oxygen */}
        <circle cx="150" cy="130" r="45" fill="rgba(239,68,68,0.6)" stroke="#ef4444" strokeWidth="3" />
        <text x="150" y="140" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
          O
        </text>
        {/* H1 */}
        <circle cx="80" cy="200" r="28" fill="rgba(96,165,250,0.6)" stroke="#60a5fa" strokeWidth="3" />
        <text x="80" y="210" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          H
        </text>
        {/* H2 */}
        <circle cx="220" cy="200" r="28" fill="rgba(96,165,250,0.6)" stroke="#60a5fa" strokeWidth="3" />
        <text x="220" y="210" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          H
        </text>
        {/* Bonds */}
        <line x1="120" y1="165" x2="90" y2="185" stroke="rgba(255,255,255,0.5)" strokeWidth="4" strokeLinecap="round" />
        <line x1="180" y1="165" x2="210" y2="185" stroke="rgba(255,255,255,0.5)" strokeWidth="4" strokeLinecap="round" />
        {/* 104.5° label */}
        <text x="150" y="100" textAnchor="middle" fill="#fbbf24" fontSize="12">
          104.5°
        </text>
      </svg>
      <p className="text-white/70 text-sm">Bent molecular geometry</p>
    </div>
  );
}

function ReactionViz({
  reactants = '2H2 + O2',
  products = '2H2O',
}: {
  reactants?: string;
  products?: string;
}) {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-2xl font-bold font-mono flex items-center gap-3 flex-wrap justify-center">
        <span className="text-blue-400">{reactants}</span>
        <span className="text-amber-400">→</span>
        <span className="text-emerald-400">{products}</span>
      </div>
      <div className="flex items-center gap-4 text-6xl">
        <span>💧</span>
        <span>+</span>
        <span>🔥</span>
        <span>→</span>
        <span>💨</span>
      </div>
      <p className="text-white/70 text-sm">Balanced chemical reaction</p>
    </div>
  );
}

/* ============================================================
   BIOLOGY
   ============================================================ */

function DnaViz() {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-2xl font-bold">DNA Double Helix</div>
      <svg viewBox="0 0 500 260" className="w-full max-w-[500px]">
        <path
          d="M 50 130 Q 100 40, 150 130 T 250 130 T 350 130 T 450 130"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="4"
        />
        <path
          d="M 50 130 Q 100 220, 150 130 T 250 130 T 350 130 T 450 130"
          fill="none"
          stroke="#f472b6"
          strokeWidth="4"
        />
        {[100, 150, 200, 250, 300, 350, 400].map((x, i) => {
          const y1 = 130 - Math.sin(((x - 50) / 100) * Math.PI) * 45;
          const y2 = 130 + Math.sin(((x - 50) / 100) * Math.PI) * 45;
          const colors: [string, string][] = [
            ['#fbbf24', '#10b981'],
            ['#ef4444', '#8b5cf6'],
          ];
          const [c1, c2] = colors[i % 2];
          return (
            <g key={i}>
              <line x1={x} y1={y1} x2={x} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
              <circle cx={x} cy={y1 + 8} r="5" fill={c1} />
              <circle cx={x} cy={y2 - 8} r="5" fill={c2} />
            </g>
          );
        })}
      </svg>
      <p className="text-white/70 text-sm">A-T and G-C base pairing</p>
    </div>
  );
}

function HeartViz() {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-2xl font-bold">Human Heart</div>
      <svg viewBox="0 0 300 300" className="w-72 h-72">
        <path
          d="M 150 75 C 150 45, 195 30, 217 60 C 240 90, 225 135, 150 240 C 75 135, 60 90, 83 60 C 105 30, 150 45, 150 75 Z"
          fill="rgba(239,68,68,0.25)"
          stroke="#ef4444"
          strokeWidth="3"
        />
        <ellipse cx="110" cy="105" rx="26" ry="22" fill="rgba(96,165,250,0.4)" stroke="#60a5fa" strokeWidth="2" />
        <ellipse cx="190" cy="105" rx="26" ry="22" fill="rgba(96,165,250,0.4)" stroke="#60a5fa" strokeWidth="2" />
        <ellipse cx="120" cy="180" rx="34" ry="42" fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth="2" />
        <ellipse cx="180" cy="180" rx="34" ry="42" fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth="2" />
        <text x="110" y="110" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">RA</text>
        <text x="190" y="110" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">LA</text>
        <text x="120" y="185" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">RV</text>
        <text x="180" y="185" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">LV</text>
      </svg>
    </div>
  );
}

function PhotosynthesisViz() {
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-white text-lg font-bold font-mono text-center">
        6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
      </div>
      <svg viewBox="0 0 400 200" className="w-full max-w-[400px]">
        <circle cx="60" cy="50" r="30" fill="rgba(251,191,36,0.6)" stroke="#fbbf24" strokeWidth="2" />
        <text x="60" y="55" textAnchor="middle" fill="white" fontSize="14">☀️</text>
        <g transform="translate(200, 100)">
          <line x1="0" y1="40" x2="0" y2="-25" stroke="#10b981" strokeWidth="5" />
          <ellipse cx="-32" cy="-8" rx="28" ry="14" fill="rgba(16,185,129,0.4)" stroke="#10b981" strokeWidth="2" />
          <ellipse cx="32" cy="-25" rx="28" ry="14" fill="rgba(16,185,129,0.4)" stroke="#10b981" strokeWidth="2" />
        </g>
        <text x="330" y="70" fill="#94a3b8" fontSize="11">CO₂</text>
        <text x="330" y="160" fill="#38bdf8" fontSize="11">O₂ ↑</text>
      </svg>
    </div>
  );
}