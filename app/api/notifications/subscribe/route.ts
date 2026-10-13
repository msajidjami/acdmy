import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import PushSubscription from '@/models/PushSubscription';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint, keys, userAgent } = body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    await connectDB();

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          userId: me.id,
          endpoint,
          keys: { p256dh: keys.p256dh, auth: keys.auth },
          userAgent: String(userAgent || '').slice(0, 200),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[notifications/subscribe]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint } = body || {};
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'endpoint required' },
        { status: 400 }
      );
    }

    await connectDB();
    await PushSubscription.deleteOne({ userId: me.id, endpoint });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500 }
    );
  }
}