import mongoose, { Schema, models, HydratedDocument } from 'mongoose';

export interface IArticle {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  language: 'en' | 'ur' | 'ar';
  category: string;
  author: string;
  thumbnail?: string;
  views: number;
  uniqueViews: number;
  tags: string[];
  links: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    excerpt: { type: String, default: '' },
    content: { type: String, required: true },
    language: {
      type: String,
      enum: ['en', 'ur', 'ar'],
      default: 'ur',
    },
    category: { type: String, required: true, trim: true, default: 'General' },
    author: { type: String, required: true, trim: true, default: 'Admin' },
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
  },
  { 
    timestamps: true,
    autoIndex: false // ✅ یہ لائن اب MongoDB کو خودکار انڈیکسنگ سے روک دے گی
  }
);

// Slug generation hook
ArticleSchema.pre('save', function (this: HydratedDocument<IArticle>) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }
});

const Article = models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;