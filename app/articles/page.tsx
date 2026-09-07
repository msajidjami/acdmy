// app/articles/page.tsx
import Link from 'next/link';
import { Suspense } from 'react';
import Script from 'next/script'; // ✅ Next.js Script import کیا گیا ہے
import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';
import { Metadata } from 'next';

// ─── Types ────────────────────────────────────────────────────────────────
interface ArticleType {
  _id: string;
  title: string;
  thumbnail?: string;
  category?: string;
  author?: string;
  excerpt?: string;
  createdAt: string;
  uniqueViews: number;
  tags?: string[];
}

// ✅ Disable static caching to always fetch fresh data
export const revalidate = 0;

// ─── Metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category as string;
  const sort = params.sort as string;

  let title = 'Articles – Quran & Islamic Academy';
  let description = 'Explore authentic Islamic articles, scholarly insights, and educational resources on Quran, Hadith, Fiqh, Seerah, and more.';

  if (category) {
    title = `${category} – Articles | Quran & Islamic Academy`;
    description = `Read insightful articles on ${category} from qualified Islamic scholars.`;
  } else if (sort === 'views') {
    title = 'Most Popular Articles – Quran & Islamic Academy';
    description = 'The most read and shared Islamic articles on our platform.';
  } else if (sort === 'createdAt') {
    title = 'Latest Articles – Quran & Islamic Academy';
    description = 'Newly published Islamic articles and scholarly reflections.';
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: 'https://www.quranandislamic.com/articles',
      siteName: 'Quran & Islamic Academy',
      images: [
        {
          url: 'https://www.quranandislamic.com/og-articles.jpg',
          width: 1200,
          height: 630,
          alt: 'Islamic Articles',
        },
      ],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.quranandislamic.com/articles',
    },
  };
}

// ─── Data Fetching ──────────────────────────────────────────────────────
async function getArticles(filters?: {
  category?: string;
  sort?: string;
  author?: string;
}): Promise<ArticleType[]> {
  try {
    await connectDB();
    const query: any = {};
    if (filters?.category && filters.category !== 'all') query.category = filters.category;
    if (filters?.author) query.author = filters.author;

    let sortOptions: any = { createdAt: -1 };
    if (filters?.sort === 'views') sortOptions = { uniqueViews: -1, createdAt: -1 };
    else if (filters?.sort === 'createdAt') sortOptions = { createdAt: -1 };

    const articles = await Article.find(query)
      .sort(sortOptions)
      .limit(50)
      .select('-__v')
      .lean();

    return articles.map((article: any) => ({
      _id: article._id.toString(),
      title: article.title || 'Untitled',
      thumbnail: article.thumbnail,
      category: article.category || 'General',
      author: article.author || 'Admin',
      excerpt: article.excerpt || '',
      createdAt: article.createdAt?.toISOString() || new Date().toISOString(),
      // ✅ Ensure uniqueViews has a value, even if missing from DB
      uniqueViews: article.uniqueViews ?? 0,
      tags: article.tags || [],
    }));
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

// ─── Components ──────────────────────────────────────────────────────────

// Filter Buttons
function FilterButtons({ activeFilter, currentCategory }: { activeFilter: string; currentCategory?: string }) {
  const filters = [
    { key: 'all', label: 'All', icon: '📚', sort: '', category: '' },
    { key: 'popular', label: 'Most Popular', icon: '🔥', sort: 'views', category: '' },
    { key: 'latest', label: 'Latest', icon: '🆕', sort: 'createdAt', category: '' },
  ];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;
        const params = new URLSearchParams();
        if (filter.sort) params.set('sort', filter.sort);
        if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
        const href = params.toString() ? `/articles?${params.toString()}` : '/articles';

        return (
          <Link
            key={filter.key}
            href={href}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              isActive
                ? 'bg-teal-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="text-lg">{filter.icon}</span>
            <span>{filter.label}</span>
            {isActive && <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded-full">✓</span>}
          </Link>
        );
      })}
    </div>
  );
}

// Category Filter
async function CategoryFilterButtons({
  currentSort,
  currentCategory,
}: {
  currentSort?: string;
  currentCategory?: string;
}) {
  await connectDB();
  let categories = await Article.distinct('category');
  if (!categories || categories.length === 0) {
    categories = ['Quran', 'Hadith', 'Fiqh', 'Seerah', 'Tafsir', 'Aqeedah', 'History'];
  }

  const baseParams = new URLSearchParams();
  if (currentSort) baseParams.set('sort', currentSort);
  const baseQuery = baseParams.toString();

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Categories</h3>
      <div className="flex flex-wrap gap-2">
        <Link
          href={baseQuery ? `/articles?${baseQuery}` : '/articles'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !currentCategory ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All
        </Link>
        {categories.map((cat) => {
          const params = new URLSearchParams(baseQuery);
          params.set('category', cat);
          return (
            <Link
              key={cat}
              href={`/articles?${params.toString()}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                currentCategory === cat
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams ? await searchParams : {};
  const sort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;

  const filters: any = {};
  if (sort) filters.sort = sort;
  if (category) filters.category = category;

  const articles = await getArticles(filters);

  let activeFilter = 'all';
  if (sort === 'views') activeFilter = 'popular';
  else if (sort === 'createdAt') activeFilter = 'latest';

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-12">
      
      {/* 🚀 Monetag Ads Integration Starts Here */}
      <Script 
        id="monetag-vignette-articles-page" 
        src="https://n6wxm.com/vignette.min.js" 
        data-zone="11197980" 
        strategy="afterInteractive" 
      />
      <Script 
        id="monetag-in-page-push-articles-page" 
        src="https://nap5k.com/tag.min.js" 
        data-zone="11197983" 
        strategy="afterInteractive" 
      />
      {/* 🚀 Monetag Ads Integration Ends Here */}

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Islamic <span className="text-teal-700">Articles</span>
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Scholarly insights, Quranic reflections, and authentic Islamic knowledge
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <FilterButtons activeFilter={activeFilter} currentCategory={category} />
        </div>

        <Suspense fallback={<div className="h-12 w-full bg-slate-200 rounded animate-pulse" />}>
          <CategoryFilterButtons currentSort={sort} currentCategory={category} />
        </Suspense>

        {/* Results Count */}
        <div className="mt-8 flex justify-between items-center text-sm text-slate-500 border-t border-slate-200 pt-4">
          <span>
            Showing <strong className="text-slate-800">{articles.length}</strong> articles
          </span>
          {sort && (
            <span className="capitalize">
              Sorted by: <span className="font-medium text-slate-700">{sort === 'views' ? 'Popularity' : 'Latest'}</span>
            </span>
          )}
        </div>

        {/* Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200 mt-8">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">No Articles Found</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Try adjusting your filters or browse all articles.
            </p>
            <Link
              href="/articles"
              className="mt-6 inline-block bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-800 transition"
            >
              View All Articles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {articles.map((article) => (
              <Link
                key={article._id}
                href={`/articles/${article._id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 bg-slate-100">
                  {article.thumbnail ? (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 text-6xl opacity-30">
                      📖
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-teal-700/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {article.category}
                  </div>
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-slate-600 text-sm mt-2 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-slate-700">{article.author}</span>
                      <span className="text-slate-300">•</span>
                      <span>{new Date(article.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400">👁</span>
                      <span>{article.uniqueViews ?? 0}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <section className="mt-16 bg-slate-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Contribute Your Knowledge</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Share your Islamic insights, research, and reflections with our growing community of learners.
          </p>
          <Link
            href="/admin/articles"
            className="mt-4 inline-block bg-teal-600 hover:bg-teal-500 text-white font-semibold px-8 py-3 rounded-lg transition"
          >
            Submit an Article
          </Link>
        </section>
      </div>
    </div>
  );
}