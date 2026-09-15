import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';
import User from '@/models/User';
import Academy from '@/models/Academy';
import { detectAiContent } from '@/app/lib/aiDetector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   GET — Public listing (only published)
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '12', 10));
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const q = (searchParams.get('q') || '').trim();

    const query: Record<string, unknown> = { status: 'published' };
    if (category && category !== 'all') query.category = category;
    if (language && language !== 'all') query.language = language;
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
      ];
    }

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content') // listing میں پورا content نہیں بھیجیں
        .lean(),
      Article.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/articles error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — Create article (owner only)
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    /* ---------- Auth ---------- */
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Login required' },
        { status: 401 }
      );
    }

    let userId = '';
    let userRole = '';
    let userName = '';

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET missing');
      const decoded = jwt.verify(token, secret) as {
        userId?: string;
        role?: string;
        name?: string;
      };
      userId = String(decoded.userId || '');
      userRole = String(decoded.role || '');
      userName = String(decoded.name || '');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    /* ✅ صرف owner / admin */
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only academy owners can publish articles' },
        { status: 403 }
      );
    }

    /* ---------- Body ---------- */
    const body = await req.json();

    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    const language = ['en', 'ur', 'ar'].includes(body.language)
      ? body.language
      : 'en';
    const category = String(body.category || 'General').trim();
    const thumbnail = String(body.thumbnail || '').trim();
    const tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];

    if (!title || title.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Title must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (!content || content.length < 300) {
      return NextResponse.json(
        { success: false, error: 'Content must be at least 300 characters' },
        { status: 400 }
      );
    }

    /* ---------- AI Detection ---------- */
    const ai = detectAiContent(content, language);

    if (ai.status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          error: 'Article rejected: AI-generated content detected',
          aiScore: ai.score,
          aiReasons: ai.reasons,
        },
        { status: 422 }
      );
    }

    /* ---------- Owner info + academy ---------- */
    await connectDB();

    const user = await User.findById(userId).select('name avatar').lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const academy = await Academy.findOne({ ownerId: userId })
      .select('_id')
      .lean();

    /* ---------- Status ---------- */
    let status: 'pending' | 'published' | 'rejected' = 'pending';

    // ✅ Clean pass — auto publish
    if (ai.status === 'passed') {
      status = 'published';
    }
    // ⚠️ Warning — manual review
    else if (ai.status === 'warning') {
      status = 'pending';
    }

    /* ---------- Create ---------- */
    const article = await Article.create({
      title,
      content,
      language,
      category,
      thumbnail,
      tags,

      author: user.name || userName || 'Anonymous',
      authorId: user._id,
      authorName: user.name || userName || 'Anonymous',
      authorAvatar: user.avatar || '',
      academyId: academy?._id || null,

      aiScore: ai.score,
      aiStatus: ai.status,
      aiReasons: ai.reasons,

      status,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          status === 'published'
            ? 'Article published successfully!'
            : 'Article submitted for review',
        data: {
          id: article._id,
          slug: article.slug,
          status: article.status,
          aiScore: ai.score,
          aiStatus: ai.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/articles error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}