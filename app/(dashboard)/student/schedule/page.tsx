import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';

import { ArrowLeft, GraduationCap } from 'lucide-react';

import ScheduleView from './ScheduleView';

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
   Data Fetch
   ====================================================== */

async function getScheduleData(email: string) {
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

  /* ---------- Fetch assignments ---------- */

  const assignments = await Assignment.find({
    academyId: student.academyId,
    studentId: student._id,
    status: { $ne: 'cancelled' },
  })
    .sort({ startTime: 1, createdAt: 1 })
    .lean();

  /* ---------- Get teachers + courses ---------- */

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
          .select('_id name')
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

  const teacherMap = new Map(teachers.map((t: any) => [String(t._id), t]));
  const courseMap = new Map(
    courses.map((c: any) => [
      String(c._id),
      String((c as any).name || (c as any).title || 'Course'),
    ])
  );

  /* ---------- Merge same class across multiple days ---------- */

  const merged = new Map<string, any>();

  for (const a of assignments as any[]) {
    // Same class = same teacher + course + time
    const key = [
      String(a.teacherId || ''),
      String(a.courseId || ''),
      String(a.startTime || ''),
      String(a.endTime || ''),
      String(a.zoomTimezone || 'Asia/Karachi'),
    ].join('|');

    const teacher = teacherMap.get(String(a.teacherId));
    const courseName = courseMap.get(String(a.courseId)) || 'Course';
    const days = Array.isArray(a.daysOfWeek)
      ? a.daysOfWeek.map((d: any) => String(d))
      : [];

    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        _id: String(a._id),
        courseName,
        teacherName: String(teacher?.name || 'Teacher'),
        daysOfWeek: [...days],
        startTime: String(a.startTime || ''),
        endTime: String(a.endTime || ''),
        status: String(a.status || 'scheduled'),
        notes: String(a.notes || ''),
        zoomMeetingNumber: String(a.zoomMeetingNumber || ''),
        zoomPassword: String(a.zoomPassword || ''),
        zoomLink: String(a.zoomLink || ''),
        zoomTimezone: String(a.zoomTimezone || 'Asia/Karachi'),
        hasZoom: Boolean(a.zoomMeetingNumber),
      });
      continue;
    }

    // Merge days
    existing.daysOfWeek.push(...days);

    // Take notes if missing
    if (!existing.notes && a.notes) existing.notes = String(a.notes);

    // Prefer ongoing status
    if (a.status === 'ongoing') existing.status = 'ongoing';

    // Take zoom if missing
    if (!existing.zoomMeetingNumber && a.zoomMeetingNumber) {
      existing.zoomMeetingNumber = String(a.zoomMeetingNumber);
      existing.zoomPassword = String(a.zoomPassword || '');
      existing.zoomLink = String(a.zoomLink || '');
      existing.hasZoom = true;
    }
  }

  /* ---------- Serialize + sort days ---------- */

  const rows = Array.from(merged.values()).map((r) => ({
    ...r,
    daysOfWeek: sortDays(r.daysOfWeek),
  }));

  rows.sort((a, b) =>
    String(a.startTime).localeCompare(String(b.startTime))
  );

  return {
    student: {
      _id: String(student._id),
      name: String(student.name || 'Student'),
      email: String(student.email || ''),
      classLevel: String((student as any).classLevel || ''),
    },
    academy: academy
      ? { _id: String(academy._id), name: String((academy as any).name || '') }
      : null,
    rows,
  };
}

/* ======================================================
   Page
   ====================================================== */

export default async function StudentSchedulePage() {
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

  const data = await getScheduleData(userEmail);

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
              No Schedule Found
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-0 pb-10">
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <ScheduleView
        student={data.student}
        academy={data.academy}
        classes={data.rows}
      />
    </div>
  );
}