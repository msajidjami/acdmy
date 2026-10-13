import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';

import { adminApp } from '@/app/lib/firebaseAdmin';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_ROLE = 'user';

export async function POST(req: NextRequest) {
  try {
    const { idToken, name } = await req.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    /* Firebase ID Token verify */
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    const phone = decoded.phone_number;

    if (!phone) {
      return NextResponse.json(
        { error: 'No phone number in token' },
        { status: 400 }
      );
    }

    await connectDB();

    /* Already registered? */
    const existing = await User.findOne({ phone });
    if (existing) {
      return NextResponse.json(
        { error: 'This phone number is already registered. Please login.' },
        { status: 409 }
      );
    }

    /* Create new user */
    const user = await User.create({
      phone,
      name: String(name || decoded.name || 'New User').trim(),
      role: DEFAULT_ROLE,
      provider: 'phone',
      isVerified: true,
    });

    /* JWT */
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

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

    /* Response + Cookie */
    const response = NextResponse.json({
      success: true,
      role: user.role,
      name: user.name,
      redirect: '/',
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error('[firebase-signup]', err);
    return NextResponse.json(
      { error: err?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}