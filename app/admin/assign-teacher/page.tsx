// app/admin/assign-teacher/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/app/models/Enrollment';
import Teacher from '@/app/models/Teacher';
import User from '@/app/models/User';
import Course from '@/app/models/Course';
import AssignTeacherCard from '@/app/components/admin/AssignTeacherCard';

// ─── Constants ──────────────────────────────────────────────────────

const ADMIN_ROLES: string[] = [
  'admin',
  'owner',
  'super-admin',
  'education-admin',
  'darul-ifta-admin',
  'section1-admin',
  'section2-admin',
];

// ─── Types ──────────────────────────────────────────────────────────

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  name: string;
  isVerified: boolean;
}

// ─── Session Extraction ─────────────────────────────────────────────

async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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

// ─── Data Fetching ──────────────────────────────────────────────────

async function getData() {
  await connectDB();

  // Get all active/pending enrollments
  const enrollments = await Enrollment.find({ status: { $in: ['active', 'pending'] } })
    .sort({ enrolledAt: -1 })
    .populate('studentId', 'name email')
    .populate({
      path: 'courseId',
      populate: { path: 'instructor', model: Teacher, select: 'fullName' },
    })
    .lean();

  // Get all active teachers
  const teachers = await Teacher.find({ active: true }).select('fullName').lean();

  return {
    enrollments: enrollments.map((enr: any) => ({
      id: enr._id.toString(),
      studentName: enr.studentId?.name || 'Unknown',
      studentEmail: enr.studentId?.email || '',
      courseTitle: enr.courseId?.title || 'Unknown',
      currentTeacher: enr.courseId?.instructor?.fullName || 'Not Assigned',
      currentTeacherId: enr.courseId?.instructor?._id?.toString() || null,
      enrolledAt: enr.enrolledAt?.toISOString().split('T')[0] || 'N/A',
    })),
    teachers: teachers.map((t: any) => ({ _id: t._id.toString(), fullName: t.fullName })),
  };
}

// ─── Page ────────────────────────────────────────────────────────────

export default async function AssignTeacherPage() {
  const session = await getSession();

  // Redirect if not logged in or not admin
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const data = await getData();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Assign Teacher to Students</h1>
        <p className="text-gray-500 mb-6">Select a student, choose a teacher, and set the class time.</p>

        {data.enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-500">No enrollments found to assign teachers.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {data.enrollments.map((enr) => (
              <AssignTeacherCard
                key={enr.id}
                enrollmentId={enr.id}
                studentName={enr.studentName}
                studentEmail={enr.studentEmail}
                courseTitle={enr.courseTitle}
                currentTeacher={enr.currentTeacher}
                teachers={data.teachers}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}