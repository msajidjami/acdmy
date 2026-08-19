// app/admin/courses/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';
import Link from 'next/link';
import { BookOpen, Plus, Eye, Pencil, Trash2, FileText } from 'lucide-react';
import DeleteButton from '@/app/components/admin/DeleteButton';

const ADMIN_ROLES = ['admin', 'owner', 'super-admin', 'education-admin', 'darul-ifta-admin', 'section1-admin', 'section2-admin'];

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch { return null; }
}

async function getCourses() {
  await connectDB();
  const courses = await Course.find({}).sort({ createdAt: -1 }).lean();
  return courses.map(c => ({
    id: c._id.toString(),
    title: c.title,
    category: c.category,
    level: c.level,
    duration: c.duration,
    price: c.price,
    isActive: c.isActive,
    instructor: c.instructor,
    studentsEnrolled: c.studentsEnrolled,
  }));
}

export default async function AdminCoursesPage() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect('/');

  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Courses</h1>
            <p className="text-gray-500 mt-1">Manage all academy courses.</p>
          </div>
          <Link href="/admin/courses/new" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition">
            <Plus size={18} /> Add Course
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {courses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No courses found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{/* ✅ تمام th ایک ہی لائن پر، کوئی اضافی سپیس نہیں */}
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Title</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Category</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Level</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Duration</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Price</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Students</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Syllabus</th>
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium">{course.title}</td>
                      <td className="px-6 py-4">{course.category}</td>
                      <td className="px-6 py-4">{course.level}</td>
                      <td className="px-6 py-4">{course.duration}</td>
                      <td className="px-6 py-4">${course.price}</td>
                      <td className="px-6 py-4">{course.studentsEnrolled}</td>
                      <td className="px-6 py-4">
                        {course.isActive ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Active</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/admin/courses/${course.id}/syllabus`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium transition"
                          title="Manage Syllabus"
                        >
                          <FileText size={14} /> Syllabus
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/courses/${course.id}`} className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition">
                            <Eye size={16} />
                          </Link>
                          <Link href={`/admin/courses/${course.id}/edit`} className="p-1.5 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-600 transition">
                            <Pencil size={16} />
                          </Link>
                          <DeleteButton action={`/api/admin/courses/${course.id}`} id={course.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-4 border-t border-gray-100 text-sm text-gray-400">Showing {courses.length} course(s)</div>
        </div>
      </div>
    </div>
  );
}