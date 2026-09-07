// app/api/classes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/app/lib/dbConnect';
import Class from '@/models/Class';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return await User.findById(decoded.userId);
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const classData = await Class.findById(id)
      .populate('student', 'name email avatar phone')
      .populate('teacher', 'name email avatar phone')
      .populate('course', 'title description level thumbnail syllabus syllabusFiles')
      .lean();

    if (!classData) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    // چیک کریں کہ صارف اس کلاس کا طالب علم یا ٹیچر ہے یا ایڈمن ہے
    const isAuthorized =
      user.role === 'admin' ||
      user.role === 'education-admin' ||
      classData.student._id.toString() === user._id.toString() ||
      classData.teacher._id.toString() === user._id.toString();

    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // فارمیٹ کریں
    const formatted = {
      ...classData,
      _id: classData._id.toString(),
      student: classData.student ? { ...classData.student, _id: classData.student._id.toString() } : null,
      teacher: classData.teacher ? { ...classData.teacher, _id: classData.teacher._id.toString() } : null,
      course: classData.course ? { ...classData.course, _id: classData.course._id.toString() } : null,
      date: classData.date.toISOString(),
      createdAt: classData.createdAt?.toISOString(),
      updatedAt: classData.updatedAt?.toISOString(),
      studentJoinedAt: classData.studentJoinedAt?.toISOString(),
      teacherJoinedAt: classData.teacherJoinedAt?.toISOString(),
    };

    return NextResponse.json({ success: true, class: formatted });
  } catch (error) {
    console.error('GET /api/classes/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}