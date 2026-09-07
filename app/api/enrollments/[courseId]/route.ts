// app/api/enrollments/[courseId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { courseId } = await params;
    const { progress, completed } = await req.json();

    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ✅ Use (user as any) to access enrollments
    const enrollment = (user as any).enrollments.find(
      (e: any) => e.course.toString() === courseId
    );
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 404 });
    }

    if (progress !== undefined) enrollment.progress = progress;
    if (completed !== undefined) enrollment.completed = completed;

    await user.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update enrollment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}