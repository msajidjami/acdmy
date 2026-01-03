// app/articles/[id]/page.tsx
'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { use } from 'react';

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

export default function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      const data = await getArticle(id);
      setArticle(data);
      setLoading(false);
    };
    fetchArticle();

    // گوگل ٹرانسلیٹ سکرپٹ لوڈ
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);

    // ٹرانسلیٹ انیشلائزیشن
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,ur,ar,hi,fr,es,de,tr,id',
        layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      }, 'google_translate_element');
    };

    // پچھلا ٹرانسلیٹ ہٹا دیں تاکہ اصل زبان میں لوڈ ہو
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-2xl font-medium text-gray-700">لوڈ ہو رہا ہے...</div>;
  }

  if (!article) notFound();

  // فونٹ کلاس کا فیصلہ
  const fontClass = article.language === 'ur'
    ? 'urdu-font'
    : article.language === 'ar'
    ? 'arabic-font'
    : 'english-font';

  return (
    <article className={`container mx-auto p-6 md:p-12 max-w-4xl ${fontClass}`}>
      {/* خوبصورت چھوٹا ٹرانسلیٹ ڈراپ ڈاؤن */}
      <div className="mb-10 not-prose">
        <div className="max-w-xs mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-green-200 hover:shadow-xl transition-shadow">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-3 px-6 font-bold text-lg rounded-t-2xl flex items-center justify-center gap-3">
            <span className="text-2xl">🌍</span>
            زبان تبدیل کریں
          </div>
          <div className="p-4 bg-gradient-to-b from-gray-50 to-gray-100 rounded-b-2xl">
            <div id="google_translate_element" className="text-center" />
          </div>
        </div>
      </div>

      {/* تھمبنل */}
      {article.thumbnail && (
        <div className="mb-10 not-prose text-center">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full max-h-96 object-cover rounded-3xl shadow-2xl"
          />
        </div>
      )}

      {/* کیٹگری اور ٹائٹل */}
      <header className="mb-12 not-prose text-center">
        <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
          {article.category || 'عمومی'}
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-800 mb-6 leading-tight">
          {article.title}
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          تحریر: <span className="font-bold text-green-700">{article.author || 'ایڈمن'}</span>
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 text-gray-600">
          <time className="text-lg">
            {new Date(article.createdAt).toLocaleDateString('ur-PK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span className="text-lg font-bold text-green-700">
            {article.views} بار پڑھا گیا
          </span>
        </div>
      </header>

      {/* مواد */}
      <section
        className="mb-16 text-lg leading-9 text-justify prose prose-lg max-w-none
                   prose-headings:font-bold prose-headings:text-green-800
                   prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                   prose-blockquote:border-l-4 prose-blockquote:border-green-600 prose-blockquote:pl-6 prose-blockquote:italic"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* ٹیگز */}
      {article.tags?.length > 0 && (
        <section className="mb-12 not-prose">
          <h3 className="text-2xl font-bold text-green-800 mb-6 text-center">ٹیگز</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-medium shadow hover:shadow-md transition"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* مفید لنکس */}
      {article.links?.length > 0 && (
        <section className="mb-12 not-prose">
          <h3 className="text-2xl font-bold text-green-800 mb-8 text-center">مفید لنکس</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {article.links.map((link: string, index: number) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 hover:shadow-xl transition-all group"
              >
                <span className="text-blue-800 font-bold text-lg">لنک {index + 1}</span>
                <span className="text-3xl text-blue-600 group-hover:translate-x-2 transition-transform">↗</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}