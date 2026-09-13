import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Subscription from '@/models/Subscription';
import Student from '@/models/Student';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface JwtPayload {
  userId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let decoded: JwtPayload;
    try {
      const result = jwt.verify(token, jwtSecret);
      if (typeof result === 'string') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      decoded = result as JwtPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const academy = await Academy.findOne({ ownerId: user._id }).lean();
    if (!academy) {
      return NextResponse.json(
        { subscription: null, academy: null, message: 'No academy found' },
        { status: 200 }
      );
    }

    /* ------------------------------------------------------------
       ✅ ACTUAL student count from database
       ------------------------------------------------------------ */
    const actualStudentCount = await Student.countDocuments({
      academyId: academy._id,
    });

    /* ------------------------------------------------------------
       Auto-sync academy cached count
       ------------------------------------------------------------ */
    if (academy.currentStudentCount !== actualStudentCount) {
      await Academy.findByIdAndUpdate(academy._id, {
        $set: { currentStudentCount: actualStudentCount },
      });
    }

    const subscription = await Subscription.findOne({
      academyId: academy._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const isExpired =
      subscription && subscription.endDate && subscription.endDate < now;

    return NextResponse.json({
      subscription: subscription || null,
      academy: {
        _id: String(academy._id),
        name: academy.name,
        isPublic: academy.isPublic,
        studentLimit: academy.studentLimit,
        // ✅ Actual count واپس کریں
        currentStudentCount: actualStudentCount,
        planId: academy.planId,
      },
      isExpired: Boolean(isExpired),
    });
  } catch (error: unknown) {
    console.error('Subscription status error:', error);
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}