
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';

import adminApp from '@/app/lib/firebaseAdmin';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 }
      );
    }

    // Check Firebase Admin configuration
    if (!adminApp) {
      console.error('[firebase-login] Firebase Admin is not configured');

      return NextResponse.json(
        { error: 'Firebase authentication is currently unavailable.' },
        { status: 503 }
      );
    }

    // Check JWT configuration before processing login
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[firebase-login] JWT_SECRET is missing');

      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    // Verify Firebase ID Token
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    const phone = decoded.phone_number;

    if (!phone) {
      return NextResponse.json(
        { error: 'No phone number in token' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find registered user
    const user: any = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        {
          error: 'This phone number is not registered. Please sign up first.',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update login statistics
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      {
        userId: String(user._id),
        role: user.role,
        phone: user.phone,
        name: user.name,
        email: user.email || '',
        isVerified: user.isVerified ?? true,
      },
      secret,
      { expiresIn: '7d' }
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      role: user.role,
      name: user.name,
      redirect: user.role === 'admin' ? '/admin/dashboard' : '/',
    });

    // Set authentication cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error('[firebase-login]', err);

    return NextResponse.json(
      { error: err?.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}
