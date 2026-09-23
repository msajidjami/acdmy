'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, ShieldCheck } from 'lucide-react';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<'en' | 'ur' | 'ar'>('en');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');

  // 🔽 Load article
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/articles/${slug}`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load article');
        }

        const a = data.data;
        setTitle(a.title || '');
        setContent(a.content || '');
        setLanguage(a.language || 'en');
        setCategory(a.category || 'General');
        setTags((a.tags || []).join(', '));
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load');
        router.push('/owner/articles');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (content.trim().length < 300) {
      toast.error('Content must be at least 300 characters');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: 'PUT',
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

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Update failed');
      }

      toast.success('Article updated successfully!');

      setTimeout(() => {
        router.push('/owner/articles');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

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
            Edit Article
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Changes will be re-checked by the AI system
          </p>
        </div>
      </div>

      <form
        onSubmit={handleUpdate}
        className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-5 sm:p-8 space-y-5">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 leading-relaxed">
              <strong>Note:</strong> Editing a published article may send it
              back for moderation review.
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
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm"
            />
          </div>

          {/* Language + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Language
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
              required
              rows={16}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm leading-relaxed resize-y"
              dir={language === 'ur' || language === 'ar' ? 'rtl' : 'ltr'}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              {content.length} characters
              {content.length < 300 && (
                <span className="text-rose-500"> (minimum 300 required)</span>
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
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