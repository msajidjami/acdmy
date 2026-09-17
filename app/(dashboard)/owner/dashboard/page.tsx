// app/(dashboard)/owner/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import { Suspense } from 'react';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Inquiry from '@/models/Inquiry';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Course from '@/models/Course';
import Subscription from '@/models/Subscription';

import AlertBanner from '@/app/components/AlertBanner';
import MessagesSection from '@/app/components/MessagesSection';

import {
  type SerializedInquiry,
  serializeInquiry,
} from '@/app/types/inquiry';

import { getPlan, type PlanId } from '@/app/lib/plans';

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

import {
  Crown,
  Zap,
  Calendar,
  AlertTriangle,
  Lock,
  TrendingUp,
  Receipt,
  Clock,
} from 'lucide-react';

/* ============================================================
   FONT HELPERS
   ============================================================ */

const FONT_HEADING = {
  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
} as const;

const FONT_BODY = {
  fontFamily: 'var(--font-sora), Sora, sans-serif',
} as const;

const FONT_INHERIT = { fontFamily: 'inherit' } as const;

/* ============================================================
   TYPES
   ============================================================ */

interface JwtPayload {
  userId?: string;
  role?: string;
}

interface SearchParams {
  success?: string;
  deleted?: string;
  trial?: string;
  startTrial?: string;
  plan?: string;
}

interface SerializedAcademy {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  thumbnail: string;
  accentColor: string;
  isActive: boolean;
  isPublic: boolean;
  studentLimit: number;
  currentStudentCount: number;
  planId: string;
}

interface SubscriptionInfo {
  planId: PlanId;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'trial';
  billingCycle: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  daysTotal: number;
  daysPassed: number;
  daysRemaining: number;
  progressPercent: number;
  isExpired: boolean;
  isTrial: boolean;
  isFree: boolean;
  hasPendingPayment: boolean;
}

interface OwnerData {
  academy: SerializedAcademy | null;
  inquiries: SerializedInquiry[];
  teacherCount: number;
  studentCount: number;
  courseCount: number;
  pendingCount: number;
  subscription: SubscriptionInfo | null;
}

/* ============================================================
   FREE TRIAL ACTIVATION
   ============================================================ */

type TrialResult = 'created' | 'exists' | 'no-academy';

async function activateFreeTrial(userId: string): Promise<TrialResult> {
  await connectDB();

  const academy = await Academy.findOne({ ownerId: userId }).lean();
  if (!academy) return 'no-academy';

  const existingActive = await Subscription.findOne({
    academyId: academy._id,
    status: { $in: ['active', 'trial'] },
  }).lean();

  if (existingActive) return 'exists';

  const trialPlan = getPlan('trial');
  const studentLimit = trialPlan?.studentLimit ?? 20;
  const planName = trialPlan?.name ?? 'Free Trial';

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

  await Subscription.create({
    academyId: academy._id,
    ownerId: userId,
    planId: 'trial',
    planName,
    status: 'trial',
    billingCycle: 'monthly',
    startDate,
    endDate,
    amountUSD: 0,
    amountPKR: 0,
  });

  await Academy.updateOne(
    { _id: academy._id },
    {
      $set: {
        planId: 'trial',
        studentLimit,
        isActive: true,
        isPublic: true,
      },
    }
  );

  return 'created';
}

/* ============================================================
   DATA FETCH
   ============================================================ */

async function getOwnerData(userId: string): Promise<OwnerData> {
  await connectDB();

  const academy = await Academy.findOne({ ownerId: userId })
    .select(
      '_id name slug description logo thumbnail accentColor isActive isPublic studentLimit currentStudentCount planId'
    )
    .lean();

  if (!academy) {
    return {
      academy: null,
      inquiries: [],
      teacherCount: 0,
      studentCount: 0,
      courseCount: 0,
      pendingCount: 0,
      subscription: null,
    };
  }

  const [
    inquiriesRaw,
    teacherCount,
    studentCount,
    courseCount,
    subscriptionRaw,
    pendingProof,
  ] = await Promise.all([
    Inquiry.find({ academyId: academy._id }).sort({ createdAt: -1 }).lean(),
    Teacher.countDocuments({ academyId: academy._id }),
    Student.countDocuments({ academyId: academy._id }),
    Course.countDocuments({ academyId: academy._id, isActive: true }),
    Subscription.findOne({ academyId: academy._id })
      .sort({ createdAt: -1 })
      .lean(),
    (async () => {
      try {
        const PaymentProof = (await import('@/models/PaymentProof')).default;
        return await PaymentProof.findOne({
          academyId: academy._id,
          status: 'pending',
        }).lean();
      } catch {
        return null;
      }
    })(),
  ]);

  const inquiries: SerializedInquiry[] = inquiriesRaw.map(serializeInquiry);
  const pendingCount = inquiries.filter((i) => i.status === 'new').length;

  const serializedAcademy: SerializedAcademy = {
    _id: String(academy._id),
    name: String(academy.name || ''),
    slug: String((academy as any).slug || ''),
    description: String((academy as any).description || ''),
    logo: String((academy as any).logo || ''),
    thumbnail: String((academy as any).thumbnail || ''),
    accentColor: String((academy as any).accentColor || '#10b981'),
    isActive: (academy as any).isActive !== false,
    isPublic: (academy as any).isPublic === true,
    studentLimit: Number((academy as any).studentLimit || 0),
    currentStudentCount: Number((academy as any).currentStudentCount || 0),
    planId: String((academy as any).planId || 'free'),
  };

  let subscription: SubscriptionInfo | null = null;

  if (subscriptionRaw) {
    const sub: any = subscriptionRaw;

    const startDate = new Date(sub.startDate || sub.createdAt || new Date());
    const endDate = new Date(sub.endDate);
    const now = new Date();

    const totalMs = Math.max(1, endDate.getTime() - startDate.getTime());
    const daysTotal = Math.max(
      1,
      Math.ceil(totalMs / (1000 * 60 * 60 * 24))
    );

    const passedMs = Math.max(0, now.getTime() - startDate.getTime());
    const daysPassed = Math.min(
      daysTotal,
      Math.floor(passedMs / (1000 * 60 * 60 * 24))
    );

    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(
      0,
      Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    );

    const isExpired = endDate < now;

    const progressPercent = Math.min(
      100,
      Math.max(0, (daysPassed / daysTotal) * 100)
    );

    const planId = sub.planId as PlanId;
    const plan = getPlan(planId);

    subscription = {
      planId,
      planName: plan?.name || sub.planName || 'Free',
      status: sub.status,
      billingCycle: sub.billingCycle,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysTotal,
      daysPassed,
      daysRemaining,
      progressPercent,
      isExpired,
      isTrial: planId === 'trial',
      isFree: planId === ('free' as any),
      hasPendingPayment: Boolean(pendingProof),
    };
  } else {
    const now = new Date();
    subscription = {
      planId: 'trial' as PlanId,
      planName: 'Free',
      status: 'pending',
      billingCycle: 'monthly',
      startDate: now.toISOString(),
      endDate: now.toISOString(),
      daysTotal: 0,
      daysPassed: 0,
      daysRemaining: 0,
      progressPercent: 0,
      isExpired: false,
      isTrial: false,
      isFree: true,
      hasPendingPayment: Boolean(pendingProof),
    };
  }

  return {
    academy: serializedAcademy,
    inquiries,
    teacherCount,
    studentCount,
    courseCount,
    pendingCount,
    subscription,
  };
}

/* ============================================================
   HELPERS
   ============================================================ */

function getPlanBadgeStyle(planId: PlanId) {
  const styles: Record<
    string,
    { bg: string; text: string; gradient: string }
  > = {
    trial: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      gradient: 'from-slate-500 to-slate-600',
    },
    starter: {
      bg: 'bg-sky-100',
      text: 'text-sky-700',
      gradient: 'from-sky-500 to-blue-600',
    },
    growth: {
      bg: 'bg-violet-100',
      text: 'text-violet-700',
      gradient: 'from-violet-500 to-purple-600',
    },
    pro: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      gradient: 'from-emerald-500 to-teal-600',
    },
    business: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      gradient: 'from-amber-500 to-orange-600',
    },
    enterprise: {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      gradient: 'from-rose-500 to-pink-600',
    },
    free: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      gradient: 'from-slate-400 to-slate-500',
    },
  };
  return styles[planId] || styles.free;
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const showSuccess = params.success === 'true';
  const showDeleted = params.deleted === 'true';
  const showTrialStarted = params.trial === 'started';

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

  let decoded: JwtPayload;
  try {
    const result = jwt.verify(token, jwtSecret);
    if (typeof result === 'string') redirect('/login');
    decoded = result as JwtPayload;
  } catch {
    redirect('/login');
  }

  const userId = String(decoded.userId || '');
  const userRole = String(decoded.role || '');

  if (!userId) redirect('/login');
  if (userRole !== 'owner' && userRole !== 'admin') redirect('/');

  if (params.startTrial === 'true') {
    const result = await activateFreeTrial(userId);

    if (result === 'no-academy') {
      redirect('/owner/academy?needAcademy=true');
    }

    if (result === 'exists') {
      redirect('/owner/dashboard');
    }

    redirect('/owner/dashboard?trial=started');
  }

  const {
    academy,
    inquiries,
    teacherCount,
    studentCount,
    courseCount,
    pendingCount,
    subscription,
  } = await getOwnerData(userId);

  const planBadge = subscription
    ? getPlanBadgeStyle(subscription.planId)
    : getPlanBadgeStyle('free' as PlanId);

  return (
    <div className="space-y-6 sm:space-y-8" style={FONT_BODY}>
      {/* ===== ALERTS ===== */}
      {showTrialStarted && (
        <Suspense fallback={null}>
          <AlertBanner
            type="success"
            title="Free Trial Started"
            message="Your 14-day free trial is now active. You can start adding students right away!"
            paramKey="trial"
            autoDismissMs={8000}
          />
        </Suspense>
      )}

      {showSuccess && (
        <Suspense fallback={null}>
          <AlertBanner
            type="success"
            title="Success"
            message={
              academy
                ? 'Your academy has been updated successfully!'
                : 'Your academy has been created successfully!'
            }
            paramKey="success"
            autoDismissMs={6000}
          />
        </Suspense>
      )}
      {showDeleted && (
        <Suspense fallback={null}>
          <AlertBanner
            type="deleted"
            title="Deleted"
            message="Your academy has been deleted."
            paramKey="deleted"
            autoDismissMs={6000}
          />
        </Suspense>
      )}

      {/* ===== SUBSCRIPTION STATUS BANNER ===== */}
      {academy && subscription && (
        <SubscriptionBanner
          subscription={subscription}
          academy={academy}
          planBadge={planBadge}
        />
      )}

      {/* ===== WELCOME HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-6 sm:p-8 shadow-xl">
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

            <h1
              className="mt-3 text-4xl sm:text-5xl lg:text-6xl tracking-wider text-white leading-[0.95]"
              style={FONT_HEADING}
            >
              Welcome back, Owner
            </h1>
            <p className="mt-2 text-emerald-100 text-sm sm:text-base max-w-xl">
              {academy
                ? `Here's what's happening at ${academy.name} today.`
                : "Let's get your Islamic academy up and running."}
            </p>
          </div>

          <Link
            href="/owner/academy"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap shrink-0"
          >
            {academy ? (
              <>
                <PencilSquareIcon className="h-4 w-4" />
                Edit Academy
              </>
            ) : (
              <>
                <PlusCircleIcon className="h-4 w-4" />
                Create Academy
              </>
            )}
          </Link>
        </div>
      </div>

      {/* ===== NO ACADEMY ===== */}
      {!academy ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-emerald-200 shadow-sm">
          <div className="text-6xl mb-4">🏛️</div>
          <h3
            className="text-3xl tracking-wider text-slate-800"
            style={FONT_HEADING}
          >
            No Academy Yet
          </h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
            You haven&apos;t created an academy yet. Start by creating your
            Islamic academy and inviting teachers.
          </p>
          <Link
            href="/owner/academy"
            className="inline-flex items-center gap-2 mt-6 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 transition"
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
                <h2
                  className="text-3xl tracking-wider text-slate-800"
                  style={FONT_HEADING}
                >
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
                <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                    Active
                  </span>
                </div>
                <p
                  className="text-2xl tracking-wider text-slate-900 truncate"
                  style={FONT_HEADING}
                >
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
                <div className="absolute inset-x-0 top-0 h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                    Team
                  </span>
                </div>
                <p
                  className="text-4xl tracking-wider text-slate-900 leading-none"
                  style={FONT_HEADING}
                >
                  {teacherCount}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
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
                <div className="absolute inset-x-0 top-0 h-1 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-purple-50 flex items-center justify-center">
                    <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                    {academy.studentLimit > 0 && academy.studentLimit !== -1
                      ? `${academy.currentStudentCount}/${academy.studentLimit}`
                      : 'No limit'}
                  </span>
                </div>
                <p
                  className="text-4xl tracking-wider text-slate-900 leading-none"
                  style={FONT_HEADING}
                >
                  {studentCount}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
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
                <div className="absolute inset-x-0 top-0 h-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                <p
                  className="text-4xl tracking-wider text-slate-900 leading-none"
                  style={FONT_HEADING}
                >
                  {inquiries.length}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
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
            <div className="lg:col-span-2 min-w-0">
              <MessagesSection
                initialInquiries={inquiries}
                academyId={academy._id}
              />
            </div>

            <div className="space-y-4 min-w-0">
              {/* Plan Card */}
              {subscription && (
                <div className="rounded-2xl bg-white border border-slate-200 p-5 overflow-hidden relative">
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${planBadge.gradient}`}
                  />

                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="h-4 w-4 text-violet-600" />
                    <h3
                      className="text-2xl tracking-wider text-slate-800"
                      style={FONT_HEADING}
                    >
                      Your Plan
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${planBadge.bg} ${planBadge.text}`}
                      >
                        {subscription.isTrial ? (
                          <Zap className="h-3 w-3" />
                        ) : subscription.isFree ? (
                          <SparklesIcon className="h-3 w-3" />
                        ) : (
                          <Crown className="h-3 w-3" />
                        )}
                        {subscription.planName}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          subscription.status === 'active' ||
                          subscription.status === 'trial'
                            ? 'bg-emerald-100 text-emerald-700'
                            : subscription.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Days Passed
                          </p>
                          <p
                            className="text-3xl tracking-wider text-slate-800 mt-1 leading-none"
                            style={FONT_HEADING}
                          >
                            {subscription.daysPassed}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            of {subscription.daysTotal}
                          </p>
                        </div>

                        <div
                          className={`rounded-xl border p-3 text-center ${
                            subscription.daysRemaining <= 3
                              ? 'bg-rose-50 border-rose-100'
                              : subscription.daysRemaining <= 7
                              ? 'bg-amber-50 border-amber-100'
                              : 'bg-emerald-50 border-emerald-100'
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Days Left
                          </p>
                          <p
                            className={`text-3xl tracking-wider mt-1 leading-none ${
                              subscription.daysRemaining <= 3
                                ? 'text-rose-600'
                                : subscription.daysRemaining <= 7
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                            style={FONT_HEADING}
                          >
                            {subscription.daysRemaining}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            remaining
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-500">
                            Subscription Progress
                          </span>
                          <span className="text-[10px] font-bold text-slate-600">
                            {Math.round(subscription.progressPercent)}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              subscription.daysRemaining <= 3
                                ? 'bg-rose-500'
                                : subscription.daysRemaining <= 7
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${subscription.progressPercent}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Started:{' '}
                            {new Date(
                              subscription.startDate
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Ends:{' '}
                            {new Date(
                              subscription.endDate
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {(subscription.isFree ||
                      subscription.isExpired ||
                      subscription.daysRemaining <= 7) && (
                      <Link
                        href="/pricing"
                        className={`inline-flex items-center justify-center w-full gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition ${
                          subscription.isExpired
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-violet-600 hover:bg-violet-700'
                        }`}
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        {subscription.isExpired
                          ? 'Renew Now'
                          : subscription.isFree
                          ? 'Upgrade Plan'
                          : 'Upgrade'}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Academy Metrics */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ChartBarIcon className="h-4 w-4 text-emerald-600" />
                  <h3
                    className="text-2xl tracking-wider text-slate-800"
                    style={FONT_HEADING}
                  >
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
                    <span
                      className="text-2xl tracking-wider text-slate-900 leading-none"
                      style={FONT_HEADING}
                    >
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
                    <span
                      className="text-2xl tracking-wider text-slate-900 leading-none"
                      style={FONT_HEADING}
                    >
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
                    <span
                      className="text-2xl tracking-wider text-slate-900 leading-none"
                      style={FONT_HEADING}
                    >
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
                    <span
                      className="text-2xl tracking-wider text-slate-900 leading-none"
                      style={FONT_HEADING}
                    >
                      {inquiries.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                    <SparklesIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Pro Tip
                    </p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Reply to messages quickly to build trust with
                      prospective students.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== QUICK ACTIONS ===== */}
          <div>
            <div className="mb-4">
              <h2
                className="text-3xl tracking-wider text-slate-800"
                style={FONT_HEADING}
              >
                Quick Actions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage your academy with one click
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/owner/academy"
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xl tracking-wider text-slate-800 group-hover:text-emerald-700 transition"
                      style={FONT_HEADING}
                    >
                      Edit Academy
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Update details
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/owner/teachers"
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xl tracking-wider text-slate-800 group-hover:text-blue-700 transition"
                      style={FONT_HEADING}
                    >
                      Teachers
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage team
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/owner/billing"
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-violet-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-violet-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xl tracking-wider text-slate-800 group-hover:text-violet-700 transition"
                      style={FONT_HEADING}
                    >
                      Billing
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage plan
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/owner/inquiries"
                className="group relative bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <EnvelopeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-xl tracking-wider text-slate-800 group-hover:text-amber-700 transition"
                        style={FONT_HEADING}
                      >
                        Messages
                      </h3>
                      {pendingCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                          {pendingCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View inbox
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   SUBSCRIPTION BANNER
   ============================================================ */

function SubscriptionBanner({
  subscription,
  academy,
  planBadge,
}: {
  subscription: SubscriptionInfo;
  academy: SerializedAcademy;
  planBadge: { bg: string; text: string; gradient: string };
}) {
  const isExpired = subscription.isExpired;
  const isExpiringSoon =
    !isExpired &&
    subscription.daysRemaining <= 7 &&
    subscription.daysRemaining > 0;
  const isFree = subscription.isFree || !academy.isPublic;
  const hasPending = subscription.hasPendingPayment;
  const isTrial = subscription.isTrial;

  let bannerStyle = '';
  let icon = null;
  let title = '';
  let message = '';
  let ctaText = '';
  let ctaStyle = '';

  if (hasPending) {
    bannerStyle = 'bg-blue-50 border-blue-300';
    icon = <Clock className="h-6 w-6 text-blue-600" />;
    title = 'Payment Under Review';
    message =
      "We're verifying your payment. You'll be notified within 24 hours. Your plan will activate automatically.";
  } else if (isExpired) {
    bannerStyle = 'bg-rose-50 border-rose-300';
    icon = <AlertTriangle className="h-6 w-6 text-rose-600" />;
    title = 'Subscription Expired';
    message = `You used ${subscription.daysTotal} day${
      subscription.daysTotal !== 1 ? 's' : ''
    } of your ${subscription.planName} plan. Renew now to continue adding students and keep your academy public.`;
    ctaText = 'Renew Plan';
    ctaStyle = 'bg-rose-600 hover:bg-rose-700';
  } else if (isTrial) {
    bannerStyle = 'bg-violet-50 border-violet-300';
    icon = <Zap className="h-6 w-6 text-violet-600" />;
    title = `Free Trial — ${subscription.daysRemaining} day${
      subscription.daysRemaining !== 1 ? 's' : ''
    } left`;
    message = `You've used ${subscription.daysPassed} of ${subscription.daysTotal} days. Add students and explore all features. Upgrade anytime to keep your academy running without interruption.`;
    ctaText = 'Upgrade Now';
    ctaStyle = 'bg-violet-600 hover:bg-violet-700';
  } else if (isFree) {
    bannerStyle = 'bg-amber-50 border-amber-300';
    icon = <Lock className="h-6 w-6 text-amber-600" />;
    title = 'Free Plan — Upgrade Required';
    message =
      "You're on the Free plan. Upgrade to add students and make your academy public.";
    ctaText = 'View Plans';
    ctaStyle = 'bg-violet-600 hover:bg-violet-700';
  } else if (isExpiringSoon) {
    bannerStyle = 'bg-amber-50 border-amber-300';
    icon = <Clock className="h-6 w-6 text-amber-600" />;
    title = `Plan Expiring in ${subscription.daysRemaining} Day${
      subscription.daysRemaining !== 1 ? 's' : ''
    }`;
    message = `You've used ${subscription.daysPassed} of ${subscription.daysTotal} days. Your ${
      subscription.planName
    } plan will expire on ${new Date(subscription.endDate).toLocaleDateString(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }
    )}. Renew to avoid interruption.`;
    ctaText = 'Renew Now';
    ctaStyle = 'bg-amber-600 hover:bg-amber-700';
  } else {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="text-lg tracking-wider text-emerald-900"
                style={FONT_HEADING}
              >
                {subscription.planName} Plan Active
              </h3>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${planBadge.bg} ${planBadge.text}`}
              >
                {subscription.billingCycle}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              {subscription.daysPassed}/{subscription.daysTotal} days used ·{' '}
              {subscription.daysRemaining} day
              {subscription.daysRemaining !== 1 ? 's' : ''} left · Expires{' '}
              {new Date(subscription.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <Link
            href="/owner/billing"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition shrink-0"
          >
            Manage Plan
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 ${bannerStyle} p-5`}>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-2xl tracking-wider text-slate-900"
            style={FONT_HEADING}
          >
            {title}
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {message}
          </p>

          {ctaText && (
            <Link
              href="/pricing"
              className={`mt-3 inline-flex items-center gap-2 rounded-xl ${ctaStyle} px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg transition`}
            >
              <TrendingUp className="h-4 w-4" />
              {ctaText}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}