import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import Academy from '@/models/Academy';
import PaymentProof from '@/models/PaymentProof';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
  email?: string;
}

interface Body {
  action: 'approve' | 'reject';
  adminNotes?: string;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function getAdminId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  try {
    const result = jwt.verify(token, jwtSecret) as JwtPayload;
    if (!result?.email || !result?.userId) return null;
    if (!ADMIN_EMAILS.includes(result.email.toLowerCase())) return null;
    return result.userId;
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminId(req);
    if (!adminId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = (await req.json()) as Body;

    if (!body.action || !['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { error: 'action must be approve or reject' },
        { status: 400 }
      );
    }

    await connectDB();

    const proof = await PaymentProof.findById(id);
    if (!proof) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }

    if (proof.status !== 'pending') {
      return NextResponse.json(
        { error: `Already ${proof.status}` },
        { status: 400 }
      );
    }

    if (body.action === 'approve') {
      // Update proof
      proof.status = 'approved';
      proof.adminNotes = body.adminNotes || '';
      proof.reviewedBy = adminId as any;
      proof.reviewedAt = new Date();
      await proof.save();

      // Update subscription
      const subscription = await Subscription.findById(proof.subscriptionId);
      if (subscription) {
        subscription.status = 'active';
        subscription.paymentStatus = 'paid';
        subscription.invoices.push({
          invoiceId: `INV-${Date.now()}`,
          amount: subscription.amountUSD || subscription.amountPKR,
          currency: subscription.currency,
          paidAt: new Date(),
          status: 'paid',
        });
        await subscription.save();

        // Activate academy
        await Academy.findByIdAndUpdate(subscription.academyId, {
          isPublic: true,
          studentLimit: subscription.studentLimit,
          planId: subscription.planId,
          subscriptionId: subscription._id,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment approved. Academy activated.',
      });
    } else {
      // Reject
      proof.status = 'rejected';
      proof.adminNotes = body.adminNotes || '';
      proof.reviewedBy = adminId as any;
      proof.reviewedAt = new Date();
      await proof.save();

      return NextResponse.json({
        success: true,
        message: 'Payment rejected.',
      });
    }
  } catch (error: unknown) {
    console.error('Admin action error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}