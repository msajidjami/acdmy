// app/components/ArticleCard.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ArticleCardProps {
  article: {
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
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false);
  
  // Safely get article ID
  const articleId = article?._id || article?.id || 'unknown';
  
  // If article is invalid, don't render
  if (!article || !article.title || articleId === 'unknown') {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 animate-pulse">
        <div className="h-48 bg-gray-300"></div>
        <div className="p-6">
          <div className="h-6 bg-gray-300 rounded mb-3"></div>
          <div className="h-4 bg-gray-300 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'تاریخ نامعلوم';
    try {
      return new Date(dateString).toLocaleDateString('ur-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'تاریخ نامعلوم';
    }
  };

  const getLanguageLabel = (lang?: string) => {
    switch (lang) {
      case 'ur': return 'اردو';
      case 'ar': return 'عربی';
      case 'en': return 'انگریزی';
      default: return 'زبان';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-green-100 hover:border-green-300 group">
      {/* Thumbnail */}
      {article.thumbnail && !imgError ? (
        <div className="relative h-48 overflow-hidden">
          <Link href={`/articles/${articleId}`}>
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </Link>
          <div className="absolute top-4 right-4 bg-green-600/90 text-white px-3 py-1 rounded-full text-xs font-bold">
            {article.category || 'عام'}
          </div>
        </div>
      ) : (
        <Link href={`/articles/${articleId}`}>
          <div className="h-48 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center group-hover:from-green-600 group-hover:to-emerald-700 transition-all">
            <div className="text-white text-center px-4">
              <div className="text-3xl mb-2">📖</div>
              <span className="text-lg font-bold line-clamp-2">
                {article.title.substring(0, 40)}...
              </span>
            </div>
          </div>
        </Link>
      )}
      
      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <Link 
            href={`/articles?category=${article.category || 'عام'}`}
            className="text-sm font-semibold text-blue-600 uppercase tracking-wide hover:text-blue-800 transition-colors"
          >
            {article.category || 'عام'}
          </Link>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {getLanguageLabel(article.language)}
          </span>
        </div>
        
        {/* Title */}
        <Link href={`/articles/${articleId}`} className="block mb-3">
          <h3 className="text-xl font-bold text-green-700 hover:text-green-900 transition-colors line-clamp-2 min-h-[56px]">
            {article.title}
          </h3>
        </Link>
        
        {/* Author */}
        <p className="text-gray-600 text-sm mb-3">
          تحریر: 
          <Link 
            href={`/articles?author=${article.author || 'ایڈمن'}`}
            className="font-semibold text-green-700 hover:text-green-900 transition-colors ml-2"
          >
            {article.author || 'ایڈمن'}
          </Link>
        </p>
        
        {/* Excerpt */}
        <p className="text-gray-500 text-sm mb-4 line-clamp-3 min-h-[60px]">
          {article.excerpt || article.content?.substring(0, 120)?.replace(/<[^>]*>/g, '') || 'مزید پڑھنے کے لیے کلک کریں...'}
        </p>
        
        {/* Footer */}
        <div className="flex justify-between items-center text-gray-500 text-sm border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">📅</span>
            <span>{formatDate(article.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600">👁️</span>
            <span>{(article.uniqueViews || article.views || 0).toLocaleString()}</span>
          </div>
        </div>
        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.slice(0, 3).map((tag: string, index: number) => (
              <Link
                key={index}
                href={`/articles?tag=${tag}`}
                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              >
                #{tag}
              </Link>
            ))}
            {article.tags.length > 3 && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}