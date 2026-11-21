import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import CallSession from '@/models/CallSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getUserId(): Promise<string | null> {
  const token = (await cookies()).get('token')?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as { userId?: string };
    return decoded.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const callId = req.nextUrl.searchParams.get('callId') || '';
    if (!/^[a-fA-F0-9]{24}$/.test(callId)) {
      return NextResponse.json({ success: false, error: 'Invalid callId' }, { status: 400 });
    }

    await connectDB();
    const session = await CallSession.findById(callId).lean();
    if (!session) return NextResponse.json({ success: false, error: 'Call not found' }, { status: 404 });

    const isParticipant = String(session.callerId) === userId || String(session.receiverId) === userId;
    if (!isParticipant) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Expire unanswered calls on read; a scheduled worker can also perform this cleanup.
    if (session.status === 'ringing' && new Date(session.expiresAt).getTime() <= Date.now()) {
      await CallSession.updateOne(
        { _id: callId, status: 'ringing' },
        { $set: { status: 'missed', endedAt: new Date() } }
      );
      return NextResponse.json({ success: true, call: { ...session, status: 'missed' } });
    }

    return NextResponse.json({
      success: true,
      call: {
        callId: String(session._id),
        callerId: String(session.callerId),
        receiverId: String(session.receiverId),
        kind: session.kind,
        status: session.status,
        roomName: session.roomName,
        acceptedAt: session.acceptedAt || null,
        endedAt: session.endedAt || null,
        durationSeconds: session.durationSeconds || 0,
      },
    });
  } catch (error) {
    console.error('[calls/status]', error);
    return NextResponse.json({ success: false, error: 'Unable to get call status' }, { status: 500 });
  }
}
