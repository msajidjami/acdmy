import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ---------- Helper: get logged-in user ---------- */
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string;
    };
    return decoded.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

/* ---------- GET: owner profile ---------- */
export async function GET(_req: NextRequest) {
  try {
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // اپنے User model کے مطابق فیلڈز شامل/کم کریں
    const user = await User.findById(userId)
      .select(
        'name username email phone avatar bio role isVerified createdAt'
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error('GET /api/owner/profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ---------- PUT: update owner profile ---------- */
export async function PUT(req: NextRequest) {
  try {
    const userId = await getAuthUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { name, username, phone, bio, avatar } = body || {};

    const update: Record<string, any> = {};
    if (typeof name === 'string') update.name = name.trim();
    if (typeof username === 'string') update.username = username.trim();
    if (typeof phone === 'string') update.phone = phone.trim();
    if (typeof bio === 'string') update.bio = bio.trim();
    if (typeof avatar === 'string') update.avatar = avatar.trim();

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
    })
      .select(
        'name username email phone avatar bio role isVerified createdAt'
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('PUT /api/owner/profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}