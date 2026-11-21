import mongoose, { Schema, Document } from "mongoose";

export interface ISocialPost extends Document {
  title: string;
  topic: string;
  platform: string;
  language: string;
  goal: string;
  tone: string;
  caption: string;
  hashtags: string[];
  callToAction?: string;
  visualDirection?: string;
  status: "draft" | "approved" | "scheduled" | "published";
  aiMode: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema = new Schema<ISocialPost>(
  {
    title: { type: String, required: true },
    topic: { type: String, required: true },
    platform: { type: String, required: true },
    language: { type: String, required: true },
    goal: { type: String, required: true },
    tone: { type: String, required: true },
    caption: { type: String, required: true },
    hashtags: { type: [String], default: [] },
    callToAction: { type: String },
    visualDirection: { type: String },
    status: {
      type: String,
      enum: ["draft", "approved", "scheduled", "published"],
      default: "draft",
    },
    aiMode: { type: String, default: "template" },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.SocialPost ||
  mongoose.model<ISocialPost>("SocialPost", SocialPostSchema);