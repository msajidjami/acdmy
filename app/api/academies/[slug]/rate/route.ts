import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

type Ctx = { params: Promise<{ slug: string }> };

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('token')?.value;
  if (!token || !JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

/* ============================================================
   POST — Add / Update rating
   ============================================================ */

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const stars = Number(body.stars);
    const comment = String(body.comment || '').trim().slice(0, 500);

    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const { slug } = await params;
    await connectDB();

    const academy = await Academy.findOne({ slug });
    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    /* Owner خود کو rate نہیں کر سکتا */
    if (String(academy.ownerId) === String(userId)) {
      return NextResponse.json(
        { error: 'You cannot rate your own academy' },
        { status: 400 }
      );
    }

    /* پرانی rating ڈھونڈیں */
    const existingIdx = (academy.ratings || []).findIndex(
      (r: any) => String(r.userId) === String(userId)
    );

    if (existingIdx >= 0) {
      /* Update */
      (academy.ratings as any)[existingIdx].stars = stars;
      (academy.ratings as any)[existingIdx].comment = comment;
      (academy.ratings as any)[existingIdx].createdAt = new Date();
    } else {
      /* Add new */
      academy.ratings.push({
        userId: userId as any,
        stars,
        comment,
        createdAt: new Date(),
      } as any);
    }

    /* Cache update */
    (academy as any).recalculateStats?.();
    if (typeof (academy as any).recalculateStats !== 'function') {
      const ratings = academy.ratings || [];
      academy.ratingCount = ratings.length;
      const sum = ratings.reduce(
        (a: number, r: any) => a + (Number(r.stars) || 0),
        0
      );
      academy.avgRating =
        ratings.length > 0
          ? Math.round((sum / ratings.length) * 10) / 10
          : 0;
    }

    await academy.save();

    return NextResponse.json({
      success: true,
      avgRating: academy.avgRating,
      ratingCount: academy.ratingCount,
      yourRating: stars,
      updated: existingIdx >= 0,
    });
  } catch (error) {
    console.error('Rate error:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET — Ratings list + your rating
   ============================================================ */

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const userId = await getUserId(req);
    const { slug } = await params;

    await connectDB();
    const academy = await Academy.findOne({ slug })
      .select('ratings avgRating ratingCount')
      .lean();

    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    const ratings = ((academy as any).ratings || []).slice().reverse();

    const yourRating = userId
      ? ratings.find((r: any) => String(r.userId) === String(userId)) || null
      : null;

    return NextResponse.json({
      avgRating: Number((academy as any).avgRating) || 0,
      ratingCount: Number((academy as any).ratingCount) || 0,
      yourRating: yourRating
        ? {
            stars: Number(yourRating.stars),
            comment: String(yourRating.comment || ''),
          }
        : null,
      ratings: ratings.slice(0, 20),
    });
  } catch (error) {
    console.error('Rate GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}