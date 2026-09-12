import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import Student from '@/models/Student';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';

import {
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';

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

  const teacher = await Teacher.findOne({ email: normalized })
    .select('_id academyId name email subjects')
    .lean();

  if (!teacher?.academyId) return null;

  const academy = await Academy.findById(teacher.academyId).lean();
  if (!academy) return null;

  /* ------------------ Stats ------------------ */

  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    teacherAssignments,
    teacherStudents,
  ] = await Promise.all([
    Student.countDocuments({ academyId: academy._id }),
    Teacher.countDocuments({ academyId: academy._id }),
    Course.countDocuments({ academyId: academy._id }),
    Assignment.countDocuments({
      academyId: academy._id,
      teacherId: teacher._id,
      status: { $ne: 'cancelled' },
    }),
    (async () => {
      const assignments = await Assignment.find({
        academyId: academy._id,
        teacherId: teacher._id,
        status: { $ne: 'cancelled' },
      })
        .select('studentId')
        .lean();

      const ids = [
        ...new Set(
          assignments
            .map((a: any) => String(a.studentId || ''))
            .filter(Boolean)
        ),
      ];

      return ids.length;
    })(),
  ]);

  return {
    teacher,
    academy,
    stats: {
      totalStudents,
      totalTeachers,
      totalCourses,
      teacherAssignments,
      teacherStudents,
    },
  };
}

/* ======================================================
   Page
   ====================================================== */

export default async function TeacherAcademyPage() {
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
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-rose-100 blur-3xl opacity-60 pointer-events-none" />

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
              href="/teacher/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { teacher, academy, stats } = data;

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

  const teacherData = {
    _id: String(teacher._id),
    name: String(teacher.name || ''),
    email: String(teacher.email || ''),
    subjects: Array.isArray(teacher.subjects)
      ? teacher.subjects.map((s: any) => String(s))
      : [],
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-0 pb-10">
      <Link
        href="/teacher/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <AcademyView
        academy={academyData}
        teacher={teacherData}
        stats={stats}
      />
    </div>
  );
}