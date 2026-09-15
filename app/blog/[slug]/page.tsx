import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Globe,
  Clock,
  Sparkles,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';
import ViewTracker from './ViewTracker';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

/* ============================================================
   METADATA
   ============================================================ */

export async function generateMetadata({ params }: Props) {
  try {
    const { slug } = await params;
    await connectDB();
    const a = await Article.findOne({ slug, status: 'published' })
      .select('title excerpt seo')
      .lean();

    if (!a) return { title: 'Article not found | ilmora786' };

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
   HELPERS
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
   ✅ RELATED ARTICLES SCORING ENGINE
   Similarity score based on:
   - Same category (+50)
   - Same language (+25)
   - Same author (+15)
   - Matching tags (+10 per tag, max 30)
   - Recency boost (+10)
   - Popularity boost (log scale, max 15)
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

function scoreSimilarity(
  candidate: LeanArticle,
  current: LeanArticle
): number {
  let score = 0;

  /* Category match — سب سے اہم */
  if (candidate.category === current.category) score += 50;

  /* Language match */
  if (candidate.language === current.language) score += 25;

  /* Author match */
  const candAuthor = candidate.authorName || candidate.author || '';
  const currAuthor = current.authorName || current.author || '';
  if (candAuthor && candAuthor === currAuthor) score += 15;

  /* Tags overlap */
  const candTags = new Set((candidate.tags || []).map((t) => t.toLowerCase()));
  const currTags = new Set((current.tags || []).map((t) => t.toLowerCase()));
  let tagMatches = 0;
  for (const t of candTags) {
    if (currTags.has(t)) tagMatches++;
  }
  score += Math.min(30, tagMatches * 10);

  /* Recency — 30 دن کی half-life */
  const daysOld =
    (Date.now() -
      new Date(candidate.publishedAt || candidate.createdAt).getTime()) /
    (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 1 - daysOld / 30);
  score += recency * 10;

  /* Popularity — log scale */
  const views = candidate.uniqueViews || candidate.views || 0;
  const popularity = Math.min(1, Math.log10(views + 1) / 3);
  score += popularity * 15;

  return score;
}

function getRelatedArticles(
  current: LeanArticle,
  pool: LeanArticle[],
  limit: number = 6
): LeanArticle[] {
  const scored = pool
    .filter((a) => a.slug !== current.slug)
    .map((a) => ({ article: a, score: scoreSimilarity(a, current) }))
    .filter((x) => x.score > 20) // کم از کم کچھ relevance ہو
    .sort((a, b) => b.score - a.score);

  /* ✅ Diversity: same category ایک ساتھ زیادہ نہ آئے */
  const result: LeanArticle[] = [];
  const categoryCount: Record<string, number> = {};
  const languageCount: Record<string, number> = {};

  for (const { article } of scored) {
    if (result.length >= limit) break;

    const catLimit = categoryCount[article.category] || 0;
    const langLimit = languageCount[article.language] || 0;

    // ایک category سے max 3، ایک زبان سے max 4
    if (catLimit >= 3) continue;
    if (langLimit >= 4) continue;

    result.push(article);
    categoryCount[article.category] = catLimit + 1;
    languageCount[article.language] = langLimit + 1;
  }

  return result;
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  await connectDB();

  const article = await Article.findOne({ slug, status: 'published' })
    .select(
      'title slug excerpt content language category author authorName views uniqueViews tags thumbnail seo publishedAt createdAt'
    )
    .lean();

  if (!article) notFound();

  /* ✅ Related articles کے لیے candidate pool */
  const relatedPool = await Article.find({
    status: 'published',
    slug: { $ne: slug },
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
      <ViewTracker
        slug={slug}
        category={article.category}
        language={article.language}
      />

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

      {/* ============================================
          HEADER
      ============================================ */}
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

      {/* ============================================
          THUMBNAIL
      ============================================ */}
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

      {/* ============================================
          CONTENT
      ============================================ */}
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

      {/* ============================================
          ✅ RELATED ARTICLES
      ============================================ */}
      {relatedArticles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="border-t border-slate-200 pt-10">
            {/* Header */}
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
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  {isRtl ? 'تجویز کردہ' : 'Recommended'}
                </span>
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

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedArticles.map((a) => (
                <RelatedCard key={String(a._id)} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================
          BOTTOM NAV
      ============================================ */}
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
   ✅ RELATED CARD COMPONENT
   ============================================================ */

function RelatedCard({ article }: { article: LeanArticle }) {
  const lang = article.language;
  const fontTitle = langFont(lang, 'title');
  const fontExcerpt = langFont(lang, 'excerpt');
  const isRtl = lang === 'ur' || lang === 'ar';
  const views = article.uniqueViews || article.views || 0;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
    >
      {/* Thumbnail */}
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

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur text-emerald-700 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            {article.category}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-violet-600/95 backdrop-blur text-white text-[10px] font-bold">
            {LANG_FLAG[lang] || ''} {LANG_LABEL[lang] || lang}
          </span>
        </div>

        {/* Views */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold">
            <Eye className="h-3 w-3" />
            {views}
          </span>
        </div>
      </div>

      {/* Body */}
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

        {/* Meta */}
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