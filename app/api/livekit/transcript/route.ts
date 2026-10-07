import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';
import Course from '@/models/Course';
import Academy from '@/models/Academy';
import { ClassTranscript } from '@/models/ClassTranscript';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    let decoded: any;
    try { decoded = jwt.verify(token, secret); }
    catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    if (!decoded?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { assignmentId, roomName } = body || {};
    if (!assignmentId || !roomName) {
      return NextResponse.json({ error: 'assignmentId and roomName required' }, { status: 400 });
    }

    await connectDB();

    const user: any = await User.findById(decoded.userId).select('name email').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const teacher: any = await Teacher.findOne({ email: String(user.email).toLowerCase() })
      .select('_id name email academyId').lean();
    if (!teacher?.academyId) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const assignment: any = await Assignment.findOne({
      _id: assignmentId,
      academyId: teacher.academyId,
      teacherId: teacher._id,
    })
      .select('_id academyId teacherId studentId courseId')
      .lean();

    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    const academy: any = await Academy.findById(teacher.academyId)
      .select('ownerId name').lean();

    const [student, course] = await Promise.all([
      Student.findById(assignment.studentId).select('name').lean(),
      Course.findById(assignment.courseId).select('name title').lean(),
    ]);

    // ایک ہی assignment کے لیے ایک ہی session — اگر پہلے سے کھلا ہوا ہو تو وہی دیں
    const existing = await ClassTranscript.findOne({
      assignmentId: assignment._id,
      teacherId: teacher._id,
      endedAt: null,
    }).sort({ createdAt: -1 }).lean();

    if (existing) {
      return NextResponse.json({ id: String((existing as any)._id) });
    }

    const doc = await ClassTranscript.create({
      assignmentId: assignment._id,
      academyId: assignment.academyId,
      ownerId: academy?.ownerId || null,
      teacherId: teacher._id,
      studentId: assignment.studentId,
      courseId: assignment.courseId,
      roomName: String(roomName),
      teacherName: String(teacher.name || user.name || ''),
      teacherEmail: String(teacher.email || user.email || ''),
      studentName: String((student as any)?.name || ''),
      courseName: String((course as any)?.name || (course as any)?.title || ''),
      startedAt: new Date(),
      endedAt: null,
      durationSec: 0,
      messages: [],
      flags: [],
    });

    return NextResponse.json({ id: String(doc._id) });
  } catch (err: any) {
    console.error('[POST /api/livekit/transcript]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}