import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import cloudinary, { uploadToCloudinary } from '@/app/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ============================================================
   TYPES
   ============================================================ */

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/* ============================================================
   POST — Image Upload to Cloudinary
   ============================================================ */

export async function POST(req: Request) {
  try {
    /* ---------- 1. Auth ---------- */
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
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    let decoded: JwtUserPayload;
    try {
      const result = jwt.verify(token, jwtSecret);
      if (typeof result === 'string') throw new Error('Invalid token');
      decoded = result as JwtUserPayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    /* ---------- 2. Cloudinary Config Check ---------- */
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error('Cloudinary environment variables missing');
      return NextResponse.json(
        {
          error:
            'Cloud storage is not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    /* ---------- 3. Parse Form Data ---------- */
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    /* ---------- 4. Validate File ---------- */
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File must be smaller than 10 MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Only JPEG, PNG, WebP, and GIF images are allowed',
        },
        { status: 400 }
      );
    }

    /* ---------- 5. Convert to Buffer ---------- */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /* ---------- 6. Upload to Cloudinary ---------- */
    let result;
    try {
      result = await uploadToCloudinary(buffer, {
        folder: 'online-acadmies-hub/uploads',
        resourceType: 'image',
        transformation: [
          // Max dimension 1600px, auto quality, auto format
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });
    } catch (uploadError: any) {
      console.error('Cloudinary upload failed:', uploadError);

      return NextResponse.json(
        {
          error:
            uploadError?.message ||
            'Failed to upload image to cloud storage',
        },
        { status: 500 }
      );
    }

    /* ---------- 7. Log Success ---------- */
    console.log('✅ Image uploaded to Cloudinary:', {
      url: result.url,
      publicId: result.publicId,
      size: result.size,
      format: result.format,
      userId: decoded.userId,
    });

    /* ---------- 8. Return Success ---------- */
    return NextResponse.json({
      success: true,
      url: result.url,           // ← Full HTTPS Cloudinary URL
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.size,
    });
  } catch (err: any) {
    console.error('Upload error:', err);

    return NextResponse.json(
      {
        error:
          err?.message || 'Failed to upload file. Please try again.',
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — Delete image from Cloudinary (optional)
   ============================================================ */

export async function DELETE(req: Request) {
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
      if (typeof result === 'string') throw new Error('Invalid');
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    /* ---------- Get publicId ---------- */
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { error: 'publicId is required' },
        { status: 400 }
      );
    }

    /* ---------- Delete from Cloudinary ---------- */
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (err: any) {
    console.error('Delete error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}