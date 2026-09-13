import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import PaymentProof from '@/models/PaymentProof';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    let decoded: JwtPayload;
    try {
      const result = jwt.verify(token, jwtSecret);
      if (typeof result === 'string' || !result.userId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      decoded = result as JwtPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const proofs = await PaymentProof.find({ ownerId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ proofs });
  } catch (error: unknown) {
    console.error('Proof status error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}