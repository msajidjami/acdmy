// app/api/articles/[slug]/view/route.ts
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
    ArticleViewModel = mongoose.models.ArticleView || mongoose.model('ArticleView', schema);
  }
  return ArticleViewModel;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    let article = await Article.findOne({ slug }).lean();
    if (!article && mongoose.Types.ObjectId.isValid(slug)) {
      article = await Article.findById(slug).lean();
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const ArticleView = await getArticleViewModel();

    const existingView = await ArticleView.findOne({
      articleId: article._id,
      userId: userId,
    });

    if (!existingView) {
      await ArticleView.create({
        articleId: article._id,
        userId: userId,
      });

      await Article.findByIdAndUpdate(article._id, {
        $inc: { uniqueViews: 1 },
        $set: { updatedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: 'Unique view recorded',
        incremented: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Already viewed',
      incremented: false,
    });
  } catch (error) {
    console.error('Error in view API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}