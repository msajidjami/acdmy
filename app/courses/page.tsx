// app/courses/page.tsx
import Link from 'next/link';
import { Metadata } from 'next';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/app/models/Course';
import { Clock, Users } from 'lucide-react';
import SyllabusButton from '@/app/components/SyllabusButton';
import EnrollNowButton from '@/app/components/EnrollNowButton';

// ─── Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Courses – Quran & Islamic Academy',
  description: 'Explore our comprehensive range of Islamic and academic courses.',
  // ... باقی metadata
};

// ─── Data Fetching ──────────────────────────────────────────────────────
async function getCourses(category: string) {
  await connectDB();
  const filter: any = { isActive: true };
  if (category !== 'All') filter.category = category;
  const courses = await Course.find(filter)
    .select('title description category level duration price studentsEnrolled syllabusFiles syllabusDescription')
    .sort({ title: 1 })
    .lean();

  return courses.map((c: any) => ({
    id: c._id.toString(),
    title: c.title,
    description: c.description,
    category: c.category,
    level: c.level,
    duration: c.duration,
    price: c.price,
    studentsEnrolled: c.studentsEnrolled || 0,
    syllabusDescription: c.syllabusDescription || '',
    syllabusFiles: (c.syllabusFiles || []).map((f: any) => ({
      fileName: f.fileName,
      fileUrl: f.fileUrl,
    })),
  }));
}

// ─── Component ────────────────────────────────────────────────────────────
export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams ? await searchParams : {};
  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const activeCategory = categoryParam && ['Islamic', 'Academic'].includes(categoryParam) ? categoryParam : 'All';

  const courses = await getCourses(activeCategory);

  const filterLinks = [
    { label: 'All', value: 'All' },
    { label: 'Islamic', value: 'Islamic' },
    { label: 'Academic', value: 'Academic' },
  ];

  const getLevelColor = (level: string) => {
    const map: Record<string, string> = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700',
    };
    return map[level] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Our <span className="text-teal-700">Courses</span>
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Explore our comprehensive range of Islamic and academic programs
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {filterLinks.map((filter) => {
            const isActive = activeCategory === filter.value;
            const href = filter.value === 'All' ? '/courses' : `/courses?category=${filter.value}`;
            return (
              <Link
                key={filter.value}
                href={href}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {/* Results Count */}
        <div className="text-sm text-slate-500 mb-6">
          Showing <strong className="text-slate-800">{courses.length}</strong> courses
          {activeCategory !== 'All' && ` in "${activeCategory}"`}
        </div>

        {/* Course Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">No Courses Found</h3>
            <p className="text-slate-500">Try selecting a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">
                      {course.category === 'Islamic' ? '📖' : '📐'}
                    </span>
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                        course.category === 'Islamic'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {course.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition">
                    {course.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 flex-1">{course.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className={`px-2 py-0.5 rounded-full ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.studentsEnrolled}
                    </span>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <EnrollNowButton
                      courseId={course.id}
                      courseTitle={course.title}
                      className="flex-1"
                    />
                    {/* ✅ ہمیشہ نصاب کا بٹن دکھائیں */}
                    <SyllabusButton
                      courseId={course.id}
                      courseTitle={course.title}
                      syllabusDescription={course.syllabusDescription}
                      files={course.syllabusFiles}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <section className="mt-16 bg-teal-700 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Not sure which course is right for you?</h2>
          <p className="text-teal-100 max-w-2xl mx-auto">
            Contact our academic advisors for a free consultation. We’ll help you choose the perfect learning path.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block bg-white text-teal-700 font-semibold px-8 py-3 rounded-lg hover:bg-teal-50 transition"
          >
            Get Free Consultation
          </Link>
        </section>
      </div>
    </div>
  );
}