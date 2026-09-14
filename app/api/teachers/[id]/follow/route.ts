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

    await connectDB();
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const userIdStr = String((user as any)._id);
    const followers = Array.isArray((teacher as any).followers)
      ? (teacher as any).followers
      : [];

    const isFollowing = followers.some((f: any) => String(f) === userIdStr);

    if (isFollowing) {
      (teacher as any).followers = followers.filter(
        (f: any) => String(f) !== userIdStr
      );
    } else {
      (teacher as any).followers = [
        ...followers,
        new mongoose.Types.ObjectId(userIdStr),
      ];
    }

    (teacher as any).followerCount = (teacher as any).followers.length;
    await teacher.save();

    return NextResponse.json(
      {
        success: true,
        following: !isFollowing,
        followerCount: (teacher as any).followerCount,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Teacher follow error:', error);
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
      .select('followers followerCount')
      .lean();

    if (!teacher) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const followers = Array.isArray((teacher as any).followers)
      ? (teacher as any).followers
      : [];

    const following = user
      ? followers.some((f: any) => String(f) === String((user as any)._id))
      : false;

    return NextResponse.json(
      {
        following,
        followerCount: Number((teacher as any).followerCount) || 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Teacher follow GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}