import mongoose, { Schema, models } from 'mongoose';

const EnrollmentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure a student can enroll in the same course only once
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export default models.Enrollment || mongoose.model('Enrollment', EnrollmentSchema);