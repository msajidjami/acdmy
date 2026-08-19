// app/models/Course.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISyllabusUnit {
  unitNumber: number;
  title: string;
  description: string;
}

export interface ISyllabusFile {
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  fileSize?: number;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  category: string;
  instructor?: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  schedule: { day: string; time: string }[];
  syllabus: ISyllabusUnit[];
  syllabusFiles: ISyllabusFile[];
  syllabusDescription: string;
  syllabusUpdatedAt: Date;
  studentsEnrolled: number;
  thumbnail: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    instructor: { type: String, required: false, default: '' },
    price: { type: Number, default: 0 },
    duration: { type: String, required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    schedule: [
      {
        day: { type: String, required: true },
        time: { type: String, required: true },
      },
    ],
    syllabus: [
      {
        unitNumber: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    syllabusFiles: {
      type: [
        {
          fileName: { type: String, required: true },
          fileUrl: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
          fileSize: { type: Number },
        },
      ],
      default: [],
    },
    syllabusDescription: { type: String, default: '' },
    syllabusUpdatedAt: { type: Date, default: Date.now },
    studentsEnrolled: { type: Number, default: 0 },
    thumbnail: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);