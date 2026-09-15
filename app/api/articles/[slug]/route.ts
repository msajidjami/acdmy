import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    let article = await Article.findOne({ slug, status: 'published' }).lean();

    if (!article && mongoose.Types.ObjectId.isValid(slug)) {
      article = await Article.findOne({
        _id: slug,
        status: 'published',
      }).lean();
    }

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // ✅ increment views (silent)
    Article.updateOne({ _id: article._id }, { $inc: { views: 1 } }).catch(
      () => {}
    );

    return NextResponse.json({ success: true, data: article });
  } catch (error: any) {
    console.error('GET /api/articles/[slug] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}