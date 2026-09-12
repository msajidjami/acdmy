import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';
import Course from '@/models/Course';

import { ArrowLeft, GraduationCap } from 'lucide-react';

import StudentsView from './StudentsView';

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

async function getStudentsData(email: string) {
  await connectDB();

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const teacher = await Teacher.findOne({ email: normalized })
    .select('_id academyId name email subjects')
    .lean();

  if (!teacher?.academyId) return null;

  const academy = await Academy.findById(teacher.academyId)
    .select('_id name')
    .lean();

  /* ---------- Assignments for this teacher ---------- */

  const assignments = await Assignment.find({
    academyId: teacher.academyId,
    teacherId: teacher._id,
    status: { $ne: 'cancelled' },
  })
    .select('_id studentId courseId startTime endTime daysOfWeek status')
    .lean();

  /* ---------- Unique IDs ---------- */

  const studentIds = [
    ...new Set(
      assignments.map((a: any) => String(a.studentId || '')).filter(Boolean)
    ),
  ];

  const courseIds = [
    ...new Set(
      assignments.map((a: any) => String(a.courseId || '')).filter(Boolean)
    ),
  ];

  /* ---------- Fetch only teaching-relevant fields ---------- */

  const [students, courses] = await Promise.all([
    studentIds.length > 0
      ? Student.find({
          _id: { $in: studentIds },
          academyId: teacher.academyId,
        })
          // ✅ ONLY teaching-relevant fields
          .select('_id name imageUrl isActive')
          .lean()
      : Promise.resolve([]),

    courseIds.length > 0
      ? Course.find({
          _id: { $in: courseIds },
          academyId: teacher.academyId,
        })
          .select('_id name title')
          .lean()
      : Promise.resolve([]),
  ]);

  /* ---------- Maps ---------- */

  const studentMap = new Map(students.map((s: any) => [String(s._id), s]));

  const courseMap = new Map(
    courses.map((c: any) => [
      String(c._id),
      String((c as any).name || (c as any).title || 'Course'),
    ])
  );

  /* ---------- Aggregate per student ---------- */

  const studentsWithData = new Map<
    string,
    {
      student: any;
      courses: Set<string>;
      classCount: number;
      daysSet: Set<string>;
      timesSet: Set<string>;
    }
  >();

  for (const a of assignments) {
    const sid = String((a as any).studentId || '');
    if (!sid) continue;

    const student = studentMap.get(sid);
    if (!student) continue;

    if (!studentsWithData.has(sid)) {
      studentsWithData.set(sid, {
        student,
        courses: new Set(),
        classCount: 0,
        daysSet: new Set(),
        timesSet: new Set(),
      });
    }

    const entry = studentsWithData.get(sid)!;
    entry.classCount += 1;

    const cid = String((a as any).courseId || '');
    if (cid) {
      const courseName = courseMap.get(cid);
      if (courseName) entry.courses.add(courseName);
    }

    if (Array.isArray((a as any).daysOfWeek)) {
      for (const d of (a as any).daysOfWeek) {
        entry.daysSet.add(String(d));
      }
    }

    const start = String((a as any).startTime || '').trim();
    const end = String((a as any).endTime || '').trim();
    if (start && end) {
      entry.timesSet.add(`${start} – ${end}`);
    }
  }

  /* ---------- Serialize (only teaching info) ---------- */

  const serialized = Array.from(studentsWithData.values()).map(
    ({ student, courses: courseSet, classCount, daysSet, timesSet }) => ({
      _id: String(student._id),
      name: String(student.name || 'Student'),
      imageUrl: String(student.imageUrl || ''),
      isActive: student.isActive !== false,
      courses: Array.from(courseSet),
      classCount,
      days: Array.from(daysSet),
      timeSlots: Array.from(timesSet),
    })
  );

  return {
    teacher: {
      _id: String(teacher._id),
      name: String(teacher.name || ''),
      email: String(teacher.email || ''),
      subjects: Array.isArray(teacher.subjects)
        ? teacher.subjects.map((s: any) => String(s))
        : [],
    },
    academy: academy
      ? { _id: String(academy._id), name: String((academy as any).name || '') }
      : null,
    students: serialized,
  };
}

/* ======================================================
   Page
   ====================================================== */

export default async function TeacherStudentsPage() {
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

  const data = await getStudentsData(userEmail);

  /* ------------------ No Data ------------------ */

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-0 pb-10">
      <Link
        href="/teacher/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <StudentsView
        teacher={data.teacher}
        academy={data.academy}
        students={data.students}
      />
    </div>
  );
}