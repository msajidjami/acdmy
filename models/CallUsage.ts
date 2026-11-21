// models/CallUsage.ts
import mongoose, { Schema, models, model, Types } from 'mongoose';

export interface ICallUsage extends mongoose.Document {
  userId: Types.ObjectId;
  monthKey: string; // "YYYY-MM"
  secondsUsed: number;
  callCount: number;
}

const CallUsageSchema = new Schema<ICallUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    monthKey: { type: String, required: true },
    secondsUsed: { type: Number, default: 0 },
    callCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CallUsageSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

const CallUsage =
  (models.CallUsage as mongoose.Model<ICallUsage>) ||
  model<ICallUsage>('CallUsage', CallUsageSchema);

export default CallUsage;