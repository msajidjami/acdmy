// app/api/teacher/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Progress from '@/models/Progress';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { studentId, courseId, unitNumber, completed } = body;

    if (!studentId || !courseId || unitNumber === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const progress = await Progress.findOne({ studentId, courseId });
    if (!progress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 });
    }

    // Find unit index
    const unitIndex = progress.unitProgress.findIndex(
      (u: { unitNumber: number; completed: boolean }) => u.unitNumber === unitNumber
    );
    if (unitIndex === -1) {
      return NextResponse.json({ error: 'Unit not found in syllabus' }, { status: 404 });
    }

    // Update unit
    progress.unitProgress[unitIndex].completed = completed;
    if (completed) {
      progress.unitProgress[unitIndex].completedAt = new Date();
    } else {
      progress.unitProgress[unitIndex].completedAt = undefined;
    }

    await progress.save();

    // Calculate new percentage
    const total = progress.unitProgress.length;
    const done = progress.unitProgress.filter(
      (u: { completed: boolean }) => u.completed
    ).length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      progress: percentage,
      unit: progress.unitProgress[unitIndex],
    });
  } catch (error: any) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}