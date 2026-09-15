import mongoose, { Schema, models, HydratedDocument, Types } from 'mongoose';

export type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface IArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  language: 'en' | 'ur' | 'ar';
  category: string;
  author: string;
viewers: number;
  /* ✅ Author info */
  authorId: Types.ObjectId;
  authorName: string;
  authorAvatar: string;
  academyId?: Types.ObjectId | null;

  /* ✅ AI detection */
  aiScore: number;
  aiStatus: 'passed' | 'warning' | 'rejected';
  aiReasons: string[];

  /* ✅ Moderation */
  status: ArticleStatus;
  rejectionReason: string;

  thumbnail: string;
  views: number;
  uniqueViews: number;
  tags: string[];
  links: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
  };
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true },
    excerpt: { type: String, default: '' },
    content: { type: String, required: true },
    language: {
      type: String,
      enum: ['en', 'ur', 'ar'],
      default: 'en',
    },
    viewers: { type: Number, default: 0 },
    category: { type: String, required: true, trim: true, default: 'General' },
    author: { type: String, required: true, trim: true, default: 'Anonymous' },

    /* ✅ Author info */
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorName: { type: String, default: '', trim: true },
    authorAvatar: { type: String, default: '' },
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      default: null,
      index: true,
    },

    /* ✅ AI detection */
    aiScore: { type: Number, default: 0, min: 0, max: 100 },
    aiStatus: {
      type: String,
      enum: ['passed', 'warning', 'rejected'],
      default: 'passed',
      index: true,
    },
    aiReasons: { type: [String], default: [] },

    /* ✅ Moderation */
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected'],
      default: 'pending',
      index: true,
    },

    rejectionReason: { type: String, default: '' },

    thumbnail: { type: String, default: '' },
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    links: { type: [String], default: [] },
    seo: {
      metaTitle: { type: String, trim: true, default: '' },
      metaDescription: { type: String, trim: true, default: '' },
      canonicalUrl: { type: String, trim: true, default: '' },
    },
    publishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

/* ============================================================
   INDEXES — کوئی text index نہیں (ur/ar support نہیں کرتے)
   ============================================================ */

ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ authorId: 1, createdAt: -1 });
ArticleSchema.index({ category: 1, status: 1 });
ArticleSchema.index({ language: 1, status: 1 });

/* ============================================================
   HOOKS
   ============================================================ */

ArticleSchema.pre('save', function (this: HydratedDocument<IArticle>) {
  if ((this.isModified('title') || !this.slug) && this.title) {
    const base = this.title
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 80);

    const suffix = this._id
      ? String(this._id).slice(-6)
      : Date.now().toString(36);

    this.slug = `${base || 'article'}-${suffix}`;
  }

  if (!this.excerpt && this.content) {
    const text = this.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    this.excerpt = text.slice(0, 200) + (text.length > 200 ? '…' : '');
  }

  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

const Article =
  models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

/* ============================================================
   ✅ AUTO CLEANUP — پرانا text index ہٹائیں
   یہ صرف ایک بار چلتا ہے، پھر دوبارہ نہیں
   ============================================================ */

declare global {
  // eslint-disable-next-line no-var
  var __articleIndexCleanupDone: boolean | undefined;
}

async function cleanupArticleIndexes() {
  // صرف ایک بار چلائیں
  if (global.__articleIndexCleanupDone) return;
  global.__articleIndexCleanupDone = true;

  try {
    // Connection کا انتظار کریں
    if (mongoose.connection.readyState !== 1) {
      // اگر ready نہیں، تو تھوڑی دیر بعد دوبارہ کوشش کریں
      setTimeout(() => {
        global.__articleIndexCleanupDone = false; // reset
        cleanupArticleIndexes();
      }, 2000);
      return;
    }

    const db = mongoose.connection.db;
    if (!db) return;

    const collection = db.collection('articles');
    const indexes = await collection.indexes();

    const dropped: string[] = [];

    for (const idx of indexes) {
      const name = idx.name || '';

      // _id index کو نہ چھیڑیں
      if (name === '_id_') continue;

      // text index کی شناخت کریں
      const hasTextKey = Object.values(idx.key || {}).some(
        (v) => v === 'text'
      );

      if (hasTextKey || name.includes('_text')) {
        try {
          await collection.dropIndex(name);
          dropped.push(name);
          console.log(`✅ Dropped old text index: ${name}`);
        } catch (err) {
          console.warn(`⚠️ Could not drop index ${name}:`, err);
        }
      }
    }

    if (dropped.length > 0) {
      console.log(
        `🎉 Cleaned up ${dropped.length} old text index(es) on articles collection`
      );
    }
  } catch (error) {
    // خاموشی سے ناکام — کوئی crash نہیں
    console.warn('⚠️ Index cleanup skipped:', (error as Error)?.message);
  }
}

/* ✅ Connection ready ہونے پر cleanup چلائیں */
if (mongoose.connection.readyState === 1) {
  // Already connected
  cleanupArticleIndexes();
} else {
  // Connection کا انتظار
  mongoose.connection.once('connected', cleanupArticleIndexes);
}

export default Article;