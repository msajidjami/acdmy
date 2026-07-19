// app/teacher/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import TeacherHome from '@/app/components/home/TeacherHome';
import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/app/models/Teacher';
import Course from '@/app/models/Course';
import Enrollment from '@/app/models/Enrollment';
import Assignment from '@/app/models/Assignment';
import Attendance from '@/app/models/Attendance';
import Message from '@/app/models/Message';

// ─── Types ──────────────────────────────────────────────────────────

interface SessionUser {
  id: string;
  userId: string;
  email: string;
  role: string;
  name: string;
  isVerified: boolean;
}

// ─── Session Extraction ─────────────────────────────────────────────

async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || decoded.email.split('@')[0] || 'Teacher',
      isVerified: decoded.isVerified ?? false,
    };
  } catch {
    return null;
  }
}

// ─── Data Fetching ──────────────────────────────────────────────────

async function fetchTeacherData(session: SessionUser) {
  await connectDB();

  // ✅ Find teacher by email (not userId)
  const teacher = await Teacher.findOne({ email: session.email }).lean();
  if (!teacher) return null;

  // ✅ Use teacher's _id or email to find courses
  // Assuming Course.instructor is a string (email) or ObjectId, we'll use email
  const courses = await Course.find({ instructor: session.email }).lean();
  const courseIds = courses.map(c => c._id);

  const studentsCount = await Enrollment.countDocuments({
    courseId: { $in: courseIds },
    status: 'active',
  });

  // Today's classes
  const today = new Date().toLocaleDateString('en', { weekday: 'long' });
  const todayClasses = courses
    .filter(c => c.schedule?.some((s: any) => s.day === today))
    .map(c => ({
      time: c.schedule?.find((s: any) => s.day === today)?.time || '10:00 AM',
      subject: c.title,
      students: c.studentsEnrolled || 0,
    }))
    .slice(0, 5);

  // Upcoming classes (next 7 days)
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayIndex = daysOfWeek.indexOf(today);
  const upcomingClasses = [];
  for (let i = 1; i <= 7; i++) {
    const day = daysOfWeek[(todayIndex + i) % 7];
    const dayCourses = courses
      .filter(c => c.schedule?.some((s: any) => s.day === day))
      .map(c => ({
        time: c.schedule?.find((s: any) => s.day === day)?.time || '10:00 AM',
        subject: c.title,
        students: c.studentsEnrolled || 0,
      }));
    upcomingClasses.push(...dayCourses);
  }
  const upcomingClassesLimited = upcomingClasses.slice(0, 5);

  // Assignments to check
  const assignmentsToCheck = await Assignment.countDocuments({
    courseId: { $in: courseIds },
    status: 'submitted',
  });

  // Recent messages
  const recentMessages = await Message.find({
    receiverId: session.userId,
    isRead: false,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Attendance records
  const attendance = await Attendance.find({
    courseId: { $in: courseIds },
  })
    .sort({ date: -1 })
    .limit(5)
    .lean();

  // Weekly schedule
  const schedule = daysOfWeek.map(day => {
    const dayCourses = courses
      .filter(c => c.schedule?.some((s: any) => s.day === day))
      .map(c => ({
        time: c.schedule?.find((s: any) => s.day === day)?.time || '10:00 AM',
        subject: c.title,
      }));
    return {
      day,
      time: dayCourses.length > 0 ? dayCourses[0].time : 'No class',
      subject: dayCourses.length > 0 ? dayCourses[0].subject : 'Free',
    };
  });

  // Serialize plain objects
  return {
    todayClasses: todayClasses.length > 0 ? todayClasses : [{ time: 'No class', subject: 'No class', students: 0 }],
    upcomingClasses: upcomingClassesLimited.length > 0 ? upcomingClassesLimited : [{ time: 'No upcoming', subject: 'No upcoming', students: 0 }],
    studentsCount,
    attendance: attendance.map(a => ({
      date: a.date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      present: a.status === 'present' ? 1 : 0,
      total: 1,
    })),
    assignmentsToCheck,
    recentMessages: recentMessages.map(m => ({
      from: m.senderId || 'Unknown',
      message: m.content || 'No message',
      time: m.createdAt?.toISOString().split('T')[0] || 'Today',
    })),
    schedule: schedule.slice(0, 5),
  };
}

// ─── Page Component ────────────────────────────────────────────────

export default async function TeacherDashboardPage() {
  const session = await getSession();

  // اگر صارف لاگ ان نہیں ہے تو لاگ ان پیج پر بھیجیں
  if (!session) {
    redirect('/login');
  }

  // ٹیچر کا ڈیٹا حاصل کریں (email کے ذریعے)
  const teacherData = await fetchTeacherData(session);

  // اگر ٹیچر ڈیٹا نہیں ملا تو ہوم پیج پر بھیجیں
  if (!teacherData) {
    redirect('/');
  }

  // اب ڈیش بورڈ دکھائیں
  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherHome
        user={session}
        {...teacherData}
      />
    </div>
  );
}