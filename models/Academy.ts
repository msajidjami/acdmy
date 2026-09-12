import mongoose, { Schema, models, model, Model } from 'mongoose';

/* ============================================================
   RATING SUB-SCHEMA
   ============================================================ */

const RatingSchema = new Schema(
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

const AcademySchema = new Schema(
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

    /* ✅ Cover / Hero image */
    thumbnail: { type: String, default: '', trim: true },

    /* ✅ Accent color */
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
  },
  {
    timestamps: true,
    /* ✅ Unknown fields کو preserve کریں — schema update کے بعد بھی */
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
      (acc: number, r: any) => acc + (Number(r.stars) || 0),
      0
    );
    this.avgRating = Math.round((sum / ratings.length) * 10) / 10;
  }
};

/* ============================================================
   ✅ CACHE-SAFE EXPORT
   
   یہ pattern Next.js dev mode میں schema changes کو فوراً
   apply کرتا ہے۔ پرانا `models.Academy || model(...)` استعمال
   کرنے سے schema change نظر نہیں آتی جب تک server restart نہ ہو۔
   ============================================================ */

let Academy: Model<any>;

if (models.Academy) {
  /* ✅ اگر model cached ہے تو اسے حذف کریں تاکہ نیا schema لگے */
  delete mongoose.models.Academy;
}

Academy = model('Academy', AcademySchema);

export default Academy;