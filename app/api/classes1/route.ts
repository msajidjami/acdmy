// app/api/classes/route.ts (مکمل)
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

// ====================== GET ======================
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let classes = [];

    if (user.role === 'admin' || user.role === 'education-admin') {
      classes = await Class.find()
        .populate('student', 'name email avatar')
        .populate('teacher', 'name email avatar')
        .populate('course', 'title description level thumbnail syllabus syllabusFiles')
        .sort({ date: 1 })
        .lean();
    } else {
      classes = await Class.find({
        $or: [{ student: user._id }, { teacher: user._id }],
      })
        .populate('student', 'name email avatar')
        .populate('teacher', 'name email avatar')
        .populate('course', 'title description level thumbnail syllabus syllabusFiles')
        .sort({ date: 1 })
        .lean();
    }

    const formatted = classes.map((cls) => ({
      ...cls,
      _id: cls._id.toString(),
      student: cls.student ? { ...cls.student, _id: cls.student._id.toString() } : null,
      teacher: cls.teacher ? { ...cls.teacher, _id: cls.teacher._id.toString() } : null,
      course: cls.course ? { ...cls.course, _id: cls.course._id.toString() } : null,
      date: cls.date.toISOString(),
      createdAt: cls.createdAt?.toISOString(),
      updatedAt: cls.updatedAt?.toISOString(),
      studentJoinedAt: cls.studentJoinedAt?.toISOString(),
      teacherJoinedAt: cls.teacherJoinedAt?.toISOString(),
    }));

    return NextResponse.json({ success: true, classes: formatted });
  } catch (error) {
    console.error('GET /api/classes error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// ====================== POST ======================
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // صرف ٹیچر یا ایڈمن کو اجازت
    if (user.role !== 'admin' && user.role !== 'education-admin' && user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Permission denied. Only teachers and admins can create classes.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { student, teacher, course, title, date, duration, meetingLink } = body;

    // بنیادی فیلڈز کی تصدیق
    if (!student || !teacher || !course || !title || !date) {
      return NextResponse.json(
        { success: false, message: 'Required fields: student, teacher, course, title, date' },
        { status: 400 }
      );
    }

    const newClass = await Class.create({
      student,
      teacher,
      course,
      title,
      date: new Date(date),
      duration: duration || 30,
      meetingLink: meetingLink || '',
      status: 'scheduled',
    });

    return NextResponse.json({
      success: true,
      message: 'Class created successfully',
      class: {
        ...newClass.toObject(),
        _id: newClass._id.toString(),
        date: newClass.date.toISOString(),
        createdAt: newClass.createdAt?.toISOString(),
        updatedAt: newClass.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /api/classes error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
//ab jfksdjfklsd