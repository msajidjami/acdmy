import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* POST — register device token */
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
    const { token, platform } = body || {};

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    /* Duplicate نہ بنے */
    await User.findByIdAndUpdate(me.id, {
      $addToSet: { fcmTokens: token },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[user/fcm-token POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

/* DELETE — remove token (logout) */
export async function DELETE(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'token required' },
        { status: 400 }
      );
    }

    await connectDB();
    await User.findByIdAndUpdate(me.id, { $pull: { fcmTokens: token } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}