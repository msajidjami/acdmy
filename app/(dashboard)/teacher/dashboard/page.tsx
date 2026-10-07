// app/teacher/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';

import {
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

async function getTeacherData(email: string) {
  await connectDB();

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  const teacher = await Teacher.findOne({ email: normalizedEmail }).lean();
  if (!teacher) return null;

  const academy = teacher.academyId
    ? await Academy.findById(teacher.academyId).lean()
    : null;

  const assignments = await Assignment.find({
    academyId: teacher.academyId,
    teacherId: teacher._id,
    status: { $ne: 'cancelled' },
  })
    .sort({ startTime: 1, createdAt: 1 })
    .lean();

  const studentIds = assignments.map((a: any) => a.studentId).filter(Boolean);

  const students = studentIds.length
    ? await Student.find({
        _id: { $in: studentIds },
        academyId: teacher.academyId,
      }).lean()
    : [];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const todayCount = assignments.filter(
    (a: any) => Array.isArray(a.daysOfWeek) && a.daysOfWeek.includes(today)
  ).length;

  return {
    teacher,
    academy,
    studentCount: students.length,
    classCount: assignments.length,
    todayCount,
    recentClasses: assignments.slice(0, 5),
  };
}

export default async function TeacherDashboardPage() {
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

  const email = String(decoded.email || '').trim().toLowerCase();
  if (!email) redirect('/login');

  const data = await getTeacherData(email);

  if (!data) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
          <AcademicCapIcon className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-slate-900">
          No teacher profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          You're not registered as a teacher in any academy yet. Please contact
          your academy admin.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const { teacher, academy, studentCount, classCount, todayCount, recentClasses } = data;

  const teacherName = teacher.name || 'Teacher';
  const initials = teacherName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">
              {teacherName}
            </h1>
            <p className="text-sm text-slate-500 truncate">
              {academy?.name ? academy.name : 'No academy assigned'}
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
            teacher.isAvailable
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {teacher.isAvailable ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Students" value={studentCount} />
        <StatCard label="Classes" value={classCount} />
        <StatCard label="Today" value={todayCount} />
      </div>

      {/* Recent classes */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent classes
          </h2>
          <Link
            href="/teacher/classes"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all
          </Link>
        </div>

        {recentClasses.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {recentClasses.map((item: any) => (
              <li
                key={item._id}
                className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.title || item.subject || 'Class'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.startTime
                      ? new Date(item.startTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Scheduled'}
                  </p>
                </div>
                <Link
                  href={`/teacher/classes/${item._id}`}
                  className="text-slate-400 hover:text-slate-700 shrink-0"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            No classes yet
          </p>
        )}
      </div>

      {/* Profile details */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          <Link
            href="/teacher/profile"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit
          </Link>
        </div>

        <dl className="divide-y divide-slate-100">
          <Row label="Email" value={teacher.email || '—'} icon={<EnvelopeIcon className="h-4 w-4" />} />
          <Row
            label="Subjects"
            value={
              Array.isArray(teacher.subjects) && teacher.subjects.length
                ? teacher.subjects.join(', ')
                : '—'
            }
            icon={<BookOpenIcon className="h-4 w-4" />}
          />
          <Row
            label="Bio"
            value={teacher.bio || '—'}
            icon={<DocumentTextIcon className="h-4 w-4" />}
          />
        </dl>

        {teacher.audioUrl && (
          <div className="px-4 sm:px-5 py-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Audio introduction
            </p>
            <audio controls className="w-full h-10">
              <source src={teacher.audioUrl} type="audio/mpeg" />
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 sm:px-5 py-3">
      <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 sm:w-28 shrink-0">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="text-sm text-slate-800 break-words sm:flex-1">{value}</dd>
    </div>
  );
}