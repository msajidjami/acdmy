import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Subscription from '@/models/Subscription';

import AssignmentsClient from './AssignmentsClient';

export const dynamic = 'force-dynamic';

/* ============================================================
   TYPES
   ============================================================ */

type JwtPayload = {
  userId?: string;
  role?: string;
};

type PlanReason =
  | 'active'
  | 'no-subscription'
  | 'pending'
  | 'expired'
  | 'unpaid'
  | 'no-academy';

type PlanCheckResult = {
  hasPlan: boolean;
  reason: PlanReason;
  planName?: string;
};

/* ============================================================
   ✅ PLAN CHECK — multiple subscriptions support
   ============================================================ */

async function checkAcademyPlan(
  academyId: unknown
): Promise<PlanCheckResult> {
  if (!academyId) {
    return { hasPlan: false, reason: 'no-academy' };
  }

  const now = new Date();

  /* 1. کوئی بھی ACTIVE subscription ڈھونڈیں */
  const activeSubscription = await Subscription.findOne({
    academyId,
    $or: [
      { paymentStatus: 'paid' },
      { status: 'active' },
      { status: 'trial' },
    ],
    $and: [
      {
        $or: [
          { endDate: { $gte: now } },
          { endDate: null },
          { endDate: { $exists: false } },
        ],
      },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  if (activeSubscription) {
    return {
      hasPlan: true,
      reason: 'active',
      planName: String((activeSubscription as any).planName || 'Plan'),
    };
  }

  /* 2. کوئی active نہیں → latest subscription کا reason */
  const latest = await Subscription.findOne({ academyId })
    .sort({ createdAt: -1 })
    .lean();

  if (!latest) {
    return { hasPlan: false, reason: 'no-subscription' };
  }

  const status = String((latest as any).status || '').toLowerCase();
  const endDate = (latest as any).endDate
    ? new Date((latest as any).endDate)
    : null;

  const planName = String((latest as any).planName || 'Plan');

  if (endDate && endDate.getTime() < now.getTime()) {
    return { hasPlan: false, reason: 'expired', planName };
  }

  if (status === 'cancelled') {
    return { hasPlan: false, reason: 'expired', planName };
  }

  if (status === 'pending') {
    return { hasPlan: false, reason: 'pending', planName };
  }

  return { hasPlan: false, reason: 'unpaid', planName };
}

/* ============================================================
   ✅ INLINE PAYWALL
   ============================================================ */

function InlinePaywall({
  reason,
  planName,
  academyName,
}: {
  reason: PlanReason;
  planName?: string;
  academyName?: string;
}) {
  const config: Record<
    PlanReason,
    {
      title: string;
      description: string;
      gradient: string;
      iconBg: string;
      icon: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel?: string;
      secondaryHref?: string;
    }
  > = {
    'no-academy': {
      title: 'Create your academy first',
      description:
        'You need an academy before accessing Assignments. Set up your academy in just 2 minutes.',
      gradient: 'from-indigo-500 to-purple-600',
      iconBg: 'bg-indigo-100',
      icon: '🏢',
      primaryLabel: 'Create Academy',
      primaryHref: '/owner/academy',
      secondaryLabel: 'View Plans',
      secondaryHref: '/pricing',
    },
    'no-subscription': {
      title: 'No active plan',
      description:
        'Your academy does not have an active subscription. Choose a plan to unlock teacher assignments, fee tracking, and premium features.',
      gradient: 'from-rose-500 to-pink-600',
      iconBg: 'bg-rose-100',
      icon: '🔒',
      primaryLabel: 'Choose a Plan',
      primaryHref: '/pricing',
      secondaryLabel: 'Go to Dashboard',
      secondaryHref: '/owner/dashboard',
    },
    pending: {
      title: 'Payment under review',
      description:
        'Your payment receipt has been submitted and is under review. Our team will verify it within 24 hours.',
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100',
      icon: '⏰',
      primaryLabel: 'View Billing',
      primaryHref: '/owner/billing',
      secondaryLabel: 'Go to Dashboard',
      secondaryHref: '/owner/dashboard',
    },
    expired: {
      title: 'Subscription expired',
      description:
        'Your academy subscription has expired. Renew now to restore access to assignments, fees, and all premium features.',
      gradient: 'from-rose-500 to-red-600',
      iconBg: 'bg-rose-100',
      icon: '🔴',
      primaryLabel: 'Renew Now',
      primaryHref: '/pricing',
      secondaryLabel: 'Go to Billing',
      secondaryHref: '/owner/billing',
    },
    unpaid: {
      title: 'Payment not confirmed',
      description:
        'Your subscription payment has not been confirmed yet. Please complete the payment or submit your receipt to activate your plan.',
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100',
      icon: '⚠️',
      primaryLabel: 'Go to Billing',
      primaryHref: '/owner/billing',
      secondaryLabel: 'Go to Dashboard',
      secondaryHref: '/owner/dashboard',
    },
    active: {
      title: 'Active',
      description: '',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100',
      icon: '✅',
      primaryLabel: '',
      primaryHref: '',
    },
  };

  const c = config[reason] || config['no-subscription'];

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl">
          <div className={`h-2 bg-gradient-to-r ${c.gradient}`} />

          <div className="p-8 sm:p-12 text-center">
            {/* Icon */}
            <div
              className={`inline-flex items-center justify-center h-20 w-20 rounded-3xl ${c.iconBg} shadow-lg mb-6 text-4xl`}
            >
              {c.icon}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {c.title}
            </h1>

            {academyName && (
              <p className="mt-2 text-sm text-slate-500">
                Academy:{' '}
                <strong className="text-slate-700">{academyName}</strong>
              </p>
            )}

            {planName && reason !== 'no-academy' && (
              <p className="mt-1 text-xs text-slate-400">
                Plan: <strong className="text-slate-600">{planName}</strong>
              </p>
            )}

            {/* Description */}
            <p className="mt-4 text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              {c.description}
            </p>

            {/* Feature Preview */}
            {(reason === 'no-subscription' || reason === 'expired') && (
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 p-5 text-left max-w-md mx-auto">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                  ✨ Active plan unlocks
                </p>
                <ul className="space-y-2">
                  {[
                    'Assign teachers to students',
                    'Set fees & track payments',
                    'LiveKit video classrooms',
                    'Earnings & profit reports',
                    'Priority support',
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <span className="text-emerald-500 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={c.primaryHref}
                className={`group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r ${c.gradient} text-white font-bold shadow-lg hover:shadow-xl transition active:scale-[0.98] w-full sm:w-auto justify-center`}
              >
                <span>
                  {reason === 'expired' || reason === 'unpaid' ? '🚀' : '✨'}
                </span>
                {c.primaryLabel}
                <span className="group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </a>

              {c.secondaryLabel && c.secondaryHref && (
                <a
                  href={c.secondaryHref}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 transition w-full sm:w-auto justify-center"
                >
                  {c.secondaryLabel}
                </a>
              )}
            </div>

            {/* Trust */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-500">🛡️</span>
              <span>Secure checkout · Cancel anytime · 14-day money-back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function OwnerAssignmentsPage() {
  /* ---------- 1. AUTH ---------- */
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  let userId = '';
  let userRole = '';

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing');

    const decoded = jwt.verify(token, secret) as JwtPayload;
    userId = String(decoded.userId || '');
    userRole = String(decoded.role || '');
  } catch {
    redirect('/login');
  }

  if (!userId) redirect('/login');
  if (userRole !== 'owner' && userRole !== 'admin') redirect('/');

  /* ---------- 2. LOAD USER + ACADEMY ---------- */
  await connectDB();

  const user = await User.findById(userId).select('name email role').lean();
  if (!user) redirect('/login');

  const academy = await Academy.findOne({ ownerId: userId })
    .select('name slug')
    .lean();

  /* ---------- 3. NO ACADEMY ---------- */
  if (!academy) {
    return <InlinePaywall reason="no-academy" />;
  }

  /* ---------- 4. PLAN CHECK ---------- */
  const planResult = await checkAcademyPlan((academy as any)._id);

  if (!planResult.hasPlan) {
    return (
      <InlinePaywall
        reason={planResult.reason}
        planName={planResult.planName}
        academyName={String((academy as any).name || '')}
      />
    );
  }

  /* ---------- 5. ACTIVE — Client (کوئی props نہیں) ---------- */
  return <AssignmentsClient />;
}