// app/api/admin/enrollments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/app/models/Enrollment';
import Course from '@/app/models/Course';

const ADMIN_ROLES = [
  'admin',
  'owner',
  'super-admin',
  'education-admin',
  'darul-ifta-admin',
  'section1-admin',
  'section2-admin',
];

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return ADMIN_ROLES.includes(decoded.role);
  } catch {
    return false;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { status, progress, teacherId } = body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid enrollment ID' }, { status: 400 });
    }
    if (teacherId && !mongoose.Types.ObjectId.isValid(teacherId)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }

    // Fetch enrollment using lean to avoid casting on query
    const enrollment = await Enrollment.findOne({ _id: id }).lean();
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (progress !== undefined && progress !== null) {
      updateData.progress = Math.min(100, Math.max(0, progress));
    }

    // Update course instructor only if enrollment.courseId is a valid ObjectId
    let courseUpdated = false;
    const courseIdString = enrollment.courseId?.toString();
    if (teacherId && courseIdString && mongoose.Types.ObjectId.isValid(courseIdString)) {
      const course = await Course.findById(courseIdString);
      if (course) {
        course.instructor = teacherId;
        await course.save();
        courseUpdated = true;
      }
    } else if (teacherId) {
      // Log warning but continue – courseId is invalid
      console.warn('Cannot assign teacher: courseId is not a valid ObjectId');
    }

    // Update enrollment (status/progress)
    if (Object.keys(updateData).length > 0) {
      await Enrollment.updateOne({ _id: id }, { $set: updateData });
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment updated successfully',
      enrollment: {
        id: enrollment._id.toString(),
        status: updateData.status || enrollment.status,
        progress: updateData.progress !== undefined ? updateData.progress : enrollment.progress,
        teacherUpdated: courseUpdated,
      },
    });
  } catch (error: any) {
    console.error('Update enrollment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}