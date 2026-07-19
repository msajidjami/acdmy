// app/admin/enrollments/[id]/page.tsx
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/app/models/Enrollment';
import User from '@/app/models/User';
import Course from '@/app/models/Course';
import Teacher from '@/app/models/Teacher';
import EnrollmentDetailClient from './EnrollmentDetailClient';

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

async function getEnrollmentData(id: string) {
  await connectDB();

  const enrollment = await Enrollment.findById(id).lean();
  if (!enrollment) return null;

  let student = null;
  if (mongoose.Types.ObjectId.isValid(enrollment.studentId?.toString())) {
    student = await User.findById(enrollment.studentId)
      .select('name email')
      .lean();
  }

  let course = null;
  if (mongoose.Types.ObjectId.isValid(enrollment.courseId?.toString())) {
    course = await Course.findById(enrollment.courseId)
      .populate('instructor', 'fullName email')
      .lean();
  }

  const teachers = await Teacher.find({ active: true })
    .select('fullName email')
    .lean();

  return {
    enrollment: {
      id: enrollment._id.toString(),
      studentId: enrollment.studentId?.toString() || '',
      courseId: enrollment.courseId?.toString() || '',
      status: enrollment.status || 'pending',
      progress: enrollment.progress || 0,
      enrolledAt: enrollment.enrolledAt?.toISOString().split('T')[0] || 'N/A',
    },
    student: student
      ? {
          id: student._id.toString(),
          name: student.name || 'Unknown',
          email: student.email || '',
        }
      : null,
    course: course
      ? {
          id: course._id.toString(),
          title: course.title || 'Unknown',
          instructor: course.instructor
            ? {
                id: course.instructor._id.toString(),
                fullName: course.instructor.fullName || 'Unknown',
                email: course.instructor.email || '',
              }
            : null,
        }
      : null,
    teachers: teachers.map((t: any) => ({
      id: t._id.toString(),
      fullName: t.fullName,
      email: t.email,
    })),
  };
}

// ✅ The default export function – this must be present
export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const { id } = await params;
  const data = await getEnrollmentData(id);
  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Enrollment Details</h1>
          <p className="text-gray-500 mt-1">View and manage this enrollment.</p>
        </div>

        <EnrollmentDetailClient
          enrollment={data.enrollment}
          student={data.student}
          course={data.course}
          teachers={data.teachers}
        />
      </div>
    </div>
  );
}