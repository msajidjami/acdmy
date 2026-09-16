'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Rocket,
  Building2,
  Users,
  Star,
  ArrowRight,
  ShieldCheck,
  Gift,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

import {
  PLANS,
  formatUSD,
  formatPKR,
  getPlanPrice,
  type Plan,
  type BillingCycle,
} from '@/app/lib/plans';

/* ============================================================
   CHECKOUT URL HELPER
   ============================================================ */

function getCheckoutUrl(
  planId: string,
  cycle: BillingCycle
): string {
  return `/owner/billing/checkout?plan=${planId}&cycle=${cycle}`;
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function PricingPage() {
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">

      {/* ============================================
          HERO
      ============================================ */}

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 text-center">

        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-sm font-semibold">
          <Sparkles className="h-4 w-4" />
          Simple, Transparent Pricing
        </span>

        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
          Build your academy{' '}
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            for free
          </span>
        </h1>

        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Create your academy for free. Start with a 14-day
          trial, explore the platform, and upgrade when you
          are ready to grow.
        </p>

        {/* Trust indicators */}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">

          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            No credit card required
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-violet-500" />
            14-day free trial
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-blue-500" />
            Upgrade anytime
          </span>

        </div>

        {/* Billing toggle */}

        <div className="mt-8 inline-flex items-center gap-2 p-1 rounded-full bg-white border border-slate-200 shadow-sm">

          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition ${
              billingCycle === 'monthly'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yearly

            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              2 months free
            </span>
          </button>

        </div>

      </div>

      {/* ============================================
          PLANS GRID
      ============================================ */}

      <div className="mx-auto max-w-7xl px-4 pb-16">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
            />
          ))}

        </div>

      </div>

      {/* ============================================
          GUARANTEE
      ============================================ */}

      <div className="mx-auto max-w-4xl px-4 pb-20">

        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 sm:p-10 text-white text-center shadow-2xl relative overflow-hidden">

          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">

            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 mb-4">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold">
              14-Day Money-Back Guarantee
            </h2>

            <p className="mt-3 text-white/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              If you&apos;re not satisfied with your paid
              subscription within the first 14 days, contact
              our support team and we&apos;ll review your refund
              request according to our refund policy.
            </p>

          </div>

        </div>

      </div>

      {/* ============================================
          FAQ
      ============================================ */}

      <div className="mx-auto max-w-3xl px-4 pb-24">

        <div className="text-center mb-10">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
            Common Questions
          </h2>

        </div>

        <div className="space-y-3">

          {FAQ_ITEMS.map((faq, i) => (
            <FaqItem
              key={i}
              question={faq.question}
              answer={faq.answer}
            />
          ))}

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   FAQ DATA
   ============================================================ */

const FAQ_ITEMS = [
  {
    question: 'Can I really create an academy for free?',
    answer:
      'Yes! You can start with a 14-day free trial. During the trial, you can explore the platform and use the features included in the trial plan. No credit card is required.',
  },

  {
    question: 'How many students can I add during the free trial?',
    answer:
      'The free trial supports up to 5 students. When you need more students, you can upgrade to a paid plan.',
  },

  {
    question: 'What happens after the 14-day trial ends?',
    answer:
      'Your trial subscription expires after 14 days. You can then choose a paid plan if you want to continue using the student features and keep growing your academy.',
  },

  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept Payoneer, bank transfer, JazzCash, and Easypaisa. International customers can pay via Payoneer, while Pakistani customers can use bank transfer, JazzCash, or Easypaisa.',
  },

  {
    question: 'How long does activation take after payment?',
    answer:
      'Once you submit your payment receipt, our team verifies it within 24 hours. You will receive confirmation after your payment has been reviewed.',
  },

  {
    question: 'Can I upgrade or downgrade my plan later?',
    answer:
      'Yes. You can change your plan later according to your academy needs and student count.',
  },

  {
    question: 'What happens if I reach my student limit?',
    answer:
      "You won't be able to add new students until you upgrade to a plan with a higher student limit. Your existing data remains safe.",
  },

  {
    question: 'Can I use the free trial more than once?',
    answer:
      'No. Each owner can use the free trial only once. After the trial has been used, you need to choose a paid plan.',
  },
];

/* ============================================================
   FAQ ITEM
   ============================================================ */

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all hover:border-violet-200">

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50/50 transition"
      >

        <span className="font-bold text-slate-900 text-sm sm:text-base">
          {question}
        </span>

        <ChevronDown
          className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />

      </button>

      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-slate-600 leading-relaxed">
            {answer}
          </p>
        </div>
      )}

    </div>
  );
}

/* ============================================================
   PLAN CARD
   ============================================================ */

function PlanCard({
  plan,
  billingCycle,
}: {
  plan: Plan;
  billingCycle: BillingCycle;
}) {

  /* ----------------------------------------------------------
     PLAN STATUS
  ---------------------------------------------------------- */

  const isTrial = plan.id === 'trial';
  const isFree = plan.amountUSD === 0;

  const price = getPlanPrice(
    plan,
    billingCycle
  );

  const isYearly =
    billingCycle === 'yearly';

  /* ----------------------------------------------------------
     ACTIVATION STATE
  ---------------------------------------------------------- */

  const [activating, setActivating] =
    useState(false);

  /* ----------------------------------------------------------
     PLAN ICON
  ---------------------------------------------------------- */

  const PlanIcon =
    plan.id === 'trial'
      ? Rocket
      : plan.id === 'starter'
      ? Zap
      : plan.id === 'growth'
      ? Crown
      : plan.id === 'pro'
      ? Sparkles
      : plan.id === 'business'
      ? Building2
      : Users;

  /* ==========================================================
     FREE TRIAL ACTIVATION
     ========================================================== */

  const activateFreeTrial = async () => {

    if (!isTrial || activating) {
      return;
    }

    try {

      setActivating(true);

      const response = await fetch(
        '/api/subscription/subscribe',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          credentials: 'include',

          body: JSON.stringify({
            planId: 'trial',
            billingCycle: 'monthly',
          }),
        }
      );

      const data = await response.json();

      /* ------------------------------------------------------
         API ERROR
      ------------------------------------------------------ */

      if (!response.ok || !data.success) {

        if (data.code === 'TRIAL_USED') {

          alert(
            'Your 14-day free trial has already been used. Please choose a paid plan.'
          );

        } else {

          alert(
            data.error ||
              'Unable to activate the free trial. Please try again.'
          );

        }

        return;
      }

      /* ------------------------------------------------------
         SUCCESS
      ------------------------------------------------------ */

      if (data.mode === 'trial') {

        alert(
          'Your 14-day free trial has been activated successfully!'
        );

        window.location.href =
          '/owner/dashboard';

        return;
      }

      alert(
        'The free trial could not be activated. Please try again.'
      );

    } catch (error) {

      console.error(
        'Free trial activation error:',
        error
      );

      alert(
        'Something went wrong while activating your free trial. Please try again.'
      );

    } finally {

      setActivating(false);

    }
  };

  /* ----------------------------------------------------------
     PAID PLAN CHECKOUT URL
  ---------------------------------------------------------- */

  const ctaHref = getCheckoutUrl(
    plan.id,
    billingCycle
  );

  /* ==========================================================
     PLAN CARD
  ========================================================== */

  return (
    <div
      className={`relative rounded-3xl bg-white border-2 transition-all duration-300 hover:shadow-2xl ${
        plan.popular
          ? 'border-violet-400 shadow-xl shadow-violet-500/20 lg:scale-[1.03]'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >

      {/* ============================================
          POPULAR BADGE
      ============================================ */}

      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">

          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold shadow-lg">

            <Star className="h-3 w-3 fill-current" />

            Most Popular

          </span>

        </div>
      )}

      <div className="p-6 sm:p-8">

        {/* ============================================
            PLAN BADGE
        ============================================ */}

        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${plan.gradient} text-white text-xs font-bold uppercase tracking-wider shadow-sm`}
        >

          <PlanIcon className="h-3 w-3" />

          {plan.name}

        </div>

        {/* ============================================
            PRICE
        ============================================ */}

        <div className="mt-5">

          {isFree ? (
            <>
              <p className="text-4xl font-bold text-slate-900">
                Free
              </p>

              <p className="mt-1 text-xs text-violet-600 font-bold">
                14-day free trial
              </p>
            </>
          ) : (
            <>

              <div className="flex items-baseline gap-2">

                <p className="text-4xl font-bold text-slate-900">
                  {formatUSD(price.usd)}
                </p>

                <span className="text-sm text-slate-500 font-semibold">
                  /{isYearly ? 'year' : 'month'}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500 font-mono">
                ≈ {formatPKR(price.pkr)}
              </p>

              {isYearly && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full">

                  <Gift className="h-3 w-3" />

                  Save{' '}
                  {formatUSD(
                    plan.amountUSD * 12 -
                      plan.yearlyUSD
                  )}

                </p>
              )}

            </>
          )}

        </div>

        {/* ============================================
            STUDENT LIMIT
        ============================================ */}

        <p className="mt-3 text-sm text-slate-600 font-semibold">

          {plan.studentLimit === -1
            ? '✨ Unlimited students'
            : `👥 Up to ${plan.studentLimit} students`}

        </p>

        {/* ============================================
            TRIAL INFO
        ============================================ */}

        {isTrial && (
          <div className="mt-3 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5">

            <p className="text-xs text-violet-700 font-semibold">
              🚀 Start instantly — no payment required
            </p>

          </div>
        )}

        {/* ============================================
            DIVIDER
        ============================================ */}

        <div className="my-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* ============================================
            FEATURES
        ============================================ */}

        <ul className="space-y-2.5">

          {plan.features.map((feature, i) => (

            <li
              key={i}
              className="flex items-start gap-2 text-sm text-slate-600"
            >

              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />

              <span className="leading-relaxed">
                {feature}
              </span>

            </li>

          ))}

        </ul>

        {/* ============================================
            CTA
        ============================================ */}

        {isTrial ? (

          <button
            type="button"
            onClick={activateFreeTrial}
            disabled={activating}
            className="mt-6 group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >

            {activating ? (
              <>

                <span className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />

                Activating Trial...

              </>
            ) : (
              <>

                Start 14-Day Free Trial

                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />

              </>
            )}

          </button>

        ) : (

          <Link
            href={ctaHref}
            className={`mt-6 group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition active:scale-[0.98] ${
              plan.popular
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/30'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >

            Choose Plan

            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />

          </Link>

        )}

        {/* ============================================
            SMALL NOTE
        ============================================ */}

        {!isTrial && (
          <p className="mt-3 text-center text-[11px] text-slate-400">
            {isYearly
              ? 'Billed annually'
              : 'Billed monthly'}
          </p>
        )}

        {isTrial && (
          <p className="mt-3 text-center text-[11px] text-slate-400">
            No credit card required
          </p>
        )}

      </div>

    </div>
  );
}