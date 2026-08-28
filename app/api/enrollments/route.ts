// app/api/enrollments/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/app/models/Enrollment';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const studentId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID not found in token' }, { status: 400 });
    }

    await connectDB();

    const enrollments = await Enrollment.find({ studentId })
      .populate({
        path: 'courseId',
        select: '_id title description level thumbnail',
      })
      .lean();

    const formatted = enrollments.map((e: any) => ({
      course: {
        _id: e.courseId._id,
        title: e.courseId.title,
        description: e.courseId.description,
        level: e.courseId.level,
        thumbnail: e.courseId.thumbnail,
      },
      enrolledAt: e.enrolledAt,
      progress: e.progress,
      completed: e.status === 'completed',
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GET /api/enrollments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}