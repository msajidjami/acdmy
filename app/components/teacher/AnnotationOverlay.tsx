'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Pen,
  Highlighter,
  ArrowRight,
  Square,
  Circle,
  Eraser,
  Trash2,
  Undo2,
  MousePointer2,
  Sparkles,
} from 'lucide-react';

import {
  type AnnotationMessage,
  type AnnotationPoint,
  type AnnotationStroke,
  type AnnotationTool,
  drawAnnotationStroke,
  drawLaser,
} from '@/app/lib/livekit/annotationChannel';

type Tool = 'pointer' | AnnotationTool;

const TOOLS: { id: Tool; icon: any; label: string; key: string }[] = [
  { id: 'pointer', icon: MousePointer2, label: 'Pointer', key: '1' },
  { id: 'laser', icon: Sparkles, label: 'Laser', key: '2' },
  { id: 'pen', icon: Pen, label: 'Pen', key: '3' },
  { id: 'highlighter', icon: Highlighter, label: 'Highlighter', key: '4' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow', key: '5' },
  { id: 'rect', icon: Square, label: 'Rectangle', key: '6' },
  { id: 'circle', icon: Circle, label: 'Circle', key: '7' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', key: '8' },
];

const COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ffffff', '#a855f7'];

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

type Props = {
  visible: boolean;
  onClose: () => void;
  publish: (msg: AnnotationMessage) => void;
  strokesRef: React.MutableRefObject<AnnotationStroke[]>;
};

export default function AnnotationOverlay({
  visible,
  onClose,
  publish,
  strokesRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRef = useRef<AnnotationStroke | null>(null);
  const laserRef = useRef<{ point: AnnotationPoint; at: number } | null>(null);
  const lastLaserPubRef = useRef(0);
  const drawingRef = useRef(false);
  const colorRef = useRef('#ef4444');

  const [tool, setTool] = useState<Tool>('laser');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(3);
  const [, forceTick] = useState(0);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  /* ---------- Redraw ---------- */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    for (const s of strokesRef.current) {
      drawAnnotationStroke(ctx, s, w, h);
    }
    if (currentRef.current) {
      drawAnnotationStroke(ctx, currentRef.current, w, h);
    }

    const laser = laserRef.current;
    if (laser && Date.now() - laser.at < 1200) {
      drawLaser(ctx, laser.point, colorRef.current, w, h, 26);
    }
  }, [strokesRef]);

  /* ---------- rAF loop while visible ---------- */
  useEffect(() => {
    if (!visible) return;
    let running = true;
    const loop = () => {
      if (!running) return;
      redraw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => {
      running = false;
    };
  }, [visible, redraw]);

  /* ---------- Resize ---------- */
  useEffect(() => {
    if (!visible) return;
    const onResize = () => redraw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible, redraw]);

  /* ---------- Escape ---------- */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.key === 'Delete' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        clearAll();
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= TOOLS.length) {
        setTool(TOOLS[num - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, onClose]);

  /* ---------- Helpers ---------- */
  const getPoint = (e: React.PointerEvent): AnnotationPoint | null => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const undo = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    forceTick((n) => n + 1);
    publish({ type: 'undo' });
  };

  const clearAll = () => {
    strokesRef.current = [];
    currentRef.current = null;
    laserRef.current = null;
    forceTick((n) => n + 1);
    publish({ type: 'clear' });
  };

  /* ---------- Pointer handlers ---------- */
  const onPointerDown = (e: React.PointerEvent) => {
    if (tool === 'pointer') return;
    const p = getPoint(e);
    if (!p) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'laser') {
      laserRef.current = { point: p, at: Date.now() };
      publish({ type: 'laser', point: p, color });
      return;
    }

    drawingRef.current = true;
    currentRef.current = {
      id: newId(),
      tool,
      color,
      width: tool === 'highlighter' ? 6 : tool === 'eraser' ? 24 : width,
      points: [p],
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = getPoint(e);
    if (!p) return;

    if (tool === 'laser') {
      laserRef.current = { point: p, at: Date.now() };
      const now = Date.now();
      if (now - lastLaserPubRef.current > 40) {
        lastLaserPubRef.current = now;
        publish({ type: 'laser', point: p, color });
      }
      return;
    }

    if (!drawingRef.current || !currentRef.current) return;
    const pts = currentRef.current.points;
    const last = pts[pts.length - 1];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (dx * dx + dy * dy < 0.00002) return;
    pts.push(p);
  };

  const onPointerUp = () => {
    if (tool === 'laser') return;
    if (!drawingRef.current) return;
    drawingRef.current = false;

    const stroke = currentRef.current;
    currentRef.current = null;
    if (!stroke || stroke.points.length === 0) return;

    // require some length for path tools
    const pathTool =
      stroke.tool === 'pen' ||
      stroke.tool === 'highlighter' ||
      stroke.tool === 'eraser';
    if (pathTool && stroke.points.length < 2) return;

    strokesRef.current = [...strokesRef.current, stroke];
    forceTick((n) => n + 1);
    publish({ type: 'add', stroke });
  };

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[97]"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none select-none"
        style={{ cursor: tool === 'pointer' ? 'default' : 'crosshair' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {/* Top hint */}
      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white/80 text-[11px] font-medium px-3 py-1.5 rounded-full border border-white/10 hidden sm:block">
        Draw on the screen — students see it live
      </div>

      {/* Toolbar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-24 sm:bottom-6 flex justify-center px-2">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-1.5 sm:p-2 flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 max-w-full">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                title={`${t.label} (${t.key})`}
                aria-label={t.label}
                className={[
                  'inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl transition active:scale-95',
                  active
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-white/70 hover:bg-white/10',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={[
                'h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 transition',
                color === c ? 'border-white scale-110' : 'border-white/20',
              ].join(' ')}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="w-px h-6 bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={undo}
            disabled={strokesRef.current.length === 0}
            title="Undo (Ctrl+Z)"
            className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-white/70 hover:bg-white/10 disabled:opacity-30 transition"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={strokesRef.current.length === 0}
            title="Clear all (Ctrl+Delete)"
            className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-white/70 hover:bg-white/10 disabled:opacity-30 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}