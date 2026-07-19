import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';
import Enrollment from '@/app/models/Enrollment';
import Assignment from '@/app/models/Assignment';
import Attendance from '@/app/models/Attendance';

export async function fetchStudentData(userId: string) {
  await connectDB();
  // Fetch real data for student dashboard
  const enrollments = await Enrollment.find({ studentId: userId }).populate('courseId').lean();
  const assignments = await Assignment.find({ studentId: userId }).sort({ dueDate: 1 }).limit(5).lean();
  const attendance = await Attendance.find({ studentId: userId }).sort({ date: -1 }).limit(10).lean();
  const todaySchedule = await Course.find({ 'schedule.date': new Date().toISOString().split('T')[0] }).lean();
  return {
    currentCourse: enrollments[0]?.courseId?.title || 'No course',
    progress: 65, // calculate
    upcomingClasses: todaySchedule.slice(0, 3),
    assignments: assignments.map(a => ({ ...a, _id: a._id.toString() })),
    attendance,
    messages: [], // from messaging system
  };
}