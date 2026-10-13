import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

/**
 * ✅ Universal — cookie سے user نکالے
 * Google, credentials, phone سب کے لیے
 */
export async function getUserFromToken(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    let decoded: any;
    try {
      const result = jwt.verify(token, secret);
      if (typeof result === 'string') return null;
      decoded = result;
    } catch {
      return null;
    }

    /* ✅ userId، id، _id، sub — سب چیک کریں */
    const userId =
      decoded?.userId || decoded?.id || decoded?._id || decoded?.sub || '';

    const email = String(
      decoded?.email || decoded?.userEmail || ''
    )
      .trim()
      .toLowerCase();

    await connectDB();

    /* ---------- User ڈھونڈیں ---------- */
    let user: any = null;

    if (userId && /^[a-fA-F0-9]{24}$/.test(String(userId))) {
      user = await User.findById(userId)
        .select('name email phone role')
        .lean();
    }

    if (!user && email) {
      user = await User.findOne({ email })
        .select('name email phone role')
        .lean();
    }

    if (!user) return null;

    return {
      id: String(user._id),
      name: String(user.name || ''),
      email: String(user.email || ''),
      phone: String(user.phone || ''),
      role: String(user.role || 'user'),
    };
  } catch {
    return null;
  }
}