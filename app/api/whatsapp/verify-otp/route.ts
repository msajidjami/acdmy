import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import OTP from '@/models/OTP';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_ROLE = 'user';
const MAX_ATTEMPTS = 5;

function normalizePhone(value: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('92')) return `+${digits}`;
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
  return `+92${digits}`;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, code, name, mode } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code required' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(phone);
    const cleanCode = String(code).trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    await connectDB();

    const record = await OTP.findOne({ phone: cleanPhone });
    if (!record) {
      return NextResponse.json(
        { error: 'OTP not found. Request new one.' },
        { status: 404 }
      );
    }

    if (new Date(record.expiresAt) < new Date()) {
      await OTP.deleteOne({ phone: cleanPhone });
      return NextResponse.json(
        { error: 'OTP expired' },
        { status: 410 }
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await OTP.deleteOne({ phone: cleanPhone });
      return NextResponse.json(
        { error: 'Too many attempts' },
        { status: 429 }
      );
    }

    if (record.code !== cleanCode) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json(
        { error: 'Invalid OTP', remaining: MAX_ATTEMPTS - record.attempts },
        { status: 401 }
      );
    }

    await OTP.deleteOne({ phone: cleanPhone });

    let user: any = await User.findOne({ phone: cleanPhone });

    if (!user) {
      if (mode !== 'signup') {
        return NextResponse.json(
          {
            error: 'Phone not registered. Please sign up.',
            code: 'USER_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      user = await User.create({
        phone: cleanPhone,
        name: String(name || 'New User').trim(),
        role: DEFAULT_ROLE,
        provider: 'phone',
        isVerified: true,
      });
    } else {
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
    }

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

    const response = NextResponse.json({
      success: true,
      role: user.role,
      name: user.name,
      redirect: user.role === 'admin' ? '/admin/dashboard' : '/',
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
    console.error('[whatsapp/verify-otp]', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}