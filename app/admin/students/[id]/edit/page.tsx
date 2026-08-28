// app/admin/students/[id]/edit/page.tsx
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import Teacher from '@/app/models/Teacher';
import Course from '@/app/models/Course';
import { ArrowLeft, Save } from 'lucide-react';

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
  const student = (await User.findById(id)
    .select('name email phone role isVerified assignedTeacher assignedCourse')
    .lean()) as any;

  if (!student) return null;

  return {
    id: student._id.toString(),
    name: student.name || '',
    email: student.email || '',
    phone: student.phone || '',
    role: student.role || 'user',
    isVerified: student.isVerified || false,
    assignedTeacher: student.assignedTeacher?.toString() || '',
    assignedCourse: student.assignedCourse?.toString() || '',
  };
}

async function getTeachers() {
  await connectDB();
  const teachers = await Teacher.find({ active: true })
    .select('_id fullName email')
    .lean();
  return teachers.map((teacher: any) => ({
    id: teacher._id.toString(),
    name: teacher.fullName || teacher.email || 'Unknown',
  }));
}

async function getCourses() {
  await connectDB();
  const courses = await Course.find({ isActive: true })
    .select('_id title')
    .lean();
  return courses.map((course: any) => ({
    id: course._id.toString(),
    title: course.title || 'Untitled Course',
  }));
}

// ─── Page Component ───────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const { id } = await params;
  const student = await getStudent(id);
  if (!student) {
    notFound();
  }

  const teachers = await getTeachers();
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/students/${student.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={18} />
            Back to Student
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800">Edit Student</h1>
            <p className="text-sm text-gray-500 mt-1">
              Update student information, assign a teacher, and assign a course.
              {(teachers.length === 0 || courses.length === 0) && (
                <span className="block text-amber-600 mt-1">
                  {teachers.length === 0 && '⚠️ No active teachers found. '}
                  {courses.length === 0 && '⚠️ No active courses found. '}
                  Please add them first.
                </span>
              )}
            </p>
          </div>

          <form action={`/api/admin/students/${student.id}`} method="POST" className="p-6 space-y-5">
            <input type="hidden" name="_method" value="PUT" />

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={student.name}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={student.email}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                defaultValue={student.phone}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue={student.role}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="education-admin">Education Admin</option>
                <option value="darul-ifta-admin">Darul Ifta Admin</option>
                <option value="section1-admin">Section 1 Admin</option>
                <option value="section2-admin">Section 2 Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="assignedTeacher" className="block text-sm font-medium text-gray-700 mb-1">
                Assign Teacher
              </label>
              <select
                id="assignedTeacher"
                name="assignedTeacher"
                defaultValue={student.assignedTeacher}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">— None —</option>
                {teachers.map((teacher: { id: string; name: string }) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {teachers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No teachers available.</p>
              )}
            </div>

            <div>
              <label htmlFor="assignedCourse" className="block text-sm font-medium text-gray-700 mb-1">
                Assign Course
              </label>
              <select
                id="assignedCourse"
                name="assignedCourse"
                defaultValue={student.assignedCourse}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">— None —</option>
                {courses.map((course: { id: string; title: string }) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No courses available.</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isVerified"
                name="isVerified"
                defaultChecked={student.isVerified}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="isVerified" className="text-sm font-medium text-gray-700">
                Verified
              </label>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <Save size={18} />
                Save Changes
              </button>
              <Link
                href={`/admin/students/${student.id}`}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}