
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Contact from '@/models/Contact';
import CallSession, { type CallSessionStatus } from '@/models/CallSession';
import { sendPush } from '@/app/lib/push/sendNotification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

const validId = (id: string) => /^[a-fA-F0-9]{24}$/.test(id);

export async function POST(req: NextRequest) {
  try {
    const callerId = await getUserId();

    if (!callerId || !validId(callerId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const receiverId = String(body?.peerUserId || '');

    const kind =
      body?.kind === 'video'
        ? 'video'
        : body?.kind === 'audio'
          ? 'audio'
          : '';

    if (!validId(receiverId) || !kind || receiverId === callerId) {
      return NextResponse.json(
        { success: false, error: 'Invalid call details' },
        { status: 400 }
      );
    }

    await connectDB();

    const [caller, receiver] = await Promise.all([
      User.findById(callerId)
        .select('_id name avatar privacy')
        .lean(),

      User.findById(receiverId)
        .select('_id name avatar privacy isOnline')
        .lean(),
    ]);

    if (!caller || !receiver) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check blocked users
    const callerBlocked = (
      (caller as any).privacy?.blockedUsers || []
    ).some((id: any) => String(id) === receiverId);

    const receiverBlocked = (
      (receiver as any).privacy?.blockedUsers || []
    ).some((id: any) => String(id) === callerId);

    if (callerBlocked || receiverBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Calling is not allowed',
          code: 'BLOCKED',
        },
        { status: 403 }
      );
    }

    // Check receiver privacy settings
    const allowMessagesFrom =
      (receiver as any).privacy?.allowMessagesFrom || 'contacts';

    if (allowMessagesFrom === 'nobody') {
      return NextResponse.json(
        {
          success: false,
          error: 'This user is not accepting calls',
          code: 'NOT_ACCEPTING',
        },
        { status: 403 }
      );
    }

    if (allowMessagesFrom === 'contacts') {
      const saved = await Contact.findOne({
        ownerId: receiverId,
        contactId: callerId,
        isSaved: { $ne: false },
      })
        .select('_id')
        .lean();

      if (!saved) {
        return NextResponse.json(
          {
            success: false,
            error: 'This user only accepts calls from saved contacts',
            code: 'CONTACTS_ONLY',
          },
          { status: 403 }
        );
      }
    }

    // Check existing active calls
    const activeStatuses: CallSessionStatus[] = [
      'ringing',
      'accepted',
    ];

    const existing = await CallSession.findOne({
      status: { $in: activeStatuses },
      $or: [
        { callerId },
        { receiverId: callerId },
        { callerId: receiverId },
        { receiverId },
      ],
    })
      .select('_id status')
      .lean();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'One of the users is already in a call',
          code: 'BUSY',
        },
        { status: 409 }
      );
    }

    // Create call session
    const session = await CallSession.create({
      callerId: new Types.ObjectId(callerId),
      receiverId: new Types.ObjectId(receiverId),
      kind,
      roomName: `ilmora_call_${new Types.ObjectId().toString()}`,
      status: 'ringing',
      expiresAt: new Date(Date.now() + 45_000),
    });

    // Send incoming call notification
    let pushSent = false;

    try {
      await sendPush({
        toUserId: receiverId,
        title: kind === 'video'
          ? 'Incoming video call'
          : 'Incoming voice call',
        body: `${String((caller as any).name || 'Someone')} is calling you`,
        type: 'incoming_call',
        data: {
          callId: String(session._id),
          callerId,
          callerName: String((caller as any).name || 'User'),
          callerAvatar: String((caller as any).avatar || ''),
          kind,
          action: 'open_incoming_call',
        },
      });

      pushSent = true;
    } catch (pushError) {
      console.warn('[calls/start] push failed:', pushError);
    }

    return NextResponse.json({
      success: true,
      call: {
        callId: String(session._id),
        callerId,
        receiverId,
        kind,
        status: session.status,
        roomName: session.roomName,
        expiresAt: session.expiresAt.toISOString(),
        pushSent,
      },
    });
  } catch (error: any) {
    console.error('[calls/start]', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to start call',
      },
      { status: 500 }
    );
  }
}
