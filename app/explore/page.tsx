import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import Student from '@/models/Student';

export const dynamic = 'force-dynamic';

/* ============================================================
   HELPERS
   ============================================================ */

function isImageUrl(value?: string): boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('/') ||
    v.startsWith('data:image')
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function getInitials(name: string): string {
  if (!name) return 'T';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/* ============================================================
   DATA FETCHING
   ============================================================ */

async function getAcademies() {
  await connectDB();

  const academies = await Academy.find({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  const academiesWithCounts = await Promise.all(
    academies.map(async (academy: any) => {
      const [teacherCount, courseCount, studentCount] = await Promise.all([
        Teacher.countDocuments({ academyId: academy._id }),
        Course.countDocuments({ academyId: academy._id, isActive: true }),
        Student.countDocuments({ academyId: academy._id }),
      ]);

      return {
        _id: String(academy._id),
        slug: String(academy.slug || ''),
        name: String(academy.name || ''),
        description: String(academy.description || ''),
        logo: String(academy.logo || ''),
        thumbnail: String(academy.thumbnail || ''),
        accentColor: String(academy.accentColor || '#10b981'),
        address: String(academy.address || ''),
        followerCount: Number(academy.followerCount) || 0,
        avgRating: Number(academy.avgRating) || 0,
        ratingCount: Number(academy.ratingCount) || 0,
        teacherCount,
        courseCount,
        studentCount,
      };
    })
  );

  return academiesWithCounts;
}

async function getTeachers() {
  await connectDB();

  const teachers = await Teacher.find({ isAvailable: true })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  /* Academy names کے لیے batch query */
  const academyIds = Array.from(
    new Set(
      teachers
        .map((t: any) => String(t.academyId || ''))
        .filter((id: string) => id.length > 0)
    )
  );

  const academies =
    academyIds.length > 0
      ? await Academy.find({ _id: { $in: academyIds } })
          .select('_id name slug accentColor')
          .lean()
      : [];

  const academyMap = new Map<string, any>(
    academies.map((a: any) => [
      String(a._id),
      {
        name: String(a.name || ''),
        slug: String(a.slug || ''),
        accentColor: String(a.accentColor || '#10b981'),
      },
    ])
  );

  return teachers
    .filter((t: any) => t && t._id)
    .map((t: any) => {
      const academy = academyMap.get(String(t.academyId));
      return {
        _id: String(t._id),
        name: String(t.name || 'Teacher'),
        email: String(t.email || ''),
        gender: String(t.gender || 'male'),
        subjects: Array.isArray(t.subjects) ? t.subjects : [],
        bio: String(t.bio || ''),
        audioUrl: String(t.audioUrl || ''),
        profileImage: String(t.profileImage || ''),
        isAvailable: t.isAvailable ?? true,
        academyName: academy?.name || '',
        academySlug: academy?.slug || '',
        academyAccent: academy?.accentColor || '#10b981',
      };
    });
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function ExplorePage() {
  const [academies, teachers] = await Promise.all([
    getAcademies(),
    getTeachers(),
  ]);

  const totalTeachers = academies.reduce(
    (s, a) => s + (a.teacherCount || 0),
    0
  );
  const totalCourses = academies.reduce(
    (s, a) => s + (a.courseCount || 0),
    0
  );
  const totalStudents = academies.reduce(
    (s, a) => s + (a.studentCount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      {/* ============================================
          HERO
      ============================================ */}

      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
          <div className="absolute top-40 -left-20 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-emerald-100/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-200 shadow-sm text-emerald-700 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {academies.length} Academies • {teachers.length} Teachers Live
          </span>

          <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-950 tracking-tight leading-[1.05]">
            Discover Your
            <span className="block bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Learning Community
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Explore top-rated Islamic academies, meet inspiring teachers, and
            join thousands of learners on their journey — all in one place.
          </p>

          {/* Search bar */}
          <div className="mt-9 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <span className="pl-5 text-gray-400 text-xl">🔍</span>
                <input
                  type="text"
                  placeholder="Search academies, teachers, or courses..."
                  className="flex-1 px-4 py-4 text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                />
                <button className="mr-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          STATS STRIP
      ============================================ */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Academies', value: academies.length, icon: '🏫' },
            { label: 'Teachers', value: totalTeachers, icon: '👨‍🏫' },
            { label: 'Courses', value: totalCourses, icon: '📚' },
            { label: 'Students', value: totalStudents, icon: '🎓' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100/60 p-5 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-3xl mb-1">{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCount(s.value)}+
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          ACADEMIES GRID
      ============================================ */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
              Trending Now
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">
              🏫 Featured Academies
            </h2>
            <p className="text-gray-500 mt-1">
              Discover, follow, and connect with academies you love.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            <button className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg">
              All
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-emerald-700 text-sm font-medium rounded-lg transition">
              Popular
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-emerald-700 text-sm font-medium rounded-lg transition">
              New
            </button>
          </div>
        </div>

        {academies.length === 0 ? (
          <div className="text-center py-24 bg-white/60 backdrop-blur rounded-3xl border-2 border-dashed border-emerald-200">
            <div className="text-6xl mb-4">🏜️</div>
            <p className="text-gray-500 text-lg mb-2">
              No academies available yet.
            </p>
            <Link
              href="/signup"
              className="inline-block mt-2 text-emerald-600 font-semibold hover:underline"
            >
              Be the first to create one →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {academies.map((academy, idx) => {
              const accent = academy.accentColor || '#10b981';
              const hasThumbnail = isImageUrl(academy.thumbnail);
              const hasLogo = isImageUrl(academy.logo);
              const isFeatured = idx < 3;

              return (
                <div
                  key={academy._id}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Featured badge */}
                  {isFeatured && (
                    <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-amber-600 shadow-md">
                      ⭐ Featured
                    </div>
                  )}

                  {/* ============================================
                      ✅ COVER — Real thumbnail یا gradient
                  ============================================ */}
                  <div
                    className="h-44 relative flex items-center justify-center overflow-hidden"
                    style={{
                      background: hasThumbnail
                        ? `url(${academy.thumbnail})`
                        : `linear-gradient(135deg, ${accent}, ${accent}cc, ${accent}88)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {/* Overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                    {/* Decorative circles (only when no thumbnail) */}
                    {!hasThumbnail && (
                      <>
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
                        <div className="absolute top-6 right-10 w-3 h-3 bg-white/30 rounded-full" />
                        <div className="absolute bottom-6 right-20 w-2 h-2 bg-white/30 rounded-full" />
                      </>
                    )}

                    {/* Logo / Emoji — only if no thumbnail (thumbnail itself is enough) */}
                    {!hasThumbnail && (
                      <span className="text-6xl relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
                        {hasLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={academy.logo}
                            alt={academy.name}
                            className="w-20 h-20 rounded-2xl object-cover border-4 border-white/40 shadow-2xl"
                          />
                        ) : (
                          academy.logo || '🏛️'
                        )}
                      </span>
                    )}

                    {/* Verified pill */}
                    <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-emerald-700 shadow-sm">
                      <svg viewBox="0 0 20 20" className="w-3 h-3 fill-emerald-600">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified
                    </div>

                    {/* Rating badge */}
                    {academy.ratingCount > 0 && (
                      <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[10px] font-bold text-white shadow-sm">
                        <span className="text-amber-400">★</span>
                        {academy.avgRating.toFixed(1)}
                        <span className="opacity-60">
                          ({academy.ratingCount})
                        </span>
                      </div>
                    )}

                    {/* Followers badge */}
                    {academy.followerCount > 0 && (
                      <div className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-700 shadow-sm">
                        <span className="text-violet-600">👥</span>
                        {formatCount(academy.followerCount)}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-emerald-600 transition">
                      {academy.name}
                    </h3>

                    <p className="text-gray-600 text-sm mt-2 line-clamp-2 min-h-[2.5rem] leading-relaxed flex-1">
                      {academy.description ||
                        'An educational academy on the platform.'}
                    </p>

                    {/* Stats row */}
                    <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCount(academy.teacherCount || 0)}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                          Teachers
                        </p>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCount(academy.courseCount || 0)}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                          Courses
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCount(academy.studentCount || 0)}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                          Students
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/academy/${academy.slug}`}
                        className="flex-1 text-center text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                        }}
                      >
                        Visit Academy
                      </Link>
                      <button
                        type="button"
                        aria-label="Follow academy"
                        className="px-4 py-2.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 text-gray-700 font-semibold rounded-xl transition"
                      >
                        + Follow
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================
          ✅ TEACHERS SECTION — الگ الگ teachers
      ============================================ */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
              Meet the Experts
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">
              👨‍🏫 Featured Teachers
            </h2>
            <p className="text-gray-500 mt-1">
              Connect with certified teachers from top academies.
            </p>
          </div>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur rounded-3xl border-2 border-dashed border-emerald-200">
            <div className="text-5xl mb-4">👨‍🏫</div>
            <p className="text-gray-500 text-lg">No teachers available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teachers.map((teacher) => (
              <TeacherCard key={teacher._id} teacher={teacher} />
            ))}
          </div>
        )}
      </section>

      {/* ============================================
          CTA STRIP
      ============================================ */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-10 md:p-14 text-center shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="mt-3 text-emerald-50 text-lg max-w-xl mx-auto">
              Create your own academy and start teaching today. It only takes
              a few minutes.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-emerald-700 hover:bg-gray-50 font-bold rounded-xl shadow-lg transition"
              >
                Create Academy
                <span>→</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   TEACHER CARD COMPONENT
   ============================================================ */

function TeacherCard({ teacher }: { teacher: any }) {
  const isFemale = teacher.gender === 'female';
  const hasImage = !isFemale && isImageUrl(teacher.profileImage);
  const accent = teacher.academyAccent || '#10b981';

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Cover / Header */}
      <div
        className="h-24 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

        {/* Available badge */}
        {teacher.isAvailable && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-full text-[9px] font-bold text-emerald-700 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Available
          </div>
        )}
      </div>

      {/* Avatar — overlapping */}
      <div className="relative px-4">
        <div className="absolute -top-10 left-4">
          {hasImage ? (
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teacher.profileImage}
                alt={teacher.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : isFemale ? (
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-400 via-pink-500 to-fuchsia-600 flex items-center justify-center text-white border-4 border-white shadow-lg">
              <span className="text-3xl">✨</span>
            </div>
          ) : (
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              }}
            >
              {getInitials(teacher.name)}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pt-12 flex flex-col flex-1">
        <h3 className="text-base font-bold text-gray-900 truncate">
          {teacher.name}
        </h3>

        {teacher.academyName && (
          <Link
            href={`/academy/${teacher.academySlug}`}
            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium truncate mt-0.5 inline-flex items-center gap-1"
          >
            🏫 {teacher.academyName}
          </Link>
        )}

        {teacher.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {teacher.subjects.slice(0, 3).map((subject: string) => (
              <span
                key={subject}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
              >
                {subject}
              </span>
            ))}
            {teacher.subjects.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                +{teacher.subjects.length - 3}
              </span>
            )}
          </div>
        )}

        {teacher.bio && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed flex-1">
            {teacher.bio}
          </p>
        )}

        {/* Audio preview */}
        {teacher.audioUrl && (
          <div className="mt-3 rounded-lg bg-purple-50 border border-purple-100 p-2">
            <div className="flex items-center gap-2">
              <span className="text-purple-600 text-sm">🎤</span>
              <audio controls className="h-7 w-full">
                <source src={teacher.audioUrl} type="audio/mpeg" />
              </audio>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
          <a
            href={`mailto:${teacher.email}?subject=Inquiry about classes`}
            className="flex-1 text-center text-xs font-bold py-2.5 rounded-xl transition text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            }}
          >
            Contact
          </a>

          {teacher.audioUrl && (
            <button
              type="button"
              aria-label="Play intro"
              className="px-3 py-2.5 bg-gray-100 hover:bg-purple-50 hover:text-purple-600 text-gray-700 rounded-xl transition"
              title="Voice introduction available"
            >
              🎧
            </button>
          )}
        </div>
      </div>
    </div>
  );
}