import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import Subscription from '@/models/Subscription';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';
import Course from '@/models/Course';

import ClassesView from './ClassesView';

export const dynamic = 'force-dynamic';

const DAY_ORDER = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

type PlanReason =
  | 'active' | 'no-subscription' | 'pending' | 'expired' | 'unpaid' | 'no-academy';

function normalizeEmail(v: unknown): string {
  return String(v || '').trim().toLowerCase();
}

function sortDays(days: string[]): string[] {
  return [...new Set(days.map((d) => String(d || '').trim()).filter(Boolean))].sort(
    (a, b) => {
      const ai = DAY_ORDER.indexOf(a);
      const bi = DAY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
  );
}

function getClassKey(a: any): string {
  return [a.studentId, a.courseId, a.teacherId, a.startTime, a.endTime, 'Asia/Karachi']
    .map((v) => String(v || ''))
    .join('|');
}

async function checkAcademyPlan(academyId: unknown) {
  if (!academyId) return { hasPlan: false, reason: 'no-academy' as PlanReason };
  const now = new Date();

  const active = await Subscription.findOne({
    academyId,
    $or: [{ paymentStatus: 'paid' }, { status: 'active' }, { status: 'trial' }],
    $and: [
      { $or: [{ endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } }] },
    ],
  }).sort({ createdAt: -1 }).lean();

  if (active) return { hasPlan: true, reason: 'active' as PlanReason };

  const latest: any = await Subscription.findOne({ academyId })
    .sort({ createdAt: -1 }).lean();

  if (!latest) return { hasPlan: false, reason: 'no-subscription' as PlanReason };

  const status = String(latest.status || '').toLowerCase();
  const endDate = latest.endDate ? new Date(latest.endDate) : null;

  if (endDate && endDate.getTime() < now.getTime()) return { hasPlan: false, reason: 'expired' as PlanReason };
  if (status === 'cancelled') return { hasPlan: false, reason: 'expired' as PlanReason };
  if (status === 'pending') return { hasPlan: false, reason: 'pending' as PlanReason };
  return { hasPlan: false, reason: 'unpaid' as PlanReason };
}

async function findTeacher(userId: unknown, email: string) {
  if (userId) {
    const t = await Teacher.findOne({ $or: [{ userId }, { user: userId }] })
      .select('_id name email academyId active').lean();
    if (t) return t;
  }
  if (email) {
    const t = await Teacher.findOne({ email })
      .select('_id name email academyId active').lean();
    if (t) return t;
  }
  return null;
}

async function getTeacherSchedule() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  let decoded: any;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    redirect('/login');
  }
  if (!decoded?.userId) redirect('/login');

  await connectDB();

  const user: any = await User.findById(decoded.userId).select('name email').lean();
  if (!user) redirect('/login');

  const email = normalizeEmail(user.email);
  const teacher: any = await findTeacher(decoded.userId, email);

  const fallback = {
    teacherName: String(user.name || 'Teacher'),
    teacherEmail: email,
    rows: [] as any[],
    hasPlan: false,
    academyName: '',
    planReason: 'no-academy' as PlanReason,
  };

  if (!teacher || teacher.active === false || !teacher.academyId) return fallback;

  const academy: any = await Academy.findById(teacher.academyId)
    .select('name slug').lean();
  if (!academy) return fallback;

  const plan = await checkAcademyPlan(teacher.academyId);
  if (!plan.hasPlan) {
    return {
      ...fallback,
      teacherName: String(teacher.name || user.name || 'Teacher'),
      academyName: String(academy.name || ''),
      planReason: plan.reason,
    };
  }

  const assignments: any[] = await Assignment.find({
    academyId: teacher.academyId,
    teacherId: teacher._id,
    status: { $ne: 'cancelled' },
  })
    .select('studentId teacherId courseId daysOfWeek startTime endTime status notes livekitRoomName livekitHostIdentity livekitProvider')
    .sort({ startTime: 1, createdAt: 1 })
    .lean();

  const studentIds = [...new Set(assignments.map((a) => a.studentId).filter(Boolean).map(String))];
  const courseIds = [...new Set(assignments.map((a) => a.courseId).filter(Boolean).map(String))];

  const [students, courses] = await Promise.all([
    studentIds.length
      ? Student.find({ _id: { $in: studentIds }, academyId: teacher.academyId })
          .select('name fatherName').lean()
      : Promise.resolve([]),
    courseIds.length
      ? Course.find({ _id: { $in: courseIds }, academyId: teacher.academyId })
          .select('name title totalPages').lean()
      : Promise.resolve([]),
  ]);

  const studentMap = new Map(
    students.map((s: any) => [String(s._id), {
      name: String(s.name || 'Student'),
      fatherName: String(s.fatherName || ''),
    }])
  );
  const courseMap = new Map(
    courses.map((c: any) => [String(c._id), {
      name: String(c.name || c.title || 'Course'),
      totalPages: Number(c.totalPages || 0),
    }])
  );

  const merged = new Map<string, any>();

  for (const a of assignments) {
    const key = getClassKey(a);
    const student = studentMap.get(String(a.studentId));
    const course = courseMap.get(String(a.courseId));
    const courseName = course?.name || 'Course';
    const days = Array.isArray(a.daysOfWeek) ? a.daysOfWeek : [];
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        _id: String(a._id),
        studentName: student?.name || 'Student',
        fatherName: student?.fatherName || '',
        courseName,
        courseId: String(a.courseId || ''),
        totalPages: course?.totalPages || 0,
        daysOfWeek: days.map(String),
        startTime: String(a.startTime || ''),
        endTime: String(a.endTime || ''),
        status: String(a.status || 'scheduled'),
        notes: String(a.notes || ''),
        livekitRoomName: String(a.livekitRoomName || ''),
        livekitHostIdentity: String(a.livekitHostIdentity || ''),
        livekitProvider: String(a.livekitProvider || 'none'),
      });
      continue;
    }

    existing.daysOfWeek.push(...days.map(String));
    if (!existing.livekitRoomName && a.livekitRoomName) {
      existing.livekitRoomName = String(a.livekitRoomName || '');
      existing.livekitHostIdentity = String(a.livekitHostIdentity || '');
      existing.livekitProvider = String(a.livekitProvider || 'livekit');
    }
    if (!existing.notes && a.notes) existing.notes = String(a.notes);
    if (a.status === 'ongoing') existing.status = 'ongoing';
  }

  const rows = Array.from(merged.values()).map((r) => ({
    ...r,
    daysOfWeek: sortDays(r.daysOfWeek),
  }));
  rows.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

  return {
    teacherName: String(teacher.name || user.name || 'Teacher'),
    teacherEmail: email,
    rows,
    hasPlan: true,
    academyName: String(academy.name || ''),
    planReason: 'active' as PlanReason,
  };
}

export default async function TeacherClassesPage() {
  const { teacherName, teacherEmail, rows, hasPlan, academyName, planReason } =
    await getTeacherSchedule();

  return (
    <ClassesView
      teacherName={teacherName}
      teacherEmail={teacherEmail}
      classes={rows}
      hasPlan={hasPlan}
      academyName={academyName}
      planReason={planReason}
    />
  );
}