import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
    return await User.findById(d.userId).select('+password');
  } catch {
    return null;
  }
}

/* ========================================================
   PUT — Change password
   ======================================================== */
export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new password are required' },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const storedHash = (user as any).password;

    /* اگر password موجود نہ ہو (OAuth user) */
    if (!storedHash) {
      return NextResponse.json(
        { error: 'Account has no password set. Please contact support.' },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(
      String(currentPassword),
      String(storedHash)
    );

    if (!valid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(String(newPassword), 10);
    (user as any).password = newHash;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/user/password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}