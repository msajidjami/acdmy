import { Schema, models, model, Model, Document, Types } from 'mongoose';

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
  ownerId: Types.ObjectId;

  /* Basic */
  name: string;
  slug: string;
  description: string;
  logo: string;
  thumbnail: string;
  accentColor: string;
  address: string;
  contactEmail: string;
  isActive: boolean;

  /* Followers */
  followers: Types.ObjectId[];
  followerCount: number;

  /* Ratings */
  ratings: IRating[];
  avgRating: number;
  ratingCount: number;

  /* Subscription */
  isPublic: boolean;
  subscriptionId?: Types.ObjectId | null;
  studentLimit: number;
  currentStudentCount: number;
  planId: PlanId;

  /* Public profile (extra) */
  tagline?: string;
  contactPhone?: string;
  city?: string;
  country?: string;
  website?: string;

  createdAt: Date;
  updatedAt: Date;

  recalculateStats(): void;
}

/* ============================================================
   RATING SUB-SCHEMA
   ============================================================ */

const RatingSchema = new Schema<IRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ============================================================
   SLUG HELPERS
   ============================================================ */

function slugify(input: string): string {
  return (
    String(input)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'academy'
  );
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      sparse: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

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
      default: '',
      trim: true,
      lowercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* ---------- FOLLOWERS ---------- */
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    followerCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    /* ---------- RATINGS ---------- */
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

    /* ---------- SUBSCRIPTION ---------- */
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
      enum: [
        'free',
        'trial',
        'starter',
        'growth',
        'pro',
        'business',
        'enterprise',
      ],
      default: 'free',
      index: true,
    },

    /* ---------- PUBLIC PROFILE (extra) ---------- */
    tagline: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150,
    },

    contactPhone: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
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
AcademySchema.index({ followerCount: -1 });
AcademySchema.index({ avgRating: -1 });
AcademySchema.index({ isPublic: 1, isActive: 1 });
AcademySchema.index({ planId: 1, isPublic: 1 });

/* ============================================================
   ✅ PRE-VALIDATE — slug، description، contactEmail خودبخود
   ============================================================ */

AcademySchema.pre('validate', async function () {
  /* ---------- 1. Slug خودبخود بنائیں ---------- */
  if (!this.slug || String(this.slug).trim() === '') {
    const base = slugify(this.name || 'academy');
    let candidate = base;
    let attempts = 0;

    while (attempts <= 6) {
      const exists = await (this.constructor as Model<IAcademy>).exists({
        slug: candidate,
        _id: { $ne: this._id },
      });

      if (!exists) break;

      attempts++;
      candidate =
        attempts >= 3
          ? `${base}-${randomSuffix()}`
          : `${base}-${attempts}`;
    }

    this.slug = candidate;
  }

  /* ---------- 2. description default ---------- */
  if (!this.description || String(this.description).trim() === '') {
    this.description = `${this.name || 'Academy'} — Islamic learning academy`;
  }

  /* ---------- 3. contactEmail default ---------- */
  if (!this.contactEmail || String(this.contactEmail).trim() === '') {
    try {
      const UserModel = models.User as Model<any> | undefined;
      if (UserModel && this.ownerId) {
        const owner: any = await UserModel.findById(this.ownerId)
          .select('email')
          .lean();
        if (owner?.email) {
          this.contactEmail = String(owner.email).toLowerCase();
        }
      }
    } catch {
      /* ignore */
    }
  }
});

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
   CACHE-SAFE EXPORT
   ============================================================ */

const Academy: Model<IAcademy> =
  (models.Academy as Model<IAcademy>) ||
  model<IAcademy>('Academy', AcademySchema);

export default Academy;