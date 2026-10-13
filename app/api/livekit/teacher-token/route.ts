import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { AccessToken } from 'livekit-server-sdk';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { sendPush } from '@/app/lib/push/sendNotification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  const secret = JWT_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    await connectDB();
    return await User.findById(decoded.userId).select('-password').lean();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    /* ---------- Environment check ---------- */
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error(
        '❌ LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing'
      );
      return NextResponse.json(
        { error: 'LiveKit is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    /* ---------- Auth ---------- */
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    /* ---------- Body ---------- */
    const body = await req.json().catch(() => ({} as any));
    const roomName = String(body.roomName || body.room || '').trim();
    const role = String(body.role || 'viewer').trim();
    const assignmentId = String(body.assignmentId || '').trim();

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 }
      );
    }

    /* ---------- Unique identity ---------- */
    const identity = `${String((user as any)._id)}-${Date.now()}`;
    const displayName = String((user as any).name || 'User');

    /* ---------- Build AccessToken ---------- */
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: displayName,
      ttl: '2h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: role === 'teacher' || role === 'owner',
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    /* ---------- ✅ Notify student (only when teacher joins) ---------- */
    if (role === 'teacher' && assignmentId && /^[a-fA-F0-9]{24}$/.test(assignmentId)) {
      try {
        const assignment: any = await Assignment.findById(assignmentId)
          .select('studentId courseId teacherId livekitRoomName')
          .lean();

        if (assignment?.studentId) {
          const course: any = assignment.courseId
            ? await Course.findById(assignment.courseId)
                .select('name title')
                .lean()
            : null;

          const courseName =
            course?.name || course?.title || 'Class';

          await sendPush({
            toUserId: String(assignment.studentId),
            title: '📞 Class is starting now',
            body: `${courseName} — tap to join`,
            type: 'call',
            ring: true,
            data: {
              assignmentId: String(assignmentId),
              roomName: String(roomName),
              action: 'open_classroom',
            },
          });
        }
      } catch (pushErr) {
        console.warn('[livekit/teacher-token] push failed:', pushErr);
      }
    }

    /* ---------- Debug (dev only) ---------- */
    if (process.env.NODE_ENV === 'development') {
      console.log('🎫 LiveKit token generated:', {
        identity,
        roomName,
        role,
        canPublish: role === 'teacher' || role === 'owner',
        tokenPreview: token.slice(0, 20) + '...',
        apiKeyPreview: LIVEKIT_API_KEY.slice(0, 10) + '...',
      });
    }

    return NextResponse.json(
      {
        token,
        identity,
        roomName,
        url: process.env.NEXT_PUBLIC_LIVEKIT_URL || null,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ LiveKit token error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}