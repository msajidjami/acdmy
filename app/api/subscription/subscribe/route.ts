import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Subscription from '@/models/Subscription';
import { getPlan, getPlanPrice, type PlanId, type BillingCycle } from '@/app/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
  email?: string;
}

interface SubscribeBody {
  planId: PlanId;
  billingCycle: BillingCycle;
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
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let decoded: JwtPayload;
    try {
      const result = jwt.verify(token, jwtSecret);
      if (typeof result === 'string') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      decoded = result as JwtPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = (await req.json()) as SubscribeBody;
    const { planId, billingCycle } = body;

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'planId and billingCycle are required' },
        { status: 400 }
      );
    }

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found. Please create an academy first.' },
        { status: 404 }
      );
    }

    // Free trial abuse check
    if (planId === 'trial') {
      const existingTrial = await Subscription.findOne({
        ownerId: user._id,
        planId: 'trial',
      });

      if (existingTrial) {
        return NextResponse.json(
          {
            error:
              'You have already used your free trial. Please choose a paid plan.',
            code: 'TRIAL_USED',
          },
          { status: 400 }
        );
      }
    }

    // Dates
    const startDate = new Date();
    const endDate = new Date();

    if (planId === 'trial') {
      endDate.setDate(endDate.getDate() + 14); // 14-day trial
    } else if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const price = getPlanPrice(plan, billingCycle);

    // Trial: instantly active
    const isTrial = planId === 'trial';

    const subscription = await Subscription.create({
      academyId: academy._id,
      ownerId: user._id,
      planId: plan.id,
      planName: plan.name,
      studentLimit: plan.studentLimit,
      billingCycle: isTrial ? 'monthly' : billingCycle,
      amountUSD: isTrial ? 0 : price.usd,
      amountPKR: isTrial ? 0 : price.pkr,
      currency: 'USD',
      status: isTrial ? 'trial' : 'pending',
      startDate,
      endDate,
      paymentStatus: isTrial ? 'paid' : 'pending',
    });

    // Trial: activate academy immediately
    if (isTrial) {
      await Academy.findByIdAndUpdate(academy._id, {
        isPublic: true,
        studentLimit: plan.studentLimit,
        planId: plan.id,
        subscriptionId: subscription._id,
      });

      return NextResponse.json({
        success: true,
        mode: 'trial',
        subscriptionId: String(subscription._id),
        message: '14-day free trial activated successfully!',
      });
    }

    // Paid plans: return checkout info
    // TODO: یہاں payment gateway (LemonSqueezy / JazzCash) session بنائیں
    return NextResponse.json({
      success: true,
      mode: 'payment-required',
      subscriptionId: String(subscription._id),
      plan,
      amountUSD: price.usd,
      amountPKR: price.pkr,
      // paymentUrl: '...',  // gateway integrate ہونے پر
    });
  } catch (error: unknown) {
    console.error('Subscribe error:', error);
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}