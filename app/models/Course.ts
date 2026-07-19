import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  category: string;
  instructor?: string; // اختیاری
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  schedule: {
    day: string;
    time: string;
  }[];
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
    instructor: { 
      type: String, 
      required: false,   // ✅ ضروری نہیں
      default: ''        // ✅ ڈیفالٹ خالی
    },
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
    studentsEnrolled: { type: Number, default: 0 },
    thumbnail: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ ماڈل کو ری سیٹ کریں (اگر پہلے سے موجود ہے تو اوور رائڈ کریں)
export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);