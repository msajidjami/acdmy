import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ✅ Urdu/Arabic slug decode */
function safeDecode(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/* ✅ viewers array کو cap کریں تاکہ DB بھر نہ جائے */
const MAX_VIEWERS = 5000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = safeDecode(rawSlug);

    await connectDB();

    /* ---------- Article ڈھونڈیں (decoded → raw fallback) ---------- */
    let article: any = await Article.findOne({
      slug,
      status: 'published',
    })
      .select('_id slug views uniqueViews viewers')
      .lean();

    if (!article && slug !== rawSlug) {
      article = await Article.findOne({
        slug: rawSlug,
        status: 'published',
      })
        .select('_id slug views uniqueViews viewers')
        .lean();
    }

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    /* ---------- Visitor ID ---------- */
    const cookieStore = await cookies();
    let visitorId = cookieStore.get('visitor_id')?.value;
    const isNewVisitor = !visitorId;

    if (!visitorId) {
      visitorId = crypto.randomBytes(16).toString('hex');
    }

    /* ---------- IP + UA fingerprint ---------- */
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

    /* ---------- Already viewed? ---------- */
    const viewers: string[] = Array.isArray(article.viewers)
      ? article.viewers
      : [];

    const isAlreadyViewed =
      viewers.includes(visitorId) || viewers.includes(fingerprint);

    /* ---------- ✅ صاف update: $inc + $set (کوئی $addToSet نہیں) ---------- */
    const inc: Record<string, number> = { views: 1 };
    if (!isAlreadyViewed) inc.uniqueViews = 1;

    // نیا viewers array
    const nextViewers = isAlreadyViewed
      ? viewers
      : [...viewers, visitorId, fingerprint].slice(-MAX_VIEWERS);

    const update: Record<string, any> = {
      $inc: inc,
      $set: { viewers: nextViewers },
    };

    await Article.updateOne({ _id: article._id }, update);

    /* ---------- Response ---------- */
    const response = NextResponse.json({
      success: true,
      slug: article.slug,
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
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error: any) {
    console.error('POST /api/articles/[slug]/view error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}