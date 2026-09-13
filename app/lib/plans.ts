export type PlanId =
  | 'trial'
  | 'starter'
  | 'growth'
  | 'pro'
  | 'business'
  | 'enterprise';

export type BillingCycle = 'monthly' | 'yearly';

export interface Plan {
  id: PlanId;
  name: string;
  studentLimit: number; // -1 = unlimited
  amountUSD: number;
  amountPKR: number;
  yearlyUSD: number;
  yearlyPKR: number;
  popular?: boolean;
  features: string[];
  color: string;
  gradient: string;
}

export const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Free Trial',
    studentLimit: 5,
    amountUSD: 0,
    amountPKR: 0,
    yearlyUSD: 0,
    yearlyPKR: 0,
    features: [
      '5 students',
      '14-day access',
      'All core features',
      'LiveKit classes',
      'Whiteboards',
      'No credit card required',
    ],
    color: 'slate',
    gradient: 'from-slate-400 to-slate-600',
  },
  {
    id: 'starter',
    name: 'Starter',
    studentLimit: 10,
    amountUSD: 3.99,
    amountPKR: 1100,
    yearlyUSD: 39.99,
    yearlyPKR: 11200,
    features: [
      'Up to 10 students',
      'Public academy profile',
      'LiveKit video classes',
      'Code Editor + STEM + Design boards',
      'Zoom integration',
      'Email support',
    ],
    color: 'sky',
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    id: 'growth',
    name: 'Growth',
    studentLimit: 30,
    amountUSD: 9.99,
    amountPKR: 2800,
    yearlyUSD: 99.99,
    yearlyPKR: 28000,
    popular: true,
    features: [
      'Up to 30 students',
      'Everything in Starter',
      'Up to 5 teachers',
      'Priority email support',
      'No recording (privacy-first)',
      'Custom logo',
    ],
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    studentLimit: 75,
    amountUSD: 19.99,
    amountPKR: 5600,
    yearlyUSD: 199.99,
    yearlyPKR: 56000,
    features: [
      'Up to 75 students',
      'Everything in Growth',
      'Up to 15 teachers',
      'Custom domain (coming soon)',
      'Advanced analytics',
      'Priority support',
    ],
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'business',
    name: 'Business',
    studentLimit: 200,
    amountUSD: 44.99,
    amountPKR: 12600,
    yearlyUSD: 449.99,
    yearlyPKR: 126000,
    features: [
      'Up to 200 students',
      'Everything in Pro',
      'Unlimited teachers',
      'Custom branding',
      'Dedicated support',
      'API access',
    ],
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    studentLimit: -1,
    amountUSD: 99.99,
    amountPKR: 28000,
    yearlyUSD: 999.99,
    yearlyPKR: 280000,
    features: [
      'Unlimited students',
      'Everything in Business',
      'Custom domain',
      'White-label option',
      'SLA guarantee',
      '24/7 support',
      'Custom integrations',
    ],
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
  },
];

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatPKR(amount: number): string {
  return `₨${amount.toLocaleString('en-PK')}`;
}

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function getPlanPrice(
  plan: Plan,
  cycle: BillingCycle
): { usd: number; pkr: number } {
  if (cycle === 'yearly') {
    return { usd: plan.yearlyUSD, pkr: plan.yearlyPKR };
  }
  return { usd: plan.amountUSD, pkr: plan.amountPKR };
}