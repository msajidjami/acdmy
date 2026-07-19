// app/lib/data/teacherData.ts
import connectDB from '../dbConnect';
import Teacher from '@/app/models/Teacher';
import Course from '@/app/models/Course';
import Enrollment from '@/app/models/Enrollment';
import Assignment from '@/app/models/Assignment';
import Attendance from '@/app/models/Attendance';
import Message from '@/app/models/Message';

export async function fetchTeacherData(userId: string) {
  await connectDB();

  // Get teacher profile
  const teacher = await Teacher.findOne({ userId }).lean();

  // Get courses taught by this teacher
  const courses = await Course.find({ instructor: userId }).lean();

  // Get students count (enrollments in teacher's courses)
  const courseIds = courses.map((c) => c._id);
  const studentsCount = await Enrollment.countDocuments({
    courseId: { $in: courseIds },
    status: 'active',
  });

  // Get today's classes
  const today = new Date().toLocaleDateString('en', { weekday: 'long' });
  const todayClasses = courses
    .filter((c) => c.schedule?.some((s: any) => s.day === today))
    .map((c) => ({
      time: c.schedule?.find((s: any) => s.day === today)?.time || '10:00 AM',
      subject: c.title,
      students: c.studentsEnrolled || 0,
    }))
    .slice(0, 5);

  // Get upcoming classes (next 7 days)
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayIndex = daysOfWeek.indexOf(today);
  const upcomingClasses = [];
  for (let i = 1; i <= 7; i++) {
    const day = daysOfWeek[(todayIndex + i) % 7];
    const dayCourses = courses
      .filter((c) => c.schedule?.some((s: any) => s.day === day))
      .map((c) => ({
        time: c.schedule?.find((s: any) => s.day === day)?.time || '10:00 AM',
        subject: c.title,
        students: c.studentsEnrolled || 0,
      }));
    upcomingClasses.push(...dayCourses);
  }
  const upcomingClassesLimited = upcomingClasses.slice(0, 5);

  // Get assignments to check (submitted, not graded)
  const assignmentsToCheck = await Assignment.countDocuments({
    courseId: { $in: courseIds },
    status: 'submitted',
  });

  // Get recent messages
  const recentMessages = await Message.find({
    receiverId: userId,
    isRead: false,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Get attendance records (for quick view)
  const attendance = await Attendance.find({
    courseId: { $in: courseIds },
  })
    .sort({ date: -1 })
    .limit(5)
    .lean();

  // Get weekly schedule (all days)
  const schedule = daysOfWeek.map((day) => {
    const dayCourses = courses
      .filter((c) => c.schedule?.some((s: any) => s.day === day))
      .map((c) => ({
        time: c.schedule?.find((s: any) => s.day === day)?.time || '10:00 AM',
        subject: c.title,
      }));
    return {
      day,
      time: dayCourses.length > 0 ? dayCourses[0].time : 'No class',
      subject: dayCourses.length > 0 ? dayCourses[0].subject : 'Free',
    };
  });

  return {
    todayClasses: todayClasses.length > 0 ? todayClasses : [{ time: 'No class', subject: 'No class', students: 0 }],
    upcomingClasses: upcomingClassesLimited.length > 0 ? upcomingClassesLimited : [{ time: 'No upcoming', subject: 'No upcoming', students: 0 }],
    studentsCount,
    attendance: attendance.map((a: any) => ({
      date: a.date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      present: a.status === 'present' ? 1 : 0,
      total: 1,
    })),
    assignmentsToCheck,
    recentMessages: recentMessages.map((m: any) => ({
      from: m.senderId || 'Unknown',
      message: m.content || 'No message',
      time: m.createdAt?.toISOString().split('T')[0] || 'Today',
    })),
    schedule: schedule.slice(0, 5), // limit to weekdays
  };
}