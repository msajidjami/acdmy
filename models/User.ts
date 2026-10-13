import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/* ============================================================
   TYPES
   ============================================================ */

export type UserRole = 'admin' | 'owner' | 'teacher' | 'user';
export type UserProvider = 'credentials' | 'google' | 'phone';
export type AllowMessagesFrom = 'everyone' | 'contacts' | 'nobody';

export interface IUserPrivacy {
  allowMessagesFrom: AllowMessagesFrom;
  blockedUsers: Types.ObjectId[];
  discoverable: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role: UserRole;
  isVerified: boolean;
  provider: UserProvider;
  googleId?: string;
  avatar?: string;
  resetToken?: string;
  resetTokenExpiry?: Date | null;
  lastLogin?: Date | null;
  loginCount: number;

  /* Online status */
  isOnline: boolean;
  lastSeen: Date;

  /* Privacy */
  privacy: IUserPrivacy;

  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   PRIVACY SUB-SCHEMA (nested defaults یقینی بناتا ہے)
   ============================================================ */

const PrivacySchema = new Schema<IUserPrivacy>(
  {
    allowMessagesFrom: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody'],
      default: 'contacts',
      required: true,
    },
    blockedUsers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    discoverable: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { _id: false }
);

/* ============================================================
   USER SCHEMA
   ============================================================ */

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
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
      enum: ['admin', 'owner', 'teacher', 'user'],
      required: true,
      default: 'user',
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    provider: {
      type: String,
      enum: ['credentials', 'google', 'phone'],
      default: 'credentials',
      index: true,
    },

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

    /* ============================================================
       ONLINE STATUS
       ============================================================ */
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /* ============================================================
       PRIVACY — sub-schema سے defaults یقینی
       ============================================================ */
    privacy: {
      type: PrivacySchema,
      default: () => ({
        allowMessagesFrom: 'contacts',
        blockedUsers: [],
        discoverable: true,
      }),
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
UserSchema.index({ role: 1, provider: 1 });
UserSchema.index({ lastSeen: -1 });
UserSchema.index({ 'privacy.allowMessagesFrom': 1 });
UserSchema.index({ isOnline: 1, lastSeen: -1 });

/* ============================================================
   MODEL (cache-safe — serverless کے لیے)
   ============================================================ */

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;