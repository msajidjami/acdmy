// app/admin/students/[id]/page.tsx
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  BadgeCheck,
  User as UserIcon,
  Pencil,
  BookOpen,
  UserCircle,
} from 'lucide-react';
import DeleteButton from '@/app/components/admin/DeleteButton';

// ─── Auth ──────────────────────────────────────────────────────────

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

// ─── Data Fetching ────────────────────────────────────────────────

async function getStudent(id: string) {
  await connectDB();
  // ✅ strictPopulate: false سے error ختم
  const student = (await User.findById(id)
    .select('name email phone createdAt isVerified role assignedTeacher assignedCourse')
    .populate({ path: 'assignedTeacher', select: 'fullName email', strictPopulate: false })
    .populate({ path: 'assignedCourse', select: 'title', strictPopulate: false })
    .lean()) as any;

  if (!student) return null;

  return {
    id: student._id.toString(),
    name: student.name || 'Unknown',
    email: student.email || '',
    phone: student.phone || 'N/A',
    createdAt: student.createdAt?.toISOString().split('T')[0] || 'N/A',
    isVerified: student.isVerified || false,
    role: student.role || 'user',
    assignedTeacher: student.assignedTeacher
      ? {
          id: student.assignedTeacher._id.toString(),
          name: student.assignedTeacher.fullName || student.assignedTeacher.email || 'Unknown',
        }
      : null,
    assignedCourse: student.assignedCourse
      ? {
          id: student.assignedCourse._id.toString(),
          title: student.assignedCourse.title || 'Unknown',
        }
      : null,
  };
}

// ─── Page Component ───────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailsPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const { id } = await params;
  const student = await getStudent(id);

  if (!student) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={18} />
            Back to Students
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-3 rounded-full">
                <UserIcon className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
                <p className="text-sm text-gray-500">Student</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {student.isVerified ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <BadgeCheck size={14} /> Verified
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                  Not Verified
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Email</p>
                  <p className="text-gray-800">{student.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Phone</p>
                  <p className="text-gray-800">{student.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Joined</p>
                  <p className="text-gray-800">{student.createdAt}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Role</p>
                  <p className="text-gray-800 capitalize">{student.role}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Assigned Teacher</p>
                  <p className="text-gray-800">
                    {student.assignedTeacher ? student.assignedTeacher.name : '— None —'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Assigned Course</p>
                  <p className="text-gray-800">
                    {student.assignedCourse ? student.assignedCourse.title : '— None —'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/admin/students/${student.id}/edit`}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Pencil size={16} />
              Edit Student
            </Link>
            <DeleteButton
              action={`/api/admin/students/${student.id}`}
              id={student.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}