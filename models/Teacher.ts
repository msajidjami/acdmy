import mongoose, { Schema, models, Model, Document, Types } from 'mongoose';

/* ============================================================
   TYPES
   ============================================================ */

export interface ITeacherRating {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  stars: number;
  comment: string;
  createdAt: Date;
}

export interface ITeacher extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  gender: 'male' | 'female';
  subjects: string[];
  languages: string[];
  country: string;
  academyId: Types.ObjectId;
  isAvailable: boolean;
  profileImage: string;
  bio: string;
  audioUrl: string;

  followers: Types.ObjectId[];
  followerCount: number;
  ratings: ITeacherRating[];
  avgRating: number;
  ratingCount: number;

  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   RATING SUB-SCHEMA
   ============================================================ */

const TeacherRatingSchema = new Schema<ITeacherRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ============================================================
   MAIN SCHEMA
   ============================================================ */

const TeacherSchema = new Schema<ITeacher>(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
      default: 'male',
    },

    subjects: [{ type: String, trim: true }],

    /* ✅ نئی زبانیں */
    languages: {
      type: [{ type: String, trim: true }],
      default: [],
    },

    /* ✅ ملک */
    country: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },

    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },

    isAvailable: { type: Boolean, default: true, index: true },

    profileImage: { type: String, default: '' },

    bio: { type: String, default: '', trim: true, maxlength: 1000 },

    /* ✅ Audio اب آپشنل */
    audioUrl: { type: String, default: '', required: false },

    /* FOLLOWERS */
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followerCount: { type: Number, default: 0, min: 0, index: true },

    /* RATINGS */
    ratings: { type: [TeacherRatingSchema], default: [] },
    avgRating: { type: Number, default: 0, min: 0, max: 5, index: true },
    ratingCount: { type: Number, default: 0, min: 0, index: true },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      default: function () {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      },
    },
  },
  { timestamps: true, versionKey: false }
);

/* ============================================================
   INDEXES
   ============================================================ */

TeacherSchema.index({ academyId: 1, isAvailable: 1 });
TeacherSchema.index({ followerCount: -1 });
TeacherSchema.index({ avgRating: -1 });
TeacherSchema.index({ country: 1 });
TeacherSchema.index({ languages: 1 });

/* ============================================================
   CACHE-SAFE EXPORT
   ============================================================ */

let Teacher: Model<ITeacher>;

if (models.Teacher) {
  delete (mongoose.models as any).Teacher;
}

Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);

export default Teacher;