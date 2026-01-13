// app/articles/page.tsx
import Link from 'next/link';
import ArticleCard from '@/app/components/ArticleCard';
import { Suspense } from 'react';

// Types
interface Article {
  _id?: string;
  id?: string;
  title: string;
  thumbnail?: string;
  category?: string;
  language?: string;
  author?: string;
  excerpt?: string;
  content?: string;
  createdAt?: string;
  views?: number;
  uniqueViews?: number;
  tags?: string[];
}

interface ApiResponse {
  success: boolean;
  data: Article[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

async function getArticles(filters?: {
  category?: string;
  language?: string;
  sort?: string;
  author?: string;
}): Promise<Article[]> {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://www.quranandislamic.com'
    : 'http://localhost:3000';

  try {
    const queryParams = new URLSearchParams();
    
    if (filters?.sort) queryParams.append('sort', filters.sort);
    if (filters?.language) queryParams.append('language', filters.language);
    if (filters?.category && filters.category !== 'all') {
      queryParams.append('category', filters.category);
    }
    if (filters?.author) queryParams.append('author', filters.author);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${baseUrl}/api/articles?${queryString}` : `${baseUrl}/api/articles`;

    console.log('Fetching articles from:', url);

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch articles, status:', res.status);
      return [];
    }

    const response = await res.json();
    
    let dataArray: any[] = [];
    
    if (Array.isArray(response)) {
      dataArray = response;
    } else if (response && typeof response === 'object') {
      if (response.success && Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (Array.isArray(response.data)) {
        dataArray = response.data;
      } else {
        console.error('Unexpected API response format:', response);
        return [];
      }
    } else {
      console.error('Unexpected API response:', response);
      return [];
    }
    
    const validatedArticles: Article[] = dataArray
      .filter((item: any) => item && (item._id || item.id) && item.title)
      .map((item: any) => ({
        _id: item._id?.toString(),
        id: item.id?.toString(),
        title: item.title || 'بلا عنوان',
        thumbnail: item.thumbnail,
        category: item.category || 'عام',
        language: item.language || 'ur',
        author: item.author || 'ایڈمن',
        excerpt: item.excerpt,
        content: item.content,
        createdAt: item.createdAt,
        views: item.views || 0,
        uniqueViews: item.uniqueViews || item.views || 0,
        tags: item.tags || [],
      }));

    return validatedArticles;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

// Filter buttons component
function FilterButtons({ 
  activeFilter,
  currentCategory 
}: { 
  activeFilter: string;
  currentCategory?: string;
}) {
  const filters = [
    { key: 'all', label: 'تمام', icon: '📚', sort: '', language: '' },
    { key: 'popular', label: 'مقبول ترین', icon: '🔥', sort: 'views', language: '' },
    { key: 'latest', label: 'تازہ ترین', icon: '🆕', sort: 'createdAt', language: '' },
    { key: 'urdu', label: 'اردو', icon: '🇵🇰', sort: '', language: 'ur' },
    { key: 'english', label: 'انگریزی', icon: '🇬🇧', sort: '', language: 'en' },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;
        
        const params = new URLSearchParams();
        
        if (filter.sort) {
          params.set('sort', filter.sort);
        }
        
        if (filter.language) {
          params.set('language', filter.language);
        }
        
        if (currentCategory && currentCategory !== 'all') {
          params.set('category', currentCategory);
        }
        
        const queryString = params.toString();
        const href = queryString ? `/articles?${queryString}` : '/articles';

        return (
          <Link
            key={filter.key}
            href={href}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
              isActive
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-md'
            }`}
          >
            <span className="text-lg">{filter.icon}</span>
            <span>{filter.label}</span>
            {isActive && (
              <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded-full">
                ✓
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// Loading skeleton for categories
function CategoryFilterSkeleton() {
  return (
    <div className="mt-4">
      <div className="h-6 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
      <div className="flex flex-wrap gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

// Category filter buttons component
async function CategoryFilterButtons({
  currentSort,
  currentLanguage
}: {
  currentSort?: string;
  currentLanguage?: string;
}) {
  try {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.quranandislamic.com'
      : 'http://localhost:3000';
    
    const res = await fetch(`${baseUrl}/api/articles/categories`, {
      cache: 'no-store',
    });
    
    let categories: string[] = [];
    if (res.ok) {
      const data = await res.json();
      categories = Array.isArray(data) ? data : [];
    }
    
    if (categories.length === 0) {
      categories = ['عبادات', 'سیرت النبی', 'قرآن پاک', 'حدیث', 'فقہ', 'اخلاق', 'تاریخ'];
    }

    const params = new URLSearchParams();
    if (currentSort) params.set('sort', currentSort);
    if (currentLanguage) params.set('language', currentLanguage);
    const baseQuery = params.toString();

    return (
      <div className="mt-4">
        <h3 className="text-lg font-bold text-green-800 mb-3">زمرہ جات:</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href={baseQuery ? `/articles?${baseQuery}` : '/articles'}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-md transition-all"
          >
            تمام
          </Link>
          {categories.slice(0, 8).map((category: string) => {
            const categoryParams = new URLSearchParams(baseQuery);
            categoryParams.set('category', category);
            return (
              <Link
                key={category}
                href={`/articles?${categoryParams.toString()}`}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 hover:shadow-md transition-all"
              >
                {category}
              </Link>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="mt-4">
        <h3 className="text-lg font-bold text-green-800 mb-3">زمرہ جات:</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/articles"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium"
          >
            تمام
          </Link>
          {['عبادات', 'سیرت', 'قرآن', 'حدیث'].map((category) => (
            <Link
              key={category}
              href={`/articles?category=${category}`}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    );
  }
}

// Helper function to extract params
function getParamValue(params: URLSearchParams, key: string): string | undefined {
  return params.get(key) || undefined;
}

// Main page component
export default async function ArticlesPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the searchParams promise
  const searchParams = props.searchParams ? await props.searchParams : {};
  
  // Create URLSearchParams from the searchParams object
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    }
  });
  
  // Extract parameters using URLSearchParams
  const sort = params.get('sort') || undefined;
  const language = params.get('language') || undefined;
  const category = params.get('category') || undefined;
  const filter = params.get('filter') || undefined;

  // Determine active filter for UI
  let activeFilter = 'all';
  if (filter === 'popular' || sort === 'views') activeFilter = 'popular';
  else if (filter === 'latest' || sort === 'createdAt') activeFilter = 'latest';
  else if (filter === 'urdu' || language === 'ur') activeFilter = 'urdu';
  else if (filter === 'english' || language === 'en') activeFilter = 'english';
  else if (category) activeFilter = 'category';

  // Build filters for API
  const filters: any = {};
  
  // Handle legacy filter parameter
  if (filter === 'popular' || sort === 'views') {
    filters.sort = 'views';
  } else if (filter === 'latest' || sort === 'createdAt') {
    filters.sort = 'createdAt';
  } else if (sort) {
    filters.sort = sort;
  }
  
  if (filter === 'urdu' || language === 'ur') {
    filters.language = 'ur';
  } else if (filter === 'english' || language === 'en') {
    filters.language = 'en';
  } else if (language) {
    filters.language = language;
  }
  
  if (category) {
    filters.category = category;
  }

  // Fetch articles with filters
  const articles = await getArticles(filters);
  
  // Get page title and description
  const getPageTitle = () => {
    if (category) return `${category} - آرٹیکلز`;
    if (filter === 'popular' || sort === 'views') return 'مقبول ترین آرٹیکلز';
    if (filter === 'latest' || sort === 'createdAt') return 'تازہ ترین آرٹیکلز';
    if (filter === 'urdu' || language === 'ur') return 'اردو آرٹیکلز';
    if (filter === 'english' || language === 'en') return 'انگریزی آرٹیکلز';
    return 'اسلامی آرٹیکلز';
  };

  const getPageDescription = () => {
    if (category) return `${category} سے متعلق اسلامی مضامین کا ذخیرہ`;
    if (filter === 'popular' || sort === 'views') return 'سب سے زیادہ پڑھے جانے والے اسلامی مضامین';
    if (filter === 'latest' || sort === 'createdAt') return 'تازہ ترین اسلامی مضامین';
    if (filter === 'urdu' || language === 'ur') return 'اردو زبان میں اسلامی مضامین';
    if (filter === 'english' || language === 'en') return 'انگریزی زبان میں اسلامی مضامین';
    return 'قرآن و سنت کی روشنی میں اسلامی تعلیمات کا وسیع ذخیرہ';
  };

  // Function to remove a specific parameter from current URL
  const removeParam = (paramToRemove: string) => {
    const newParams = new URLSearchParams(params.toString());
    newParams.delete(paramToRemove);
    const queryString = newParams.toString();
    return queryString ? `/articles?${queryString}` : '/articles';
  };

  return (
    <div className="mb-10 mt-27">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-green-800 mb-3 tracking-tight">
          {getPageTitle()}
        </h1>
        <p className="text-gray-600 text-lg">
          {getPageDescription()}
        </p>
        
        {/* Active Filters Display */}
        {(filter || sort || language || category) && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-500">فعال فلٹرز:</span>
            <div className="flex flex-wrap gap-2">
              {category && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  {category}
                  <Link 
                    href={removeParam('category')}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </Link>
                </span>
              )}
              {(filter === 'popular' || sort === 'views') && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  مقبول ترین
                  <Link 
                    href={sort === 'views' ? removeParam('sort') : removeParam('filter')}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </Link>
                </span>
              )}
              {(filter === 'latest' || sort === 'createdAt') && (
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  تازہ ترین
                  <Link 
                    href={sort === 'createdAt' ? removeParam('sort') : removeParam('filter')}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </Link>
                </span>
              )}
              {(filter === 'urdu' || language === 'ur') && (
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  اردو
                  <Link 
                    href={language === 'ur' ? removeParam('language') : removeParam('filter')}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </Link>
                </span>
              )}
              {(filter === 'english' || language === 'en') && (
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  انگریزی
                  <Link 
                    href={language === 'en' ? removeParam('language') : removeParam('filter')}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </Link>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Buttons */}
      <FilterButtons activeFilter={activeFilter} currentCategory={category} />
      
      {/* Category Filter Buttons */}
      <Suspense fallback={<CategoryFilterSkeleton />}>
        <CategoryFilterButtons currentSort={sort} currentLanguage={language} />
      </Suspense>

      {/* Results Count */}
      {articles.length > 0 && (
        <div className="mt-8 mb-6 flex items-center justify-between">
          <div className="text-gray-600">
            کل <span className="font-bold text-green-700">{articles.length}</span> آرٹیکلز
          </div>
          <div className="text-sm text-gray-500">
            {sort === 'views' ? 'ترتیب: مقبول ترین' : 
             sort === 'createdAt' ? 'ترتیب: تازہ ترین' :
             language === 'ur' ? 'زبان: اردو' :
             language === 'en' ? 'زبان: انگریزی' :
             category ? `زمرہ: ${category}` : 'ترتیب: ڈیفالٹ'}
          </div>
        </div>
      )}

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-green-200 mt-8">
          <div className="text-5xl mb-6">🔍</div>
          <h3 className="text-2xl font-bold text-gray-700 mb-4">کوئی آرٹیکل نہیں ملا</h3>
          <p className="text-gray-600 mb-6">
            آپ کی منتخب کردہ شرائط کے مطابق کوئی آرٹیکل دستیاب نہیں ہے۔
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/articles"
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
            >
              تمام آرٹیکلز دیکھیں
            </Link>
            <Link
              href="/articles?sort=views"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
            >
              مقبول ترین دیکھیں
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {articles.map((article, index) => (
            <ArticleCard 
              key={article._id || article.id || index} 
              article={article} 
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {articles.length > 0 && (
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center gap-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              ← پچھلا
            </button>
            <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">
              1
            </span>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              اگلا →
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}