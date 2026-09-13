import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Subscription from '@/models/Subscription';
import { getPlan, getPlanPrice, type PlanId, type BillingCycle } from '@/app/lib/plans';
import { generateReference, getMethodCurrency } from '@/app/lib/paymentDetails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
}

interface Body {
  planId: PlanId;
  billingCycle: BillingCycle;
  paymentMethod: 'payoneer' | 'bank_transfer' | 'jazzcash' | 'easypaisa';
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
    const { planId, billingCycle, paymentMethod } = body;

    if (!planId || !billingCycle || !paymentMethod) {
      return NextResponse.json(
        { error: 'planId, billingCycle, and paymentMethod required' },
        { status: 400 }
      );
    }

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const academy = await Academy.findOne({ ownerId: user._id }).lean();
    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found. Please create one first.' },
        { status: 404 }
      );
    }

    // Cancel any pending subscriptions
    await Subscription.updateMany(
      { academyId: academy._id, status: 'pending' },
      { $set: { status: 'cancelled' } }
    );

    // Create new pending subscription
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const price = getPlanPrice(plan, billingCycle);
    const currency = getMethodCurrency(paymentMethod);

    const reference = generateReference(String(academy._id));

    const subscription = await Subscription.create({
      academyId: academy._id,
      ownerId: user._id,
      planId: plan.id,
      planName: plan.name,
      studentLimit: plan.studentLimit,
      billingCycle,
      amountUSD: price.usd,
      amountPKR: price.pkr,
      currency,
      status: 'pending',
      startDate,
      endDate,
      paymentStatus: 'pending',
      paymentMethod,
      paymentId: reference,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: String(subscription._id),
      reference,
      plan: {
        id: plan.id,
        name: plan.name,
        studentLimit: plan.studentLimit,
        amountUSD: price.usd,
        amountPKR: price.pkr,
      },
      paymentMethod,
      currency,
    });
  } catch (error: unknown) {
    console.error('Manual init error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}