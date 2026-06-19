import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import mongoose from 'mongoose';

let ArticleViewModel: any = null;

async function getArticleViewModel() {
  if (!ArticleViewModel) {
    const schema = new mongoose.Schema({
      articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
      userId: { type: String, required: true },
      viewedAt: { type: Date, default: Date.now },
    });
    ArticleViewModel = mongoose.models.ArticleView || mongoose.model('ArticleView', schema);
  }
  return ArticleViewModel;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleId, userId } = body;

    if (!articleId || !userId) {
      return NextResponse.json({ error: 'Article ID and User ID are required' }, { status: 400 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const article = await Article.findById(articleId).lean();
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const ArticleView = await getArticleViewModel();

    const existingView = await ArticleView.findOne({
      articleId: article._id,
      userId: userId,
    });

    if (!existingView) {
      // Record the view
      await ArticleView.create({
        articleId: article._id,
        userId: userId,
      });

      // Increment uniqueViews
      const updated = await Article.findByIdAndUpdate(
        article._id,
        { $inc: { uniqueViews: 1 }, $set: { updatedAt: new Date() } },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Unique view recorded',
        incremented: true,
        uniqueViews: updated?.uniqueViews || 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Already viewed',
      incremented: false,
      uniqueViews: article.uniqueViews || 0,
    });
  } catch (error) {
    console.error('Error in view API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}