import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   POST — Approve / Reject pending article
   Body: { action: 'approve' | 'reject', reason?: string }
   ============================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET missing');
      const decoded = jwt.verify(token, secret) as {
        userId?: string;
        role?: string;
      };
      userId = String(decoded.userId || '');
      userRole = String(decoded.role || '');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    /* ---------- Body ---------- */
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();
    const reason = String(body.reason || '').trim();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    /* ---------- DB ---------- */
    await connectDB();

    const article = await Article.findOne({ slug });
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    /* ---------- Permission ---------- */
    const isAdmin = userRole === 'admin';
    const isOwner = String(article.authorId) === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'You cannot moderate this article' },
        { status: 403 }
      );
    }

    /* ---------- Action ---------- */
    if (action === 'approve') {
      article.status = 'published';
      article.rejectionReason = '';
      if (!article.publishedAt) article.publishedAt = new Date();
    } else {
      article.status = 'rejected';
      article.rejectionReason = reason || 'Rejected by moderator';
    }

    await article.save();

    return NextResponse.json({
      success: true,
      message:
        action === 'approve'
          ? 'Article approved and published!'
          : 'Article rejected',
      data: {
        slug: article.slug,
        status: article.status,
      },
    });
  } catch (error: any) {
    console.error('POST /api/articles/[slug]/approve error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}