import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import PaymentProof from '@/models/PaymentProof';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
  email?: string;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('token')?.value;
  if (!token) return false;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return false;

  try {
    const result = jwt.verify(token, jwtSecret) as JwtPayload;
    if (!result?.email) return false;
    return ADMIN_EMAILS.includes(result.email.toLowerCase());
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const status = req.nextUrl.searchParams.get('status') || 'pending';

    const query: Record<string, unknown> = {};
    if (status !== 'all') query.status = status;

    const proofs = await PaymentProof.find(query)
      .populate('ownerId', 'name email')
      .populate('academyId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ proofs });
  } catch (error: unknown) {
    console.error('Admin proofs error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}