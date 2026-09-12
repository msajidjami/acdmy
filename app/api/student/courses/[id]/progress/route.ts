import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Course from '@/models/Course';
import CourseProgress from '@/models/CourseProgress';

export const dynamic = 'force-dynamic';

type JwtUserPayload = JwtPayload & { userId?: string; email?: string };

function normalizeEmail(v: unknown) {
  return String(v || '').trim().toLowerCase();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET missing');

    const decoded = jwt.verify(token, jwtSecret) as JwtUserPayload;
    const email = normalizeEmail(decoded.email);

    await connectDB();

    const student = await Student.findOne({ email }).select('_id academyId').lean();
    if (!student?.academyId) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { id: courseId } = await params;

    const course = await Course.findOne({
      _id: courseId,
      academyId: student.academyId,
    })
      .select('_id title totalPages bookTitle image')
      .lean();

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const progress = await CourseProgress.findOne({
      academyId: student.academyId,
      courseId: course._id,
      studentId: student._id,
    }).lean();

    const totalPages = Number((course as any).totalPages) || 0;
    const pagesCompleted = Number(progress?.pagesCompleted || 0);
    const percent = totalPages > 0 ? Math.round((pagesCompleted / totalPages) * 100) : 0;

    const sessions = Array.isArray((progress as any)?.sessions)
      ? (progress as any).sessions
      : [];

    /* Build 12-bar history (last 12 sessions) */
    const bars = sessions.slice(-12).map((s: any) => ({
      date: s.date,
      pages: Number(s.pagesCovered) || 0,
      startPage: Number(s.startPage) || 0,
      endPage: Number(s.endPage) || 0,
    }));

    return NextResponse.json({
      course: {
        _id: String(course._id),
        title: String((course as any).title || ''),
        bookTitle: String((course as any).bookTitle || ''),
        image: String((course as any).image || ''),
        totalPages,
      },
      progress: {
        pagesCompleted,
        pagesRemaining: Math.max(0, totalPages - pagesCompleted),
        percent,
        sessionsCount: sessions.length,
        bars,
      },
    });
  } catch (err) {
    console.error('Student progress GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}