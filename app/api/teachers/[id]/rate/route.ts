import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    return await User.findById(decoded.userId).select('-password').lean();
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const stars = Number(body.stars);
    const comment = String(body.comment || '').trim().slice(0, 500);

    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'Rating must be 1-5' },
        { status: 400 }
      );
    }

    await connectDB();
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const userIdStr = String((user as any)._id);
    const ratings = Array.isArray((teacher as any).ratings)
      ? (teacher as any).ratings
      : [];

    const existingIdx = ratings.findIndex(
      (r: any) => String(r.userId) === userIdStr
    );

    if (existingIdx >= 0) {
      (teacher as any).ratings[existingIdx].stars = stars;
      (teacher as any).ratings[existingIdx].comment = comment;
      (teacher as any).ratings[existingIdx].createdAt = new Date();
    } else {
      (teacher as any).ratings.push({
        userId: new mongoose.Types.ObjectId(userIdStr),
        stars,
        comment,
        createdAt: new Date(),
      });
    }

    const allRatings = (teacher as any).ratings;
    const sum = allRatings.reduce(
      (a: number, r: any) => a + (Number(r.stars) || 0),
      0
    );
    (teacher as any).ratingCount = allRatings.length;
    (teacher as any).avgRating =
      allRatings.length > 0
        ? Math.round((sum / allRatings.length) * 10) / 10
        : 0;

    await teacher.save();

    return NextResponse.json(
      {
        success: true,
        avgRating: (teacher as any).avgRating,
        ratingCount: (teacher as any).ratingCount,
        yourRating: stars,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Teacher rate error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();
    const teacher = await Teacher.findById(id)
      .select('ratings avgRating ratingCount')
      .lean();

    if (!teacher) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const ratings = ((teacher as any).ratings || []).slice().reverse();
    const yourRating = user
      ? ratings.find(
          (r: any) => String(r.userId) === String((user as any)._id)
        ) || null
      : null;

    return NextResponse.json(
      {
        avgRating: Number((teacher as any).avgRating) || 0,
        ratingCount: Number((teacher as any).ratingCount) || 0,
        yourRating: yourRating
          ? { stars: yourRating.stars, comment: yourRating.comment }
          : null,
        ratings: ratings.slice(0, 20),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Teacher rate GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}