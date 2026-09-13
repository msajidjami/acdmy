import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';
import Course from '@/models/Course';

import ClassesView from './ClassesView';

export const dynamic = 'force-dynamic';

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

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

  if (!decoded?.userId || !decoded?.email) redirect('/login');

  await connectDB();

  const user = await User.findById(decoded.userId)
    .select('name email role')
    .lean();

  if (!user) redirect('/login');

  const sessionEmail = normalizeEmail(decoded.email);
  const userEmail = normalizeEmail((user as any).email);

  if (!sessionEmail || sessionEmail !== userEmail) redirect('/login');

  const teacher = await Teacher.findOne({ email: userEmail })
    .select('_id name email academyId')
    .lean();

  if (!teacher?.academyId) {
    return {
      teacherName: String((user as any).name || 'Teacher'),
      teacherEmail: userEmail,
      rows: [],
    };
  }

  // ✅ LiveKit fields منتخب کریں
  const assignments = await Assignment.find({
    academyId: teacher.academyId,
    teacherId: teacher._id,
    status: { $ne: 'cancelled' },
  })
    .select(
      [
        'studentId', 'teacherId', 'courseId',
        'daysOfWeek', 'startTime', 'endTime', 'status', 'notes',
        'livekitRoomName', 'livekitHostIdentity', 'livekitProvider',
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
    Student.find({
      _id: { $in: studentIds },
      academyId: teacher.academyId,
    })
      .select('name fatherName')
      .lean(),

    Course.find({
      _id: { $in: courseIds },
      academyId: teacher.academyId,
    })
      .select('name title')
      .lean(),
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

  /* Merge same class across multiple weekday records */
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
        // ✅ LiveKit fields
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
    teacherName: String(teacher.name || (user as any).name || 'Teacher'),
    teacherEmail: userEmail,
    rows,
  };
}

export default async function TeacherClassesPage() {
  const { teacherName, teacherEmail, rows } = await getTeacherSchedule();

  return (
    <ClassesView
      teacherName={teacherName}
      teacherEmail={teacherEmail}
      classes={rows}
    />
  );
}