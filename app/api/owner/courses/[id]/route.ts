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
   AUTH HELPER
   ============================================================ */

/**
 * Verify the JWT cookie and load the owner's academy.
 * Returns a normalized result so callers never have to
 * guess whether an error happened or not.
 */
async function getAuthenticatedAcademy(): Promise<
  | { ok: true; academy: { _id: any; name?: string } }
  | { ok: false; status: number; error: string }
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { ok: false, status: 401, error: 'Not authenticated' };
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return { ok: false, status: 500, error: 'Server misconfigured' };
    }

    let decoded: JwtUserPayload;
    try {
      const result = jwt.verify(token, jwtSecret);
      if (typeof result === 'string') {
        return { ok: false, status: 401, error: 'Invalid session' };
      }
      decoded = result as JwtUserPayload;
    } catch {
      return { ok: false, status: 401, error: 'Invalid session' };
    }

    if (!decoded.userId) {
      return { ok: false, status: 401, error: 'Invalid session' };
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: decoded.userId })
      .select('_id name')
      .lean();

    if (!academy) {
      return { ok: false, status: 404, error: 'Academy not found' };
    }

    return { ok: true, academy: academy as any };
  } catch (err) {
    console.error('Auth error:', err);
    return { ok: false, status: 500, error: 'Authentication failed' };
  }
}

/* ============================================================
   INPUT SANITIZER
   ============================================================ */

function sanitizeCourseInput(body: any) {
  const image = String(body?.image || '').trim().slice(0, 2000);
  const thumbnail = String(body?.thumbnail || image || '').trim().slice(0, 2000);

  return {
    title: String(body?.title || '').trim().slice(0, 200),
    description: String(body?.description || '').trim().slice(0, 5000),
    image,
    thumbnail,
    bookTitle: String(body?.bookTitle || '').trim().slice(0, 200),
    category: String(body?.category || '').trim().slice(0, 100),
    duration: String(body?.duration || '').trim().slice(0, 50),
    accentColor:
      String(body?.accentColor || '#6366f1').trim().slice(0, 20) || '#6366f1',
    price: Math.max(0, Number(body?.price) || 0),
    totalPages: Math.max(0, Math.floor(Number(body?.totalPages) || 0)),
    level: (['beginner', 'intermediate', 'advanced'] as const).includes(
      body?.level
    )
      ? body.level
      : 'beginner',
    isActive: body?.isActive !== false,
  };
}

/* ============================================================
   GET — Single course (owner-scoped)
   ============================================================ */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAcademy();
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findOne({
      _id: id,
      academyId: auth.academy._id,
    }).lean();

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (err) {
    console.error('GET /api/owner/courses/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT — Update course (owner-scoped)
   ============================================================ */

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAcademy();
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
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

    /* ✅ Scoped by academyId — no cross-academy writes */
    const updated = await Course.findOneAndUpdate(
      {
        _id: id,
        academyId: auth.academy._id,
      },
      data,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PUT /api/owner/courses/[id] error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to update course' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — Remove course (owner-scoped)
   ============================================================ */

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAcademy();
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    /* ✅ Scoped by academyId */
    const deleted = await Course.findOneAndDelete({
      _id: id,
      academyId: auth.academy._id,
    }).lean();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/owner/courses/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}