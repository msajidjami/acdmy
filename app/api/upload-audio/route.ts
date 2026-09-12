import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
];

export async function POST(req: Request) {
  try {
    /* ---------- Auth ---------- */
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    try {
      const result = jwt.verify(token, jwtSecret);
      if (typeof result === 'string') throw new Error('Invalid token');
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    /* ---------- Parse ---------- */
    const formData = await req.formData();
    const file = formData.get('audio');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    /* ---------- Validate ---------- */
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Audio must be smaller than 15 MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only MP3, WAV, WebM, OGG, M4A allowed' },
        { status: 400 }
      );
    }

    /* ---------- Filename ---------- */
    const extMap: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/m4a': 'm4a',
      'audio/x-m4a': 'm4a',
    };
    const ext = extMap[file.type] || 'mp3';
    const random = Math.random().toString(36).slice(2, 10);
    const filename = `audio-${Date.now()}-${random}.${ext}`;

    /* ---------- Ensure folder ---------- */
    const uploadsDir = join(process.cwd(), 'public', 'uploads');

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    /* ---------- Save ---------- */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error('Audio upload error:', err);
    return NextResponse.json(
      { error: 'Failed to upload audio' },
      { status: 500 }
    );
  }
}