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
  resetTokenExpiry?: Date;
  lastLogin?: Date;
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
      /* ✅ index: true ہٹا دیا — unique خود index بناتا ہے */
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

    /* ✅ field-level پر sparse ہٹا دیا */
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
   INDEXES — صرف یہاں ایک بار ڈیفائن کریں
   ============================================================ */

UserSchema.index({ resetToken: 1 }, { sparse: true });

/* ✅ Cache-safe export */
let User: Model<IUser>;

if (mongoose.models.User) {
  delete mongoose.models.User;
}

User = mongoose.model<IUser>('User', UserSchema);

export default User;