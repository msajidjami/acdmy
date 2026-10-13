import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const decoded: any = jwt.verify(token, secret);
    return decoded?.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, phone } = await req.json();

    await connectDB();

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').replace(/\D/g, '');

    let user: any = null;

    if (cleanEmail) {
      user = await User.findOne({ email: cleanEmail })
        .select('_id name email phone role avatar')
        .lean();
    } else if (cleanPhone) {
      /* مختلف فارمیٹس چیک کریں */
      const formats = [
        cleanPhone,
        `+${cleanPhone}`,
        cleanPhone.startsWith('92')
          ? `+${cleanPhone}`
          : `+92${cleanPhone.replace(/^0/, '')}`,
      ];

      user = await User.findOne({ phone: { $in: formats } })
        .select('_id name email phone role avatar')
        .lean();
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'Not on platform — will save as external contact',
      });
    }

    if (String(user._id) === userId) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'This is your own account',
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      user: {
        id: String(user._id),
        name: String(user.name || ''),
        email: String(user.email || ''),
        phone: String(user.phone || ''),
        role: String(user.role || 'user'),
        avatar: String(user.avatar || ''),
      },
      message: 'Found on platform',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}