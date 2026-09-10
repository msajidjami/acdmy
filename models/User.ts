import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'owner' | 'teacher' | 'user' | 'student';
  isVerified: boolean;
  provider: 'credentials' | 'google';
  googleId?: string | null;
  avatar?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  lastLogin?: Date | null;      // ✅ نیا
  loginCount: number;           // ✅ نیا
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
    },

    role: {
      type: String,
      enum: ['admin', 'owner', 'teacher', 'user', 'student'],
      required: true,
      default: 'student',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
    },

    googleId: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    resetToken: {
      type: String,
      default: null,
    },

    resetTokenExpiry: {
      type: Date,
      default: null,
    },

    // ✅ نیا — آخری لاگ ان کا وقت
    lastLogin: {
      type: Date,
      default: null,
    },

    // ✅ نیا — کتنی بار لاگ ان ہوا
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ resetToken: 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });

export default (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);