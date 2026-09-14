'use client';

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  Pencil, Eraser, Highlighter, Minus, Square, Circle as CircleIcon,
  Type, Undo2, Redo2, Trash2, Download, Palette, ArrowRight,
  Triangle as TriangleIcon, Baseline, MousePointer2, Group,
  Ungroup, Sparkles, Loader2, BookOpen, Languages, X, Copy,
  Move, Trash, CheckCircle2, AlertCircle, Quote, Move3d,
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
};

type Tool =
  | 'select'
  | 'pen' | 'highlighter' | 'eraser'
  | 'line' | 'arrow' | 'rect' | 'circle' | 'triangle'
  | 'text' | 'arabic' | 'urdu';

type ObjType = 'stroke' | 'line' | 'arrow' | 'rect' | 'circle' | 'triangle' | 'text' | 'group';

type Point = { x: number; y: number };

type WBObject = {
  id: string;
  type: ObjType;
  color: string;
  strokeWidth: number;
  fill?: string;
  opacity?: number;
  /* stroke */
  points?: Point[];
  /* shape */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /* text */
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  dir?: 'ltr' | 'rtl';
  /* meta */
  reference?: string;
  textType?: string;
  /* group */
  children?: WBObject[];
};

/* ============================================================
   FONTS — Jameel Noori Nastaleeq + Amiri for Arabic
   ============================================================ */

const FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap');
  @font-face {
    font-family: 'Jameel Noori Nastaleeq';
    src: local('Jameel Noori Nastaleeq'), local('JameelNooriNastaleeq');
    font-display: swap;
  }
  .wb-nastaliq { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif; }
  .wb-arabic { font-family: 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif; }
`;

/* ============================================================
   HELPERS
   ============================================================ */

const COLORS = [
  '#ffffff', '#fbbf24', '#f87171', '#a78bfa',
  '#60a5fa', '#34d399', '#f472b6', '#fb923c',
  '#e879f9', '#22d3ee', '#94a3b8', '#000000',
];

const STROKE_SIZES = [1, 2, 4, 6, 10, 16];

const FONT_SIZES = [16, 20, 24, 32, 40, 56, 72];

let __idCounter = 0;
function uid(prefix = 'o') {
  __idCounter += 1;
  return `${prefix}-${Date.now()}-${__idCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function isUrdu(text: string): boolean {
  return /[ٹڈڑںےھہۃ]/.test(text);
}

function getFontFor(text: string): { family: string; dir: 'ltr' | 'rtl'; className: string } {
  if (isUrdu(text)) {
    return {
      family: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif",
      dir: 'rtl',
      className: 'wb-nastaliq',
    };
  }
  if (isArabic(text)) {
    return {
      family: "'Amiri', 'Scheherazade New', serif",
      dir: 'rtl',
      className: 'wb-arabic',
    };
  }
  return {
    family: 'system-ui, sans-serif',
    dir: 'ltr',
    className: '',
  };
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
      const minX = Math.min(a.x, b.x) - 6;
      const minY = Math.min(a.y, b.y) - 6;
      return {
        x: minX,
        y: minY,
        w: Math.abs(a.x - b.x) + 12,
        h: Math.abs(a.y - b.y) + 12,
      };
    }
  }
  if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
    const x = Math.min(obj.x || 0, (obj.x || 0) + (obj.w || 0));
    const y = Math.min(obj.y || 0, (obj.y || 0) + (obj.h || 0));
    return { x, y, w: Math.abs(obj.w || 0), h: Math.abs(obj.h || 0) };
  }
  if (obj.type === 'text' && obj.text) {
    const fs = obj.fontSize || 24;
    const lines = obj.text.split('\n');
    const maxLen = Math.max(...lines.map((l) => l.length));
    const w = maxLen * fs * 0.6;
    const h = lines.length * fs * 1.6;
    return { x: obj.x || 0, y: (obj.y || 0) - fs, w, h };
  }
  if (obj.type === 'group' && obj.children && obj.children.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of obj.children) {
      const b = bboxOf(c);
      if (!b) continue;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w);
      maxY = Math.max(maxY, b.y + b.h);
    }
    if (minX === Infinity) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  return null;
}

function hitTest(obj: WBObject, px: number, py: number, threshold = 12): boolean {
  if (obj.type === 'stroke' && obj.points) {
    for (const p of obj.points) {
      if (Math.hypot(p.x - px, p.y - py) < threshold + obj.strokeWidth) return true;
    }
    return false;
  }
  const b = bboxOf(obj);
  if (!b) return false;
  const pad = threshold;
  return (
    px >= b.x - pad && px <= b.x + b.w + pad &&
    py >= b.y - pad && py <= b.y + b.h + pad
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const Whiteboard = forwardRef<WhiteboardHandle>(function Whiteboard(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ffffff');
  const [size, setSize] = useState(3);
  const [fontSize, setFontSize] = useState(32);
  const [showPalette, setShowPalette] = useState(false);

  const [objects, setObjects] = useState<WBObject[]>([]);
  const [history, setHistory] = useState<WBObject[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [liveStroke, setLiveStroke] = useState<WBObject | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  /* Text modals */
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
    open: false,
    mode: 'text',
    value: '',
    x: 0,
    y: 0,
    aiLoading: false,
    aiResult: null,
    error: '',
  });

  /* ---------- History helpers ---------- */
  const commit = useCallback((next: WBObject[]) => {
    setObjects(next);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIdx + 1);
      const newHist = [...trimmed, next].slice(-40);
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `stem-board-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const isEmpty = useCallback(() => objects.length === 0, [objects]);

  useImperativeHandle(ref, () => ({ clear, undo, redo, download, isEmpty }));

  /* ---------- Redraw canvas ---------- */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const drawObject = (obj: WBObject) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = obj.opacity ?? 1;
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = obj.strokeWidth;

      if (obj.type === 'group' && obj.children) {
        for (const c of obj.children) drawObject(c);
        ctx.restore();
        return;
      }

      if (obj.type === 'stroke' && obj.points && obj.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        ctx.stroke();
      } else if ((obj.type === 'line' || obj.type === 'arrow') && obj.points && obj.points.length >= 2) {
        const [a, b] = obj.points;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (obj.type === 'arrow') {
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          const headLen = Math.max(12, obj.strokeWidth * 4);
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - headLen * Math.cos(angle - Math.PI / 6), b.y - headLen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - headLen * Math.cos(angle + Math.PI / 6), b.y - headLen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      } else if (obj.type === 'rect') {
        if (obj.fill) { ctx.fillStyle = obj.fill; ctx.fillRect(obj.x!, obj.y!, obj.w!, obj.h!); }
        ctx.strokeRect(obj.x!, obj.y!, obj.w!, obj.h!);
      } else if (obj.type === 'circle') {
        const rx = Math.abs(obj.w!) / 2;
        const ry = Math.abs(obj.h!) / 2;
        const cx = obj.x! + obj.w! / 2;
        const cy = obj.y! + obj.h! / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (obj.fill) { ctx.fillStyle = obj.fill; ctx.fill(); }
        ctx.stroke();
      } else if (obj.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(obj.x! + obj.w! / 2, obj.y!);
        ctx.lineTo(obj.x! + obj.w!, obj.y! + obj.h!);
        ctx.lineTo(obj.x!, obj.y! + obj.h!);
        ctx.closePath();
        if (obj.fill) { ctx.fillStyle = obj.fill; ctx.fill(); }
        ctx.stroke();
      } else if (obj.type === 'text' && obj.text) {
        const fs = obj.fontSize || 24;
        ctx.fillStyle = obj.color;
        ctx.direction = obj.dir || 'ltr';
        ctx.textAlign = obj.dir === 'rtl' ? 'right' : 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `${fs}px ${obj.fontFamily || 'system-ui, sans-serif'}`;
        const lines = obj.text.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, obj.x!, obj.y! + i * fs * 1.6);
        });
      }

      ctx.restore();
    };

    for (const obj of objects) drawObject(obj);
    if (liveStroke) drawObject(liveStroke);

    /* Selection outlines */
    if (selectedIds.size > 0) {
      ctx.save();
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      for (const id of selectedIds) {
        const obj = objects.find((o) => o.id === id);
        if (!obj) continue;
        const b = bboxOf(obj);
        if (!b) continue;
        ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
      }
      ctx.restore();
    }

    /* Selection box (rubber band) */
    if (selectionBox) {
      ctx.save();
      ctx.strokeStyle = '#a78bfa';
      ctx.fillStyle = 'rgba(167,139,250,0.1)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
      ctx.restore();
    }
  }, [objects, liveStroke, selectedIds, selectionBox]);

  /* ---------- Init canvas + resize ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      redraw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  /* ---------- Keyboard ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0 && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          const next = objects.filter((o) => !selectedIds.has(o.id));
          commit(next);
          setSelectedIds(new Set());
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        mergeSelected();
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setSelectionBox(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, objects, undo, redo]);

  /* ---------- Merge (group) selected objects ---------- */
  const mergeSelected = () => {
    if (selectedIds.size < 2) return;
    const toGroup = objects.filter((o) => selectedIds.has(o.id));
    const rest = objects.filter((o) => !selectedIds.has(o.id));
    const group: WBObject = {
      id: uid('g'),
      type: 'group',
      color: '#ffffff',
      strokeWidth: 1,
      children: toGroup,
    };
    commit([...rest, group]);
    setSelectedIds(new Set([group.id]));
  };

  const ungroupSelected = () => {
    const newObjects: WBObject[] = [];
    for (const o of objects) {
      if (selectedIds.has(o.id) && o.type === 'group' && o.children) {
        newObjects.push(...o.children);
      } else {
        newObjects.push(o);
      }
    }
    commit(newObjects);
    setSelectedIds(new Set());
  };

  /* ---------- Pointer handlers ---------- */
  const getPos = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const pos = getPos(e);

    if (tool === 'select') {
      /* Hit test for selection */
      const hit = [...objects].reverse().find((o) => hitTest(o, pos.x, pos.y));
      if (hit) {
        if (e.shiftKey) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(hit.id)) next.delete(hit.id);
            else next.add(hit.id);
            return next;
          });
        } else {
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

    if (tool === 'text' || tool === 'arabic' || tool === 'urdu') {
      setTextModal({
        open: true,
        mode: tool === 'text' ? 'text' : tool === 'arabic' ? 'arabic' : 'urdu',
        value: '',
        x: pos.x,
        y: pos.y,
        aiLoading: false,
        aiResult: null,
        error: '',
      });
      return;
    }

    setIsDrawing(true);
    const base: WBObject = {
      id: uid(),
      type: tool === 'pen' ? 'stroke' : tool === 'highlighter' ? 'stroke' : (tool as ObjType),
      color: tool === 'highlighter' ? color : color,
      strokeWidth: tool === 'highlighter' ? size * 4 : tool === 'eraser' ? size * 4 : size,
      opacity: tool === 'highlighter' ? 0.35 : 1,
    };

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      base.points = [pos];
    } else if (tool === 'line' || tool === 'arrow') {
      base.points = [pos, pos];
    } else if (tool === 'rect' || tool === 'circle' || tool === 'triangle') {
      base.x = pos.x;
      base.y = pos.y;
      base.w = 0;
      base.h = 0;
    }
    setLiveStroke(base);
  };

  const moveDraw = (e: React.PointerEvent) => {
    const pos = getPos(e);

    if (tool === 'select' && isMoving && dragStart) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      setDragOffset({ x: dx, y: dy });
      return;
    }

    if (tool === 'select' && isDrawing && selectionBox && dragStart) {
      const x = Math.min(dragStart.x, pos.x);
      const y = Math.min(dragStart.y, pos.y);
      const w = Math.abs(pos.x - dragStart.x);
      const h = Math.abs(pos.y - dragStart.y);
      setSelectionBox({ x, y, w, h });
      return;
    }

    if (!liveStroke) return;

    if (liveStroke.type === 'stroke' && liveStroke.points) {
      setLiveStroke({ ...liveStroke, points: [...liveStroke.points, pos] });
    } else if ((liveStroke.type === 'line' || liveStroke.type === 'arrow') && liveStroke.points) {
      setLiveStroke({ ...liveStroke, points: [liveStroke.points[0], pos] });
    } else if (liveStroke.type === 'rect' || liveStroke.type === 'circle' || liveStroke.type === 'triangle') {
      const x = Math.min(liveStroke.x!, pos.x);
      const y = Math.min(liveStroke.y!, pos.y);
      const w = Math.abs(pos.x - liveStroke.x!);
      const h = Math.abs(pos.y - liveStroke.y!);
      setLiveStroke({ ...liveStroke, x, y, w, h });
    }
  };

  const endDraw = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (tool === 'select') {
      if (isMoving && dragStart) {
        const dx = dragOffset.x;
        const dy = dragOffset.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          const next = objects.map((o) => {
            if (!selectedIds.has(o.id)) return o;
            return translateObject(o, dx, dy);
          });
          commit(next);
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
      commit([...objects, liveStroke]);
      setLiveStroke(null);
    }
    setIsDrawing(false);
  };

  function translateObject(obj: WBObject, dx: number, dy: number): WBObject {
    if (obj.type === 'group' && obj.children) {
      return { ...obj, children: obj.children.map((c) => translateObject(c, dx, dy)) };
    }
    if (obj.points) {
      return { ...obj, points: obj.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    }
    if (obj.x !== undefined && obj.y !== undefined) {
      return { ...obj, x: obj.x + dx, y: obj.y + dy };
    }
    return obj;
  }

  /* ---------- Text modal actions ---------- */
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
    if (!value) {
      setTextModal((s) => ({ ...s, open: false }));
      return;
    }

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
      reference: textModal.aiResult?.reference,
      textType: textModal.aiResult?.type,
    };

    commit([...objects, obj]);
    setTextModal({
      open: false,
      mode: 'text',
      value: '',
      x: 0,
      y: 0,
      aiLoading: false,
      aiResult: null,
      error: '',
    });
  };

  /* ============================================================
     RENDER
     ============================================================ */

  const tools: { key: Tool; icon: any; label: string; accent?: string }[] = [
    { key: 'select', icon: MousePointer2, label: 'Select (V)' },
    { key: 'pen', icon: Pencil, label: 'Pen' },
    { key: 'highlighter', icon: Highlighter, label: 'Highlighter' },
    { key: 'eraser', icon: Eraser, label: 'Eraser' },
    { key: 'line', icon: Minus, label: 'Line' },
    { key: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { key: 'rect', icon: Square, label: 'Rectangle' },
    { key: 'circle', icon: CircleIcon, label: 'Circle' },
    { key: 'triangle', icon: TriangleIcon, label: 'Triangle' },
    { key: 'text', icon: Type, label: 'Text' },
    { key: 'arabic', icon: BookOpen, label: 'آیت / حدیث (Arabic + AI harakat)', accent: 'from-emerald-500 to-teal-600' },
    { key: 'urdu', icon: Languages, label: 'اردو (Nastaleeq + AI)', accent: 'from-cyan-500 to-blue-600' },
  ];

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0f1e] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: FONT_STYLES }} />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={startDraw}
        onPointerMove={moveDraw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
        className="absolute inset-0 touch-none"
        style={{
          cursor:
            tool === 'select'
              ? isMoving
                ? 'grabbing'
                : 'default'
              : tool === 'text' || tool === 'arabic' || tool === 'urdu'
              ? 'text'
              : 'crosshair',
        }}
      />

      {/* Top toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-[#0f172a]/95 backdrop-blur-md border border-white/10 rounded-xl px-2 py-1.5 shadow-2xl max-w-[96vw] overflow-x-auto">
        <div className="flex items-center gap-0.5 shrink-0">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = tool === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTool(t.key);
                  if (t.key !== 'select') setSelectedIds(new Set());
                }}
                title={t.label}
                className={`h-8 min-w-8 px-1.5 rounded-md flex items-center justify-center gap-1.5 transition shrink-0 ${
                  active
                    ? t.accent
                      ? `bg-gradient-to-br ${t.accent} text-white shadow-lg`
                      : 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {(t.key === 'arabic' || t.key === 'urdu') && (
                  <span className="text-[10px] font-bold hidden lg:inline">
                    {t.key === 'arabic' ? 'قرآنی' : 'اردو'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

        {/* Colors */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowPalette((v) => !v)}
            className="h-8 w-8 rounded-md flex items-center justify-center border-2 border-white/20 transition hover:scale-105"
            style={{ backgroundColor: color }}
            title="Color"
          >
            <Palette className="h-3.5 w-3.5 text-white mix-blend-difference" />
          </button>
          {showPalette && (
            <div className="absolute top-10 left-0 bg-[#0f172a] border border-white/10 rounded-xl p-3 shadow-2xl grid grid-cols-6 gap-2 w-[220px] z-20">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setShowPalette(false);
                  }}
                  className={`h-6 w-6 rounded-md border-2 transition hover:scale-110 ${
                    color === c ? 'border-white' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="col-span-6 flex items-center gap-2 mt-1 pt-2 border-t border-white/10">
                <Baseline className="h-3.5 w-3.5 text-white/40" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 h-7 rounded-md bg-transparent cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sizes */}
        <div className="flex items-center gap-0.5 px-1 shrink-0">
          {STROKE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`h-8 w-8 rounded-md flex items-center justify-center transition ${
                size === s ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <span
                className="rounded-full bg-white/80"
                style={{ width: Math.min(s + 3, 14), height: Math.min(s + 3, 14) }}
              />
            </button>
          ))}
        </div>

        {/* Font size (only for text) */}
        {(tool === 'text' || tool === 'arabic' || tool === 'urdu') && (
          <>
            <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
            <div className="flex items-center gap-0.5 shrink-0">
              {FONT_SIZES.slice(0, 5).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`h-8 min-w-8 px-1 rounded-md text-[10px] font-bold transition ${
                    fontSize === s ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

        {/* Actions */}
        <button
          onClick={undo}
          disabled={historyIdx <= 0}
          className="h-8 w-8 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30 shrink-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={historyIdx >= history.length - 1}
          className="h-8 w-8 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30 shrink-0"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={clear}
          className="h-8 w-8 rounded-md flex items-center justify-center text-rose-300 hover:bg-rose-500/20 transition shrink-0"
          title="Clear all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={download}
          className="h-8 w-8 rounded-md flex items-center justify-center text-emerald-300 hover:bg-emerald-500/20 transition shrink-0"
          title="Download PNG"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Selection info bar */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[#0f172a]/95 backdrop-blur-md border border-violet-400/30 rounded-xl px-3 py-2 shadow-2xl">
          <div className="flex items-center gap-1.5 text-violet-300 text-xs font-bold">
            <Move3d className="h-3.5 w-3.5" />
            {selectedIds.size} selected
          </div>
          <div className="w-px h-5 bg-white/10" />
          <button
            onClick={mergeSelected}
            disabled={selectedIds.size < 2}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white text-[11px] font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Merge selected (Ctrl+G)"
          >
            <Group className="h-3 w-3" />
            Merge
          </button>
          <button
            onClick={ungroupSelected}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-bold transition"
          >
            <Ungroup className="h-3 w-3" />
            Ungroup
          </button>
          <button
            onClick={() => {
              const next = objects.filter((o) => !selectedIds.has(o.id));
              commit(next);
              setSelectedIds(new Set());
            }}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[11px] font-bold transition"
          >
            <Trash className="h-3 w-3" />
            Delete
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
            title="Deselect (Esc)"
          >
            <X className="h-3.5 w-3.5" />
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
          <div
            className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {textModal.mode === 'arabic' ? (
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                ) : textModal.mode === 'urdu' ? (
                  <Languages className="h-4 w-4 text-cyan-400" />
                ) : (
                  <Type className="h-4 w-4 text-violet-400" />
                )}
                <span className="text-sm font-bold text-white">
                  {textModal.mode === 'arabic'
                    ? 'قرآنی آیت / حدیث'
                    : textModal.mode === 'urdu'
                    ? 'اردو متن'
                    : 'Text'}
                </span>
              </div>
              <button
                onClick={() => setTextModal((s) => ({ ...s, open: false }))}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <textarea
                autoFocus
                value={textModal.value}
                onChange={(e) => setTextModal((s) => ({ ...s, value: e.target.value }))}
                rows={4}
                placeholder={
                  textModal.mode === 'arabic'
                    ? 'يَا أَيُّهَا الَّذِينَ آمَنُوا... یا بغیر اعراب لکھیں، AI اعراب لگا دے گا'
                    : textModal.mode === 'urdu'
                    ? 'اردو متن لکھیں...'
                    : 'Type text...'
                }
                dir={textModal.mode === 'arabic' || textModal.mode === 'urdu' ? 'rtl' : 'ltr'}
                className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-violet-400/60 resize-none ${
                  textModal.mode === 'arabic' ? 'wb-arabic text-xl leading-loose' : textModal.mode === 'urdu' ? 'wb-nastaliq text-xl leading-loose' : ''
                }`}
              />

              {/* AI button for Arabic/Urdu */}
              {(textModal.mode === 'arabic' || textModal.mode === 'urdu') && (
                <button
                  onClick={enhanceWithAI}
                  disabled={textModal.aiLoading || !textModal.value.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold transition disabled:opacity-50"
                >
                  {textModal.aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI تجزیہ کر رہا ہے...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      اعراب لگائیں + حوالہ معلوم کریں
                    </>
                  )}
                </button>
              )}

              {/* AI error */}
              {textModal.error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-400/30 p-2.5 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {textModal.error}
                </div>
              )}

              {/* AI result */}
              {textModal.aiResult && (
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-400/30 p-3 space-y-2">
                  {textModal.aiResult.reference && (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-300">
                      <Quote className="h-3.5 w-3.5" />
                      <span>{textModal.aiResult.reference}</span>
                    </div>
                  )}
                  {textModal.aiResult.type && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300 uppercase">
                      {textModal.aiResult.type}
                    </span>
                  )}
                  {textModal.aiResult.translation && (
                    <p className="text-xs text-white/70 italic border-l-2 border-emerald-400/40 pl-2">
                      {textModal.aiResult.translation}
                    </p>
                  )}
                  {textModal.aiResult.explanation && (
                    <p className="text-xs text-white/60">
                      {textModal.aiResult.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Preview */}
              {textModal.value.trim() && (
                <div className="rounded-xl bg-[#0a0f1e] border border-white/10 p-3">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                    Preview
                  </p>
                  <div
                    className={`text-white break-words ${
                      textModal.mode === 'arabic'
                        ? 'wb-arabic text-2xl leading-loose'
                        : textModal.mode === 'urdu'
                        ? 'wb-nastaliq text-2xl leading-loose'
                        : 'text-base'
                    }`}
                    dir={textModal.mode === 'arabic' || textModal.mode === 'urdu' ? 'rtl' : 'ltr'}
                  >
                    {textModal.value}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 bg-black/20 flex items-center gap-2">
              <button
                onClick={() => setTextModal((s) => ({ ...s, open: false }))}
                className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-bold transition"
              >
                Cancel
              </button>
              {textModal.aiResult?.reference && (
                <button
                  onClick={() => placeText(true)}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white text-sm font-bold transition"
                >
                  Add with reference
                </button>
              )}
              <button
                onClick={() => placeText(false)}
                disabled={!textModal.value.trim()}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white text-sm font-bold transition disabled:opacity-50"
              >
                Place on board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Whiteboard;