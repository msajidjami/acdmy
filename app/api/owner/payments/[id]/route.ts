import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Payment from '@/models/Payment1';
import Assignment from '@/models/Assignment';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

const VALID_STATUSES = ['pending', 'paid', 'partial'] as const;
type PaymentStatus = (typeof VALID_STATUSES)[number];

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
    return await User.findById(d.userId).select('-password').lean();
  } catch {
    return null;
  }
}

/* ========================================================
   PUT — Update payment (auto-create if missing)
   ======================================================== */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid payment ID' },
        { status: 400 }
      );
    }

    /* ✅ Try to find by _id first */
    let payment = await Payment.findOne({
      _id: id,
      academyId: academy._id,
    });

    /* ✅ If not found, try by assignmentId + month (body سے) */
    if (!payment) {
      const bodyPeek = await req
        .clone()
        .json()
        .catch(() => ({}));
      const monthPeek = bodyPeek?.month;

      if (monthPeek && /^\d{4}-\d{2}$/.test(String(monthPeek))) {
        payment = await Payment.findOne({
          assignmentId: id,
          month: String(monthPeek),
          academyId: academy._id,
        });
      }
    }

    /* ✅ If still not found, auto-create from assignment */
    if (!payment) {
      const assignment = await Assignment.findOne({
        _id: id,
        academyId: academy._id,
      }).lean();

      if (assignment) {
        const bodyPeek = await req
          .clone()
          .json()
          .catch(() => ({}));
        const monthPeek =
          bodyPeek?.month ||
          (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              '0'
            )}`;
          })();

        payment = await Payment.create({
          academyId: academy._id,
          assignmentId: assignment._id,
          studentId: (assignment as any).studentId,
          teacherId: (assignment as any).teacherId,
          courseId: (assignment as any).courseId,
          month: String(monthPeek),
          amount: Number((assignment as any).feeAmount) || 0,
          currency: (assignment as any).currency || 'PKR',
          status: 'pending',
          paidAmount: 0,
          paymentMethod: '',
          notes: '',
        });
      }
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { status, paidAmount, paymentMethod, notes, amount, currency } =
      body;

    /* ✅ Status change */
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status as PaymentStatus)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      const prev = payment.status;
      payment.status = status as PaymentStatus;

      if (status === 'paid') {
        payment.paidAmount = payment.amount;
        if (prev !== 'paid') payment.paidAt = new Date();
      } else if (status === 'pending') {
        payment.paidAmount = 0;
        payment.paidAt = null;
      } else if (status === 'partial') {
        if (typeof paidAmount === 'number') {
          payment.paidAmount = Math.max(
            0,
            Math.min(paidAmount, payment.amount)
          );
        } else if (payment.paidAmount === 0) {
          payment.paidAmount = Math.round(payment.amount / 2);
        }
        if (prev !== 'partial') payment.paidAt = new Date();
      }
    }

    /* ✅ Manual paidAmount (partial کے لیے) */
    if (
      status !== undefined &&
      status === 'partial' &&
      typeof paidAmount === 'number'
    ) {
      payment.paidAmount = Math.max(
        0,
        Math.min(paidAmount, payment.amount)
      );
    }

    /* ✅ Standalone paidAmount (status کے بغیر) */
    if (
      (status === undefined || status === 'partial') &&
      typeof paidAmount === 'number' &&
      status !== 'paid'
    ) {
      payment.paidAmount = Math.max(
        0,
        Math.min(paidAmount, payment.amount)
      );

      /* Auto-derive status from paidAmount */
      if (payment.paidAmount >= payment.amount && payment.amount > 0) {
        payment.status = 'paid';
        if (!payment.paidAt) payment.paidAt = new Date();
      } else if (payment.paidAmount > 0) {
        payment.status = 'partial';
        if (!payment.paidAt) payment.paidAt = new Date();
      } else {
        payment.status = 'pending';
        payment.paidAt = null;
      }
    }

    /* ✅ Other fields */
    if (typeof paymentMethod === 'string') {
      payment.paymentMethod = paymentMethod.trim();
    }
    if (typeof notes === 'string') {
      payment.notes = notes.trim().slice(0, 500);
    }
    if (amount !== undefined) {
      const amt = Math.max(0, Number(amount) || 0);
      payment.amount = amt;

      /* اگر amount بڑھا تو status dوبارہ calculate */
      if (payment.status === 'paid' && payment.paidAmount < payment.amount) {
        payment.status = payment.paidAmount > 0 ? 'partial' : 'pending';
      }
    }
    if (
      currency !== undefined &&
      ['PKR', 'USD'].includes(String(currency))
    ) {
      payment.currency = String(currency) as 'PKR' | 'USD';
    }

    await payment.save();

    return NextResponse.json({ success: true, payment });
  } catch (error: unknown) {
    console.error('PUT payment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ========================================================
   GET — Single payment (bonus)
   ======================================================== */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: user._id }).lean();
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const payment = await Payment.findOne({
      _id: id,
      academyId: academy._id,
    }).lean();

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, payment });
  } catch (error: unknown) {
    console.error('GET payment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* ========================================================
   DELETE — Delete payment (bonus)
   ======================================================== */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: user._id }).lean();
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const payment = await Payment.findOneAndDelete({
      _id: id,
      academyId: academy._id,
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE payment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}