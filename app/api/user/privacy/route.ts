import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user: any = await User.findById(me.id).select('privacy').lean();
    const p = user?.privacy || {};

    return NextResponse.json({
      success: true,
      privacy: {
        allowMessagesFrom: p.allowMessagesFrom || 'contacts',
        discoverable: typeof p.discoverable === 'boolean' ? p.discoverable : true,
        blockedCount: Array.isArray(p.blockedUsers) ? p.blockedUsers.length : 0,
      },
    });
  } catch (err: any) {
    console.error('[user/privacy GET]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

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
    const { allowMessagesFrom, discoverable } = body || {};
    const updates: any = {};

    if (allowMessagesFrom) {
      const allowed = ['everyone', 'contacts', 'nobody'];
      if (!allowed.includes(allowMessagesFrom)) {
        return NextResponse.json(
          { success: false, error: 'Invalid allowMessagesFrom value' },
          { status: 400 }
        );
      }
      updates['privacy.allowMessagesFrom'] = allowMessagesFrom;
    }

    if (typeof discoverable === 'boolean') {
      updates['privacy.discoverable'] = discoverable;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    await connectDB();

    const updated: any = await User.findByIdAndUpdate(
      me.id,
      { $set: updates },
      { new: true }
    )
      .select('privacy')
      .lean();

    return NextResponse.json({
      success: true,
      privacy: {
        allowMessagesFrom: updated?.privacy?.allowMessagesFrom || 'contacts',
        discoverable: updated?.privacy?.discoverable ?? true,
      },
    });
  } catch (err: any) {
    console.error('[user/privacy POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}