// app/articles/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import { Metadata } from 'next';
import { Eye, Calendar, User, Tag, Share2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface ArticleType {
  _id: string;
  title: string;
  thumbnail?: string;
  category?: string;
  author?: string;
  content: string;
  excerpt: string; // ✅ Added excerpt
  createdAt: string;
  views: number;
  tags: string[];
}

// ─── Metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: 'Article Not Found' };

  return {
    title: `${article.title} – Quran & Islamic Academy`,
    description: article.excerpt || article.content?.substring(0, 160) || 'Read authentic Islamic article.',
    openGraph: {
      title: article.title,
      description: article.excerpt || article.content?.substring(0, 160),
      url: `https://www.quranandislamic.com/articles/${id}`,
      images: article.thumbnail ? [{ url: article.thumbnail }] : [],
      type: 'article',
    },
    alternates: {
      canonical: `https://www.quranandislamic.com/articles/${id}`,
    },
  };
}

// ─── Data Fetching ──────────────────────────────────────────────────────
async function getArticle(id: string): Promise<ArticleType | null> {
  try {
    await connectDB();
    const article = await Article.findById(id).select('-__v').lean();
    if (!article) return null;

    // Create excerpt from content (first 160 characters, strip HTML tags)
    const plainText = article.content?.replace(/<[^>]+>/g, '') || '';
    const excerpt = plainText.substring(0, 160) + (plainText.length > 160 ? '…' : '');

    return {
      _id: article._id.toString(),
      title: article.title,
      thumbnail: article.thumbnail,
      category: article.category || 'General',
      author: article.author || 'Admin',
      content: article.content || '',
      excerpt, // ✅ Now included
      createdAt: article.createdAt?.toISOString() || new Date().toISOString(),
      views: article.views || 0,
      tags: article.tags || [],
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <article className="min-h-screen bg-slate-50 pt-28 pb-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* Back button */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 transition mb-6"
        >
          ← Back to Articles
        </Link>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Thumbnail */}
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
            {/* Title & Meta */}
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
                  <span>{formatDate(article.createdAt)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.views} views</span>
                </span>
              </div>
            </header>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none
                         prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mt-8 prose-headings:mb-4
                         prose-p:text-slate-700 prose-p:leading-relaxed
                         prose-a:text-teal-700 prose-a:no-underline hover:prose-a:underline
                         prose-blockquote:border-l-4 prose-blockquote:border-teal-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:bg-slate-50 prose-blockquote:py-3 prose-blockquote:my-6
                         prose-img:rounded-xl prose-img:shadow-md
                         prose-ul:list-disc prose-ul:pl-6
                         prose-ol:list-decimal prose-ol:pl-6
                         prose-li:mb-2"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/articles?tag=${tag}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-sm transition"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                <Share2 className="w-4 h-4" /> Share:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    const text = article.title;
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
                      '_blank'
                    );
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    const text = article.title;
                    window.open(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
                      '_blank'
                    );
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full transition"
                  aria-label="Share on Twitter"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    const text = article.title;
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(text + ' - ' + url)}`,
                      '_blank'
                    );
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.677-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert('Link copied to clipboard!');
                  }}
                  className="bg-slate-700 hover:bg-slate-800 text-white p-2 rounded-full transition"
                  aria-label="Copy link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related / Recommended (optional) */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">You may also like</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <p className="text-slate-500 col-span-3 text-center">More articles coming soon.</p>
          </div>
        </div>
      </div>
    </article>
  );
}