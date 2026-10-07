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

import { ArrowLeft } from 'lucide-react';
import StudentsView from './StudentsView';

export const dynamic = 'force-dynamic';

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

async function getStudentsData(email: string) {
  await connectDB();

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const teacher: any = await Teacher.findOne({ email: normalized })
    .select('_id academyId name email subjects')
    .lean();

  if (!teacher?.academyId) return null;

  const academy: any = await Academy.findById(teacher.academyId)
    .select('_id name')
    .lean();

  const assignments: any[] = await Assignment.find({
    academyId: teacher.academyId,
    teacherId: teacher._id,
    status: { $ne: 'cancelled' },
  })
    .select('_id studentId courseId startTime endTime daysOfWeek status')
    .lean();

  const studentIds = [
    ...new Set(assignments.map((a) => String(a.studentId || '')).filter(Boolean)),
  ];
  const courseIds = [
    ...new Set(assignments.map((a) => String(a.courseId || '')).filter(Boolean)),
  ];

  const [students, courses] = await Promise.all([
    studentIds.length
      ? Student.find({
          _id: { $in: studentIds },
          academyId: teacher.academyId,
        })
          .select('_id name imageUrl isActive')
          .lean()
      : Promise.resolve([]),
    courseIds.length
      ? Course.find({
          _id: { $in: courseIds },
          academyId: teacher.academyId,
        })
          .select('_id name title')
          .lean()
      : Promise.resolve([]),
  ]);

  const studentMap = new Map(students.map((s: any) => [String(s._id), s]));
  const courseMap = new Map(
    courses.map((c: any) => [String(c._id), String(c.name || c.title || 'Course')])
  );

  const grouped = new Map<
    string,
    {
      student: any;
      courses: Set<string>;
      classCount: number;
      days: Set<string>;
      times: Set<string>;
    }
  >();

  for (const a of assignments) {
    const sid = String(a.studentId || '');
    if (!sid) continue;

    const student = studentMap.get(sid);
    if (!student) continue;

    if (!grouped.has(sid)) {
      grouped.set(sid, {
        student,
        courses: new Set(),
        classCount: 0,
        days: new Set(),
        times: new Set(),
      });
    }

    const entry = grouped.get(sid)!;
    entry.classCount += 1;

    const courseName = courseMap.get(String(a.courseId || ''));
    if (courseName) entry.courses.add(courseName);

    if (Array.isArray(a.daysOfWeek)) {
      for (const d of a.daysOfWeek) entry.days.add(String(d));
    }

    const start = String(a.startTime || '').trim();
    const end = String(a.endTime || '').trim();
    if (start && end) entry.times.add(`${start} – ${end}`);
  }

  const serialized = Array.from(grouped.values()).map((entry) => ({
    _id: String(entry.student._id),
    name: String(entry.student.name || 'Student'),
    imageUrl: String(entry.student.imageUrl || ''),
    isActive: entry.student.isActive !== false,
    courses: Array.from(entry.courses),
    classCount: entry.classCount,
    days: Array.from(entry.days),
    timeSlots: Array.from(entry.times),
  }));

  return {
    teacher: {
      _id: String(teacher._id),
      name: String(teacher.name || ''),
      email: String(teacher.email || ''),
      subjects: Array.isArray(teacher.subjects)
        ? teacher.subjects.map(String)
        : [],
    },
    academy: academy
      ? { _id: String(academy._id), name: String(academy.name || '') }
      : null,
    students: serialized,
  };
}

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

  const email = normalizeEmail(decoded.email);
  if (!email) redirect('/login');

  const data = await getStudentsData(email);

  if (!data) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="h-6 w-6 text-slate-400" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-slate-900">
          No academy assigned
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          You&apos;re not linked to any academy yet. Please contact your
          administrator.
        </p>
        <Link
          href="/teacher/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <StudentsView
        teacher={data.teacher}
        academy={data.academy}
        students={data.students}
      />
    </div>
  );
}