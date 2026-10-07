'use client';

import { useEffect, useRef, useState } from 'react';
import type { Room } from 'livekit-client';

import {
  ANNOTATION_TOPIC,
  decodeAnnotation,
  drawAnnotationStroke,
  drawLaser,
  type AnnotationPoint,
  type AnnotationStroke,
} from '@/app/lib/livekit/annotationChannel';

export default function AnnotationLayer({ room }: { room: Room | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<AnnotationStroke[]>([]);
  const laserRef = useRef<{
    point: AnnotationPoint;
    color: string;
    at: number;
  } | null>(null);

  const [version, setVersion] = useState(0);

  /* Subscribe to room data */
  useEffect(() => {
    if (!room) return;

    const handler = (payload: Uint8Array, _p: any, _k?: any, topic?: string) => {
      if (topic !== ANNOTATION_TOPIC) return;
      const msg = decodeAnnotation(payload);
      if (!msg) return;

      if (msg.type === 'add') {
        strokesRef.current = [...strokesRef.current, msg.stroke];
        setVersion((v) => v + 1);
      } else if (msg.type === 'undo') {
        strokesRef.current = strokesRef.current.slice(0, -1);
        setVersion((v) => v + 1);
      } else if (msg.type === 'clear') {
        strokesRef.current = [];
        laserRef.current = null;
        setVersion((v) => v + 1);
      } else if (msg.type === 'laser') {
        laserRef.current = { point: msg.point, color: msg.color, at: Date.now() };
      } else if (msg.type === 'resync') {
        strokesRef.current = msg.strokes;
        setVersion((v) => v + 1);
      }
    };

    room.on('dataReceived' as any, handler);
    return () => {
      room.off('dataReceived' as any, handler);
    };
  }, [room]);

  /* rAF redraw */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let running = true;

    const redraw = () => {
      if (!running) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (
        canvas.width !== Math.floor(w * dpr) ||
        canvas.height !== Math.floor(h * dpr)
      ) {
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

      const laser = laserRef.current;
      if (laser && Date.now() - laser.at < 1200) {
        drawLaser(ctx, laser.point, laser.color, w, h, 26);
      } else if (laser) {
        laserRef.current = null;
      }

      requestAnimationFrame(redraw);
    };

    requestAnimationFrame(redraw);
    return () => {
      running = false;
    };
  }, [version]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-[15]"
    />
  );
}