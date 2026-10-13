import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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

    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const user: any = await User.findById(decoded.userId)
      .select('name email phone role avatar provider isVerified createdAt lastLogin loginCount')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    /* academy info */
    const academy: any = await Academy.findOne({ ownerId: user._id })
      .select('_id name slug logo')
      .lean();

    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: String(user.name || ''),
        email: String(user.email || ''),
        phone: String(user.phone || ''),
        role: String(user.role || 'user'),
        avatar: String(user.avatar || ''),
        provider: String(user.provider || 'credentials'),
        isVerified: user.isVerified ?? false,
        createdAt: user.createdAt
          ? new Date(user.createdAt).toISOString()
          : null,
        lastLogin: user.lastLogin
          ? new Date(user.lastLogin).toISOString()
          : null,
        loginCount: Number(user.loginCount) || 0,
      },
      academy: academy
        ? {
            id: String(academy._id),
            name: String(academy.name || ''),
            slug: String(academy.slug || ''),
            logo: String(academy.logo || ''),
          }
        : null,
    });
  } catch (err: any) {
    console.error('[user/profile]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}