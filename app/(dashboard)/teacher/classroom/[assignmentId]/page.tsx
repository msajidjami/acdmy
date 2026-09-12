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
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export default async function TeacherClassroomPage({
  params,
}: {
  params: Promise<{ assignmentId: string }> | { assignmentId: string };
}) {
  const resolvedParams = await params;
  const assignmentId = (resolvedParams as any)?.assignmentId;

  if (!assignmentId || !/^[a-fA-F0-9]{24}$/.test(assignmentId)) {
    notFound();
  }

  /* ------------------ AUTH ------------------ */

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

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !decoded.userId ||
    !decoded.email
  ) {
    redirect('/login');
  }

  await connectDB();

  const user = await User.findById(decoded.userId)
    .select('name email role')
    .lean();

  if (!user) redirect('/login');

  const email = normalizeEmail((user as any).email);
  const tokenEmail = normalizeEmail(decoded.email);

  if (!email || !tokenEmail || email !== tokenEmail) {
    redirect('/login');
  }

  /* ------------------ TEACHER ------------------ */

  const teacher = await Teacher.findOne({ email })
    .select('_id academyId name email')
    .lean();

  if (!teacher?.academyId) {
    redirect('/teacher/settings?error=teacher-not-found');
  }

  /* ------------------ ASSIGNMENT ------------------ */

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    academyId: teacher.academyId,
    teacherId: teacher._id,
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

  /* ------------------ ZOOM NOT CONFIGURED ------------------ */

  if (!assignment.zoomMeetingNumber) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition group mb-6"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to My Classes
        </Link>

        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
          {/* Top gradient strip */}
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          {/* Decorative blur */}
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-100 blur-3xl opacity-60 pointer-events-none" />

          <div className="relative p-8 sm:p-12 text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Zoom Classroom Not Ready
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
              This class does not have a Zoom meeting configured yet. Please
              ask the academy owner to configure the permanent Zoom meeting
              for this assignment.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/teacher/classes"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Classes
              </Link>

              <Link
                href="/teacher/schedule"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Calendar className="h-4 w-4" />
                My Schedule
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------ LOAD STUDENT + COURSE ------------------ */

  const [student, course] = await Promise.all([
    Student.findOne({
      _id: assignment.studentId,
      academyId: teacher.academyId,
    })
      .select('name fatherName')
      .lean(),

    Course.findOne({
      _id: assignment.courseId,
      academyId: teacher.academyId,
    })
      .select('name title')
      .lean(),
  ]);

  /* ------------------ PREPARE DATA ------------------ */

  const classroomData = {
    assignmentId: String(assignment._id),
    meetingNumber: String(assignment.zoomMeetingNumber || ''),
    password: String(assignment.zoomPassword || ''),
    studentName: String((student as any)?.name || 'Student'),
    fatherName: String((student as any)?.fatherName || ''),
    courseName: String(
      (course as any)?.name || (course as any)?.title || 'Online Class'
    ),
    daysOfWeek: Array.isArray(assignment.daysOfWeek)
      ? assignment.daysOfWeek.map((day: any) => String(day))
      : [],
    startTime: String(assignment.startTime || ''),
    endTime: String(assignment.endTime || ''),
    timezone: String(assignment.zoomTimezone || 'Asia/Karachi'),
    status: String(assignment.status || 'scheduled'),
    teacherName: String((teacher as any).name || (user as any).name || 'Teacher'),
    teacherEmail: email,
    zoomProvider: String(assignment.zoomProvider || ''),
  };

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isToday =
    classroomData.daysOfWeek.length === 0 ||
    classroomData.daysOfWeek.includes(todayName);

  /* ------------------ RENDER ------------------ */

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
      {/* ============================================ */}
      {/* BREADCRUMB                                    */}
      {/* ============================================ */}

      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-indigo-600 transition group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          My Classes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">Classroom</span>
      </div>

      {/* ============================================ */}
      {/* HERO HEADER                                   */}
      {/* ============================================ */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 shadow-2xl">
        {/* Decorative gradient blurs */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-indigo-500/40 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 p-5 sm:p-6 lg:p-8">
          {/* Top row: badges + time */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/95 text-[11px] font-semibold">
              <Video className="h-3.5 w-3.5 text-sky-400" />
              Zoom Classroom
            </span>

            {isToday && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[11px] font-bold shadow-md shadow-rose-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Today's Class
              </span>
            )}

            {classroomData.zoomProvider && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 backdrop-blur-sm border border-emerald-400/30 text-emerald-200 text-[11px] font-semibold capitalize">
                <Sparkles className="h-3.5 w-3.5" />
                {classroomData.zoomProvider}
              </span>
            )}
          </div>

          {/* Course name + student */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight break-words">
                {classroomData.courseName}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="h-4 w-4 text-white/40" />
                  <span className="font-semibold text-white">
                    {classroomData.studentName}
                  </span>
                  {classroomData.fatherName && (
                    <span className="text-white/50">
                      · {classroomData.fatherName}
                    </span>
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-white/40" />
                  <span className="font-mono font-semibold text-white">
                    {classroomData.startTime || '--:--'}
                  </span>
                  <span className="text-white/40">–</span>
                  <span className="font-mono font-semibold text-white">
                    {classroomData.endTime || '--:--'}
                  </span>
                </span>
              </div>
            </div>
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
              icon={<BookOpen className="h-4 w-4" />}
              label="Status"
              value={classroomData.status}
              tone="amber"
              capitalize
            />
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CLASSROOM                                     */}
      {/* ============================================ */}

      <TeacherZoomClassroom
        assignmentId={classroomData.assignmentId}
        meetingNumber={classroomData.meetingNumber}
        password={classroomData.password}
        teacherName={classroomData.teacherName}
        teacherEmail={classroomData.teacherEmail}
        courseName={classroomData.courseName}
        studentName={classroomData.studentName}
      />
    </div>
  );
}

/* ------------------ Hero Stat ------------------ */

function HeroStat({
  icon,
  label,
  value,
  tone,
  capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'sky' | 'violet' | 'emerald' | 'amber';
  capitalize?: boolean;
}) {
  const toneClasses = {
    sky: 'text-sky-300 bg-sky-500/10 border-sky-400/20',
    violet: 'text-violet-300 bg-violet-500/10 border-violet-400/20',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20',
    amber: 'text-amber-300 bg-amber-500/10 border-amber-400/20',
  }[tone];

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`h-5 w-5 rounded-md flex items-center justify-center border ${toneClasses}`}>
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
          {label}
        </p>
      </div>
      <p
        className={`text-xs sm:text-sm font-bold text-white truncate ${
          capitalize ? 'capitalize' : ''
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}