
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';

interface DecodedToken extends JwtPayload {
  userId?: string;
  id?: string;
  _id?: string;
}

export async function PUT(req: NextRequest) {
  try {
    // ==================================================
    // 1. JWT Secret
    // ==================================================
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');

      return NextResponse.json(
        { error: 'Server authentication configuration error' },
        { status: 500 }
      );
    }

    // ==================================================
    // 2. Get authentication token
    // ==================================================
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ==================================================
    // 3. Verify JWT
    // ==================================================
    let decoded: DecodedToken;

    try {
      const verified = jwt.verify(token, jwtSecret);

      if (typeof verified === 'string') {
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        );
      }

      decoded = verified as DecodedToken;
    } catch (error) {
      console.error('JWT verification error:', error);

      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ==================================================
    // 4. Get User ID from token
    // ==================================================
    const studentId =
      decoded.userId ||
      decoded.id ||
      decoded._id;

    if (!studentId) {
      return NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      );
    }

    // ==================================================
    // 5. Validate User ID
    // ==================================================
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // ==================================================
    // 6. Read request body
    // ==================================================
    const body = await req.json();
    const teacherId = body?.teacherId;

    // ==================================================
    // 7. Connect database
    // ==================================================
    await connectDB();

    // ==================================================
    // 8. Find current User
    // ==================================================
    const student = await User.findById(studentId).select(
      '_id name email assignedTeacher'
    );

    if (!student) {
      return NextResponse.json(
        { error: 'Student/User not found' },
        { status: 404 }
      );
    }

    // ==================================================
    // 9. UNASSIGN TEACHER
    // ==================================================
    if (
      teacherId === null ||
      teacherId === undefined ||
      teacherId === ''
    ) {
      const oldTeacherId = student.assignedTeacher;

      // پہلے سے teacher assigned نہیں
      if (!oldTeacherId) {
        return NextResponse.json({
          success: true,
          message: 'No teacher was assigned',
          student,
        });
      }

      // User سے teacher remove کریں
      student.assignedTeacher = undefined;
      await student.save();

      // پرانے teacher کا count کم کریں
      await Teacher.findByIdAndUpdate(
        oldTeacherId,
        {
          $inc: {
            totalStudents: -1,
          },
        }
      );

      const updatedStudent = await User.findById(studentId)
        .select('_id name email assignedTeacher')
        .lean();

      return NextResponse.json({
        success: true,
        message: 'Teacher unassigned successfully',
        student: updatedStudent,
      });
    }

    // ==================================================
    // 10. Validate Teacher ID
    // ==================================================
    if (
      typeof teacherId !== 'string' ||
      !mongoose.Types.ObjectId.isValid(teacherId)
    ) {
      return NextResponse.json(
        { error: 'Invalid teacher ID' },
        { status: 400 }
      );
    }

    // ==================================================
    // 11. Check Teacher
    // ==================================================
    const teacher = await Teacher.findOne({
      _id: teacherId,
      active: true,
    });

    if (!teacher) {
      return NextResponse.json(
        {
          error: 'Teacher not found or inactive',
        },
        { status: 404 }
      );
    }

    // ==================================================
    // 12. Get old teacher
    // ==================================================
    const oldTeacherId = student.assignedTeacher;

    // ==================================================
    // 13. Same teacher already assigned
    // ==================================================
    if (
      oldTeacherId &&
      oldTeacherId.toString() === teacherId
    ) {
      const currentStudent = await User.findById(studentId)
        .select('_id name email assignedTeacher')
        .lean();

      return NextResponse.json({
        success: true,
        message: 'This teacher is already assigned',
        student: currentStudent,
      });
    }

    // ==================================================
    // 14. Assign new teacher
    // ==================================================
    student.assignedTeacher = new mongoose.Types.ObjectId(
      teacherId
    );

    await student.save();

    // ==================================================
    // 15. Decrease old teacher count
    // ==================================================
    if (oldTeacherId) {
      await Teacher.findByIdAndUpdate(
        oldTeacherId,
        {
          $inc: {
            totalStudents: -1,
          },
        }
      );
    }

    // ==================================================
    // 16. Increase new teacher count
    // ==================================================
    await Teacher.findByIdAndUpdate(
      teacherId,
      {
        $inc: {
          totalStudents: 1,
        },
      }
    );

    // ==================================================
    // 17. Get updated student
    // ==================================================
    const updatedStudent = await User.findById(studentId)
      .select('_id name email assignedTeacher')
      .lean();

    // ==================================================
    // 18. Success
    // ==================================================
    return NextResponse.json({
      success: true,
      message: oldTeacherId
        ? 'Teacher changed successfully'
        : 'Teacher assigned successfully',
      student: updatedStudent,
    });

  } catch (error) {
    console.error('Assign teacher error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Server error',
      },
      {
        status: 500,
      }
    );
  }
}

