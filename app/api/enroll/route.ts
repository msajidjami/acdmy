import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import Student from '@/models/Student';
import Course from '@/models/Course';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password').lean();
    return user;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('📩 Enrollment API called');

    await connectDB();
    console.log('✅ Database connected');

    const user = await getUserFromRequest(req);
    if (!user) {
      console.error('❌ Unauthorized: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`👤 User: ${user.email} (${user.role})`);

    let body;
    try {
      body = await req.json();
      console.log('📦 Request body:', body);
    } catch (parseError) {
      console.error('❌ Invalid JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { courseId } = body;
    if (!courseId) {
      console.error('❌ Missing courseId');
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.error(`❌ Invalid courseId format: ${courseId}`);
      return NextResponse.json({ error: 'Invalid course ID format' }, { status: 400 });
    }

    const student = await Student.findOne({ email: user.email }).lean();
    if (!student) {
      console.error(`❌ No student profile for email: ${user.email}`);
      return NextResponse.json(
        { error: 'Only students can enroll in courses. Please create a student profile first.' },
        { status: 403 }
      );
    }
    console.log(`👨‍🎓 Student found: ${student.name} (${student._id})`);

    const course = await Course.findById(courseId).lean();
    if (!course) {
      console.error(`❌ Course not found: ${courseId}`);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    if (course.isActive === false) {
      console.error(`❌ Course is inactive: ${courseId}`);
      return NextResponse.json({ error: 'This course is currently inactive' }, { status: 400 });
    }
    console.log(`📚 Course found: ${course.title}`);

    // ✅ چیک کریں کہ پہلے سے انرول تو نہیں
    const existing = await Enrollment.findOne({
      studentId: student._id,
      courseId: courseId,
    });

    if (existing) {
      console.log(`⚠️ Already enrolled: ${student.email} in ${courseId}`);
      // ✅ Success response with a flag instead of error
      return NextResponse.json(
        {
          message: 'You are already enrolled in this course.',
          alreadyEnrolled: true,
          enrollment: {
            id: existing._id,
            status: existing.status,
            enrolledAt: existing.enrolledAt,
          },
        },
        { status: 200 } // 200 OK (not 400)
      );
    }

    // ✅ نئی انرولمنٹ بنائیں
    const enrollment = new Enrollment({
      studentId: student._id,
      courseId: courseId,
      academyId: course.academyId,
      status: 'pending',
    });

    await enrollment.save();
    console.log(`✅ Enrollment successful: ${enrollment._id}`);

    return NextResponse.json(
      {
        message: 'Enrollment successful!',
        enrollment: {
          id: enrollment._id,
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('🔥 Enrollment API error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'You are already enrolled in this course.', alreadyEnrolled: true },
        { status: 200 } // treat as success
      );
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      console.error('Validation errors:', messages);
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}