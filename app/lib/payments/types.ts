import type { Types } from 'mongoose';
import type { BillingCycle, PlanId } from '@/app/lib/plans';

export type PaymentGatewayId =
  | 'lemonsqueezy'
  | 'jazzcash'
  | 'easypaisa'
  | 'stripe'
  | 'manual';

export interface PaymentInitInput {
  subscriptionId: Types.ObjectId | string;
  academyId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  planId: PlanId;
  planName: string;
  billingCycle: BillingCycle;
  amountUSD: number;
  amountPKR: number;
  currency: 'USD' | 'PKR';
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentInitResult {
  success: boolean;
  gateway: PaymentGatewayId;
  /** Redirect URL — null if manual / no redirect */
  redirectUrl?: string | null;
  /** For manual payments — where to send money */
  instructions?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    jazzcashNumber?: string;
    easypaisaNumber?: string;
    reference?: string;
  };
  /** Internal gateway reference */
  gatewayReference?: string;
  /** Error message if failed */
  error?: string;
}

export interface PaymentVerifyInput {
  subscriptionId: Types.ObjectId | string;
  gatewayReference?: string;
  payload?: Record<string, unknown>;
}

export interface PaymentVerifyResult {
  success: boolean;
  paid: boolean;
  transactionId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface PaymentGatewayMeta {
  id: PaymentGatewayId;
  name: string;
  description: string;
  currencies: Array<'USD' | 'PKR'>;
  logo?: string;
  badge?: string;
  badgeColor?: string;
  popular?: boolean;
  manual?: boolean;
  /** Which countries/regions this gateway is for */
  region?: 'global' | 'pakistan' | 'international';
}