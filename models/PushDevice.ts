
import mongoose, { Schema, Model, Types } from "mongoose";

export interface IPushDevice extends mongoose.Document {
  userId: Types.ObjectId;
  token: string;
  platform: "web" | "android" | "ios";
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushDeviceSchema = new Schema<IPushDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["web", "android", "ios"],
      default: "web",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

PushDeviceSchema.index({ token: 1 }, { unique: true });
PushDeviceSchema.index({ userId: 1, isActive: 1 });

const PushDevice: Model<IPushDevice> =
  (mongoose.models.PushDevice as Model<IPushDevice>) ||
  mongoose.model<IPushDevice>("PushDevice", PushDeviceSchema);

export default PushDevice;
