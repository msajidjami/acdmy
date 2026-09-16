// models/Enrollment.ts
import mongoose, { Schema, models, model, Types } from 'mongoose';

/* ============================================================
   TYPES
   ============================================================ */

export type EnrollmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'cancelled';

export interface IEnrollment {
  _id: Types.ObjectId;

  /* Relations */
  academyId: Types.ObjectId;
  courseId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  studentId?: Types.ObjectId | null;

  /* Applicant details */
  name: string;
  email: string;
  phone: string;

  /* Optional */
  fatherName?: string;
  message?: string;
  preferredTiming?: string;
  timezone?: string;

  /* Status */
  status: EnrollmentStatus;

  /* Admin response */
  responseNote?: string;
  respondedAt?: Date | null;
  respondedBy?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   SCHEMA
   ============================================================ */

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: [true, 'Academy ID is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },

    /* ✅ Optional — public enrollment mein nahi hote */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
      index: true,
    },

    /* Applicant details */
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: 160,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: 40,
    },

    fatherName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    preferredTiming: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    timezone: {
      type: String,
      default: 'Asia/Karachi',
      trim: true,
    },

    /* Status */
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'active', 'cancelled'],
        message: 'Invalid enrollment status',
      },
      default: 'pending',
      index: true,
    },

    /* Admin response */
    responseNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ============================================================
   INDEXES
   ============================================================ */

EnrollmentSchema.index(
  { academyId: 1, courseId: 1, email: 1, status: 1 },
  { name: 'enrollment_lookup' }
);

/* ✅ Ek email ek course ke liye sirf ek active request */
EnrollmentSchema.index(
  { courseId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'approved', 'active'] },
    },
    name: 'unique_active_enrollment_per_course',
  }
);

/* ============================================================
   MODEL — Standard pattern (no manual delete)
   ✅ Koi hook nahi — koi auto EnrollmentMessage creation nahi
   ============================================================ */

const Enrollment =
  models.Enrollment ||
  model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;