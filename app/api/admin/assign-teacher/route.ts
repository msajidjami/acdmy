// app/api/admin/assign-teacher/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';

const ADMIN_ROLES: string[] = [
  'admin',
  'owner',
  'super-admin',
  'education-admin',
  'darul-ifta-admin',
  'section1-admin',
  'section2-admin',
];

async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return ADMIN_ROLES.includes(decoded.role);
  } catch {
    return false;
  }
}

// ─── POST: Assign teacher to student ───────────────────────────────

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { enrollmentId, teacherId, time } = body;

    if (!enrollmentId || !teacherId) {
      return NextResponse.json(
        { message: 'Enrollment ID and Teacher ID are required' },
        { status: 400 }
      );
    }

    // Find the enrollment
    const enrollment = await Enrollment.findById(
      new mongoose.Types.ObjectId(enrollmentId)
    );
    if (!enrollment) {
      return NextResponse.json(
        { message: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Find the course
    const course = await Course.findById(enrollment.courseId);
    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Update course instructor
    course.instructor = new mongoose.Types.ObjectId(teacherId);
    await course.save();

    // Optionally store time in a separate field or schedule
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: 'Teacher assigned successfully',
    });
  } catch (error: any) {
    console.error('Assign teacher error:', error);
    return NextResponse.json(
      { message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}