'use client';

import { Palette } from 'lucide-react';

import type {
  DesignBoardState,
  DesignShape,
} from '@/app/lib/livekit/whiteboardChannel';

export default function DesignBoardViewer({
  state,
}: {
  state: DesignBoardState;
}) {
  const shapes = state?.shapes || [];
  const showGrid = state?.showGrid || false;

  return (
    <div className="h-full overflow-auto bg-slate-100">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center">
          <Palette className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Design Studio
          </p>
          <p className="text-sm font-bold text-slate-900">
            {shapes.length} shape{shapes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-700 text-[10px] font-bold uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="p-4 flex items-center justify-center min-h-[600px]">
        <div
          className="relative bg-white shadow-lg rounded-lg overflow-hidden"
          style={{
            width: 1200,
            height: 700,
            backgroundImage: showGrid
              ? `linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)`
              : undefined,
            backgroundSize: showGrid ? '20px 20px' : undefined,
          }}
        >
          <svg
            width="1200"
            height="700"
            xmlns="http://www.w3.org/2000/svg"
          >
            {shapes.map((shape) => (
              <ShapeSVG key={shape.id} shape={shape} />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

function ShapeSVG({ shape }: { shape: DesignShape }) {
  const common = {
    fill: shape.fill === 'none' ? 'none' : shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    opacity: shape.opacity,
    transform: `rotate(${shape.rotation} ${shape.x + shape.w / 2} ${
      shape.y + shape.h / 2
    })`,
  };

  if (shape.type === 'rect') {
    return (
      <rect {...common} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={8} />
    );
  }
  if (shape.type === 'ellipse') {
    return (
      <ellipse
        {...common}
        cx={shape.x + shape.w / 2}
        cy={shape.y + shape.h / 2}
        rx={shape.w / 2}
        ry={shape.h / 2}
      />
    );
  }
  if (shape.type === 'triangle') {
    const pts = `${shape.x + shape.w / 2},${shape.y} ${shape.x + shape.w},${
      shape.y + shape.h
    } ${shape.x},${shape.y + shape.h}`;
    return <polygon {...common} points={pts} />;
  }
  if (shape.type === 'line') {
    return (
      <line
        x1={shape.x}
        y1={shape.y + shape.h}
        x2={shape.x + shape.w}
        y2={shape.y}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        opacity={shape.opacity}
        strokeLinecap="round"
      />
    );
  }
  if (shape.type === 'path' && shape.points) {
    const pointsStr = shape.points
      .map((p) => `${shape.x + p.x},${shape.y + p.y}`)
      .join(' ');
    return (
      <polyline
        points={pointsStr}
        fill="none"
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        opacity={shape.opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  if (shape.type === 'text') {
    return (
      <text
        x={shape.x}
        y={shape.y + (shape.fontSize || 32)}
        fill={shape.stroke}
        fontSize={shape.fontSize || 32}
        fontFamily="system-ui, sans-serif"
        fontWeight={600}
        opacity={shape.opacity}
        transform={`rotate(${shape.rotation} ${shape.x + shape.w / 2} ${
          shape.y + shape.h / 2
        })`}
      >
        {shape.text}
      </text>
    );
  }
  return null;
}