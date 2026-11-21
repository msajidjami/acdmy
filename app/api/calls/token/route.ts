
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as {
      userId?: string;
    };

    return decoded?.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const currentUserId = await getUserId();

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Request validation
    const body = await req.json().catch(() => ({}));

    const peerUserId = String(body?.peerUserId || '');
    const kind = String(body?.kind || 'video');

    if (!isValidObjectId(peerUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid peerUserId' },
        { status: 400 }
      );
    }

    if (peerUserId === currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Cannot call yourself' },
        { status: 400 }
      );
    }

    if (!['audio', 'video'].includes(kind)) {
      return NextResponse.json(
        { success: false, error: 'Invalid call type' },
        { status: 400 }
      );
    }

    // 3. LiveKit configuration
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { success: false, error: 'LiveKit configuration missing' },
        { status: 500 }
      );
    }

    await connectDB();

    // 4. Verify both users
    const [me, peer] = await Promise.all([
      User.findById(currentUserId)
        .select('_id name avatar privacy')
        .lean(),

      User.findById(peerUserId)
        .select('_id name avatar isOnline lastSeen privacy')
        .lean(),
    ]);

    if (!me || !peer) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Block verification
    const myBlockedUsers = ((me as any).privacy?.blockedUsers || [])
      .map((id: any) => String(id));

    const peerBlockedUsers = ((peer as any).privacy?.blockedUsers || [])
      .map((id: any) => String(id));

    if (
      myBlockedUsers.includes(peerUserId) ||
      peerBlockedUsers.includes(currentUserId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Calling is not allowed',
          code: 'BLOCKED',
        },
        { status: 403 }
      );
    }

    // 6. Consistent one-to-one room
    const roomName = `call_${[currentUserId, peerUserId]
      .sort()
      .join('_')}`;

    // 7. Real user identity
    const identity = currentUserId;

    const accessToken = new AccessToken(
      apiKey,
      apiSecret,
      {
        identity,
        name: String((me as any).name || 'User'),
        ttl: '2h',
      }
    );

    // 8. Audio / Video permissions
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    accessToken.addGrant(grant);

    const token = await accessToken.toJwt();

    // 9. Response
    return NextResponse.json({
      success: true,
      token,
      wsUrl: livekitUrl,
      roomName,
      callId: roomName,
      kind,
      maxSeconds: 0,
      caller: {
        id: currentUserId,
        name: String((me as any).name || ''),
        avatar: String((me as any).avatar || ''),
      },
      receiver: {
        id: peerUserId,
        name: String((peer as any).name || ''),
        avatar: String((peer as any).avatar || ''),
        isOnline: Boolean((peer as any).isOnline),
      },
    });

  } catch (error: any) {
    console.error('[LiveKit Token Error]', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate call token',
      },
      { status: 500 }
    );
  }
}
