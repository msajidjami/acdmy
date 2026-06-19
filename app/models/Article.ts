import mongoose, {
  Schema,
  models,
  HydratedDocument,
} from 'mongoose';

export interface IArticle {
  title: string;
  slug?: string;
  content: string;
  language: 'en' | 'ur' | 'ar';
  category: string;
  author: string;
  thumbnail?: string;
  views: number;
  uniqueViews: number; // ✅ Added: unique view counter
  tags: string[];
  links: string[];
  createdAt: Date;
  updatedAt: Date;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    content: { type: String, required: true },
    language: {
      type: String,
      enum: ['en', 'ur', 'ar'],
      default: 'en',
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
    },
    author: {
      type: String,
      required: true,
      trim: true,
      default: 'Admin',
    },
    thumbnail: { type: String, default: '' },
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 }, // ✅ Added here
    tags: { type: [String], default: [] },
    links: { type: [String], default: [] },
  },
  { timestamps: true }
);

// ✅ Correct pre-save hook
ArticleSchema.pre(
  'save',
  async function (this: HydratedDocument<IArticle>) {
    if (this.isModified('title') && !this.slug) {
      this.slug = generateSlug(this.title);
    }
  }
);

ArticleSchema.index(
  {
    title: 'text',
    content: 'text',
    category: 'text',
    tags: 'text',
  },
  {
    default_language: 'none',
    language_override: 'none',
  }
);

const Article =
  models.Article ||
  mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;