// app/api/livekit/teacher-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
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
    const cookieStore = request.cookies;
    const token = cookieStore.get('token')?.value;
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
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
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

    // 2. Find teacher
    const teacher = await Teacher.findOne({ email })
      .select('_id academyId')
      .lean();
    if (!teacher?.academyId) {
      return NextResponse.json(
        { error: 'Teacher or academy not found' },
        { status: 404 }
      );
    }

    // 3. Get assignment + token
    const body = await request.json();
    const { assignmentId, roomName } = body;

    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // ✅ livekitHostToken is `select: false`, so we need .select('+livekitHostToken')
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      academyId: teacher.academyId,
      teacherId: teacher._id,
      status: { $ne: 'cancelled' },
    })
      .select('+livekitHostToken livekitRoomName livekitHostIdentity')
      .lean();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const storedRoomName = String((assignment as any).livekitRoomName || '');
    if (!storedRoomName) {
      return NextResponse.json(
        { error: 'LiveKit room not configured for this assignment' },
        { status: 400 }
      );
    }

    // Validate provided roomName matches stored (defense in depth)
    if (roomName && roomName !== storedRoomName) {
      return NextResponse.json(
        { error: 'Room name mismatch' },
        { status: 400 }
      );
    }

    const hostToken = String((assignment as any).livekitHostToken || '');
    if (!hostToken) {
      return NextResponse.json(
        { error: 'Host token not available. Please regenerate the LiveKit room.' },
        { status: 400 }
      );
    }

    // 4. LiveKit URL (wss:// for browser)
    const livekitUrl = getEnv('NEXT_PUBLIC_LIVEKIT_URL') || getEnv('LIVEKIT_URL');
    if (!livekitUrl) {
      return NextResponse.json(
        { error: 'LiveKit URL not configured' },
        { status: 500 }
      );
    }

    // Browser کو wss:// چاہیے
    const browserUrl = livekitUrl
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://');

    return NextResponse.json({
      success: true,
      token: hostToken,
      url: browserUrl,
      roomName: storedRoomName,
      identity: String((assignment as any).livekitHostIdentity || ''),
    });
  } catch (error: any) {
    console.error('Teacher LiveKit token error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}