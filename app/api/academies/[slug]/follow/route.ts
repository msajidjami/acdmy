import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

type Ctx = { params: Promise<{ slug: string }> };

/* ============================================================
   Helper — verify token
   ============================================================ */

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
   POST — Follow / Unfollow (toggle)
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

    const { slug } = await params;
    await connectDB();

    const academy = await Academy.findOne({ slug });
    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    /* Owner خود کو follow نہیں کر سکتا */
    if (String(academy.ownerId) === String(userId)) {
      return NextResponse.json(
        { error: 'You cannot follow your own academy' },
        { status: 400 }
      );
    }

    const followers = (academy.followers || []).map((f: any) =>
      String(f)
    );
    const isFollowing = followers.includes(String(userId));

    if (isFollowing) {
      /* Unfollow */
      academy.followers = (academy.followers || []).filter(
        (f: any) => String(f) !== String(userId)
      );
    } else {
      /* Follow */
      academy.followers = [...(academy.followers || []), userId];
    }

    /* Recalculate cache */
    (academy as any).recalculateStats?.();
    if (typeof (academy as any).recalculateStats !== 'function') {
      /* Manual fallback */
      academy.followerCount = academy.followers.length;
    }

    await academy.save();

    return NextResponse.json({
      success: true,
      isFollowing: !isFollowing,
      followerCount: academy.followerCount,
    });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle follow' },
      { status: 500 }
    );
  }
}

/* ============================================================
   GET — Status check
   ============================================================ */

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const userId = await getUserId(req);
    const { slug } = await params;

    await connectDB();
    const academy = await Academy.findOne({ slug })
      .select('followers followerCount')
      .lean();

    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    const followers = ((academy as any).followers || []).map((f: any) =>
      String(f)
    );

    return NextResponse.json({
      followerCount: Number((academy as any).followerCount) || 0,
      isFollowing: userId ? followers.includes(String(userId)) : false,
    });
  } catch (error) {
    console.error('Follow GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow status' },
      { status: 500 }
    );
  }
}