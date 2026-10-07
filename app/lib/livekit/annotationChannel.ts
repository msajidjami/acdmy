export const ANNOTATION_TOPIC = 'class-annotation-v1';

export type AnnotationTool =
  | 'laser'
  | 'pen'
  | 'highlighter'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'eraser';

export type AnnotationPoint = { x: number; y: number }; // 0..1 normalized

export type AnnotationStroke = {
  id: string;
  tool: AnnotationTool;
  color: string;
  width: number;
  points: AnnotationPoint[];
};

export type AnnotationMessage =
  | { type: 'add'; stroke: AnnotationStroke }
  | { type: 'laser'; point: AnnotationPoint; color: string }
  | { type: 'undo' }
  | { type: 'clear' }
  | { type: 'resync'; strokes: AnnotationStroke[] };

export function encodeAnnotation(msg: AnnotationMessage): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg));
}

export function decodeAnnotation(data: Uint8Array): AnnotationMessage | null {
  try {
    return JSON.parse(new TextDecoder().decode(data)) as AnnotationMessage;
  } catch {
    return null;
  }
}

/* ---------- Canvas renderer (teacher + student share this) ---------- */

export function drawAnnotationStroke(
  ctx: CanvasRenderingContext2D,
  stroke: AnnotationStroke,
  w: number,
  h: number
) {
  const pts = stroke.points;
  if (pts.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;

  const px = (p: AnnotationPoint) => ({ x: p.x * w, y: p.y * h });

  if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
    ctx.globalCompositeOperation =
      stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    const first = px(pts[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const p = px(pts[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  } else if (stroke.tool === 'highlighter') {
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = stroke.width * 4;
    ctx.beginPath();
    const first = px(pts[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const p = px(pts[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  } else if (stroke.tool === 'arrow') {
    const a = px(pts[0]);
    const b = px(pts[pts.length - 1]);
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const head = 14 + stroke.width * 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(
      b.x - head * Math.cos(angle - Math.PI / 6),
      b.y - head * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      b.x - head * Math.cos(angle + Math.PI / 6),
      b.y - head * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  } else if (stroke.tool === 'rect') {
    const a = px(pts[0]);
    const b = px(pts[pts.length - 1]);
    ctx.lineWidth = stroke.width;
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  } else if (stroke.tool === 'circle') {
    const a = px(pts[0]);
    const b = px(pts[pts.length - 1]);
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const rx = Math.abs(b.x - a.x) / 2;
    const ry = Math.abs(b.y - a.y) / 2;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawLaser(
  ctx: CanvasRenderingContext2D,
  point: AnnotationPoint,
  color: string,
  w: number,
  h: number,
  radius = 22
) {
  const x = point.x * w;
  const y = point.y * h;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(0.6, color + 'cc');
  grad.addColorStop(1, color + '00');
  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}