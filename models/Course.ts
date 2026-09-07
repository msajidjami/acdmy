import mongoose, { Schema, models } from 'mongoose';

const CourseSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, default: 0 },
    duration: { type: String, default: '' },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    category: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
    },
    // جو ٹیچرز اس کورس کو پڑھا سکتے ہیں (اختیاری)
    teacherIds: [{ type: Schema.Types.ObjectId, ref: 'Teacher' }],
  },
  { timestamps: true }
);

export default models.Course || mongoose.model('Course', CourseSchema);