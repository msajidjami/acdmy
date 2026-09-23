import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import { ClassTranscript } from '@/models/ClassTranscript';
import Assignment from '@/models/Assignment';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Course from '@/models/Course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { assignmentId, roomName } = await req.json();

    if (!assignmentId || !roomName) {
      return NextResponse.json(
        { error: 'assignmentId and roomName required' },
        { status: 400 }
      );
    }

    /* ✅ ایک assignment کی صرف ایک ٹرانسکرپٹ سیشن active ہو */
    const existing = await ClassTranscript.findOne({
      assignmentId,
      endedAt: null,
    });
    if (existing) {
      return NextResponse.json({ id: String(existing._id) });
    }

    const assignment = await Assignment.findById(assignmentId).lean<any>();
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const academy = await Academy.findById(assignment.academyId).lean<any>();
    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    const [teacher, student, course] = await Promise.all([
      Teacher.findById(assignment.teacherId).lean<any>(),
      Student.findById(assignment.studentId).lean<any>(),
      Course.findById(assignment.courseId).lean<any>(),
    ]);

    const doc = await ClassTranscript.create({
      assignmentId: assignment._id,
      academyId: assignment.academyId,
      ownerId: academy.ownerId || academy.owner || academy.userId,
      teacherId: assignment.teacherId,
      studentId: assignment.studentId,
      courseId: assignment.courseId,
      roomName,
      teacherName: teacher?.name || teacher?.fullName || '',
      teacherEmail: teacher?.email || '',
      studentName: student?.name || student?.fullName || '',
      courseName: course?.title || course?.name || '',
      startedAt: new Date(),
      messages: [],
      flags: [],
    });

    return NextResponse.json({ id: String(doc._id) });
  } catch (err: any) {
    console.error('[Transcript POST]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed' },
      { status: 500 }
    );
  }
}