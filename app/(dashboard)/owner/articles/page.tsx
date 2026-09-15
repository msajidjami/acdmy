import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import {
  FileText,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

import connectDB from '@/app/lib/dbConnect';
import Article from '@/models/Article';
import ApproveButton from './ApproveButton';

export const dynamic = 'force-dynamic';

function fmt(d: Date | string) {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  published: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    label: 'Published',
  },
  pending: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    label: 'Pending Review',
  },
  rejected: {
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    label: 'Rejected',
  },
  draft: {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    label: 'Draft',
  },
};

export default async function MyArticlesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  let userId = '';
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error();
    const decoded = jwt.verify(token, secret) as { userId?: string };
    userId = String(decoded.userId || '');
  } catch {
    redirect('/login');
  }

  if (!userId) redirect('/login');

  await connectDB();

  const articles = await Article.find({ authorId: userId })
    .sort({ createdAt: -1 })
    .select(
      'title slug status aiScore aiStatus views createdAt publishedAt category language'
    )
    .lean();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Articles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your published and pending articles
          </p>
        </div>

        <Link
          href="/owner/articles/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Link>
      </div>

      {/* Empty */}
      {articles.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-50 mb-4">
            <FileText className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No articles yet</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Share your knowledge with the community. Write your first article
            and it will appear on your public academy page.
          </p>
          <Link
            href="/owner/articles/new"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
          >
            <Plus className="h-4 w-4" />
            Write Your First Article
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => {
            const style = STATUS_STYLE[a.status] || STATUS_STYLE.draft;

            return (
              <div
                key={String(a._id)}
                className="rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}
                      >
                        {a.status === 'published' && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        {a.status === 'pending' && (
                          <Clock className="h-3 w-3" />
                        )}
                        {a.status === 'rejected' && (
                          <XCircle className="h-3 w-3" />
                        )}
                        {style.label}
                      </span>

                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        {a.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        •{' '}
                        {a.language === 'ur'
                          ? 'اردو'
                          : a.language === 'ar'
                          ? 'العربية'
                          : 'English'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
                      {a.title}
                    </h3>

                    <div className="mt-2 flex items-center flex-wrap gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {fmt(a.publishedAt || a.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        {a.views || 0} views
                      </span>
                      {a.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          AI Score: {a.aiScore}/100
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ✅ Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {a.status === 'published' && (
                      <Link
                        href={`/blog/${a.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    )}

                    {/* ✅ Approve/Reject for pending */}
                    {a.status === 'pending' && (
                      <ApproveButton slug={a.slug} status={a.status} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}