
'use client';

import { useState } from 'react';
import {
  DevicePhoneMobileIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function DownloadPage() {
  const [logoError, setLogoError] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-xl">

        {/* Logo and Heading */}
        <header className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-emerald-100 bg-white p-3 shadow-xl shadow-emerald-900/10">
            {!logoError ? (
              <img
                src="/logo.png"
                alt="ILMORA786 Official Logo"
                className="h-full w-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-2xl font-extrabold text-white"
                aria-label="ILMORA786"
              >
                I786
              </div>
            )}
          </div>

          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
            Learn • Teach • Manage
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            ILMORA786 App
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
            Your complete academy management and online learning platform.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm">
            <ShieldCheckIcon className="h-5 w-5" />
            Official Android App
          </div>
        </header>

        {/* Download Card */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-emerald-950/10">
          <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-6 text-white sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <DevicePhoneMobileIcon className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Android Application
                </h2>
                <p className="mt-1 text-sm text-emerald-50">
                  Version 1.0.0
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              Get ILMORA786 on your phone
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Access your academy, manage students and teachers, communicate,
              and attend online classes from one place.
            </p>

            <a
              href="/download/ilmora786.apk"
              download="ilmora786.apk"
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 active:translate-y-0"
            >
              <ArrowDownTrayIcon className="h-6 w-6" />
              Download ILMORA786 APK
            </a>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <p>
                Download the app from the official ILMORA786 website.
                Verify the file before installing it.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            What can you do with ILMORA786?
          </h2>

          <ul className="space-y-3 text-sm text-slate-700">
            {[
              'Manage academies, teachers and students',
              'Use separate owner, teacher and student dashboards',
              'Conduct online classes and communicate through messages',
              'Manage attendance, schedules and student progress',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span className="leading-6">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Installation Instructions */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            How to install
          </h2>

          <ol className="space-y-4 text-sm text-slate-700">
            {[
              'Tap the Download ILMORA786 APK button.',
              'Wait for the APK file to finish downloading.',
              'Open the downloaded APK on your Android phone.',
              'If Android asks, allow installation from this source in your phone settings.',
              'Review the installation prompt before proceeding.',
              'Open ILMORA786 and sign in to your account.',
            ].map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                  {index + 1}
                </span>
                <span className="pt-1 leading-6">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Android or Google Play Protect may warn about apps installed
              outside Google Play. Verify the app and its source before
              deciding whether to proceed.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center">
          {!logoError && (
            <img
              src="/logo.png"
              alt="ILMORA786"
              className="mx-auto mb-2 h-9 w-9 object-contain"
              onError={() => setLogoError(true)}
            />
          )}

          <p className="font-bold text-slate-800">ILMORA786</p>

          <p className="mt-2 text-xs text-slate-500">
            Learn better. Teach smarter. Manage everything.
          </p>

          <a
            href="https://www.quranandislamic.com/"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
          >
            Visit Official Website
          </a>
        </footer>
      </div>
    </main>
  );
}
