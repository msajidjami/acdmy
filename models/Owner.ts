import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/* ============================================================
   TYPES
   ============================================================ */

export interface IOwner extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  contactNumber: string;
  referralCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   SCHEMA
   ============================================================ */

const OwnerSchema = new Schema<IOwner>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    /* ✅ Referral code — auto generate */
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: function () {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ============================================================
   INDEXES
   ============================================================ */

OwnerSchema.index({ email: 1 }, { unique: true });
OwnerSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

/* ============================================================
   CACHE-SAFE EXPORT
   ============================================================ */

let Owner: Model<IOwner>;

if (mongoose.models.Owner) {
  delete mongoose.models.Owner;
}

Owner = mongoose.model<IOwner>('Owner', OwnerSchema);

export default Owner;