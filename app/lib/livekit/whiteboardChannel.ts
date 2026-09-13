/* ============================================================
   Whiteboard Data Channel — Shared Types & Helpers
   ============================================================ */

export type WhiteboardKind = 'code' | 'design' | 'stem';

/* ---------- Code Editor State ---------- */
export interface CodeBoardState {
  language: string;
  code: string;
  fileName: string;
}

/* ---------- Design Studio State ---------- */
export interface DesignShape {
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
  points?: { x: number; y: number }[];
  text?: string;
  fontSize?: number;
}

export interface DesignBoardState {
  shapes: DesignShape[];
  showGrid: boolean;
  zoom: number;
}

/* ---------- STEM Board State ---------- */
export interface STEMBoardState {
  subject: 'math' | 'physics' | 'biology' | 'chemistry';
  // Math
  mathFormula?: string;
  mathFunction?: string;
  mathShape?: 'triangle' | 'circle' | 'square';
  // Physics
  physicsV?: number;
  physicsA?: number;
  physicsT?: number;
  physicsFormulaIdx?: number;
  // Biology
  bioSystem?: 'cell' | 'dna' | 'heart' | 'digestive' | 'photosynthesis';
  bioCellType?: 'plant' | 'animal';
  bioSelectedPart?: string;
  // Chemistry
  chemEquation?: string;
  chemPh?: number;
}

/* ---------- Message Envelope ---------- */
export type WhiteboardMessage =
  | {
      type: 'wb-open';
      board: WhiteboardKind;
      state?: any;
      senderName?: string;
    }
  | { type: 'wb-close'; board: WhiteboardKind }
  | {
      type: 'wb-state';
      board: WhiteboardKind;
      state: any;
      partial?: boolean; // If true, merge with existing
    }
  | {
      type: 'wb-pointer';
      board: WhiteboardKind;
      x: number; // 0..1 normalized
      y: number;
      label?: string;
    };

/* ---------- Channel Topic ---------- */
export const WHITEBOARD_TOPIC = 'wb';

/* ---------- Helpers ---------- */
export function encodeMessage(msg: WhiteboardMessage): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg));
}

export function decodeMessage(payload: Uint8Array): WhiteboardMessage | null {
  try {
    const text = new TextDecoder().decode(payload);
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.type === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

/* ---------- Board Display Names ---------- */
export const BOARD_LABELS: Record<WhiteboardKind, string> = {
  code: 'Code Editor',
  design: 'Design Studio',
  stem: 'STEM Board',
};

export const BOARD_COLORS: Record<
  WhiteboardKind,
  { gradient: string; text: string; bg: string; border: string }
> = {
  code: {
    gradient: 'from-sky-500 to-blue-600',
    text: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  design: {
    gradient: 'from-fuchsia-500 to-pink-600',
    text: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    border: 'border-fuchsia-200',
  },
  stem: {
    gradient: 'from-violet-500 to-fuchsia-600',
    text: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
};