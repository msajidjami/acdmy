'use client';

import { useEffect, useState } from 'react';

type ZoomStatus = {
connected: boolean;
userId?: string;
accountId?: string;
email?: string;
tokenExpired?: boolean;
connectedAt?: string | null;
updatedAt?: string | null;
};

type ZoomStatusResponse = {
success: boolean;
connected: boolean;
zoom?: ZoomStatus | null;
error?: string;
};

export default function ZoomConnectionCard() {
const [loading, setLoading] = useState(true);
const [connecting, setConnecting] = useState(false);
const [zoom, setZoom] = useState<ZoomStatus | null>(null);
const [error, setError] = useState('');

async function loadZoomStatus() {
try {
setLoading(true);
setError('');


  const response = await fetch('/api/zoom/status', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const data: ZoomStatusResponse =
    await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || 'Unable to retrieve Zoom status.'
    );
  }

  setZoom(data.zoom || null);
} catch (error: unknown) {
  console.error('Zoom status error:', error);

  setZoom(null);

  setError(
    error instanceof Error
      ? error.message
      : 'Unable to retrieve Zoom status.'
  );
} finally {
  setLoading(false);
}


}

useEffect(() => {
loadZoomStatus();
}, []);

function connectZoom() {
setConnecting(true);
setError('');


window.location.href = '/api/zoom/connect';


}

const isConnected = Boolean(zoom?.connected);

return ( <div
   dir="ltr"
   className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
 >
{/* Header */} <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"> <div> <h2 className="text-xl font-bold text-gray-900">
Zoom Classes </h2>

```
      <p className="mt-1 text-sm text-gray-500">
        Connect your Zoom account to the academy's
        online classroom system.
      </p>
    </div>

    {/* Connection Status */}
    <div
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
        loading
          ? 'bg-gray-100 text-gray-600'
          : isConnected
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          loading
            ? 'bg-gray-400'
            : isConnected
              ? 'bg-green-500'
              : 'bg-red-500'
        }`}
      />

      {loading
        ? 'Checking...'
        : isConnected
          ? 'Zoom Connected'
          : 'Zoom Not Connected'}
    </div>
  </div>

  {/* Loading */}
  {loading && (
    <div className="mt-6 rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
      Checking your Zoom connection...
    </div>
  )}

  {/* Error */}
  {!loading && error && (
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error}
    </div>
  )}

  {/* Connected */}
  {!loading && !error && isConnected && (
    <div className="mt-6 space-y-4">
      {/* Success Box */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            ✓
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-green-900">
              Zoom Connected Successfully
            </h3>

            {zoom?.email && (
              <p className="mt-1 break-all text-sm text-green-700">
                {zoom.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Information */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* User ID */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            Zoom User ID
          </p>

          <p className="mt-1 break-all text-sm font-medium text-gray-800">
            {zoom?.userId || '—'}
          </p>
        </div>

        {/* Account ID */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            Zoom Account ID
          </p>

          <p className="mt-1 break-all text-sm font-medium text-gray-800">
            {zoom?.accountId || '—'}
          </p>
        </div>
      </div>

      {/* Token Expired Notice */}
      {zoom?.tokenExpired && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
          Your Zoom access token has expired.
          The system will attempt to refresh it automatically
          when you start an online class.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={connectZoom}
          disabled={connecting}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connecting
            ? 'Opening Zoom...'
            : 'Reconnect Zoom'}
        </button>

        <button
          type="button"
          onClick={loadZoomStatus}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh Status
        </button>
      </div>
    </div>
  )}

  {/* Not Connected */}
  {!loading && !error && !isConnected && (
    <div className="mt-6">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="font-semibold text-gray-900">
          Zoom Is Not Connected
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Connect your Zoom account to start hosting
          online classes through the academy system.
          After granting permission on Zoom, you will
          automatically return to this Settings page.
        </p>
      </div>

      <button
        type="button"
        onClick={connectZoom}
        disabled={connecting}
        className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {connecting
          ? 'Opening Zoom...'
          : 'Connect Zoom'}
      </button>
    </div>
  )}
</div>


);
}
