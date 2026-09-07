import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';
import mongoose from 'mongoose';

let ArticleViewModel: any = null;

async function getArticleViewModel() {
  if (!ArticleViewModel) {
    const schema = new mongoose.Schema({
      articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
      userId: { type: String, required: true },
      viewedAt: { type: Date, default: Date.now },
    });
    // Ensure index for fast lookup
    schema.index({ articleId: 1, userId: 1 }, { unique: true });
    ArticleViewModel = mongoose.models.ArticleView || mongoose.model('ArticleView', schema);
  }
  return ArticleViewModel;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleId, userId } = body;

    if (!articleId || !userId) {
      return NextResponse.json(
        { error: 'Article ID and User ID are required' },
        { status: 400 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const ArticleView = await getArticleViewModel();

    // 🔍 Check if view record exists
    const existingView = await ArticleView.findOne({
      articleId: new mongoose.Types.ObjectId(articleId),
      userId: userId,
    });

    // 📊 Get current article to check uniqueViews
    const article = await Article.findById(articleId).lean();
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // If view exists and uniqueViews is already > 0, just return
    if (existingView && article.uniqueViews > 0) {
      return NextResponse.json({
        success: true,
        message: 'Already viewed',
        incremented: false,
        uniqueViews: article.uniqueViews,
      });
    }

    // ⚠️ If view exists but uniqueViews is 0 (fix inconsistent state)
    // OR if view doesn't exist (normal case)
    if (existingView && article.uniqueViews === 0) {
      // This case shouldn't happen, but we'll fix it by incrementing
      console.warn(`⚠️ Inconsistent state: view exists but uniqueViews=0 for article ${articleId}`);
    }

    // Use findOneAndUpdate to atomically create view record (if not exists)
    // and increment uniqueViews in one go.
    // We'll first create the view record, then increment.
    // But to be safe, we'll do it in a transaction or sequential.
    // Simpler: create view record (if not exists) and then increment.
    // But we already checked above, so we know it doesn't exist.
    // Let's create it and increment.

    // Use a single operation: findOneAndUpdate with upsert for view record,
    // but that won't update the article. So we do it separately.

    // Actually we already checked existence, so we can safely create.
    if (!existingView) {
      await ArticleView.create({
        articleId: new mongoose.Types.ObjectId(articleId),
        userId: userId,
      });
    }

    // Now increment uniqueViews (even if view existed but count was 0)
    const updatedArticle = await Article.findByIdAndUpdate(
      articleId,
      { $inc: { uniqueViews: 1 } },
      { new: true, lean: true }
    );

    if (!updatedArticle) {
      return NextResponse.json(
        { error: 'Article not found after update' },
        { status: 404 }
      );
    }

    console.log(`✅ Article ${articleId} uniqueViews incremented to ${updatedArticle.uniqueViews}`);

    return NextResponse.json({
      success: true,
      message: existingView ? 'View count corrected' : 'Unique view recorded',
      incremented: true,
      uniqueViews: updatedArticle.uniqueViews,
    });
  } catch (error) {
    console.error('❌ Error in view API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}