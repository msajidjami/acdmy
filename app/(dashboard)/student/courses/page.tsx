import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import Teacher from '@/models/Teacher';
import CourseProgress from '@/models/CourseProgress';

import { ArrowLeft, GraduationCap } from 'lucide-react';

import CoursesView from './CoursesView';

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

/* ======================================================
   Data Fetch
   ====================================================== */

async function getCoursesData(email: string) {
  await connectDB();

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const student = await Student.findOne({ email: normalized })
    .select('_id academyId name email classLevel imageUrl')
    .lean();

  if (!student?.academyId) return null;

  const academy = await Academy.findById(student.academyId)
    .select('_id name')
    .lean();

  /* ---------- Student's assignments ---------- */

  const assignments = await Assignment.find({
    academyId: student.academyId,
    studentId: student._id,
    status: { $ne: 'cancelled' },
  })
    .select('_id courseId teacherId startTime endTime daysOfWeek')
    .lean();

  const courseIds = [
    ...new Set(
      assignments.map((a: any) => String(a.courseId || '')).filter(Boolean)
    ),
  ];

  const teacherIds = [
    ...new Set(
      assignments.map((a: any) => String(a.teacherId || '')).filter(Boolean)
    ),
  ];

  /* ---------- Fetch courses + teachers + progress ---------- */

  const [courses, teachers, progressList] = await Promise.all([
    courseIds.length > 0
      ? Course.find({
          _id: { $in: courseIds },
          academyId: student.academyId,
        })
          .select(
            '_id title description image thumbnail price duration level category totalPages bookTitle accentColor isActive'
          )
          .lean()
      : Promise.resolve([]),

    teacherIds.length > 0
      ? Teacher.find({
          _id: { $in: teacherIds },
          academyId: student.academyId,
        })
          .select('_id name')
          .lean()
      : Promise.resolve([]),

    courseIds.length > 0
      ? CourseProgress.find({
          academyId: student.academyId,
          studentId: student._id,
          courseId: { $in: courseIds },
        }).lean()
      : Promise.resolve([]),
  ]);

  const teacherMap = new Map(
    teachers.map((t: any) => [String(t._id), String(t.name || 'Teacher')])
  );

  const progressMap = new Map(
    progressList.map((p: any) => [
      String(p.courseId),
      {
        pagesCompleted: Number(p.pagesCompleted) || 0,
        totalPages: Number(p.totalPages) || 0,
        sessionsCount: Array.isArray(p.sessions) ? p.sessions.length : 0,
        lastSessionAt:
          Array.isArray(p.sessions) && p.sessions.length > 0
            ? p.sessions[p.sessions.length - 1].date
            : null,
      },
    ])
  );

  /* ---------- Build course rows with teacher names ---------- */

  const courseTeacherMap = new Map<string, Set<string>>();
  for (const a of assignments as any[]) {
    const cid = String(a.courseId || '');
    const tid = String(a.teacherId || '');
    if (!cid || !tid) continue;
    if (!courseTeacherMap.has(cid)) courseTeacherMap.set(cid, new Set());
    courseTeacherMap.get(cid)!.add(tid);
  }

  const rows = courses.map((c: any) => {
    const cid = String(c._id);
    const totalPages =
      Number(c.totalPages) || progressMap.get(cid)?.totalPages || 0;
    const pagesCompleted = progressMap.get(cid)?.pagesCompleted || 0;
    const percent =
      totalPages > 0
        ? Math.min(100, Math.round((pagesCompleted / totalPages) * 100))
        : 0;

    const teacherNames = Array.from(courseTeacherMap.get(cid) || [])
      .map((tid) => teacherMap.get(tid))
      .filter(Boolean) as string[];

    return {
      _id: cid,
      title: String(c.title || ''),
      description: String(c.description || ''),
      image: String(c.image || ''),
      thumbnail: String(c.thumbnail || c.image || ''),
      bookTitle: String(c.bookTitle || ''),
      level: String(c.level || 'beginner'),
      category: String(c.category || ''),
      duration: String(c.duration || ''),
      price: Number(c.price) || 0,
      totalPages,
      accentColor: String(c.accentColor || '#0ea5e9'),
      isActive: c.isActive !== false,
      teacherNames,
      teacherCount: teacherNames.length,
      pagesCompleted,
      pagesRemaining: Math.max(0, totalPages - pagesCompleted),
      percent,
      sessionsCount: progressMap.get(cid)?.sessionsCount || 0,
      lastSessionAt: progressMap.get(cid)?.lastSessionAt || null,
      isCompleted: totalPages > 0 && pagesCompleted >= totalPages,
      hasProgress: pagesCompleted > 0,
    };
  });

  /* Sort: in-progress first (by percent desc), then completed, then not-started */
  rows.sort((a, b) => {
    const rankA = a.isCompleted ? 2 : a.hasProgress ? 0 : 1;
    const rankB = b.isCompleted ? 2 : b.hasProgress ? 0 : 1;
    if (rankA !== rankB) return rankA - rankB;
    if (rankA === 0) return b.percent - a.percent;
    return a.title.localeCompare(b.title);
  });

  return {
    student: {
      _id: String(student._id),
      name: String((student as any).name || 'Student'),
      email: String((student as any).email || ''),
      classLevel: String((student as any).classLevel || ''),
      imageUrl: String((student as any).imageUrl || ''),
    },
    academy: academy
      ? { _id: String(academy._id), name: String((academy as any).name || '') }
      : null,
    courses: rows,
  };
}

/* ======================================================
   Page
   ====================================================== */

export default async function StudentCoursesPage() {
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

  const data = await getCoursesData(userEmail);

  /* ------------------ No Academy ------------------ */

  if (!data) {
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
              href="/student/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-0 pb-10">
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <CoursesView
        student={data.student}
        academy={data.academy}
        courses={data.courses}
      />
    </div>
  );
}