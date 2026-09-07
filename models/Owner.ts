// app/models/Owner.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOwner extends Document {
  name: string;
  email: string;
  contactNumber: string;
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const OwnerSchema: Schema<IOwner> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'نام درکار ہے'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'ای میل درکار ہے'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'رابطہ نمبر درکار ہے'],
      trim: true,
    },
    referralCode: {
      type: String,
      unique: true,
      // REQUIRED: TRUE مکمل ہٹا دیا گیا ہے
      // یہاں کوئی required نہیں ہے
    },
  },
  {
    timestamps: true,
  }
);

// منفرد referralCode جنریٹ کرنے کا middleware
let OwnerModel: Model<IOwner>;

OwnerSchema.pre('save', async function () {
  if (!this.referralCode) {
    if (!OwnerModel) {
      OwnerModel = mongoose.model<IOwner>('Owner');
    }

    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = 'OWNER-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const existing = await OwnerModel.findOne({ referralCode: code }).lean();
      if (!existing) {
        isUnique = true;
      }
    }

    this.referralCode = code;
  }
});

export default mongoose.models.Owner || mongoose.model<IOwner>('Owner', OwnerSchema);