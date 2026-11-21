
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import CallSession from '@/models/CallSession';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TokenPayload {
  userId?: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 1. Authenticate user
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is missing');

      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(token, secret) as TokenPayload;
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user session' },
        { status: 401 }
      );
    }

    const receiverId = new mongoose.Types.ObjectId(userId);
    const now = new Date();

    // 2. Expire old ringing calls
    await CallSession.updateMany(
      {
        receiverId,
        status: 'ringing',
        expiresAt: { $lte: now },
      },
      {
        $set: {
          status: 'missed',
          endedAt: now,
        },
      }
    );

    // 3. Find the latest active incoming call
    const incomingCall = await CallSession.findOne({
      receiverId,
      status: 'ringing',
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!incomingCall) {
      return NextResponse.json(
        {
          success: true,
          call: null,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // 4. Get caller information
    const caller = await User.findById(incomingCall.callerId)
      .select('name avatar profileImage image')
      .lean();

    if (!caller) {
      return NextResponse.json(
        {
          success: true,
          call: null,
        },
        { status: 200 }
      );
    }

    const callerData = caller as {
      _id: mongoose.Types.ObjectId;
      name?: string;
      avatar?: string;
      profileImage?: string;
      image?: string;
    };

    // 5. Return incoming call information
    return NextResponse.json(
      {
        success: true,
        call: {
          callId: incomingCall._id.toString(),
          callerId: incomingCall.callerId.toString(),
          callerName: callerData.name || 'Unknown Caller',
          callerAvatar:
            callerData.avatar ||
            callerData.profileImage ||
            callerData.image ||
            null,
          kind: incomingCall.kind,
          status: incomingCall.status,
          expiresAt: incomingCall.expiresAt,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Incoming call API error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check incoming calls',
      },
      { status: 500 }
    );
  }
}
