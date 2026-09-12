import mongoose, { Schema, models } from 'mongoose';

const CourseSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },        // cover image
    thumbnail: { type: String, default: '' },    // small thumbnail (auto fallback to image)
    price: { type: Number, default: 0 },
    duration: { type: String, default: '' },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    category: { type: String, default: '' },
    isActive: { type: Boolean, default: true },

    /* ✅ NEW — Book Pages */
    totalPages: { type: Number, default: 0, min: 0 },
    bookTitle: { type: String, default: '' },

    /* Color accent for the course (used in thumbnail fallback) */
    accentColor: { type: String, default: '#6366f1' },

    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
    },
    teacherIds: [{ type: Schema.Types.ObjectId, ref: 'Teacher' }],
  },
  { timestamps: true }
);

export default models.Course || mongoose.model('Course', CourseSchema);