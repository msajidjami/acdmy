'use client';

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';
import rough from 'roughjs/bin/rough';
import {
  Pencil, Eraser, Minus, Square, Circle as CircleIcon, Type,
  Undo2, Redo2, Trash2, Download, Palette, ArrowRight,
  MousePointer2, Group, Ungroup, Sparkles, Loader2, BookOpen,
  Languages, X, Copy, Trash, AlertCircle, Quote, Sun, Moon,
  ZoomIn, ZoomOut, Grid3x3, Wand2, Lightbulb, FunctionSquare,
  LayoutTemplate, Send, RotateCcw, Hand, BringToFront, SendToBack,
  FileJson, FileImage, MoreVertical,
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */

export type WhiteboardHandle = {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  download: () => void;
  isEmpty: () => boolean;
  loadShapes: (shapes: Partial<WBObject>[]) => void;
  exportJSON: () => void;
  exportSVG: () => void;
};

type Tool =
  | 'select' | 'hand'
  | 'pen' | 'highlighter' | 'eraser'
  | 'line' | 'arrow' | 'rect' | 'diamond' | 'circle' | 'triangle'
  | 'text';

type ObjType = 'stroke' | 'line' | 'arrow' | 'rect' | 'diamond' | 'circle' | 'triangle' | 'text' | 'group';

type Point = { x: number; y: number };

type WBObject = {
  id: string;
  type: ObjType;
  color: string;
  strokeWidth: number;
  fill?: string;
  opacity?: number;
  points?: Point[];
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  dir?: 'ltr' | 'rtl';
  children?: WBObject[];
  seed?: number;
  roughness?: number;
  locked?: boolean;
  startBinding?: string;
  endBinding?: string;
};

type Theme = 'dark' | 'light';
type AIPanelMode = 'solve' | 'diagram' | 'explain' | 'beautify';

/* ============================================================
   THEME TOKENS
   ============================================================ */

const THEMES = {
  dark: {
    bg: 'bg-[#121212]',
    canvasBg: '#121212',
    gridLine: 'rgba(255,255,255,0.05)',
    toolbar: 'bg-[#232329]/95 border-white/10',
    panel: 'bg-[#232329] border-white/10',
    panelInner: 'bg-[#121212] border-white/10',
    text: 'text-white',
    textMuted: 'text-white/65',
    textFaint: 'text-white/40',
    btnHover: 'hover:bg-white/10',
    btnActive: 'bg-violet-600/25 text-violet-200',
    divider: 'bg-white/10',
    input: 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-400/60',
    subtle: 'bg-white/5 hover:bg-white/10',
    subtleBorder: 'border-white/10',
    isDark: true,
  },
  light: {
    bg: 'bg-[#f5f5f7]',
    canvasBg: '#ffffff',
    gridLine: 'rgba(0,0,0,0.06)',
    toolbar: 'bg-white/95 border-slate-200 shadow-lg',
    panel: 'bg-white border-slate-200 shadow-xl',
    panelInner: 'bg-slate-50 border-slate-200',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    textFaint: 'text-slate-400',
    btnHover: 'hover:bg-slate-100',
    btnActive: 'bg-violet-100 text-violet-700',
    divider: 'bg-slate-200',
    input: 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500',
    subtle: 'bg-slate-100 hover:bg-slate-200',
    subtleBorder: 'border-slate-200',
    isDark: false,
  },
} as const;

/* ============================================================
   FONTS
   ============================================================ */

const FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
  @font-face {
    font-family: 'Jameel Noori Nastaleeq';
    src: local('Jameel Noori Nastaleeq'), local('JameelNooriNastaleeq');
    font-display: swap;
  }
  .wb-nastaliq { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif; }
  .wb-arabic { font-family: 'Amiri', 'Traditional Arabic', serif; }
`;

/* ============================================================
   CONSTANTS
   ============================================================ */

const COLORS = [
  '#ffffff', '#fbbf24', '#f87171', '#a78bfa',
  '#60a5fa', '#34d399', '#f472b6', '#fb923c',
  '#e879f9', '#22d3ee', '#94a3b8', '#000000',
];

const STROKE_SIZES = [1, 2, 4, 6, 10, 16];
const FONT_SIZES = [16, 20, 24, 32, 40, 56, 72];
const SNAP_DIST = 30; // px — arrow binding threshold

let __idCounter = 0;
function uid(prefix = 'o') {
  __idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${__idCounter}-${Math.random().toString(36).slice(2, 6)}`;
}
function randomSeed() {
  return Math.floor(Math.random() * 100000);
}

/* ============================================================
   HELPERS
   ============================================================ */

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}
function isUrdu(text: string): boolean {
  return /[ٹڈڑںےھہۃ]/.test(text);
}
function getFontFor(text: string): { family: string; dir: 'ltr' | 'rtl'; className: string } {
  if (isUrdu(text))
    return { family: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif", dir: 'rtl', className: 'wb-nastaliq' };
  if (isArabic(text))
    return { family: "'Amiri', serif", dir: 'rtl', className: 'wb-arabic' };
  return { family: 'system-ui, sans-serif', dir: 'ltr', className: '' };
}

function bboxOf(obj: WBObject): { x: number; y: number; w: number; h: number } | null {
  if (obj.type === 'stroke' && obj.points && obj.points.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of obj.points) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    return { x: minX - 4, y: minY - 4, w: maxX - minX + 8, h: maxY - minY + 8 };
  }
  if (obj.type === 'line' || obj.type === 'arrow') {
    if (obj.points && obj.points.length >= 2) {
      const [a, b] = obj.points;
      return {
        x: Math.min(a.x, b.x) - 6,
        y: Math.min(a.y, b.y) - 6,
        w: Math.abs(a.x - b.x) + 12,
        h: Math.abs(a.y - b.y) + 12,
      };
    }
  }
  if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle' || obj.type === 'diamond') {
    const x = Math.min(obj.x || 0, (obj.x || 0) + (obj.w || 0));
    const y = Math.min(obj.y || 0, (obj.y || 0) + (obj.h || 0));
    return { x, y, w: Math.abs(obj.w || 0), h: Math.abs(obj.h || 0) };
  }
  if (obj.type === 'text' && obj.text) {
    const fs = obj.fontSize || 24;
    const lines = obj.text.split('\n');
    const maxLen = Math.max(...lines.map((l) => l.length));
    const w = maxLen * fs * 0.62;
    const h = lines.length * fs * 1.65;
    return { x: obj.x || 0, y: (obj.y || 0) - fs, w, h };
  }
  if (obj.type === 'group' && obj.children) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of obj.children) {
      const b = bboxOf(c);
      if (!b) continue;
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
    }
    if (minX === Infinity) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  return null;
}

function hitTest(obj: WBObject, px: number, py: number, threshold = 10): boolean {
  if (obj.type === 'stroke' && obj.points) {
    for (const p of obj.points) {
      if (Math.hypot(p.x - px, p.y - py) < threshold + obj.strokeWidth) return true;
    }
    return false;
  }
  const b = bboxOf(obj);
  if (!b) return false;
  return (
    px >= b.x - threshold && px <= b.x + b.w + threshold &&
    py >= b.y - threshold && py <= b.y + b.h + threshold
  );
}

/** Point on the boundary of a shape closest to `target`, along the ray from shape center. */
function closestPointOnShape(obj: WBObject, target: Point): Point {
  if (obj.type === 'rect') {
    const cx = obj.x! + obj.w! / 2;
    const cy = obj.y! + obj.h! / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;
    const sx = (obj.w! / 2) / Math.abs(dx || 0.0001);
    const sy = (obj.h! / 2) / Math.abs(dy || 0.0001);
    const s = Math.min(sx, sy);
    return { x: cx + dx * s, y: cy + dy * s };
  }
  if (obj.type === 'circle') {
    const cx = obj.x! + obj.w! / 2;
    const cy = obj.y! + obj.h! / 2;
    const rx = obj.w! / 2;
    const ry = obj.h! / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;
    const angle = Math.atan2(dy, dx);
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  }
  if (obj.type === 'triangle' || obj.type === 'diamond') {
    // Use ray from bbox center to target, intersect with polygon
    const b = bboxOf(obj)!;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const verts: Point[] = obj.type === 'triangle'
      ? [
          { x: obj.x! + obj.w! / 2, y: obj.y! },
          { x: obj.x! + obj.w!, y: obj.y! + obj.h! },
          { x: obj.x!, y: obj.y! + obj.h! },
        ]
      : [
          { x: obj.x! + obj.w! / 2, y: obj.y! },
          { x: obj.x! + obj.w!, y: obj.y! + obj.h! / 2 },
          { x: obj.x! + obj.w! / 2, y: obj.y! + obj.h! },
          { x: obj.x!, y: obj.y! + obj.h! / 2 },
        ];
    // Ray from (cx,cy) to target — find nearest intersection with edges
    const dx = target.x - cx;
    const dy = target.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    let bestT = Infinity;
    let best: Point | null = null;
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const b2 = verts[(i + 1) % verts.length];
      const ex = b2.x - a.x;
      const ey = b2.y - a.y;
      const denom = ux * ey - uy * ex;
      if (Math.abs(denom) < 1e-6) continue;
      const t = ((a.x - cx) * ey - (a.y - cy) * ex) / denom;
      const s = ((a.x - cx) * uy - (a.y - cy) * ux) / -denom;
      if (t > 0 && s >= 0 && s <= 1 && t < bestT) {
        bestT = t;
        best = { x: cx + ux * t, y: cy + uy * t };
      }
    }
    return best ?? target;
  }
  const b = bboxOf(obj);
  if (b) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;
    const sx = (b.w / 2) / Math.abs(dx || 0.0001);
    const sy = (b.h / 2) / Math.abs(dy || 0.0001);
    const s = Math.min(sx, sy);
    return { x: cx + dx * s, y: cy + dy * s };
  }
  return target;
}

/** Find a shape near a point — excluding anchors and non-shapes. */
function findNearShape(point: Point, shapes: WBObject[], exclude: Set<string>, maxDist = SNAP_DIST): WBObject | null {
  let best: WBObject | null = null;
  let bestDist = Infinity;
  for (const s of shapes) {
    if (exclude.has(s.id)) continue;
    if (s.type === 'arrow' || s.type === 'line' || s.type === 'stroke' || s.type === 'text' || s.type === 'group') continue;
    const b = bboxOf(s);
    if (!b) continue;
    const dx = Math.max(b.x - point.x, 0, point.x - (b.x + b.w));
    const dy = Math.max(b.y - point.y, 0, point.y - (b.y + b.h));
    const d = Math.hypot(dx, dy);
    if (d < maxDist && d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}

/** Resolve arrow bindings — snap arrow endpoints to bound shape edges dynamically. */
function resolveBindings(objects: WBObject[]): WBObject[] {
  const map = new Map(objects.map((o) => [o.id, o]));
  return objects.map((o) => {
    if ((o.type !== 'arrow' && o.type !== 'line') || (!o.startBinding && !o.endBinding)) return o;
    const pts = o.points ? [...o.points] : [];
    if (o.startBinding && map.has(o.startBinding) && pts[0]) {
      const target = map.get(o.startBinding)!;
      const other = pts[1] || pts[0];
      pts[0] = closestPointOnShape(target, other);
    }
    if (o.endBinding && map.has(o.endBinding) && pts[1]) {
      const target = map.get(o.endBinding)!;
      const other = pts[0];
      pts[1] = closestPointOnShape(target, other);
    }
    return { ...o, points: pts };
  });
}

function smoothStroke(points: Point[], window = 3): Point[] {
  if (points.length < window) return points;
  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    let sx = 0, sy = 0, n = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(points.length - 1, i + window); j++) {
      sx += points[j].x; sy += points[j].y; n++;
    }
    out.push({ x: sx / n, y: sy / n });
  }
  return out;
}

function describeObjects(objects: WBObject[]): string {
  const parts: string[] = [];
  for (const o of objects) {
    if (o.type === 'stroke') parts.push(`hand-drawn stroke (${o.points?.length || 0} points)`);
    else if (o.type === 'line') parts.push('line');
    else if (o.type === 'arrow') parts.push('arrow');
    else if (o.type === 'rect') parts.push(`rectangle (${Math.round(o.w || 0)}×${Math.round(o.h || 0)})`);
    else if (o.type === 'circle') parts.push(`ellipse (${Math.round(o.w || 0)}×${Math.round(o.h || 0)})`);
    else if (o.type === 'triangle') parts.push('triangle');
    else if (o.type === 'diamond') parts.push('diamond');
    else if (o.type === 'text') parts.push(`text "${o.text}"`);
    else if (o.type === 'group') parts.push(`group of ${o.children?.length || 0} items`);
  }
  return parts.join(', ') || 'empty selection';
}

/* ============================================================
   CANVAS DRAW HELPER
   ============================================================ */

function drawObject(
  ctx: CanvasRenderingContext2D,
  rc: any,
  obj: WBObject,
  defaultRoughness: number,
) {
  if (obj.type === 'stroke' && obj.points && obj.points.length > 1) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = obj.strokeWidth;
    ctx.globalAlpha = obj.opacity ?? 1;
    const pts = obj.points;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (obj.type === 'group' && obj.children) {
    for (const c of obj.children) drawObject(ctx, rc, c, defaultRoughness);
    return;
  }

  if (obj.type === 'text' && obj.text) {
    ctx.save();
    ctx.fillStyle = obj.color;
    ctx.font = `${obj.fontSize || 24}px ${obj.fontFamily || 'system-ui, sans-serif'}`;
    ctx.direction = obj.dir || 'ltr';
    ctx.textAlign = obj.dir === 'rtl' ? 'right' : 'left';
    ctx.textBaseline = 'alphabetic';
    const lines = obj.text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, obj.x!, obj.y! + i * (obj.fontSize || 24) * 1.6);
    });
    ctx.restore();
    return;
  }

  const options = {
    stroke: obj.color,
    strokeWidth: obj.strokeWidth,
    roughness: obj.roughness ?? defaultRoughness,
    bowing: 1,
    seed: obj.seed || 1,
    fill: obj.fill || undefined,
    fillStyle: 'solid' as const,
    preserveVertices: false,
  };

  if (obj.type === 'rect') {
    rc.rectangle(obj.x!, obj.y!, obj.w!, obj.h!, options);
  } else if (obj.type === 'circle') {
    rc.ellipse(obj.x! + obj.w! / 2, obj.y! + obj.h! / 2, obj.w!, obj.h!, options);
  } else if (obj.type === 'triangle') {
    rc.polygon(
      [
        [obj.x! + obj.w! / 2, obj.y!],
        [obj.x! + obj.w!, obj.y! + obj.h!],
        [obj.x!, obj.y! + obj.h!],
      ],
      options,
    );
  } else if (obj.type === 'diamond') {
    rc.polygon(
      [
        [obj.x! + obj.w! / 2, obj.y!],
        [obj.x! + obj.w!, obj.y! + obj.h! / 2],
        [obj.x! + obj.w! / 2, obj.y! + obj.h!],
        [obj.x!, obj.y! + obj.h! / 2],
      ],
      options,
    );
  } else if ((obj.type === 'line' || obj.type === 'arrow') && obj.points && obj.points.length >= 2) {
    const [a, b] = obj.points;
    rc.line(a.x, a.y, b.x, b.y, options);
    if (obj.type === 'arrow') {
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const headLen = Math.max(12, obj.strokeWidth * 5);
      rc.line(
        b.x, b.y,
        b.x - headLen * Math.cos(angle - Math.PI / 7),
        b.y - headLen * Math.sin(angle - Math.PI / 7),
        options,
      );
      rc.line(
        b.x, b.y,
        b.x - headLen * Math.cos(angle + Math.PI / 7),
        b.y - headLen * Math.sin(angle + Math.PI / 7),
        options,
      );
    }
  }
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const Whiteboard = forwardRef<WhiteboardHandle>(function Whiteboard(_props, ref) {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ---------- State ---------- */
  const [theme, setTheme] = useState<Theme>('dark');
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ffffff');
  const [fill, setFill] = useState<string | null>(null);
  const [size, setSize] = useState(2);
  const [fontSize, setFontSize] = useState(24);
  const [roughness, setRoughness] = useState(1.4);
  const [showPalette, setShowPalette] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });

  const [objects, setObjects] = useState<WBObject[]>([]);
  const [history, setHistory] = useState<WBObject[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [liveStroke, setLiveStroke] = useState<WBObject | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [snapTarget, setSnapTarget] = useState<string | null>(null);

  const [textModal, setTextModal] = useState<{
    open: boolean;
    mode: 'text' | 'arabic' | 'urdu';
    value: string;
    x: number;
    y: number;
    aiLoading: boolean;
    aiResult: any;
    error: string;
  }>({
    open: false, mode: 'text', value: '', x: 0, y: 0,
    aiLoading: false, aiResult: null, error: '',
  });

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AIPanelMode>('solve');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);

  const t = THEMES[theme];
  const isDark = theme === 'dark';

  /* ---------- Resolved objects (with arrow bindings snapped) ---------- */
  const resolvedObjects = useMemo(() => resolveBindings(objects), [objects]);

  /* ---------- Theme ---------- */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const prev = isDark ? '#000000' : '#ffffff';
    if (color === prev) setColor(isDark ? '#ffffff' : '#0f172a');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  /* ---------- History ---------- */
  const commit = useCallback((next: WBObject[]) => {
    setObjects(next);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIdx + 1);
      const newHist = [...trimmed, next].slice(-60);
      setHistoryIdx(newHist.length - 1);
      return newHist;
    });
  }, [historyIdx]);

  const undo = useCallback(() => {
    setHistoryIdx((idx) => {
      if (idx <= 0) return idx;
      const newIdx = idx - 1;
      setObjects(history[newIdx] || []);
      setSelectedIds(new Set());
      return newIdx;
    });
  }, [history]);

  const redo = useCallback(() => {
    setHistoryIdx((idx) => {
      if (idx >= history.length - 1) return idx;
      const newIdx = idx + 1;
      setObjects(history[newIdx] || []);
      setSelectedIds(new Set());
      return newIdx;
    });
  }, [history]);

  const clear = useCallback(() => {
    commit([]);
    setSelectedIds(new Set());
  }, [commit]);

  const download = useCallback(() => {
    const canvas = staticCanvasRef.current;
    const live = liveCanvasRef.current;
    if (!canvas) return;
    // Merge both canvases
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0);
    if (live) ctx.drawImage(live, 0, 0);
    const link = document.createElement('a');
    link.download = `board-${Date.now()}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  }, []);

  const exportJSON = useCallback(() => {
    const data = JSON.stringify({ version: 1, objects }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [objects]);

  const exportSVG = useCallback(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    svg += `<rect width="100%" height="100%" fill="${t.canvasBg}" />`;
    const shift = (p: Point) => ({ x: p.x * zoom + panOffset.x, y: p.y * zoom + panOffset.y });
    for (const obj of resolvedObjects) {
      if (obj.type === 'rect') {
        const a = shift({ x: obj.x!, y: obj.y! });
        svg += `<rect x="${a.x}" y="${a.y}" width="${obj.w! * zoom}" height="${obj.h! * zoom}" stroke="${obj.color}" stroke-width="${obj.strokeWidth}" fill="${obj.fill || 'none'}" />`;
      } else if (obj.type === 'circle') {
        const c = shift({ x: obj.x! + obj.w! / 2, y: obj.y! + obj.h! / 2 });
        svg += `<ellipse cx="${c.x}" cy="${c.y}" rx="${(obj.w! / 2) * zoom}" ry="${(obj.h! / 2) * zoom}" stroke="${obj.color}" stroke-width="${obj.strokeWidth}" fill="${obj.fill || 'none'}" />`;
      } else if (obj.type === 'triangle') {
        const a = shift({ x: obj.x! + obj.w! / 2, y: obj.y! });
        const b = shift({ x: obj.x! + obj.w!, y: obj.y! + obj.h! });
        const c = shift({ x: obj.x!, y: obj.y! + obj.h! });
        svg += `<polygon points="${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}" stroke="${obj.color}" stroke-width="${obj.strokeWidth}" fill="${obj.fill || 'none'}" />`;
      } else if (obj.type === 'diamond') {
        const pts = [
          { x: obj.x! + obj.w! / 2, y: obj.y! },
          { x: obj.x! + obj.w!, y: obj.y! + obj.h! / 2 },
          { x: obj.x! + obj.w! / 2, y: obj.y! + obj.h! },
          { x: obj.x!, y: obj.y! + obj.h! / 2 },
        ].map(shift);
        svg += `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" stroke="${obj.color}" stroke-width="${obj.strokeWidth}" fill="${obj.fill || 'none'}" />`;
      } else if (obj.type === 'stroke' && obj.points) {
        const d = obj.points.map((p, i) => {
          const s = shift(p);
          return `${i === 0 ? 'M' : 'L'}${s.x.toFixed(1)},${s.y.toFixed(1)}`;
        }).join(' ');
        svg += `<path d="${d}" stroke="${obj.color}" stroke-width="${obj.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${obj.opacity || 1}" />`;
      } else if ((obj.type === 'line' || obj.type === 'arrow') && obj.points) {
        const a = shift(obj.points[0]);
        const b = shift(obj.points[1]);
        svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${obj.color}" stroke-width="${obj.strokeWidth}" stroke-linecap="round" />`;
      } else if (obj.type === 'text' && obj.text) {
        const p = shift({ x: obj.x!, y: obj.y! });
        svg += `<text x="${p.x}" y="${p.y + (obj.fontSize || 24) * zoom}" font-size="${(obj.fontSize || 24) * zoom}" fill="${obj.color}" font-family="${(obj.fontFamily || 'sans-serif').replace(/'/g, '')}" direction="${obj.dir || 'ltr'}">${obj.text.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string))}</text>`;
      }
    }
    svg += `</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [resolvedObjects, zoom, panOffset, t.canvasBg]);

  const isEmpty = useCallback(() => objects.length === 0, [objects]);

  const loadShapes = useCallback((shapes: Partial<WBObject>[]) => {
    const newObjs: WBObject[] = shapes.map((s) => ({
      id: uid(),
      type: (s.type as ObjType) || 'rect',
      color: s.color || (isDark ? '#60a5fa' : '#2563eb'),
      strokeWidth: s.strokeWidth || 2,
      fill: s.fill,
      x: s.x, y: s.y, w: s.w, h: s.h,
      points: s.points,
      text: s.text,
      fontSize: s.fontSize || 20,
      fontFamily: s.fontFamily,
      dir: s.dir,
      seed: randomSeed(),
      roughness: 1.4,
    }));
    commit([...objects, ...newObjs]);
  }, [objects, commit, isDark]);

  useImperativeHandle(ref, () => ({ clear, undo, redo, download, isEmpty, loadShapes, exportJSON, exportSVG }));

  /* ============================================================
     REDRAW — Static layer (objects, grid, selection outlines)
     ============================================================ */
  const redrawStatic = useCallback(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = t.canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panOffset.x, dpr * panOffset.y);

    // Grid
    if (showGrid) {
      const gs = 40;
      const wl = -panOffset.x / zoom;
      const wt = -panOffset.y / zoom;
      const wr = (cssW - panOffset.x) / zoom;
      const wb = (cssH - panOffset.y) / zoom;
      ctx.save();
      ctx.strokeStyle = t.gridLine;
      ctx.lineWidth = 1 / zoom;
      for (let x = Math.floor(wl / gs) * gs; x < wr; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, wt); ctx.lineTo(x, wb); ctx.stroke();
      }
      for (let y = Math.floor(wt / gs) * gs; y < wb; y += gs) {
        ctx.beginPath(); ctx.moveTo(wl, y); ctx.lineTo(wr, y); ctx.stroke();
      }
      ctx.restore();
    }

    const rc = rough.canvas(canvas);
    for (const obj of resolvedObjects) drawObject(ctx, rc, obj, roughness);

    // Selection outlines
    if (selectedIds.size > 0) {
      ctx.save();
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([5 / zoom, 4 / zoom]);
      for (const id of selectedIds) {
        const obj = resolvedObjects.find((o) => o.id === id);
        if (!obj) continue;
        const b = bboxOf(obj);
        if (!b) continue;
        ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
      }
      ctx.restore();
    }
  }, [resolvedObjects, selectedIds, zoom, panOffset, showGrid, t, roughness]);

  /* ============================================================
     REDRAW — Live layer (current stroke, selection box, snap hint)
     ============================================================ */
  const redrawLive = useCallback(() => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panOffset.x, dpr * panOffset.y);

    if (liveStroke) {
      const rc = rough.canvas(canvas);
      drawObject(ctx, rc, liveStroke, roughness);
    }

    // Snap highlight around the shape we're about to bind to
    if (snapTarget) {
      const obj = resolvedObjects.find((o) => o.id === snapTarget);
      if (obj) {
        const b = bboxOf(obj);
        if (b) {
          ctx.save();
          ctx.strokeStyle = 'rgba(139,92,246,0.9)';
          ctx.lineWidth = 2.5 / zoom;
          ctx.setLineDash([6 / zoom, 4 / zoom]);
          ctx.strokeRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16);
          ctx.restore();
        }
      }
    }

    if (selectionBox) {
      ctx.save();
      ctx.strokeStyle = '#8b5cf6';
      ctx.fillStyle = 'rgba(139,92,246,0.08)';
      ctx.lineWidth = 1 / zoom;
      ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
      ctx.restore();
    }
  }, [liveStroke, selectionBox, snapTarget, resolvedObjects, zoom, panOffset, roughness]);

  /* ---------- Resize both canvases ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      for (const c of [staticCanvasRef.current, liveCanvasRef.current]) {
        if (!c) continue;
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
        c.style.width = `${rect.width}px`;
        c.style.height = `${rect.height}px`;
      }
      redrawStatic();
      redrawLive();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [redrawStatic, redrawLive]);

  /* ---------- Draw effects ---------- */
  useEffect(() => { redrawStatic(); }, [redrawStatic]);

  // Use rAF to coalesce live redraws
  useEffect(() => {
    const raf = requestAnimationFrame(() => redrawLive());
    return () => cancelAnimationFrame(raf);
  }, [redrawLive]);

  /* ---------- Wheel zoom / pan ---------- */
  useEffect(() => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const factor = 1 - e.deltaY * 0.0015;
        setZoom((z) => {
          const nz = Math.max(0.15, Math.min(5, z * factor));
          setPanOffset((p) => ({
            x: mx - (mx - p.x) * (nz / z),
            y: my - (my - p.y) * (nz / z),
          }));
          return nz;
        });
      } else {
        setPanOffset((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, []);

  /* ---------- Keyboard ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'Shift') setShiftPressed(true);
      if (e.key === 'Alt') { e.preventDefault(); setAltPressed(true); }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !inField && selectedIds.size > 0) {
        commit(objects.filter((o) => !selectedIds.has(o.id)));
        setSelectedIds(new Set());
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        mergeSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(new Set(objects.map((o) => o.id)));
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        download();
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setSelectionBox(null);
        setAiPanelOpen(false);
        setShowMenu(false);
        setShowPalette(false);
      }
      if (e.code === 'Space' && !inField) {
        e.preventDefault();
        setSpacePressed(true);
      }

      if (!inField && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case '1': case 'v': case 'V': setTool('select'); break;
          case '2': case 'r': case 'R': setTool('rect'); break;
          case '3': case 'd': case 'D': setTool('diamond'); break;
          case '4': case 'o': case 'O': setTool('circle'); break;
          case '5': case 'a': case 'A': setTool('arrow'); break;
          case '6': case 'l': case 'L': setTool('line'); break;
          case '7': case 'p': case 'P': setTool('pen'); break;
          case '8': case 't': case 'T': setTool('text'); break;
          case '0': case 'e': case 'E': setTool('eraser'); break;
          case 'h': case 'H': setTool('hand'); break;
          case 'x': case 'X': setTool('highlighter'); break;
        }
      }
    };
    const upHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
      if (e.key === 'Shift') setShiftPressed(false);
      if (e.key === 'Alt') setAltPressed(false);
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', upHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, objects, undo, redo]);

  /* ---------- Group / ungroup ---------- */
  const mergeSelected = () => {
    if (selectedIds.size < 2) return;
    const toGroup = objects.filter((o) => selectedIds.has(o.id));
    const rest = objects.filter((o) => !selectedIds.has(o.id));
    const group: WBObject = { id: uid('g'), type: 'group', color: '#ffffff', strokeWidth: 1, children: toGroup };
    commit([...rest, group]);
    setSelectedIds(new Set([group.id]));
  };

  const ungroupSelected = () => {
    const out: WBObject[] = [];
    for (const o of objects) {
      if (selectedIds.has(o.id) && o.type === 'group' && o.children) out.push(...o.children);
      else out.push(o);
    }
    commit(out);
    setSelectedIds(new Set());
  };

  const bringForward = () => {
    const sel = objects.filter((o) => selectedIds.has(o.id));
    const rest = objects.filter((o) => !selectedIds.has(o.id));
    commit([...rest, ...sel]);
  };
  const sendBackward = () => {
    const sel = objects.filter((o) => selectedIds.has(o.id));
    const rest = objects.filter((o) => !selectedIds.has(o.id));
    commit([...sel, ...rest]);
  };
  const duplicateSelected = () => {
    const copies: WBObject[] = [];
    const newIds = new Set<string>();
    for (const o of objects) {
      if (!selectedIds.has(o.id)) continue;
      const nid = uid();
      newIds.add(nid);
      copies.push({ ...translateObject(o, 20, 20), id: nid });
    }
    commit([...objects, ...copies]);
    setSelectedIds(newIds);
  };
  const deleteSelected = () => {
    commit(objects.filter((o) => !selectedIds.has(o.id)));
    setSelectedIds(new Set());
  };

  /* ---------- Pointer coords ---------- */
  const getPos = (e: React.PointerEvent): Point => {
    const canvas = liveCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    };
  };

  /* ---------- Angle snap helper ---------- */
  const snapAngle = (start: Point, end: Point, step = 15): Point => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const snapped = Math.round(angle / (step * Math.PI / 180)) * (step * Math.PI / 180);
    const len = Math.hypot(end.x - start.x, end.y - start.y);
    return { x: start.x + len * Math.cos(snapped), y: start.y + len * Math.sin(snapped) };
  };

  /* ---------- Pointer handlers ---------- */
  const startDraw = (e: React.PointerEvent) => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    if (spacePressed || tool === 'hand' || e.button === 1) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const pos = getPos(e);

    if (tool === 'select') {
      const hit = [...resolvedObjects].reverse().find((o) => hitTest(o, pos.x, pos.y) && !o.locked);
      if (hit) {
        if (e.shiftKey) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(hit.id)) next.delete(hit.id); else next.add(hit.id);
            return next;
          });
        } else if (!selectedIds.has(hit.id)) {
          setSelectedIds(new Set([hit.id]));
        }
        setIsMoving(true);
        setDragStart(pos);
        setDragOffset({ x: 0, y: 0 });
      } else {
        if (!e.shiftKey) setSelectedIds(new Set());
        setSelectionBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
        setIsDrawing(true);
        setDragStart(pos);
      }
      return;
    }

    if (tool === 'text') {
      setTextModal({
        open: true, mode: 'text', value: '', x: pos.x, y: pos.y,
        aiLoading: false, aiResult: null, error: '',
      });
      return;
    }

    setIsDrawing(true);
    const type: ObjType =
      tool === 'pen' || tool === 'highlighter' || tool === 'eraser' ? 'stroke'
      : (tool as ObjType);

    const base: WBObject = {
      id: uid(),
      type,
      color,
      strokeWidth: tool === 'highlighter' || tool === 'eraser' ? size * 4 : size,
      opacity: tool === 'highlighter' ? 0.4 : 1,
      seed: randomSeed(),
      roughness,
    };

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      base.points = [pos];
    } else if (tool === 'line' || tool === 'arrow') {
      // Check for start binding
      const exclude = new Set([base.id]);
      const startShape = findNearShape(pos, resolvedObjects, exclude, SNAP_DIST);
      let startPt = pos;
      if (startShape) {
        base.startBinding = startShape.id;
        // Just store raw; will resolve on draw
      }
      base.points = [startPt, startPt];
    } else if (tool === 'rect' || tool === 'circle' || tool === 'triangle' || tool === 'diamond') {
      base.x = pos.x;
      base.y = pos.y;
      base.w = 0;
      base.h = 0;
      base.fill = fill || undefined;
    }
    setLiveStroke(base);
  };

  const moveDraw = (e: React.PointerEvent) => {
    if (isPanning && dragStart) {
      setPanOffset((p) => ({
        x: p.x + (e.clientX - dragStart.x),
        y: p.y + (e.clientY - dragStart.y),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const pos = getPos(e);

    if (tool === 'select' && isMoving && dragStart) {
      setDragOffset({ x: pos.x - dragStart.x, y: pos.y - dragStart.y });
      return;
    }
    if (tool === 'select' && isDrawing && selectionBox && dragStart) {
      const x = Math.min(dragStart.x, pos.x);
      const y = Math.min(dragStart.y, pos.y);
      setSelectionBox({ x, y, w: Math.abs(pos.x - dragStart.x), h: Math.abs(pos.y - dragStart.y) });
      return;
    }

    if (!liveStroke) return;

    if (liveStroke.type === 'stroke' && liveStroke.points) {
      setLiveStroke({ ...liveStroke, points: [...liveStroke.points, pos] });
    } else if ((liveStroke.type === 'line' || liveStroke.type === 'arrow') && liveStroke.points) {
      const startPt = liveStroke.points[0];
      let endPt = pos;

      // Angle snap when Shift is held
      if (shiftPressed) endPt = snapAngle(startPt, endPt, 15);

      // Arrow binding: find shape near end point
      if (liveStroke.type === 'arrow' || liveStroke.type === 'line') {
        const exclude = new Set([liveStroke.id, liveStroke.startBinding || '']);
        const nearEnd = findNearShape(endPt, resolvedObjects, exclude, SNAP_DIST);
        if (nearEnd) {
          setSnapTarget(nearEnd.id);
          liveStroke.endBinding = nearEnd.id;
        } else {
          setSnapTarget(null);
          liveStroke.endBinding = undefined;
        }
      }

      setLiveStroke({
        ...liveStroke,
        points: [startPt, endPt],
      });
    } else if (liveStroke.type === 'rect' || liveStroke.type === 'circle' || liveStroke.type === 'triangle' || liveStroke.type === 'diamond') {
      let x1 = liveStroke.x!;
      let y1 = liveStroke.y!;
      let x2 = pos.x;
      let y2 = pos.y;

      // Shift: square / circle
      if (shiftPressed) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const m = Math.max(Math.abs(dx), Math.abs(dy));
        x2 = x1 + Math.sign(dx || 1) * m;
        y2 = y1 + Math.sign(dy || 1) * m;
      }
      // Alt: draw from center
      if (altPressed) {
        const cx = x1;
        const cy = y1;
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        x1 = cx - dx; y1 = cy - dy;
        x2 = cx + dx; y2 = cy + dy;
      }

      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      setLiveStroke({ ...liveStroke, x, y, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) });
    }
  };

  const endDraw = (e: React.PointerEvent) => {
    const canvas = liveCanvasRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);

    if (isPanning) {
      setIsPanning(false);
      setDragStart(null);
      return;
    }

    if (tool === 'select') {
      if (isMoving && dragStart) {
        const { x: dx, y: dy } = dragOffset;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          commit(objects.map((o) => selectedIds.has(o.id) ? translateObject(o, dx, dy) : o));
        }
        setIsMoving(false);
        setDragStart(null);
        setDragOffset({ x: 0, y: 0 });
      }
      if (isDrawing && selectionBox) {
        const { x, y, w, h } = selectionBox;
        const inside = objects.filter((o) => {
          const b = bboxOf(o);
          if (!b) return false;
          return b.x >= x && b.y >= y && b.x + b.w <= x + w && b.y + b.h <= y + h;
        });
        setSelectedIds(new Set(inside.map((o) => o.id)));
        setSelectionBox(null);
        setIsDrawing(false);
        setDragStart(null);
      }
      return;
    }

    if (liveStroke) {
      let keep = true;
      if (liveStroke.type === 'stroke' && liveStroke.points && liveStroke.points.length < 2) keep = false;
      if ((liveStroke.type === 'rect' || liveStroke.type === 'circle' || liveStroke.type === 'triangle' || liveStroke.type === 'diamond')
        && (liveStroke.w || 0) < 3 && (liveStroke.h || 0) < 3) keep = false;
      if ((liveStroke.type === 'line' || liveStroke.type === 'arrow') && liveStroke.points) {
        const [a, b] = liveStroke.points;
        if (Math.hypot(a.x - b.x, a.y - b.y) < 5) keep = false;
      }
      if (keep) commit([...objects, liveStroke]);
      setLiveStroke(null);
      setSnapTarget(null);
    }
    setIsDrawing(false);
  };

  function translateObject(obj: WBObject, dx: number, dy: number): WBObject {
    if (obj.type === 'group' && obj.children)
      return { ...obj, children: obj.children.map((c) => translateObject(c, dx, dy)) };
    if (obj.points) return { ...obj, points: obj.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    if (obj.x !== undefined && obj.y !== undefined) return { ...obj, x: obj.x + dx, y: obj.y + dy };
    return obj;
  }

  /* ---------- Text modal ---------- */
  const enhanceWithAI = async () => {
    const text = textModal.value.trim();
    if (!text) return;
    setTextModal((s) => ({ ...s, aiLoading: true, error: '' }));
    try {
      const res = await fetch('/api/ai/arabic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: textModal.mode }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setTextModal((s) => ({ ...s, aiLoading: false, error: data.error || 'AI failed' }));
        return;
      }
      setTextModal((s) => ({
        ...s,
        aiLoading: false,
        aiResult: data,
        value: data.enhancedText || data.arabicOriginal || s.value,
      }));
    } catch (e: any) {
      setTextModal((s) => ({ ...s, aiLoading: false, error: e.message || 'Network error' }));
    }
  };

  const placeText = (withReference: boolean) => {
    const value = textModal.value.trim();
    if (!value) { setTextModal((s) => ({ ...s, open: false })); return; }
    const font = getFontFor(value);
    const obj: WBObject = {
      id: uid('t'),
      type: 'text',
      color,
      strokeWidth: 1,
      x: textModal.x,
      y: textModal.y,
      text: withReference && textModal.aiResult?.reference
        ? `${value}\n[${textModal.aiResult.reference}]`
        : value,
      fontSize,
      fontFamily: font.family,
      dir: font.dir,
    };
    commit([...objects, obj]);
    setTextModal({ open: false, mode: 'text', value: '', x: 0, y: 0, aiLoading: false, aiResult: null, error: '' });
  };

  /* ---------- AI Panel ---------- */
  const resetAI = () => { setAiError(''); setAiResult(null); };

  const handleAISolve = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setAiLoading(true); resetAI();
    try {
      const res = await fetch('/api/ai/stem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: prompt, subject: 'math' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setAiError(data.error || 'AI failed'); return; }
      setAiResult(data);
    } catch (e: any) { setAiError(e?.message || 'Network error'); }
    finally { setAiLoading(false); }
  };

  const handleAIDiagram = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setAiLoading(true); resetAI();
    try {
      const res = await fetch('/api/ai/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, width: 900, height: 500, theme }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setAiError(data.error || 'AI failed'); return; }
      if (Array.isArray(data.shapes)) {
        loadShapes(data.shapes);
        setAiResult({ placed: data.shapes.length, summary: data.summary || `Added ${data.shapes.length} shapes` });
      } else setAiError('Invalid response');
    } catch (e: any) { setAiError(e?.message || 'Network error'); }
    finally { setAiLoading(false); }
  };

  const handleAIExplain = async () => {
    if (selectedIds.size === 0) { setAiError('Select something first'); return; }
    const selected = objects.filter((o) => selectedIds.has(o.id));
    setAiLoading(true); resetAI();
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: describeObjects(selected), count: selected.length }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setAiError(data.error || 'AI failed'); return; }
      setAiResult(data);
    } catch (e: any) { setAiError(e?.message || 'Network error'); }
    finally { setAiLoading(false); }
  };

  const handleAIBeautify = () => {
    if (selectedIds.size === 0) { setAiError('Select strokes first'); return; }
    const next = objects.map((o) => {
      if (!selectedIds.has(o.id)) return o;
      if (o.type === 'stroke' && o.points && o.points.length > 4) {
        return { ...o, points: smoothStroke(o.points, 3), roughness: 0.6 };
      }
      return o;
    });
    commit(next);
    setAiResult({ summary: `Smoothed ${selectedIds.size} item(s)` });
  };

  const changeSelected = (patch: Partial<WBObject>) => {
    if (selectedIds.size === 0) return;
    commit(objects.map((o) => selectedIds.has(o.id) ? { ...o, ...patch } : o));
  };

  /* ============================================================
     RENDER
     ============================================================ */

  const leftTools: { key: Tool; icon: any; label: string; shortcut: string }[] = [
    { key: 'select', icon: MousePointer2, label: 'Select', shortcut: '1' },
    { key: 'hand', icon: Hand, label: 'Pan', shortcut: 'H' },
    { key: 'rect', icon: Square, label: 'Rectangle', shortcut: '2' },
    { key: 'diamond', icon: DiamondIcon, label: 'Diamond', shortcut: '3' },
    { key: 'circle', icon: CircleIcon, label: 'Ellipse', shortcut: '4' },
    { key: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: '5' },
    { key: 'line', icon: Minus, label: 'Line', shortcut: '6' },
    { key: 'pen', icon: Pencil, label: 'Draw', shortcut: '7' },
    { key: 'text', icon: Type, label: 'Text', shortcut: '8' },
    { key: 'eraser', icon: Eraser, label: 'Eraser', shortcut: '0' },
  ];

  const cursorStyle = (() => {
    if (isPanning) return 'grabbing';
    if (spacePressed || tool === 'hand') return 'grab';
    if (tool === 'select') return isMoving ? 'grabbing' : 'default';
    if (tool === 'text') return 'text';
    return 'crosshair';
  })();

  return (
    <div ref={containerRef} className={`relative w-full h-full ${t.bg} overflow-hidden transition-colors`}>
      <style dangerouslySetInnerHTML={{ __html: FONT_STYLES }} />

      {/* Static layer */}
      <canvas
        ref={staticCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Live layer — receives pointer events */}
      <canvas
        ref={liveCanvasRef}
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 touch-none"
        style={{ cursor: cursorStyle }}
      />

      {/* ============================================
          LEFT VERTICAL TOOLBAR
      ============================================ */}
      <div className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 ${t.toolbar} backdrop-blur-md border rounded-2xl p-1.5 shadow-2xl`}>
        {leftTools.map((tl) => {
          const Icon = tl.icon;
          const active = tool === tl.key;
          return (
            <button
              key={tl.key}
              onClick={() => { setTool(tl.key); if (tl.key !== 'select') setSelectedIds(new Set()); }}
              title={`${tl.label} (${tl.shortcut})`}
              className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition ${
                active ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40' : `${t.textMuted} ${t.btnHover}`
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="absolute bottom-0.5 right-1 text-[8px] opacity-50 font-bold">{tl.shortcut}</span>
            </button>
          );
        })}

        <div className={`w-6 h-px ${t.divider} my-1`} />

        {/* Color */}
        <div className="relative">
          <button
            onClick={() => setShowPalette((v) => !v)}
            className="h-9 w-9 rounded-xl flex items-center justify-center transition hover:scale-105 border-2 border-white/20"
            style={{ backgroundColor: color }}
            title="Stroke color"
          >
            <Palette className="h-3.5 w-3.5 text-white mix-blend-difference" />
          </button>
          {showPalette && (
            <div className={`absolute left-12 top-0 ${t.panel} border rounded-xl p-3 shadow-2xl grid grid-cols-6 gap-2 w-[230px] z-20`}>
              <p className={`col-span-6 text-[10px] font-bold uppercase tracking-wider ${t.textFaint} mb-1`}>Stroke</p>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); changeSelected({ color: c }); }}
                  className={`h-6 w-6 rounded-md border-2 transition hover:scale-110 ${color === c ? 'border-violet-400' : 'border-white/20'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className={`col-span-6 flex items-center gap-2 mt-1 pt-2 border-t ${t.subtleBorder}`}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => { setColor(e.target.value); changeSelected({ color: e.target.value }); }}
                  className="flex-1 h-7 rounded-md bg-transparent cursor-pointer"
                />
              </div>
              <p className={`col-span-6 text-[10px] font-bold uppercase tracking-wider ${t.textFaint} mt-2 mb-1`}>Fill</p>
              <button
                onClick={() => { setFill(null); changeSelected({ fill: undefined }); }}
                className={`h-6 w-6 rounded-md border-2 ${fill === null ? 'border-violet-400' : 'border-white/20'} flex items-center justify-center`}
              >
                <X className="h-3 w-3 text-white/60" />
              </button>
              {COLORS.slice(1, 8).map((c) => (
                <button
                  key={`f-${c}`}
                  onClick={() => { setFill(c); changeSelected({ fill: c }); }}
                  className={`h-6 w-6 rounded-md border-2 transition hover:scale-110 ${fill === c ? 'border-violet-400' : 'border-white/20'}`}
                  style={{ backgroundColor: c, opacity: 0.7 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stroke size */}
        <div className="relative group">
          <button className={`h-9 w-9 rounded-xl flex items-center justify-center transition ${t.textMuted} ${t.btnHover}`} title="Stroke width">
            <span
              className="rounded-full"
              style={{
                width: Math.min(size + 3, 14),
                height: Math.min(size + 3, 14),
                backgroundColor: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)',
              }}
            />
          </button>
          <div className={`hidden group-hover:flex absolute left-12 top-0 ${t.panel} border rounded-xl p-2 shadow-2xl flex-col gap-1 z-20`}>
            {STROKE_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => { setSize(s); changeSelected({ strokeWidth: s }); }}
                className={`h-8 w-10 rounded-md flex items-center justify-center transition ${size === s ? t.btnActive : t.btnHover}`}
              >
                <span
                  className="rounded-full"
                  style={{
                    width: Math.min(s + 3, 14),
                    height: Math.min(s + 3, 14),
                    backgroundColor: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Roughness */}
        <div className="relative group">
          <button className={`h-9 w-9 rounded-xl flex items-center justify-center transition ${t.textMuted} ${t.btnHover}`} title="Sketchiness">
            <Wand2 className="h-4 w-4" />
          </button>
          <div className={`hidden group-hover:flex absolute left-12 top-0 ${t.panel} border rounded-xl p-3 shadow-2xl flex-col gap-2 w-44 z-20`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${t.textFaint}`}>Sketchiness</p>
            <input
              type="range" min="0" max="2.5" step="0.1"
              value={roughness}
              onChange={(e) => setRoughness(parseFloat(e.target.value))}
              className="w-full accent-violet-500"
            />
            <p className={`text-[10px] ${t.textFaint}`}>{roughness.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* ============================================
          TOP-RIGHT MENU
      ============================================ */}
      <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 ${t.toolbar} backdrop-blur-md border rounded-xl px-1.5 py-1.5 shadow-2xl`}>
        <button onClick={undo} disabled={historyIdx <= 0}
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.textMuted} ${t.btnHover} disabled:opacity-30 transition`} title="Undo (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </button>
        <button onClick={redo} disabled={historyIdx >= history.length - 1}
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.textMuted} ${t.btnHover} disabled:opacity-30 transition`} title="Redo">
          <Redo2 className="h-4 w-4" />
        </button>

        <div className={`w-px h-5 ${t.divider} mx-1`} />

        <button
          onClick={() => setAiPanelOpen((v) => !v)}
          className={`h-8 px-3 rounded-lg flex items-center gap-1.5 transition text-xs font-bold ${
            aiPanelOpen
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-violet-500/20 to-fuchsia-600/20 text-violet-300 hover:from-violet-500/30 hover:to-fuchsia-600/30'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI
        </button>

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.textMuted} ${t.btnHover} transition`}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className={`w-px h-5 ${t.divider} mx-1`} />

        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.textMuted} ${t.btnHover} transition`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className={`absolute top-10 right-0 ${t.panel} border rounded-xl py-1.5 shadow-2xl w-56 z-30`}>
              {[
                { icon: Download, label: 'Save PNG', action: download, hint: 'Ctrl+S' },
                { icon: FileImage, label: 'Save SVG', action: exportSVG },
                { icon: FileJson, label: 'Save JSON', action: exportJSON },
                { divider: true },
                { icon: Grid3x3, label: showGrid ? 'Hide grid' : 'Show grid', action: () => setShowGrid((v) => !v) },
                { divider: true },
                { icon: Trash2, label: 'Clear canvas', action: clear, danger: true },
              ].map((item: any, i) => {
                if (item.divider) return <div key={i} className={`h-px ${t.divider} my-1`} />;
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => { item.action(); setShowMenu(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition ${
                      item.danger ? 'text-rose-400 hover:bg-rose-500/10' : `${t.text} ${t.btnHover}`
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />{item.label}
                    </span>
                    {item.hint && <span className={`text-[10px] ${t.textFaint}`}>{item.hint}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          ZOOM CONTROLS
      ============================================ */}
      <div className={`absolute bottom-3 left-3 z-10 flex items-center gap-1 ${t.toolbar} backdrop-blur-md border rounded-xl px-1.5 py-1.5 shadow-2xl`}>
        <button
          onClick={() => setZoom((z) => Math.max(0.15, +(z - 0.1).toFixed(2)))}
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.textMuted} ${t.btnHover} transition`}
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
          className={`h-8 px-2 rounded-lg text-[11px] font-bold ${t.textMuted} ${t.btnHover} transition min-w-[52px]`}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(5, +(z + 0.1).toFixed(2)))}
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.textMuted} ${t.btnHover} transition`}
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Hint */}
      {selectedIds.size === 0 && !textModal.open && !aiPanelOpen && (
        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg ${t.panel} border text-[10px] ${t.textFaint} pointer-events-none whitespace-nowrap`}>
          Space+drag: pan · Ctrl+wheel: zoom · Shift: snap · Alt: from center
        </div>
      )}

      {/* ============================================
          PROPERTIES PANEL
      ============================================ */}
      {selectedIds.size > 0 && (
        <div className={`absolute left-16 top-1/2 -translate-y-1/2 z-10 w-56 ${t.panel} border rounded-xl p-3 shadow-2xl max-h-[80vh] overflow-y-auto`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${t.textFaint}`}>
            {selectedIds.size} selected
          </p>

          <div className="mb-3">
            <label className={`text-[10px] font-bold ${t.textMuted} mb-1.5 block`}>Stroke</label>
            <div className="grid grid-cols-6 gap-1">
              {COLORS.slice(0, 12).map((c) => (
                <button key={`s-${c}`} onClick={() => changeSelected({ color: c })}
                  className="h-5 w-5 rounded border border-white/20 hover:scale-110 transition"
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className={`text-[10px] font-bold ${t.textMuted} mb-1.5 block`}>Fill</label>
            <div className="grid grid-cols-6 gap-1">
              <button
                onClick={() => changeSelected({ fill: undefined })}
                className="h-5 w-5 rounded border border-white/20 flex items-center justify-center hover:scale-110 transition">
                <X className="h-3 w-3 text-white/60" />
              </button>
              {COLORS.slice(1, 7).map((c) => (
                <button key={`pf-${c}`} onClick={() => changeSelected({ fill: c })}
                  className="h-5 w-5 rounded border border-white/20 hover:scale-110 transition"
                  style={{ backgroundColor: c, opacity: 0.7 }} />
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className={`text-[10px] font-bold ${t.textMuted} mb-1.5 block`}>Stroke width</label>
            <div className="flex gap-1">
              {STROKE_SIZES.slice(0, 4).map((s) => (
                <button key={s} onClick={() => changeSelected({ strokeWidth: s })}
                  className={`h-7 flex-1 rounded flex items-center justify-center ${t.subtle} ${t.btnHover}`}>
                  <span className="rounded-full" style={{
                    width: Math.min(s + 2, 10), height: Math.min(s + 2, 10),
                    backgroundColor: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)',
                  }} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className={`text-[10px] font-bold ${t.textMuted} mb-1.5 block`}>
              Sketchiness · {roughness.toFixed(1)}
            </label>
            <input
              type="range" min="0" max="2.5" step="0.1"
              value={roughness}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setRoughness(v); changeSelected({ roughness: v });
              }}
              className="w-full accent-violet-500"
            />
          </div>

          <div className="mb-3">
            <label className={`text-[10px] font-bold ${t.textMuted} mb-1.5 block`}>Layers</label>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={bringForward}
                className={`h-7 rounded text-[10px] font-bold ${t.subtle} ${t.btnHover} flex items-center justify-center gap-1`}>
                <BringToFront className="h-3 w-3" /> Front
              </button>
              <button onClick={sendBackward}
                className={`h-7 rounded text-[10px] font-bold ${t.subtle} ${t.btnHover} flex items-center justify-center gap-1`}>
                <SendToBack className="h-3 w-3" /> Back
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <button onClick={mergeSelected} disabled={selectedIds.size < 2}
              className={`h-7 rounded text-[10px] font-bold ${t.subtle} ${t.btnHover} disabled:opacity-40 flex items-center justify-center`}
              title="Group">
              <Group className="h-3 w-3" />
            </button>
            <button onClick={ungroupSelected}
              className={`h-7 rounded text-[10px] font-bold ${t.subtle} ${t.btnHover} flex items-center justify-center`}
              title="Ungroup">
              <Ungroup className="h-3 w-3" />
            </button>
            <button onClick={duplicateSelected}
              className={`h-7 rounded text-[10px] font-bold ${t.subtle} ${t.btnHover} flex items-center justify-center`}
              title="Duplicate">
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <button onClick={deleteSelected}
            className="w-full h-7 mt-1 rounded text-[10px] font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 flex items-center justify-center gap-1">
            <Trash className="h-3 w-3" /> Delete
          </button>
        </div>
      )}

      {/* ============================================
          TEXT MODAL
      ============================================ */}
      {textModal.open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !textModal.aiLoading && setTextModal((s) => ({ ...s, open: false }))}
        >
          <div className={`${t.panel} border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden`} onClick={(e) => e.stopPropagation()}>
            <div className={`px-4 py-3 border-b ${t.subtleBorder} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-violet-400" />
                <span className={`text-sm font-bold ${t.text}`}>Text</span>
              </div>
              <button onClick={() => setTextModal((s) => ({ ...s, open: false }))}
                className={`h-7 w-7 rounded-lg flex items-center justify-center ${t.textFaint} ${t.btnHover}`}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <textarea
                autoFocus
                value={textModal.value}
                onChange={(e) => setTextModal((s) => ({ ...s, value: e.target.value }))}
                rows={4}
                placeholder="Type text..."
                className={`w-full ${t.input} border rounded-xl p-3 text-sm outline-none resize-none`}
              />

              <div className="flex items-center gap-2">
                <label className={`text-[10px] font-bold ${t.textMuted} uppercase`}>Size</label>
                <div className="flex gap-0.5 flex-1">
                  {FONT_SIZES.map((s) => (
                    <button key={s} onClick={() => setFontSize(s)}
                      className={`h-7 flex-1 rounded text-[10px] font-bold transition ${
                        fontSize === s ? `${t.btnActive} ${t.text}` : `${t.textFaint} ${t.btnHover}`
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {textModal.value.trim() && (
                <div className={`rounded-xl ${t.panelInner} border p-3`}>
                  <p className={`text-[10px] font-bold ${t.textFaint} uppercase tracking-wider mb-2`}>Preview</p>
                  <div className={`${t.text} break-words`}
                    style={{ fontSize: `${Math.min(fontSize, 32)}px` }}
                    dir={textModal.mode === 'arabic' || textModal.mode === 'urdu' ? 'rtl' : 'ltr'}>
                    {textModal.value}
                  </div>
                </div>
              )}
            </div>

            <div className={`px-4 py-3 border-t ${t.subtleBorder} flex items-center gap-2`}>
              <button onClick={() => setTextModal((s) => ({ ...s, open: false }))}
                className={`flex-1 h-10 rounded-xl ${t.subtle} border ${t.subtleBorder} text-sm font-bold transition`}>
                Cancel
              </button>
              <button onClick={() => placeText(false)} disabled={!textModal.value.trim()}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white text-sm font-bold transition disabled:opacity-50">
                Place
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          AI PANEL
      ============================================ */}
      {aiPanelOpen && (
        <div className={`absolute bottom-0 left-0 right-0 z-20 ${t.panel} border-t shadow-2xl`} style={{ maxHeight: '60vh' }}>
          <div className={`px-3 py-2 border-b ${t.subtleBorder} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className={`text-xs font-bold ${t.text}`}>AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              {aiResult && (
                <button onClick={resetAI} className={`h-7 px-2 rounded-lg text-[10px] font-bold ${t.textMuted} ${t.btnHover}`}>
                  <RotateCcw className="h-3 w-3 inline mr-1" />Clear
                </button>
              )}
              <button onClick={() => setAiPanelOpen(false)}
                className={`h-7 w-7 rounded-lg flex items-center justify-center ${t.textFaint} ${t.btnHover}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 px-3 pt-2 pb-1 overflow-x-auto">
            {[
              { key: 'solve' as AIPanelMode, label: 'Solve', icon: FunctionSquare },
              { key: 'diagram' as AIPanelMode, label: 'Diagram', icon: LayoutTemplate },
              { key: 'explain' as AIPanelMode, label: 'Explain', icon: Lightbulb },
              { key: 'beautify' as AIPanelMode, label: 'Beautify', icon: Wand2 },
            ].map((m) => {
              const Icon = m.icon;
              const active = aiMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => { setAiMode(m.key); resetAI(); }}
                  className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold transition border ${
                    active
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white border-transparent shadow'
                      : `${t.subtle} border ${t.subtleBorder} ${t.textMuted}`
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />{m.label}
                </button>
              );
            })}
          </div>

          <div className="px-3 pb-3 pt-1 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 90px)' }}>
            {(aiMode === 'solve' || aiMode === 'diagram') && (
              <div className="flex items-end gap-2">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={2}
                  placeholder={aiMode === 'solve' ? 'مثلاً: 2x + 5 = 15' : 'مثلاً: photosynthesis flow chart'}
                  dir="auto"
                  className={`flex-1 ${t.input} border rounded-lg px-3 py-2 text-xs outline-none resize-none`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      aiMode === 'solve' ? handleAISolve() : handleAIDiagram();
                    }
                  }}
                />
                <button
                  onClick={aiMode === 'solve' ? handleAISolve : handleAIDiagram}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="h-10 px-4 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Go
                </button>
              </div>
            )}

            {(aiMode === 'explain' || aiMode === 'beautify') && (
              <button
                onClick={aiMode === 'explain' ? handleAIExplain : handleAIBeautify}
                disabled={aiLoading || selectedIds.size === 0}
                className="w-full h-10 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {aiLoading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Working...</>
                  : aiMode === 'explain'
                    ? <><Lightbulb className="h-3.5 w-3.5" />Explain ({selectedIds.size})</>
                    : <><Wand2 className="h-3.5 w-3.5" />Beautify ({selectedIds.size})</>
                }
              </button>
            )}

            {aiError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-400/30 p-2.5 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{aiError}
              </div>
            )}

            {aiResult && (
              <div className={`rounded-xl ${t.panelInner} border ${t.subtleBorder} p-3 space-y-2 text-xs`}>
                {aiResult.title && <p className={`font-bold text-sm ${t.text}`}>{aiResult.title}</p>}
                {aiResult.summary && <p className={t.textMuted}>{aiResult.summary}</p>}
                {aiResult.answer && (
                  <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/30 p-2">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase mb-0.5">Answer</p>
                    <p className={`font-bold ${t.text}`}>{aiResult.answer}</p>
                  </div>
                )}
                {aiResult.explanation && (
                  <div className={t.textMuted}>
                    <p className={`text-[10px] font-bold uppercase mb-0.5 ${t.textFaint}`}>Explanation</p>
                    <p className="leading-loose whitespace-pre-wrap" dir="auto">{aiResult.explanation}</p>
                  </div>
                )}
                {Array.isArray(aiResult.steps) && aiResult.steps.length > 0 && (
                  <div>
                    <p className={`text-[10px] font-bold uppercase mb-1 ${t.textFaint}`}>Steps</p>
                    <ol className="space-y-1">
                      {aiResult.steps.map((s: any, i: number) => (
                        <li key={i} className={`flex items-start gap-2 ${t.textMuted}`}>
                          <span className="h-4 w-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {s.step || i + 1}
                          </span>
                          <span dir="auto">
                            {s.title && <span className={`font-bold ${t.text}`}>{s.title}: </span>}
                            {s.explanation || s.calculation || s.result}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {!aiResult && !aiError && !aiLoading && (
              <div className={`rounded-xl ${t.panelInner} border ${t.subtleBorder} p-6 text-center ${t.textFaint} text-xs`}>
                <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-40" />
                <p>
                  {aiMode === 'solve' && 'مسئلہ لکھیں — مرحلہ وار حل'}
                  {aiMode === 'diagram' && 'خاکہ کی تفصیل — shapes خود بنیں گے'}
                  {aiMode === 'explain' && 'canvas پر کچھ منتخب کریں'}
                  {aiMode === 'beautify' && 'منتخب لکیروں کو smooth کریں'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L22 12L12 22L2 12Z" />
    </svg>
  );
}

export default Whiteboard;