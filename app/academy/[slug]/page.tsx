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
import FollowButton from '@/app/components/FollowButton';
import RatingForm from '@/app/components/RatingForm';
import StarDisplay from '@/app/components/StarDisplay';

import {
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  MapPinIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CheckBadgeIcon,
  StarIcon,
  BuildingOfficeIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

/* ============================================================
   HELPERS
   ============================================================ */

function isImageUrl(value: string): boolean {
  if (!value) return false;
  const v = value.trim();
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('/') ||
    v.startsWith('data:image')
  );
}

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

  const [teacherCount, teachers, courses] = await Promise.all([
    Teacher.countDocuments({ academyId: academy._id }),
    Teacher.find({ academyId: academy._id }).limit(10).lean(),
    Course.find({ academyId: academy._id, isActive: true })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const sanitizedTeachers = teachers
    .filter((t: any) => t && t._id)
    .map((t: any) => ({
      _id: String(t._id),
      name: t.name || 'Unknown',
      email: t.email || '',
      gender: t.gender || 'male',
      subjects: Array.isArray(t.subjects) ? t.subjects : [],
      bio: t.bio || '',
      audioUrl: t.audioUrl || '',
      profileImage: t.profileImage || '',
      isAvailable: t.isAvailable ?? true,
      createdAt: t.createdAt
        ? new Date(t.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: t.updatedAt
        ? new Date(t.updatedAt).toISOString()
        : new Date().toISOString(),
    }));

  const followerIds = Array.isArray((academy as any).followers)
    ? (academy as any).followers.map((f: any) => String(f))
    : [];

  const rawRatings = Array.isArray((academy as any).ratings)
    ? (academy as any).ratings
    : [];

  const recentRatings = [...rawRatings]
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  const reviewerIds = Array.from(
    new Set(recentRatings.map((r: any) => String(r.userId)).filter(Boolean))
  );

  const reviewers =
    reviewerIds.length > 0
      ? await User.find({ _id: { $in: reviewerIds } })
          .select('name email')
          .lean()
      : [];

  const reviewerMap = new Map(
    reviewers.map((u: any) => [
      String(u._id),
      { name: u.name || 'Anonymous', email: u.email || '' },
    ])
  );

  const ratings = recentRatings.map((r: any) => ({
    _id: String(r._id),
    stars: Number(r.stars) || 0,
    comment: String(r.comment || ''),
    createdAt: r.createdAt
      ? new Date(r.createdAt).toISOString()
      : new Date().toISOString(),
    userName: reviewerMap.get(String(r.userId))?.name || 'Anonymous',
    userId: String(r.userId),
  }));

  /* ✅ Thumbnail — trim + check */
  const rawThumbnail = String((academy as any).thumbnail || '').trim();
  const rawLogo = String((academy as any).logo || '').trim();

  return {
    _id: String(academy._id),
    name: String((academy as any).name || ''),
    slug: String((academy as any).slug || ''),
    description: String((academy as any).description || ''),
    logo: rawLogo,
    thumbnail: rawThumbnail,
    accentColor: String((academy as any).accentColor || '#10b981'),
    address: String((academy as any).address || ''),
    contactEmail: String((academy as any).contactEmail || ''),
    createdAt: (academy as any).createdAt
      ? new Date((academy as any).createdAt).toISOString()
      : null,

    teacherCount,
    courseCount: courses.length,
    followerCount: Number((academy as any).followerCount) || 0,
    avgRating: Number((academy as any).avgRating) || 0,
    ratingCount: Number((academy as any).ratingCount) || 0,

    followerIds,
    ratings,

    ownerId: (academy as any).ownerId
      ? {
          _id: String((academy as any).ownerId._id),
          name: String((academy as any).ownerId.name || 'Unknown'),
          email: String((academy as any).ownerId.email || ''),
        }
      : null,

    teachers: sanitizedTeachers,

    courses: courses.map((c: any) => ({
      _id: String(c._id),
      title: String(c.title || ''),
      description: String(c.description || ''),
      image: String(c.image || ''),
      thumbnail: String(c.thumbnail || c.image || ''),
      price: Number(c.price) || 0,
      duration: String(c.duration || ''),
      level: String(c.level || 'beginner'),
      category: String(c.category || ''),
      totalPages: Number(c.totalPages) || 0,
      bookTitle: String(c.bookTitle || ''),
      accentColor: String(c.accentColor || '#6366f1'),
    })),
  };
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    await connectDB();
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();
    if (!user) return null;

    return {
      id: String((user as any)._id),
      email: String((user as any).email || ''),
      role: String((user as any).role || ''),
    };
  } catch {
    return null;
  }
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function AcademyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [academy, user] = await Promise.all([
    getAcademyDetails(slug),
    getCurrentUser(),
  ]);

  if (!academy) {
    notFound();
  }

  /* ---------- Derived ---------- */

  const logoIsImage = isImageUrl(academy.logo);
  const hasHeroImage = isImageUrl(academy.thumbnail);
  const accent = academy.accentColor || '#10b981';

  const isOwner =
    user && academy.ownerId && String(academy.ownerId._id) === String(user.id);

  const isFollowing =
    user && academy.followerIds.includes(String(user.id));

  const userRating = user
    ? academy.ratings.find((r) => String(r.userId) === String(user.id)) || null
    : null;

  const canFollow = Boolean(user) && !isOwner;
  const canRate = Boolean(user) && !isOwner;

  /* ============================================================
     HERO BACKGROUND STYLE
     
     ✅ Using background-image instead of <img> tag
     - More reliable
     - No z-index issues
     - Works with absolute positioning everywhere
  ============================================================ */

  const heroStyle: React.CSSProperties = hasHeroImage
    ? {
        backgroundImage: `url(${academy.thumbnail})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        backgroundImage: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 50%, #0f172a 100%)`,
      };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ============================================
          HERO SECTION
      ============================================ */}

      <section
        className="relative overflow-hidden"
        style={heroStyle}
      >
        {/* ✅ Overlay — text readable، image visible */}
        <div
          className="absolute inset-0"
          style={{
            background: hasHeroImage
              ? `linear-gradient(180deg, ${accent}30 0%, ${accent}15 30%, rgba(0,0,0,0.5) 100%)`
              : 'transparent',
          }}
        />

        {/* Dark bottom gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: hasHeroImage
              ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.75) 100%)'
              : 'transparent',
          }}
        />

        {/* Decorative blobs (only when no image) */}
        {!hasHeroImage && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
        )}

        {/* Back button */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition border border-white/15 shadow-lg"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Explore</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        {/* Debug badge — thumbnail status (delete later) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 right-4 z-20 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/20">
            <p className="text-[9px] font-mono text-white/70">
              {hasHeroImage
                ? `✓ ${academy.thumbnail.slice(0, 30)}...`
                : '✗ No thumbnail'}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 md:py-20 min-h-[480px] sm:min-h-[520px] md:min-h-[560px] flex items-center">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 w-full">
            {/* Logo */}
            <div className="shrink-0">
              <div className="relative">
                <div className="h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center shadow-2xl overflow-hidden">
                  {logoIsImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={academy.logo}
                      alt={academy.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl sm:text-6xl md:text-7xl drop-shadow-xl">
                      {academy.logo || '🏛️'}
                    </span>
                  )}
                </div>

                <span className="absolute -bottom-1 -right-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-400 border-4 border-white shadow-xl flex items-center justify-center">
                  <CheckBadgeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/25 backdrop-blur-md border border-white/40 text-white text-xs font-bold shadow-lg">
                <SparklesIcon className="h-3.5 w-3.5" />
                Verified Academy
              </div>

              <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight break-words" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                {academy.name}
              </h1>

              {academy.description && (
                <p
                  className="mt-3 text-white/95 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed line-clamp-2"
                  style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
                >
                  {academy.description.slice(0, 160)}
                  {academy.description.length > 160 ? '...' : ''}
                </p>
              )}

              {/* Stats pills */}
              <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-md border border-white/40 px-3 py-1.5 rounded-full text-white font-bold shadow-lg">
                  <UserGroupIcon className="h-4 w-4" />
                  {academy.teacherCount} Teacher
                  {academy.teacherCount !== 1 ? 's' : ''}
                </span>

                <span className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-md border border-white/40 px-3 py-1.5 rounded-full text-white font-bold shadow-lg">
                  <BookOpenIcon className="h-4 w-4" />
                  {academy.courseCount} Course
                  {academy.courseCount !== 1 ? 's' : ''}
                </span>

                <span className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-md border border-white/40 px-3 py-1.5 rounded-full text-white font-bold shadow-lg">
                  <UserGroupIcon className="h-4 w-4" />
                  {academy.followerCount} Follower
                  {academy.followerCount !== 1 ? 's' : ''}
                </span>

                {academy.ratingCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-md border border-white/40 px-3 py-1.5 rounded-full text-white font-bold shadow-lg">
                    <StarIcon className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {academy.avgRating.toFixed(1)} ({academy.ratingCount})
                  </span>
                )}
              </div>

              {/* Follow + Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {canFollow && (
                  <FollowButton
                    slug={academy.slug}
                    initialFollowing={isFollowing}
                    initialCount={academy.followerCount}
                  />
                )}

                {isOwner && (
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/25 backdrop-blur-md border border-white/40 text-white text-xs sm:text-sm font-bold shadow-lg">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    You own this academy
                  </span>
                )}

                {!user && (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xl transition active:scale-95"
                  >
                    <UserGroupIcon className="h-4 w-4" />
                    Login to Follow
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          MAIN CONTENT
      ============================================ */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ---------- SIDEBAR ---------- */}
          <aside className="lg:w-80 flex-shrink-0 order-2 lg:order-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden lg:sticky lg:top-8 space-y-0">
              {/* Ratings Card */}
              <div className="p-6 border-b border-gray-100">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Average Rating
                  </p>

                  <div className="mt-2 flex items-center justify-center gap-3">
                    <p className="text-4xl font-bold text-slate-900">
                      {academy.avgRating.toFixed(1)}
                    </p>
                    <div className="flex flex-col items-start">
                      <StarDisplay rating={academy.avgRating} size={16} />
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {academy.ratingCount} rating
                        {academy.ratingCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academy Info */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-emerald-50/40 to-teal-50/40">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <AcademicCapIcon className="h-4 w-4 text-emerald-600" />
                  Academy Info
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Owner
                    </p>
                    <p className="text-sm text-gray-900 font-semibold mt-0.5">
                      {academy.ownerId?.name || 'Unknown'}
                    </p>
                  </div>

                  {academy.contactEmail && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Contact
                      </p>
                      <a
                        href={`mailto:${academy.contactEmail}`}
                        className="text-sm text-emerald-700 hover:text-emerald-800 font-medium mt-0.5 flex items-center gap-1.5 break-all"
                      >
                        <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" />
                        {academy.contactEmail}
                      </a>
                    </div>
                  )}

                  {academy.address && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Address
                      </p>
                      <p className="text-sm text-gray-800 mt-0.5 flex items-start gap-1.5">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" />
                        <span>{academy.address}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="p-6 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Statistics
                </p>
                <div className="space-y-2.5">
                  <StatRow
                    icon={<UserGroupIcon className="h-3.5 w-3.5" />}
                    label="Teachers"
                    value={academy.teacherCount}
                    color="text-sky-600"
                  />
                  <StatRow
                    icon={<BookOpenIcon className="h-3.5 w-3.5" />}
                    label="Courses"
                    value={academy.courseCount}
                    color="text-emerald-600"
                  />
                  <StatRow
                    icon={<UserGroupIcon className="h-3.5 w-3.5" />}
                    label="Followers"
                    value={academy.followerCount}
                    color="text-violet-600"
                  />
                  <StatRow
                    icon={<StarIcon className="h-3.5 w-3.5" />}
                    label="Ratings"
                    value={academy.ratingCount}
                    color="text-amber-600"
                  />
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-gray-600">Status</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Inquiry */}
              <div className="p-6">
                <InquiryModal
                  academyId={academy._id}
                  academyName={academy.name}
                />
              </div>
            </div>
          </aside>

          {/* ---------- MAIN ---------- */}
          <main className="flex-1 order-1 lg:order-2 space-y-6 sm:space-y-8">
            {/* About */}
            <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <span className="text-2xl sm:text-3xl">📖</span>
                About the Academy
              </h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                {academy.description}
              </p>
            </section>

            {/* Rating Form */}
            <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <StarIcon className="h-6 w-6 text-amber-500" />
                  Rate this Academy
                </h2>

                {academy.ratingCount > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                    <StarDisplay rating={academy.avgRating} size={12} />
                    <span className="text-xs font-bold text-amber-700">
                      {academy.avgRating.toFixed(1)} / 5
                    </span>
                  </div>
                )}
              </div>

              <RatingForm
                slug={academy.slug}
                initialRating={userRating?.stars || 0}
                initialComment={userRating?.comment || ''}
                disabled={!canRate}
              />
            </section>

            {/* Reviews List */}
            {academy.ratings.length > 0 && (
              <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <span className="text-2xl">💬</span>
                  Reviews ({academy.ratings.length})
                </h2>

                <div className="space-y-4">
                  {academy.ratings.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                          {r.userName.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {r.userName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StarDisplay rating={r.stars} size={12} />
                                <span className="text-[10px] text-slate-400">
                                  {new Date(r.createdAt).toLocaleDateString(
                                    'en-US',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {r.comment && (
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {r.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Courses */}
            {academy.courses.length > 0 && (
              <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <BookOpenIcon className="h-6 w-6 text-emerald-600" />
                  Courses ({academy.courses.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {academy.courses.map((course) => (
                    <div
                      key={course._id}
                      className="group bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-transparent transition-all overflow-hidden"
                    >
                      <div
                        className="h-1"
                        style={{
                          background: `linear-gradient(90deg, ${
                            course.accentColor || '#6366f1'
                          }, ${course.accentColor || '#6366f1'}cc)`,
                        }}
                      />

                      <div className="p-5">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          {course.title}
                        </h3>

                        {course.bookTitle && (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            📖 {course.bookTitle}
                          </p>
                        )}

                        <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                          {course.description || 'No description'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold capitalize">
                            {course.level}
                          </span>
                          {course.category && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full font-medium">
                              {course.category}
                            </span>
                          )}
                          {course.duration && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                              ⏱️ {course.duration}
                            </span>
                          )}
                          {course.totalPages > 0 && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                              📄 {course.totalPages}p
                            </span>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
                          <span className="text-base sm:text-lg font-bold text-indigo-600">
                            {course.price > 0 ? `$${course.price}` : 'Free'}
                          </span>
                          <EnrollButton courseId={course._id} user={user} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Teachers */}
            {academy.teachers.length > 0 && (
              <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <UserGroupIcon className="h-6 w-6 text-emerald-600" />
                  Teachers ({academy.teachers.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {academy.teachers.map((teacher) => (
                    <TeacherCard key={teacher._id} teacher={teacher} />
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <div
              className="relative overflow-hidden rounded-3xl shadow-xl p-6 sm:p-8 text-center text-white"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              }}
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
              </div>

              <div className="relative">
                <h3 className="text-2xl sm:text-3xl font-bold">
                  Ready to Learn?
                </h3>
                <p className="text-white/85 mt-2 max-w-2xl mx-auto text-sm sm:text-base">
                  Browse courses and start your educational journey with{' '}
                  {academy.name} today.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-100 font-bold px-6 py-3 rounded-xl transition shadow-lg text-sm"
                  >
                    Explore More Academies
                  </Link>
                  <InquiryModal
                    academyId={academy._id}
                    academyName={academy.name}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SUB COMPONENT
   ============================================================ */

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600 inline-flex items-center gap-1.5">
        <span className={color}>{icon}</span>
        {label}
      </span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}