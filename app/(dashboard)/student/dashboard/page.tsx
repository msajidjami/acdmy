import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

async function getStudentData(email: string) {
  await connectDB();
  const student = await Student.findOne({ email }).lean();
  if (!student) return null;
  const academy = await Academy.findById(student.academyId).lean();
  return { student, academy };
}

export default async function StudentDashboardPage() {
  // صرف لاگ ان چیک کریں
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return redirect('/login');

  let userEmail = '';
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    userEmail = decoded.email;
    if (!userEmail) throw new Error('Email not found in token');
  } catch {
    return redirect('/login');
  }

  const data = await getStudentData(userEmail);

  // اگر اسٹوڈنٹ نہیں ملا → کوئی ری ڈائریکٹ نہیں، بس پیغام دکھائیں
  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-green-200 shadow-sm">
          <div className="text-6xl mb-4">👨‍🎓</div>
          <h3 className="text-2xl font-bold text-black">No Student Profile Found</h3>
          <p className="text-black/60 mt-2">
            You are not registered as a student in any academy yet.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-8 py-3 bg-green-600 text-white font-semibold rounded-2xl hover:bg-green-700 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const { student, academy } = data;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">👨‍🎓 Student Dashboard</h1>
          <p className="text-black/60 mt-1">Welcome back, {student.name || 'Student'}!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-black/60">Your Academy</p>
              <p className="text-xl font-bold text-black truncate">{academy?.name || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-black/60">Subjects</p>
              <p className="text-xl font-bold text-black">{student.subjects?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-black/60">Status</p>
              <p className="text-xl font-bold text-black">
                {student.status === 'active'
                  ? '✅ Active'
                  : student.status === 'pending'
                  ? '⏳ Pending'
                  : '❌ Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="p-5 border-b border-black/5">
          <h2 className="font-semibold text-black">📋 Your Profile</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between">
            <span className="text-black/60">Name</span>
            <span className="font-medium text-black">{student.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">Email</span>
            <span className="font-medium text-black">{student.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">Phone</span>
            <span className="font-medium text-black">{student.phone || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">Parent Name</span>
            <span className="font-medium text-black">{student.parentName || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">Parent Phone</span>
            <span className="font-medium text-black">{student.parentPhone || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">Subjects</span>
            <span className="font-medium text-black">{student.subjects?.join(', ') || 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">Enrolled</span>
            <span className="font-medium text-black">
              {new Date(student.enrollmentDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/60">Address</span>
            <span className="font-medium text-black">{student.address || 'N/A'}</span>
          </div>
          {student.notes && (
            <div className="flex justify-between">
              <span className="text-black/60">Notes</span>
              <span className="font-medium text-black">{student.notes}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/academy/${academy?.slug}`}
          className="bg-white p-5 rounded-2xl border border-black/5 hover:shadow-lg transition flex items-center gap-4 group"
        >
          <div className="p-2 bg-green-100 rounded-xl group-hover:bg-green-200 transition">
            <AcademicCapIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-black">View Academy</h3>
            <p className="text-sm text-black/60">See your academy details</p>
          </div>
        </Link>
        <Link
          href="/"
          className="bg-white p-5 rounded-2xl border border-black/5 hover:shadow-lg transition flex items-center gap-4 group"
        >
          <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition">
            <UserGroupIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-black">Home</h3>
            <p className="text-sm text-black/60">Go back to homepage</p>
          </div>
        </Link>
      </div>
    </div>
  );
}