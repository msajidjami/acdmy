import mongoose, { Schema, models, model, Document, Types } from 'mongoose';

export type PaymentMethod =
  | 'payoneer'
  | 'bank_transfer'
  | 'jazzcash'
  | 'easypaisa';

export type ProofStatus = 'pending' | 'approved' | 'rejected';

export interface IPaymentProof extends Document {
  _id: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  academyId: Types.ObjectId;
  ownerId: Types.ObjectId;
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  amountUSD: number;
  amountPKR: number;

  // Payment details
  paymentMethod: PaymentMethod;
  transactionId: string;
  receiptUrl: string;
  notes: string;

  // Status
  status: ProofStatus;
  adminNotes: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentProofSchema = new Schema<IPaymentProof>(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
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
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    amountUSD: { type: Number, default: 0 },
    amountPKR: { type: Number, default: 0 },

    paymentMethod: {
      type: String,
      enum: ['payoneer', 'bank_transfer', 'jazzcash', 'easypaisa'],
      required: true,
    },
    transactionId: { type: String, required: true, trim: true },
    receiptUrl: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true, maxlength: 1000 },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNotes: { type: String, default: '', trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentProofSchema.index({ status: 1, createdAt: -1 });
PaymentProofSchema.index({ ownerId: 1, createdAt: -1 });

const PaymentProof =
  (models.PaymentProof as mongoose.Model<IPaymentProof>) ||
  model<IPaymentProof>('PaymentProof', PaymentProofSchema);

export default PaymentProof;