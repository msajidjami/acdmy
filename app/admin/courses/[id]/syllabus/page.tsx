// app/admin/courses/[id]/syllabus/page.tsx
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';
import SyllabusManager from './SyllabusManager';

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

async function getCourse(id: string) {
  await connectDB();
  const course = await Course.findById(id)
    .select('title description syllabusFiles syllabusDescription syllabusUpdatedAt')
    .lean();
  if (!course) return null;
  return {
    id: course._id.toString(),
    title: course.title,
    description: course.description,
    files: course.syllabusFiles || [],
    syllabusDescription: course.syllabusDescription || '',
    syllabusUpdatedAt: course.syllabusUpdatedAt?.toISOString() || null,
  };
}

export default async function CourseSyllabusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect('/');
  }

  const { id } = await params;
  const course = await getCourse(id);
  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Course Syllabus</h1>
          <p className="text-gray-500 mt-1">
            {course.title} – Manage PDF files and syllabus details for this course
          </p>
        </div>

        <SyllabusManager course={course} />
      </div>
    </div>
  );
}