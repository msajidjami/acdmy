import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   GET — Current logged-in user info
   ============================================================ */

export async function GET(request: NextRequest) {
  try {
    /* ---------- 1. JWT_SECRET چیک ---------- */
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[auth/me] JWT_SECRET is not configured');
      return NextResponse.json(
        { success: false, user: null, error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    /* ---------- 2. Cookie سے token ---------- */
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    /* ---------- 3. Token verify ---------- */
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    /* ---------- 4. DB سے تازہ user data ---------- */
    await connectDB();

    const user: any = await User.findById(decoded.userId)
      .select('name email phone role avatar provider isVerified lastLogin loginCount')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 404 }
      );
    }

    /* ---------- 5. Response ---------- */
    return NextResponse.json(
      {
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
          lastLogin: user.lastLogin
            ? new Date(user.lastLogin).toISOString()
            : null,
          loginCount: Number(user.loginCount) || 0,
        },
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err: any) {
    console.error('[auth/me] error:', err);
    return NextResponse.json(
      { success: false, user: null, error: 'Server error' },
      { status: 500 }
    );
  }
}