// models/Article.ts
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
    default: '', // خالی چھوڑیں اگر کوئی تصویر نہ ہو
    // آپ validate بھی کر سکتے ہیں کہ یہ URL ہے
    // validate: {
    //   validator: function(v: string) {
    //     return v === '' || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
    //   },
    //   message: 'براہ مہربانی ایک درست تصویر URL دیں'
    // }
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
    type: [String], // URLs کی array
    default: [],
  },
}, {
  timestamps: true, // createdAt اور updatedAt خود بخود شامل
});

// انڈیکسز بنائیں تاکہ سرچ تیز ہو
ArticleSchema.index({ title: 'text', content: 'text', category: 'text', tags: 'text' });

const Article = mongoose.models.Article || mongoose.model('Article', ArticleSchema);

export default Article;