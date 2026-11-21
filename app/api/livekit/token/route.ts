import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';

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

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const callId = String(body?.callId || '');
    if (!/^[a-fA-F0-9]{24}$/.test(callId)) {
      return NextResponse.json({ success: false, error: 'Invalid callId' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ success: false, error: 'LiveKit configuration missing' }, { status: 500 });
    }

    await connectDB();
    const session = await CallSession.findById(callId).lean();
    if (!session) return NextResponse.json({ success: false, error: 'Call not found' }, { status: 404 });

    const isParticipant = String(session.callerId) === userId || String(session.receiverId) === userId;
    if (!isParticipant) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    if (session.status !== 'accepted') {
      return NextResponse.json({ success: false, error: 'Call has not been accepted', code: 'CALL_NOT_ACCEPTED' }, { status: 409 });
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userId,
      ttl: '2h',
    });

    const grant: VideoGrant = {
      room: session.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };
    accessToken.addGrant(grant);

    return NextResponse.json({
      success: true,
      token: await accessToken.toJwt(),
      wsUrl,
      roomName: session.roomName,
      callId,
      kind: session.kind,
    });
  } catch (error) {
    console.error('[livekit/token]', error);
    return NextResponse.json({ success: false, error: 'Unable to create call token' }, { status: 500 });
  }
}
