// models/Student.ts — اپنے موجودہ ماڈل میں یہ دو فیلڈز شامل کریں
import mongoose, { Schema, models, model, Types } from 'mongoose';

const StudentSchema = new Schema(
  {
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },

    /* ✅ نیا: linked user (agar account hai) */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    /* ✅ نیا: yeh student kis enrollment se aaya */
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      default: null,
      index: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    phone: { type: String, default: '', trim: true, maxlength: 40 },

    parentName: { type: String, default: '', trim: true, maxlength: 120 },
    parentPhone: { type: String, default: '', trim: true, maxlength: 40 },

    address: { type: String, default: '', trim: true, maxlength: 300 },
    subjects: { type: [String], default: [] },

    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'graduated'],
      default: 'active',
      index: true,
    },

    notes: { type: String, default: '', trim: true, maxlength: 2000 },

    enrollmentDate: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

StudentSchema.index(
  { academyId: 1, email: 1 },
  { unique: true, name: 'unique_student_email_per_academy' }
);

if (models.Student) {
  delete models.Student;
}

const Student = models.Student || model('Student', StudentSchema);
export default Student;