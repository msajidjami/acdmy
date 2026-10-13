'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'ilmora_app_banner_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 گھنٹے

/* ✅ ان صفحات پر banner نہ دکھے */
const HIDE_ON =
  /^\/(login|signup|download|admin|teacher|student|owner|user|contacts|settings|forgot-password|reset-password)/;

export default function AppDownloadBanner() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    /* 1) ان صفحات پر نہ دکھائیں */
    if (HIDE_ON.test(pathname)) {
      setShow(false);
      return;
    }

    /* 2) Capacitor (app) میں تو کبھی نہ دکھائیں */
    const isCapacitor =
      typeof window !== 'undefined' &&
      ((window as any).Capacitor?.isNativePlatform?.() === true ||
        (window as any).Capacitor?.getPlatform?.() === 'android' ||
        (window as any).Capacitor?.getPlatform?.() === 'ios');

    if (isCapacitor) {
      setShow(false);
      return;
    }

    /* 3) اگر موبائل پر پہلے سے dismiss کیا ہوا ہے تو نہ دکھائیں */
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const dismissedAt = Number(dismissed);
        if (Date.now() - dismissedAt < DISMISS_DURATION_MS) {
          setShow(false);
          return;
        }
      }
    } catch {}

    /* 4) animation کے ساتھ دکھائیں */
    const timer = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(timer);
  }, [pathname]);

  /* ---------- Dismiss ---------- */
  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-[100]
        transition-transform duration-500 ease-out
        translate-y-0
      `}
    >
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-3">
          {/* Icon */}
          <div className="h-9 w-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
            <DevicePhoneMobileIcon className="h-5 w-5 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-sm font-bold leading-tight truncate">
              ILMORA786 App Install کریں
            </p>
            <p className="text-[10px] sm:text-[11px] opacity-85 leading-tight truncate">
              Fast, notifications, offline access
            </p>
          </div>

          {/* Download button */}
          <Link
            href="/download"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden">APK</span>
          </Link>

          {/* Close */}
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 p-1.5 rounded-full hover:bg-white/20 transition"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}