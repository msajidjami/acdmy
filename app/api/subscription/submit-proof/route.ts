import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import PaymentProof from '@/models/PaymentProof';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
}

interface Body {
  subscriptionId: string;
  paymentMethod: 'payoneer' | 'bank_transfer' | 'jazzcash' | 'easypaisa';
  transactionId: string;
  receiptUrl: string;
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

    const body = (await req.json()) as Body;
    const { subscriptionId, paymentMethod, transactionId, receiptUrl, notes } = body;

    if (!subscriptionId || !paymentMethod || !transactionId) {
      return NextResponse.json(
        { error: 'subscriptionId, paymentMethod, and transactionId required' },
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
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'This subscription is already paid.' },
        { status: 400 }
      );
    }

    // Check for existing pending proof
    const existing = await PaymentProof.findOne({
      subscriptionId: subscription._id,
      status: 'pending',
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'You already have a pending receipt under review.',
          proofId: String(existing._id),
        },
        { status: 400 }
      );
    }

    const proof = await PaymentProof.create({
      subscriptionId: subscription._id,
      academyId: subscription.academyId,
      ownerId: user._id,
      planId: subscription.planId,
      planName: subscription.planName,
      billingCycle: subscription.billingCycle,
      amountUSD: subscription.amountUSD,
      amountPKR: subscription.amountPKR,
      paymentMethod,
      transactionId: transactionId.trim(),
      receiptUrl: receiptUrl || '',
      notes: notes || '',
      status: 'pending',
    });

    // Update subscription payment id with the actual transaction
    subscription.paymentId = transactionId;
    await subscription.save();

    return NextResponse.json({
      success: true,
      proofId: String(proof._id),
      message:
        'Receipt submitted. Our team will verify within 24 hours and activate your plan.',
    });
  } catch (error: unknown) {
    console.error('Submit proof error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}