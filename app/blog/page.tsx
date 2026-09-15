import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  BookOpen,
  Eye,
  ArrowRight,
  Search,
  Globe,
  FileText,
  TrendingUp,
  Sparkles,
  Flame,
  Clock,
} from 'lucide-react';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';
import {
  PROFILE_COOKIE,
  parseProfile,
  sortByScore,
} from '@/app/lib/recommendation';

export const metadata = {
  title: 'Blog | ilmora786',
  description:
    'Read authentic Islamic articles, insights, and knowledge — in English, Urdu, and Arabic.',
};

export const dynamic = 'force-dynamic';

/* ============================================================
   TYPES & CONSTANTS
   ============================================================ */

type BlogPageProps = {
  searchParams: Promise<{
    category?: string;
    language?: string;
    q?: string;
    page?: string;
  }>;
};

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

const PAGE_SIZE = 12;

/* ============================================================
   HELPERS
   ============================================================ */

function relativeTime(d: Date | string) {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  } catch {
    return '';
  }
}

/* زبان کے مطابق title/excerpt font class */
function langFont(language: string, kind: 'title' | 'excerpt' = 'title') {
  if (language === 'ur') return 'font-urdu';
  if (language === 'ar') return 'font-arabic';
  return kind === 'title' ? 'font-serif' : '';
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = (await searchParams) || {};

  const category = params.category || 'all';
  const language = params.language || 'all';
  const q = (params.q || '').trim();
  const page = Math.max(1, parseInt(params.page || '1', 10));

  /* ---------- User profile ---------- */
  const cookieStore = await cookies();
  const profileRaw = cookieStore.get(PROFILE_COOKIE)?.value;
  const profile = parseProfile(profileRaw);

  await connectDB();

  /* ---------- Base query ---------- */
  const query: Record<string, unknown> = { status: 'published' };
  if (category !== 'all') query.category = category;
  if (language !== 'all') query.language = language;
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { excerpt: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ];
  }

  /* ---------- Parallel fetch ---------- */
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [rawArticles, total, categories, trendingRaw, latestRaw] =
    await Promise.all([
      Article.find(query)
        .select(
          'title slug excerpt thumbnail language category author authorName uniqueViews views publishedAt createdAt tags'
        )
        .lean(),
      Article.countDocuments(query),
      Article.distinct('category', { status: 'published' }),
      Article.find({
        status: 'published',
        publishedAt: { $gte: weekAgo },
      })
        .sort({ uniqueViews: -1, views: -1 })
        .limit(3)
        .select(
          'title slug excerpt thumbnail language category authorName uniqueViews views publishedAt createdAt'
        )
        .lean(),
      Article.find({ status: 'published' })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(6)
        .select(
          'title slug excerpt thumbnail language category authorName uniqueViews views publishedAt createdAt'
        )
        .lean(),
    ]);

  /* ---------- Algorithmic sort ---------- */
  const sorted = sortByScore(rawArticles as any, profile);

  /* ---------- Pagination (after sort) ---------- */
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const articles = sorted.slice(start, start + PAGE_SIZE);

  /* ---------- Personalized vs generic header ---------- */
  const isPersonalized =
    Object.keys(profile.categories).length > 0 ||
    Object.keys(profile.languages).length > 0;

  const topCategory =
    Object.entries(profile.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    null;

  const topLanguage =
    Object.entries(profile.languages).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    null;

  /* filters کے ساتھ کوئی بھی سرگرمی */
  const hasActiveFilters =
    category !== 'all' || language !== 'all' || q.length > 0;

  return (
    <div className="min-h-screen  bg-gradient-to-b from-white via-slate-50/40 to-white">
      {/* ============================================
          🔍 SEARCH BAR — سب سے اوپر (Sticky)
      ============================================ */}
<section className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <form className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3  top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search articles, tags, topics..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm transition"
              />
            </div>

            {/* Category dropdown */}
            <select
              name="category"
              defaultValue={category}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Language dropdown */}
            <select
              name="language"
              defaultValue={language}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            >
              <option value="all">All Languages</option>
              <option value="en">🌐 English</option>
              <option value="ur">🇵🇰 اردو</option>
              <option value="ar">🕌 العربية</option>
            </select>

            {/* Submit */}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md hover:from-emerald-700 hover:to-teal-700 transition active:scale-[0.98] whitespace-nowrap"
            >
              Search
            </button>

            {/* Clear (اگر filter لگا ہو) */}
            {hasActiveFilters && (
              <Link
                href="/blog"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition whitespace-nowrap text-center"
              >
                Clear
              </Link>
            )}
          </form>

          {/* Quick language pills */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick:
            </span>
            <Link
              href="/blog?language=ur"
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                language === 'ur'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600'
              }`}
            >
              🇵🇰 اردو
            </Link>
            <Link
              href="/blog?language=ar"
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                language === 'ar'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600'
              }`}
            >
              🕌 العربية
            </Link>
            <Link
              href="/blog?language=en"
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                language === 'en'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600'
              }`}
            >
              🌐 English
            </Link>
            <Link
              href="/blog"
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                !hasActiveFilters
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600'
              }`}
            >
              All
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          HERO
      ============================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-10">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold">
              {isPersonalized ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Personalized for you
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4" />
                  Knowledge Hub
                </>
              )}
            </span>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              {isPersonalized && topCategory ? (
                <>
                  More on{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 bg-clip-text text-transparent">
                    {topCategory}
                  </span>
                </>
              ) : (
                <>
                  Articles &{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 bg-clip-text text-transparent">
                    Insights
                  </span>
                </>
              )}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              {isPersonalized
                ? topLanguage
                  ? `Curated for ${
                      LANG_LABEL[topLanguage] || topLanguage
                    } readers`
                  : 'Curated just for you based on your reading history'
                : 'Authentic Islamic articles from academy owners around the world.'}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          TRENDING NOW
      ============================================ */}
      {trendingRaw.length > 0 && !hasActiveFilters && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Trending this week
            </h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider">
              Hot
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {trendingRaw.map((a, i) => (
              <TrendingCard
                key={String(a._id)}
                article={a as any}
                rank={i + 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* ============================================
          LATEST (صرف تب جب personalized نہیں)
      ============================================ */}
      {!isPersonalized && latestRaw.length > 0 && !hasActiveFilters && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-md shadow-sky-500/30">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Latest articles
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestRaw.slice(0, 3).map((a) => (
              <CompactCard key={String(a._id)} article={a as any} />
            ))}
          </div>
        </section>
      )}

      {/* ============================================
          MAIN GRID
      ============================================ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {q
                ? `Results for "${q}"`
                : isPersonalized
                ? 'Recommended for you'
                : 'All articles'}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              ({total})
            </span>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-200 p-16 text-center">
            <FileText className="h-14 w-14 mx-auto text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-800">
              No articles found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing filters or search terms.
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {articles.map((a) => (
              <ArticleCard
                key={String(a._id)}
                article={a as any}
                isPersonalized={isPersonalized}
              />
            ))}
          </div>
        )}

        {/* ============================================
            PAGINATION
        ============================================ */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {page > 1 && (
              <PagLink
                page={page - 1}
                category={category}
                language={language}
                q={q}
                label="← Previous"
              />
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-slate-400 text-sm">…</span>
                      )}
                      <PagLink
                        page={p}
                        category={category}
                        language={language}
                        q={q}
                        label={String(p)}
                        active={p === page}
                      />
                    </div>
                  );
                })}
            </div>

            {page < totalPages && (
              <PagLink
                page={page + 1}
                category={category}
                language={language}
                q={q}
                label="Next →"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   COMPONENTS
   ============================================================ */

/* ---------- Article Card (main grid) ---------- */

function ArticleCard({
  article,
}: {
  article: any;
  isPersonalized: boolean;
}) {
  const lang = article.language as string;
  const fontTitle = langFont(lang, 'title');
  const fontExcerpt = langFont(lang, 'excerpt');

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

        {/* Views badge */}
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
          dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {article.title}
        </h3>

        <p
          className={`mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1 ${fontExcerpt}`}
          dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {article.excerpt}
        </p>

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

/* ---------- Trending Card (بڑا) ---------- */

function TrendingCard({ article, rank }: { article: any; rank: number }) {
  const lang = article.language as string;
  const views = article.uniqueViews || article.views || 0;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group relative rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-orange-300 hover:shadow-xl transition-all duration-300"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-orange-100 to-red-100 relative overflow-hidden">
        {article.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flame className="h-14 w-14 text-orange-400" />
          </div>
        )}

        {/* Rank badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-bold shadow-lg">
            {rank}
          </span>
        </div>

        {/* Views */}
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur text-white text-xs font-bold">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            {views} views
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3
          className={`font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-orange-600 transition ${langFont(
            lang,
            'title'
          )}`}
          dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {article.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
          <span className={lang === 'ur' ? 'font-urdu' : ''}>
            {article.authorName}
          </span>
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {LANG_LABEL[lang]}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ---------- Compact Card (latest) ---------- */

function CompactCard({ article }: { article: any }) {
  const lang = article.language as string;
  const views = article.uniqueViews || article.views || 0;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition"
    >
      <div className="h-16 w-24 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 shrink-0 overflow-hidden">
        {article.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-emerald-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className={`text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition ${langFont(
            lang,
            'title'
          )}`}
          dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {article.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {views}
          </span>
          <span>·</span>
          <span>
            {relativeTime(article.publishedAt || article.createdAt)}
          </span>
        </div>
      </div>

      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition shrink-0" />
    </Link>
  );
}

/* ---------- Pagination Link ---------- */

function PagLink({
  page,
  category,
  language,
  q,
  label,
  active,
}: {
  page: number;
  category: string;
  language: string;
  q: string;
  label: string;
  active?: boolean;
}) {
  const sp = new URLSearchParams();
  if (category !== 'all') sp.set('category', category);
  if (language !== 'all') sp.set('language', language);
  if (q) sp.set('q', q);
  if (page > 1) sp.set('page', String(page));
  const href = `/blog${sp.toString() ? `?${sp}` : ''}`;

  return (
    <Link
      href={href}
      className={`h-9 min-w-9 px-3 rounded-lg text-sm font-bold inline-flex items-center justify-center transition ${
        active
          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-emerald-300'
      }`}
    >
      {label}
    </Link>
  );
}