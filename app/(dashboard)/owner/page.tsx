import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Inquiry from '@/models/Inquiry';
import Teacher from '@/models/Teacher';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/* ============================================================
   DATA FETCH
   ============================================================ */

async function getOwnerData(userId: string) {
  await connectDB();

  const academy = await Academy.findOne({ ownerId: userId });
  if (!academy) return { academy: null, inquiries: [], teacherCount: 0 };

  const [inquiries, teacherCount] = await Promise.all([
    Inquiry.find({ academyId: academy._id }).sort({ createdAt: -1 }).lean(),
    Teacher.countDocuments({ academyId: academy._id }),
  ]);

  return { academy, inquiries, teacherCount };
}

interface SearchParams {
  success?: string;
  deleted?: string;
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return redirect('/login');

  let userId = '';
  let userRole = '';
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    userId = decoded.userId;
    userRole = decoded.role;
    if (userRole !== 'owner' && userRole !== 'admin') return redirect('/');
  } catch {
    return redirect('/login');
  }

  const { academy, inquiries, teacherCount } = await getOwnerData(userId);

  const success = searchParams.success === 'true';
  const deleted = searchParams.deleted === 'true';

  const pendingCount = inquiries.filter((i: any) => i.status === 'pending').length;
  const recentInquiries = inquiries.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* =========================================
          ALERTS
      ========================================= */}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-900 text-sm">Success</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              {academy
                ? 'Your academy has been updated.'
                : 'Your academy has been created.'}
            </p>
          </div>
          <Link
            href="/owner/dashboard"
            className="text-emerald-600 hover:text-emerald-800 shrink-0"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </Link>
        </div>
      )}

      {deleted && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <XMarkIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-rose-900 text-sm">Deleted</p>
            <p className="text-sm text-rose-700 mt-0.5">
              Your academy has been deleted.
            </p>
          </div>
          <Link
            href="/owner/dashboard"
            className="text-rose-600 hover:text-rose-800 shrink-0"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </Link>
        </div>
      )}

      {/* =========================================
          WELCOME
      ========================================= */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome back
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {academy
            ? `Here's what's happening at ${academy.name}`
            : 'Get started by creating your academy'}
        </p>
      </div>

      {/* =========================================
          NO ACADEMY YET
      ========================================= */}
      {!academy ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <BuildingOfficeIcon className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-4">
            No academy yet
          </h2>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">
            Create your academy to start adding teachers and receiving student
            inquiries.
          </p>
          <Link
            href="/owner/academy"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Create Academy
          </Link>
        </div>
      ) : (
        <>
          {/* =========================================
              STAT CARDS
          ========================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Academy */}
            <Link
              href="/owner/academy"
              className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <ArrowRightIcon className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-500 mt-3">Academy</p>
              <p className="text-base font-semibold text-slate-900 truncate mt-0.5">
                {academy.name}
              </p>
            </Link>

            {/* Teachers */}
            <Link
              href="/owner/teachers"
              className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                </div>
                <ArrowRightIcon className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-500 mt-3">Teachers</p>
              <p className="text-base font-semibold text-slate-900 mt-0.5">
                {teacherCount}
              </p>
            </Link>

            {/* Pending Inquiries */}
            <Link
              href="/owner/inquiries"
              className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <EnvelopeIcon className="h-5 w-5 text-amber-600" />
                </div>
                <ArrowRightIcon className="h-4 w-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-500 mt-3">Pending Inquiries</p>
              <p className="text-base font-semibold text-slate-900 mt-0.5">
                {pendingCount}
              </p>
            </Link>
          </div>

          {/* =========================================
              RECENT INQUIRIES
          ========================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Recent Inquiries
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest messages from your website
                </p>
              </div>
              {inquiries.length > 0 && (
                <Link
                  href="/owner/inquiries"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium shrink-0"
                >
                  View all
                </Link>
              )}
            </div>

            {recentInquiries.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentInquiries.map((inquiry: any) => (
                  <li
                    key={inquiry._id}
                    className="px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {inquiry.visitorName}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                              inquiry.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {inquiry.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                          {inquiry.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {new Date(inquiry.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <EnvelopeIcon className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 mt-3">
                  No inquiries yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Messages from your website will appear here
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}