// app/admin/enrollments/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'; // ✅ added
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/app/models/Enrollment';
import User from '@/app/models/User';
import Course from '@/app/models/Course';
import Teacher from '@/app/models/Teacher';
import Link from 'next/link';
import {
  BookOpen,
  Filter,
  Eye,
} from 'lucide-react';
import DeleteButton from '@/app/components/admin/DeleteButton';

// ─── Auth ─────────────────────────────────────────────────────────

const ADMIN_ROLES = [
  'admin',
  'owner',
  'super-admin',
  'education-admin',
  'darul-ifta-admin',
  'section1-admin',
  'section2-admin',
];

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch {
    return null;
  }
}

// ─── Data Fetching ─────────────────────────────────────────────────

async function getEnrollments(statusFilter: string = 'all') {
  await connectDB();

  const filter: any = {};
  if (statusFilter !== 'all') {
    filter.status = statusFilter;
  }

  const enrollments = await Enrollment.find(filter)
    .sort({ enrolledAt: -1 })
    .lean();

  // Filter valid ObjectIds
  const studentIds = enrollments
    .map(e => e.studentId)
    .filter(id => id && mongoose.Types.ObjectId.isValid(id.toString()));

  const courseIds = enrollments
    .map(e => e.courseId)
    .filter(id => id && mongoose.Types.ObjectId.isValid(id.toString()));

  // Fetch only if there are valid IDs
  const students = studentIds.length > 0
    ? await User.find({ _id: { $in: studentIds } }).select('name email').lean()
    : [];

  const courses = courseIds.length > 0
    ? await Course.find({ _id: { $in: courseIds } })
        .populate('instructor', 'fullName')
        .lean()
    : [];

  const studentMap = Object.fromEntries(students.map(s => [s._id.toString(), s]));
  const courseMap = Object.fromEntries(courses.map(c => [c._id.toString(), c]));

  return enrollments.map((enr: any) => {
    const student = studentMap[enr.studentId?.toString()];
    const course = courseMap[enr.courseId?.toString()];
    // If courseId is not a valid ObjectId, fallback to the string itself
    const courseTitle = course?.title || (enr.courseId?.toString() || 'Unknown');
    return {
      id: enr._id.toString(),
      studentName: student?.name || 'Unknown',
      studentEmail: student?.email || '',
      courseTitle,
      teacherName: course?.instructor?.fullName || 'Not Assigned',
      status: enr.status || 'pending',
      progress: enr.progress || 0,
      enrolledAt: enr.enrolledAt?.toISOString().split('T')[0] || 'N/A',
    };
  });
}

// ─── Status Badge ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    dropped: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
    dropped: 'Dropped',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

interface PageProps {
  searchParams?: { status?: string };
}

export default async function EnrollmentsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const statusFilter = searchParams?.status || 'all';
  const enrollments = await getEnrollments(statusFilter);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'dropped', label: 'Dropped' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Enrollments</h1>
            <p className="text-gray-500 mt-1">View and manage all student enrollments.</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 bg-white rounded-lg shadow p-4">
          <Filter size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Status:</span>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/admin/enrollments${opt.value !== 'all' ? `?status=${opt.value}` : ''}`}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  statusFilter === opt.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No enrollments found for the selected status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Student</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Course</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Teacher</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Progress</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Enrolled</th>
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enr) => (
                    <tr key={enr.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{enr.studentName}</p>
                          <p className="text-xs text-gray-400">{enr.studentEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{enr.courseTitle}</td>
                      <td className="px-6 py-4">
                        {enr.teacherName !== 'Not Assigned' ? (
                          <span className="text-emerald-600">{enr.teacherName}</span>
                        ) : (
                          <span className="text-red-500 text-xs">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={enr.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{enr.progress}%</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${enr.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{enr.enrolledAt}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/enrollments/${enr.id}`}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition inline-flex"
                          >
                            <Eye size={16} />
                          </Link>
                          <DeleteButton
                            action={`/api/admin/enrollments/${enr.id}`}
                            id={enr.id}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-4 border-t border-gray-100 text-sm text-gray-400">
            Showing {enrollments.length} enrollment(s)
          </div>
        </div>
      </div>
    </div>
  );
}