import mongoose, { Schema, Document } from "mongoose";

export interface IBrandProfile extends Document {
  brandName: string;
  tone: string;
  targetAudience: string;
  valueProposition: string; // برانڈ کا بنیادی وعدہ
  contentPillars: string[]; // وہ موضوعات جن پر پوسٹ بنے گی
  lastLearnedAt: Date;
}

const BrandProfileSchema = new Schema<IBrandProfile>(
  {
    brandName: { type: String, required: true, unique: true },
    tone: { type: String, required: true },
    targetAudience: { type: String, required: true },
    valueProposition: { type: String, required: true },
    contentPillars: { type: [String], required: true },
    lastLearnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.BrandProfile ||
  mongoose.model<IBrandProfile>("BrandProfile", BrandProfileSchema);