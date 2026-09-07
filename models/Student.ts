import mongoose, { Schema, models } from 'mongoose';

const StudentSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: '' },
    parentName: { type: String, default: '' },
    parentPhone: { type: String, default: '' },
    address: { type: String, default: '' },
    subjects: [{ type: String }], // مثلاً ['Quran', 'Math']
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'pending'], 
      default: 'active' 
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default models.Student || mongoose.model('Student', StudentSchema);