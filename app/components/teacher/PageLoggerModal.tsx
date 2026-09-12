'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  BookOpen,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Info,
  Sparkles,
  BookMarked,
  TrendingUp,
} from 'lucide-react';

/* ============================================================ */
/* PROPS                                                        */
/* ============================================================ */

type Props = {
  assignmentId: string;
  courseName: string;
  totalPages: number;
  pagesCompletedSoFar: number;
  onClose: () => void;
  onSaved?: (newCompleted: number) => void;
};

/* ============================================================ */
/* MAIN COMPONENT                                               */
/* ============================================================ */

export default function PageLoggerModal({
  assignmentId,
  courseName,
  totalPages,
  pagesCompletedSoFar,
  onClose,
  onSaved,
}: Props) {
  const remaining = Math.max(0, totalPages - pagesCompletedSoFar);

  const [pages, setPages] = useState<number>(
    remaining > 0 ? Math.min(5, remaining) : 5
  );
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  /* ------------------ Escape key ------------------ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  /* ------------------ Body scroll lock ------------------ */

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ------------------ Save ------------------ */

  const handleSave = async () => {
    if (pages <= 0) {
      toast.error('Please enter at least 1 page');
      return;
    }
    if (totalPages > 0 && pages > remaining) {
      toast.error(`Only ${remaining} pages remaining`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/teacher/course-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assignmentId,
          pagesCovered: pages,
          note: note.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to save progress');
      }

      toast.success(`Saved ${pages} page${pages > 1 ? 's' : ''}`);
      onSaved?.(data.progress?.pagesCompleted ?? pagesCompletedSoFar + pages);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  /* ------------------ Preview ------------------ */

  const newCompleted = pagesCompletedSoFar + pages;
  const newPercent =
    totalPages > 0 ? Math.round((newCompleted / totalPages) * 100) : 0;
  const currentPercent =
    totalPages > 0
      ? Math.round((pagesCompletedSoFar / totalPages) * 100)
      : 0;

  const isCompleted = totalPages > 0 && newCompleted >= totalPages;

  /* ============================================================ */
  /* RENDER                                                       */
  /* ============================================================ */

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top gradient */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* ============================================ */}
        {/* HEADER                                        */}
        {/* ============================================ */}

        <div className="p-5 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <BookMarked className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900">
                Log pages covered
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {courseName}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* BODY                                          */}
        {/* ============================================ */}

        <div className="p-5 space-y-5">
          {/* Book progress info */}
          {totalPages > 0 && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500 font-medium">
                  Book progress
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {pagesCompletedSoFar} / {totalPages}
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, currentPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-slate-400">
                  {currentPercent}% complete
                </p>
                <p className="text-[10px] text-slate-400">
                  {remaining} page{remaining !== 1 ? 's' : ''} remaining
                </p>
              </div>
            </div>
          )}

          {/* Pages counter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pages covered today
            </label>

            <div className="mt-2 flex items-center gap-3">
              {/* Minus */}
              <button
                type="button"
                onClick={() => setPages((p) => Math.max(1, p - 1))}
                disabled={pages <= 1 || saving}
                className="shrink-0 h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Decrease pages"
              >
                <Minus className="h-5 w-5" />
              </button>

              {/* Input */}
              <input
                type="number"
                min={1}
                max={remaining > 0 ? remaining : 9999}
                value={pages}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1;
                  setPages(Math.max(1, v));
                }}
                disabled={saving}
                className="flex-1 text-center text-2xl font-bold text-slate-900 rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              {/* Plus */}
              <button
                type="button"
                onClick={() =>
                  setPages((p) =>
                    remaining > 0 ? Math.min(remaining, p + 1) : p + 1
                  )
                }
                disabled={saving || (remaining > 0 && pages >= remaining)}
                className="shrink-0 h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Increase pages"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Quick buttons */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[1, 2, 3, 5, 10, 20].map((n) => {
                if (remaining > 0 && n > remaining) return null;
                const active = pages === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPages(n)}
                    disabled={saving}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      active
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } disabled:opacity-50`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {totalPages > 0 && (
            <div
              className={`rounded-xl border-2 border-dashed p-3 transition-colors ${
                isCompleted
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-emerald-200 bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-[11px] font-bold text-emerald-800">
                      Book will be completed! 🎉
                    </p>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <p className="text-[11px] font-bold text-emerald-800">
                      After saving
                    </p>
                  </>
                )}
              </div>

              <p className="mt-1 text-xs text-emerald-700">
                <span className="font-mono font-bold">
                  {newCompleted}/{totalPages}
                </span>{' '}
                pages · {newPercent}% complete
              </p>

              {/* Progress preview bar */}
              <div className="mt-2 h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, newPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
              disabled={saving}
              placeholder="e.g. Covered Surah Al-Fatiha"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition resize-none disabled:opacity-60"
            />
            <p className="mt-1 text-[10px] text-slate-400 text-right">
              {note.length} / 200
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This will be added to the student&apos;s progress and shown in
              their dashboard and academy graphs.
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* ACTIONS                                       */}
        {/* ============================================ */}

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save Progress
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}