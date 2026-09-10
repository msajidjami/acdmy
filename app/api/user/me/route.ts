import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import '@/models/Teacher';

interface DecodedToken {
  userId?: string;
  id?: string;
  _id?: string;
}

export async function GET() {
  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'JWT_SECRET is not configured' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let decoded: DecodedToken;

    try {
      const verified = jwt.verify(token, jwtSecret);

      if (typeof verified === 'string') {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      decoded = verified as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId)
      .select('_id name email assignedTeacher')
      .populate({
        path: 'assignedTeacher',
        select: '_id fullName email avatar active',
      })
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ✅ schema چھیڑے بغیر — any میں cast کریں
    const u = user as any;

    const assignedTeacher = u.assignedTeacher;

    return NextResponse.json({
      id: u._id.toString(),
      name: u.name,
      email: u.email,

      assignedTeacher: assignedTeacher
        ? assignedTeacher._id.toString()
        : null,

      assignedTeacherData: assignedTeacher
        ? {
            _id: assignedTeacher._id.toString(),
            fullName: assignedTeacher.fullName,
            email: assignedTeacher.email,
            avatar: assignedTeacher.avatar || null,
            active: assignedTeacher.active,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Server error',
      },
      { status: 500 }
    );
  }
}