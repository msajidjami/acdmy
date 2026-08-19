// app/api/student/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Progress from '@/app/models/Progress';
import Course from '@/app/models/Course';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    // Find the first active enrollment for this student (or you could specify course)
    const progress = await Progress.findOne({
      studentId: session.userId,
    }).populate('courseId').lean();

    if (!progress) {
      return NextResponse.json({ progress: null, course: null });
    }

    // progress.courseId might be null if populate fails; check
    const course = progress.courseId as any;
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const totalUnits = progress.unitProgress.length;
    const completedUnits = progress.unitProgress.filter(
      (u: { unitNumber: number; completed: boolean; completedAt?: Date }) => u.completed
    ).length;
    const percentage = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

    return NextResponse.json({
      success: true,
      course: {
        id: course._id.toString(),
        title: course.title,
        syllabus: course.syllabus || [],
      },
      units: progress.unitProgress.map(
        (u: { unitNumber: number; completed: boolean; completedAt?: Date }) => ({
          unitNumber: u.unitNumber,
          completed: u.completed,
          completedAt: u.completedAt,
        })
      ),
      progress: percentage,
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}