// src/components/AIWhiteboard.tsx
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DrawingInstruction } from '../types';

const AIWhiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // کینوس سیٹ اپ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 700;
    canvas.height = 400;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = 'round';
    context.lineWidth = 3;
    setCtx(context);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.strokeStyle = '#000000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (): void => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearBoard = (): void => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleAI = async (): Promise<void> => {
    if (!prompt.trim()) {
      toast.error('براہ کرم کچھ لکھیں!');
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post<{ instructions: DrawingInstruction[] }>(
        '/api/ai/whiteboard',
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const instructions = res.data.instructions;
      const canvas = canvasRef.current;
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // بورڈ صاف کریں
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // ہر انسٹرکشن پر عمل کریں
      instructions.forEach((cmd) => {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';

        const scaleX = w / 200;
        const scaleY = h / 200;

        switch (cmd.type) {
          case 'text':
            if (cmd.value && cmd.x !== undefined && cmd.y !== undefined) {
              ctx.fillText(cmd.value, cmd.x * scaleX, cmd.y * scaleY);
            }
            break;
          case 'circle':
            if (cmd.cx !== undefined && cmd.cy !== undefined && cmd.r !== undefined) {
              ctx.beginPath();
              ctx.arc(cmd.cx * scaleX, cmd.cy * scaleY, cmd.r * scaleX, 0, 2 * Math.PI);
              ctx.stroke();
            }
            break;
          case 'rect':
            if (cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined && cmd.h !== undefined) {
              ctx.strokeRect(cmd.x * scaleX, cmd.y * scaleY, cmd.w * scaleX, cmd.h * scaleY);
            }
            break;
          case 'line':
            if (cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
              ctx.beginPath();
              ctx.moveTo(cmd.x1 * scaleX, cmd.y1 * scaleY);
              ctx.lineTo(cmd.x2 * scaleX, cmd.y2 * scaleY);
              ctx.stroke();
            }
            break;
          default:
            break;
        }
      });
      toast.success('🤖 AI نے کامیابی سے ڈرا دیا!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'AI میں خرابی');
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">🎨 AI وائٹ بورڈ</h3>

      <div className="flex justify-center bg-gray-100 rounded-lg p-1">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border border-gray-300 rounded bg-white cursor-crosshair w-full max-h-[400px]"
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='مثال: "دائرہ بناؤ" یا "E=mc² لکھو"'
          className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-[150px]"
        />
        <button
          onClick={handleAI}
          disabled={isLoading}
          className="bg-purple-600 text-white px-5 py-2 rounded hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {isLoading ? '🤖 سوچ رہا...' : '🤖 AI سے کہو'}
        </button>
        <button
          onClick={clearBoard}
          className="bg-red-500 text-white px-5 py-2 rounded hover:bg-red-600 transition"
        >
          🧹 صاف کرو
        </button>
      </div>
    </div>
  );
};

export default AIWhiteboard;