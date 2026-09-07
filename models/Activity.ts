import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  userId?: mongoose.Types.ObjectId | string;
  userName: string;
  action: string;
  details?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast sorting
ActivitySchema.index({ createdAt: -1 });

export default mongoose.models.Activity ||
  mongoose.model<IActivity>('Activity', ActivitySchema);