'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle as CircleIcon,
  Triangle,
  Minus,
  ArrowRight,
  Star,
  Diamond,
  Type,
  Code2,
  Trash2,
  Download,
  Undo2,
  Redo2,
  X,
  Grid3x3,
  Calculator,
  Box,
  Play,
  ChevronDown,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Plus,
  Sparkles,
  Presentation,
  Ruler,
  CircleDot,
  FunctionSquare,
  Terminal,
  Layers,
  MousePointer2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import CodeEditorOverlay from './CodeEditorOverlay';
import DesignStudioOverlay from './DesignStudioOverlay';

/* ============================================================
   TYPES
   ============================================================ */

type Tool =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'rect'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'star'
  | 'text'
  | 'code'
  | 'math'
  | '3d';

type ShapeType =
  | 'rect'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'star';

type Shape3DType = 'cube' | 'sphere' | 'pyramid' | 'cylinder';

type WBObject =
  | {
      id: string;
      kind: 'shape';
      shape: ShapeType;
      x: number;
      y: number;
      w: number;
      h: number;
      stroke: string;
      fill: string;
      strokeWidth: number;
      rotation: number;
    }
  | {
      id: string;
      kind: 'text';
      x: number;
      y: number;
      text: string;
      color: string;
      fontSize: number;
      fontWeight: number;
    }
  | {
      id: string;
      kind: 'code';
      x: number;
      y: number;
      code: string;
      language: string;
      variant: 'block' | 'terminal';
    }
  | {
      id: string;
      kind: 'math';
      x: number;
      y: number;
      symbol: string;
      size: number;
      color: string;
    }
  | {
      id: string;
      kind: '3d';
      x: number;
      y: number;
      shape3d: Shape3DType;
      size: number;
      rotationX: number;
      rotationY: number;
      color: string;
      autoRotate: boolean;
    };

type Slide = {
  id: string;
  name: string;
  canvas: string | null;
  objects: WBObject[];
  background: 'plain' | 'grid' | 'graph' | 'dots' | 'lines';
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const COLORS = [
  '#0f172a',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#ca8a04',
  '#16a34a',
  '#059669',
  '#0891b2',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
  '#c026d3',
  '#db2777',
  '#475569',
  '#ffffff',
  '#000000',
];

const MATH_SYMBOLS = [
  '+', '−', '×', '÷', '±', '=', '≠', '≈', '<', '>', '≤', '≥',
  'x²', 'x³', 'xⁿ', '√', '∛', 'ⁿ√',
  '∫', '∬', '∭', '∮', '∂', '∇', '∑', '∏', 'lim', 'd/dx',
  'π', 'e', '∞', 'φ',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'sin⁻¹', 'cos⁻¹', 'tan⁻¹',
  '∈', '∉', '⊂', '⊃', '∪', '∩', '∅', '∀', '∃',
  '∠', '⊥', '∥', '△', '□', '⊙', '°', '′', '″',
  '→', '←', '↔', '⇒', '⇔',
  'α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ', 'σ', 'ω', 'Ω', 'Δ',
];

const FORMULA_TEMPLATES: { label: string; expr: string }[] = [
  { label: 'Quadratic', expr: 'x = (-b ± √(b² - 4ac)) / 2a' },
  { label: 'Pythagorean', expr: 'a² + b² = c²' },
  { label: 'Area Circle', expr: 'A = πr²' },
  { label: 'Circumference', expr: 'C = 2πr' },
  { label: 'Slope', expr: 'm = (y₂ − y₁) / (x₂ − x₁)' },
  { label: 'Distance', expr: 'd = √((x₂−x₁)² + (y₂−y₁)²)' },
  { label: 'Derivative', expr: 'd/dx [xⁿ] = n·xⁿ⁻¹' },
  { label: 'Integral', expr: '∫ xⁿ dx = xⁿ⁺¹ / (n+1) + C' },
  { label: 'Euler', expr: 'e^(iπ) + 1 = 0' },
  { label: 'Binomial', expr: '(a+b)² = a² + 2ab + b²' },
  { label: 'Log Rule', expr: 'log(ab) = log(a) + log(b)' },
  { label: 'Trig Identity', expr: 'sin²θ + cos²θ = 1' },
];

const CODE_TEMPLATES: Record<string, { label: string; code: string }[]> = {
  javascript: [
    { label: 'Hello World', code: `console.log("Hello, World!");` },
    {
      label: 'Function',
      code: `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("Student"));`,
    },
    {
      label: 'Array Map',
      code: `const numbers = [1, 2, 3, 4];\nconst doubled = numbers.map(n => n * 2);\nconsole.log(doubled); // [2, 4, 6, 8]`,
    },
  ],
  python: [
    { label: 'Hello World', code: `print("Hello, World!")` },
    {
      label: 'Loop',
      code: `for i in range(1, 6):\n    print(f"Number: {i}")`,
    },
    {
      label: 'Function',
      code: `def add(a, b):\n    """Return sum of two numbers."""\n    return a + b\n\nprint(add(3, 5))  # 8`,
    },
  ],
  typescript: [
    {
      label: 'Interface',
      code: `interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nconst user: User = {\n  id: 1,\n  name: "Ali",\n  email: "ali@example.com",\n};`,
    },
    {
      label: 'Generic',
      code: `function identity<T>(arg: T): T {\n  return arg;\n}\n\nconsole.log(identity<string>("hello"));`,
    },
  ],
  html: [
    {
      label: 'Basic Page',
      code: `<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello!</h1>\n</body>\n</html>`,
    },
  ],
  css: [
    {
      label: 'Flex Center',
      code: `.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}`,
    },
  ],
  sql: [
    {
      label: 'Select',
      code: `SELECT id, name, email\nFROM users\nWHERE age > 18\nORDER BY name ASC\nLIMIT 10;`,
    },
  ],
};

/* ============================================================
   HELPERS
   ============================================================ */

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function svgPathForShape(
  shape: ShapeType,
  w: number,
  h: number
): { tag: 'path' | 'polygon' | 'line' | 'ellipse' | 'rect'; props: any } {
  switch (shape) {
    case 'rect':
      return {
        tag: 'rect',
        props: { x: 0, y: 0, width: w, height: h, rx: 6 },
      };
    case 'ellipse':
      return {
        tag: 'ellipse',
        props: { cx: w / 2, cy: h / 2, rx: w / 2, ry: h / 2 },
      };
    case 'triangle':
      return {
        tag: 'polygon',
        props: { points: `${w / 2},0 ${w},${h} 0,${h}` },
      };
    case 'diamond':
      return {
        tag: 'polygon',
        props: { points: `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}` },
      };
    case 'line':
      return { tag: 'line', props: { x1: 0, y1: h, x2: w, y2: 0 } };
    case 'arrow':
      return { tag: 'path', props: {} };
    case 'star': {
      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR / 2.5;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return { tag: 'polygon', props: { points: pts.join(' ') } };
    }
    default:
      return { tag: 'rect', props: { x: 0, y: 0, width: w, height: h } };
  }
}

/* ============================================================
   ADVANCED WHITEBOARD COMPONENT
   ============================================================ */

export default function AdvancedWhiteboard({ onClose }: { onClose: () => void }) {
  /* ---------------- Refs ---------------- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  /* ---------------- State ---------------- */
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#0f172a');
  const [size, setSize] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [fill, setFill] = useState<string>('none');
  const [showMath, setShowMath] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [showShapes3D, setShowShapes3D] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(true);
  const [showIDE, setShowIDE] = useState(false);
  const [showDesign, setShowDesign] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  const [background, setBackground] = useState<
    'plain' | 'grid' | 'graph' | 'dots' | 'lines'
  >('plain');

  const [objects, setObjects] = useState<WBObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [slides, setSlides] = useState<Slide[]>([
    { id: uid(), name: 'Slide 1', canvas: null, objects: [], background: 'plain' },
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [presenting, setPresenting] = useState(false);

  /* Undo/redo stacks */
  const historyRef = useRef<{ objects: WBObject[]; canvas: string | null }[]>([]);
  const futureRef = useRef<{ objects: WBObject[]; canvas: string | null }[]>([]);

  /* ---------------- Canvas Setup ---------------- */

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const prevData = canvas.toDataURL('image/png');

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
    img.src = prevData;
  }, []);

  useEffect(() => {
    setupCanvas();
    const observer = new ResizeObserver(setupCanvas);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [setupCanvas]);

  /* ---------------- Save Snapshot for Undo ---------------- */

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    historyRef.current.push({
      objects: JSON.parse(JSON.stringify(objects)),
      canvas: canvas?.toDataURL('image/png') || null,
    });
    if (historyRef.current.length > 25) historyRef.current.shift();
    futureRef.current = [];
  }, [objects]);

  /* ---------------- Undo / Redo ---------------- */

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prev = historyRef.current.pop();
    if (!prev) return;

    futureRef.current.push({
      objects: JSON.parse(JSON.stringify(objects)),
      canvas: canvas.toDataURL('image/png'),
    });

    setObjects(prev.objects);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    const restore = (src: string | null) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (!src) return;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = src;
    };
    restore(prev.canvas);
  }, [objects]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const next = futureRef.current.pop();
    if (!next) return;

    historyRef.current.push({
      objects: JSON.parse(JSON.stringify(objects)),
      canvas: canvas.toDataURL('image/png'),
    });

    setObjects(next.objects);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    const restore = (src: string | null) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (!src) return;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = src;
    };
    restore(next.canvas);
  }, [objects]);

  /* ---------------- Pointer Drawing ---------------- */

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!['pen', 'highlighter', 'eraser'].includes(tool)) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    pushHistory();

    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const p = lastPointRef.current;
      const isHighlighter = tool === 'highlighter';
      const isEraser = tool === 'eraser';
      ctx.beginPath();
      ctx.fillStyle = isEraser ? '#ffffff' : color;
      ctx.globalAlpha = isHighlighter ? 0.35 : opacity;
      const r = isEraser ? size * 3 : isHighlighter ? size * 2 : size / 2;
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getPoint(e);
    const last = lastPointRef.current || point;
    const isHighlighter = tool === 'highlighter';
    const isEraser = tool === 'eraser';

    ctx.beginPath();
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? size * 6 : isHighlighter ? size * 4 : size;
    ctx.globalAlpha = isHighlighter ? 0.35 : opacity;
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  /* ---------------- Clear ---------------- */

  const clearAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushHistory();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setObjects([]);
    setSelectedId(null);
  };

  /* ---------------- Download ---------------- */

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, '-')}.png`;
    a.click();
  };

  const copyCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b), 'image/png')
      );
      if (!blob) return;
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  /* ---------------- Add Objects ---------------- */

  const addShape = (shape: ShapeType) => {
    pushHistory();
    const container = containerRef.current;
    const w = container?.clientWidth ?? 800;
    const h = container?.clientHeight ?? 500;
    const dim =
      shape === 'line' || shape === 'arrow'
        ? { w: 220, h: 0 }
        : { w: 160, h: 120 };

    setObjects((prev) => [
      ...prev,
      {
        id: uid(),
        kind: 'shape',
        shape,
        x: w / 2 - dim.w / 2,
        y: h / 2 - (dim.h || 0) / 2,
        w: dim.w,
        h: dim.h || 60,
        stroke: color,
        fill,
        strokeWidth: Math.max(2, size),
        rotation: 0,
      },
    ]);
    setTool('select');
    setShowShapes(false);
  };

  const addMathSymbol = (symbol: string) => {
    pushHistory();
    const container = containerRef.current;
    const w = container?.clientWidth ?? 800;
    const h = container?.clientHeight ?? 500;
    setObjects((prev) => [
      ...prev,
      {
        id: uid(),
        kind: 'math',
        x: w / 2 - 40,
        y: h / 2 - 40,
        symbol,
        size: 64,
        color,
      },
    ]);
    setShowMath(false);
    setTool('select');
  };

  const addFormula = (expr: string) => {
    pushHistory();
    const container = containerRef.current;
    const w = container?.clientWidth ?? 800;
    const h = container?.clientHeight ?? 500;
    setObjects((prev) => [
      ...prev,
      {
        id: uid(),
        kind: 'text',
        x: w / 2 - 200,
        y: h / 2 - 30,
        text: expr,
        color,
        fontSize: 24,
        fontWeight: 500,
      },
    ]);
    setShowMath(false);
    setTool('select');
  };

  const addCodeBlock = (code: string, language: string, variant: 'block' | 'terminal') => {
    pushHistory();
    const container = containerRef.current;
    const w = container?.clientWidth ?? 800;
    const h = container?.clientHeight ?? 500;
    setObjects((prev) => [
      ...prev,
      {
        id: uid(),
        kind: 'code',
        x: w / 2 - 220,
        y: h / 2 - 100,
        code,
        language,
        variant,
      },
    ]);
    setShowCode(false);
    setTool('select');
  };

  const add3DShape = (shape3d: Shape3DType) => {
    pushHistory();
    const container = containerRef.current;
    const w = container?.clientWidth ?? 800;
    const h = container?.clientHeight ?? 500;
    const s = 140;
    setObjects((prev) => [
      ...prev,
      {
        id: uid(),
        kind: '3d',
        x: w / 2 - s / 2,
        y: h / 2 - s / 2,
        shape3d,
        size: s,
        rotationX: -20,
        rotationY: 30,
        color,
        autoRotate: true,
      },
    ]);
    setShowShapes3D(false);
    setTool('select');
  };

  const addText = () => {
    pushHistory();
    const container = containerRef.current;
    const w = container?.clientWidth ?? 800;
    const h = container?.clientHeight ?? 500;
    setObjects((prev) => [
      ...prev,
      {
        id: uid(),
        kind: 'text',
        x: w / 2 - 100,
        y: h / 2 - 20,
        text: 'Double-click to edit',
        color,
        fontSize: 24,
        fontWeight: 500,
      },
    ]);
    setTool('select');
  };

  /* ---------------- Object Manipulation ---------------- */

  const updateObject = (id: string, patch: Partial<WBObject>) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? ({ ...o, ...patch } as WBObject) : o))
    );
  };

  const removeObject = (id: string) => {
    pushHistory();
    setObjects((prev) => prev.filter((o) => o.id !== id));
    setSelectedId(null);
  };

  /* ---------------- Keyboard Shortcuts ---------------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === 'Escape') {
        if (selectedId) setSelectedId(null);
        else if (presenting) setPresenting(false);
        else if (showIDE) setShowIDE(false);
        else if (showDesign) setShowDesign(false);
        else onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) removeObject(selectedId);
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'p') setTool('pen');
        if (e.key === 'h') setTool('highlighter');
        if (e.key === 'e') setTool('eraser');
        if (e.key === 'v') setTool('select');
        if (e.key === 'r') setTool('rect');
        if (e.key === 'o') setTool('ellipse');
        if (e.key === 't') addText();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, presenting, showIDE, showDesign, onClose, undo, redo]);

  /* ---------------- Slide Handlers ---------------- */

  const saveCurrentSlide = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSlides((prev) =>
      prev.map((s, i) =>
        i === activeSlide
          ? {
              ...s,
              canvas: canvas.toDataURL('image/png'),
              objects: JSON.parse(JSON.stringify(objects)),
              background,
            }
          : s
      )
    );
  };

  const gotoSlide = (idx: number) => {
    if (idx === activeSlide) return;
    saveCurrentSlide();
    const target = slides[idx];
    if (!target) return;
    setActiveSlide(idx);
    setObjects(JSON.parse(JSON.stringify(target.objects)));
    setBackground(target.background);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        if (target.canvas) {
          const img = new Image();
          img.onload = () =>
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          img.src = target.canvas;
        }
      }
    }
  };

  const addSlide = () => {
    saveCurrentSlide();
    const newSlide: Slide = {
      id: uid(),
      name: `Slide ${slides.length + 1}`,
      canvas: null,
      objects: [],
      background: 'plain',
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlide(slides.length);
    setObjects([]);
    clearAll();
    setBackground('plain');
  };

  const deleteSlide = (idx: number) => {
    if (slides.length === 1) return;
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    const newActive = Math.min(idx, next.length - 1);
    setActiveSlide(newActive);
    setObjects([]);
    clearAll();
  };

  /* ---------------- Background Renderer ---------------- */

  const backgroundStyle = useMemo(() => {
    switch (background) {
      case 'grid':
        return {
          backgroundImage: `
            linear-gradient(to right, rgba(100,116,139,0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100,116,139,0.12) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        };
      case 'graph':
        return {
          backgroundImage: `
            linear-gradient(to right, rgba(59,130,246,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59,130,246,0.15) 1px, transparent 1px),
            linear-gradient(to right, rgba(59,130,246,0.30) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59,130,246,0.30) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
        };
      case 'dots':
        return {
          backgroundImage: `radial-gradient(circle, rgba(100,116,139,0.30) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        };
      case 'lines':
        return {
          backgroundImage: `repeating-linear-gradient(0deg, rgba(100,116,139,0.18) 0px, rgba(100,116,139,0.18) 1px, transparent 1px, transparent 28px)`,
        };
      default:
        return {};
    }
  }, [background]);

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col">
      {/* ==================================================
          TOP TOOLBAR
      ================================================== */}

      <div className="shrink-0 border-b border-white/10 bg-slate-900/95 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 px-2 sm:px-3 py-2">
          {/* Left: Logo + toggle tools panel */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <button
              type="button"
              onClick={() => setShowToolsPanel((v) => !v)}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold transition"
              title="Toggle tools panel"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden md:inline">Tools</span>
            </button>
          </div>

          {/* Center: Primary tools */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <ToolButton active={tool === 'select'} onClick={() => setTool('select')} title="Select (V)" icon={<MousePointer2 className="h-4 w-4" />} />
            <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} title="Pen (P)" icon={<Pen className="h-4 w-4" />} />
            <ToolButton active={tool === 'highlighter'} onClick={() => setTool('highlighter')} title="Highlighter (H)" icon={<Highlighter className="h-4 w-4" />} />
            <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Eraser (E)" icon={<Eraser className="h-4 w-4" />} />

            <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

            {/* Shapes dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowShapes((v) => !v);
                  setShowMath(false);
                  setShowCode(false);
                  setShowShapes3D(false);
                }}
                className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold transition ${
                  showShapes
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Shapes"
              >
                <Square className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Math */}
            <button
              type="button"
              onClick={() => {
                setShowMath((v) => !v);
                setShowShapes(false);
                setShowCode(false);
                setShowShapes3D(false);
              }}
              className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                showMath
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Math Tools"
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden md:inline">Math</span>
            </button>

            {/* Code Blocks */}
            <button
              type="button"
              onClick={() => {
                setShowCode((v) => !v);
                setShowShapes(false);
                setShowMath(false);
                setShowShapes3D(false);
              }}
              className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                showCode
                  ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Code Blocks"
            >
              <Code2 className="h-4 w-4" />
              <span className="hidden md:inline">Code</span>
            </button>

            {/* 3D */}
            <button
              type="button"
              onClick={() => {
                setShowShapes3D((v) => !v);
                setShowShapes(false);
                setShowMath(false);
                setShowCode(false);
              }}
              className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                showShapes3D
                  ? 'bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/25'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="3D Shapes"
            >
              <Box className="h-4 w-4" />
              <span className="hidden md:inline">3D</span>
            </button>

            <ToolButton active={tool === 'text'} onClick={addText} title="Text (T)" icon={<Type className="h-4 w-4" />} />

            <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

            {/* IDE (VS Code style) */}
            <button
              type="button"
              onClick={() => setShowIDE(true)}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-bold transition shrink-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-400/30 text-sky-200 hover:from-sky-500/30 hover:to-blue-500/30"
              title="Open Code Editor (VS Code style)"
            >
              <Terminal className="h-4 w-4" />
              <span className="hidden md:inline">IDE</span>
            </button>

            {/* Design Studio (Illustrator style) */}
            <button
              type="button"
              onClick={() => setShowDesign(true)}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-bold transition shrink-0 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-400/30 text-fuchsia-200 hover:from-fuchsia-500/30 hover:to-pink-500/30"
              title="Open Design Studio (Illustrator style)"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden md:inline">Design</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={undo}
              className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={copyCanvas}
              className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={downloadPNG}
              className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Download PNG"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPresenting(true)}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition"
              title="Presentation mode"
            >
              <Presentation className="h-4 w-4" />
              <span className="hidden sm:inline">Present</span>
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-rose-300 hover:text-white hover:bg-rose-500/20 transition"
              title="Clear all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 transition"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          MAIN AREA (canvas + floating panels)
      ================================================== */}

      <div className="relative flex-1 min-h-0 flex">
        {/* Left: Tools panel */}
        {showToolsPanel && (
          <div className="w-14 sm:w-16 shrink-0 border-r border-white/10 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center py-3 gap-1.5 overflow-y-auto">
            <SideIcon active={tool === 'select'} onClick={() => setTool('select')} title="Select" icon={<MousePointer2 className="h-5 w-5" />} />
            <SideIcon active={tool === 'pen'} onClick={() => setTool('pen')} title="Pen" icon={<Pen className="h-5 w-5" />} />
            <SideIcon active={tool === 'highlighter'} onClick={() => setTool('highlighter')} title="Highlighter" icon={<Highlighter className="h-5 w-5" />} />
            <SideIcon active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Eraser" icon={<Eraser className="h-5 w-5" />} />
            <div className="w-8 h-px bg-white/10 my-1" />
            <SideIcon onClick={() => setShowShapes((v) => !v)} title="Shapes" icon={<Square className="h-5 w-5" />} />
            <SideIcon onClick={() => setShowMath((v) => !v)} title="Math" icon={<Calculator className="h-5 w-5" />} />
            <SideIcon onClick={() => setShowCode((v) => !v)} title="Code" icon={<Code2 className="h-5 w-5" />} />
            <SideIcon onClick={() => setShowShapes3D((v) => !v)} title="3D" icon={<Box className="h-5 w-5" />} />
            <SideIcon onClick={addText} title="Text" icon={<Type className="h-5 w-5" />} />
            <div className="w-8 h-px bg-white/10 my-1" />
            <SideIcon onClick={() => setShowIDE(true)} title="Code Editor (IDE)" icon={<Terminal className="h-5 w-5" />} />
            <SideIcon onClick={() => setShowDesign(true)} title="Design Studio" icon={<Sparkles className="h-5 w-5" />} />
            <div className="w-8 h-px bg-white/10 my-1" />
            <SideIcon
              active={background === 'grid'}
              onClick={() => setBackground(background === 'grid' ? 'plain' : 'grid')}
              title="Grid"
              icon={<Grid3x3 className="h-5 w-5" />}
            />
            <SideIcon
              active={background === 'graph'}
              onClick={() => setBackground(background === 'graph' ? 'plain' : 'graph')}
              title="Graph paper"
              icon={<FunctionSquare className="h-5 w-5" />}
            />
            <SideIcon
              active={background === 'dots'}
              onClick={() => setBackground(background === 'dots' ? 'plain' : 'dots')}
              title="Dots"
              icon={<CircleDot className="h-5 w-5" />}
            />
          </div>
        )}

        {/* Canvas + objects */}
        <div className="relative flex-1 min-w-0 overflow-hidden">
          {/* Whiteboard surface */}
          <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden"
            style={{
              ...backgroundStyle,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Canvas (drawing layer) */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="absolute inset-0 touch-none"
              style={{
                touchAction: 'none',
                cursor:
                  tool === 'pen' || tool === 'highlighter' || tool === 'eraser'
                    ? 'crosshair'
                    : 'default',
              }}
            />

            {/* Objects layer */}
            <div className="absolute inset-0 pointer-events-none">
              {objects.map((obj) => (
                <DraggableObject
                  key={obj.id}
                  obj={obj}
                  zoom={zoom}
                  selected={selectedId === obj.id}
                  onSelect={() => setSelectedId(obj.id)}
                  onUpdate={(patch) => updateObject(obj.id, patch)}
                  onRemove={() => removeObject(obj.id)}
                  onPushHistory={pushHistory}
                />
              ))}
            </div>
          </div>

          {/* Floating dropdown panels */}
          {showShapes && (
            <FloatingPanel
              title="Shapes"
              icon={<Square className="h-3.5 w-3.5" />}
              onClose={() => setShowShapes(false)}
              style={{ top: 12, left: 12 }}
            >
              <div className="grid grid-cols-4 gap-2 w-56">
                <ShapeBtn onClick={() => addShape('rect')} icon={<Square className="h-5 w-5" />} label="Rect" />
                <ShapeBtn onClick={() => addShape('ellipse')} icon={<CircleIcon className="h-5 w-5" />} label="Circle" />
                <ShapeBtn onClick={() => addShape('triangle')} icon={<Triangle className="h-5 w-5" />} label="Triangle" />
                <ShapeBtn onClick={() => addShape('diamond')} icon={<Diamond className="h-5 w-5" />} label="Diamond" />
                <ShapeBtn onClick={() => addShape('star')} icon={<Star className="h-5 w-5" />} label="Star" />
                <ShapeBtn onClick={() => addShape('line')} icon={<Minus className="h-5 w-5" />} label="Line" />
                <ShapeBtn onClick={() => addShape('arrow')} icon={<ArrowRight className="h-5 w-5" />} label="Arrow" />
              </div>
            </FloatingPanel>
          )}

          {showMath && (
            <FloatingPanel
              title="Math Tools"
              icon={<Calculator className="h-3.5 w-3.5" />}
              onClose={() => setShowMath(false)}
              style={{ top: 12, left: 12, maxWidth: 420 }}
            >
              <div className="w-full max-w-[400px] space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                    Symbols
                  </p>
                  <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto pr-1">
                    {MATH_SYMBOLS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addMathSymbol(s)}
                        className="h-9 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition"
                        title={s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                    Formula Templates
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {FORMULA_TEMPLATES.map((f) => (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => addFormula(f.expr)}
                        className="text-left px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition group"
                      >
                        <p className="text-[10px] font-bold text-emerald-300">
                          {f.label}
                        </p>
                        <p className="text-[11px] text-white/70 font-mono truncate">
                          {f.expr}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-white/40 border-t border-white/10 pt-2">
                  <Ruler className="h-3.5 w-3.5" />
                  <span>
                    Tip: Turn on <span className="text-white/70 font-semibold">Grid</span> or{' '}
                    <span className="text-white/70 font-semibold">Graph</span> background from left sidebar for math work.
                  </span>
                </div>
              </div>
            </FloatingPanel>
          )}

          {showCode && (
            <FloatingPanel
              title="Code Blocks"
              icon={<Code2 className="h-3.5 w-3.5" />}
              onClose={() => setShowCode(false)}
              style={{ top: 12, left: 12, maxWidth: 460 }}
            >
              <div className="w-full max-w-[440px] space-y-3">
                {Object.entries(CODE_TEMPLATES).map(([lang, templates]) => (
                  <div key={lang}>
                    <p className="text-[10px] font-bold text-sky-300 uppercase tracking-wider mb-1.5">
                      {lang}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {templates.map((t) => (
                        <div key={t.label} className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => addCodeBlock(t.code, lang, 'block')}
                            className="flex-1 text-left px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition group"
                          >
                            <p className="text-[11px] font-semibold text-white/80">
                              {t.label}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => addCodeBlock(t.code, lang, 'terminal')}
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-[10px] text-emerald-300 font-bold"
                            title="Insert as terminal"
                          >
                            <Terminal className="h-3 w-3" />
                            CLI
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FloatingPanel>
          )}

          {showShapes3D && (
            <FloatingPanel
              title="3D Objects"
              icon={<Box className="h-3.5 w-3.5" />}
              onClose={() => setShowShapes3D(false)}
              style={{ top: 12, left: 12 }}
            >
              <div className="grid grid-cols-2 gap-2 w-60">
                <ShapeBtn onClick={() => add3DShape('cube')} icon={<Square className="h-6 w-6" />} label="Cube" />
                <ShapeBtn onClick={() => add3DShape('sphere')} icon={<CircleDot className="h-6 w-6" />} label="Sphere" />
                <ShapeBtn onClick={() => add3DShape('pyramid')} icon={<Triangle className="h-6 w-6" />} label="Pyramid" />
                <ShapeBtn onClick={() => add3DShape('cylinder')} icon={<Box className="h-6 w-6" />} label="Cylinder" />
              </div>
              <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                Click a shape to insert. Drag to move, use rotation buttons on selection.
              </p>
            </FloatingPanel>
          )}

          {/* Zoom controls (bottom right) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-white/15 shadow-2xl">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-mono font-semibold text-white/70 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="hidden lg:flex w-64 shrink-0 border-l border-white/10 bg-slate-900/95 backdrop-blur-xl flex-col">
          <div className="p-3 border-b border-white/10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              Properties
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Color */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                Color
              </p>
              <div className="grid grid-cols-8 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      setFill('none');
                    }}
                    className={`h-6 w-6 rounded-lg border-2 transition hover:scale-110 ${
                      color === c ? 'border-white' : 'border-white/15'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Fill */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                Fill
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFill('none')}
                  className={`h-7 px-2 rounded-lg text-[10px] font-semibold transition ${
                    fill === 'none'
                      ? 'bg-white text-slate-900'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  None
                </button>
                {COLORS.slice(0, 8).map((c) => (
                  <button
                    key={`fill-${c}`}
                    type="button"
                    onClick={() => setFill(c)}
                    className={`h-7 w-7 rounded-lg border-2 transition hover:scale-110 ${
                      fill === c ? 'border-white' : 'border-white/15'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                Size · {size}px
              </p>
              <input
                type="range"
                min={1}
                max={20}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Opacity */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                Opacity · {Math.round(opacity * 100)}%
              </p>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Background */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                Background
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['plain', 'grid', 'graph', 'dots'] as const).map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBackground(bg)}
                    className={`h-9 rounded-lg text-[11px] font-semibold capitalize transition ${
                      background === bg
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Selection info */}
            {selectedId && (
              <div className="rounded-xl bg-indigo-500/10 border border-indigo-400/20 p-3">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
                  Selected
                </p>
                <p className="text-[11px] text-white/70">
                  {objects.find((o) => o.id === selectedId)?.kind}
                </p>
                <button
                  type="button"
                  onClick={() => removeObject(selectedId)}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-[11px] font-bold transition"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Slides panel */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                Slides · {slides.length}
              </p>
              <button
                type="button"
                onClick={addSlide}
                className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition"
                title="Add slide"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {slides.map((s, i) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition ${
                    i === activeSlide
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                  onClick={() => gotoSlide(i)}
                >
                  <div className="h-9 w-12 rounded-md bg-white/90 border border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0 overflow-hidden">
                    {s.canvas ? (
                      <img src={s.canvas} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <p className="flex-1 text-[11px] font-semibold text-white/80 truncate">
                    {s.name}
                  </p>
                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(i);
                      }}
                      className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center h-5 w-5 rounded text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          BOTTOM HELP BAR
      ================================================== */}

      <div className="shrink-0 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl px-3 py-2 hidden sm:flex items-center justify-between gap-3 text-[10px] text-white/40">
        <div className="flex items-center gap-3">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono">P</kbd>
          <span>pen</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono">H</kbd>
          <span>highlighter</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono">E</kbd>
          <span>eraser</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono">V</kbd>
          <span>select</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono">Ctrl+Z</kbd>
          <span>undo</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-mono">Del</kbd>
          <span>remove</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Slide {activeSlide + 1} / {slides.length}</span>
        </div>
      </div>

      {/* ==================================================
          PRESENTATION MODE (3D)
      ================================================== */}

      {presenting && (
        <PresentationMode
          slides={slides}
          initialIndex={activeSlide}
          onClose={() => setPresenting(false)}
          onExit={(idx) => {
            setPresenting(false);
            gotoSlide(idx);
          }}
        />
      )}

      {/* ==================================================
          CODE EDITOR (VS Code style)
      ================================================== */}

      {showIDE && (
        <CodeEditorOverlay
          onClose={() => setShowIDE(false)}
          initialLanguage="javascript"
        />
      )}

      {/* ==================================================
          DESIGN STUDIO (Illustrator style)
      ================================================== */}

      {showDesign && (
        <DesignStudioOverlay onClose={() => setShowDesign(false)} />
      )}
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function ToolButton({
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
      className={`inline-flex items-center justify-center h-9 w-9 rounded-lg transition shrink-0 ${
        active
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );
}

function SideIcon({
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
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );
}

function ShapeBtn({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition group"
    >
      <div className="text-white/70 group-hover:text-white transition">{icon}</div>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}

function FloatingPanel({
  title,
  icon,
  onClose,
  children,
  style,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute z-30 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-200"
      style={style}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center text-white/70">
            {icon}
          </span>
          <p className="text-xs font-bold text-white">{title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center h-6 w-6 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* ============================================================
   DRAGGABLE OBJECT RENDERER
   ============================================================ */

function DraggableObject({
  obj,
  zoom,
  selected,
  onSelect,
  onUpdate,
  onRemove,
  onPushHistory,
}: {
  obj: WBObject;
  zoom: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<WBObject>) => void;
  onRemove: () => void;
  onPushHistory: () => void;
}) {
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [editing, setEditing] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    e.stopPropagation();
    onSelect();
    onPushHistory();
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: obj.x,
      oy: obj.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.x) / zoom;
    const dy = (e.clientY - dragRef.current.y) / zoom;
    onUpdate({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: obj.x,
    top: obj.y,
    pointerEvents: 'auto',
    cursor: editing ? 'text' : 'move',
    userSelect: editing ? 'text' : 'none',
    touchAction: 'none',
  };

  /* ---- Render by kind ---- */

  if (obj.kind === 'shape') {
    const w = obj.w;
    const h = obj.h;
    const stroke = obj.stroke;
    const fill = obj.fill === 'none' ? 'transparent' : obj.fill;
    const sw = obj.strokeWidth;

    return (
      <div
        style={{
          ...baseStyle,
          width: w,
          height: h,
          transform: `rotate(${obj.rotation}deg)`,
          outline: selected ? '2px dashed rgba(99,102,241,0.9)' : 'none',
          outlineOffset: 4,
          borderRadius: 4,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ display: 'block', overflow: 'visible' }}
        >
          {obj.shape === 'arrow' ? (
            <>
              <defs>
                <marker
                  id={`ah-${obj.id}`}
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill={stroke} />
                </marker>
              </defs>
              <line
                x1={0}
                y1={h}
                x2={w}
                y2={0}
                stroke={stroke}
                strokeWidth={sw}
                markerEnd={`url(#ah-${obj.id})`}
                strokeLinecap="round"
              />
            </>
          ) : (
            (() => {
              const { tag, props } = svgPathForShape(obj.shape, w, h);
              const common = {
                stroke,
                strokeWidth: sw,
                fill,
              };
              if (tag === 'rect')
                return <rect {...common} {...props} />;
              if (tag === 'ellipse')
                return <ellipse {...common} {...props} />;
              if (tag === 'polygon')
                return <polygon {...common} {...props} />;
              if (tag === 'line')
                return <line {...common} {...props} strokeLinecap="round" />;
              if (tag === 'path')
                return <path {...common} {...props} />;
              return null;
            })()
          )}
        </svg>

        {selected && (
          <>
            <div className="absolute -top-8 right-0 flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-900/95 border border-white/15 shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ rotation: (obj.rotation || 0) - 15 });
                }}
                className="inline-flex items-center justify-center h-6 w-6 rounded text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Rotate left"
              >
                <RotateCw className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ rotation: (obj.rotation || 0) + 15 });
                }}
                className="inline-flex items-center justify-center h-6 w-6 rounded text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Rotate right"
              >
                <RotateCw className="h-3 w-3" />
              </button>
              <div className="w-px h-4 bg-white/15" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="inline-flex items-center justify-center h-6 w-6 rounded text-rose-300 hover:bg-rose-500/20 transition"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            {/* Resize handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelect();
                onPushHistory();
                const start = { x: e.clientX, y: e.clientY };
                const startDims = { w: obj.w, h: obj.h };
                const target = e.target as HTMLElement;
                target.setPointerCapture(e.pointerId);

                const onMove = (ev: PointerEvent) => {
                  const dx = (ev.clientX - start.x) / zoom;
                  const dy = (ev.clientY - start.y) / zoom;
                  onUpdate({
                    w: Math.max(20, startDims.w + dx),
                    h: Math.max(20, startDims.h + dy),
                  });
                };
                const onUp = () => {
                  target.removeEventListener('pointermove', onMove);
                  target.removeEventListener('pointerup', onUp);
                };
                target.addEventListener('pointermove', onMove);
                target.addEventListener('pointerup', onUp);
              }}
              className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white shadow cursor-se-resize"
            />
          </>
        )}
      </div>
    );
  }

  if (obj.kind === 'text') {
    return (
      <div
        style={{
          ...baseStyle,
          color: obj.color,
          fontSize: obj.fontSize,
          fontWeight: obj.fontWeight,
          outline: selected ? '2px dashed rgba(99,102,241,0.9)' : 'none',
          outlineOffset: 4,
          padding: 4,
          borderRadius: 4,
          maxWidth: 600,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={() => setEditing(true)}
      >
        {editing ? (
          <textarea
            autoFocus
            value={obj.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => setEditing(false)}
            className="bg-transparent border-none outline-none resize-none"
            style={{
              color: obj.color,
              fontSize: obj.fontSize,
              fontWeight: obj.fontWeight,
              fontFamily: 'inherit',
              width: 300,
              minHeight: 40,
            }}
          />
        ) : (
          <span className="whitespace-pre-wrap">{obj.text}</span>
        )}
      </div>
    );
  }

  if (obj.kind === 'math') {
    return (
      <div
        style={{
          ...baseStyle,
          color: obj.color,
          fontSize: obj.size,
          fontWeight: 600,
          outline: selected ? '2px dashed rgba(99,102,241,0.9)' : 'none',
          outlineOffset: 4,
          padding: 4,
          borderRadius: 4,
          lineHeight: 1,
          fontFamily:
            '"Cambria Math", "Latin Modern Math", "STIX Two Math", serif',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {obj.symbol}
      </div>
    );
  }

  if (obj.kind === 'code') {
    const isTerminal = obj.variant === 'terminal';
    return (
      <div
        style={{
          ...baseStyle,
          outline: selected ? '2px dashed rgba(99,102,241,0.9)' : 'none',
          outlineOffset: 4,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className={`rounded-2xl overflow-hidden shadow-2xl border ${
            isTerminal
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-900 border-slate-700'
          }`}
          style={{ minWidth: 340, maxWidth: 520 }}
        >
          <div
            className={`flex items-center gap-2 px-3 py-2 border-b ${
              isTerminal
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            {isTerminal ? (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            ) : (
              <Terminal className="h-3.5 w-3.5 text-sky-400" />
            )}
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                isTerminal ? 'text-emerald-400' : 'text-sky-300'
              }`}
            >
              {isTerminal ? 'terminal' : obj.language}
            </span>
            <span className="ml-auto text-[9px] font-mono text-white/30">
              {isTerminal ? '$ bash' : 'read-only'}
            </span>
          </div>

          <pre
            className={`p-3 text-[12px] leading-relaxed font-mono overflow-x-auto whitespace-pre ${
              isTerminal ? 'text-emerald-300' : 'text-white/90'
            }`}
          >
            {isTerminal ? (
              <code>
                {obj.code
                  .split('\n')
                  .map((line, i) => (
                    <div key={i}>
                      <span className="text-emerald-500 select-none">$ </span>
                      {line}
                    </div>
                  ))}
              </code>
            ) : (
              <HighlightedCode code={obj.code} />
            )}
          </pre>
        </div>
      </div>
    );
  }

  if (obj.kind === '3d') {
    return (
      <Shape3DObject
        obj={obj}
        zoom={zoom}
        selected={selected}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onPushHistory={onPushHistory}
        dragRef={dragRef}
      />
    );
  }

  return null;
}

/* ============================================================
   SYNTAX HIGHLIGHTING (lightweight)
   ============================================================ */

function HighlightedCode({ code }: { code: string }) {
  const tokens = useMemo(() => {
    return code.split('\n').map((line, i) => {
      const parts: { text: string; className: string }[] = [];
      let rest = line;

      const push = (text: string, cls: string) => {
        if (text) parts.push({ text, className: cls });
      };

      const rules: { re: RegExp; cls: string }[] = [
        { re: /^(\/\/.*|#.*)/, cls: 'text-slate-500 italic' },
        { re: /^(["'`])(?:\\.|(?!\1).)*\1/, cls: 'text-emerald-400' },
        {
          re: /^(const|let|var|function|return|if|else|for|while|class|interface|type|import|from|export|default|new|this|async|await|def|print|SELECT|FROM|WHERE|ORDER|BY|LIMIT|ASC|DESC)\b/,
          cls: 'text-fuchsia-400 font-semibold',
        },
        {
          re: /^(true|false|null|undefined|None|True|False)\b/,
          cls: 'text-amber-400',
        },
        { re: /^\d+(\.\d+)?/, cls: 'text-orange-400' },
        { re: /^[{}()[\].,;:?!<>+\-*/%=&|]+/, cls: 'text-sky-300' },
        { re: /^[A-Za-z_$][\w$]*/, cls: 'text-white/80' },
        { re: /^\s+/, cls: '' },
        { re: /^./, cls: 'text-white/70' },
      ];

      while (rest.length > 0) {
        let matched = false;
        for (const r of rules) {
          const m = rest.match(r.re);
          if (m) {
            push(m[0], r.cls);
            rest = rest.slice(m[0].length);
            matched = true;
            break;
          }
        }
        if (!matched) {
          push(rest.charAt(0), 'text-white/70');
          rest = rest.slice(1);
        }
      }

      return { key: i, parts };
    });
  }, [code]);

  return (
    <>
      {tokens.map((line) => (
        <div key={line.key}>
          {line.parts.map((p, i) => (
            <span key={i} className={p.className}>
              {p.text}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

/* ============================================================
   CSS 3D SHAPE OBJECT
   ============================================================ */

function Shape3DObject({
  obj,
  zoom,
  selected,
  onSelect,
  onUpdate,
  onRemove,
  onPushHistory,
  dragRef,
}: {
  obj: Extract<WBObject, { kind: '3d' }>;
  zoom: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<WBObject>) => void;
  onRemove: () => void;
  onPushHistory: () => void;
  dragRef: React.MutableRefObject<any>;
}) {
  const [autoRotateAngle, setAutoRotateAngle] = useState(0);

  useEffect(() => {
    if (!obj.autoRotate) return;
    const i = setInterval(() => {
      setAutoRotateAngle((a) => (a + 0.6) % 360);
    }, 30);
    return () => clearInterval(i);
  }, [obj.autoRotate]);

  const rotateY = obj.rotationY + (obj.autoRotate ? autoRotateAngle : 0);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    onPushHistory();

    const start = { x: e.clientX, y: e.clientY };
    const startRot = { x: obj.rotationX, y: obj.rotationY };
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      onUpdate({
        rotationY: startRot.y + dx * 0.5,
        rotationX: Math.max(-80, Math.min(80, startRot.x - dy * 0.5)),
        autoRotate: false,
      });
    };
    const onUp = () => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  };

  const s = obj.size;
  const color = obj.color;

  return (
    <div
      style={{
        position: 'absolute',
        left: obj.x,
        top: obj.y,
        width: s,
        height: s,
        perspective: 900,
        pointerEvents: 'auto',
        cursor: 'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${obj.rotationX}deg) rotateY(${rotateY}deg)`,
          transition: obj.autoRotate ? 'none' : 'transform 0.1s',
        }}
      >
        {obj.shape3d === 'cube' && <Cube size={s} color={color} />}
        {obj.shape3d === 'sphere' && <Sphere size={s} color={color} />}
        {obj.shape3d === 'pyramid' && <Pyramid size={s} color={color} />}
        {obj.shape3d === 'cylinder' && <Cylinder size={s} color={color} />}
      </div>

      {selected && (
        <>
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              border: '2px dashed rgba(99,102,241,0.9)',
              outline: '2px dashed rgba(99,102,241,0.4)',
              outlineOffset: 4,
            }}
          />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-900/95 border border-white/15 shadow-xl pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ autoRotate: !obj.autoRotate });
              }}
              className={`inline-flex items-center justify-center h-6 w-6 rounded transition ${
                obj.autoRotate
                  ? 'text-emerald-400 bg-emerald-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle auto-rotate"
            >
              <Play className="h-3 w-3" />
            </button>
            <div className="w-px h-4 bg-white/15" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="inline-flex items-center justify-center h-6 w-6 rounded text-rose-300 hover:bg-rose-500/20 transition"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   3D PRIMITIVES (CSS 3D)
   ============================================================ */

function shade(hex: string, pct: number): string {
  const c = hex.replace('#', '');
  const num = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const amt = Math.round(2.55 * pct);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r}, ${g}, ${b})`;
}

function Cube({ size, color }: { size: number; color: string }) {
  const s = size;
  const h = s / 2;
  const faces = [
    { t: `translateZ(${h}px)`, c: shade(color, 12) },
    { t: `rotateY(180deg) translateZ(${h}px)`, c: shade(color, -8) },
    { t: `rotateY(90deg) translateZ(${h}px)`, c: shade(color, 5) },
    { t: `rotateY(-90deg) translateZ(${h}px)`, c: shade(color, -5) },
    { t: `rotateX(90deg) translateZ(${h}px)`, c: shade(color, 20) },
    { t: `rotateX(-90deg) translateZ(${h}px)`, c: shade(color, -15) },
  ];
  return (
    <>
      {faces.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: s,
            height: s,
            background: f.c,
            transform: f.t,
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.15)',
          }}
        />
      ))}
    </>
  );
}

function Sphere({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: s,
        height: s,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${shade(
          color,
          40
        )}, ${color} 45%, ${shade(color, -30)} 100%)`,
        boxShadow: `inset -20px -20px 50px rgba(0,0,0,0.35), 0 20px 40px rgba(0,0,0,0.25)`,
      }}
    />
  );
}

function Pyramid({ size, color }: { size: number; color: string }) {
  const s = size;
  const h = s / 2;
  const apex = h * 1.15;
  const faces = [
    { t: `rotateY(0deg) translateZ(${h}px) rotateX(${Math.atan2(h, apex) * (180 / Math.PI)}deg)`, c: shade(color, 10) },
    { t: `rotateY(90deg) translateZ(${h}px) rotateX(${Math.atan2(h, apex) * (180 / Math.PI)}deg)`, c: shade(color, -5) },
    { t: `rotateY(180deg) translateZ(${h}px) rotateX(${Math.atan2(h, apex) * (180 / Math.PI)}deg)`, c: shade(color, 5) },
    { t: `rotateY(-90deg) translateZ(${h}px) rotateX(${Math.atan2(h, apex) * (180 / Math.PI)}deg)`, c: shade(color, -12) },
  ];
  const clip = `polygon(50% 0%, 100% 100%, 0% 100%)`;
  return (
    <>
      {faces.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: s,
            height: s,
            background: f.c,
            transform: f.t,
            transformOrigin: 'center bottom',
            clipPath: clip,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          width: s,
          height: s,
          background: shade(color, -25),
          transform: `rotateX(-90deg) translateZ(${h}px)`,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />
    </>
  );
}

function Cylinder({ size, color }: { size: number; color: string }) {
  const s = size;
  const h = s / 2;
  const sides = 16;
  const radius = s / 2;
  return (
    <>
      {Array.from({ length: sides }).map((_, i) => {
        const angle = (360 / sides) * i;
        const segW = (2 * Math.PI * radius) / sides + 2;
        const shadeAmt = Math.cos((angle * Math.PI) / 180) * 15;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: segW,
              height: s,
              left: '50%',
              top: 0,
              marginLeft: -segW / 2,
              background: shade(color, shadeAmt),
              transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
              transformOrigin: 'center center',
              backfaceVisibility: 'hidden',
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${shade(color, 25)}, ${color})`,
          transform: `rotateX(90deg) translateZ(${h}px)`,
          transformOrigin: 'center center',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: shade(color, -35),
          transform: `rotateX(-90deg) translateZ(${h}px)`,
          transformOrigin: 'center center',
        }}
      />
    </>
  );
}

/* ============================================================
   PRESENTATION MODE (3D slides)
   ============================================================ */

function PresentationMode({
  slides,
  initialIndex,
  onClose,
  onExit,
}: {
  slides: Slide[];
  initialIndex: number;
  onClose: () => void;
  onExit: (idx: number) => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ')
        setIdx((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === 'ArrowLeft')
        setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, slides.length]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col">
      <div className="shrink-0 h-12 flex items-center justify-between px-4 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Presentation className="h-4 w-4 text-indigo-400" />
          <p className="text-xs font-bold text-white/80">Presentation Mode</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onExit(idx)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold transition"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ perspective: '1600px' }}
      >
        <div
          className="relative w-[90%] max-w-6xl aspect-video transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${(initialIndex - idx) * -8}deg) translateZ(-40px)`,
          }}
        >
          {slides.map((s, i) => {
            const offset = i - idx;
            const visible = Math.abs(offset) <= 3;
            if (!visible) return null;
            return (
              <div
                key={s.id}
                className="absolute inset-0 rounded-3xl bg-white shadow-2xl shadow-black/60 overflow-hidden"
                style={{
                  transform: `translateX(${offset * 60}%) rotateY(${offset * 25}deg) scale(${
                    offset === 0 ? 1 : 0.85
                  })`,
                  opacity: offset === 0 ? 1 : Math.max(0, 1 - Math.abs(offset) * 0.3),
                  transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 100 - Math.abs(offset),
                }}
              >
                {s.canvas ? (
                  <img
                    src={s.canvas}
                    alt={s.name}
                    className="w-full h-full object-contain bg-white"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white">
                    <p className="text-slate-400 font-semibold">Empty Slide</p>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/50 text-white text-[10px] font-bold">
                  {i + 1} / {slides.length}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center transition disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setIdx((i) => Math.min(slides.length - 1, i + 1))}
          disabled={idx === slides.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center transition disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="shrink-0 h-12 flex items-center justify-center gap-1.5 bg-black/80 border-t border-white/10">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${
              i === idx ? 'w-8 bg-indigo-400' : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}