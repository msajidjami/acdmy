// app/components/ArticleSidebar.tsx (optional)
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';

export async function ArticleSidebar() {
  await connectDB();

  // Fetch categories
  let categories = await Article.distinct('category');
  if (!categories || categories.length === 0) {
    categories = ['Quran', 'Hadith', 'Fiqh', 'Seerah', 'Tafsir'];
  }

  // Fetch popular articles
  let popular = await Article.find({})
    .sort({ views: -1 })
    .limit(5)
    .select('title _id views category')
    .lean();

  const popularArticles = popular.map((article: any) => ({
    _id: article._id.toString(),
    title: article.title,
    category: article.category || 'General',
    views: article.views || 0,
  }));

  return (
    <aside className="space-y-8 sticky top-28">
      {/* Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Categories</h4>
        <ul className="space-y-2">
          {categories.slice(0, 8).map((cat) => (
            <li key={cat}>
              <Link
                href={`/articles?category=${encodeURIComponent(cat)}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition"
              >
                <span className="text-slate-700">{cat}</span>
                <span className="text-slate-400 text-sm">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Popular Articles */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Most Popular</h4>
        <ul className="space-y-4">
          {popularArticles.map((article, idx) => (
            <li key={article._id} className="flex items-start gap-3">
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {idx + 1}
              </span>
              <Link
                href={`/articles/${article._id}`}
                className="text-sm text-slate-800 hover:text-teal-700 font-medium line-clamp-2"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}