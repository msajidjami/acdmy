// app/articles/layout.tsx
import { ReactNode } from 'react';
import TopBar from '@/app/components/TopBar';

export default function ArticlesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <TopBar />
      <div className="container mx-auto px-4 pt-24">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-3/4">
            {children}
          </div>
          <div className="lg:w-1/4">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

// سائیڈبار کمپوننٹ
async function Sidebar() {
  // API سے ڈیٹا fetch کریں
  let categories: string[] = [];
  let authors: string[] = [];
  let popularArticles: any[] = [];
  
  try {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.quranandislamic.com'
      : 'http://localhost:3000';
    
    // Categories fetch
    const catRes = await fetch(`${baseUrl}/api/articles/categories`, {
      cache: 'no-store'
    });
    if (catRes.ok) {
      const catData = await catRes.json();
      categories = Array.isArray(catData) ? catData : [];
    }
    
    // Authors fetch
    const authRes = await fetch(`${baseUrl}/api/articles/authors`, {
      cache: 'no-store'
    });
    if (authRes.ok) {
      const authData = await authRes.json();
      authors = Array.isArray(authData) ? authData : [];
    }
    
    // Popular articles fetch - درست API endpoint استعمال کریں
    const popularRes = await fetch(`${baseUrl}/api/articles?sort=views&limit=5`, {
      cache: 'no-store'
    });
    if (popularRes.ok) {
      const popularData = await popularRes.json();
      
      // API response کو process کریں
      if (Array.isArray(popularData)) {
        popularArticles = popularData;
      } else if (popularData && typeof popularData === 'object' && Array.isArray(popularData.data)) {
        popularArticles = popularData.data;
      }
      
      // ڈیٹا کو validate کریں
      popularArticles = popularArticles
        .filter((article: any) => article && (article._id || article.id) && article.title)
        .map((article: any) => ({
          _id: article._id?.toString(),
          id: article.id?.toString(),
          title: article.title || 'بلا عنوان',
          category: article.category || 'عام',
          views: article.views || 0,
          uniqueViews: article.uniqueViews || article.views || 0,
        }));
    }
  } catch (error) {
    console.error('Error fetching sidebar data:', error);
  }

  // Default data if API fails
  if (categories.length === 0) {
    categories = ['عبادات', 'سیرت النبی', 'قرآن پاک', 'حدیث', 'فقہ', 'اخلاق', 'تاریخ'];
  }
  
  if (authors.length === 0) {
    authors = ['ایڈمن', 'اسلامی سکالر', 'قرآن اسکالر', 'حدیث اسکالر'];
  }
  
  if (popularArticles.length === 0) {
    popularArticles = [
      { _id: '1', title: 'نماز کی اہمیت', uniqueViews: 1500, views: 1500 },
      { _id: '2', title: 'روزے کے طبی فوائد', uniqueViews: 1200, views: 1200 },
      { _id: '3', title: 'زکوٰۃ کے احکام', uniqueViews: 900, views: 900 },
      { _id: '4', title: 'حج کی تیاری', uniqueViews: 800, views: 800 },
    ];
  }

  return (
    <aside className="space-y-8">
      {/* کٹیگریز سیکشن */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span>📚</span>
            زمرہ جات
          </h3>
        </div>
        <div className="p-4">
          {categories.length > 0 ? (
            <ul className="space-y-2">
              {categories.slice(0, 6).map((category) => (
                <li key={category}>
                  <a
                    href={`/articles?category=${encodeURIComponent(category)}`}
                    className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-green-50 transition-colors group"
                  >
                    <span className="text-gray-700 group-hover:text-green-800 font-medium">
                      {category}
                    </span>
                    <span className="text-green-600 text-sm group-hover:text-green-700">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>زمرہ جات دستیاب نہیں</p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-green-100">
            <a
              href="/articles"
              className="block text-center bg-green-100 text-green-700 hover:bg-green-200 py-2 rounded-lg font-medium transition-colors"
            >
              تمام زمرہ جات
            </a>
          </div>
        </div>
      </div>

      {/* مصنفین سیکشن */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span>✍️</span>
            مصنفین
          </h3>
        </div>
        <div className="p-4">
          {authors.length > 0 ? (
            <ul className="space-y-3">
              {authors.slice(0, 5).map((author) => (
                <li key={author}>
                  <a
                    href={`/articles?author=${encodeURIComponent(author)}`}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold">
                        {author.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 group-hover:text-blue-800">
                        {author}
                      </p>
                      <p className="text-xs text-gray-500">مصنف</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>مصنفین دستیاب نہیں</p>
            </div>
          )}
        </div>
      </div>

      {/* اشتہار یا خاص پوسٹ */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-200 overflow-hidden">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">📖</div>
          <h4 className="font-bold text-amber-800 text-lg mb-2">
            قرآن پاک سیکھیں
          </h4>
          <p className="text-amber-700 mb-4 text-sm">
            قرآن پاک کی تعلیمات سے متعلق خصوصی مضامین
          </p>
          <a
            href="/articles?category=قرآن پاک"
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-6 rounded-full font-bold hover:shadow-lg transition-all"
          >
            مطالعہ کریں
          </a>
        </div>
      </div>

      {/* مقبول آرٹیکلز */}
      <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span>🔥</span>
            مقبول ترین
          </h3>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {popularArticles.slice(0, 5).map((article, index) => (
              <li key={article._id || article.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                    index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900' :
                    'bg-gradient-to-br from-green-500 to-emerald-600'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <a 
                    href={`/articles/${article._id || article.id}`}
                    className="text-gray-700 hover:text-purple-700 cursor-pointer font-medium line-clamp-2 text-sm leading-tight block mb-1"
                  >
                    {article.title}
                  </a>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {article.category || 'عام'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-purple-600">👁️</span>
                      {(article.uniqueViews || article.views || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-green-100">
            <a
              href="/articles?sort=views"
              className="block text-center bg-purple-100 text-purple-700 hover:bg-purple-200 py-2 rounded-lg font-medium transition-colors"
            >
              مزید مقبول آرٹیکلز
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}