import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IOTP {
  _id?: Types.ObjectId;
  phone: string;
  code: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const OTP: Model<IOTP> =
  (mongoose.models.OTP as Model<IOTP>) ||
  mongoose.model<IOTP>('OTP', OTPSchema);

export default OTP;