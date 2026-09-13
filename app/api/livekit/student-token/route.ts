// app/api/livekit/student-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AccessToken } from 'livekit-server-sdk';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Student from '@/models/Student';
import Assignment from '@/models/Assignment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

function getEnv(name: string): string {
  return String(process.env[name] || '').trim();
}

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET || '');
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!decoded?.userId || !decoded?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId).select('email').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = normalizeEmail((user as any).email);
    if (email !== normalizeEmail(decoded.email)) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 401 });
    }

    // 2. Find student
    const student = await Student.findOne({ email })
      .select('_id academyId name')
      .lean();
    if (!student?.academyId) {
      return NextResponse.json(
        { error: 'Student or academy not found' },
        { status: 404 }
      );
    }

    // 3. Get assignment
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      academyId: student.academyId,
      studentId: student._id,
      status: { $ne: 'cancelled' },
    })
      .select('livekitRoomName')
      .lean();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const roomName = String((assignment as any).livekitRoomName || '');
    if (!roomName) {
      return NextResponse.json(
        { error: 'LiveKit room not configured' },
        { status: 400 }
      );
    }

    // 4. Generate student token (dynamic)
    const apiKey = getEnv('LIVEKIT_API_KEY');
    const apiSecret = getEnv('LIVEKIT_API_SECRET');
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit credentials not configured' },
        { status: 500 }
      );
    }

    const studentIdentity = `student-${student._id}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: studentIdentity,
      name: (student as any).name || 'Student',
      ttl: '6h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      // ✅ no roomAdmin — student is not host
    });

    const studentToken = await at.toJwt();

    // 5. Browser URL
    const livekitUrl = getEnv('NEXT_PUBLIC_LIVEKIT_URL') || getEnv('LIVEKIT_URL');
    const browserUrl = livekitUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');

    return NextResponse.json({
      success: true,
      token: studentToken,
      url: browserUrl,
      roomName,
      identity: studentIdentity,
    });
  } catch (error: any) {
    console.error('Student LiveKit token error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}