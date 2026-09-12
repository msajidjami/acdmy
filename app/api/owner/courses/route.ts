import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

/* ============================================================
   TYPES
   ============================================================ */

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
  role?: string;
};

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { error: 'Not authenticated', status: 401, user: null, academy: null };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return { error: 'Server misconfigured', status: 500, user: null, academy: null };
  }

  let decoded: JwtUserPayload;
  try {
    const result = jwt.verify(token, jwtSecret);
    if (typeof result === 'string') {
      return { error: 'Invalid session', status: 401, user: null, academy: null };
    }
    decoded = result as JwtUserPayload;
  } catch {
    return { error: 'Invalid session', status: 401, user: null, academy: null };
  }

  if (!decoded.userId) {
    return { error: 'Invalid session', status: 401, user: null, academy: null };
  }

  await connectDB();

  const academy = await Academy.findOne({ ownerId: decoded.userId })
    .select('_id name')
    .lean();

  if (!academy) {
    return { error: 'Academy not found', status: 404, user: null, academy: null };
  }

  return { error: null, status: 200, user: decoded, academy };
}

/* ============================================================
   SANITIZE
   ============================================================ */

function sanitizeCourseInput(body: any) {
  const title = String(body?.title || '').trim().slice(0, 200);
  const description = String(body?.description || '').trim().slice(0, 5000);
  const image = String(body?.image || '').trim().slice(0, 2000);
  const thumbnail = String(body?.thumbnail || image || '').trim().slice(0, 2000);
  const bookTitle = String(body?.bookTitle || '').trim().slice(0, 200);
  const category = String(body?.category || '').trim().slice(0, 100);
  const duration = String(body?.duration || '').trim().slice(0, 50);
  const accentColor =
    String(body?.accentColor || '#6366f1').trim().slice(0, 20) || '#6366f1';

  const price = Math.max(0, Number(body?.price) || 0);
  const totalPages = Math.max(0, Math.floor(Number(body?.totalPages) || 0));

  const level = ['beginner', 'intermediate', 'advanced'].includes(body?.level)
    ? body.level
    : 'beginner';

  const isActive = body?.isActive !== false;

  return {
    title,
    description,
    image,
    thumbnail,
    bookTitle,
    category,
    duration,
    accentColor,
    price,
    totalPages,
    level,
    isActive,
  };
}

/* ============================================================
   GET — List all courses for this owner's academy
   ============================================================ */

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error || !auth.academy) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status }
      );
    }

    const courses = await Course.find({
      academyId: (auth.academy as any)._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(courses);
  } catch (error) {
    console.error('GET /api/owner/courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — Create new course
   ============================================================ */

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error || !auth.academy) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: auth.status }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const data = sanitizeCourseInput(body);

    if (!data.title) {
      return NextResponse.json(
        { error: 'Course title is required' },
        { status: 400 }
      );
    }

    const course = await Course.create({
      ...data,
      academyId: (auth.academy as any)._id,
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/owner/courses error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}