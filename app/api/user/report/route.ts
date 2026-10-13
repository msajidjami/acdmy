import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Report from '@/models/Report';
import User from '@/models/User';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
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
    const { userId, reason, description } = body || {};

    if (!userId || !isValidObjectId(String(userId))) {
      return NextResponse.json(
        { success: false, error: 'Valid userId required' },
        { status: 400 }
      );
    }

    if (String(userId) === String(me.id)) {
      return NextResponse.json(
        { success: false, error: 'You cannot report yourself' },
        { status: 400 }
      );
    }

    const valid = ['spam', 'abuse', 'harassment', 'fake', 'scam', 'other'];
    if (!reason || !valid.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing reason' },
        { status: 400 }
      );
    }

    await connectDB();

    const target = await User.findById(userId).select('_id').lean();
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Reported user not found' },
        { status: 404 }
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await Report.findOne({
      reporterId: me.id,
      reportedUserId: userId,
      createdAt: { $gte: oneDayAgo },
    }).lean();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already reported this user in the last 24 hours',
        },
        { status: 429 }
      );
    }

    const report = await Report.create({
      reporterId: me.id,
      reportedUserId: userId,
      reason,
      description: String(description || '').slice(0, 2000),
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      reportId: String(report._id),
      message: 'Report submitted. Our team will review it.',
    });
  } catch (err: any) {
    console.error('[user/report POST]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}