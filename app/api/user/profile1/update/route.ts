import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { name, avatar } = await req.json();

    await connectDB();

    const user: any = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim().slice(0, 60);
    }

    if (typeof avatar === 'string') {
      user.avatar = avatar.trim();
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated',
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      },
    });
  } catch (err: any) {
    console.error('[user/profile/update]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}