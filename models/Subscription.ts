import mongoose, { Schema, models, model, Document, Types } from 'mongoose';

export type PlanId =
  | 'trial'
  | 'starter'
  | 'growth'
  | 'pro'
  | 'business'
  | 'enterprise';

export type BillingCycle = 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'pending'
  | 'trial';

// ✅ FIXED: payoneer aur bank_transfer add kiye
export type PaymentMethod =
  | 'stripe'
  | 'lemonsqueezy'
  | 'paddle'
  | 'payoneer'         // ✅ ADD
  | 'bank_transfer'    // ✅ ADD
  | 'jazzcash'
  | 'easypaisa'
  | 'payfast'
  | 'safepay'
  | 'manual';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IInvoice {
  invoiceId: string;
  amount: number;
  currency: string;
  paidAt: Date;
  status: PaymentStatus;
}

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  academyId: Types.ObjectId;
  ownerId: Types.ObjectId;
  planId: PlanId;
  planName: string;
  studentLimit: number;
  billingCycle: BillingCycle;
  amountUSD: number;
  amountPKR: number;
  currency: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: PaymentMethod;
  paymentId: string;
  paymentStatus: PaymentStatus;
  invoices: IInvoice[];
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    planId: {
      type: String,
      enum: ['trial', 'starter', 'growth', 'pro', 'business', 'enterprise'],
      required: true,
    },

    planName: {
      type: String,
      required: true,
      trim: true,
    },

    studentLimit: {
      type: Number,
      required: true,
    },

    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },

    amountUSD: {
      type: Number,
      required: true,
      default: 0,
    },

    amountPKR: {
      type: Number,
      required: true,
      default: 0,
    },

    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },

    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending', 'trial'],
      default: 'pending',
      index: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    autoRenew: {
      type: Boolean,
      default: false,
    },

    // ✅ FIXED: enum mein payoneer aur bank_transfer add kiye
    paymentMethod: {
      type: String,
      enum: [
        'stripe',
        'lemonsqueezy',
        'paddle',
        'payoneer',        // ✅ ADD
        'bank_transfer',   // ✅ ADD
        'jazzcash',
        'easypaisa',
        'payfast',
        'safepay',
        'manual',
      ],
    },

    paymentId: {
      type: String,
      default: '',
      trim: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    invoices: [
      {
        invoiceId: { type: String, default: '' },
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        paidAt: { type: Date, default: Date.now },
        status: { type: String, default: 'pending' },
      },
    ],
  },
  { timestamps: true }
);

SubscriptionSchema.index({ academyId: 1, status: 1 });
SubscriptionSchema.index({ ownerId: 1, status: 1 });

const Subscription =
  (models.Subscription as mongoose.Model<ISubscription>) ||
  model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;