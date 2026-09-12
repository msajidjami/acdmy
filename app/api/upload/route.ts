import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
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

    /* ---------- Parse form ---------- */
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    /* ---------- Validate ---------- */
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File must be smaller than 10 MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    /* ---------- File extension ---------- */
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[file.type] || 'jpg';

    /* ✅ REAL filename — every upload gets unique name */
    const random = Math.random().toString(36).slice(2, 10);
    const filename = `img-${Date.now()}-${random}.${ext}`;

    /* ---------- Ensure folder exists ---------- */
    const uploadsDir = join(process.cwd(), 'public', 'uploads');

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
      console.log('Created uploads folder:', uploadsDir);
    }

    /* ---------- Write file to disk ---------- */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    console.log('✅ File saved:', filepath, `(${file.size} bytes)`);

    /* ---------- Return REAL public URL ---------- */
    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,   // ← dynamic, not "example.jpg"
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}