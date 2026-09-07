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

import TeacherZoomClassroom from '@/app/components/teacher/TeacherZoomClassroom';

// ============================================================
// FORCE DYNAMIC
// ============================================================

export const dynamic = 'force-dynamic';

// ============================================================
// HELPERS
// ============================================================

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

// ============================================================
// PAGE
// ============================================================

export default async function TeacherClassroomPage({
  params,
}) {
  /*
   * Next.js App Router میں params بعض versions میں Promise
   * ہو سکتا ہے، اس لیے اسے await کرنا محفوظ ہے۔
   */

  const resolvedParams = await params;

  const assignmentId =
    resolvedParams?.assignmentId;

  // ==========================================================
  // VALIDATE ASSIGNMENT ID
  // ==========================================================

  if (
    !assignmentId ||
    !/^[a-fA-F0-9]{24}$/.test(
      assignmentId
    )
  ) {
    notFound();
  }

  // ==========================================================
  // GET AUTHENTICATION TOKEN
  // ==========================================================

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  // ==========================================================
  // JWT SECRET
  // ==========================================================

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET is not configured'
    );
  }

  // ==========================================================
  // VERIFY JWT
  // ==========================================================

  let decoded;

  try {
    decoded = jwt.verify(
      token,
      jwtSecret
    );
  } catch {
    redirect('/login');
  }

  /*
   * jwt.verify can technically return a string,
   * therefore verify the payload before using it.
   */

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !decoded.userId ||
    !decoded.email
  ) {
    redirect('/login');
  }

  // ==========================================================
  // CONNECT DATABASE
  // ==========================================================

  await connectDB();

  // ==========================================================
  // LOAD LOGGED-IN USER
  // ==========================================================

  const user =
    await User.findById(
      decoded.userId
    )
      .select(
        'name email role'
      )
      .lean();

  if (!user) {
    redirect('/login');
  }

  // ==========================================================
  // NORMALIZE EMAILS
  // ==========================================================

  const email =
    normalizeEmail(
      user.email
    );

  const tokenEmail =
    normalizeEmail(
      decoded.email
    );

  // ==========================================================
  // SECURITY CHECK
  // ==========================================================

  if (
    !email ||
    !tokenEmail ||
    email !== tokenEmail
  ) {
    redirect('/login');
  }

  // ==========================================================
  // LOAD TEACHER PROFILE
  // ==========================================================

  const teacher =
    await Teacher.findOne({
      email,
    })
      .select(
        '_id academyId name email'
      )
      .lean();

  if (!teacher?.academyId) {
    redirect(
      '/teacher/settings?error=teacher-not-found'
    );
  }

  // ==========================================================
  // LOAD ASSIGNMENT
  // ==========================================================

  /*
   * SECURITY:
   *
   * Assignment must:
   *
   * 1. belong to the same academy
   * 2. belong to the logged-in teacher
   * 3. not be cancelled
   */

  const assignment =
    await Assignment.findOne({
      _id: assignmentId,

      academyId:
        teacher.academyId,

      teacherId:
        teacher._id,

      status: {
        $ne: 'cancelled',
      },
    })
      .select(
        [
          '_id',
          'academyId',
          'teacherId',
          'studentId',
          'courseId',
          'daysOfWeek',
          'startTime',
          'endTime',
          'status',
          'notes',
          'zoomMeetingId',
          'zoomMeetingNumber',
          'zoomPassword',
          'zoomLink',
          'zoomTimezone',
          'zoomProvider',
        ].join(' ')
      )
      .lean();

  // ==========================================================
  // ASSIGNMENT NOT FOUND
  // ==========================================================

  if (!assignment) {
    notFound();
  }

  // ==========================================================
  // ZOOM NOT CONFIGURED
  // ==========================================================

  if (
    !assignment.zoomMeetingNumber
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Zoom Classroom Not Ready
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            This class does not have a Zoom meeting
            configured yet. Please ask the academy owner
            to configure the permanent Zoom meeting for
            this assignment.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">

            <Link
              href="/teacher/classes"
              className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              ← Back to My Classes
            </Link>

            <Link
              href="/teacher/schedule"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              My Schedule
            </Link>

          </div>

        </div>
      </main>
    );
  }

  // ==========================================================
  // LOAD STUDENT + COURSE
  // ==========================================================

  const [
    student,
    course,
  ] = await Promise.all([
    Student.findOne({
      _id:
        assignment.studentId,

      academyId:
        teacher.academyId,
    })
      .select(
        'name fatherName'
      )
      .lean(),

    Course.findOne({
      _id:
        assignment.courseId,

      academyId:
        teacher.academyId,
    })
      .select(
        'name title'
      )
      .lean(),
  ]);

  // ==========================================================
  // PREPARE CLIENT DATA
  // ==========================================================

  /*
   * Convert MongoDB/ObjectId values into plain strings
   * before passing them to the Client Component.
   */

  const classroomData = {
    assignmentId:
      String(
        assignment._id
      ),

    meetingNumber:
      String(
        assignment.zoomMeetingNumber ||
          ''
      ),

    password:
      String(
        assignment.zoomPassword ||
          ''
      ),

    studentName:
      String(
        student?.name ||
          'Student'
      ),

    fatherName:
      String(
        student?.fatherName ||
          ''
      ),

    courseName:
      String(
        course?.name ||
          course?.title ||
          'Online Class'
      ),

    daysOfWeek:
      Array.isArray(
        assignment.daysOfWeek
      )
        ? assignment.daysOfWeek.map(
            (day) =>
              String(day)
          )
        : [],

    startTime:
      String(
        assignment.startTime ||
          ''
      ),

    endTime:
      String(
        assignment.endTime ||
          ''
      ),

    timezone:
      String(
        assignment.zoomTimezone ||
          'Asia/Karachi'
      ),

    status:
      String(
        assignment.status ||
          'scheduled'
      ),

    teacherName:
      String(
        teacher.name ||
          user.name ||
          'Teacher'
      ),

    teacherEmail:
      email,

    zoomProvider:
      String(
        assignment.zoomProvider ||
          ''
      ),
  };

  // ==========================================================
  // RENDER CLASSROOM
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 md:px-6 md:py-6">

      <div className="mx-auto max-w-[1500px]">

        {/* ==================================================
            TOP HEADER
        ================================================== */}

        <div className="mb-4 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <Link
                href="/teacher/classes"
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                ← My Classes
              </Link>

              <span className="text-slate-300">
                /
              </span>

              <span className="text-sm text-slate-500">
                Classroom
              </span>

            </div>

            <h1 className="mt-2 truncate text-xl font-bold text-slate-900 md:text-2xl">
              {
                classroomData.courseName
              }
            </h1>

            <p className="mt-1 text-sm text-slate-500">

              {
                classroomData.studentName
              }

              {classroomData.fatherName
                ? ` · ${classroomData.fatherName}`
                : ''}

              {' · '}

              {
                classroomData.startTime ||
                '--:--'
              }

              {' – '}

              {
                classroomData.endTime ||
                '--:--'
              }

            </p>

          </div>

          <div className="flex flex-wrap gap-2 text-xs">

            <span className="rounded-full bg-slate-100 px-3 py-2 font-semibold text-slate-600">
              Meeting{' '}
              {
                classroomData.meetingNumber
              }
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-2 font-semibold text-slate-600">
              {
                classroomData.timezone
              }
            </span>

          </div>

        </div>

        {/* ==================================================
            ZOOM CLASSROOM
        ================================================== */}

        <TeacherZoomClassroom
          assignmentId={
            classroomData.assignmentId
          }

          meetingNumber={
            classroomData.meetingNumber
          }

          password={
            classroomData.password
          }

          teacherName={
            classroomData.teacherName
          }

          teacherEmail={
            classroomData.teacherEmail
          }

          courseName={
            classroomData.courseName
          }

          studentName={
            classroomData.studentName
          }
        />

      </div>

    </main>
  );
}