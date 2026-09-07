import mongoose, { Schema, models } from 'mongoose';

const InquirySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    message: { type: String, required: true },
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    notes: { type: String, default: '' },
    repliedAt: { type: Date },
    repliedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default models.Inquiry || mongoose.model('Inquiry', InquirySchema);