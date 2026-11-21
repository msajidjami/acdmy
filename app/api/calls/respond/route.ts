
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import CallSession from '@/models/CallSession';
import User from '@/models/User';
import { sendPush } from '@/app/lib/push/sendNotification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RespondAction = 'accept' | 'reject' | 'busy';

type RespondStatus = 'accepted' | 'rejected' | 'busy';

const validId = (id: string) => /^[a-fA-F0-9]{24}$/.test(id);

/**
 * Get authenticated user ID from HttpOnly cookie.
 */
async function getUserId(): Promise<string | null> {
  try {
    const token = (await cookies()).get('token')?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) return null;

    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === 'string' ||
      !decoded.userId ||
      typeof decoded.userId !== 'string'
    ) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const userId = await getUserId();

    if (!userId || !validId(userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validate request
    const body = await req.json().catch(() => ({}));

    const callId = String(body?.callId || '');
    const action = String(body?.action || '');

    if (
      !validId(callId) ||
      !['accept', 'reject', 'busy'].includes(action)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    const respondAction = action as RespondAction;

    await connectDB();

    // 3. Find call
    const session = await CallSession.findById(callId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Call not found' },
        { status: 404 }
      );
    }

    // 4. Only receiver can respond
    if (String(session.receiverId) !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 5. Check current status
    if (session.status !== 'ringing') {
      return NextResponse.json(
        {
          success: false,
          error: 'Call is no longer ringing',
          code: 'CALL_NOT_RINGING',
          currentStatus: session.status,
        },
        { status: 409 }
      );
    }

    // 6. Check call expiration
    const now = new Date();

    if (new Date(session.expiresAt).getTime() <= now.getTime()) {
      await CallSession.updateOne(
        {
          _id: callId,
          status: 'ringing',
        },
        {
          $set: {
            status: 'missed',
            endedAt: now,
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Call has expired',
          code: 'CALL_EXPIRED',
        },
        { status: 410 }
      );
    }

    // 7. Determine next status
    const nextStatus: RespondStatus =
      respondAction === 'accept'
        ? 'accepted'
        : respondAction === 'reject'
          ? 'rejected'
          : 'busy';

    // 8. Atomic update
    // Only one accept/reject/busy request can succeed.
    const updatedSession = await CallSession.findOneAndUpdate(
      {
        _id: callId,
        receiverId: userId,
        status: 'ringing',
        expiresAt: { $gt: now },
      },
      {
        $set: {
          status: nextStatus,
          ...(nextStatus === 'accepted'
            ? { acceptedAt: now }
            : { endedAt: now }),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSession) {
      const latest = await CallSession.findById(callId)
        .select('status')
        .lean();

      return NextResponse.json(
        {
          success: false,
          error: 'Call has already been answered or expired',
          code: 'CALL_NOT_RINGING',
          currentStatus: latest?.status || 'unknown',
        },
        { status: 409 }
      );
    }

    // 9. Notify caller about response.
    // PushType supports 'call', so use that instead of 'call_update'.
    try {
      const responder = await User.findById(userId)
        .select('name')
        .lean();

      const title =
        nextStatus === 'accepted'
          ? 'Call accepted'
          : nextStatus === 'rejected'
            ? 'Call declined'
            : 'User is busy';

      const responderName = String(
        (responder as any)?.name || 'Your contact'
      );

      await sendPush({
        toUserId: String(updatedSession.callerId),
        title,
        body: responderName,
        type: 'call',
        ring: false,
        data: {
          callId,
          status: nextStatus,
          action: 'open_call',
        },
      });
    } catch (pushError) {
      console.warn('[calls/respond] Push notification failed:', pushError);
    }

    // 10. Response
    return NextResponse.json({
      success: true,
      call: {
        callId,
        callerId: String(updatedSession.callerId),
        receiverId: String(updatedSession.receiverId),
        status: updatedSession.status,
        roomName: updatedSession.roomName,
        kind: updatedSession.kind,
        acceptedAt: updatedSession.acceptedAt
          ? updatedSession.acceptedAt.toISOString()
          : null,
        endedAt: updatedSession.endedAt
          ? updatedSession.endedAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error('[calls/respond] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to respond to call',
      },
      { status: 500 }
    );
  }
}
