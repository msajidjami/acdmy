'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  FileText,
} from 'lucide-react';

type AiResult = {
  score: number;
  status: 'passed' | 'warning' | 'rejected';
  reasons: string[];
};

export default function NewArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<'en' | 'ur' | 'ar'>('en');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (content.trim().length < 300) {
      toast.error('Content must be at least 300 characters');
      return;
    }

    setSubmitting(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          language,
          category: category.trim() || 'General',
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      // ❌ AI rejected
      if (res.status === 422) {
        setAiResult({
          score: data.aiScore || 0,
          status: 'rejected',
          reasons: data.aiReasons || [],
        });
        toast.error('AI-generated content detected!');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish');
      }

      // ✅ Warning
      if (data.data?.aiStatus === 'warning') {
        setAiResult({
          score: data.data.aiScore || 0,
          status: 'warning',
          reasons: [],
        });
        toast.success('Article submitted for review');
      } else {
        toast.success('Article published successfully!');
      }

      // Redirect
      setTimeout(() => {
        router.push('/owner/articles');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish article');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/owner/articles"
          className="h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Write New Article
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your content will be checked for AI-generated text
          </p>
        </div>
      </div>

      {/* AI Alert */}
      {aiResult?.status === 'rejected' && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-rose-800 text-sm">
                AI-Generated Content Detected
              </p>
              <p className="text-xs text-rose-700 mt-1">
                AI Score: <strong>{aiResult.score}/100</strong> — threshold is
                70. Please rewrite in your own words.
              </p>
              {aiResult.reasons.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {aiResult.reasons.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs text-rose-700 flex items-start gap-1.5"
                    >
                      <span className="text-rose-400">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      {aiResult?.status === 'warning' && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-800 text-sm">
                Submitted for Review
              </p>
              <p className="text-xs text-amber-700 mt-1">
                AI Score: <strong>{aiResult.score}/100</strong>. A moderator
                will review your article before publishing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-5 sm:p-8 space-y-5">
          {/* Info banner */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 leading-relaxed">
              <strong>Original content only.</strong> Our system detects
              AI-generated text and rejects it. Write in your own words with
              personal insights and authentic knowledge.
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title..."
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm"
            />
          </div>

          {/* Language + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Language <span className="text-rose-500">*</span>
              </label>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as 'en' | 'ur' | 'ar')
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm"
              >
                <option value="en">English</option>
                <option value="ur">اردو</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Quran, Hadith, Fiqh"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article here... (minimum 300 characters)"
              required
              rows={16}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm leading-relaxed resize-y"
              dir={language === 'ur' || language === 'ar' ? 'rtl' : 'ltr'}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              {content.length} characters
              {content.length < 300 && (
                <span className="text-rose-500">
                  {' '}
                  (minimum 300 required)
                </span>
              )}
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="quran, tafsir, ramadan"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing & Publishing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Publish Article
              </>
            )}
          </button>

          <Link
            href="/owner/articles"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}