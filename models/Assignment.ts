// models/Assignment.ts
import mongoose, { Schema, models, model } from 'mongoose';

const AssignmentSchema = new Schema(
  {
    // ==================================================
    // Academy & Participants
    // ==================================================

    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    // ==================================================
    // Schedule
    // ==================================================

    daysOfWeek: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one day is required.',
      },
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    timezone: {
      type: String,
      default: 'Asia/Karachi',
      trim: true,
    },

    // ==================================================
    // Status
    // ==================================================

    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },

    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },

    // ==================================================
    // LiveKit Room Information
    // ==================================================

    livekitRoomName: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },

    livekitHostIdentity: {
      type: String,
      default: '',
      trim: true,
    },

    livekitProvider: {
      type: String,
      default: 'livekit',
      trim: true,
    },

    // ==================================================
    // LiveKit Host Token
    // ==================================================
    // یہ ٹوکن استاد کے لیے ہے۔
    // select: false کی وجہ سے ڈیفالٹ queries میں واپس نہیں آئے گا۔
    // ==================================================

    livekitHostToken: {
      type: String,
      default: '',
      select: false,
    },

    // ==================================================
    // LiveKit Student Token (Optional)
    // ==================================================
    // اگر آپ طالب علم کے لیے پہلے سے ٹوکن بنانا چاہیں تو یہاں محفوظ کر سکتے ہیں۔
    // ورنہ اسے dynamic طور پر بنایا جا سکتا ہے۔
    // ==================================================

    livekitStudentToken: {
      type: String,
      default: '',
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// Indexes
// ======================================================

// ایک استاد، طالب علم اور کورس کا ایک ہی ٹائم سلاٹ میں ایک ہی اسائنمنٹ
AssignmentSchema.index(
  {
    academyId: 1,
    teacherId: 1,
    studentId: 1,
    courseId: 1,
    startTime: 1,
    endTime: 1,
  },
  { unique: true }
);

// ٹائم سلاٹ کے حساب سے تلاش کے لیے
AssignmentSchema.index({
  daysOfWeek: 1,
  startTime: 1,
  status: 1,
});

// ======================================================
// Prevent model recompilation in Next.js
// ======================================================

const Assignment =
  models.Assignment || model('Assignment', AssignmentSchema);

export default Assignment;