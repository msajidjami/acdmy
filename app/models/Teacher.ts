// app/models/Teacher.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
  email: string;
  contactNumber: string;
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema<ITeacher> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    referralCode: {
      type: String,
      required: [true, 'Referral code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate referralCode - بغیر next parameter کے آسان حل
TeacherSchema.pre('save', async function () {
  const teacher = this as ITeacher;
  
  // صرف نئے teacher کے لیے یا اگر referralCode موجود نہیں ہے
  if (teacher.isNew || !teacher.referralCode) {
    let uniqueCode: string;
    let isUnique = false;

    do {
      // 8 characters کا random code بنائیں
      uniqueCode = 'TEACHER-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // چیک کریں کہ یہ code پہلے سے موجود نہ ہو
      const existing = await mongoose.model('Teacher').findOne({ referralCode: uniqueCode });
      isUnique = !existing;
    } while (!isUnique);

    teacher.referralCode = uniqueCode;
  }
});

// Indexes for better performance
TeacherSchema.index({ email: 1 });
TeacherSchema.index({ referralCode: 1 });

// Export model
const TeacherModel =
  (mongoose.models.Teacher as mongoose.Model<ITeacher>) ||
  mongoose.model<ITeacher>('Teacher', TeacherSchema);

export default TeacherModel;