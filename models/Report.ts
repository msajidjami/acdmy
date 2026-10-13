import mongoose, { Schema, Model, Types } from 'mongoose';

export type ReportReason =
  | 'spam'
  | 'abuse'
  | 'harassment'
  | 'fake'
  | 'scam'
  | 'other';

export interface IReport extends mongoose.Document {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  reportedUserId: Types.ObjectId;
  reason: ReportReason;
  description?: string;
  /* screenshot / proof */
  evidence?: string[];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ['spam', 'abuse', 'harassment', 'fake', 'scam', 'other'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    evidence: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

/* Ek reporter ek user ko ek din mein ek hi report bhej sakta hai */
ReportSchema.index(
  { reporterId: 1, reportedUserId: 1, createdAt: -1 },
  { name: 'reporter_reported_recent' }
);

const Report: Model<IReport> =
  (mongoose.models.Report as Model<IReport>) ||
  mongoose.model<IReport>('Report', ReportSchema);

export default Report;