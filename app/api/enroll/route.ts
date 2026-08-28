import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/app/models/Enrollment';
import Course from '@/app/models/Course';
import User from '@/app/models/User';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const studentId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID not found' }, { status: 400 });
    }

    const body = await req.json();
    const { courseId, teacherId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    await connectDB();

    // Check if course exists and is active
    const course = await Course.findOne({ _id: courseId, isActive: true });
    if (!course) {
      return NextResponse.json({ error: 'Course not found or inactive' }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ studentId, courseId });
    if (existing) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // اگر teacherId دیا گیا ہے تو اسے student کے assignedTeacher میں سیٹ کریں
    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher || (teacher as any).role !== 'teacher') { // ✅ as any کا استعمال
        return NextResponse.json({ error: 'Invalid teacher' }, { status: 400 });
      }
      // صارف کو اپ ڈیٹ کریں
      await User.findByIdAndUpdate(studentId, { assignedTeacher: teacherId });
    }

    // Enrollment تخلیق کریں
    const enrollment = new Enrollment({
      studentId,
      courseId,
      status: 'active',
      progress: 0,
      enrolledAt: new Date(),
    });
    await enrollment.save();

    // Course میں studentsEnrolled بڑھائیں
    course.studentsEnrolled = (course.studentsEnrolled || 0) + 1;
    await course.save();

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Enroll error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}