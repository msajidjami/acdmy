import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import CourseProgress from '@/models/CourseProgress';

export const dynamic = 'force-dynamic';

type JwtUserPayload = JwtPayload & { userId?: string; email?: string };

function normalizeEmail(v: unknown) {
  return String(v || '').trim().toLowerCase();
}

/* ---------------- POST: log pages covered ---------------- */

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET missing');

    const decoded = jwt.verify(token, jwtSecret) as JwtUserPayload;
    const email = normalizeEmail(decoded.email);

    await connectDB();

    const teacher = await Teacher.findOne({ email }).select('_id academyId').lean();
    if (!teacher?.academyId) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const body = await req.json();
    const assignmentId = String(body.assignmentId || '');
    const pagesCovered = Number(body.pagesCovered) || 0;
    const note = String(body.note || '').trim();

    if (!assignmentId || pagesCovered <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    /* Verify assignment belongs to this teacher */
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      academyId: teacher.academyId,
      teacherId: teacher._id,
      status: { $ne: 'cancelled' },
    })
      .select('_id studentId courseId')
      .lean();

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const course = await Course.findById(assignment.courseId)
      .select('_id totalPages')
      .lean();

    const totalPages = Number((course as any)?.totalPages) || 0;

    /* Upsert progress */
    const progress = await CourseProgress.findOneAndUpdate(
      {
        academyId: teacher.academyId,
        courseId: assignment.courseId,
        studentId: assignment.studentId,
      },
      {
        $setOnInsert: {
          academyId: teacher.academyId,
          courseId: assignment.courseId,
          studentId: assignment.studentId,
          totalPages,
          pagesCompleted: 0,
          sessions: [],
        },
      },
      { upsert: true, new: true }
    );

    /* Compute start/end pages */
    const startPage = progress.pagesCompleted + 1;
    const endPage = Math.min(
      progress.pagesCompleted + pagesCovered,
      totalPages > 0 ? totalPages : progress.pagesCompleted + pagesCovered
    );

    /* Push session */
    progress.sessions.push({
      date: new Date(),
      pagesCovered,
      startPage,
      endPage,
      teacherId: teacher._id,
      assignmentId: assignment._id,
      note,
    });

    /* Recompute cached pagesCompleted */
    progress.pagesCompleted = progress.sessions.reduce(
      (sum: number, s: any) => sum + (Number(s.pagesCovered) || 0),
      0
    );

    /* Keep totalPages synced if course was updated */
    if (totalPages > 0 && progress.totalPages !== totalPages) {
      progress.totalPages = totalPages;
    }

    await progress.save();

    return NextResponse.json({
      success: true,
      progress: {
        pagesCompleted: progress.pagesCompleted,
        totalPages: progress.totalPages,
        sessionsCount: progress.sessions.length,
      },
    });
  } catch (err) {
    console.error('Course progress POST error:', err);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}