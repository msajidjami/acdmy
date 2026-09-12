import mongoose, { Schema, models } from 'mongoose';

/* ============================================================
   Session Log — ایک کلاس کے بعد Pages کی entry
   ============================================================ */

const SessionLogSchema = new Schema(
  {
    date: { type: Date, default: Date.now, required: true },

    /* اس session میں کتنے pages cover ہوئے */
    pagesCovered: { type: Number, required: true, min: 0 },

    /* اس session میں کون سے pages (بشمول) cover ہوئے */
    startPage: { type: Number, default: 0, min: 0 },
    endPage: { type: Number, default: 0, min: 0 },

    /* Teacher جو اس session میں تھا */
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    /* یہ session کس assignment سے متعلق ہے */
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },

    /* Teacher کا اختیاری نوٹ */
    note: { type: String, default: '', trim: true, maxlength: 300 },
  },
  { _id: true }
);

/* ============================================================
   Course Progress — per student per course
   ============================================================ */

const CourseProgressSchema = new Schema(
  {
    /* ---------- Relations ---------- */

    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },

    /* ---------- Book Info ---------- */

    /* کل کتنے pages کی کتاب ہے (Course سے snapshot) */
    totalPages: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* Cached total — sum of all session pagesCovered */
    pagesCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ---------- Session History ---------- */

    sessions: {
      type: [SessionLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    /* فالتو fields صاف کرنے کے لیے */
    minimize: false,
  }
);

/* ============================================================
   Indexes
   ============================================================ */

/* ایک student کا ایک course میں صرف ایک progress record */
CourseProgressSchema.index(
  { academyId: 1, courseId: 1, studentId: 1 },
  { unique: true }
);

/* Owner کو تمام progress list کرنے کے لیے */
CourseProgressSchema.index({ academyId: 1, courseId: 1 });

/* Student کی اپنی تمام courses کے لیے */
CourseProgressSchema.index({ academyId: 1, studentId: 1 });

/* ============================================================
   Virtuals
   ============================================================ */

/* باقی بچنے والے pages */
CourseProgressSchema.virtual('pagesRemaining').get(function (this: any) {
  const total = Number(this.totalPages) || 0;
  const done = Number(this.pagesCompleted) || 0;
  return Math.max(0, total - done);
});

/* Percentage (0–100) */
CourseProgressSchema.virtual('percent').get(function (this: any) {
  const total = Number(this.totalPages) || 0;
  const done = Number(this.pagesCompleted) || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
});

/* کیا مکمل ہو چکا */
CourseProgressSchema.virtual('isCompleted').get(function (this: any) {
  const total = Number(this.totalPages) || 0;
  const done = Number(this.pagesCompleted) || 0;
  return total > 0 && done >= total;
});

/* Virtuals کو JSON میں شامل کرنے کے لیے */
CourseProgressSchema.set('toJSON', { virtuals: true });
CourseProgressSchema.set('toObject', { virtuals: true });

/* ============================================================
   Export
   ============================================================ */

export default models.CourseProgress ||
  mongoose.model('CourseProgress', CourseProgressSchema);