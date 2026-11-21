
import { NextRequest, NextResponse } from 'next/server';

import connectDB from '@/app/lib/dbConnect';
import CallSession from '@/models/CallSession';
import CallUsage from '@/models/CallUsage';
import ChatMessage from '@/models/ChatMessage';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const validId = (id: string) => /^[a-fA-F0-9]{24}$/.test(id);

type FinalStatus = 'ended' | 'cancelled' | 'missed' | 'failed';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate current user
    const me: any = await getUserFromToken();

    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = String(me.id || me.userId || me._id || '');

    if (!validId(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user session' },
        { status: 401 }
      );
    }

    // 2. Validate call ID
    const body = await req.json().catch(() => ({}));
    const callId = String(body?.callId || '');

    if (!validId(callId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid callId' },
        { status: 400 }
      );
    }

    await connectDB();

    // 3. Find call session
    const session = await CallSession.findById(callId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Call not found' },
        { status: 404 }
      );
    }

    const callerId = String(session.callerId);
    const receiverId = String(session.receiverId);

    const isCaller = callerId === userId;
    const isReceiver = receiverId === userId;

    if (!isCaller && !isReceiver) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this call' },
        { status: 403 }
      );
    }

    // 4. Handle already finished calls
    const terminalStatuses = [
      'rejected',
      'busy',
      'cancelled',
      'missed',
      'ended',
      'failed',
    ];

    if (terminalStatuses.includes(session.status)) {
      return NextResponse.json({
        success: true,
        alreadyEnded: true,
        call: {
          callId,
          status: session.status,
          durationSeconds: session.durationSeconds || 0,
        },
      });
    }

    const now = new Date();
    const wasAccepted = session.status === 'accepted';

    // 5. Determine final status on server
    let finalStatus: FinalStatus;

    if (wasAccepted) {
      finalStatus = 'ended';
    } else if (
      session.status === 'ringing' &&
      new Date(session.expiresAt).getTime() <= now.getTime()
    ) {
      finalStatus = 'missed';
    } else if (isCaller) {
      finalStatus = 'cancelled';
    } else {
      finalStatus = 'missed';
    }

    // 6. Calculate duration from acceptedAt.
    // Never trust duration sent by the client.
    const acceptedAt = session.acceptedAt
      ? new Date(session.acceptedAt)
      : null;

    const durationSeconds =
      wasAccepted && acceptedAt && !Number.isNaN(acceptedAt.getTime())
        ? Math.max(
            0,
            Math.floor((now.getTime() - acceptedAt.getTime()) / 1000)
          )
        : 0;

    // 7. Atomic update: only one request can finish the call.
    const updated = await CallSession.findOneAndUpdate(
      {
        _id: callId,
        status: { $in: ['ringing', 'accepted'] },
      },
      {
        $set: {
          status: finalStatus,
          endedAt: now,
          endedBy: userId,
          durationSeconds,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      const latest = await CallSession.findById(callId).lean();

      return NextResponse.json({
        success: true,
        alreadyEnded: true,
        call: {
          callId,
          status: latest?.status || 'ended',
          durationSeconds: latest?.durationSeconds || 0,
        },
      });
    }

    // 8. Update monthly usage for both users.
    // Only accepted calls count toward usage.
    if (wasAccepted) {
      const monthKey = [
        now.getUTCFullYear(),
        String(now.getUTCMonth() + 1).padStart(2, '0'),
      ].join('-');

      await CallUsage.bulkWrite(
        [
          {
            updateOne: {
              filter: {
                userId: callerId,
                monthKey,
              },
              update: {
                $inc: {
                  secondsUsed: durationSeconds,
                  callCount: 1,
                },
              },
              upsert: true,
            },
          },
          {
            updateOne: {
              filter: {
                userId: receiverId,
                monthKey,
              },
              update: {
                $inc: {
                  secondsUsed: durationSeconds,
                  callCount: 1,
                },
              },
              upsert: true,
            },
          },
        ],
        { ordered: true }
      );
    }

    // 9. Save call history.
    // ChatMessage schema uses text, not content or conversationId.
    const historyStatus =
      finalStatus === 'ended'
        ? durationSeconds > 0
          ? 'completed'
          : 'missed'
        : finalStatus === 'cancelled'
          ? 'no_answer'
          : 'missed';

    await ChatMessage.create({
      senderId: callerId,
      receiverId,
      type: 'call',
      text: '',
      call: {
        kind: session.kind,
        status: historyStatus,
        durationSeconds,
      },
    });

    // 10. Successful response
    return NextResponse.json({
      success: true,
      alreadyEnded: false,
      call: {
        callId,
        callerId,
        receiverId,
        kind: session.kind,
        status: finalStatus,
        durationSeconds,
        endedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('[calls/end] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to end call',
      },
      { status: 500 }
    );
  }
}
