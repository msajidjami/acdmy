import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';

import { ArrowLeft, GraduationCap, MessageCircle } from 'lucide-react';

import StudentDashboardView from './StudentDashboardView';

export const dynamic = 'force-dynamic';

/* ======================================================
   Types
   ====================================================== */

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

/* ======================================================
   Data Fetch
   ====================================================== */

async function getStudentData(email: string) {
  await connectDB();

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const user = await User.findOne({ email: normalized })
    .select('_id name email role')
    .lean();

  if (!user) return null;

  const student = await Student.findOne({ email: normalized })
    .select(
      '_id name email academyId classLevel imageUrl isActive createdAt'
    )
    .lean();

  if (!student?.academyId) {
    return { user, student: null, academy: null, data: null };
  }

  const academy = await Academy.findById(student.academyId)
    .select('_id name')
    .lean();

  const assignments = await Assignment.find({
    academyId: student.academyId,
    studentId: student._id,
    status: { $ne: 'cancelled' },
  })
    .select(
      [
        '_id',
        'teacherId',
        'courseId',
        'startTime',
        'endTime',
        'daysOfWeek',
        'status',
        'notes',
        'livekitRoomName',
        'livekitHostIdentity',
        'livekitProvider',
      ].join(' ')
    )
    .lean();

  const teacherIds = [
    ...new Set(
      assignments.map((a: any) => String(a.teacherId || '')).filter(Boolean)
    ),
  ];

  const courseIds = [
    ...new Set(
      assignments.map((a: any) => String(a.courseId || '')).filter(Boolean)
    ),
  ];

  const [teachers, courses] = await Promise.all([
    teacherIds.length > 0
      ? Teacher.find({
          _id: { $in: teacherIds },
          academyId: student.academyId,
        })
          .select('_id name email subjects imageUrl')
          .lean()
      : Promise.resolve([]),

    courseIds.length > 0
      ? Course.find({
          _id: { $in: courseIds },
          academyId: student.academyId,
        })
          .select('_id name title')
          .lean()
      : Promise.resolve([]),
  ]);

  const teacherMap = new Map(
    teachers.map((t: any) => [String(t._id), t])
  );
  const courseMap = new Map(
    courses.map((c: any) => [
      String(c._id),
      String((c as any).name || (c as any).title || 'Course'),
    ])
  );

  const todayName = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const rows = assignments.map((a: any) => {
    const teacher = teacherMap.get(String(a.teacherId));
    const courseName = courseMap.get(String(a.courseId)) || 'Course';

    return {
      _id: String(a._id),
      courseName,
      teacherName: String(teacher?.name || 'Teacher'),
      teacherEmail: String(teacher?.email || ''),
      daysOfWeek: Array.isArray(a.daysOfWeek)
        ? a.daysOfWeek.map((d: any) => String(d))
        : [],
      startTime: String(a.startTime || ''),
      endTime: String(a.endTime || ''),
      status: String(a.status || 'scheduled'),
      notes: String(a.notes || ''),
      hasLiveKit: Boolean(a.livekitRoomName),
      livekitRoomName: String(a.livekitRoomName || ''),
      livekitHostIdentity: String(a.livekitHostIdentity || ''),
      livekitProvider: String(a.livekitProvider || 'none'),
      isToday:
        Array.isArray(a.daysOfWeek) && a.daysOfWeek.includes(todayName),
    };
  });

  rows.sort((a, b) => {
    if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
    return String(a.startTime).localeCompare(String(b.startTime));
  });

  const uniqueCourses = new Set(
    rows.map((r) => r.courseName).filter(Boolean)
  );
  const uniqueTeachers = new Set(
    rows.map((r) => r.teacherName).filter(Boolean)
  );
  const todayClasses = rows.filter((r) => r.isToday);
  const upcomingClasses = rows.filter((r) => r.status === 'scheduled');
  const ongoingClasses = rows.filter((r) => r.status === 'ongoing');
  const livekitReadyClasses = rows.filter((r) => r.hasLiveKit);

  return {
    user,
    student,
    academy,
    data: {
      rows,
      stats: {
        totalClasses: rows.length,
        totalCourses: uniqueCourses.size,
        totalTeachers: uniqueTeachers.size,
        todayClasses: todayClasses.length,
        upcomingClasses: upcomingClasses.length,
        ongoingClasses: ongoingClasses.length,
        livekitReadyClasses: livekitReadyClasses.length,
      },
    },
  };
}

/* ======================================================
   Page
   ====================================================== */

export default async function StudentDashboardPage() {
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

  const result = await getStudentData(userEmail);

  /* ------------------ No Data ------------------ */

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-pink-600" />

          <div className="relative p-10 sm:p-14 text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Student Profile Not Found
            </h1>

            <p className="mt-3 text-slate-500 max-w-md mx-auto leading-relaxed">
              Your student profile is not registered. Please contact your
              academy administrator.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user, student, academy, data } = result;

  /* ------------------ No academy ------------------ */

  if (!student || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          <div className="relative p-10 sm:p-14 text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              No Academy Assigned
            </h1>

            <p className="mt-3 text-slate-500 max-w-md mx-auto leading-relaxed">
              You are not yet linked to any academy. Please contact your
              academy administrator to get started.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const studentData = {
    _id: String(student._id),
    name: String(student.name || (user as any).name || 'Student'),
    email: String(student.email || ''),
    classLevel: String((student as any).classLevel || ''),
    imageUrl: String((student as any).imageUrl || ''),
    isActive: (student as any).isActive !== false,
    createdAt: (student as any).createdAt
      ? new Date((student as any).createdAt).toISOString()
      : null,
  };

  const academyData = academy
    ? {
        _id: String(academy._id),
        name: String((academy as any).name || ''),
      }
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* ✅ WhatsApp-style Chats quick access */}
      <Link
        href="/student"
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white shadow-lg hover:shadow-xl transition-all"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold leading-none">
                Open Chats
              </h3>
              <p className="text-xs text-white/80 mt-1">
                WhatsApp-style contacts &amp; messages
              </p>
            </div>
          </div>
          <span className="text-2xl group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </Link>

      <StudentDashboardView
        student={studentData}
        academy={academyData}
        stats={data.stats}
        classes={data.rows}
      />
    </div>
  );
}