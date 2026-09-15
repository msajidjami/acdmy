import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

import Link from 'next/link';
import DeleteAcademyButton from '@/app/components/DeleteAcademyButton';
import AcademyForm from './AcademyForm';

import {
  BuildingOfficeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserGroupIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

import StarDisplay from '@/app/components/StarDisplay';

type JwtPayload = {
  userId?: string;
  role?: string;
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{
    success?: string;
  }>;
};

export default async function OwnerAcademyPage({ searchParams }: PageProps) {
  /* ---------- AUTH ---------- */
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  let userId = '';
  let userRole = '';

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    userId = String(decoded.userId || '');
    userRole = String(decoded.role || '');
  } catch {
    redirect('/login');
  }

  if (userRole !== 'owner' && userRole !== 'admin') {
    redirect('/');
  }

  /* ---------- DB ---------- */
  await connectDB();

  const academy = await Academy.findOne({ ownerId: userId }).lean();
  const isEditing = Boolean(academy);

  const params = searchParams ? await searchParams : {};
  const isSuccess = params.success === 'true';

  /* ---------- Serialize ---------- */
  const academyData = academy
    ? {
        _id: String(academy._id),
        name: String((academy as any).name || ''),
        slug: String((academy as any).slug || ''),
        description: String((academy as any).description || ''),
        logo: String((academy as any).logo || ''),
        thumbnail: String((academy as any).thumbnail || ''),
        accentColor: String((academy as any).accentColor || '#10b981'),
        address: String((academy as any).address || ''),
        contactEmail: String((academy as any).contactEmail || ''),
        followerCount: Number((academy as any).followerCount) || 0,
        avgRating: Number((academy as any).avgRating) || 0,
        ratingCount: Number((academy as any).ratingCount) || 0,
      }
    : null;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* ============================================
          HERO HEADER
      ============================================ */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-xl ${
          isEditing
            ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700'
            : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700'
        }`}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-teal-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              {isEditing ? (
                <PencilSquareIcon className="h-7 w-7 text-white" />
              ) : (
                <BuildingOfficeIcon className="h-7 w-7 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
                <SparklesIcon className="h-3 w-3" />
                {isEditing ? 'Editing Mode' : 'Setup Wizard'}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-tight">
                {isEditing ? 'Edit Your Academy' : 'Register New Academy'}
              </h1>
              <p className="mt-1 text-white/80 text-sm sm:text-base max-w-lg">
                {isEditing
                  ? 'Update your academy details below to keep your profile fresh.'
                  : 'Fill in the details to create your Islamic academy and start teaching online.'}
              </p>
            </div>
          </div>

          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-semibold rounded-xl transition whitespace-nowrap shrink-0 border border-white/20"
          >
            <ArrowRightIcon className="h-4 w-4 rotate-180" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* ============================================
          SUCCESS ALERT
      ============================================ */}
      {isSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-800 text-sm">
              Saved successfully!
            </p>
            <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
              Academy information has been saved.
            </p>
          </div>
        </div>
      )}

      {/* ============================================
          STATS — Followers + Rating (Editing Only)
      ============================================ */}
      {isEditing && academyData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Followers */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50/40 p-5 shadow-sm">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />

            <div className="relative flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
                <UserGroupIcon className="h-7 w-7 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                  Followers
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-0.5">
                  {academyData.followerCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {academyData.followerCount === 0
                    ? 'No followers yet'
                    : 'People following your academy'}
                </p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 shadow-sm">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />

            <div className="relative flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                <StarIcon className="h-7 w-7 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Average Rating
                </p>

                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-3xl font-bold text-slate-900">
                    {academyData.avgRating.toFixed(1)}
                  </p>
                  <span className="text-sm font-semibold text-slate-400">
                    / 5
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <StarDisplay rating={academyData.avgRating} size={14} />
                  <span className="text-[11px] text-slate-500">
                    {academyData.ratingCount === 0
                      ? 'No ratings yet'
                      : `${academyData.ratingCount} rating${
                          academyData.ratingCount !== 1 ? 's' : ''
                        }`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          FORM — Client Component
      ============================================ */}
      <AcademyForm academy={academyData} isEditing={isEditing} />

      {/* ============================================
          DANGER ZONE
      ============================================ */}
      {isEditing && academy && (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50/40 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-rose-800 text-sm sm:text-base">
                Danger Zone
              </h3>
              <p className="text-xs sm:text-sm text-rose-700 mt-1 leading-relaxed">
                Deleting your academy is permanent and cannot be undone. All
                associated data — teachers, students, courses, and messages —
                will also be removed.
              </p>
              <div className="mt-4">
                <DeleteAcademyButton academyId={academy._id.toString()} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}