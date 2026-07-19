import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  courseId: string;
  studentId: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  submissionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    courseId: { type: String, required: true },
    studentId: { type: String, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'graded'],
      default: 'pending',
    },
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String },
    submissionUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Assignment ||
  mongoose.model<IAssignment>('Assignment', AssignmentSchema);