// app/articles/page.tsx
import Link from 'next/link';

async function getArticles() {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://www.quranandislamic.com'
    : 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/articles`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch articles');
  }

  return res.json();
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold text-green-800 mb-10 text-center tracking-tight">
        اسلامی آرٹیکلز
      </h1>

      {articles.length === 0 ? (
        <p className="text-center text-gray-600 text-xl font-medium">
          کوئی آرٹیکل ابھی دستیاب نہیں۔ ایڈمن پینل سے شامل کریں۔
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {articles.map((article: any) => (
            <div
              key={article._id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            >
              {article.thumbnail && (
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  {article.category || 'General'}
                </span>
                <Link
                  href={`/articles/${article._id}`}
                  className="block mt-2 text-2xl font-bold text-green-700 hover:text-green-900 transition-colors"
                >
                  {article.title}
                </Link>
                <p className="mt-2 text-gray-600 text-sm">
                  تحریر: {article.author || 'Admin'}
                </p>
                <div className="mt-4 flex justify-between items-center text-gray-500 text-sm">
                  <span>
                    {new Date(article.createdAt).toLocaleDateString('ur-PK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>{article.views} دیکھا گیا</span>
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {article.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}