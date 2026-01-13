// app/components/PopularArticleCard.tsx
'use client';

import Link from 'next/link';

interface Article {
  _id?: string;
  id?: string;
  title: string;
  category?: string;
  uniqueViews?: number;
  views?: number;
}

interface PopularArticleCardProps {
  article: Article;
  rank: number;
}

export default function PopularArticleCard({ article, rank }: PopularArticleCardProps) {
  // Safely get article ID
  const articleId = article?._id || article?.id || 'unknown';
  
  // If article is invalid, don't render
  if (!article || !article.title || articleId === 'unknown') {
    return null;
  }

  // Get rank color
  const getRankColor = () => {
    switch (rank) {
      case 1: return 'from-yellow-500 to-orange-500';
      case 2: return 'from-gray-400 to-gray-600';
      case 3: return 'from-amber-700 to-amber-900';
      default: return 'from-green-500 to-emerald-600';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors border border-transparent hover:border-green-200 group">
      {/* Rank */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${getRankColor()}`}>
        {rank}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/articles/${articleId}`} className="block">
          <h4 className="font-bold text-green-800 group-hover:text-green-900 text-sm line-clamp-2">
            {article.title}
          </h4>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {article.category || 'عام'}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
            <span className="text-green-600">👁️</span>
            {(article.uniqueViews || article.views || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}