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

/* ============================================================
   CONSTANTS
   ============================================================ */

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function sortDays(days: string[]): string[] {
  return [
    ...new Set(days.map((day) => String(day || '').trim()).filter(Boolean)),
  ].sort((a, b) => {
    const indexA = DAY_ORDER.indexOf(a);
    const indexB = DAY_ORDER.indexOf(b);

    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

function getClassKey(assignment: any): string {
  return [
    String(assignment.studentId || ''),
    String(assignment.courseId || ''),
    String(assignment.teacherId || ''),
    String(assignment.startTime || ''),
    String(assignment.endTime || ''),
    'Asia/Karachi',
  ].join('|');
}

/* ============================================================
   ✅ PLAN CHECK — MULTIPLE SUBSCRIPTIONS SUPPORT
   ============================================================
   اگر academy کے پاس ایک سے زیادہ subscriptions ہوں اور
   کوئی بھی active ہو → plan چل رہا ہے۔
   ============================================================ */

type PlanReason =
  | 'active'
  | 'no-subscription'
  | 'pending'
  | 'expired'
  | 'unpaid'
  | 'no-academy';

type PlanCheckResult = {
  hasPlan: boolean;
  reason: PlanReason;
};

async function checkAcademyPlan(
  academyId: unknown
): Promise<PlanCheckResult> {
  if (!academyId) {
    return { hasPlan: false, reason: 'no-academy' };
  }

  const now = new Date();

  /* ============================================================
     ✅ 1. کوئی بھی ACTIVE subscription ڈھونڈیں
     (پرانی ہو یا نئی — اگر active ہے تو plan چل رہا ہے)
     ============================================================ */
  const activeSubscription = await Subscription.findOne({
    academyId,
    $or: [
      { paymentStatus: 'paid' },
      { status: 'active' },
      { status: 'trial' },
    ],
    $and: [
      {
        $or: [
          { endDate: { $gte: now } },
          { endDate: null },
          { endDate: { $exists: false } },
        ],
      },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  if (activeSubscription) {
    return { hasPlan: true, reason: 'active' };
  }

  /* ============================================================
     ✅ 2. کوئی active نہیں → latest subscription کا reason بتائیں
     ============================================================ */
  const latest = await Subscription.findOne({ academyId })
    .sort({ createdAt: -1 })
    .lean();

  if (!latest) {
    return { hasPlan: false, reason: 'no-subscription' };
  }

  const status = String((latest as any).status || '').toLowerCase();
  const endDate = (latest as any).endDate
    ? new Date((latest as any).endDate)
    : null;

  /* Expired */
  if (endDate && endDate.getTime() < now.getTime()) {
    return { hasPlan: false, reason: 'expired' };
  }

  /* Cancelled */
  if (status === 'cancelled') {
    return { hasPlan: false, reason: 'expired' };
  }

  /* Pending */
  if (status === 'pending') {
    return { hasPlan: false, reason: 'pending' };
  }

  /* باقی — unpaid */
  return { hasPlan: false, reason: 'unpaid' };
}

/* ============================================================
   ✅ TEACHER LOOKUP — email + userId fallback
   ============================================================ */

async function findTeacherForUser(
  userId: unknown,
  userEmail: string
): Promise<any | null> {
  /* Try 1: userId */
  if (userId) {
    try {
      const byUserId = await Teacher.findOne({
        $or: [{ userId }, { user: userId }],
      })
        .select('_id name email academyId active')
        .lean();

      if (byUserId) return byUserId;
    } catch {
      // silent
    }
  }

  /* Try 2: email */
  if (userEmail) {
    const byEmail = await Teacher.findOne({ email: userEmail })
      .select('_id name email academyId active')
      .lean();

    if (byEmail) return byEmail;
  }

  return null;
}

/* ============================================================
   ✅ SCHEDULE FETCHER
   ============================================================ */

async function getTeacherSchedule() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

  let decoded: any;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch {
    redirect('/login');
  }

  if (!decoded?.userId) redirect('/login');

  await connectDB();

  const user = await User.findById(decoded.userId)
    .select('name email role')
    .lean();

  if (!user) redirect('/login');

  const userEmail = normalizeEmail((user as any).email);

  /* ---------- Teacher Lookup ---------- */
  const teacher = await findTeacherForUser(decoded.userId, userEmail);

  /* ---------- No Teacher Record ---------- */
  if (!teacher) {
    return {
      teacherName: String((user as any).name || 'Teacher'),
      teacherEmail: userEmail,
      rows: [],
      hasPlan: false,
      academyName: '',
      planReason: 'no-academy' as PlanReason,
    };
  }

  /* ---------- Not Active ---------- */
  if ((teacher as any).active === false) {
    return {
      teacherName: String(
        (teacher as any).name || (user as any).name || 'Teacher'
      ),
      teacherEmail: userEmail,
      rows: [],
      hasPlan: false,
      academyName: '',
      planReason: 'no-academy' as PlanReason,
    };
  }

  /* ---------- No Academy ---------- */
  if (!(teacher as any).academyId) {
    return {
      teacherName: String(
        (teacher as any).name || (user as any).name || 'Teacher'
      ),
      teacherEmail: userEmail,
      rows: [],
      hasPlan: false,
      academyName: '',
      planReason: 'no-academy' as PlanReason,
    };
  }

  /* ---------- Academy ---------- */
  const academy = await Academy.findById((teacher as any).academyId)
    .select('name slug')
    .lean();

  if (!academy) {
    return {
      teacherName: String(
        (teacher as any).name || (user as any).name || 'Teacher'
      ),
      teacherEmail: userEmail,
      rows: [],
      hasPlan: false,
      academyName: '',
      planReason: 'no-academy' as PlanReason,
    };
  }

  /* ---------- Plan Check ---------- */
  const planResult = await checkAcademyPlan((teacher as any).academyId);

  if (!planResult.hasPlan) {
    return {
      teacherName: String(
        (teacher as any).name || (user as any).name || 'Teacher'
      ),
      teacherEmail: userEmail,
      rows: [],
      hasPlan: false,
      academyName: String((academy as any).name || ''),
      planReason: planResult.reason,
    };
  }

  /* ---------- Fetch Classes (active plan) ---------- */
  const assignments = await Assignment.find({
    academyId: (teacher as any).academyId,
    teacherId: (teacher as any)._id,
    status: { $ne: 'cancelled' },
  })
    .select(
      [
        'studentId',
        'teacherId',
        'courseId',
        'daysOfWeek',
        'startTime',
        'endTime',
        'status',
        'notes',
        'livekitRoomName',
        'livekitHostIdentity',
        'livekitProvider',
      ].join(' ')
    )
    .sort({ startTime: 1, createdAt: 1 })
    .lean();

  const studentIds = [
    ...new Set(
      assignments
        .map((item: any) => item.studentId)
        .filter(Boolean)
        .map((id: any) => String(id))
    ),
  ];

  const courseIds = [
    ...new Set(
      assignments
        .map((item: any) => item.courseId)
        .filter(Boolean)
        .map((id: any) => String(id))
    ),
  ];

  const [students, courses] = await Promise.all([
    studentIds.length
      ? Student.find({
          _id: { $in: studentIds },
          academyId: (teacher as any).academyId,
        })
          .select('name fatherName')
          .lean()
      : Promise.resolve([]),

    courseIds.length
      ? Course.find({
          _id: { $in: courseIds },
          academyId: (teacher as any).academyId,
        })
          .select('name title')
          .lean()
      : Promise.resolve([]),
  ]);

  const studentMap = new Map(
    students.map((student: any) => [
      String(student._id),
      {
        name: String(student.name || 'Student'),
        fatherName: String(student.fatherName || ''),
      },
    ])
  );

  const courseMap = new Map(
    courses.map((course: any) => [
      String(course._id),
      String(course.name || course.title || 'Course'),
    ])
  );

  /* ---------- Merge Same Class ---------- */
  const mergedClasses = new Map<string, any>();

  for (const assignment of assignments as any[]) {
    const classKey = getClassKey(assignment);

    const student = studentMap.get(String(assignment.studentId));
    const courseName = courseMap.get(String(assignment.courseId)) || 'Course';

    const assignmentDays = Array.isArray(assignment.daysOfWeek)
      ? assignment.daysOfWeek
      : [];

    const existing = mergedClasses.get(classKey);

    if (!existing) {
      mergedClasses.set(classKey, {
        _id: String(assignment._id),
        studentName: student?.name || 'Student',
        fatherName: student?.fatherName || '',
        courseName,
        daysOfWeek: [...assignmentDays.map((day: any) => String(day))],
        startTime: String(assignment.startTime || ''),
        endTime: String(assignment.endTime || ''),
        status: String(assignment.status || 'scheduled'),
        notes: String(assignment.notes || ''),
        livekitRoomName: String(assignment.livekitRoomName || ''),
        livekitHostIdentity: String(assignment.livekitHostIdentity || ''),
        livekitProvider: String(assignment.livekitProvider || 'none'),
      });
      continue;
    }

    existing.daysOfWeek.push(...assignmentDays.map((day: any) => String(day)));

    if (!existing.livekitRoomName && assignment.livekitRoomName) {
      existing.livekitRoomName = String(assignment.livekitRoomName || '');
      existing.livekitHostIdentity = String(
        assignment.livekitHostIdentity || ''
      );
      existing.livekitProvider = String(
        assignment.livekitProvider || 'livekit'
      );
    }

    if (!existing.notes && assignment.notes) {
      existing.notes = String(assignment.notes);
    }

    if (assignment.status === 'ongoing') {
      existing.status = 'ongoing';
    }
  }

  const rows = Array.from(mergedClasses.values()).map((row) => ({
    ...row,
    daysOfWeek: sortDays(row.daysOfWeek),
  }));

  rows.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

  return {
    teacherName: String(
      (teacher as any).name || (user as any).name || 'Teacher'
    ),
    teacherEmail: userEmail,
    rows,
    hasPlan: true,
    academyName: String((academy as any).name || ''),
    planReason: 'active' as PlanReason,
  };
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function TeacherClassesPage() {
  const {
    teacherName,
    teacherEmail,
    rows,
    hasPlan,
    academyName,
    planReason,
  } = await getTeacherSchedule();

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