import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'owner' | 'teacher' | 'user' | 'student';
  isVerified: boolean;
  provider: 'credentials' | 'google';
  googleId?: string;
  avatar?: string;
  resetToken?: string;
  resetTokenExpiry?: Date | null;
  lastLogin?: Date | null;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === 'credentials';
      },
      select: false,
    },

    role: {
      type: String,
      enum: ['admin', 'owner', 'teacher', 'user', 'student'],
      required: true,
      default: 'student',
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
      index: true,
    },

    /* ✅ sparse unique — صرف موجود ہونے پر index */
    googleId: {
      type: String,
      default: undefined,
      unique: true,
      sparse: true,
    },

    avatar: {
      type: String,
      default: '',
    },

    /* ✅ sparse — صرف موجود ہونے پر index */
    resetToken: {
      type: String,
      default: undefined,
    },

    resetTokenExpiry: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    loginCount: {
      type: Number,
      default: 0,
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

UserSchema.index({ resetToken: 1 }, { sparse: true });

/* ============================================================
   ✅ Cache-safe export — serverless (Vercel) کے لیے لازمی
   ============================================================
   `delete mongoose.models.User` غلط تھا کیونکہ:
   - Serverless میں ہر request پر module re-evaluate ہوتا ہے
   - delete کرنے سے race condition بنتا ہے → "Schema hasn't been registered" error
   - Hot reload پر بھی مسائل پیدا کرتا ہے

   صحیح طریقہ: existing model کو reuse کریں
   ============================================================ */

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;