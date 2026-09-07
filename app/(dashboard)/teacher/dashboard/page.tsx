import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';

import {
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

type TeacherData = {
  teacher: any;
  academy: any;
  studentCount: number;
  totalAssignments: number;
  upcomingClasses: number;
  assignments: any[];
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeEmail(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* Get Teacher Data                                                           */
/* -------------------------------------------------------------------------- */

async function getTeacherData(
  email: string
): Promise<TeacherData | null> {
  await connectDB();

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const teacher = await Teacher.findOne({
    email: normalizedEmail,
  }).lean();

  if (!teacher) {
    return null;
  }

  const academy = teacher.academyId
    ? await Academy.findById(teacher.academyId).lean()
    : null;

  const assignments = await Assignment.find({
    academyId: teacher.academyId,
    teacherId: teacher._id,
    status: {
      $ne: 'cancelled',
    },
  })
    .sort({
      startTime: 1,
      createdAt: 1,
    })
    .lean();

  const studentIds = assignments
    .map((assignment: any) => assignment.studentId)
    .filter(Boolean);

  const students =
    studentIds.length > 0
      ? await Student.find({
          _id: {
            $in: studentIds,
          },
          academyId: teacher.academyId,
        }).lean()
      : [];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const todayClasses = assignments.filter(
    (assignment: any) =>
      Array.isArray(assignment.daysOfWeek) &&
      assignment.daysOfWeek.includes(today)
  );

  return {
    teacher,
    academy,
    studentCount: students.length,
    totalAssignments: assignments.length,
    upcomingClasses: todayClasses.length,
    assignments: assignments.slice(0, 5),
  };
}

/* -------------------------------------------------------------------------- */
/* Teacher Dashboard                                                          */
/* -------------------------------------------------------------------------- */

export default async function TeacherDashboardPage() {
  const cookieStore = await cookies();

  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  let decoded: JwtUserPayload;

  try {
    const result = jwt.verify(
      token,
      jwtSecret
    );

    if (typeof result === 'string') {
      redirect('/login');
    }

    decoded = result as JwtUserPayload;
  } catch {
    redirect('/login');
  }

  const userEmail = normalizeEmail(decoded.email);

  if (!userEmail) {
    redirect('/login');
  }

  const data = await getTeacherData(userEmail);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-white p-12 text-center shadow-sm">

          <div className="mb-4 text-6xl">
            👨‍🏫
          </div>

          <h3 className="text-2xl font-bold text-black">
            No Teacher Profile Found
          </h3>

          <p className="mt-2 text-black/60">
            You are not registered as a teacher in any academy yet.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Home
          </Link>

        </div>
      </div>
    );
  }

  const {
    teacher,
    academy,
    studentCount,
    totalAssignments,
    upcomingClasses,
  } = data;

  return (
    <div className="mx-auto max-w-7xl">

      {/* ------------------------------------------------------------------ */}
      {/* Hero Section                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-xl">

        <div className="absolute inset-0 opacity-10">

          <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-white blur-3xl" />

          <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-white blur-3xl" />

        </div>

        <div className="relative z-10 flex flex-col items-center justify-between md:flex-row">

          <div>

            <h1 className="text-3xl font-bold md:text-4xl">
              Welcome back,{' '}
              {teacher.name || 'Teacher'}! 👋
            </h1>

            <p className="mt-2 text-lg text-indigo-100">
              {academy?.name
                ? `Teaching at ${academy.name}`
                : 'Manage your classes and students'}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">

              <span className="flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
                <UserGroupIcon className="h-4 w-4" />
                {studentCount} Students
              </span>

              <span className="flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
                <BookOpenIcon className="h-4 w-4" />
                {totalAssignments} Classes
              </span>

              <span className="flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
                <CalendarIcon className="h-4 w-4" />
                {upcomingClasses} Upcoming Today
              </span>

            </div>

          </div>

          <div className="mt-4 md:mt-0">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl shadow-lg backdrop-blur-sm">
              {teacher.name?.charAt(0) || 'T'}
            </div>

          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats Cards                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total Students */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>

            <div>

              <p className="text-sm text-gray-500">
                Total Students
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {studentCount}
              </p>

            </div>

          </div>

        </div>

        {/* Total Classes */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-green-100 p-3">
              <BookOpenIcon className="h-6 w-6 text-green-600" />
            </div>

            <div>

              <p className="text-sm text-gray-500">
                Total Classes
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {totalAssignments}
              </p>

            </div>

          </div>

        </div>

        {/* Today's Classes */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-yellow-100 p-3">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>

            <div>

              <p className="text-sm text-gray-500">
                Today's Classes
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {upcomingClasses}
              </p>

            </div>

          </div>

        </div>

        {/* Teacher Status */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-purple-100 p-3">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>

            <div>

              <p className="text-sm text-gray-500">
                Status
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {teacher.isAvailable
                  ? '✅ Active'
                  : '⛔ Inactive'}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Quick Actions                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* Schedule */}
        <Link
          href="/teacher/schedule"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition hover:shadow-lg"
        >

          <div className="rounded-xl bg-indigo-100 p-3 transition group-hover:bg-indigo-200">
            <CalendarIcon className="h-6 w-6 text-indigo-600" />
          </div>

          <div>

            <h3 className="font-semibold text-gray-900">
              View Schedule
            </h3>

            <p className="text-sm text-gray-500">
              Check your upcoming classes
            </p>

          </div>

        </Link>

        {/* Classes */}
        <Link
          href="/teacher/classes"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition hover:shadow-lg"
        >

          <div className="rounded-xl bg-green-100 p-3 transition group-hover:bg-green-200">
            <BookOpenIcon className="h-6 w-6 text-green-600" />
          </div>

          <div>

            <h3 className="font-semibold text-gray-900">
              My Classes
            </h3>

            <p className="text-sm text-gray-500">
              Open your assigned classes
            </p>

          </div>

        </Link>

        {/* Profile */}
        <Link
          href="/teacher/profile"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition hover:shadow-lg"
        >

          <div className="rounded-xl bg-purple-100 p-3 transition group-hover:bg-purple-200">
            <UserIcon className="h-6 w-6 text-purple-600" />
          </div>

          <div>

            <h3 className="font-semibold text-gray-900">
              Update Profile
            </h3>

            <p className="text-sm text-gray-500">
              Edit your bio and subjects
            </p>

          </div>

        </Link>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Profile Summary                                                    */}
      {/* ------------------------------------------------------------------ */}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 bg-gray-50 p-5">

          <h2 className="font-semibold text-gray-900">
            📋 Your Profile
          </h2>

        </div>

        <div className="space-y-3 p-5">

          {/* Name */}
          <div className="flex justify-between gap-4">

            <span className="text-gray-500">
              Name
            </span>

            <span className="font-medium text-gray-900">
              {teacher.name || 'Not provided'}
            </span>

          </div>

          {/* Email */}
          <div className="flex justify-between gap-4">

            <span className="text-gray-500">
              Email
            </span>

            <span className="break-all font-medium text-gray-900">
              {teacher.email || 'Not provided'}
            </span>

          </div>

          {/* Subjects */}
          <div className="flex justify-between gap-4">

            <span className="text-gray-500">
              Subjects
            </span>

            <span className="text-right font-medium text-gray-900">
              {Array.isArray(teacher.subjects) &&
              teacher.subjects.length > 0
                ? teacher.subjects.join(', ')
                : 'None'}
            </span>

          </div>

          {/* Bio */}
          <div className="flex justify-between gap-4">

            <span className="text-gray-500">
              Bio
            </span>

            <span className="max-w-xl text-right font-medium text-gray-900">
              {teacher.bio || 'No bio'}
            </span>

          </div>

          {/* Audio Introduction */}
          {teacher.audioUrl && (
            <div className="flex items-center justify-between gap-4">

              <span className="text-gray-500">
                Audio Introduction
              </span>

              <audio
                controls
                className="h-8 w-48"
              >
                <source
                  src={teacher.audioUrl}
                  type="audio/mpeg"
                />

                Your browser does not support audio playback.

              </audio>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}