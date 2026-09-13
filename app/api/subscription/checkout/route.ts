import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Subscription from '@/models/Subscription';
import {
  initPayment,
  type PaymentGatewayId,
  type PaymentInitInput,
} from '@/app/lib/payments';
import { getPlan, getPlanPrice, type PlanId, type BillingCycle } from '@/app/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
  email?: string;
}

interface CheckoutBody {
  planId: PlanId;
  billingCycle: BillingCycle;
  gateway: PaymentGatewayId;
  currency?: 'USD' | 'PKR';
}

export async function POST(req: NextRequest) {
  try {
    /* ---------- AUTH ---------- */
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

    /* ---------- PARSE & VALIDATE ---------- */
    const body = (await req.json()) as CheckoutBody;
    const { planId, billingCycle, gateway, currency = 'USD' } = body;

    if (!planId || !billingCycle || !gateway) {
      return NextResponse.json(
        { error: 'planId, billingCycle, and gateway are required' },
        { status: 400 }
      );
    }

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (planId === 'trial') {
      return NextResponse.json(
        { error: 'Trial is activated from the pricing page.' },
        { status: 400 }
      );
    }

    /* ---------- LOAD USER + ACADEMY ---------- */
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

    /* ---------- CANCEL EXISTING PENDING SUBSCRIPTIONS ---------- */
    await Subscription.updateMany(
      {
        academyId: academy._id,
        status: 'pending',
      },
      { $set: { status: 'cancelled' } }
    );

    /* ---------- CREATE NEW SUBSCRIPTION (pending) ---------- */
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const price = getPlanPrice(plan, billingCycle);

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
      paymentMethod: gateway,
    });

    /* ---------- INIT PAYMENT GATEWAY ---------- */
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const input: PaymentInitInput = {
      subscriptionId: subscription._id,
      academyId: academy._id,
      ownerId: user._id,
      planId: plan.id,
      planName: plan.name,
      billingCycle,
      amountUSD: price.usd,
      amountPKR: price.pkr,
      currency,
      customerEmail: String(user.email || ''),
      customerName: String(user.name || ''),
      returnUrl: `${appUrl}/owner/billing?success=1`,
      cancelUrl: `${appUrl}/owner/billing?cancelled=1`,
    };

    const paymentResult = await initPayment(gateway, input);

    if (!paymentResult.success) {
      // Rollback — mark subscription as failed
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'cancelled',
        paymentStatus: 'failed',
      });

      return NextResponse.json(
        {
          error: paymentResult.error || 'Payment init failed',
          gateway,
        },
        { status: 400 }
      );
    }

    /* ---------- SAVE GATEWAY REFERENCE ---------- */
    if (paymentResult.gatewayReference) {
      await Subscription.findByIdAndUpdate(subscription._id, {
        paymentId: paymentResult.gatewayReference,
      });
    }

    /* ---------- RESPONSE ---------- */
    return NextResponse.json({
      success: true,
      subscriptionId: String(subscription._id),
      gateway: paymentResult.gateway,
      redirectUrl: paymentResult.redirectUrl || null,
      gatewayReference: paymentResult.gatewayReference || '',
      instructions: paymentResult.instructions || null,
      plan: {
        id: plan.id,
        name: plan.name,
        studentLimit: plan.studentLimit,
        amountUSD: price.usd,
        amountPKR: price.pkr,
      },
    });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}