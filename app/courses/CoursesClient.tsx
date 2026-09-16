'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Filter,
  X,
  ChevronRight,
  MapPin,
  Clock,
  GraduationCap,
  Globe,
  CheckCircle2,
  Hourglass,
  BadgeCheck,
  Ban,
} from 'lucide-react';
import type { CoursesData, PublicCourse } from '@/app/lib/data/coursesData';
import EnrollmentModal from './EnrollmentModal';

/* ============================================================
   TYPES
   ============================================================ */

type SortKey = 'newest' | 'price-low' | 'price-high' | 'title';

type EnrollmentStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'rejected'
  | 'cancelled';

export type UserEnrollment = {
  courseId: string;
  status: EnrollmentStatus;
};

/* ============================================================
   HELPERS
   ============================================================ */

function getInitials(name: string): string {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length === 1
    ? p[0].charAt(0).toUpperCase()
    : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
}

function formatMoney(n: number, c: 'PKR' | 'USD' = 'PKR'): string {
  const v = Number(n) || 0;
  if (v === 0) return 'Free';
  return c === 'USD' ? `$${v.toFixed(2)}` : `₨${v.toLocaleString('en-PK')}`;
}

/* ============================================================
   ENROLLMENT STATUS META
   ============================================================ */

const ENROLLMENT_META: Record<
  EnrollmentStatus,
  {
    label: string;
    classes: string;
    icon: typeof CheckCircle2;
    description: string;
  }
> = {
  pending: {
    label: 'Request Pending',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Hourglass,
    description: 'Your request is under review',
  },
  approved: {
    label: 'Enrolled',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
    description: 'Your enrollment is confirmed',
  },
  active: {
    label: 'Active',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: BadgeCheck,
    description: 'You are actively enrolled',
  },
  rejected: {
    label: 'Not Approved',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: Ban,
    description: 'Your request was not approved',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Ban,
    description: 'Enrollment cancelled',
  },
};

/* ============================================================
   MAIN
   ============================================================ */

export default function CoursesClient({
  data,
  currentUser,
  userEnrollments = [],
}: {
  data: CoursesData;
  currentUser?: { name: string; email: string } | null;
  userEnrollments?: UserEnrollment[];
}) {
  const { courses, categories, levels, total } = data;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState<PublicCourse | null>(
    null
  );

  /* ✅ Local enrollment map — server se aata hai + client pe add hota hai */
  const [localEnrollments, setLocalEnrollments] =
    useState<UserEnrollment[]>(userEnrollments);

  const enrollmentMap = useMemo(() => {
    const map = new Map<string, EnrollmentStatus>();
    for (const e of localEnrollments) {
      map.set(e.courseId, e.status);
    }
    return map;
  }, [localEnrollments]);

  /* Stats for header */
  const enrolledCount = useMemo(
    () => localEnrollments.filter((e) => e.status !== 'rejected' && e.status !== 'cancelled').length,
    [localEnrollments]
  );

  /* ---------- Filter + Sort ---------- */
  const filtered = useMemo(() => {
    let list = [...courses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.academyName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCategory);
    }

    if (selectedLevel !== 'all') {
      list = list.filter((c) => c.level === selectedLevel);
    }

    if (priceFilter === 'free') {
      list = list.filter((c) => c.price === 0);
    } else if (priceFilter === 'paid') {
      list = list.filter((c) => c.price > 0);
    }

    /* ✅ Sort: enrolled courses hamesha upar rahen */
    list.sort((a, b) => {
      const aEnrolled = enrollmentMap.has(a._id) ? 1 : 0;
      const bEnrolled = enrollmentMap.has(b._id) ? 1 : 0;
      if (aEnrolled !== bEnrolled) return bEnrolled - aEnrolled;

      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
      }
    });

    return list;
  }, [
    courses,
    search,
    selectedCategory,
    selectedLevel,
    priceFilter,
    sortBy,
    enrollmentMap,
  ]);

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedLevel !== 'all' ||
    priceFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setPriceFilter('all');
  };

  /* ✅ After successful enrollment — add to local map */
  const handleEnrollSuccess = (courseId: string) => {
    setLocalEnrollments((prev) => {
      const filtered = prev.filter((e) => e.courseId !== courseId);
      return [...filtered, { courseId, status: 'pending' }];
    });
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <>
      <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* ============================================
            HEADER
        ============================================ */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            Course Directory
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
            Browse Courses
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
            Explore {total} course{total !== 1 ? 's' : ''} offered by verified
            academies. Filter by category, level, or price to find what you
            need.
          </p>

          {/* ✅ Enrollment summary (agar user ne kuch enroll kiya hai) */}
          {enrolledCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              <span className="text-xs font-semibold text-emerald-800">
                You have {enrolledCount} active enrollment
                {enrolledCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* ============================================
            SEARCH + FILTER BAR
        ============================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses, academies, or categories"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition"
              />
            </div>
          </div>

          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {hasActiveFilters && (
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                )}
              </button>

              <div
                className={`flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                  showFilters ? '' : 'hidden lg:grid'
                }`}
              >
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  {levels.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}
                    </option>
                  ))}
                </select>

                <select
                  value={priceFilter}
                  onChange={(e) =>
                    setPriceFilter(e.target.value as 'all' | 'free' | 'paid')
                  }
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-xs font-semibold text-slate-500 hidden sm:block whitespace-nowrap">
                  Sort by
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="title">Title (A–Z)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filtered.length}
                </span>{' '}
                result{filtered.length !== 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span className="text-slate-400"> of {total} total</span>
                )}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================
            COURSES GRID
        ============================================ */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {total === 0 ? 'No courses available' : 'No matching courses'}
            </h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
              {total === 0
                ? 'Courses will appear here once academies publish them.'
                : 'Try adjusting your search terms or filters to find more results.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((c) => (
              <CourseCard
                key={c._id}
                course={c}
                enrollmentStatus={enrollmentMap.get(c._id)}
                onEnroll={() => setEnrollingCourse(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          ENROLLMENT MODAL
      ============================================ */}
      {enrollingCourse && (
        <EnrollmentModal
          course={enrollingCourse}
          currentUser={currentUser || null}
          onClose={() => setEnrollingCourse(null)}
          onSuccess={() => handleEnrollSuccess(enrollingCourse._id)}
        />
      )}
    </>
  );
}

/* ============================================================
   COURSE CARD
   ============================================================ */

function CourseCard({
  course,
  enrollmentStatus,
  onEnroll,
}: {
  course: PublicCourse;
  enrollmentStatus?: EnrollmentStatus;
  onEnroll: () => void;
}) {
  const isFree = course.price === 0;
  const isEnrolled = Boolean(enrollmentStatus);
  const meta = enrollmentStatus ? ENROLLMENT_META[enrollmentStatus] : null;
  const StatusIcon = meta?.icon;

  return (
    <article
      className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${
        isEnrolled
          ? 'border-emerald-300 ring-1 ring-emerald-100'
          : 'border-slate-200 hover:shadow-lg hover:border-emerald-300'
      }`}
    >
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <BookOpen className="h-10 w-10 text-white/20" />
          </div>
        )}

        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur text-white text-[10px] font-semibold uppercase tracking-wider">
            <GraduationCap className="h-3 w-3" />
            {course.level}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${
              isFree ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900'
            }`}
          >
            {formatMoney(course.price, course.currency)}
          </span>
        </div>

        {/* ✅ Enrolled ribbon */}
        {isEnrolled && meta && StatusIcon && (
          <div className="absolute bottom-3 left-3 right-3">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-md backdrop-blur bg-white/95 border ${meta.classes}`}
            >
              <StatusIcon className="h-3 w-3" />
              {meta.label}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-1.5">
          {course.category}
        </p>

        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
          {course.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.duration}
            </span>
          )}
          {course.language && (
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {course.language}
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <Link
            href={`/academy/${course.academySlug}`}
            className="flex items-center gap-2 min-w-0 group/acad mb-3"
          >
            {course.academyLogo ? (
              <img
                src={course.academyLogo}
                alt={course.academyName}
                className="h-7 w-7 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {getInitials(course.academyName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-700 truncate group-hover/acad:text-emerald-700 transition">
                {course.academyName}
              </p>
              {(course.academyCity || course.academyCountry) && (
                <p className="text-[9px] text-slate-400 truncate inline-flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {[course.academyCity, course.academyCountry]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </Link>

          {/* ✅ Action: Enrolled status ya Enroll button */}
          {isEnrolled && meta && StatusIcon ? (
            <div
              className={`w-full py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${meta.classes}`}
              title={meta.description}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {meta.label}
            </div>
          ) : (
            <button
              type="button"
              onClick={onEnroll}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              Enroll Now
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}