// app/lib/data/teacherData.ts
import connectDB from '../dbConnect';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import Student from '@/models/Student';
import Assignment from '@/models/Assignment';
import Message from '@/models/Message';

/* ============================================================
   TYPES
   ============================================================ */

type TodayClass = {
  time: string;
  subject: string;
  students: number;
};

type UpcomingClass = {
  time: string;
  subject: string;
  students: number;
};

type ScheduleDay = {
  day: string;
  time: string;
  subject: string;
};

type AttendanceRow = {
  date: string;
  present: number;
  total: number;
};

type RecentMessage = {
  from: string;
  message: string;
  time: string;
};

export type TeacherDataResult = {
  todayClasses: TodayClass[];
  upcomingClasses: UpcomingClass[];
  studentsCount: number;
  attendance: AttendanceRow[];
  assignmentsToCheck: number;
  recentMessages: RecentMessage[];
  schedule: ScheduleDay[];
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/* ============================================================
   HELPERS
   ============================================================ */

function formatTime(time: string): string {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return time || '—';
  const [h, m] = time.split(':');
  const hour = Number(h);
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${period}`;
}

function buildTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

/* ============================================================
   MAIN
   ============================================================ */

export async function fetchTeacherData(
  userId: string
): Promise<TeacherDataResult> {
  await connectDB();

  /* ---------- 1. Teacher profile ---------- */
  const teacher = await Teacher.findOne({ userId }).lean();

  if (!teacher) {
    return {
      todayClasses: [
        { time: 'No class', subject: 'No class', students: 0 },
      ],
      upcomingClasses: [
        { time: 'No upcoming', subject: 'No upcoming', students: 0 },
      ],
      studentsCount: 0,
      attendance: [],
      assignmentsToCheck: 0,
      recentMessages: [],
      schedule: DAYS_OF_WEEK.slice(0, 5).map((day) => ({
        day,
        time: 'No class',
        subject: 'Free',
      })),
    };
  }

  const teacherId = (teacher as any)._id;

  /* ---------- 2. Teacher ke saare assignments ---------- */
  const assignments = await Assignment.find({
    teacherId,
    status: { $in: ['scheduled', 'ongoing', 'completed'] },
  })
    .populate({ path: 'studentId', model: Student, select: 'name email' })
    .populate({ path: 'courseId', model: Course, select: 'title' })
    .lean();

  /* ---------- 3. Unique students ---------- */
  const studentIdSet = new Set<string>();

  for (const a of assignments as any[]) {
    const sid = a.studentId?._id || a.studentId;
    if (sid) studentIdSet.add(String(sid));
  }

  const studentsCount = studentIdSet.size;

  /* ---------- 4. Aaj ke assignments ---------- */
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const todayAssignments = (assignments as any[]).filter(
    (a) => Array.isArray(a.daysOfWeek) && a.daysOfWeek.includes(today)
  );

  const todayClasses: TodayClass[] = todayAssignments
    .map((a) => ({
      time: buildTimeRange(a.startTime, a.endTime),
      subject: a.courseId?.title || 'Course',
      students: 1,
    }))
    .slice(0, 5);

  /* ---------- 5. Aane wale 7 din ---------- */
  const todayIndex = DAYS_OF_WEEK.indexOf(today as any);
  const upcomingClasses: UpcomingClass[] = [];

  for (let i = 1; i <= 7; i++) {
    const day = DAYS_OF_WEEK[(todayIndex + i + 7) % 7];
    const dayAssignments = (assignments as any[]).filter(
      (a) => Array.isArray(a.daysOfWeek) && a.daysOfWeek.includes(day)
    );

    for (const a of dayAssignments) {
      upcomingClasses.push({
        time: buildTimeRange(a.startTime, a.endTime),
        subject: `${a.courseId?.title || 'Course'} · ${day}`,
        students: 1,
      });
    }
  }

  const upcomingClassesLimited = upcomingClasses.slice(0, 5);

  /* ---------- 6. Scheduled assignments count ---------- */
  const assignmentsToCheck = (assignments as any[]).filter(
    (a) => a.status === 'scheduled'
  ).length;

  /* ---------- 7. Recent messages ---------- */
  const recentMessages = await Message.find({
    receiverId: userId,
    isRead: false,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  /* ---------- 8. Weekly schedule (Mon-Fri) ---------- */
  const schedule: ScheduleDay[] = DAYS_OF_WEEK.slice(0, 5).map((day) => {
    const dayAssignments = (assignments as any[]).filter(
      (a) => Array.isArray(a.daysOfWeek) && a.daysOfWeek.includes(day)
    );

    if (dayAssignments.length === 0) {
      return { day, time: 'No class', subject: 'Free' };
    }

    const first = dayAssignments[0];
    const extra = dayAssignments.length - 1;

    return {
      day,
      time: buildTimeRange(first.startTime, first.endTime),
      subject:
        extra > 0
          ? `${first.courseId?.title || 'Course'} (+${extra} more)`
          : first.courseId?.title || 'Course',
    };
  });

  /* ---------- 9. Return ---------- */
  return {
    todayClasses:
      todayClasses.length > 0
        ? todayClasses
        : [{ time: 'No class', subject: 'No class', students: 0 }],

    upcomingClasses:
      upcomingClassesLimited.length > 0
        ? upcomingClassesLimited
        : [{ time: 'No upcoming', subject: 'No upcoming', students: 0 }],

    studentsCount,

    /* Attendance model mein per-student data nahi hai */
    attendance: [],

    assignmentsToCheck,

    recentMessages: recentMessages.map((m: any) => ({
      from: m.senderName || m.senderId || 'Unknown',
      message: m.content || m.subject || 'No message',
      time: m.createdAt
        ? new Date(m.createdAt).toISOString().split('T')[0]
        : 'Today',
    })),

    schedule,
  };
}