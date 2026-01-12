import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'آرٹیکل کا ٹائٹل درکار ہے'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'آرٹیکل کا مواد درکار ہے'],
  },
  language: {
    type: String,
    enum: ['en', 'ur', 'ar'],
    default: 'en',
  },
  category: {
    type: String,
    required: [true, 'کیٹگری درکار ہے'],
    trim: true,
    default: 'General',
  },
  author: {
    type: String,
    required: [true, 'مصنف کا نام درکار ہے'],
    trim: true,
    default: 'Admin',
  },
  thumbnail: {
    type: String,
    trim: true,
    default: '',
  },
  views: {
    type: Number,
    default: 0,
  },
  tags: {
    type: [String],
    default: [],
  },
  links: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

// انڈیکس صرف اگر واقعی سرچ کی ضرورت ہو تو رکھیں، ورنہ ہٹا دیں
ArticleSchema.index(
  { title: 'text', content: 'text', category: 'text', tags: 'text' },
  { default_language: 'none' } // ← یہ اردو اور عربی کے لیے ضروری ہے
);

const Article = mongoose.models.Article || mongoose.model('Article', ArticleSchema);

export default Article;