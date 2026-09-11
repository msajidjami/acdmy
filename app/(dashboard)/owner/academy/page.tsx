import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

import Link from 'next/link';
import DeleteAcademyButton from '@/app/components/DeleteAcademyButton';
import {
  BuildingOfficeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  EnvelopeIcon,
  PhotoIcon,
  LinkIcon,
  ArrowRightIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

type JwtPayload = {
  userId?: string;
  role?: string;
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{
    success?: string;
    zoom?: string;
  }>;
};

export default async function OwnerAcademyPage({
  searchParams,
}: PageProps) {
  /* --------------------------------------------
     1. Authentication
  -------------------------------------------- */
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

  /* --------------------------------------------
     2. Authorization
  -------------------------------------------- */
  if (userRole !== 'owner' && userRole !== 'admin') {
    redirect('/');
  }

  /* --------------------------------------------
     3. Database
  -------------------------------------------- */
  await connectDB();

  const academy = await Academy.findOne({ ownerId: userId }).lean();
  const isEditing = Boolean(academy);

  const params = searchParams ? await searchParams : {};
  const isSuccess = params.success === 'true';

  const zoomConnected =
    academy?.zoomConnected === true && Boolean(academy?.zoomHostUserId);
  const zoomNotConfigured = params.zoom === 'not-configured';

  /* --------------------------------------------
     4. Page
  -------------------------------------------- */
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
        {/* Decorative blobs */}
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
            {params.zoom === 'connected' && (
              <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                <VideoCameraIcon className="h-3.5 w-3.5" />
                Zoom account connected successfully.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============================================
          ZOOM STATUS CARD
      ============================================ */}
      {isEditing && (
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-sm ${
            zoomConnected
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40'
              : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                zoomConnected ? 'bg-emerald-100' : 'bg-amber-100'
              }`}
            >
              {zoomConnected ? (
                <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <VideoCameraIcon
                  className={`h-4 w-4 ${
                    zoomConnected ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                />
                <h2
                  className={`font-bold text-sm sm:text-base ${
                    zoomConnected ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {zoomConnected
                    ? 'Zoom Account Connected'
                    : 'Zoom Account Not Configured'}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    zoomConnected
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {zoomConnected ? 'Active' : 'Setup Required'}
                </span>
              </div>

              {zoomConnected ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                      Host Email
                    </p>
                    <p className="text-xs sm:text-sm text-slate-800 mt-1 truncate font-medium">
                      {academy?.zoomHostEmail || 'Not available'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                      Zoom Host ID
                    </p>
                    <p className="text-xs sm:text-sm text-slate-800 mt-1 truncate font-medium">
                      {academy?.zoomHostUserId || 'Not available'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/70 border border-emerald-100 p-3">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                      Account ID
                    </p>
                    <p className="text-xs sm:text-sm text-slate-800 mt-1 truncate font-medium">
                      {academy?.zoomAccountId || 'Not available'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-xs sm:text-sm text-amber-700">
                    Zoom is not configured for this academy yet.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Save this academy after configuring the Zoom Server-to-Server
                    OAuth credentials in your environment.
                  </p>

                  {zoomNotConfigured && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200 text-amber-700 text-xs font-medium">
                      <InformationCircleIcon className="h-3.5 w-3.5" />
                      Zoom config missing from environment
                    </div>
                  )}
                </div>
              )}

              {zoomConnected && (
                <p className="mt-3 text-[11px] text-emerald-600 flex items-center gap-1">
                  <InformationCircleIcon className="h-3.5 w-3.5" />
                  This Zoom account will be used as host for your online classes.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          FORM
      ============================================ */}
      <form
        action="/api/owner/academy"
        method="POST"
        className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
      >
        {/* Form header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <BuildingOfficeIcon className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Academy Details
              </h2>
              <p className="text-[11px] text-slate-500">
                Fields marked with{' '}
                <span className="text-rose-500 font-semibold">*</span> are required
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          {/* Academy Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <BuildingOfficeIcon className="h-4 w-4 text-slate-400" />
              Academy Name
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              defaultValue={academy?.name || ''}
              required
              placeholder="e.g., Al-Qalam Islamic Academy"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <SparklesIcon className="h-4 w-4 text-slate-400" />
              Description
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={academy?.description || ''}
              required
              placeholder="Describe your academy, its vision, and what you offer..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm resize-none placeholder:text-slate-400 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400">
              This will be shown on your public academy page.
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <label
              htmlFor="contactEmail"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <EnvelopeIcon className="h-4 w-4 text-slate-400" />
              Contact Email
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              name="contactEmail"
              defaultValue={academy?.contactEmail || ''}
              required
              placeholder="academy@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400">
              Used for inquiries from prospective students.
            </p>
          </div>

          {/* Row: Logo + Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Logo */}
            <div className="space-y-2">
              <label
                htmlFor="logo"
                className="flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <PhotoIcon className="h-4 w-4 text-slate-400" />
                Logo URL
                <span className="text-slate-400 text-xs font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="logo"
                type="url"
                name="logo"
                defaultValue={academy?.logo || ''}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label
                htmlFor="slug"
                className="flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <LinkIcon className="h-4 w-4 text-slate-400" />
                Slug
                <span className="text-slate-400 text-xs font-normal">
                  (URL)
                </span>
              </label>
              <input
                id="slug"
                type="text"
                name="slug"
                defaultValue={academy?.slug || ''}
                placeholder="al-qalam-academy"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-slate-50/50 focus:bg-white text-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Slug preview */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Your public URL
            </p>
            <p className="text-xs sm:text-sm text-slate-600 truncate font-mono">
              quranandislamic.com/academy/
              <span className="text-emerald-600 font-semibold">
                {academy?.slug || 'your-slug'}
              </span>
            </p>
          </div>
        </div>

        {/* Form footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-300 active:scale-[0.98]"
            >
              <CheckCircleIcon className="h-5 w-5" />
              {isEditing ? 'Save Changes' : 'Create Academy'}
            </button>

            <Link
              href="/owner/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all duration-300"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

      {/* ============================================
          DANGER ZONE — Delete Academy
      ============================================ */}
      {isEditing && (
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
                associated data — teachers, students, courses, and messages — will
                also be removed.
              </p>
              <div className="mt-4">
                <DeleteAcademyButton academyId={academy!._id.toString()} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}