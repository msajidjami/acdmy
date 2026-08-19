// app/models/Progress.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProgress extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  unitProgress: {
    unitNumber: number;
    completed: boolean;
    completedAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    unitProgress: [
      {
        unitNumber: { type: Number, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);