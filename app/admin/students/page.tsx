// app/admin/students/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import Link from 'next/link';
import {
  Users,
  Search,
  Eye,
  Pencil,
  UserPlus,
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

async function getStudents(search: string = '') {
  await connectDB();

  const filter: any = { role: 'user' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const students = await User.find(filter)
    .sort({ createdAt: -1 })
    .select('name email phone createdAt isVerified')
    .lean();

  return students.map((s: any) => ({
    id: s._id.toString(),
    name: s.name || 'Unknown',
    email: s.email || '',
    phone: s.phone || 'N/A',
    createdAt: s.createdAt?.toISOString().split('T')[0] || 'N/A',
    isVerified: s.isVerified || false,
  }));
}

// ─── Page ─────────────────────────────────────────────────────────

interface PageProps {
  searchParams?: { q?: string };
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const searchQuery = searchParams?.q || '';
  const students = await getStudents(searchQuery);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Students</h1>
            <p className="text-gray-500 mt-1">Manage all students registered in the academy.</p>
          </div>
          <Link
            href="/admin/students/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition"
          >
            <UserPlus size={18} /> Add Student
          </Link>
        </div>

        {/* Search */}
        <form method="GET" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          >
            Search
          </button>
          {searchQuery && (
            <Link
              href="/admin/students"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Phone</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Joined</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Verified</th>
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium">{student.name}</td>
                      <td className="px-6 py-4">{student.email}</td>
                      <td className="px-6 py-4">{student.phone}</td>
                      <td className="px-6 py-4">{student.createdAt}</td>
                      <td className="px-6 py-4">
                        {student.isVerified ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Yes</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={`/admin/students/${student.id}/edit`}
                            className="p-1.5 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-600 transition"
                          >
                            <Pencil size={16} />
                          </Link>
                          <DeleteButton
                            action={`/api/admin/students/${student.id}`}
                            id={student.id}
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
            Showing {students.length} student(s)
          </div>
        </div>
      </div>
    </div>
  );
}