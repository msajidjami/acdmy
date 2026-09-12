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

import { ArrowLeft, GraduationCap } from 'lucide-react';

import AcademyView from './AcademyView';

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

async function getAcademyData(email: string) {
  await connectDB();

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const student = await Student.findOne({ email: normalized })
    .select('_id academyId name email classLevel imageUrl')
    .lean();

  if (!student?.academyId) return null;

  const academy = await Academy.findById(student.academyId).lean();
  if (!academy) return null;

  /* ---------- Academy-wide counts ---------- */

  const [totalStudents, totalTeachers, totalCourses] = await Promise.all([
    Student.countDocuments({ academyId: academy._id }),
    Teacher.countDocuments({ academyId: academy._id }),
    Course.countDocuments({ academyId: academy._id }),
  ]);

  /* ---------- Student's own activity ---------- */

  const assignments = await Assignment.find({
    academyId: student.academyId,
    studentId: student._id,
    status: { $ne: 'cancelled' },
  })
    .select('_id teacherId courseId')
    .lean();

  const myTeacherIds = [
    ...new Set(
      assignments.map((a: any) => String(a.teacherId || '')).filter(Boolean)
    ),
  ];

  const myCourseIds = [
    ...new Set(
      assignments.map((a: any) => String(a.courseId || '')).filter(Boolean)
    ),
  ];

  const [myTeachers, myCourses] = await Promise.all([
    myTeacherIds.length > 0
      ? Teacher.find({
          _id: { $in: myTeacherIds },
          academyId: student.academyId,
        })
          .select('_id name')
          .lean()
      : Promise.resolve([]),

    myCourseIds.length > 0
      ? Course.find({
          _id: { $in: myCourseIds },
          academyId: student.academyId,
        })
          .select('_id name title')
          .lean()
      : Promise.resolve([]),
  ]);

  return {
    student,
    academy,
    stats: {
      totalStudents,
      totalTeachers,
      totalCourses,
      myTeachers: myTeachers.length,
      myCourses: myCourses.length,
      myClasses: assignments.length,
    },
    myCoursesList: myCourses.map((c: any) => ({
      _id: String(c._id),
      name: String((c as any).name || (c as any).title || 'Course'),
    })),
    myTeachersList: myTeachers.map((t: any) => ({
      _id: String(t._id),
      name: String(t.name || 'Teacher'),
    })),
  };
}

/* ======================================================
   Page
   ====================================================== */

export default async function StudentAcademyPage() {
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

  const data = await getAcademyData(userEmail);

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
              No Academy Assigned
            </h1>

            <p className="mt-3 text-slate-500 max-w-md mx-auto leading-relaxed">
              You are not linked to any academy yet. Please contact your
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

  const { academy, stats, myCoursesList, myTeachersList } = data;

  /* ------------------ Serialize ------------------ */

  const academyData = {
    _id: String(academy._id),
    name: String((academy as any).name || ''),
    email: String((academy as any).email || ''),
    phone: String((academy as any).phone || ''),
    address: String((academy as any).address || ''),
    city: String((academy as any).city || ''),
    country: String((academy as any).country || ''),
    website: String((academy as any).website || ''),
    description: String((academy as any).description || ''),
    logoUrl: String((academy as any).logoUrl || ''),
    ownerName: String((academy as any).ownerName || ''),
    createdAt: (academy as any).createdAt
      ? new Date((academy as any).createdAt).toISOString()
      : null,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-0 pb-10">
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <AcademyView
        academy={academyData}
        stats={stats}
        myCourses={myCoursesList}
        myTeachers={myTeachersList}
      />
    </div>
  );
}