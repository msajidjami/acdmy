import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';
import Course from '@/models/Course';

import TeacherLiveKitClassroomLoader from '@/app/components/teacher/TeacherLiveKitClassroomLoader';

import { ArrowLeft, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeEmail(v: unknown): string {
  return String(v || '').trim().toLowerCase();
}

export default async function TeacherClassroomPage({
  params,
}: {
  params: Promise<{ assignmentId: string }> | { assignmentId: string };
}) {
  const resolved = await params;
  const assignmentId = (resolved as any)?.assignmentId;

  if (!assignmentId || !/^[a-fA-F0-9]{24}$/.test(assignmentId)) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

  let decoded: any;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch {
    redirect('/login');
  }
  if (typeof decoded !== 'object' || !decoded?.userId || !decoded?.email) redirect('/login');

  await connectDB();

  const user: any = await User.findById(decoded.userId).select('name email').lean();
  if (!user) redirect('/login');

  const email = normalizeEmail(user.email);
  const tokenEmail = normalizeEmail(decoded.email);
  if (!email || !tokenEmail || email !== tokenEmail) redirect('/login');

  const teacher: any = await Teacher.findOne({ email })
    .select('_id academyId name email').lean();

  if (!teacher?.academyId) redirect('/teacher/settings?error=teacher-not-found');

  const assignment: any = await Assignment.findOne({
    _id: assignmentId,
    academyId: teacher.academyId,
    teacherId: teacher._id,
    status: { $ne: 'cancelled' },
  })
    .select('_id academyId teacherId studentId courseId daysOfWeek startTime endTime status notes livekitRoomName livekitHostIdentity livekitProvider')
    .lean();

  if (!assignment) notFound();

  if (!assignment.livekitRoomName) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-slate-900">Classroom not ready</h1>
        <p className="mt-2 text-sm text-slate-500">
          This class does not have a room configured yet. Please contact your academy owner.
        </p>
        <Link
          href="/teacher/classes"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to classes
        </Link>
      </div>
    );
  }

  const [student, course] = await Promise.all([
    Student.findOne({ _id: assignment.studentId, academyId: teacher.academyId })
      .select('name fatherName').lean(),
    Course.findOne({ _id: assignment.courseId, academyId: teacher.academyId })
      .select('name title totalPages').lean(),
  ]);

  const courseName = String(
    (course as any)?.name || (course as any)?.title || 'Online Class'
  );

  return (
    <div className="space-y-3">
      <Link
        href="/teacher/classes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to classes
      </Link>

      <TeacherLiveKitClassroomLoader
        assignmentId={String(assignment._id)}
        roomName={String(assignment.livekitRoomName || '')}
        hostIdentity={String(assignment.livekitHostIdentity || '')}
        teacherName={String(teacher.name || user.name || 'Teacher')}
        teacherEmail={email}
        courseName={courseName}
        studentName={String((student as any)?.name || 'Student')}
        courseId={String((course as any)?._id || assignment.courseId || '')}
        totalPages={Number((course as any)?.totalPages || 0)}
        pagesCompletedSoFar={0}
        autoConnect
      />
    </div>
  );
}