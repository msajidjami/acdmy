import mongoose, { Schema, Document } from "mongoose";

export interface ISocialActivity extends Document {
  postId: mongoose.Types.ObjectId | null;
  action: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocialActivitySchema = new Schema<ISocialActivity>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "SocialPost", default: null },
    action: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.SocialActivity ||
  mongoose.model<ISocialActivity>("SocialActivity", SocialActivitySchema);