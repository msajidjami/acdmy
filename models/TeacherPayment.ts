import mongoose, { Schema, models, model, Types } from 'mongoose';

export interface ITeacherPayment {
  _id: Types.ObjectId;
  academyId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;

  month: string; // 'YYYY-MM'
  amount: number; // amount academy owes the teacher
  currency: 'PKR' | 'USD';

  status: 'pending' | 'paid' | 'partial';
  paidAmount: number;
  paidAt?: Date | null;
  paymentMethod: string;
  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

const TeacherPaymentSchema = new Schema<ITeacherPayment>(
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
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    month: { type: String, required: true, index: true },

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

TeacherPaymentSchema.index(
  { assignmentId: 1, month: 1 },
  { unique: true, name: 'unique_teacher_payment_per_month' }
);

TeacherPaymentSchema.index({ academyId: 1, month: 1, status: 1 });
TeacherPaymentSchema.index({ academyId: 1, teacherId: 1, month: 1 });

const TeacherPayment =
  models.TeacherPayment ||
  model<ITeacherPayment>('TeacherPayment', TeacherPaymentSchema);

export default TeacherPayment;