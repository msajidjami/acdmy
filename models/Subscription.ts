import mongoose, {
  Schema,
  models,
  model,
  Document,
  Types,
} from 'mongoose';

export type PlanId =
  | 'trial'
  | 'starter'
  | 'growth'
  | 'pro'
  | 'business'
  | 'enterprise';

export type BillingCycle =
  | 'monthly'
  | 'yearly';

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'pending'
  | 'trial';

export type PaymentMethod =
  | 'stripe'
  | 'lemonsqueezy'
  | 'paddle'
  | 'payoneer'
  | 'bank_transfer'
  | 'jazzcash'
  | 'easypaisa'
  | 'payfast'
  | 'safepay'
  | 'manual';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

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

  /**
   * Email used to claim the free trial.
   *
   * Only trial subscriptions should have this value.
   *
   * One normalized email = one trial ever.
   */
  trialEmail?: string;

  createdAt: Date;

  updatedAt: Date;
}

/* ============================================================
   SUBSCRIPTION SCHEMA
   ============================================================ */

const SubscriptionSchema =
  new Schema<ISubscription>(
    {
      /* ======================================================
         ACADEMY
      ====================================================== */

      academyId: {
        type: Schema.Types.ObjectId,
        ref: 'Academy',
        required: true,
        index: true,
      },

      /* ======================================================
         OWNER
      ====================================================== */

      ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      /* ======================================================
         PLAN
      ====================================================== */

      planId: {
        type: String,

        enum: [
          'trial',
          'starter',
          'growth',
          'pro',
          'business',
          'enterprise',
        ],

        required: true,
      },

      /* ======================================================
         PLAN NAME
      ====================================================== */

      planName: {
        type: String,
        required: true,
        trim: true,
      },

      /* ======================================================
         STUDENT LIMIT
      ====================================================== */

      studentLimit: {
        type: Number,
        required: true,
      },

      /* ======================================================
         BILLING CYCLE
      ====================================================== */

      billingCycle: {
        type: String,

        enum: [
          'monthly',
          'yearly',
        ],

        default: 'monthly',
      },

      /* ======================================================
         PRICE USD
      ====================================================== */

      amountUSD: {
        type: Number,
        required: true,
        default: 0,
      },

      /* ======================================================
         PRICE PKR
      ====================================================== */

      amountPKR: {
        type: Number,
        required: true,
        default: 0,
      },

      /* ======================================================
         CURRENCY
      ====================================================== */

      currency: {
        type: String,
        default: 'USD',
        trim: true,
      },

      /* ======================================================
         STATUS
      ====================================================== */

      status: {
        type: String,

        enum: [
          'active',
          'expired',
          'cancelled',
          'pending',
          'trial',
        ],

        default: 'pending',

        index: true,
      },

      /* ======================================================
         START DATE
      ====================================================== */

      startDate: {
        type: Date,
        default: Date.now,
      },

      /* ======================================================
         END DATE
      ====================================================== */

      endDate: {
        type: Date,
        required: true,
        index: true,
      },

      /* ======================================================
         AUTO RENEW
      ====================================================== */

      autoRenew: {
        type: Boolean,
        default: false,
      },

      /* ======================================================
         PAYMENT METHOD
      ====================================================== */

      paymentMethod: {
        type: String,

        enum: [
          'stripe',
          'lemonsqueezy',
          'paddle',
          'payoneer',
          'bank_transfer',
          'jazzcash',
          'easypaisa',
          'payfast',
          'safepay',
          'manual',
        ],
      },

      /* ======================================================
         PAYMENT ID
      ====================================================== */

      paymentId: {
        type: String,
        default: '',
        trim: true,
      },

      /* ======================================================
         PAYMENT STATUS
      ====================================================== */

      paymentStatus: {
        type: String,

        enum: [
          'pending',
          'paid',
          'failed',
          'refunded',
        ],

        default: 'pending',
      },

      /* ======================================================
         INVOICES
      ====================================================== */

      invoices: [
        {
          invoiceId: {
            type: String,
            default: '',
          },

          amount: {
            type: Number,
            default: 0,
          },

          currency: {
            type: String,
            default: 'USD',
          },

          paidAt: {
            type: Date,
            default: Date.now,
          },

          status: {
            type: String,
            default: 'pending',
          },
        },
      ],

      /* ======================================================
         FREE TRIAL EMAIL
         ======================================================

         IMPORTANT:

         This field is only populated for the trial
         subscription.

         lowercase + trim ensures:

         Test@Gmail.com
         test@gmail.com
         TEST@GMAIL.COM

         are treated as the same email.
      */

      trialEmail: {
        type: String,

        lowercase: true,

        trim: true,

        sparse: true,

        unique: true,

        index: true,
      },
    },

    {
      timestamps: true,
    }
  );

/* ============================================================
   NORMAL INDEXES
   ============================================================ */

SubscriptionSchema.index({
  academyId: 1,
  status: 1,
});

SubscriptionSchema.index({
  ownerId: 1,
  status: 1,
});

/* ============================================================
   TRIAL EMAIL UNIQUE INDEX
   ============================================================

   One email can have only ONE trial subscription.

   sparse: true means paid subscriptions that don't have
   trialEmail are NOT treated as duplicate values.

   Example:

   abc@gmail.com → Trial #1 ✅
   abc@gmail.com → Trial #2 ❌

   abc@gmail.com
   ABC@GMAIL.COM
   Abc@gmail.com

   are normalized to the same value.
============================================================ */

SubscriptionSchema.index(
  { trialEmail: 1 },
  {
    unique: true,
    sparse: true,
    name: 'unique_trial_email',
  }
);

/* ============================================================
   MODEL
   ============================================================ */

const Subscription =
  (models.Subscription as mongoose.Model<ISubscription>) ||
  model<ISubscription>(
    'Subscription',
    SubscriptionSchema
  );

export default Subscription;