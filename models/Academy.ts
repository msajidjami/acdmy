import mongoose, { Schema, models, model, Model, Document, Types } from 'mongoose';

/* ============================================================
   TYPES
   ============================================================ */

export type PlanId =
  | 'free'
  | 'trial'
  | 'starter'
  | 'growth'
  | 'pro'
  | 'business'
  | 'enterprise';

export interface IRating {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  stars: number;
  comment: string;
  createdAt: Date;
}

export interface IAcademy extends Document {
  _id: Types.ObjectId;

  // Owner
  ownerId: Types.ObjectId;

  // Basic
  name: string;
  slug: string;
  description: string;
  logo: string;
  thumbnail: string;
  accentColor: string;
  address: string;
  contactEmail: string;
  isActive: boolean;

  // Followers
  followers: Types.ObjectId[];
  followerCount: number;

  // Ratings
  ratings: IRating[];
  avgRating: number;
  ratingCount: number;

  // Zoom
  zoomConnected: boolean;
  zoomAccountId: string;
  zoomHostUserId: string;
  zoomHostEmail: string;

  // ✅ Subscription / Billing
  isPublic: boolean;
  subscriptionId?: Types.ObjectId | null;
  studentLimit: number;
  currentStudentCount: number;
  planId: PlanId;

  // ✅ Public Profile (extra fields)
  tagline?: string;
  contactPhone?: string;
  city?: string;
  country?: string;
  website?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  recalculateStats(): void;
}

/* ============================================================
   RATING SUB-SCHEMA
   ============================================================ */

const RatingSchema = new Schema<IRating>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/* ============================================================
   MAIN SCHEMA
   ============================================================ */

const AcademySchema = new Schema<IAcademy>(
  {
    /* ---------- OWNER ---------- */
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /* ---------- BASIC ---------- */
    name: { type: String, required: true, trim: true },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: { type: String, required: true, trim: true },

    logo: { type: String, default: '', trim: true },

    thumbnail: { type: String, default: '', trim: true },

    accentColor: {
      type: String,
      default: '#10b981',
      trim: true,
    },

    address: { type: String, default: '', trim: true },

    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* ========================================================
       FOLLOWERS
       ======================================================== */
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    followerCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    /* ========================================================
       RATINGS
       ======================================================== */
    ratings: {
      type: [RatingSchema],
      default: [],
    },

    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    /* ========================================================
       ZOOM
       ======================================================== */
    zoomConnected: { type: Boolean, default: false, index: true },

    zoomAccountId: { type: String, default: '', trim: true },

    zoomHostUserId: { type: String, default: '', trim: true, index: true },

    zoomHostEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },

    /* ========================================================
       ✅ SUBSCRIPTION / BILLING
       ======================================================== */

    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },

    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },

    studentLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentStudentCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    planId: {
      type: String,
      enum: ['free', 'trial', 'starter', 'growth', 'pro', 'business', 'enterprise'],
      default: 'free',
      index: true,
    },

    /* ========================================================
       ✅ PUBLIC PROFILE (extra)
       ======================================================== */

    tagline: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150,
    },

    contactPhone: {
      type: String,
      default: '',
      trim: true,
    },

    city: {
      type: String,
      default: '',
      trim: true,
    },

    country: {
      type: String,
      default: '',
      trim: true,
    },

    website: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

/* ============================================================
   INDEXES
   ============================================================ */

AcademySchema.index({ ownerId: 1, isActive: 1 });
AcademySchema.index({ zoomHostUserId: 1 });
AcademySchema.index({ followerCount: -1 });
AcademySchema.index({ avgRating: -1 });

// ✅ Subscription related
AcademySchema.index({ isPublic: 1, isActive: 1 });
AcademySchema.index({ planId: 1, isPublic: 1 });

/* ============================================================
   METHODS
   ============================================================ */

AcademySchema.methods.recalculateStats = function () {
  this.followerCount = Array.isArray(this.followers)
    ? this.followers.length
    : 0;

  const ratings = Array.isArray(this.ratings) ? this.ratings : [];
  this.ratingCount = ratings.length;

  if (ratings.length === 0) {
    this.avgRating = 0;
  } else {
    const sum = ratings.reduce(
      (acc: number, r: IRating) => acc + (Number(r.stars) || 0),
      0
    );
    this.avgRating = Math.round((sum / ratings.length) * 10) / 10;
  }
};

/* ============================================================
   ✅ CACHE-SAFE EXPORT
   ============================================================ */

let Academy: Model<IAcademy>;

if (models.Academy) {
  delete mongoose.models.Academy;
}

Academy = model<IAcademy>('Academy', AcademySchema);

export default Academy;