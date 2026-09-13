import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;

/* ============================================================
   TYPES
   ============================================================ */

interface JwtPayload {
  userId?: string;
  email?: string;
}

/* ============================================================
   HELPERS
   ============================================================ */

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded?.userId) return null;

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch {
    return null;
  }
}

/* ============================================================
   POST — Follow / Unfollow toggle
   ============================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    /* ---------- AUTH ---------- */
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /* ---------- Validate userId ---------- */
    const userIdString = String(user._id);

    if (!mongoose.Types.ObjectId.isValid(userIdString)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // ✅ String کو ObjectId میں تبدیل کریں
    const userIdObjectId = new mongoose.Types.ObjectId(userIdString);

    await connectDB();

    /* ---------- Find academy ---------- */
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Academy slug is required' },
        { status: 400 }
      );
    }

    const academy = await Academy.findOne({ slug });

    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    /* ---------- Check if already following ---------- */
    const followers = Array.isArray(academy.followers)
      ? academy.followers
      : [];

    // ✅ ObjectId سے compare کریں
    const isFollowing = followers.some(
      (id: mongoose.Types.ObjectId) =>
        String(id) === userIdString
    );

    let action: 'followed' | 'unfollowed';

    if (isFollowing) {
      /* ---------- Unfollow ---------- */
      academy.followers = followers.filter(
        (id: mongoose.Types.ObjectId) => String(id) !== userIdString
      );
      action = 'unfollowed';
    } else {
      /* ---------- Follow ---------- */
      // ✅ ObjectId array میں ObjectId push کریں (string نہیں)
      academy.followers = [...followers, userIdObjectId];
      action = 'followed';
    }

    /* ---------- Recalculate cache ---------- */
    academy.followerCount = academy.followers.length;

    await academy.save();

    /* ---------- Response ---------- */
    return NextResponse.json({
      success: true,
      action,
      following: action === 'followed',
      followerCount: academy.followerCount,
    });
  } catch (error: unknown) {
    console.error('Follow academy error:', error);

    const mongoError = error as {
      code?: number;
      name?: string;
      message?: string;
    };

    if (mongoError?.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ============================================================
   GET — Check follow status
   ============================================================ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({
        following: false,
        followerCount: 0,
      });
    }

    const userIdString = String(user._id);

    await connectDB();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Academy slug is required' },
        { status: 400 }
      );
    }

    const academy = await Academy.findOne({ slug })
      .select('followers followerCount')
      .lean();

    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    const followers = Array.isArray(academy.followers)
      ? academy.followers
      : [];

    const following = followers.some(
      (id: mongoose.Types.ObjectId) => String(id) === userIdString
    );

    return NextResponse.json({
      following,
      followerCount: Number(academy.followerCount) || 0,
    });
  } catch (error: unknown) {
    console.error('Check follow status error:', error);
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}