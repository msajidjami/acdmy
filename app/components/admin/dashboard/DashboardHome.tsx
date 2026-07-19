// app/admin/page.tsx (full corrected)
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'; // ✅ added for ObjectId validation
import connectDB from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import Teacher from '@/app/models/Teacher';
import Course from '@/app/models/Course';
import Enrollment from '@/app/models/Enrollment';
import Admission from '@/app/models/Admission';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
  TrendingUp,
  Clock,
  UserPlus,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import AssignTeacherModal from '@/app/components/admin/AssignTeacherModal';

// ─── Session & Auth ────────────────────────────────────────────────

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  name: string;
  isVerified: boolean;
}

async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || decoded.email.split('@')[0] || 'Admin',
      isVerified: decoded.isVerified ?? false,
    };
  } catch {
    return null;
  }
}

const ADMIN_ROLES = [
  'admin',
  'owner',
  'super-admin',
  'education-admin',
  'darul-ifta-admin',
  'section1-admin',
  'section2-admin',
];

// ─── Dashboard Data ─────────────────────────────────────────────────

async function getDashboardData() {
  await connectDB();

  // ── Counts ──────────────────────────────────────────────────────
  const [
    totalTeachers,
    totalStudents,
    totalCourses,
    totalAdmissions,
    pendingAdmissions,
    totalEnrollments,
    pendingEnrollments,
    activeEnrollments,
    completedEnrollments,
  ] = await Promise.all([
    Teacher.countDocuments({ active: true }),
    User.countDocuments({ role: 'user' }),
    Course.countDocuments({ isActive: true }),
    Admission.countDocuments({}),
    Admission.countDocuments({ currentStatus: 'pending' }),
    Enrollment.countDocuments({}),
    Enrollment.countDocuments({ status: 'pending' }),
    Enrollment.countDocuments({ status: 'active' }),
    Enrollment.countDocuments({ status: 'completed' }),
  ]);

  // ── Assigned Teachers Count ────────────────────────────────────
  const coursesWithInstructor = await Course.find({ instructor: { $ne: null } })
    .select('_id')
    .lean();
  const courseIds = coursesWithInstructor.map(c => c._id);
  const assignedTeachers = await Enrollment.countDocuments({
    status: 'active',
    courseId: { $in: courseIds },
  });

  // ── Recent Enrollments ──────────────────────────────────────────
  const recentEnrollmentsRaw = await Enrollment.find({})
    .sort({ enrolledAt: -1 })
    .limit(8)
    .lean();

  // Filter valid ObjectIds
  const validStudentIds = recentEnrollmentsRaw
    .map(e => e.studentId)
    .filter(id => id && mongoose.Types.ObjectId.isValid(id.toString()));

  const validCourseIds = recentEnrollmentsRaw
    .map(e => e.courseId)
    .filter(id => id && mongoose.Types.ObjectId.isValid(id.toString()));

  const students = await User.find({ _id: { $in: validStudentIds } }).select('name email').lean();
  const courses = await Course.find({ _id: { $in: validCourseIds } })
    .populate('instructor', 'fullName')
    .lean();

  const studentMap = Object.fromEntries(students.map(s => [s._id.toString(), s]));
  const courseMap = Object.fromEntries(courses.map(c => [c._id.toString(), c]));

  const formattedEnrollments = recentEnrollmentsRaw.map((enr: any) => {
    const student = studentMap[enr.studentId?.toString()];
    const course = courseMap[enr.courseId?.toString()];
    const courseTitle = course?.title || (enr.courseId?.toString() || 'Unknown');
    return {
      id: enr._id.toString(),
      studentName: student?.name || 'Unknown',
      studentEmail: student?.email || '',
      courseTitle,
      teacherName: course?.instructor?.fullName || 'Not Assigned',
      enrolledAt: enr.enrolledAt?.toISOString().split('T')[0] || 'N/A',
      progress: enr.progress || 0,
      status: enr.status || 'pending',
    };
  });

  // ── Pending Enrollments ────────────────────────────────────────
  const pendingEnrollmentsRaw = await Enrollment.find({ status: 'pending' })
    .sort({ enrolledAt: -1 })
    .limit(5)
    .lean();

  const pendingValidStudentIds = pendingEnrollmentsRaw
    .map(e => e.studentId)
    .filter(id => id && mongoose.Types.ObjectId.isValid(id.toString()));

  const pendingValidCourseIds = pendingEnrollmentsRaw
    .map(e => e.courseId)
    .filter(id => id && mongoose.Types.ObjectId.isValid(id.toString()));

  const pendingStudents = await User.find({ _id: { $in: pendingValidStudentIds } }).select('name email').lean();
  const pendingCourses = await Course.find({ _id: { $in: pendingValidCourseIds } }).select('title').lean();

  const pendingStudentMap = Object.fromEntries(pendingStudents.map(s => [s._id.toString(), s]));
  const pendingCourseMap = Object.fromEntries(pendingCourses.map(c => [c._id.toString(), c]));

  const pendingEnrollmentsList = pendingEnrollmentsRaw.map((e: any) => {
    const student = pendingStudentMap[e.studentId?.toString()];
    const course = pendingCourseMap[e.courseId?.toString()];
    const courseTitle = course?.title || (e.courseId?.toString() || 'Unknown');
    return {
      id: e._id.toString(),
      studentName: student?.name || 'Unknown',
      studentEmail: student?.email || '',
      courseTitle,
      enrolledAt: e.enrolledAt?.toISOString().split('T')[0] || 'N/A',
    };
  });

  // ── Recent Students & Teachers (Activities) ────────────────────
  const recentStudents = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email createdAt')
    .lean();

  const recentTeachers = await Teacher.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select('fullName email qualification createdAt')
    .lean();

  // ── Stats Cards ─────────────────────────────────────────────────
  const statsCards = [
    { title: 'Teachers', value: totalTeachers, icon: Users, href: '/admin/teachers', color: 'bg-blue-500' },
    { title: 'Students', value: totalStudents, icon: GraduationCap, href: '/admin/students', color: 'bg-green-500' },
    { title: 'Courses', value: totalCourses, icon: BookOpen, href: '/admin/courses', color: 'bg-purple-500' },
    { title: 'Admissions', value: totalAdmissions, icon: UserCheck, href: '/admin/admissions', color: 'bg-orange-500' },
    { title: 'Pending Admissions', value: pendingAdmissions, icon: Clock, href: '/admin/admissions?status=pending', color: 'bg-red-500' },
    { title: 'Active Enrollments', value: activeEnrollments, icon: TrendingUp, href: '/admin/enrollments?status=active', color: 'bg-emerald-500' },
    { title: 'Pending Enrollments', value: pendingEnrollments, icon: Clock, href: '/admin/enrollments?status=pending', color: 'bg-yellow-500' },
    { title: 'Completed Enrollments', value: completedEnrollments, icon: CheckCircle, href: '/admin/enrollments?status=completed', color: 'bg-indigo-500' },
    { title: 'Assigned Teachers', value: assignedTeachers, icon: UserPlus, href: '/admin/enrollments?assigned=true', color: 'bg-cyan-500' },
  ];

  // ── Activities ──────────────────────────────────────────────────
  const activities = [
    ...recentStudents.map((s: any) => ({
      id: s._id.toString(),
      user: s.name,
      action: 'Registered as student',
      date: s.createdAt?.toISOString().split('T')[0] || 'Today',
      status: 'Completed',
    })),
    ...recentTeachers.map((t: any) => ({
      id: t._id.toString(),
      user: t.fullName,
      action: 'Registered as teacher',
      date: t.createdAt?.toISOString().split('T')[0] || 'Today',
      status: 'Completed',
    })),
  ].sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 6);

  return {
    statsCards,
    recentEnrollments: formattedEnrollments,
    pendingEnrollments: pendingEnrollmentsList,
    activities,
  };
}

// ─── Page ────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const data = await getDashboardData();

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {session.name}! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-2xl shadow hover:shadow-xl transition p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
                </div>
                <div className={`${card.color} h-12 w-12 rounded-xl flex items-center justify-center text-white`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="mt-4 text-sm font-medium text-emerald-600">View Details →</div>
            </Link>
          );
        })}
      </div>

      {/* Assign Teacher Button */}
      <div className="flex justify-end">
        <AssignTeacherModal />
      </div>

      {/* Two-column */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Recent Enrollments</h3>
            <Link href="/admin/enrollments" className="text-sm text-emerald-600 hover:underline">
              View all →
            </Link>
          </div>

          {data.recentEnrollments.length === 0 ? (
            <p className="text-gray-500">No enrollments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-medium">Student</th>
                    <th className="text-left py-2 px-2 font-medium">Course</th>
                    <th className="text-left py-2 px-2 font-medium">Teacher</th>
                    <th className="text-left py-2 px-2 font-medium">Status</th>
                    <th className="text-left py-2 px-2 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEnrollments.map((enr) => (
                    <tr key={enr.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2">{enr.studentName}</td>
                      <td className="py-2 px-2">{enr.courseTitle}</td>
                      <td className="py-2 px-2">
                        {enr.teacherName !== 'Not Assigned' ? (
                          <span className="text-emerald-600">{enr.teacherName}</span>
                        ) : (
                          <span className="text-red-500 text-xs">Not Assigned</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          enr.status === 'active' ? 'bg-green-100 text-green-700' :
                          enr.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          enr.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {enr.status}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{enr.progress}%</span>
                          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${enr.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Enrollments */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Pending Enrollments</h3>
            <Link href="/admin/enrollments?status=pending" className="text-sm text-yellow-600 hover:underline">
              View all →
            </Link>
          </div>

          {data.pendingEnrollments.length === 0 ? (
            <p className="text-gray-500">No pending enrollments.</p>
          ) : (
            <ul className="space-y-3">
              {data.pendingEnrollments.map((enr) => (
                <li key={enr.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{enr.studentName}</p>
                    <p className="text-xs text-gray-500">{enr.courseTitle} • {enr.enrolledAt}</p>
                  </div>
                  <Link
                    href={`/admin/enrollments/${enr.id}`}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs hover:bg-yellow-200 transition"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Activities</h3>
        {data.activities.length === 0 ? (
          <p className="text-gray-500">No recent activities.</p>
        ) : (
          <ul className="space-y-3">
            {data.activities.map((act) => (
              <li key={act.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  {act.user.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{act.user}</p>
                  <p className="text-xs text-gray-500">{act.action} • {act.date}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{act.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/teachers/new" className="rounded-xl bg-blue-600 text-white py-3 text-center hover:bg-blue-700">
              Add Teacher
            </Link>
            <Link href="/admin/students/new" className="rounded-xl bg-green-600 text-white py-3 text-center hover:bg-green-700">
              Add Student
            </Link>
            <Link href="/admin/courses/new" className="rounded-xl bg-purple-600 text-white py-3 text-center hover:bg-purple-700">
              Add Course
            </Link>
            <Link href="/admin/admissions" className="rounded-xl bg-orange-600 text-white py-3 text-center hover:bg-orange-700">
              Manage Admissions
            </Link>
            <Link href="/admin/enrollments" className="rounded-xl bg-emerald-600 text-white py-3 text-center hover:bg-emerald-700">
              View Enrollments
            </Link>
            <Link href="/admin/attendance" className="rounded-xl bg-cyan-600 text-white py-3 text-center hover:bg-cyan-700">
              Attendance
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Teacher Management</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/teachers" className="rounded-xl bg-indigo-600 text-white py-3 text-center hover:bg-indigo-700">
              All Teachers
            </Link>
            <Link href="/admin/assign-teacher" className="rounded-xl bg-rose-600 text-white py-3 text-center hover:bg-rose-700">
              Assign Teacher
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}