'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Crown,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Zap,
  Sparkles,
  CreditCard,
  Receipt,
  Building2,
  Info,
  Clock,
  XCircle,
  RefreshCw,
  Wallet,
  FileText,
} from 'lucide-react';
import {
  getPlan,
  formatUSD,
  formatPKR,
  type PlanId,
} from '@/app/lib/plans';

/* ============================================================
   TYPES
   ============================================================ */

interface SubscriptionInfo {
  _id: string;
  planId: string;
  planName: string;
  studentLimit: number;
  billingCycle: 'monthly' | 'yearly';
  amountUSD: number;
  amountPKR: number;
  currency: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'trial';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  invoices?: Array<{
    invoiceId: string;
    amount: number;
    currency: string;
    paidAt: string;
    status: string;
  }>;
}

interface AcademyInfo {
  _id: string;
  name: string;
  isPublic: boolean;
  studentLimit: number;
  currentStudentCount: number;
  planId: string;
}

interface SubscriptionResponse {
  subscription: SubscriptionInfo | null;
  academy: AcademyInfo | null;
  isExpired: boolean;
}

interface PaymentProof {
  _id: string;
  planName: string;
  billingCycle: string;
  amountUSD: number;
  amountPKR: number;
  paymentMethod: string;
  transactionId: string;
  receiptUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

function BillingContent() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [academy, setAcademy] = useState<AcademyInfo | null>(null);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [subRes, proofRes] = await Promise.all([
        fetch('/api/subscription/status', {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/subscription/proof-status', {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (!subRes.ok) throw new Error(`HTTP ${subRes.status}`);

      const subData: SubscriptionResponse = await subRes.json();
      setSubscription(subData.subscription);
      setAcademy(subData.academy);

      if (proofRes.ok) {
        const proofData = await proofRes.json();
        setProofs(proofData.proofs || []);
      } else {
        setProofs([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-violet-600 animate-spin mx-auto" />
          <p className="text-slate-500 mt-3 text-sm">
            Loading billing information...
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto mb-3" />
          <h2 className="font-bold text-rose-900">Could not load billing</h2>
          <p className="text-sm text-rose-700 mt-2">{error}</p>
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              void fetchAll();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const plan = subscription
    ? getPlan(subscription.planId as PlanId)
    : null;

  const currentStudents = academy?.currentStudentCount ?? 0;
  const studentLimit = academy?.studentLimit ?? 0;

  const usagePercent =
    studentLimit > 0 && studentLimit !== -1
      ? Math.min(100, Math.round((currentStudents / studentLimit) * 100))
      : 0;

  const isUnlimited = studentLimit === -1;

  const isActive =
    subscription?.status === 'active' || subscription?.status === 'trial';

  const endDate = subscription?.endDate
    ? new Date(subscription.endDate)
    : null;
  const daysRemaining = endDate
    ? Math.max(
        0,
        Math.ceil(
          (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const pendingProofs = proofs.filter((p) => p.status === 'pending');
  const approvedProofs = proofs.filter((p) => p.status === 'approved');
  const rejectedProofs = proofs.filter((p) => p.status === 'rejected');

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 pb-12">
      {/* ---------- Header ---------- */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Billing &amp; Subscription
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your plan, view usage, and upgrade anytime.
          </p>
        </div>

        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* ---------- No Subscription ---------- */}
      {!subscription && (
        <div className="rounded-3xl bg-white border-2 border-dashed border-violet-300 p-8 sm:p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            No Active Plan
          </h2>
          <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            You don&apos;t have an active subscription yet. Choose a plan to
            add students, go public, and use all features.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition"
          >
            <Sparkles className="h-4 w-4" />
            View Plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ---------- Active Plan Card ---------- */}
      {subscription && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-2xl">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/20 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur border border-white/30 text-xs font-bold uppercase tracking-wider">
                  <Crown className="h-3 w-3" />
                  Current Plan
                </div>
                <h2 className="mt-3 text-3xl font-bold">
                  {plan?.name || subscription.planName || 'Free'}
                </h2>
                <p className="text-violet-100 mt-1 text-sm">
                  {formatUSD(subscription.amountUSD)} /{' '}
                  {subscription.billingCycle === 'yearly' ? 'year' : 'month'}
                  <span className="opacity-60 mx-2">·</span>
                  {formatPKR(subscription.amountPKR)}
                </p>
              </div>

              <div
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isActive
                    ? 'bg-emerald-500/30 border border-emerald-300/50 text-emerald-50'
                    : 'bg-rose-500/30 border border-rose-300/50 text-rose-50'
                }`}
              >
                {subscription.status}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-3">
                <div className="flex items-center gap-2 text-violet-100 text-[10px] font-bold uppercase tracking-wider">
                  <Users className="h-3 w-3" />
                  Students
                </div>
                <p className="mt-1 text-xl font-bold">
                  {currentStudents}
                  {!isUnlimited && studentLimit > 0 && (
                    <span className="text-sm text-violet-200">
                      {' '}
                      / {studentLimit}
                    </span>
                  )}
                  {isUnlimited && (
                    <span className="text-sm text-violet-200"> / ∞</span>
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-3">
                <div className="flex items-center gap-2 text-violet-100 text-[10px] font-bold uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
                  Days Left
                </div>
                <p className="mt-1 text-xl font-bold">{daysRemaining}</p>
              </div>

              <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-3 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-violet-100 text-[10px] font-bold uppercase tracking-wider">
                  <TrendingUp className="h-3 w-3" />
                  Usage
                </div>
                <p className="mt-1 text-xl font-bold">
                  {isUnlimited ? '∞' : `${usagePercent}%`}
                </p>
              </div>
            </div>

            {/* Usage bar */}
            {!isUnlimited && studentLimit > 0 && (
              <div className="mt-4">
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      usagePercent >= 90
                        ? 'bg-rose-400'
                        : usagePercent >= 70
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-violet-100 mt-2">
                  {currentStudents} of {studentLimit} students used
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Upgrade prompt ---------- */}
      {subscription &&
        (!isActive || (!isUnlimited && usagePercent >= 80)) && (
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900">
                  {!isActive
                    ? 'Subscription Expired'
                    : 'Running out of student slots'}
                </h3>
                <p className="text-sm text-amber-800 mt-1">
                  {!isActive
                    ? 'Your plan has expired. Upgrade now to continue adding students and keep your academy public.'
                    : `You've used ${usagePercent}% of your student slots. Upgrade to add more.`}
                </p>
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:shadow-xl transition"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade Plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

      {/* ---------- Pending Proof Alert ---------- */}
      {pendingProofs.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900">
                {pendingProofs.length} payment
                {pendingProofs.length > 1 ? 's' : ''} under review
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Our team is verifying your payment. You&apos;ll receive an
                email once it&apos;s approved (within 24 hours).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Plan Features ---------- */}
      {plan && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900">
              What&apos;s included in your plan
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Current Subscription Details ---------- */}
      {subscription && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-600" />
            <h3 className="font-bold text-slate-900">
              Subscription Details
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-5 space-y-4">
              <DetailRow
                icon={<Crown className="h-4 w-4" />}
                label="Plan"
                value={plan?.name || subscription.planName}
              />
              <DetailRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Billing Cycle"
                value={
                  subscription.billingCycle === 'yearly'
                    ? 'Yearly'
                    : 'Monthly'
                }
                capitalize
              />
              <DetailRow
                icon={<Wallet className="h-4 w-4" />}
                label="Amount"
                value={`${formatUSD(subscription.amountUSD)} / ${formatPKR(
                  subscription.amountPKR
                )}`}
              />
              <DetailRow
                icon={<Receipt className="h-4 w-4" />}
                label="Payment Status"
                value={
                  subscription.paymentStatus.charAt(0).toUpperCase() +
                  subscription.paymentStatus.slice(1)
                }
                tone={
                  subscription.paymentStatus === 'paid'
                    ? 'emerald'
                    : subscription.paymentStatus === 'failed'
                    ? 'rose'
                    : 'amber'
                }
              />
            </div>

            <div className="p-5 space-y-4">
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Started"
                value={
                  subscription.startDate
                    ? new Date(subscription.startDate).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )
                    : '—'
                }
              />
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Expires"
                value={
                  subscription.endDate
                    ? new Date(subscription.endDate).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )
                    : '—'
                }
              />
              <DetailRow
                icon={<RefreshCw className="h-4 w-4" />}
                label="Auto Renew"
                value={subscription.autoRenew ? 'Enabled' : 'Disabled'}
                tone={subscription.autoRenew ? 'emerald' : 'slate'}
              />
              {subscription.paymentMethod && (
                <DetailRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Payment Method"
                  value={subscription.paymentMethod
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Actions ---------- */}
      {subscription && (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade / Change Plan
          </Link>

          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition"
          >
            Back to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ---------- Payment History ---------- */}
      {proofs.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-600" />
            <h3 className="font-bold text-slate-900">Payment History</h3>
            <span className="ml-auto text-xs text-slate-500">
              {proofs.length} record{proofs.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {proofs.map((p) => {
              const isPending = p.status === 'pending';
              const isApproved = p.status === 'approved';
              const isRejected = p.status === 'rejected';

              return (
                <div key={p._id} className="p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900">
                          {p.planName}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {p.billingCycle}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-700'
                              : isRejected
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isApproved && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {isRejected && <XCircle className="h-3 w-3" />}
                          {isPending && <Clock className="h-3 w-3" />}
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Ref:{' '}
                        <span className="font-mono">
                          {p.transactionId}
                        </span>
                        <span className="opacity-50 mx-2">·</span>
                        {new Date(p.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">
                        Method:{' '}
                        {p.paymentMethod.replace(/_/g, ' ')}
                      </p>

                      {p.adminNotes && (
                        <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs text-slate-600">
                          <strong>Note:</strong> {p.adminNotes}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-slate-900">
                        {p.amountUSD > 0
                          ? formatUSD(p.amountUSD)
                          : formatPKR(p.amountPKR)}
                      </p>
                      {p.receiptUrl && (
                        <a
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-600 hover:text-violet-700 font-semibold inline-flex items-center gap-1 mt-1"
                        >
                          <Receipt className="h-3 w-3" />
                          View Receipt
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- Support Footer ---------- */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
            <Info className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-800">Need help?</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              If you have any questions about billing, subscriptions, or
              payments, contact our support team at{' '}
              <a
                href="mailto:support@quranandislamic.com"
                className="text-violet-600 hover:text-violet-700 font-semibold"
              >
                support@quranandislamic.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function DetailRow({
  icon,
  label,
  value,
  tone,
  capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'emerald' | 'rose' | 'amber' | 'slate';
  capitalize?: boolean;
}) {
  const toneMap = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-700 bg-rose-50 border-rose-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    slate: 'text-slate-700 bg-slate-50 border-slate-200',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p
          className={`text-sm font-bold mt-0.5 ${
            tone
              ? `inline-flex px-2 py-0.5 rounded-full text-xs border ${toneMap[tone]}`
              : 'text-slate-900'
          } ${capitalize ? 'capitalize' : ''}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   WRAPPER
   ============================================================ */

export default function OwnerBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 text-violet-600 animate-spin" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}