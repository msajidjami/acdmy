'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Lock,
  CheckCircle2,
} from 'lucide-react';

import {
  getPlan,
  getPlanPrice,
  formatUSD,
  formatPKR,
  type PlanId,
  type BillingCycle,
} from '@/app/lib/plans';

import ManualCheckout from './ManualCheckout';

function CheckoutContent() {
  const searchParams = useSearchParams();

  const planId = (searchParams.get('plan') || 'growth') as PlanId;
  const cycle = (searchParams.get('cycle') || 'monthly') as BillingCycle;

  const plan = getPlan(planId);

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <div className="rounded-3xl bg-white border-2 border-rose-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900">Invalid Plan</h2>
          <p className="text-slate-500 mt-2">
            The plan you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  const price = getPlanPrice(plan, cycle);
  const isYearly = cycle === 'yearly';

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-16">
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-600 transition group mb-6"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Plans
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider mb-4">
          <Lock className="h-3 w-3" />
          Secure Checkout
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Complete your subscription
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          Choose your payment method below. Your academy will be activated
          after verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
        <div className="min-w-0">
          <ManualCheckout planId={planId} billingCycle={cycle} />
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-white border-2 border-slate-200 overflow-hidden shadow-lg">
            <div
              className={`p-6 bg-gradient-to-br ${plan.gradient} text-white relative overflow-hidden`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                  Order Summary
                </p>
                <h2 className="text-2xl font-bold mt-2">{plan.name}</h2>
                <p className="text-sm text-white/90 mt-1">
                  {plan.studentLimit === -1
                    ? 'Unlimited Students'
                    : `Up to ${plan.studentLimit} Students`}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2.5 pb-4 border-b border-dashed border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Plan</span>
                  <span className="font-bold text-slate-900">{plan.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Billing</span>
                  <span className="font-bold text-slate-900">
                    {isYearly ? 'Yearly' : 'Monthly'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Students</span>
                  <span className="font-bold text-slate-900">
                    {plan.studentLimit === -1 ? '∞' : plan.studentLimit}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-700">Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-900">
                      {formatUSD(price.usd)}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      ≈ {formatPKR(price.pkr)}
                    </p>
                  </div>
                </div>

                {isYearly && (
                  <p className="mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 text-center">
                    🎉 You save {formatUSD(plan.amountUSD * 12 - plan.yearlyUSD)}{' '}
                    with yearly billing
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Includes
                </p>
                <ul className="space-y-2">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-semibold text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    Secure
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3 text-blue-500" />
                    Encrypted
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-violet-500" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-violet-600 animate-spin mx-auto" />
            <p className="text-slate-500 mt-3 text-sm">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}