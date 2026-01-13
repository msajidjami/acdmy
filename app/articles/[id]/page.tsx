// app/articles/[id]/page.tsx
'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// یہ فنکشن یوزر کا unique ID بنائے گی
const getOrCreateUserId = () => {
  if (typeof window === 'undefined') return null;
  
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    // نیا unique ID بنائیں
    userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('user_id', userId);
  }
  return userId;
};

async function getArticle(id: string) {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://www.quranandislamic.com'
        : 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/articles/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) notFound();

    return await res.json();
  } catch (error) {
    console.error('Error fetching article:', error);
    notFound();
  }
}

// Unique view کاؤنٹر
async function incrementViewCount(articleId: string) {
  try {
    const userId = getOrCreateUserId();
    if (!userId) return;

    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://www.quranandislamic.com'
        : 'http://localhost:3000';

    // چیک کریں کہ یہ صارف پہلے ہی دیکھ چکا ہے
    const viewKey = `viewed_${articleId}_${userId}`;
    const hasViewed = localStorage.getItem(viewKey);
    
    if (!hasViewed) {
      // سرور کو view increment کرنے کے لیے بھیجیں
      await fetch(`${baseUrl}/api/articles/${articleId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      // localStorage میں نشان لگا دیں کہ یہ صارف دیکھ چکا ہے
      localStorage.setItem(viewKey, 'true');
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

// شیئرنگ کے لیے helper functions
const shareOnFacebook = (url: string, title: string) => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
  window.open(shareUrl, '_blank', 'width=600,height=400');
};

const shareOnWhatsApp = (url: string, title: string) => {
  const shareText = `${title} - ${url}`;
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(shareUrl, '_blank', 'width=600,height=400');
};

const shareOnTwitter = (url: string, title: string) => {
  const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  window.open(shareUrl, '_blank', 'width=600,height=400');
};

const copyToClipboard = (url: string) => {
  navigator.clipboard.writeText(url).then(() => {
    alert('لنک کاپی ہو گیا ہے!');
  });
};

export default function ArticlePage() {
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (!id) {
      notFound();
      return;
    }

    // موجودہ URL حاصل کریں
    setCurrentUrl(window.location.href);

    const fetchArticle = async () => {
      try {
        const data = await getArticle(id);
        setArticle(data);
        setLoading(false);
        
        // View count increment کریں
        incrementViewCount(id);
        
        // گوگل ٹرانسلیٹ سکرپٹ لوڈ
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);

        // ٹرانسلیٹ انیشلائزیشن
        (window as any).googleTranslateElementInit = () => {
          if ((window as any).google?.translate?.TranslateElement) {
            const config: any = {
              pageLanguage: 'en',
              includedLanguages: 'en,ur,ar,hi',
              autoDisplay: false,
            };
            
            const translateElement = (window as any).google.translate.TranslateElement;
            if (translateElement.InlineLayout) {
              config.layout = translateElement.InlineLayout.SIMPLE;
            }
            
            new translateElement(config, 'google_translate_element');
          }
        };

        // پچھلا ٹرانسلیٹ ہٹا دیں
        document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      } catch (error) {
        console.error('Error:', error);
        notFound();
      }
    };
    
    fetchArticle();
    
    return () => {
      // Cleanup
      const script = document.querySelector('script[src*="translate.google.com"]');
      if (script) {
        script.remove();
      }
      delete (window as any).googleTranslateElementInit;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-28 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-green-600 border-solid mb-4"></div>
        <p className="text-xl font-medium text-gray-700">آرٹیکل لوڈ ہو رہا ہے...</p>
      </div>
    );
  }

  if (!article) notFound();

  // فونٹ کلاس کا فیصلہ
  const fontClass = article.language === 'ur'
    ? 'urdu-font'
    : article.language === 'ar'
    ? 'arabic-font'
    : 'english-font';

  return (
    <article className={`container mx-auto px-4 pt-28 max-w-6xl ${fontClass}`}>
      {/* سائیڈ بار کے ساتھ ڈیزائن */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* مین کونٹینٹ - 75% */}
        <div className="lg:w-3/4">
          {/* باقی آرٹیکل کا کوڈ وہی رہے گا */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
            
            {/* تھمبنل */}
            {article.thumbnail && (
              <div className="relative h-96 overflow-hidden">
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-6 right-6 bg-green-600/90 text-white px-4 py-2 rounded-full font-bold">
                  {article.category || 'عمومی'}
                </div>
              </div>
            )}

            <div className="p-8">
              {/* زبان منتقلی */}
              <div className="mb-8 bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-green-800 text-lg mb-2">زبان تبدیل کریں</h3>
                    <p className="text-gray-600 text-sm">اس آرٹیکل کو اپنی مرضی کی زبان میں پڑھیں</p>
                  </div>
                  <div id="google_translate_element" className="min-w-[200px]"></div>
                </div>
              </div>

              {/* ٹائٹل اور میٹا ڈیٹا */}
              <header className="mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-green-800 mb-6 leading-tight">
                  {article.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-gray-700 border-b border-green-200 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700">✍️</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">تحریر</p>
                      <p className="font-bold text-green-700">{article.author || 'ایڈمن'}</p>
                    </div>
                  </div>
                  
                  <div className="h-6 w-px bg-gray-300"></div>
                  
                  <div>
                    <p className="text-sm text-gray-500">تاریخ اشاعت</p>
                    <p className="font-bold">
                      {new Date(article.createdAt).toLocaleDateString('ur-PK', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  
                  <div className="h-6 w-px bg-gray-300"></div>
                  
                  <div>
                    <p className="text-sm text-gray-500">منفرد مشاہدات</p>
                    <p className="font-bold text-green-700 text-xl flex items-center gap-2">
                      <span className="text-2xl">👁️</span>
                      {article.uniqueViews || article.views || 0}
                    </p>
                  </div>
                </div>
              </header>

              {/* مواد */}
              <section
                className="mb-12 text-lg leading-9 text-justify prose prose-lg max-w-none
                           prose-headings:font-bold prose-headings:text-green-800 prose-headings:mt-10 prose-headings:mb-6
                           prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                           prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                           prose-blockquote:border-r-4 prose-blockquote:border-green-500 prose-blockquote:pr-6 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-green-50 prose-blockquote:py-4 prose-blockquote:my-8
                           prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                           prose-ul:pr-6 prose-ul:my-6
                           prose-ol:pr-6 prose-ol:my-6"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* ٹیگز */}
              {article.tags?.length > 0 && (
                <section className="mb-12 pt-8 border-t border-green-200">
                  <h3 className="text-2xl font-bold text-green-800 mb-6">🏷️ موضوعات</h3>
                  <div className="flex flex-wrap gap-3">
                    {article.tags.map((tag: string) => (
                      <a
                        key={tag}
                        href={`/articles?tag=${tag}`}
                        className="bg-green-100 text-green-700 hover:bg-green-200 px-5 py-2 rounded-full font-medium transition-colors border border-green-200"
                      >
                        #{tag}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* شیئرنگ */}
              <section className="pt-8 border-t border-green-200">
                <h3 className="text-2xl font-bold text-green-800 mb-6">🤝 شیئر کریں</h3>
                <div className="flex flex-wrap gap-4">
                  {/* فیس بک شیئر */}
                  <button 
                    onClick={() => shareOnFacebook(currentUrl, article.title)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                    فیس بک
                  </button>
                  
                  {/* واٹس ایپ شیئر */}
                  <button 
                    onClick={() => shareOnWhatsApp(currentUrl, article.title)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold transition-all hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.677-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" />
                    </svg>
                    واٹس ایپ
                  </button>
                  
                  {/* ٹویٹر شیئر */}
                  <button 
                    onClick={() => shareOnTwitter(currentUrl, article.title)}
                    className="flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    ٹویٹر
                  </button>
                  
                  {/* لنک کاپی */}
                  <button 
                    onClick={() => copyToClipboard(currentUrl)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-bold transition-all hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    لنک کاپی
                  </button>
                  
                  {/* ای میل شیئر */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`${article.title}\n\nپڑھنے کے لیے کلک کریں: ${currentUrl}`)}`}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-bold transition-all hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    ای میل
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* سائیڈ بار - 25% */}
        <div className="lg:w-1/4">
          <div className="space-y-8">
            {/* مقبول ترین آرٹیکلز */}
            
          </div>
        </div>
      </div>
    </article>
  );
}