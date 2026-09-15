import mongoose, { Schema, models, model, Types } from 'mongoose';

export interface IPayment {
  _id: Types.ObjectId;
  academyId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  courseId: Types.ObjectId;

  month: string; // 'YYYY-MM'
  amount: number;
  currency: 'PKR' | 'USD';

  status: 'pending' | 'paid' | 'partial';
  paidAmount: number;
  paidAt?: Date | null;
  paymentMethod: string;
  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

const Payment1Schema = new Schema<IPayment>(
  {
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    month: { type: String, required: true, index: true }, // 'YYYY-MM'

    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: ['PKR', 'USD'], default: 'PKR' },

    status: {
      type: String,
      enum: ['pending', 'paid', 'partial'],
      default: 'pending',
      index: true,
    },
    paidAmount: { type: Number, default: 0, min: 0 },
    paidAt: { type: Date, default: null },
    paymentMethod: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

Payment1Schema.index(
  { assignmentId: 1, month: 1 },
  { unique: true, name: 'unique_payment_per_month' }
);

Payment1Schema.index({ academyId: 1, month: 1, status: 1 });

const Payment1 = models.Payment1 || model<IPayment>('Payment1', Payment1Schema);

export default Payment1;