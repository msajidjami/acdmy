import mongoose, { Schema, Document } from "mongoose";

export interface ISocialConnection extends Document {
  platform: string;
  accountId: string;
  accountName?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  status: "connected" | "expired" | "revoked" | "pending";
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SocialConnectionSchema = new Schema<ISocialConnection>(
  {
    platform: { type: String, required: true },
    accountId: { type: String, required: true },
    accountName: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
    scopes: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["connected", "expired", "revoked", "pending"],
      default: "connected",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// ایک پلیٹ فارم پر ایک ہی اکاؤنٹ ایک بار محفوظ ہو
SocialConnectionSchema.index({ platform: 1, accountId: 1 }, { unique: true });

export default mongoose.models.SocialConnection ||
  mongoose.model<ISocialConnection>("SocialConnection", SocialConnectionSchema);