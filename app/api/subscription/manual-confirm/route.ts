import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Subscription from '@/models/Subscription';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
}

interface ManualConfirmBody {
  subscriptionId: string;
  transactionId: string;
  receiptUrl?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
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

    const body = (await req.json()) as ManualConfirmBody;
    const { subscriptionId, transactionId, receiptUrl, notes } = body;

    if (!subscriptionId || !transactionId) {
      return NextResponse.json(
        { error: 'subscriptionId and transactionId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      ownerId: user._id,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'This subscription is already confirmed.' },
        { status: 400 }
      );
    }

    // Mark as "awaiting admin verification"
    subscription.paymentId = transactionId;
    subscription.paymentStatus = 'pending';
    subscription.status = 'pending';

    if (notes) {
      subscription.invoices.push({
        invoiceId: `MANUAL-${Date.now()}`,
        amount: subscription.amountPKR,
        currency: 'PKR',
        paidAt: new Date(),
        status: 'pending',
      });
    }

    await subscription.save();

    return NextResponse.json({
      success: true,
      message:
        'Receipt submitted. Our team will verify within 24 hours and activate your plan.',
      subscriptionId: String(subscription._id),
    });
  } catch (error: unknown) {
    console.error('Manual confirm error:', error);
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}