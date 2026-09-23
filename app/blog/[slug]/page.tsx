import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Globe,
  Clock,
  Sparkles,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  EyeOff,
} from 'lucide-react';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';
import ViewTracker from './ViewTracker';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

/* ============================================================
   HELPERS
   ============================================================ */

function safeDecode(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/* ✅ Unicode normalization — NFC/NFD فرق ختم کرتا ہے */
function normalize(s: string): string {
  try {
    return s.normalize('NFC').trim();
  } catch {
    return s.trim();
  }
}

/* ✅ Owner check — لاگ ان ہو تو userId واپس */
async function getOwnerId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const decoded = jwt.verify(token, secret) as { userId?: string };
    return decoded.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

/* ✅ Multi-strategy article lookup */
async function findArticle(rawSlug: string, ownerId: string | null) {
  const decoded = safeDecode(rawSlug);
  const candidates = Array.from(
    new Set([decoded, rawSlug, normalize(decoded), normalize(rawSlug)])
  );

  const select =
    'title slug excerpt content language category author authorName views uniqueViews tags thumbnail seo publishedAt createdAt status authorId aiScore aiStatus';

  // 1️⃣ published article (سب کے لیے)
  for (const s of candidates) {
    const a = await Article.findOne({ slug: s, status: 'published' })
      .select(select)
      .lean();
    if (a) return { article: a, isOwnerPreview: false };
  }

  // 2️⃣ case-insensitive regex fallback
  for (const s of candidates) {
    try {
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const a = await Article.findOne({
        slug: { $regex: `^${escaped}$`, $options: 'i' },
        status: 'published',
      })
        .select(select)
        .lean();
      if (a) return { article: a, isOwnerPreview: false };
    } catch {
      // ignore
    }
  }

  // 3️⃣ اگر owner لاگ ان ہے تو اپنی غیر-published article دکھائیں
  if (ownerId) {
    for (const s of candidates) {
      const a = await Article.findOne({ slug: s, authorId: ownerId })
        .select(select)
        .lean();
      if (a) return { article: a, isOwnerPreview: true };
    }
  }

  return null;
}

/* ============================================================
   METADATA
   ============================================================ */

export async function generateMetadata({ params }: Props) {
  try {
    const { slug: rawSlug } = await params;
    await connectDB();

    const ownerId = await getOwnerId();
    const result = await findArticle(rawSlug, ownerId);

    if (!result?.article) {
      return { title: 'Article not found | ilmora786' };
    }

    const a = result.article as any;
    return {
      title: a.seo?.metaTitle || `${a.title} | ilmora786`,
      description:
        a.seo?.metaDescription || a.excerpt || 'Read on ilmora786',
    };
  } catch {
    return { title: 'Article | ilmora786' };
  }
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const LANG_LABEL: Record<string, string> = {
  en: 'English',
  ur: 'اردو',
  ar: 'العربية',
};

const LANG_FLAG: Record<string, string> = {
  en: '🌐',
  ur: '🇵🇰',
  ar: '🕌',
};

function fmt(d: Date | string) {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function relativeTime(d: Date | string) {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  } catch {
    return '';
  }
}

function readTime(c: string) {
  const words = c.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function shouldShowExcerpt(excerpt: string, content: string): boolean {
  if (!excerpt || !content) return false;
  const plainContent = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const cleanExcerpt = excerpt.replace(/…$/, '').trim().toLowerCase();
  if (plainContent.startsWith(cleanExcerpt.slice(0, 80))) return false;
  if (plainContent.includes(cleanExcerpt.slice(0, 80))) return false;
  return true;
}

function getLanguageStyles(language: string) {
  switch (language) {
    case 'ur':
      return {
        isRtl: true,
        titleClass: 'font-urdu',
        bodyClass: 'prose-urdu',
        excerptClass: 'font-urdu',
        metaClass: 'font-urdu',
      };
    case 'ar':
      return {
        isRtl: true,
        titleClass: 'font-arabic',
        bodyClass: 'prose-arabic',
        excerptClass: 'font-arabic',
        metaClass: '',
      };
    default:
      return {
        isRtl: false,
        titleClass: 'font-serif',
        bodyClass: 'prose-english',
        excerptClass: 'font-serif italic',
        metaClass: '',
      };
  }
}

function langFont(language: string, kind: 'title' | 'excerpt' = 'title') {
  if (language === 'ur') return 'font-urdu';
  if (language === 'ar') return 'font-arabic';
  return kind === 'title' ? 'font-serif' : '';
}

/* ============================================================
   RELATED ARTICLES SCORING
   ============================================================ */

type LeanArticle = {
  _id: unknown;
  slug: string;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  language: string;
  category: string;
  authorName?: string;
  author?: string;
  tags?: string[];
  uniqueViews?: number;
  views?: number;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
};

function scoreSimilarity(c: LeanArticle, cur: LeanArticle): number {
  let score = 0;
  if (c.category === cur.category) score += 50;
  if (c.language === cur.language) score += 25;
  const cA = c.authorName || c.author || '';
  const curA = cur.authorName || cur.author || '';
  if (cA && cA === curA) score += 15;
  const cT = new Set((c.tags || []).map((t) => t.toLowerCase()));
  const curT = new Set((cur.tags || []).map((t) => t.toLowerCase()));
  let tm = 0;
  for (const t of cT) if (curT.has(t)) tm++;
  score += Math.min(30, tm * 10);
  const daysOld =
    (Date.now() -
      new Date(c.publishedAt || c.createdAt).getTime()) /
    (1000 * 60 * 60 * 24);
  score += Math.max(0, 1 - daysOld / 30) * 10;
  const views = c.uniqueViews || c.views || 0;
  score += Math.min(1, Math.log10(views + 1) / 3) * 15;
  return score;
}

function getRelatedArticles(
  current: LeanArticle,
  pool: LeanArticle[],
  limit = 6
): LeanArticle[] {
  const scored = pool
    .filter((a) => a.slug !== current.slug)
    .map((a) => ({ article: a, score: scoreSimilarity(a, current) }))
    .filter((x) => x.score > 20)
    .sort((a, b) => b.score - a.score);

  const result: LeanArticle[] = [];
  const catCount: Record<string, number> = {};
  const langCount: Record<string, number> = {};

  for (const { article } of scored) {
    if (result.length >= limit) break;
    const c = catCount[article.category] || 0;
    const l = langCount[article.language] || 0;
    if (c >= 3) continue;
    if (l >= 4) continue;
    result.push(article);
    catCount[article.category] = c + 1;
    langCount[article.language] = l + 1;
  }
  return result;
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function ArticlePage({ params }: Props) {
  const { slug: rawSlug } = await params;

  await connectDB();

  const ownerId = await getOwnerId();
  const result = await findArticle(rawSlug, ownerId);

  if (!result?.article) notFound();

  const article: any = result.article;
  const isOwnerPreview = result.isOwnerPreview;

  /* Related pool — صرف published */
  const relatedPool = await Article.find({
    status: 'published',
    slug: { $ne: article.slug },
    $or: [
      { category: article.category },
      { language: article.language },
      { tags: { $in: article.tags || [] } },
    ],
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(40)
    .select(
      'title slug excerpt thumbnail language category author authorName tags uniqueViews views publishedAt createdAt'
    )
    .lean();

  const relatedArticles = getRelatedArticles(
    article as LeanArticle,
    relatedPool as LeanArticle[],
    6
  );

  const styles = getLanguageStyles(article.language);
  const { isRtl } = styles;

  const showExcerpt = shouldShowExcerpt(
    article.excerpt || '',
    article.content || ''
  );

  const displayViews = article.uniqueViews || article.views || 0;

  return (
    <article
      className={`min-h-screen bg-gradient-to-b from-white via-white to-slate-50/40 ${
        isRtl ? 'lang-rtl' : ''
      }`}
    >
      {/* ✅ صرف published پر views track کریں */}
      {!isOwnerPreview && (
        <ViewTracker
          slug={article.slug}
          category={article.category}
          language={article.language}
        />
      )}

      {/* ⚠️ Owner Preview Banner */}
      {isOwnerPreview && (
        <div className="bg-amber-50 border-b-2 border-amber-200">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <EyeOff className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">
                Preview Mode — Not Published
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                یہ article ابھی{' '}
                <strong>
                  {article.status === 'pending'
                    ? 'review کے زیرِ التوا'
                    : article.status === 'rejected'
                    ? 'مسترد شدہ'
                    : article.status}
                </strong>{' '}
                ہے۔ صرف آپ (مالک) اسے دیکھ سکتے ہیں۔
                {typeof article.aiScore === 'number' && (
                  <> AI Score: <strong>{article.aiScore}/100</strong></>
                )}
              </p>
            </div>
            <Link
              href="/owner/articles"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
            >
              Manage
            </Link>
          </div>
        </div>
      )}

      {/* Back */}
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
        >
          <ArrowLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          {isRtl ? 'واپس بلاگ پر' : 'Back to Blog'}
        </Link>
      </div>

      {/* HEADER */}
      <header className="mx-auto max-w-3xl px-4 pt-8 pb-6">
        <div
          className={`flex items-center gap-2 flex-wrap ${
            isRtl ? 'flex-row-reverse justify-end' : ''
          }`}
        >
          <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            {article.category}
          </span>
          <span className="px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {LANG_LABEL[article.language] || article.language}
          </span>
          {isOwnerPreview && article.status === 'pending' && (
            <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Pending
            </span>
          )}
        </div>

        <h1
          className={`mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 ${
            styles.titleClass
          } ${
            isRtl
              ? 'text-right leading-[1.8] sm:leading-[2]'
              : 'leading-tight'
          }`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {article.title}
        </h1>

        {showExcerpt && (
          <p
            className={`mt-5 text-lg text-slate-600 ${styles.excerptClass} ${
              isRtl ? 'text-right leading-[2.2]' : 'leading-relaxed'
            }`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {article.excerpt}
          </p>
        )}

        {/* Meta */}
        <div
          className={`mt-6 flex items-center flex-wrap gap-4 text-sm text-slate-500 ${
            isRtl ? 'flex-row-reverse justify-end' : ''
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {(article.authorName || article.author || 'A')
                .charAt(0)
                .toUpperCase()}
            </div>
            <span
              className={`font-semibold text-slate-700 ${styles.metaClass}`}
            >
              {article.authorName || article.author}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {fmt(article.publishedAt || article.createdAt)}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {readTime(article.content)} min read
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {displayViews} {displayViews === 1 ? 'view' : 'views'}
          </span>
        </div>
      </header>

      {/* THUMBNAIL */}
      {article.thumbnail && (
        <div className="mx-auto max-w-4xl px-4 pb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full rounded-2xl shadow-lg"
          />
        </div>
      )}

      {/* CONTENT */}
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <div
          className={`prose prose-lg prose-slate max-w-none ${styles.bodyClass}`}
          dir={isRtl ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-slate-200">
            <p
              className={`text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 ${
                isRtl ? 'text-right font-urdu' : ''
              }`}
            >
              {isRtl ? 'ٹیگز' : 'Tags'}
            </p>
            <div
              className={`flex items-center gap-2 flex-wrap ${
                isRtl ? 'flex-row-reverse justify-end' : ''
              }`}
            >
              {article.tags.map((t: string) => (
                <Link
                  key={t}
                  href={`/blog?q=${encodeURIComponent(t)}`}
                  className={`px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition ${
                    isRtl ? 'font-urdu' : ''
                  }`}
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RELATED */}
      {relatedArticles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="border-t border-slate-200 pt-10">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h2
                  className={`text-xl sm:text-2xl font-bold text-slate-900 ${
                    isRtl ? 'font-urdu' : ''
                  }`}
                >
                  {isRtl
                    ? 'آپ کے لیے مزید مضامین'
                    : 'More articles for you'}
                </h2>
              </div>

              <Link
                href={`/blog?category=${encodeURIComponent(
                  article.category
                )}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {isRtl ? 'مزید دیکھیں' : 'View more'}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedArticles.map((a) => (
                <RelatedCard key={String(a._id)} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM NAV */}
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
        >
          <ArrowLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
          {isRtl ? 'مزید مضامین پڑھیں' : 'Read more articles'}
        </Link>
      </div>
    </article>
  );
}

/* ============================================================
   RELATED CARD
   ============================================================ */

function RelatedCard({ article }: { article: LeanArticle }) {
  const lang = article.language;
  const fontTitle = langFont(lang, 'title');
  const fontExcerpt = langFont(lang, 'excerpt');
  const isRtl = lang === 'ur' || lang === 'ar';
  const views = article.uniqueViews || article.views || 0;

  return (
    <Link
      href={`/blog/${encodeURIComponent(article.slug)}`}
      className="group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
    >
      <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 relative overflow-hidden">
        {article.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-emerald-400" />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur text-emerald-700 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            {article.category}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-violet-600/95 backdrop-blur text-white text-[10px] font-bold">
            {LANG_FLAG[lang] || ''} {LANG_LABEL[lang] || lang}
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold">
            <Eye className="h-3 w-3" />
            {views}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3
          className={`font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition ${fontTitle}`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {article.title}
        </h3>

        {article.excerpt && (
          <p
            className={`mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1 ${fontExcerpt}`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {article.excerpt}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {(article.authorName || article.author || 'A')
                .charAt(0)
                .toUpperCase()}
            </div>
            <span
              className={`text-[11px] font-semibold text-slate-700 truncate ${
                lang === 'ur' ? 'font-urdu' : ''
              }`}
            >
              {article.authorName || article.author}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 shrink-0">
            {relativeTime(article.publishedAt || article.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}