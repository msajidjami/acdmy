import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Course from '@/models/Course';
import CourseProgress from '@/models/CourseProgress';
import Student from '@/models/Student';
import Assignment from '@/models/Assignment';

export const dynamic = 'force-dynamic';

type JwtUserPayload = JwtPayload & { userId?: string; email?: string };

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
    await connectDB();

    const academy = await Academy.findOne({ ownerId: decoded.userId }).select('_id').lean();
    if (!academy) return NextResponse.json({ error: 'Academy not found' }, { status: 404 });

    const { id: courseId } = await params;

    const course = await Course.findOne({
      _id: courseId,
      academyId: academy._id,
    })
      .select('_id title totalPages bookTitle')
      .lean();

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const totalPages = Number((course as any).totalPages) || 0;

    /* Find all students enrolled in this course */
    const assignments = await Assignment.find({
      academyId: academy._id,
      courseId: course._id,
      status: { $ne: 'cancelled' },
    })
      .select('studentId teacherId')
      .lean();

    const studentIds = [
      ...new Set(assignments.map((a: any) => String(a.studentId)).filter(Boolean)),
    ];

    const students = await Student.find({
      _id: { $in: studentIds },
      academyId: academy._id,
    })
      .select('_id name classLevel imageUrl')
      .lean();

    const progressList = await CourseProgress.find({
      academyId: academy._id,
      courseId: course._id,
    }).lean();

    const progressMap = new Map(
      progressList.map((p: any) => [String(p.studentId), p])
    );

    const rows = students.map((s: any) => {
      const p = progressMap.get(String(s._id));
      const pagesCompleted = Number(p?.pagesCompleted || 0);
      const pct = totalPages > 0 ? Math.round((pagesCompleted / totalPages) * 100) : 0;

      /* Weekly breakdown for mini-graph */
      const sessions = Array.isArray(p?.sessions) ? p.sessions : [];

      /* Last 8 sessions (each a bar) */
      const recentBars = sessions.slice(-8).map((sess: any) => ({
        date: sess.date,
        pages: Number(sess.pagesCovered) || 0,
      }));

      return {
        studentId: String(s._id),
        name: String(s.name || 'Student'),
        classLevel: String(s.classLevel || ''),
        imageUrl: String(s.imageUrl || ''),
        pagesCompleted,
        pagesRemaining: Math.max(0, totalPages - pagesCompleted),
        totalPages,
        percent: pct,
        sessionsCount: sessions.length,
        recentBars,
        lastSessionAt: sessions.length > 0
          ? sessions[sessions.length - 1].date
          : null,
      };
    });

    /* Sort by progress (highest first) */
    rows.sort((a, b) => b.percent - a.percent);

    return NextResponse.json({
      course: {
        _id: String(course._id),
        title: String((course as any).title || ''),
        bookTitle: String((course as any).bookTitle || ''),
        totalPages,
      },
      students: rows,
      summary: {
        totalStudents: rows.length,
        avgPercent:
          rows.length > 0
            ? Math.round(rows.reduce((sum, r) => sum + r.percent, 0) / rows.length)
            : 0,
        completed: rows.filter((r) => r.percent >= 100).length,
      },
    });
  } catch (err) {
    console.error('Course progress GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}