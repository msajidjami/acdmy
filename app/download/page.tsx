import {
  DevicePhoneMobileIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Download ILMORA786 App',
  description: 'Download the official ILMORA786 Android app.',
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-xl shadow-emerald-500/30 mb-6">
            <DevicePhoneMobileIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            ILMORA786 App
          </h1>
          <p className="text-slate-600 mt-3">
            Download the Android app for the best experience
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
            <h2 className="text-lg font-bold">Android APK</h2>
            <p className="text-sm opacity-90">Version 1.0.0</p>
          </div>

          <div className="p-6 sm:p-8">
            <a
              href="https://github.com/msajidjami/acdmy/releases/download/v1.0.0/app-release.apk"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all text-lg"
            >
              <ArrowDownTrayIcon className="h-6 w-6" />
              Download APK
            </a>

            <p className="text-xs text-slate-500 text-center mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
              Safe &amp; verified by ILMORA786
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">How to install</h3>
          <ol className="space-y-3 text-sm text-slate-700">
            <li>1. Tap the Download button above</li>
            <li>2. Open the downloaded APK file</li>
            <li>3. Allow &quot;Install from unknown sources&quot; if asked</li>
            <li>4. Tap Install and wait</li>
            <li>5. Open ILMORA786 and sign in</li>
          </ol>
        </div>
      </div>
    </div>
  );
}