// app/api/enroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/app/models/Enrollment';
import User from '@/app/models/User';
import Course from '@/app/models/Course'; // ✅ Course ماڈل شامل کریں
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { fullName, email, phone, courseTitle, message } = body; // ✅ courseTitle استعمال کریں

    // ─── Validation ────────────────────────────────────────────────
    if (!fullName || !email || !phone || !courseTitle) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled.' },
        { status: 400 }
      );
    }

    // ─── Find Course by Title ──────────────────────────────────────
    const course = await Course.findOne({ title: courseTitle });
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found. Please select a valid course.' },
        { status: 404 }
      );
    }

    // ─── Find or Create User ───────────────────────────────────────
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

    // ─── Create Enrollment Record (ObjectId کے ساتھ) ──────────────
    const enrollment = await Enrollment.create({
      studentId: user._id,          // ✅ ObjectId
      courseId: course._id,         // ✅ ObjectId
      status: 'pending',
      progress: 0,
      enrolledAt: new Date(),
    });

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