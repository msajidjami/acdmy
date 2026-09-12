'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Square,
  Circle,
  Triangle,
  Minus,
  Pen,
  Type,
  MousePointer2,
  Trash2,
  Download,
  Undo2,
  Redo2,
  Copy,
  Layers,
  Eye,
  EyeOff,
  Lock,
  ChevronUp,
  ChevronDown,
  Palette,
  Move3d,
  Maximize2,
  RotateCw,
  Grid3x3,
  Sparkles,
  Plus,
} from 'lucide-react';

/* ============================================================ */
/* TYPES                                                        */
/* ============================================================ */

type DShape = {
  id: string;
  type: 'rect' | 'ellipse' | 'triangle' | 'line' | 'path' | 'text';
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  points?: { x: number; y: number }[]; // for pen path
  text?: string;
  fontSize?: number;
  locked?: boolean;
  hidden?: boolean;
  name: string;
};

type DTool = 'select' | 'rect' | 'ellipse' | 'triangle' | 'line' | 'pen' | 'text';

/* ============================================================ */
/* CONSTANTS                                                    */
/* ============================================================ */

const ARTBOARD_W = 1200;
const ARTBOARD_H = 700;

const PALETTE = [
  '#0f172a',
  '#1e293b',
  '#475569',
  '#94a3b8',
  '#e2e8f0',
  '#ffffff',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#ca8a04',
  '#65a30d',
  '#16a34a',
  '#059669',
  '#0891b2',
  '#0284c7',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
  '#a21caf',
  '#c026d3',
  '#db2777',
  '#e11d48',
  '#f43f5e',
  '#fb7185',
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ============================================================ */
/* COMPONENT                                                    */
/* ============================================================ */

export default function DesignStudioOverlay({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [shapes, setShapes] = useState<DShape[]>([]);
  const [tool, setTool] = useState<DTool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fill, setFill] = useState('#6366f1');
  const [stroke, setStroke] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(true);

  const [dragging, setDragging] = useState<{
    id: string;
    kind: 'move' | 'resize' | 'rotate';
    startX: number;
    startY: number;
    orig: DShape;
  } | null>(null);

  const [drawing, setDrawing] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [penPath, setPenPath] = useState<{ x: number; y: number }[] | null>(null);

  const historyRef = useRef<DShape[][]>([]);
  const futureRef = useRef<DShape[][]>([]);

  const pushHistory = () => {
    historyRef.current.push(JSON.parse(JSON.stringify(shapes)));
    if (historyRef.current.length > 40) historyRef.current.shift();
    futureRef.current = [];
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(JSON.parse(JSON.stringify(shapes)));
    setShapes(prev);
  };

  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(JSON.parse(JSON.stringify(shapes)));
    setShapes(next);
  };

  /* ---------------- Canvas coordinate helpers ---------------- */

  const getCanvasPoint = (e: { clientX: number; clientY: number }) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  /* ---------------- Pointer on artboard ---------------- */

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (tool === 'select') {
      setSelectedId(null);
      return;
    }

    const p = getCanvasPoint(e);
    setDrawing({ startX: p.x, startY: p.y, currentX: p.x, currentY: p.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'pen') {
      setPenPath([{ x: p.x, y: p.y }]);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const p = getCanvasPoint(e);
    setDrawing((d) => (d ? { ...d, currentX: p.x, currentY: p.y } : d));

    if (tool === 'pen' && penPath) {
      setPenPath((pts) => (pts ? [...pts, { x: p.x, y: p.y }] : pts));
    }
  };

  const handleCanvasPointerUp = () => {
    if (!drawing) return;
    pushHistory();
    const { startX, startY, currentX, currentY } = drawing;

    if (tool === 'pen' && penPath && penPath.length > 1) {
      const xs = penPath.map((p) => p.x);
      const ys = penPath.map((p) => p.y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const w = Math.max(...xs) - x;
      const h = Math.max(...ys) - y;
      const normalized = penPath.map((p) => ({ x: p.x - x, y: p.y - y }));
      const newShape: DShape = {
        id: uid(),
        type: 'path',
        x,
        y,
        w,
        h,
        rotation: 0,
        fill: 'none',
        stroke,
        strokeWidth,
        opacity: 1,
        points: normalized,
        name: 'Path',
      };
      setShapes((prev) => [...prev, newShape]);
      setPenPath(null);
    } else if (tool === 'line') {
      const w = currentX - startX;
      const h = currentY - startY;
      const x = w >= 0 ? startX : currentX;
      const y = h >= 0 ? startY : currentY;
      const newShape: DShape = {
        id: uid(),
        type: 'line',
        x,
        y,
        w: Math.abs(w),
        h: Math.abs(h),
        rotation: 0,
        fill: 'none',
        stroke,
        strokeWidth,
        opacity: 1,
        name: 'Line',
      };
      setShapes((prev) => [...prev, newShape]);
    } else if (['rect', 'ellipse', 'triangle'].includes(tool)) {
      const w = currentX - startX;
      const h = currentY - startY;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.max(20, Math.abs(w));
      const height = Math.max(20, Math.abs(h));
      const newShape: DShape = {
        id: uid(),
        type: tool as any,
        x,
        y,
        w: width,
        h: height,
        rotation: 0,
        fill,
        stroke,
        strokeWidth,
        opacity: 1,
        name: tool.charAt(0).toUpperCase() + tool.slice(1),
      };
      setShapes((prev) => [...prev, newShape]);
    }

    setDrawing(null);
    setTool('select');
  };

  /* ---------------- Object drag / resize / rotate ---------------- */

  const startMove = (e: React.PointerEvent, shape: DShape) => {
    if (tool !== 'select' || shape.locked) return;
    e.stopPropagation();
    setSelectedId(shape.id);
    pushHistory();
    const p = getCanvasPoint(e);
    setDragging({
      id: shape.id,
      kind: 'move',
      startX: p.x,
      startY: p.y,
      orig: { ...shape },
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const startResize = (e: React.PointerEvent, shape: DShape) => {
    e.stopPropagation();
    pushHistory();
    const p = getCanvasPoint(e);
    setDragging({
      id: shape.id,
      kind: 'resize',
      startX: p.x,
      startY: p.y,
      orig: { ...shape },
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const startRotate = (e: React.PointerEvent, shape: DShape) => {
    e.stopPropagation();
    pushHistory();
    const p = getCanvasPoint(e);
    setDragging({
      id: shape.id,
      kind: 'rotate',
      startX: p.x,
      startY: p.y,
      orig: { ...shape },
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      const p = getCanvasPoint(e);
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== dragging.id) return s;

          if (dragging.kind === 'move') {
            const dx = p.x - dragging.startX;
            const dy = p.y - dragging.startY;
            return { ...s, x: dragging.orig.x + dx, y: dragging.orig.y + dy };
          }

          if (dragging.kind === 'resize') {
            const dx = p.x - dragging.startX;
            const dy = p.y - dragging.startY;
            return {
              ...s,
              w: Math.max(10, dragging.orig.w + dx),
              h: Math.max(10, dragging.orig.h + dy),
            };
          }

          if (dragging.kind === 'rotate') {
            const cx = dragging.orig.x + dragging.orig.w / 2;
            const cy = dragging.orig.y + dragging.orig.h / 2;
            const angle = Math.atan2(p.y - cy, p.x - cx) * (180 / Math.PI);
            return { ...s, rotation: angle + 90 };
          }

          return s;
        })
      );
    };

    const handleUp = () => setDragging(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, zoom]);

  /* ---------------- Selection actions ---------------- */

  const selectedShape = useMemo(
    () => shapes.find((s) => s.id === selectedId) || null,
    [shapes, selectedId]
  );

  const updateSelected = (patch: Partial<DShape>) => {
    if (!selectedId) return;
    setShapes((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s))
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    pushHistory();
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedShape) return;
    pushHistory();
    const copy: DShape = {
      ...selectedShape,
      id: uid(),
      x: selectedShape.x + 20,
      y: selectedShape.y + 20,
      name: selectedShape.name + ' copy',
    };
    setShapes((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const bringForward = () => {
    if (!selectedId) return;
    pushHistory();
    setShapes((prev) => {
      const i = prev.findIndex((s) => s.id === selectedId);
      if (i === -1 || i === prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const sendBackward = () => {
    if (!selectedId) return;
    pushHistory();
    setShapes((prev) => {
      const i = prev.findIndex((s) => s.id === selectedId);
      if (i <= 0) return prev;
      const next = [...prev];
      [next[i], next[i - 1]] = [next[i - 1], next[i]];
      return next;
    });
  };

  /* ---------------- Add text ---------------- */

  const addText = () => {
    pushHistory();
    const s: DShape = {
      id: uid(),
      type: 'text',
      x: 100,
      y: 100,
      w: 300,
      h: 60,
      rotation: 0,
      fill: 'none',
      stroke: '#0f172a',
      strokeWidth: 0,
      opacity: 1,
      text: 'Double-click to edit',
      fontSize: 32,
      name: 'Text',
    };
    setShapes((prev) => [...prev, s]);
    setSelectedId(s.id);
    setTool('select');
  };

  /* ---------------- Export PNG ---------------- */

  const exportPNG = () => {
    // Simple: serialize SVG to PNG
    const svg = document.getElementById('design-svg-inner') as SVGSVGElement | null;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = ARTBOARD_W;
      canvas.height = ARTBOARD_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        if (!b) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(b);
        link.download = `design-${Date.now()}.png`;
        link.click();
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  /* ---------------- Keyboard ---------------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === 'Escape') {
        if (selectedId) setSelectedId(null);
        else onClose();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === 'v') setTool('select');
        if (e.key === 'r') setTool('rect');
        if (e.key === 'o') setTool('ellipse');
        if (e.key === 'p') setTool('pen');
        if (e.key === 'l') setTool('line');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, onClose, shapes]);

  /* ============================================================ */

  return (
    <div className="fixed inset-0 z-[10000] bg-[#111827] flex flex-col">
      {/* ============================================
          TITLE BAR
      ============================================ */}
      <div className="shrink-0 h-11 flex items-center justify-between gap-2 px-3 bg-[#1f2937] border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold text-white/80 hidden sm:block">
              Design Studio
            </p>
          </div>
          <span className="text-[10px] text-white/30 font-mono hidden md:block">
            {ARTBOARD_W} × {ARTBOARD_H} px
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="hidden sm:inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            title="Redo (Ctrl+Y)"
            className="hidden sm:inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            title="Toggle grid"
            className={`inline-flex items-center justify-center h-8 w-8 rounded-md transition ${
              showGrid
                ? 'bg-fuchsia-500/20 text-fuchsia-300'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Grid3x3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={exportPNG}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-fuchsia-500/25 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PNG</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================
          MAIN LAYOUT
      ============================================ */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: tools */}
        <aside className="w-14 shrink-0 bg-[#1f2937] border-r border-white/5 flex flex-col items-center py-3 gap-1.5">
          <DesignToolBtn active={tool === 'select'} onClick={() => setTool('select')} title="Select (V)" icon={<MousePointer2 className="h-5 w-5" />} />
          <div className="w-8 h-px bg-white/10 my-1" />
          <DesignToolBtn active={tool === 'rect'} onClick={() => setTool('rect')} title="Rectangle (R)" icon={<Square className="h-5 w-5" />} />
          <DesignToolBtn active={tool === 'ellipse'} onClick={() => setTool('ellipse')} title="Ellipse (O)" icon={<Circle className="h-5 w-5" />} />
          <DesignToolBtn active={tool === 'triangle'} onClick={() => setTool('triangle')} title="Triangle" icon={<Triangle className="h-5 w-5" />} />
          <DesignToolBtn active={tool === 'line'} onClick={() => setTool('line')} title="Line (L)" icon={<Minus className="h-5 w-5" />} />
          <DesignToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} title="Pen (P)" icon={<Pen className="h-5 w-5" />} />
          <DesignToolBtn active={tool === 'text'} onClick={() => { setTool('text'); addText(); }} title="Text" icon={<Type className="h-5 w-5" />} />
        </aside>

        {/* Canvas area */}
        <div className="flex-1 min-w-0 relative overflow-auto bg-[#111827]">
          {/* Zoom controls */}
          <div className="sticky top-3 left-3 z-20 inline-flex items-center gap-1 p-1 rounded-xl bg-[#1f2937]/95 backdrop-blur-xl border border-white/10 shadow-xl">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
              className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition text-lg font-bold"
            >
              −
            </button>
            <span className="text-[11px] font-mono font-semibold text-white/70 min-w-[44px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition text-lg font-bold"
            >
              +
            </button>
          </div>

          {/* Artboard wrapper */}
          <div className="flex items-center justify-center min-h-full p-8">
            <div
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              className="relative bg-white shadow-2xl shadow-black/50 rounded-lg overflow-hidden"
              style={{
                width: ARTBOARD_W,
                height: ARTBOARD_H,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                cursor: tool === 'select' ? 'default' : 'crosshair',
                touchAction: 'none',
                backgroundImage: showGrid
                  ? `linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)`
                  : undefined,
                backgroundSize: showGrid ? '20px 20px' : undefined,
              }}
            >
              {/* Base SVG for shapes */}
              <svg
                id="design-svg-inner"
                width={ARTBOARD_W}
                height={ARTBOARD_H}
                className="absolute inset-0 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {shapes
                  .filter((s) => !s.hidden)
                  .map((s) => (
                    <DesignShapeSVG key={s.id} shape={s} />
                  ))}
              </svg>

              {/* Interactive overlay for each shape (move/resize/select) */}
              {shapes
                .filter((s) => !s.hidden && !s.locked)
                .map((s) => {
                  const isSel = s.id === selectedId;
                  return (
                    <div
                      key={s.id}
                      onPointerDown={(e) => startMove(e, s)}
                      style={{
                        position: 'absolute',
                        left: s.x,
                        top: s.y,
                        width: s.w,
                        height: s.h,
                        transform: `rotate(${s.rotation}deg)`,
                        cursor:
                          tool === 'select' ? 'move' : 'default',
                        pointerEvents: tool === 'select' ? 'auto' : 'none',
                        touchAction: 'none',
                      }}
                    >
                      {isSel && (
                        <>
                          {/* Bounding box */}
                          <div className="absolute inset-0 border-2 border-fuchsia-500 pointer-events-none" />
                          {/* Handles */}
                          {[
                            { pos: 'nw', x: 0, y: 0, c: 'nwse-resize' },
                            { pos: 'ne', x: 1, y: 0, c: 'nesw-resize' },
                            { pos: 'sw', x: 0, y: 1, c: 'nesw-resize' },
                            { pos: 'se', x: 1, y: 1, c: 'nwse-resize' },
                          ].map((h) => (
                            <div
                              key={h.pos}
                              onPointerDown={(e) => startResize(e, s)}
                              className="absolute w-3 h-3 bg-white border-2 border-fuchsia-500 rounded-sm"
                              style={{
                                left: h.x === 0 ? -6 : undefined,
                                right: h.x === 1 ? -6 : undefined,
                                top: h.y === 0 ? -6 : undefined,
                                bottom: h.y === 1 ? -6 : undefined,
                                cursor: h.c,
                              }}
                            />
                          ))}
                          {/* Rotate handle */}
                          <div
                            onPointerDown={(e) => startRotate(e, s)}
                            className="absolute left-1/2 -top-7 -translate-x-1/2 w-5 h-5 bg-white border-2 border-fuchsia-500 rounded-full flex items-center justify-center cursor-grab"
                          >
                            <RotateCw className="h-2.5 w-2.5 text-fuchsia-500" />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

              {/* Pen in-progress */}
              {drawing && tool === 'pen' && penPath && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={ARTBOARD_W}
                  height={ARTBOARD_H}
                >
                  <polyline
                    points={penPath.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* Drag preview rect */}
              {drawing && tool !== 'pen' && (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.min(drawing.startX, drawing.currentX),
                    top: Math.min(drawing.startY, drawing.currentY),
                    width: Math.abs(drawing.currentX - drawing.startX),
                    height: Math.abs(drawing.currentY - drawing.startY),
                    border: `2px dashed ${stroke}`,
                    background: `${fill}22`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: layers + properties */}
        {showLayers && (
          <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-[#1f2937] border-l border-white/5">
            {/* Layers header */}
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> Layers · {shapes.length}
              </p>
              {selectedShape && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={bringForward}
                    title="Bring forward"
                    className="inline-flex items-center justify-center h-5 w-5 rounded text-white/40 hover:text-white hover:bg-white/10 transition"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={sendBackward}
                    title="Send backward"
                    className="inline-flex items-center justify-center h-5 w-5 rounded text-white/40 hover:text-white hover:bg-white/10 transition"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Layers list */}
            <div className="max-h-56 overflow-y-auto p-2 space-y-0.5">
              {shapes.length === 0 ? (
                <p className="text-[10px] text-white/30 text-center py-6">
                  No layers yet. Draw a shape to start.
                </p>
              ) : (
                [...shapes].reverse().map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition ${
                        active
                          ? 'bg-fuchsia-500/20 border border-fuchsia-400/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div
                        className="h-4 w-4 rounded-sm border border-white/20 shrink-0"
                        style={{
                          background: s.fill === 'none' ? 'transparent' : s.fill,
                          borderColor: s.stroke,
                        }}
                      />
                      <span className="flex-1 text-[11px] font-semibold text-white/80 truncate">
                        {s.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShapes((prev) =>
                            prev.map((x) =>
                              x.id === s.id ? { ...x, hidden: !x.hidden } : x
                            )
                          );
                        }}
                        className="shrink-0 text-white/30 hover:text-white/70 transition"
                      >
                        {s.hidden ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShapes((prev) =>
                            prev.map((x) =>
                              x.id === s.id ? { ...x, locked: !x.locked } : x
                            )
                          );
                        }}
                        className="shrink-0 text-white/30 hover:text-white/70 transition"
                      >
                        <Lock
                          className={`h-3 w-3 ${
                            s.locked ? 'text-fuchsia-400' : ''
                          }`}
                        />
                      </button>
                    </button>
                  );
                })
              )}
            </div>

            {/* Properties */}
            <div className="flex-1 overflow-y-auto border-t border-white/5 p-3 space-y-4">
              {/* Colors */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Palette className="h-3 w-3" /> Fill
                </p>
                <div className="grid grid-cols-8 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedShape) {
                        pushHistory();
                        updateSelected({ fill: 'none' });
                      } else setFill('none');
                    }}
                    className={`h-5 w-5 rounded border-2 transition hover:scale-110 ${
                      (selectedShape?.fill ?? fill) === 'none'
                        ? 'border-white'
                        : 'border-white/15'
                    } bg-white relative`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-rose-500 rotate-45" />
                    </div>
                  </button>
                  {PALETTE.map((c) => (
                    <button
                      key={`fill-${c}`}
                      type="button"
                      onClick={() => {
                        if (selectedShape) {
                          pushHistory();
                          updateSelected({ fill: c });
                        } else setFill(c);
                      }}
                      className={`h-5 w-5 rounded border-2 transition hover:scale-110 ${
                        (selectedShape?.fill ?? fill) === c
                          ? 'border-white'
                          : 'border-white/15'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke color */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                  Stroke
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {PALETTE.slice(0, 16).map((c) => (
                    <button
                      key={`stroke-${c}`}
                      type="button"
                      onClick={() => {
                        if (selectedShape) {
                          pushHistory();
                          updateSelected({ stroke: c });
                        } else setStroke(c);
                      }}
                      className={`h-5 w-5 rounded border-2 transition hover:scale-110 ${
                        (selectedShape?.stroke ?? stroke) === c
                          ? 'border-white'
                          : 'border-white/15'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke width */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                  Stroke Width · {(selectedShape?.strokeWidth ?? strokeWidth)}px
                </p>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={selectedShape?.strokeWidth ?? strokeWidth}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (selectedShape) updateSelected({ strokeWidth: v });
                    else setStrokeWidth(v);
                  }}
                  className="w-full accent-fuchsia-500"
                />
              </div>

              {/* Opacity */}
              {selectedShape && (
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                    Opacity · {Math.round(selectedShape.opacity * 100)}%
                  </p>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={selectedShape.opacity}
                    onChange={(e) =>
                      updateSelected({ opacity: Number(e.target.value) })
                    }
                    className="w-full accent-fuchsia-500"
                  />
                </div>
              )}

              {/* Position */}
              {selectedShape && (
                <>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Move3d className="h-3 w-3" /> Position
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-white/40 font-mono">X</span>
                        <input
                          type="number"
                          value={Math.round(selectedShape.x)}
                          onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                          className="w-full bg-transparent text-white text-[11px] font-mono outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-white/40 font-mono">Y</span>
                        <input
                          type="number"
                          value={Math.round(selectedShape.y)}
                          onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                          className="w-full bg-transparent text-white text-[11px] font-mono outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-white/40 font-mono">W</span>
                        <input
                          type="number"
                          value={Math.round(selectedShape.w)}
                          onChange={(e) => updateSelected({ w: Number(e.target.value) })}
                          className="w-full bg-transparent text-white text-[11px] font-mono outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-white/40 font-mono">H</span>
                        <input
                          type="number"
                          value={Math.round(selectedShape.h)}
                          onChange={(e) => updateSelected({ h: Number(e.target.value) })}
                          className="w-full bg-transparent text-white text-[11px] font-mono outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <RotateCw className="h-3 w-3" /> Rotation · {Math.round(selectedShape.rotation)}°
                    </p>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={selectedShape.rotation}
                      onChange={(e) =>
                        updateSelected({ rotation: Number(e.target.value) })
                      }
                      className="w-full accent-fuchsia-500"
                    />
                  </div>

                  {/* Text specific */}
                  {selectedShape.type === 'text' && (
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                        Text
                      </p>
                      <textarea
                        value={selectedShape.text || ''}
                        onChange={(e) => updateSelected({ text: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[11px] text-white outline-none focus:border-fuchsia-400/50 resize-none"
                        rows={3}
                      />
                      <p className="text-[10px] text-white/40 mt-2 mb-1">
                        Font Size · {selectedShape.fontSize}px
                      </p>
                      <input
                        type="range"
                        min={10}
                        max={120}
                        value={selectedShape.fontSize || 24}
                        onChange={(e) =>
                          updateSelected({ fontSize: Number(e.target.value) })
                        }
                        className="w-full accent-fuchsia-500"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={duplicateSelected}
                      className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-semibold transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={deleteSelected}
                      className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[11px] font-semibold transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer tips */}
            <div className="shrink-0 border-t border-white/5 p-2.5 text-[10px] text-white/30 leading-relaxed">
              <p>
                <kbd className="px-1 rounded bg-white/10">V</kbd> select ·{' '}
                <kbd className="px-1 rounded bg-white/10">R</kbd> rect ·{' '}
                <kbd className="px-1 rounded bg-white/10">O</kbd> ellipse ·{' '}
                <kbd className="px-1 rounded bg-white/10">P</kbd> pen ·{' '}
                <kbd className="px-1 rounded bg-white/10">Del</kbd> remove
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* SVG SHAPE RENDERER                                           */
/* ============================================================ */

function DesignShapeSVG({ shape }: { shape: DShape }) {
  const common = {
    fill: shape.fill === 'none' ? 'none' : shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    opacity: shape.opacity,
    transform: `rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`,
  };

  if (shape.type === 'rect') {
    return (
      <rect
        {...common}
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={8}
      />
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
        transform={`rotate(${shape.rotation} ${shape.x + shape.w / 2} ${shape.y + shape.h / 2})`}
      >
        {shape.text}
      </text>
    );
  }

  return null;
}

/* ============================================================ */
/* TOOL BUTTON                                                  */
/* ============================================================ */

function DesignToolBtn({
  active,
  onClick,
  title,
  icon,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center h-10 w-10 rounded-xl transition ${
        active
          ? 'bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-lg shadow-fuchsia-500/30'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );
}