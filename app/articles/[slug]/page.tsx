// app/articles/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script'; // ✅ Next.js Script import کیا گیا ہے
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import { Metadata } from 'next';
import { Calendar, User, Tag } from 'lucide-react';
import ArticleShareButtons from '@/app/components/ArticleShareButtons';
import ArticleViewCounter from '@/app/components/ArticleViewCounter';
import mongoose from 'mongoose';

// ✅ Disable static caching – always fetch fresh data
export const revalidate = 0;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  let article = await Article.findOne({ slug }).lean();
  if (!article && mongoose.Types.ObjectId.isValid(slug)) {
    article = await Article.findById(slug).lean();
  }
  if (!article) return { title: 'Article Not Found' };

  return {
    title: `${article.title} – Quran & Islamic Academy`,
    description: article.excerpt || article.content?.substring(0, 160),
  };
}

async function getArticle(slug: string) {
  await connectDB();
  let article = await Article.findOne({ slug }).lean();
  if (!article && mongoose.Types.ObjectId.isValid(slug)) {
    article = await Article.findById(slug).lean();
  }
  return article;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const articleUrl = `https://www.quranandislamic.com/articles/${article.slug || article._id}`;

  return (
    <article className="min-h-screen bg-slate-50 pt-28 pb-12">
      
      {/* 🚀 Monetag Ads Integration Starts Here */}
      <Script 
        id="monetag-vignette" 
        src="https://n6wxm.com/vignette.min.js" 
        data-zone="11197980" 
        strategy="afterInteractive" 
      />
      <Script 
        id="monetag-in-page-push" 
        src="https://nap5k.com/tag.min.js" 
        data-zone="11197983" 
        strategy="afterInteractive" 
      />
      {/* 🚀 Monetag Ads Integration Ends Here */}

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 transition mb-6"
        >
          ← Back to Articles
        </Link>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {article.thumbnail && (
            <div className="relative h-80 w-full bg-slate-100">
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <span className="bg-teal-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                  {article.category}
                </span>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 lg:p-10">
            <header className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span className="font-medium text-slate-700">{article.author}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(article.createdAt)}
                </span>
                <ArticleViewCounter
                  articleId={article._id.toString()}
                  initialViews={article.uniqueViews || 0}
                />
              </div>
            </header>

            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-teal-700 prose-blockquote:border-l-4 prose-blockquote:border-teal-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:bg-slate-50 prose-img:rounded-xl prose-ul:list-disc prose-ol:list-decimal"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {article.tags?.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/articles?tag=${encodeURIComponent(tag)}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-sm transition"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200">
              <ArticleShareButtons title={article.title} url={articleUrl} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}