'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getPlan, getPlanPrice, formatUSD, formatPKR, type PlanId, type BillingCycle } from '@/app/lib/plans';
import ManualCheckout from '../owner/billing/checkout/ManualCheckout';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = (searchParams.get('plan') || 'growth') as PlanId;
  const cycle = (searchParams.get('cycle') || 'monthly') as BillingCycle;

  const plan = getPlan(planId);
  if (!plan) return null;

  const price = getPlanPrice(plan, cycle);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 pb-12">
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Plans
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Checkout steps */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Complete your subscription
          </h1>

          <ManualCheckout planId={planId} billingCycle={cycle} />
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-white border-2 border-slate-200 overflow-hidden shadow-lg">
            <div className={`p-5 bg-gradient-to-br ${plan.gradient} text-white`}>
              <p className="text-xs font-bold uppercase tracking-wider">
                {plan.name}
              </p>
              <p className="text-2xl font-bold mt-2">
                {plan.studentLimit === -1
                  ? 'Unlimited Students'
                  : `Up to ${plan.studentLimit} Students`}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Billing</span>
                <span className="font-bold">{cycle}</span>
              </div>

              <div className="border-t border-dashed pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatUSD(price.usd)}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      ≈ {formatPKR(price.pkr)}
                    </p>
                  </div>
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-10 w-10 text-violet-600 animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}