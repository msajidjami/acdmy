// app/courses/page.tsx
import Link from 'next/link';
import { Metadata } from 'next';
import { CheckCircle, Clock, GraduationCap, BookOpen, Users } from 'lucide-react';

// ─── Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Courses – Quran & Islamic Academy',
  description:
    'Explore our comprehensive range of Islamic and academic courses. From Quran and Tajweed to Mathematics, Physics, and Biology – all taught by qualified scholars.',
  openGraph: {
    title: 'Courses – Quran & Islamic Academy',
    description:
      'Online courses in Quran, Islamic Studies, Math, Physics, Chemistry, and more. Enroll today and start your learning journey.',
    url: 'https://www.quranandislamic.com/courses',
    siteName: 'Quran & Islamic Academy',
    images: [
      {
        url: 'https://www.quranandislamic.com/og-courses.jpg',
        width: 1200,
        height: 630,
        alt: 'Quran & Islamic Academy Courses',
      },
    ],
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.quranandislamic.com/courses',
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────
// This can later be replaced with a database fetch
const allCourses = [
  // Islamic Courses
  {
    id: 1,
    title: 'Quran & Tajweed Mastery',
    description:
      'Master fluent recitation of the Holy Quran with precise Tajweed rules. Guided by certified native Arab and English-speaking scholars.',
    icon: '📖',
    category: 'Islamic',
    level: 'Beginner to Advanced',
    duration: '3-6 Months',
    features: ['Arabic Alphabets', 'Fluent Quran Reading', 'Daily Practice'],
  },
  {
    id: 2,
    title: 'Islamic Studies & Seerah',
    description:
      'In-depth exploration of Prophetic Biography, daily supplications, and core Islamic values to build strong moral character.',
    icon: '🌙',
    category: 'Islamic',
    level: 'All Levels',
    duration: '6-12 Months',
    features: ['Prophetic Life Events', 'Daily Masnoon Duas', 'Character Building'],
  },
  {
    id: 3,
    title: 'Quran Hifz Program',
    description:
      'Structured memorization pathway using advanced revision techniques to ensure lifelong retention of the Holy Quran.',
    icon: '💖',
    category: 'Islamic',
    level: 'Intermediate',
    duration: '2-3 Years',
    features: ['Customized Pacing', 'Retention Techniques', 'Tajweed Integration'],
  },
  {
    id: 4,
    title: 'Tafseer & Quranic Exegesis',
    description:
      'Study the deeper meanings of the Quran with classical and contemporary Tafseer. Understand the context and wisdom behind each verse.',
    icon: '📚',
    category: 'Islamic',
    level: 'Intermediate to Advanced',
    duration: '1-2 Years',
    features: ['Classical Tafseer', 'Thematic Studies', 'Contemporary Application'],
  },
  {
    id: 5,
    title: 'Arabic Language & Grammar',
    description:
      'Build a strong foundation in Arabic language – from basic grammar to advanced rhetoric – to understand the Quran and Hadith in their original language.',
    icon: '🔤',
    category: 'Islamic',
    level: 'Beginner to Advanced',
    duration: '6-18 Months',
    features: ['Grammar (Nahw & Sarf)', 'Vocabulary Building', 'Reading & Writing Skills'],
  },
  {
    id: 6,
    title: 'Fiqh & Islamic Jurisprudence',
    description:
      'Learn the rulings of worship, transactions, and daily life according to the authentic schools of Islamic law.',
    icon: '⚖️',
    category: 'Islamic',
    level: 'Intermediate',
    duration: '1-2 Years',
    features: ['Worship (Ibadat)', 'Transactions (Muamalat)', 'Contemporary Fiqh Issues'],
  },

  // Academic Courses
  {
    id: 7,
    title: 'Advanced Mathematics',
    description:
      'Comprehensive instruction covering Algebra, Calculus, and Geometry aligned with US, UK, and international academic standards.',
    icon: '📐',
    category: 'Academic',
    level: 'Grades 8–12 & College Prep',
    duration: 'Flexible',
    features: ['O/A Levels & AP Math', 'SAT Prep Foundation', 'Conceptual Clarity'],
  },
  {
    id: 8,
    title: 'Physics & Chemistry',
    description:
      'Core scientific principles taught by elite faculty, ensuring robust preparation for board exams and standardized tests.',
    icon: '⚛️',
    category: 'Academic',
    level: 'Grades 9–12',
    duration: 'Flexible',
    features: ['Practical Concepts', 'Exam Preparation', 'Problem-Solving Skills'],
  },
  {
    id: 9,
    title: 'Biology & Pre-Medical',
    description:
      'Intensive biology curriculum focusing on cellular biology, human anatomy, and genetics to build a strong pre-medical foundation.',
    icon: '🧬',
    category: 'Academic',
    level: 'Grades 10–12 & Pre-Med',
    duration: 'Flexible',
    features: ['Human Anatomy', 'Cellular Biology', 'Pre-Med Foundation'],
  },
  {
    id: 10,
    title: 'English Language & Literature',
    description:
      'Develop strong reading, writing, and analytical skills through the study of classic and contemporary literature, essay writing, and critical thinking.',
    icon: '📝',
    category: 'Academic',
    level: 'Grades 6–12',
    duration: 'Flexible',
    features: ['Reading Comprehension', 'Essay Writing', 'Literary Analysis'],
  },
];

// ─── Filter Logic ────────────────────────────────────────────────────────
function getFilteredCourses(category: string) {
  if (category === 'All') return allCourses;
  return allCourses.filter((course) => course.category === category);
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

  const filteredCourses = getFilteredCourses(activeCategory);

  // Build filter links
  const filterLinks = [
    { label: 'All', value: 'All' },
    { label: 'Islamic', value: 'Islamic' },
    { label: 'Academic', value: 'Academic' },
  ];

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
          Showing <strong className="text-slate-800">{filteredCourses.length}</strong> courses
          {activeCategory !== 'All' && ` in "${activeCategory}"`}
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">No Courses Found</h3>
            <p className="text-slate-500">Try selecting a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{course.icon}</span>
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
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {course.level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </span>
                  </div>

                  <ul className="space-y-1.5 mb-4 text-sm">
                    {course.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600">
                        <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contact"
                    className="mt-auto w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 rounded-lg text-center transition-colors"
                  >
                    Enroll Now
                  </Link>
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