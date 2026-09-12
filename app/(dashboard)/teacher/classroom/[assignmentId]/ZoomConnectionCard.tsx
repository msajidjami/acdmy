'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [zoom, setZoom] = useState<ZoomStatus | null>(null);
  const [error, setError] = useState('');

  const loadZoomStatus = useCallback(async () => {
    // Cancel previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const requestId = ++requestIdRef.current;

    if (mountedRef.current) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await fetch('/api/zoom/status', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      let data: ZoomStatusResponse | null = null;
      try {
        data = (await response.json()) as ZoomStatusResponse;
      } catch {
        throw new Error('Invalid response from server.');
      }

      // Stale response guard
      if (requestId !== requestIdRef.current) return;
      if (!mountedRef.current) return;

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Unable to retrieve Zoom status.');
      }

      setZoom(data.zoom || null);
      setError('');
    } catch (err: unknown) {
      // Abort ignore — user navigated
      if (err instanceof Error && err.name === 'AbortError') return;
      if (requestId !== requestIdRef.current) return;
      if (!mountedRef.current) return;

      console.error('Zoom status error:', err);
      setZoom(null);
      setError(
        err instanceof Error ? err.message : 'Unable to retrieve Zoom status.'
      );
    } finally {
      if (requestId === requestIdRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadZoomStatus();

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [loadZoomStatus]);

  const connectZoom = useCallback(() => {
    if (connecting) return;
    setConnecting(true);
    setError('');
    // Full-page redirect to OAuth — no fetch, so no cleanup needed
    window.location.href = '/api/zoom/connect';
  }, [connecting]);

  const isConnected = Boolean(zoom?.connected);

  return (
    <div
      dir="ltr"
      className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Zoom Classes</h2>
          <p className="mt-1 text-sm text-gray-500">
            Connect your Zoom account to the academy&apos;s online classroom
            system.
          </p>
        </div>

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
                ? 'bg-gray-400 animate-pulse'
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Zoom User ID</p>
              <p className="mt-1 break-all text-sm font-medium text-gray-800">
                {zoom?.userId || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Zoom Account ID</p>
              <p className="mt-1 break-all text-sm font-medium text-gray-800">
                {zoom?.accountId || '—'}
              </p>
            </div>
          </div>

          {zoom?.tokenExpired && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-800">
              Your Zoom access token has expired. The system will attempt to
              refresh it automatically when you start an online class.
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={connectZoom}
              disabled={connecting}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting ? 'Opening Zoom...' : 'Reconnect Zoom'}
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
              Connect your Zoom account to start hosting online classes
              through the academy system. After granting permission on Zoom,
              you will automatically return to this Settings page.
            </p>
          </div>

          <button
            type="button"
            onClick={connectZoom}
            disabled={connecting}
            className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {connecting ? 'Opening Zoom...' : 'Connect Zoom'}
          </button>
        </div>
      )}
    </div>
  );
}