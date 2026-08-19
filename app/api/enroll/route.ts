// app/api/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/app/models/Enrollment';
import User from '@/app/models/User';
import Course from '@/app/models/Course';
import Progress from '@/app/models/Progress';  // ✅ شامل کریں
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { fullName, email, phone, courseTitle, message } = body;

    if (!fullName || !email || !phone || !courseTitle) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled.' },
        { status: 400 }
      );
    }

    // ─── کورس تلاش کریں ──────────────────────────────
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found. Please select a valid course.' },
        { status: 404 }
      );
    }

    // ─── صارف تلاش کریں یا بنائیں ────────────────────
    let user = await User.findOne({ email });
    if (!user) {
      const tempPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: fullName,
        email,
        role: 'user',
        isVerified: false,
        password: tempPassword,
      });
    }

    // ─── انرولمنٹ بنائیں ──────────────────────────────
    const enrollment = await Enrollment.create({
      studentId: user._id,
      courseId: course._id,
      status: 'pending',
      progress: 0,
      enrolledAt: new Date(),
    });

    // ─── پروگریس ڈاکیومنٹ بنائیں (نصاب کی بنیاد پر) ──
    if (course.syllabus && course.syllabus.length > 0) {
      const unitProgress = course.syllabus.map((unit: any) => ({
        unitNumber: unit.unitNumber,
        completed: false,
      }));

      await Progress.create({
        studentId: user._id,
        courseId: course._id,
        unitProgress,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Enrollment submitted successfully!',
        enrollmentId: enrollment._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}