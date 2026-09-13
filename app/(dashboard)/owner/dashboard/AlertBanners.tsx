'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type AlertType = 'success' | 'deleted' | 'error' | 'warning';

interface Props {
  type: AlertType;
  title: string;
  message: string;
  /** URL param key to remove on dismiss (e.g. "success", "deleted") */
  paramKey?: string;
  autoDismissMs?: number;
}

const STYLES: Record<
  AlertType,
  {
    wrapper: string;
    icon: string;
    title: string;
    text: string;
    button: string;
  }
> = {
  success: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: 'text-emerald-600',
    title: 'text-emerald-900',
    text: 'text-emerald-700',
    button: 'text-emerald-600 hover:text-emerald-800',
  },
  deleted: {
    wrapper: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: 'text-rose-600',
    title: 'text-rose-900',
    text: 'text-rose-700',
    button: 'text-rose-600 hover:text-rose-800',
  },
  error: {
    wrapper: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: 'text-rose-600',
    title: 'text-rose-900',
    text: 'text-rose-700',
    button: 'text-rose-600 hover:text-rose-800',
  },
  warning: {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    text: 'text-amber-700',
    button: 'text-amber-600 hover:text-amber-800',
  },
};

export default function AlertBanner({
  type,
  title,
  message,
  paramKey,
  autoDismissMs,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const s = STYLES[type];

  const dismiss = () => {
    if (!paramKey) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramKey);
    const q = params.toString();
    router.replace(q ? `?${q}` : '?', { scroll: false });
  };

  // Auto dismiss
  useEffect(() => {
    if (!autoDismissMs || !paramKey) return;
    const t = setTimeout(dismiss, autoDismissMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismissMs, paramKey]);

  const Icon =
    type === 'success'
      ? CheckCircleIcon
      : type === 'deleted'
      ? TrashIcon
      : ExclamationTriangleIcon;

  return (
    <div
      className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${s.wrapper}`}
    >
      <Icon className={`h-6 w-6 shrink-0 mt-0.5 ${s.icon}`} />
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${s.title}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${s.text}`}>{message}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition ${s.button}`}
        aria-label="Dismiss"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}