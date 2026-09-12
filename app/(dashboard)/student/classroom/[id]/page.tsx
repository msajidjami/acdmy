import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import Academy from '@/models/Academy';

import StudentZoomClassroom from '@/app/components/student/StudentZoomClassroom';

import {
  ArrowLeft,
  BookOpen,
  User as UserIcon,
  Calendar,
  Clock,
  Video,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Globe,
  Hash,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ======================================================
   Types
   ====================================================== */

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

/* ======================================================
   Helpers
   ====================================================== */

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function sortDays(days: string[]): string[] {
  return [...new Set(days)].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );
}

/* ======================================================
   Page
   ====================================================== */

export default async function StudentClassroomPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const assignmentId = (resolvedParams as any)?.id;

  /* ---------- Validate ID ---------- */

  if (!assignmentId || !/^[a-fA-F0-9]{24}$/.test(assignmentId)) {
    notFound();
  }

  /* ---------- Auth ---------- */

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

  let decoded: JwtUserPayload;
  try {
    const result = jwt.verify(token, jwtSecret);
    if (typeof result === 'string') redirect('/login');
    decoded = result as JwtUserPayload;
  } catch {
    redirect('/login');
  }

  const userEmail = normalizeEmail(decoded.email);
  if (!userEmail) redirect('/login');

  await connectDB();

  /* ---------- Load Student ---------- */

  const student = await Student.findOne({ email: userEmail })
    .select('_id academyId name email classLevel imageUrl')
    .lean();

  if (!student?.academyId) {
    redirect('/student/dashboard?error=student-not-found');
  }

  /* ---------- Load Academy ---------- */

  const academy = await Academy.findById(student.academyId)
    .select('_id name')
    .lean();

  /* ---------- Load Assignment (SECURITY) ---------- */

  /*
   * Assignment must:
   *  1. Belong to the student's academy
   *  2. Belong to this student
   *  3. Not be cancelled
   */

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    academyId: student.academyId,
    studentId: student._id,
    status: { $ne: 'cancelled' },
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

  if (!assignment) notFound();

  /* ---------- Zoom not configured ---------- */

  if (!assignment.zoomMeetingNumber) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/student/schedule"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition group mb-6"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Schedule
        </Link>

        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-100 blur-3xl opacity-60 pointer-events-none" />

          <div className="relative p-8 sm:p-12 text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Classroom Not Ready
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
              This class does not have a Zoom meeting configured yet. Please
              ask your teacher or academy administrator.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/student/schedule"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Schedule
              </Link>

              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <GraduationCap className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Load Teacher + Course ---------- */

  const [teacher, course] = await Promise.all([
    Teacher.findOne({
      _id: assignment.teacherId,
      academyId: student.academyId,
    })
      .select('_id name email imageUrl')
      .lean(),

    Course.findOne({
      _id: assignment.courseId,
      academyId: student.academyId,
    })
      .select('_id name title')
      .lean(),
  ]);

  /* ---------- Prepare classroom data ---------- */

  const classroomData = {
    assignmentId: String(assignment._id),
    meetingNumber: String(assignment.zoomMeetingNumber || ''),
    password: String(assignment.zoomPassword || ''),
    studentName: String((student as any).name || 'Student'),
    studentEmail: String((student as any).email || ''),
    classLevel: String((student as any).classLevel || ''),
    teacherName: String((teacher as any)?.name || 'Teacher'),
    teacherEmail: String((teacher as any)?.email || ''),
    courseName: String(
      (course as any)?.name || (course as any)?.title || 'Online Class'
    ),
    academyName: String((academy as any)?.name || ''),
    daysOfWeek: Array.isArray(assignment.daysOfWeek)
      ? sortDays(assignment.daysOfWeek.map((d: any) => String(d)))
      : [],
    startTime: String(assignment.startTime || ''),
    endTime: String(assignment.endTime || ''),
    timezone: String(assignment.zoomTimezone || 'Asia/Karachi'),
    status: String(assignment.status || 'scheduled'),
    zoomProvider: String(assignment.zoomProvider || ''),
  };

  const todayName = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  });
  const isToday =
    classroomData.daysOfWeek.length === 0 ||
    classroomData.daysOfWeek.includes(todayName);

  /* ---------- Render ---------- */

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          href="/student/schedule"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-sky-600 transition group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Schedule
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">Classroom</span>
      </div>

      {/* ============================================
          HERO HEADER
      ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 p-5 sm:p-6 lg:p-8 text-white shadow-2xl shadow-cyan-500/20">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-teal-300/40 blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/95 text-[11px] font-semibold">
              <Video className="h-3.5 w-3.5" />
              Zoom Classroom
            </span>

            {isToday && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/30 backdrop-blur-sm border border-rose-300/40 text-white text-[11px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Today&apos;s Class
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-100 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              Student
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight break-words">
            {classroomData.courseName}
          </h1>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="h-4 w-4 text-white/50" />
              <span className="text-white/60">Teacher:</span>
              <span className="font-semibold text-white">
                {classroomData.teacherName}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-white/50" />
              <span className="font-mono font-semibold text-white">
                {classroomData.startTime || '--:--'}
              </span>
              <span className="text-white/40">–</span>
              <span className="font-mono font-semibold text-white">
                {classroomData.endTime || '--:--'}
              </span>
            </span>
          </div>

          {/* Info grid */}
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <HeroStat
              icon={<Hash className="h-4 w-4" />}
              label="Meeting"
              value={classroomData.meetingNumber}
              tone="sky"
            />
            <HeroStat
              icon={<Globe className="h-4 w-4" />}
              label="Timezone"
              value={classroomData.timezone}
              tone="violet"
            />
            <HeroStat
              icon={<Calendar className="h-4 w-4" />}
              label="Days"
              value={
                classroomData.daysOfWeek.length > 0
                  ? classroomData.daysOfWeek.join(', ')
                  : 'Every day'
              }
              tone="emerald"
            />
            <HeroStat
              icon={<Layers className="h-4 w-4" />}
              label="Class Level"
              value={classroomData.classLevel || 'General'}
              tone="amber"
            />
          </div>
        </div>
      </div>

      {/* ============================================
          CLASSROOM
      ============================================ */}

      <StudentZoomClassroom
        assignmentId={classroomData.assignmentId}
        meetingNumber={classroomData.meetingNumber}
        password={classroomData.password}
        studentName={classroomData.studentName}
        studentEmail={classroomData.studentEmail}
        courseName={classroomData.courseName}
        teacherName={classroomData.teacherName}
      />
    </div>
  );
}

/* ======================================================
   Hero Stat
   ====================================================== */

function HeroStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'sky' | 'violet' | 'emerald' | 'amber';
}) {
  const toneClasses = {
    sky: 'text-sky-200 bg-sky-500/15 border-sky-400/25',
    violet: 'text-violet-200 bg-violet-500/15 border-violet-400/25',
    emerald: 'text-emerald-200 bg-emerald-500/15 border-emerald-400/25',
    amber: 'text-amber-200 bg-amber-500/15 border-amber-400/25',
  }[tone];

  return (
    <div className="rounded-xl bg-white/8 backdrop-blur-sm border border-white/15 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={`h-5 w-5 rounded-md flex items-center justify-center border ${toneClasses}`}
        >
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
          {label}
        </p>
      </div>
      <p
        className="text-xs sm:text-sm font-bold text-white truncate"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}