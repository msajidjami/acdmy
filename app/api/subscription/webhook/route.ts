import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Subscription from '@/models/Subscription';
import Academy from '@/models/Academy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WebhookEvent {
  type: string;
  data: {
    object: {
      metadata?: {
        subscriptionId?: string;
      };
      payment_intent?: string;
      id?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Production میں signature verify کریں
    // const signature = req.headers.get('x-signature');
    // validateSignature(...)

    const body = await req.text();
    let event: WebhookEvent;

    try {
      event = JSON.parse(body) as WebhookEvent;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const subscriptionId = session.metadata?.subscriptionId;

      if (subscriptionId) {
        await connectDB();

        const sub = await Subscription.findByIdAndUpdate(
          subscriptionId,
          {
            status: 'active',
            paymentStatus: 'paid',
            paymentMethod: 'lemonsqueezy',
            paymentId: session.payment_intent || session.id || '',
            $push: {
              invoices: {
                invoiceId: session.id || '',
                amount: 0,
                currency: 'USD',
                paidAt: new Date(),
                status: 'paid',
              },
            },
          },
          { new: true }
        );

        if (sub) {
          await Academy.findByIdAndUpdate(sub.academyId, {
            isPublic: true,
            studentLimit: sub.studentLimit,
            planId: sub.planId,
            subscriptionId: sub._id,
          });
        }
      }
    }

    if (event.type === 'subscription.cancelled') {
      const session = event.data.object;
      const subscriptionId = session.metadata?.subscriptionId;

      if (subscriptionId) {
        await connectDB();

        await Subscription.findByIdAndUpdate(subscriptionId, {
          status: 'cancelled',
          autoRenew: false,
        });

        const sub = await Subscription.findById(subscriptionId);
        if (sub) {
          await Academy.findByIdAndUpdate(sub.academyId, {
            isPublic: false,
            studentLimit: 0,
            planId: 'free',
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message =
      error instanceof Error ? error.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}