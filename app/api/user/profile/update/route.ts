import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

type JwtPayload = { userId?: string };

function getJwtSecret(): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return JWT_SECRET;
}

async function getUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const d = jwt.verify(token, getJwtSecret()) as JwtPayload;
    if (!d?.userId) return null;
    await connectDB();
    return await User.findById(d.userId);
  } catch {
    return null;
  }
}

/* ============================================================
   PUT — profile update
   ============================================================ */
export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, phone, city, country, avatar, notifications } =
      body || {};

    /* Email uniqueness */
    if (
      typeof email === 'string' &&
      email.trim() &&
      email.trim().toLowerCase() !== String((user as any).email || '')
    ) {
      const existing = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: (user as any)._id },
      }).lean();

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Email is already in use' },
          { status: 409 }
        );
      }
    }

    /* Phone uniqueness */
    if (
      typeof phone === 'string' &&
      phone.trim() &&
      phone.trim() !== String((user as any).phone || '')
    ) {
      const existing = await User.findOne({
        phone: phone.trim(),
        _id: { $ne: (user as any)._id },
      }).lean();

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Phone is already in use' },
          { status: 409 }
        );
      }
    }

    /* Update fields */
    if (typeof name === 'string' && name.trim()) {
      (user as any).name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      (user as any).email = email.trim().toLowerCase();
    }
    if (typeof phone === 'string') (user as any).phone = phone.trim();
    if (typeof city === 'string') (user as any).city = city.trim();
    if (typeof country === 'string') (user as any).country = country.trim();
    if (typeof avatar === 'string') (user as any).avatar = avatar.trim();

    if (notifications && typeof notifications === 'object') {
      (user as any).notifications = {
        email: Boolean(notifications.email),
        sms: Boolean(notifications.sms),
        marketing: Boolean(notifications.marketing),
      };
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: String((user as any)._id),
        name: (user as any).name || '',
        email: (user as any).email || '',
        phone: (user as any).phone || '',
        city: (user as any).city || '',
        country: (user as any).country || '',
        avatar: (user as any).avatar || '',
      },
    });
  } catch (error: any) {
    console.error('PUT /api/user/profile/update error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — بعض frontends POST استعمال کرتے ہیں
   ============================================================ */
export async function POST(req: NextRequest) {
  return PUT(req);
}