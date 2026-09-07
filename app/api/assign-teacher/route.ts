import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const studentId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID not found' }, { status: 400 });
    }

    const { teacherId } = await req.json();
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 });
    }

    await connectDB();

    // Check if teacher exists and is active
    const teacher = await Teacher.findOne({ _id: teacherId, active: true });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found or inactive' }, { status: 404 });
    }

    // Update user's assignedTeacher
    const user = await User.findByIdAndUpdate(
      studentId,
      { assignedTeacher: teacherId },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assign teacher error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}