import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import User from '@/models/User';
import InquiryModal from '@/app/components/InquiryModal';
import EnrollButton from '@/app/components/EnrollButton';
import TeacherCard from '@/app/components/TeacherCard';
import {
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

// ✅ اکیڈمی کی تفصیلات (plain objects)
async function getAcademyDetails(slug: string) {
  await connectDB();

  const academy = await Academy.findOne({ slug, isActive: true })
    .populate({
      path: 'ownerId',
      model: User,
      select: 'name email',
    })
    .lean();

  if (!academy) return null;

  const teacherCount = await Teacher.countDocuments({ academyId: academy._id });
  const teachers = await Teacher.find({ academyId: academy._id })
    .limit(10)
    .lean();

  const courses = await Course.find({ academyId: academy._id, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  // ✅ صرف مطلوبہ فیلڈز نکالیں اور null/undefined کو فلٹر کریں
  const sanitizedTeachers = teachers
    .filter((t: any) => t && t._id) // null/undefined اور بغیر _id والے کو ہٹائیں
    .map((t: any) => ({
      _id: t._id.toString(),
      name: t.name || 'Unknown',
      email: t.email || '',
      subjects: t.subjects || [],
      bio: t.bio || '',
      audioUrl: t.audioUrl || '',
      profileImage: t.profileImage || '',
      isAvailable: t.isAvailable ?? true,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
    }));

  return {
    ...academy,
    _id: academy._id.toString(),
    teacherCount,
    teachers: sanitizedTeachers,
    courses: courses.map((c: any) => ({
      ...c,
      _id: c._id.toString(),
    })),
    ownerId: academy.ownerId
      ? {
          ...academy.ownerId,
          _id: academy.ownerId._id.toString(),
        }
      : null,
  };
}

// ✅ موجودہ صارف (plain object)
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password').lean();
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export default async function AcademyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const academy = await getAcademyDetails(slug);
  const user = await getCurrentUser();

  if (!academy) {
    notFound();
  }

  return (
    <div className="min-h-screen  bg-gray-50/50">
      {/* ===== Hero Section ===== */}
      <section className="relative mt-27 bg-gradient-to-r from-emerald-600 to-teal-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="max-w-7xl mt-5 mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-6xl md:text-7xl bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
              {academy.logo || '🏛️'}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold drop-shadow-lg">
                {academy.name}
              </h1>
              <p className="mt-3 text-emerald-100 text-lg md:text-xl max-w-2xl">
                {academy.description?.slice(0, 150)}...
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <UserGroupIcon className="h-5 w-5" />
                  {academy.teacherCount} Teachers
                </span>
                <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <BookOpenIcon className="h-5 w-5" />
                  {academy.courses.length} Courses
                </span>
                <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <AcademicCapIcon className="h-5 w-5" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-4 left-4 z-20">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm hover:bg-black/40 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Explore
          </Link>
        </div>
      </section>

      {/* ===== Main Content with Sidebar ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0 order-2 lg:order-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-8">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-emerald-600" />
                  Academy Info
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Owner</p>
                  <p className="text-gray-900 font-semibold">{academy.ownerId?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Contact Email</p>
                  <p className="text-gray-900">{academy.contactEmail || 'Not provided'}</p>
                </div>
                {academy.address && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Address</p>
                    <p className="text-gray-900">{academy.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 font-medium">Statistics</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Teachers</span>
                      <span className="font-bold text-gray-900">{academy.teacherCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Courses</span>
                      <span className="font-bold text-gray-900">{academy.courses.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <span className="font-bold text-green-600">Active</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <InquiryModal academyId={academy._id} academyName={academy.name} />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 order-1 lg:order-2 space-y-12">
            {/* About Section */}
            <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <span className="text-3xl">📖</span> About the Academy
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {academy.description}
              </p>
            </section>

            {/* Courses Section */}
            {academy.courses.length > 0 && (
              <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <BookOpenIcon className="h-6 w-6 text-emerald-600" />
                  Courses ({academy.courses.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {academy.courses.map((course: any) => (
                    <div key={course._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-lg transition">
                      <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.description || 'No description'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium">{course.level}</span>
                        {course.category && (
                          <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full">{course.category}</span>
                        )}
                        {course.duration && (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">⏱️ {course.duration}</span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-lg font-bold text-indigo-600">
                          {course.price > 0 ? `$${course.price}` : 'Free'}
                        </span>
                        <EnrollButton courseId={course._id} user={user} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ✅ Teachers Section - TeacherCard with safe rendering */}
            {academy.teachers.length > 0 && (
              <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <UserGroupIcon className="h-6 w-6 text-emerald-600" />
                  Teachers ({academy.teachers.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {academy.teachers.map((teacher: any) => (
                    <TeacherCard key={teacher._id} teacher={teacher} />
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl shadow-xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold">Ready to Learn?</h3>
              <p className="text-emerald-100 mt-2 max-w-2xl mx-auto">
                Browse courses and start your educational journey with {academy.name} today.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link href="/explore" className="bg-white text-emerald-700 hover:bg-gray-100 font-semibold px-6 py-3 rounded-xl transition shadow-lg">
                  Explore More Academies
                </Link>
                <InquiryModal academyId={academy._id} academyName={academy.name} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}