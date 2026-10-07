import mongoose, { Schema, model, models } from "mongoose";

export type AIDesignAssetType =
  | "calligraphy"
  | "poster"
  | "frame"
  | "background"
  | "ornament"
  | "logo"
  | "template"
  | "other";

export interface IAIDesignReference {
  title: string;
  assetType: AIDesignAssetType;
  imageUrl: string;
  publicId?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  tags: string[];
  styleDescription?: string;
  aiInstructions?: string;
  isActive: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AIDesignReferenceSchema = new Schema<IAIDesignReference>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    assetType: {
      type: String,
      enum: [
        "calligraphy",
        "poster",
        "frame",
        "background",
        "ornament",
        "logo",
        "template",
        "other",
      ],
      default: "other",
      index: true,
    },
    imageUrl: { type: String, required: true },
    publicId: { type: String, default: "" },
    mimeType: { type: String, default: "image/png" },
    width: { type: Number },
    height: { type: Number },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    styleDescription: { type: String, default: "", maxlength: 3000 },
    aiInstructions: { type: String, default: "", maxlength: 3000 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

AIDesignReferenceSchema.index({ title: "text", tags: "text", styleDescription: "text" });

const AIDesignReference =
  models.AIDesignReference ||
  model<IAIDesignReference>("AIDesignReference", AIDesignReferenceSchema);

export default AIDesignReference;
