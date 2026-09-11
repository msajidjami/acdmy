// app/owner/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Inquiry from '@/models/Inquiry';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Course from '@/models/Course';
import AlertBanner from '@/app/components/AlertBanner';
import MessagesSection from '@/app/components/MessagesSection';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/* ------------------ Data ------------------ */

async function getOwnerData(userId: string) {
  await connectDB();

  const academy = await Academy.findOne({ ownerId: userId });
  if (!academy) {
    return {
      academy: null,
      inquiries: [],
      teacherCount: 0,
      studentCount: 0,
      courseCount: 0,
      pendingCount: 0,
    };
  }

  const [inquiries, teacherCount, studentCount, courseCount] = await Promise.all([
    Inquiry.find({ academyId: academy._id }).sort({ createdAt: -1 }).lean(),
    Teacher.countDocuments({ academyId: academy._id }),
    Student.countDocuments({ academyId: academy._id }),
    Course.countDocuments({ academyId: academy._id, isActive: true }),
  ]);

  // ✅ inquiries کو سادہ آبجیکٹ میں تبدیل کریں
  const serializedInquiries = inquiries.map((inquiry: any) => ({
    _id: inquiry._id.toString(),
    name: inquiry.name || '',
    email: inquiry.email || '',
    phone: inquiry.phone || '',
    message: inquiry.message || '',
    academyId: inquiry.academyId.toString(),
    status: inquiry.status || 'new',
    notes: inquiry.notes || '',
    createdAt: inquiry.createdAt
      ? new Date(inquiry.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: inquiry.updatedAt
      ? new Date(inquiry.updatedAt).toISOString()
      : new Date().toISOString(),
    repliedAt: inquiry.repliedAt
      ? new Date(inquiry.repliedAt).toISOString()
      : undefined,
    __v: inquiry.__v,
  }));

  const pendingCount = serializedInquiries.filter(
    (i) => i.status === 'new' || i.status === 'pending'
  ).length;

  return {
    academy: academy
      ? { ...academy.toObject(), _id: academy._id.toString() }
      : null,
    inquiries: serializedInquiries,
    teacherCount,
    studentCount,
    courseCount,
    pendingCount,
  };
}

interface SearchParams {
  success?: string;
  deleted?: string;
}

/* ------------------ Page ------------------ */

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const success = params.success === 'true';
  const deleted = params.deleted === 'true';

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let userId = '';
  let userRole = '';
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    userId = decoded.userId;
    userRole = decoded.role;
    if (userRole !== 'owner' && userRole !== 'admin') redirect('/');
  } catch {
    redirect('/login');
  }

  const {
    academy,
    inquiries,
    teacherCount,
    studentCount,
    courseCount,
    pendingCount,
  } = await getOwnerData(userId);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ===== ALERTS ===== */}
      {success && (
        <AlertBanner
          type="success"
          title="Success!"
          message={
            academy
              ? 'Your academy has been updated successfully!'
              : 'Your academy has been created successfully!'
          }
          onDismiss={() => {}}
        />
      )}
      {deleted && (
        <AlertBanner
          type="deleted"
          title="Deleted!"
          message="Your academy has been deleted."
          onDismiss={() => {}}
        />
      )}

      {/* ===== WELCOME HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-6 sm:p-8 shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-teal-300 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white/90 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              {academy ? 'Academy Active' : 'Setup Required'}
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Welcome back, Owner 👋
            </h1>
            <p className="mt-2 text-emerald-100 text-sm sm:text-base max-w-xl">
              {academy
                ? `Here's what's happening at ${academy.name} today.`
                : "Let's get your Islamic academy up and running."}
            </p>
          </div>

          {!academy ? (
            <Link
              href="/owner/academy"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap shrink-0"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Create Academy
            </Link>
          ) : (
            <Link
              href="/owner/academy"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap shrink-0"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Edit Academy
            </Link>
          )}
        </div>
      </div>

      {/* ===== NO ACADEMY ===== */}
      {!academy ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-emerald-200 shadow-sm">
          <div className="text-6xl mb-4">🏛️</div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            No Academy Yet
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
            You haven&apos;t created an academy yet. Start by creating your Islamic
            academy and inviting teachers.
          </p>
          <Link
            href="/owner/academy"
            className="inline-flex items-center gap-2 mt-6 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 transition"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Create Your Academy
          </Link>
        </div>
      ) : (
        <>
          {/* ===== PRIMARY STATS ===== */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Overview
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Key metrics at a glance
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full">
                <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                All looking good
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Academy */}
              <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                    Active
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900 truncate">
                  {academy.name}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  Your Academy
                </p>
                <Link
                  href="/owner/academy"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                >
                  Edit <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>

              {/* Teachers */}
              <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                    Team
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {teacherCount}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  Teachers
                </p>
                <Link
                  href="/owner/teachers"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  Manage <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>

              {/* Students */}
              <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-purple-50 flex items-center justify-center">
                    <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                    Learners
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {studentCount}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  Students
                </p>
                <Link
                  href="/owner/students"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition"
                >
                  View all <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>

              {/* Messages */}
              <div className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center">
                    <EnvelopeIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  {pendingCount > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-rose-50 text-rose-600">
                      {pendingCount} new
                    </span>
                  )}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {inquiries.length}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  Total Messages
                </p>
                <p className="mt-4 text-xs font-semibold text-amber-600">
                  {pendingCount} unread
                </p>
              </div>
            </div>
          </div>

          {/* ===== MESSAGES + SIDE METRICS ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Messages Section */}
            <div className="lg:col-span-2 min-w-0">
              <MessagesSection
                initialInquiries={inquiries}
                academyId={academy._id}
              />
            </div>

            {/* Side Metrics */}
            <div className="space-y-4 min-w-0">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ChartBarIcon className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Academy Metrics
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        Teachers
                      </span>
                    </div>
                    <span className="text-base font-bold text-slate-900">
                      {teacherCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                        <AcademicCapIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        Students
                      </span>
                    </div>
                    <span className="text-base font-bold text-slate-900">
                      {studentCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <BookOpenIcon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        Courses
                      </span>
                    </div>
                    <span className="text-base font-bold text-slate-900">
                      {courseCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                        <EnvelopeIcon className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        Messages
                      </span>
                    </div>
                    <span className="text-base font-bold text-slate-900">
                      {inquiries.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tip Card */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                    <SparklesIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Pro Tip
                    </p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Reply to messages quickly to build trust with prospective
                      students.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== QUICK ACTIONS ===== */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                Quick Actions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage your academy with one click
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/owner/academy"
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition">
                      Edit Academy
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Update your academy details
                    </p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>

              <Link
                href="/owner/teachers"
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition">
                      Manage Teachers
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Add or remove teachers
                    </p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>

              <Link
                href="/owner/inquiries"
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden sm:col-span-2 lg:col-span-1"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <EnvelopeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-amber-700 transition">
                        All Messages
                      </h3>
                      {pendingCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                          {pendingCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      View full list of messages
                    </p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}