import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
   POST — Track unique view
   ایک user (cookie + IP) = ایک view
   ============================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectDB();

    const article = await Article.findOne({ slug, status: 'published' })
      .select('_id views uniqueViews viewers')
      .lean();

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    /* ---------- Visitor ID بنائیں ---------- */
    const cookieStore = await cookies();

    let visitorId = cookieStore.get('visitor_id')?.value;

    const isNewVisitor = !visitorId;

    if (!visitorId) {
      // نیا visitor — random ID
      visitorId = crypto.randomBytes(16).toString('hex');
    }

    /* ---------- IP + User-Agent کا hash (fallback) ---------- */
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const ua = req.headers.get('user-agent') || 'unknown';
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${ip}|${ua}`)
      .digest('hex')
      .slice(0, 32);

    // ✅ دونوں IDs چیک کریں — کوئی ایک match ہو تو پہلے دیکھا ہوا ہے
    const viewers = article.viewers || [];
    const isAlreadyViewed =
      viewers.includes(visitorId) || viewers.includes(fingerprint);

    /* ---------- Update ---------- */
    const update: Record<string, unknown> = {
      $inc: {
        views: 1, // ✅ ہر بار بڑھے گا
        ...(isAlreadyViewed ? {} : { uniqueViews: 1 }), // ✅ صرف پہلی بار
      },
    };

    if (!isAlreadyViewed) {
      update.$addToSet = {
        viewers: { $each: [visitorId, fingerprint] },
      };
    }

    await Article.updateOne({ _id: article._id }, update);

    /* ---------- Cookie set کریں (اگر نیا visitor ہے) ---------- */
    const response = NextResponse.json({
      success: true,
      views: (article.views || 0) + 1,
      uniqueViews:
        (article.uniqueViews || 0) + (isAlreadyViewed ? 0 : 1),
      isNew: !isAlreadyViewed,
    });

    if (isNewVisitor) {
      response.cookies.set({
        name: 'visitor_id',
        value: visitorId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 سال
      });
    }

    return response;
  } catch (error: any) {
    console.error('POST /api/articles/[slug]/view error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}