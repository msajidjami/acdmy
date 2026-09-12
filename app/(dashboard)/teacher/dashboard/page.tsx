// app/teacher/dashboard/page.tsx
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
  SparklesIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  XCircleIcon,
  EnvelopeIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  HomeIcon,
  ChartBarIcon,
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

async function getTeacherData(email: string): Promise<TeacherData | null> {
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
    const result = jwt.verify(token, jwtSecret);

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

  /* ------------------ No Profile State ------------------ */

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 sm:p-16 text-center shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none" />

          <div className="relative">
            <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <AcademicCapIcon className="h-10 w-10 text-white" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              No Teacher Profile Found
            </h3>

            <p className="mt-3 text-slate-500 max-w-md mx-auto">
              You are not registered as a teacher in any academy yet. Please
              contact your academy administrator to get started.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <HomeIcon className="h-5 w-5" />
              Go to Home
            </Link>
          </div>
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

  const teacherName = teacher.name || 'Teacher';
  const initials = teacherName
    .split(' ')
    .map((n: string) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = teacher.isAvailable;

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 px-4 py-6 sm:py-8">
      {/* ============================================================ */}
      {/* HERO SECTION                                                  */}
      {/* ============================================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8 lg:p-10 text-white shadow-2xl shadow-purple-500/20">
        {/* Decorative blur circles */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-fuchsia-300/50 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Text */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-xs font-semibold">
              <SparklesIcon className="h-3.5 w-3.5" />
              Teacher Dashboard
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              Welcome back, {teacherName}! 👋
            </h1>

            <p className="mt-2 text-base sm:text-lg text-indigo-100 max-w-2xl">
              {academy?.name
                ? `Teaching at ${academy.name}`
                : 'Manage your classes and students'}
            </p>

            {/* Stat pills */}
            <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 text-xs sm:text-sm font-medium">
                <UserGroupIcon className="h-4 w-4" />
                {studentCount} Students
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 text-xs sm:text-sm font-medium">
                <BookOpenIcon className="h-4 w-4" />
                {totalAssignments} Classes
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 text-xs sm:text-sm font-medium">
                <CalendarIcon className="h-4 w-4" />
                {upcomingClasses} Today
              </span>
            </div>
          </div>

          {/* Right: Avatar */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-xl">
                {initials}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-indigo-600 ${
                  isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}
                title={isActive ? 'Active' : 'Inactive'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* STATS CARDS                                                   */}
      {/* ============================================================ */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <StatCard
          title="Total Students"
          value={studentCount}
          icon={<UserGroupIcon className="h-6 w-6" />}
          gradient="from-blue-500 to-indigo-600"
          bg="bg-blue-50"
          text="text-blue-600"
        />

        {/* Total Classes */}
        <StatCard
          title="Total Classes"
          value={totalAssignments}
          icon={<BookOpenIcon className="h-6 w-6" />}
          gradient="from-emerald-500 to-teal-600"
          bg="bg-emerald-50"
          text="text-emerald-600"
        />

        {/* Today's Classes */}
        <StatCard
          title="Today's Classes"
          value={upcomingClasses}
          icon={<CalendarIcon className="h-6 w-6" />}
          gradient="from-amber-500 to-orange-600"
          bg="bg-amber-50"
          text="text-amber-600"
        />

        {/* Status */}
        <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden">
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
              isActive
                ? 'from-emerald-500 to-teal-600'
                : 'from-slate-400 to-slate-500'
            } opacity-0 group-hover:opacity-100 transition-opacity`}
          />
          <div className="flex items-start justify-between mb-3">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                isActive ? 'bg-emerald-50' : 'bg-slate-100'
              }`}
            >
              {isActive ? (
                <CheckBadgeIcon className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-slate-500" />
              )}
            </div>
          </div>
          <p
            className={`text-2xl font-bold ${
              isActive ? 'text-emerald-600' : 'text-slate-600'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
            Status
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* QUICK ACTIONS                                                 */}
      {/* ============================================================ */}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            href="/teacher/schedule"
            title="View Schedule"
            description="Check your upcoming classes"
            icon={<CalendarIcon className="h-6 w-6" />}
            gradient="from-indigo-500 to-purple-600"
            bg="bg-indigo-50"
            text="text-indigo-600"
          />

          <QuickActionCard
            href="/teacher/classes"
            title="My Classes"
            description="Open your assigned classes"
            icon={<BookOpenIcon className="h-6 w-6" />}
            gradient="from-emerald-500 to-teal-600"
            bg="bg-emerald-50"
            text="text-emerald-600"
          />

          <QuickActionCard
            href="/teacher/profile"
            title="Update Profile"
            description="Edit your bio and subjects"
            icon={<UserIcon className="h-6 w-6" />}
            gradient="from-fuchsia-500 to-pink-600"
            bg="bg-fuchsia-50"
            text="text-fuchsia-600"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* PROFILE SUMMARY                                               */}
      {/* ============================================================ */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <UserIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Your Profile
            </h2>
            <p className="text-xs text-slate-500">
              Personal information and preferences
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <ProfileRow
            label="Name"
            value={teacher.name || 'Not provided'}
            icon={<UserIcon className="h-4 w-4" />}
          />

          <ProfileRow
            label="Email"
            value={teacher.email || 'Not provided'}
            icon={<EnvelopeIcon className="h-4 w-4" />}
            breakAll
          />

          <ProfileRow
            label="Subjects"
            value={
              Array.isArray(teacher.subjects) && teacher.subjects.length > 0
                ? teacher.subjects.join(', ')
                : 'None'
            }
            icon={<BookOpenIcon className="h-4 w-4" />}
          />

          <ProfileRow
            label="Bio"
            value={teacher.bio || 'No bio'}
            icon={<DocumentTextIcon className="h-4 w-4" />}
          />

          {/* Audio Introduction */}
          {teacher.audioUrl && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <MusicalNoteIcon className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Audio Introduction
                </p>
              </div>
              <audio controls className="w-full h-10">
                <source src={teacher.audioUrl} type="audio/mpeg" />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable Components                                                        */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon,
  gradient,
  bg,
  text,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center ${text}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon,
  gradient,
  bg,
  text,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  bg: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
      />

      <div
        className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0 ${text} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 group-hover:text-slate-800">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {description}
        </p>
      </div>

      <ArrowRightIcon
        className={`h-5 w-5 shrink-0 ${text} group-hover:translate-x-1 transition-transform`}
      />
    </Link>
  );
}

function ProfileRow({
  label,
  value,
  icon,
  breakAll,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  breakAll?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-2">
      <div className="flex items-center gap-2 sm:w-40 shrink-0">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span
        className={`text-sm font-medium text-slate-800 sm:flex-1 ${
          breakAll ? 'break-all' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}