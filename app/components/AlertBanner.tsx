'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'deleted';
  title: string;
  message: string;
  onDismiss?: () => void;
}

export default function AlertBanner({ type, title, message, onDismiss }: AlertBannerProps) {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✅',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '❌',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️',
    },
    deleted: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      icon: '🗑️',
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div className={`${style.bg} ${style.border} border rounded-xl p-4 mb-4 flex items-start justify-between`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{style.icon}</span>
        <div>
          <h4 className={`font-semibold ${style.text}`}>{title}</h4>
          <p className={`text-sm ${style.text} opacity-90`}>{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/50 rounded-lg transition"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      )}
    </div>
  );
}