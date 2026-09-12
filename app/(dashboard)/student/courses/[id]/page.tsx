import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Course from '@/models/Course';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import CourseProgress from '@/models/CourseProgress';

import { ArrowLeft, GraduationCap } from 'lucide-react';

import CourseDetailView from './CourseDetailView';

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
] as const;

/* ✅ Safe unique + sort days */
function normalizeDaysOfWeek(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const unique = new Set<string>();

  for (const item of raw) {
    if (item === null || item === undefined) continue;
    const day = String(item).trim();
    if (day) unique.add(day);
  }

  return Array.from(unique).sort((a, b) => {
    const ia = DAY_ORDER.indexOf(a as any);
    const ib = DAY_ORDER.indexOf(b as any);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/* ======================================================
   Data Fetch
   ====================================================== */

async function getCourseData(email: string, courseId: string) {
  await connectDB();

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  /* ---------- Student ---------- */

  const student = await Student.findOne({ email: normalized })
    .select('_id academyId name email classLevel imageUrl')
    .lean();

  if (!student?.academyId) return null;

  /* ---------- Is student enrolled in this course? ---------- */

  const assignments = await Assignment.find({
    academyId: student.academyId,
    studentId: student._id,
    courseId: courseId,
    status: { $ne: 'cancelled' },
  })
    .select('_id teacherId courseId startTime endTime daysOfWeek status')
    .lean();

  if (assignments.length === 0) return null;

  /* ---------- Course ---------- */

  const course = await Course.findOne({
    _id: courseId,
    academyId: student.academyId,
  }).lean();

  if (!course) return null;

  /* ---------- Teachers ---------- */

  const teacherIds = Array.from(
    new Set(
      assignments
        .map((a: any) => String(a.teacherId || ''))
        .filter((x: string) => x.length > 0)
    )
  );

  const teachers = await Teacher.find({
    _id: { $in: teacherIds },
    academyId: student.academyId,
  })
    .select('_id name email subjects imageUrl')
    .lean();

  const teacherMap = new Map<string, any>(
    teachers.map((t: any) => [String(t._id), t])
  );

  /* ---------- Progress ---------- */

  const progress = await CourseProgress.findOne({
    academyId: student.academyId,
    courseId: course._id,
    studentId: student._id,
  }).lean();

  const totalPages = Number((course as any).totalPages) || 0;
  const pagesCompleted = Number((progress as any)?.pagesCompleted) || 0;
  const percent =
    totalPages > 0
      ? Math.min(100, Math.round((pagesCompleted / totalPages) * 100))
      : 0;

  const rawSessions: any[] = Array.isArray((progress as any)?.sessions)
    ? (progress as any).sessions
    : [];

  /* Last 12 sessions for chart */
  const bars = rawSessions.slice(-12).map((s: any) => ({
    date: s.date ? new Date(s.date).toISOString() : new Date().toISOString(),
    pages: Number(s.pagesCovered) || 0,
    startPage: Number(s.startPage) || 0,
    endPage: Number(s.endPage) || 0,
    note: String(s.note || ''),
    teacherId: String(s.teacherId || ''),
  }));

  /* Recent sessions (newest first, max 10) */
  const recentSessions = [...rawSessions]
    .reverse()
    .slice(0, 10)
    .map((s: any) => {
      const t = teacherMap.get(String(s.teacherId || ''));
      return {
        date: s.date ? new Date(s.date).toISOString() : null,
        pagesCovered: Number(s.pagesCovered) || 0,
        startPage: Number(s.startPage) || 0,
        endPage: Number(s.endPage) || 0,
        note: String(s.note || ''),
        teacherName: String((t as any)?.name || ''),
      };
    });

  /* ---------- Class schedule (typed) ---------- */

  const classSchedule = assignments.map((a: any) => {
    const teacher = teacherMap.get(String(a.teacherId || ''));
    return {
      _id: String(a._id),
      teacherName: String((teacher as any)?.name || 'Teacher'),
      daysOfWeek: normalizeDaysOfWeek(a.daysOfWeek),
      startTime: String(a.startTime || ''),
      endTime: String(a.endTime || ''),
      status: String(a.status || 'scheduled'),
    };
  });

  const lastSession = rawSessions[rawSessions.length - 1];

  return {
    student: {
      _id: String(student._id),
      name: String((student as any).name || 'Student'),
      email: String((student as any).email || ''),
      classLevel: String((student as any).classLevel || ''),
      imageUrl: String((student as any).imageUrl || ''),
    },
    course: {
      _id: String(course._id),
      title: String((course as any).title || ''),
      description: String((course as any).description || ''),
      image: String((course as any).image || ''),
      thumbnail: String(
        (course as any).thumbnail || (course as any).image || ''
      ),
      bookTitle: String((course as any).bookTitle || ''),
      price: Number((course as any).price) || 0,
      duration: String((course as any).duration || ''),
      level: String((course as any).level || 'beginner'),
      category: String((course as any).category || ''),
      accentColor: String((course as any).accentColor || '#0ea5e9'),
      totalPages,
      isActive: (course as any).isActive !== false,
    },
    teachers: teachers.map((t: any) => ({
      _id: String(t._id),
      name: String(t.name || 'Teacher'),
      email: String(t.email || ''),
      imageUrl: String(t.imageUrl || ''),
      subjects: Array.isArray(t.subjects)
        ? t.subjects.map((s: any) => String(s))
        : [],
    })),
    progress: {
      pagesCompleted,
      pagesRemaining: Math.max(0, totalPages - pagesCompleted),
      percent,
      sessionsCount: rawSessions.length,
      bars,
      recentSessions,
      lastSessionAt: lastSession?.date
        ? new Date(lastSession.date).toISOString()
        : null,
    },
    classSchedule,
  };
}

/* ======================================================
   Page
   ====================================================== */

export default async function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await params;
  const courseId = String((resolved as any)?.id || '');

  /* ---------- Validate ID ---------- */

  if (!courseId || !/^[a-fA-F0-9]{24}$/.test(courseId)) {
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

  const data = await getCourseData(userEmail, courseId);

  /* ---------- Not found / not enrolled ---------- */

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition group mb-6"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Courses
        </Link>

        <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          <div className="relative p-10 sm:p-14 text-center">
            <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Course Not Found
            </h1>

            <p className="mt-3 text-slate-500 max-w-md mx-auto leading-relaxed">
              This course doesn&apos;t exist or you are not enrolled in it.
              Please contact your academy administrator.
            </p>

            <Link
              href="/student/courses"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-0 pb-10">
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to My Courses
      </Link>

      <CourseDetailView
        course={data.course}
        teachers={data.teachers}
        progress={data.progress}
        classSchedule={data.classSchedule}
        student={data.student}
      />
    </div>
  );
}