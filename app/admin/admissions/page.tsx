// app/admin/admissions/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Admission from '@/app/models/Admission';
import User from '@/app/models/User';
import Course from '@/app/models/Course';
import { CheckCircle, XCircle, Clock, Eye, Plus, Filter } from 'lucide-react';

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

// ─── Data Fetching ──────────────────────────────────────────────────

async function getAdmissions() {
  await connectDB();

  const admissions = await Admission.find({})
    .sort({ createdAt: -1 })
    .populate({
      path: 'studentId',
      model: User,
      select: 'name email',
    })
    .populate({
      path: 'courseId',
      model: Course,
      select: 'title instructor',
    })
    .lean();

  return admissions.map((adm: any) => ({
    id: adm._id.toString(),
    studentName: adm.studentId?.name || 'Unknown Student',
    studentEmail: adm.studentId?.email || 'N/A',
    courseTitle: adm.courseId?.title || 'Unknown Course',
    status: adm.currentStatus || 'pending',
    appliedAt: adm.createdAt?.toISOString().split('T')[0] || 'N/A',
    remarks: adm.remarks || '',
  }));
}

// ─── Status Badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    enrolled: 'bg-blue-100 text-blue-800 border-blue-200',
    'in-progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  const icons: Record<string, React.ReactNode> = {
    pending: <Clock size={14} className="inline mr-1" />,
    approved: <CheckCircle size={14} className="inline mr-1" />,
    enrolled: <CheckCircle size={14} className="inline mr-1" />,
    'in-progress': <Clock size={14} className="inline mr-1" />,
    completed: <CheckCircle size={14} className="inline mr-1" />,
    rejected: <XCircle size={14} className="inline mr-1" />,
  };

  const label: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    enrolled: 'Enrolled',
    'in-progress': 'In Progress',
    completed: 'Completed',
    rejected: 'Rejected',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {icons[status] || icons.pending}
      {label[status] || status}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default async function AdmissionsPage() {
  const session = await getSession();

  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const admissions = await getAdmissions();

  const statusCounts = {
    pending: admissions.filter(a => a.status === 'pending').length,
    approved: admissions.filter(a => a.status === 'approved').length,
    enrolled: admissions.filter(a => a.status === 'enrolled').length,
    completed: admissions.filter(a => a.status === 'completed').length,
    rejected: admissions.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admissions Management</h1>
          <p className="text-gray-500 mt-1">Manage student admission requests and enrollment.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/admissions/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition"
          >
            <Plus size={18} /> New Admission
          </Link>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold">{statusCounts.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-400">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold">{statusCounts.approved}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-400">
          <p className="text-sm text-gray-500">Enrolled</p>
          <p className="text-2xl font-bold">{statusCounts.enrolled}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-emerald-400">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">{statusCounts.completed}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-400">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold">{statusCounts.rejected}</p>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">All Admissions</h3>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="enrolled">Enrolled</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {admissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No admissions found.</p>
            <Link href="/admin/admissions/new" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">
              Create the first admission →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Course</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Applied On</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Remarks</th>
                  <th className="text-center px-6 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((adm) => (
                  <tr key={adm.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{adm.studentName}</p>
                        <p className="text-xs text-gray-400">{adm.studentEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{adm.courseTitle}</td>
                    <td className="px-6 py-4">{adm.appliedAt}</td>
                    <td className="px-6 py-4"><StatusBadge status={adm.status} /></td>
                    <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">{adm.remarks || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/admissions/${adm.id}`}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          className="p-1.5 bg-green-50 hover:bg-green-100 rounded-lg text-green-600 transition"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-gray-100 text-sm text-gray-400">
          Showing {admissions.length} admission(s)
        </div>
      </div>
    </div>
  );
}