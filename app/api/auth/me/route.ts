
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  provider?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 1. JWT secret
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[auth/me] JWT_SECRET is not configured');

      return NextResponse.json(
        {
          success: false,
          user: null,
          error: 'Server misconfigured',
        },
        { status: 500 }
      );
    }

    // 2. Read authentication cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, user: null },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    // 3. Verify JWT
    let decoded: JwtPayload;

    try {
      const verified = jwt.verify(token, secret);

      if (
        typeof verified === 'string' ||
        !verified.userId ||
        typeof verified.userId !== 'string'
      ) {
        throw new Error('Invalid JWT payload');
      }

      decoded = verified as JwtPayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          user: null,
          error: 'Invalid or expired session',
        },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    // 4. Connect database
    await connectDB();

    // 5. Get latest user information
    const user = await User.findById(decoded.userId)
      .select(
        'name email phone role avatar provider isVerified lastLogin loginCount'
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          user: null,
          error: 'User not found',
        },
        {
          status: 404,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    // 6. Normalize user ID for the entire application
    const userId = String(user._id);

    const currentUser = {
      id: userId,
      userId,

      name: String(user.name || ''),
      email: String(user.email || ''),
      phone: String(user.phone || ''),
      role: String(user.role || 'user'),
      avatar: String(user.avatar || ''),
      provider: String(user.provider || 'credentials'),

      isVerified: Boolean(user.isVerified),

      lastLogin: user.lastLogin
        ? new Date(user.lastLogin).toISOString()
        : null,

      loginCount: Number(user.loginCount) || 0,
    };

    // 7. Success response
    return NextResponse.json(
      {
        success: true,
        user: currentUser,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[auth/me] error:', error);

    return NextResponse.json(
      {
        success: false,
        user: null,
        error: 'Server error',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
