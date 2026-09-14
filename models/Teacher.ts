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

export interface ITeacherCertificate {
  _id?: Types.ObjectId;
  title: string;
  url: string;
  issuedBy?: string;
  issuedAt?: Date;
}

export interface ITeacher extends Document {
  _id: Types.ObjectId;

  /* Basic */
  name: string;
  fullName?: string;          // alias
  email: string;
  contactNumber: string;
  phone?: string;             // alias

  gender: 'male' | 'female';

  /* Location */
  country: string;
  city: string;
  timezone: string;

  /* Professional */
  qualification: string;
  experience: number;
  subjects: string[];
  languages: string[];
  bio: string;

  /* Media */
  profileImage: string;
  avatar: string;
  audioUrl: string;
  introAudio: string;
  introVideo: string;
  certificates: ITeacherCertificate[];

  /* Academy */
  academyId?: Types.ObjectId | null;
  isAvailable: boolean;
  isVerified: boolean;
  active: boolean;

  /* Zoom */
  zoomEmail: string;

  /* Followers */
  followers: Types.ObjectId[];
  followerCount: number;

  /* Ratings */
  ratings: ITeacherRating[];
  avgRating: number;
  ratingCount: number;

  /* Stats */
  rating?: number;
  totalStudents?: number;

  /* Referral */
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
   CERTIFICATE SUB-SCHEMA
   ============================================================ */

const CertificateSchema = new Schema<ITeacherCertificate>(
  {
    title: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
    issuedBy: { type: String, default: '', trim: true },
    issuedAt: { type: Date, default: null },
  },
  { _id: true }
);

/* ============================================================
   MAIN SCHEMA
   ============================================================ */

const TeacherSchema = new Schema<ITeacher>(
  {
    name: { type: String, required: true, trim: true },
    fullName: { type: String, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    contactNumber: { type: String, default: '', trim: true, maxlength: 30 },
    phone: { type: String, default: '', trim: true, maxlength: 30 },

    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
      default: 'male',
    },

    /* Location */
    country: { type: String, default: '', trim: true, maxlength: 100 },
    city: { type: String, default: '', trim: true, maxlength: 100 },
    timezone: { type: String, default: '', trim: true, maxlength: 60 },

    /* Professional */
    qualification: { type: String, default: '', trim: true, maxlength: 300 },
    experience: { type: Number, default: 0, min: 0 },

    subjects: { type: [{ type: String, trim: true }], default: [] },
    languages: { type: [{ type: String, trim: true }], default: [] },
    bio: { type: String, default: '', trim: true, maxlength: 1000 },

    /* Media */
    profileImage: { type: String, default: '' },
    avatar: { type: String, default: '' },
    audioUrl: { type: String, default: '', required: false },
    introAudio: { type: String, default: '' },
    introVideo: { type: String, default: '' },
    certificates: { type: [CertificateSchema], default: [] },

    /* Academy */
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      default: null,
      index: true,
    },

    isAvailable: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },

    /* Zoom */
    zoomEmail: { type: String, default: '', trim: true, lowercase: true },

    /* Followers */
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followerCount: { type: Number, default: 0, min: 0, index: true },

    /* Ratings */
    ratings: { type: [TeacherRatingSchema], default: [] },
    avgRating: { type: Number, default: 0, min: 0, max: 5, index: true },
    ratingCount: { type: Number, default: 0, min: 0, index: true },

    /* Stats */
    rating: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0, min: 0 },

    /* Referral */
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
TeacherSchema.index({ active: 1, isAvailable: 1 });
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