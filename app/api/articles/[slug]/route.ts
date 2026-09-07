import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    // Try to find by slug
    let article = await Article.findOne({ slug }).lean();

    // If not found and slug is a valid ObjectId, try by ID
    if (!article && mongoose.Types.ObjectId.isValid(slug)) {
      article = await Article.findById(slug).lean();
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // ❌ Do NOT increment views here – we'll track unique views separately
    // await Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } });

    return NextResponse.json(article);
  } catch (error) {
    console.error('GET /api/articles/[slug] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}