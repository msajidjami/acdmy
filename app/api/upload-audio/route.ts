import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

/* ---------- Cloudinary Config ---------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    /* ---------- Upload to Cloudinary ---------- */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'teachers/audio',
            resource_type: 'video', // Cloudinary میں آڈیو کے لیے یہی ٹائپ استعمال ہوتی ہے
            format: 'mp3',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
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