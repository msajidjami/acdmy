import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ---------- Helper: get logged-in owner id ---------- */
async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string;
    };
    return decoded.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

/* ---------- GET: public article (blog view) ---------- */
export async function GET(
  _req: NextRequest,
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

/* ---------- PUT: update article (owner only) ---------- */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { slug } = await params;

    // slug یا _id دونوں سے تلاش کریں
    let article = await Article.findOne({ slug });
    if (!article && mongoose.Types.ObjectId.isValid(slug)) {
      article = await Article.findById(slug);
    }

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    if (String(article.authorId) !== String(userId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, language, category, tags } = body || {};

    if (!title || title.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Title must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 300) {
      return NextResponse.json(
        { success: false, error: 'Content must be at least 300 characters' },
        { status: 400 }
      );
    }

    article.title = title.trim();
    article.content = content.trim();
    article.language = language || 'en';
    article.category = category || 'General';
    article.tags = Array.isArray(tags) ? tags : [];

    // اگر published تھا تو دوبارہ review پر بھیجیں
    if (article.status === 'published') {
      article.status = 'pending';
    }

    await article.save();

    return NextResponse.json({
      success: true,
      data: article,
      message: 'Article updated successfully',
    });
  } catch (error: any) {
    console.error('PUT /api/articles/[slug] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ---------- DELETE: remove article (owner only) ---------- */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { slug } = await params;

    let article = await Article.findOne({ slug });
    if (!article && mongoose.Types.ObjectId.isValid(slug)) {
      article = await Article.findById(slug);
    }

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    if (String(article.authorId) !== String(userId)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await Article.deleteOne({ _id: article._id });

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/articles/[slug] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}