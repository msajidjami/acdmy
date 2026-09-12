'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Play, PhoneOff, RotateCcw, Loader2, CheckCircle2, AlertCircle,
  Clock, Video, Pencil, Maximize2, Minimize2, Copy, Check,
  Wifi, Radio, User, BookOpen, Sparkles, BookMarked,
} from 'lucide-react';

/* ============================================================ */
/* SAFE DYNAMIC IMPORTS                                          */
/* ============================================================ */

const AdvancedWhiteboard = dynamic(() => import('./AdvancedWhiteboard'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-white/80 text-sm">Loading whiteboard…</div>
    </div>
  ),
});

const PageLoggerModal = dynamic(() => import('./PageLoggerModal'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-white/80 text-sm">Loading page logger…</div>
    </div>
  ),
});

/* ============================================================ */
/* ZOOM SDK LOADER                                              */
/* ============================================================ */

const ZOOM_VERSION = '6.2.0';

function loadScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Zoom SDK can only be loaded in the browser.'));
      return;
    }

    const existing = document.getElementById(id) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load: ${src}`)),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = false;

    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));

    document.head.appendChild(script);
  });
}

async function loadZoomEmbeddedSDK(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Zoom SDK can only be loaded in the browser.');
  }

  if (
    (window as any).ZoomMtgEmbedded &&
    typeof (window as any).ZoomMtgEmbedded.createClient === 'function'
  ) {
    return (window as any).ZoomMtgEmbedded;
  }

  const base = `https://source.zoom.us/${ZOOM_VERSION}`;

  await loadScript('zoom-react', `${base}/lib/vendor/react.min.js`);
  await loadScript('zoom-react-dom', `${base}/lib/vendor/react-dom.min.js`);
  await loadScript('zoom-redux', `${base}/lib/vendor/redux.min.js`);
  await loadScript('zoom-redux-thunk', `${base}/lib/vendor/redux-thunk.min.js`);
  await loadScript('zoom-lodash', `${base}/lib/vendor/lodash.min.js`);
  await loadScript(
    'zoom-meeting-embedded-sdk',
    `${base}/zoom-meeting-embedded-${ZOOM_VERSION}.min.js`
  );

  await new Promise((r) => window.setTimeout(r, 100));

  if (
    !(window as any).ZoomMtgEmbedded ||
    typeof (window as any).ZoomMtgEmbedded.createClient !== 'function'
  ) {
    throw new Error('Zoom Embedded SDK loaded, but ZoomMtgEmbedded was not found.');
  }

  return (window as any).ZoomMtgEmbedded;
}

async function leaveZoomClient(client: any): Promise<void> {
  if (!client) return;
  try {
    if (typeof client.leaveMeeting === 'function') {
      await client.leaveMeeting();
      return;
    }
    if (typeof client.leave === 'function') {
      await client.leave();
    }
  } catch (error) {
    console.warn('Zoom leave error:', error);
  }
}

/* ============================================================ */
/* PROPS                                                        */
/* ============================================================ */

type Props = {
  assignmentId: string;
  meetingNumber: string;
  password: string;
  teacherName: string;
  teacherEmail: string;
  courseName: string;
  studentName: string;
  courseId?: string;
  totalPages?: number;
  pagesCompletedSoFar?: number;
};

/* ============================================================ */
/* MAIN COMPONENT                                               */
/* ============================================================ */

export default function TeacherZoomClassroom({
  assignmentId,
  meetingNumber,
  password,
  teacherName,
  teacherEmail,
  courseName,
  studentName,
  courseId,
  totalPages = 0,
  pagesCompletedSoFar = 0,
}: Props) {
  const meetingRootRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'started' | 'error'
  >('idle');
  const [message, setMessage] = useState(
    'Click Start Class to open the classroom.'
  );
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState('00:00');
  const [copiedMeeting, setCopiedMeeting] = useState(false);
  const [pagesDone, setPagesDone] = useState<number>(pagesCompletedSoFar);
  const [showPageLogger, setShowPageLogger] = useState(false);

  /* Sync pagesDone when parent updates */
  useEffect(() => {
    setPagesDone(pagesCompletedSoFar);
  }, [pagesCompletedSoFar]);

  const hasBook = totalPages > 0 && Boolean(courseId);

  /* ------------------ Mount / Unmount ------------------ */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void leaveZoomClient(clientRef.current);
      clientRef.current = null;
      startingRef.current = false;
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  /* ------------------ Session Timer ------------------ */

  useEffect(() => {
    if (status !== 'started' || !sessionStart) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - sessionStart) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        h > 0
          ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [status, sessionStart]);

  /* ------------------ Fullscreen ------------------ */

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el || typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* ------------------ Start Class ------------------ */

  const startClass = useCallback(async () => {
    if (startingRef.current) return;

    if (!assignmentId) {
      setStatus('error');
      setMessage('Class assignment ID is missing.');
      return;
    }
    if (!meetingNumber) {
      setStatus('error');
      setMessage('Zoom meeting number is missing.');
      return;
    }
    if (!teacherEmail) {
      setStatus('error');
      setMessage('Teacher email is missing.');
      return;
    }
    if (!meetingRootRef.current) {
      setStatus('error');
      setMessage('Classroom container is not ready. Please try again.');
      return;
    }

    startingRef.current = true;
    setStatus('loading');
    setMessage('Authorizing your teacher Zoom account...');

    try {
      /* STEP 1 — Signature + ZAK */
      const response = await fetch('/api/zoom/meeting-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          assignmentId,
          meetingNumber,
          role: 1,
          userName: teacherName || 'Teacher',
          userEmail: teacherEmail,
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from Zoom server.');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Zoom authorization failed.');
      }
      if (!data?.signature) {
        throw new Error('Zoom signature was not returned.');
      }
      if (!data?.zak) {
        throw new Error(
          'Zoom host authorization token was not returned. Reconnect your Zoom account.'
        );
      }
      if (String(data.meetingNumber) !== String(meetingNumber)) {
        throw new Error('Meeting number mismatch.');
      }

      if (!mountedRef.current) return;

      /* STEP 2 — Load SDK */
      setMessage('Loading Zoom Meeting SDK...');
      const ZoomMtgEmbedded = await loadZoomEmbeddedSDK();
      if (!mountedRef.current) return;

      /* STEP 3 — Create client */
      setMessage('Opening the Zoom classroom...');
      const client = ZoomMtgEmbedded.createClient();
      if (!client) throw new Error('Zoom client could not be created.');

      clientRef.current = client;

      /* STEP 4 — Init */
      await client.init({
        zoomAppRoot: meetingRootRef.current,
        language: 'en-US',
        customize: {
          video: { isResizable: true },
        },
      });

      if (!mountedRef.current) {
        await leaveZoomClient(client);
        return;
      }

      /* STEP 5 — Join */
      setMessage('Connecting you to the Zoom classroom...');

      await client.join({
        signature: data.signature,
        meetingNumber: String(meetingNumber),
        password: password || '',
        userName: data.userName || teacherName || 'Teacher',
        userEmail: data.userEmail || teacherEmail,
        zak: data.zak,
      });

      if (!mountedRef.current) return;

      setStatus('started');
      setMessage('You are connected to the classroom.');
      setSessionStart(Date.now());
      setElapsed('00:00');
    } catch (error) {
      console.error('Teacher Zoom classroom error:', error);
      if (!mountedRef.current) return;

      let errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to start the Zoom classroom.';

      const lower = errorMessage.toLowerCase();
      if (lower.includes('meeting has not started')) {
        errorMessage =
          'The Zoom meeting has not started yet. Make sure your Zoom account is authorized as Host.';
      } else if (lower.includes('signature')) {
        errorMessage = 'Zoom authorization failed. Check the signature API.';
      } else if (lower.includes('zak')) {
        errorMessage =
          'Zoom Host authorization failed. A valid Host ZAK is required.';
      } else if (lower.includes('invalid') && lower.includes('meeting')) {
        errorMessage = 'The Zoom Meeting ID is invalid or no longer exists.';
      } else if (
        lower.includes('network') ||
        lower.includes('failed to fetch')
      ) {
        errorMessage =
          'Could not connect to Zoom. Please check your internet connection.';
      }

      setStatus('error');
      setMessage(errorMessage);
      await leaveZoomClient(clientRef.current);
      clientRef.current = null;
    } finally {
      startingRef.current = false;
    }
  }, [assignmentId, meetingNumber, teacherEmail, teacherName, password]);

  /* ------------------ Leave ------------------ */

  const leaveClass = useCallback(async () => {
    await leaveZoomClient(clientRef.current);
    clientRef.current = null;
    startingRef.current = false;
    if (!mountedRef.current) return;

    setStatus('idle');
    setSessionStart(null);
    setElapsed('00:00');
    setMessage('You have left the classroom. Click Start Class to join again.');

    if (hasBook && pagesDone < totalPages) {
      setShowPageLogger(true);
    }
  }, [hasBook, pagesDone, totalPages]);

  /* ------------------ Retry ------------------ */

  const retryClass = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus('idle');
    setMessage('Click Start Class to open the classroom.');
  }, []);

  /* ------------------ Copy Meeting ------------------ */

  const copyMeeting = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(meetingNumber);
      setCopiedMeeting(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setCopiedMeeting(false);
      }, 1800);
    } catch {
      /* ignore */
    }
  }, [meetingNumber]);

  /* ------------------ Page Logger ------------------ */

  const openPageLogger = useCallback(() => {
    if (!hasBook) return;
    setShowPageLogger(true);
  }, [hasBook]);

  const closePageLogger = useCallback(() => setShowPageLogger(false), []);
  const closeWhiteboard = useCallback(() => setShowWhiteboard(false), []);

  const handlePagesSaved = useCallback((newCompleted: number) => {
    setPagesDone(newCompleted);
  }, []);

  /* ------------------ Progress % ------------------ */

  const bookPercent =
    totalPages > 0
      ? Math.min(100, Math.round((pagesDone / totalPages) * 100))
      : 0;

  /* ============================================================ */
  /* RENDER                                                       */
  /* ============================================================ */

  return (
    <>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border border-slate-800"
      >
        {/* ============================================ */}
        {/* TOP TOOLBAR                                   */}
        {/* ============================================ */}

        <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <StatusBadge status={status} />

              {status === 'started' && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-mono font-semibold">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  {elapsed}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={copyMeeting}
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold transition"
                title="Copy meeting number"
              >
                {copiedMeeting ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="font-mono">{meetingNumber}</span>
              </button>

              {hasBook && (
                <button
                  type="button"
                  onClick={openPageLogger}
                  className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 hover:text-emerald-100 text-xs font-semibold transition"
                  title="Log pages covered in this class"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Log Pages</span>
                  <span className="font-mono">
                    {pagesDone}/{totalPages}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowWhiteboard(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition"
                title="Open whiteboard"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>

              <div className="hidden sm:block h-6 w-px bg-white/10 mx-1" />

              {status !== 'started' && (
                <button
                  type="button"
                  onClick={startClass}
                  disabled={status === 'loading'}
                  className="inline-flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Starting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>Start</span>
                    </>
                  )}
                </button>
              )}

              {status === 'started' && (
                <button
                  type="button"
                  onClick={leaveClass}
                  className="inline-flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/25 transition-all active:scale-95"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Leave</span>
                </button>
              )}

              {status === 'error' && (
                <button
                  type="button"
                  onClick={retryClass}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Retry</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 sm:px-5 pb-3 text-xs text-white/50 overflow-x-auto whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-white/80 font-semibold truncate max-w-[140px]">
                {courseName || 'Online Class'}
              </span>
            </span>
            <span className="opacity-30">·</span>
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">{studentName}</span>
            </span>
            <span className="opacity-30">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Host: {teacherName}</span>
            </span>

            {hasBook && (
              <>
                <span className="opacity-30">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <BookMarked className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono font-semibold text-emerald-300">
                    {pagesDone}/{totalPages}
                  </span>
                  <span className="text-emerald-400/70">({bookPercent}%)</span>
                </span>
              </>
            )}

            {status === 'started' && (
              <>
                <span className="opacity-30 sm:hidden">·</span>
                <span className="inline-flex items-center gap-1.5 sm:hidden">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-mono font-semibold">
                    {elapsed}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* BOOK PROGRESS BAR (in-class)                  */}
        {/* ============================================ */}

        {hasBook && status === 'started' && (
          <div className="px-4 sm:px-5 py-3 border-b border-white/10 bg-emerald-500/5">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-200">
                <BookMarked className="h-3.5 w-3.5" />
                Book Progress
              </span>
              <span className="font-mono font-bold text-emerald-100">
                {pagesDone} / {totalPages} pages · {bookPercent}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
                style={{ width: `${bookPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* STATUS MESSAGE                                */}
        {/* ============================================ */}

        {status !== 'started' && (
          <div
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 text-xs sm:text-sm border-b ${
              status === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                : status === 'loading'
                ? 'bg-sky-500/10 border-sky-500/20 text-sky-200'
                : 'bg-white/5 border-white/10 text-white/60'
            }`}
          >
            {status === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : status === 'loading' ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Radio className="h-4 w-4 shrink-0 text-emerald-400" />
            )}
            <span className="leading-relaxed">{message}</span>
          </div>
        )}

        {/* ============================================ */}
        {/* REACT OVERLAYS (idle / loading)               */}
        {/* Alag div — Zoom se koi taalluq nahi          */}
        {/* ============================================ */}

        {status !== 'started' && (
          <div className="relative min-h-[calc(100vh-260px)] sm:min-h-[600px] w-full bg-slate-950">
            {status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                  <div className="relative mx-auto h-20 w-20 mb-5">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 blur-2xl opacity-50 animate-pulse" />
                    <div className="relative h-full w-full rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-purple-500/40">
                      <Video className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    Ready to start teaching
                  </h3>
                  <p className="mt-2 text-sm text-white/50 leading-relaxed">
                    Click{' '}
                    <span className="text-emerald-400 font-semibold">Start</span>{' '}
                    to launch the Zoom classroom. All participants will join
                    automatically.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                      <Wifi className="h-3 w-3 text-emerald-400" />
                      HD Video
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                      <Pencil className="h-3 w-3 text-sky-400" />
                      Whiteboard
                    </span>
                    {hasBook && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                        <BookMarked className="h-3 w-3 text-fuchsia-400" />
                        Book: {totalPages} pages
                      </span>
                    )}
                  </div>

                  {hasBook && (
                    <button
                      type="button"
                      onClick={openPageLogger}
                      className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-xs font-bold transition"
                    >
                      <BookMarked className="h-3.5 w-3.5" />
                      Log Pages Covered
                    </button>
                  )}
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm z-10">
                <div className="text-center">
                  <div className="relative mx-auto h-14 w-14 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-white/90">
                    {message}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* ZOOM SDK ROOT — ISOLATED                      */}
        {/* Hamesha mounted, React iske andar kabhi      */}
        {/* nahi jaayega → removeChild crash khatam      */}
        {/* ============================================ */}

        <div
          ref={meetingRootRef}
          className={`relative min-h-[calc(100vh-260px)] sm:min-h-[600px] w-full bg-slate-950 ${
            status === 'started' ? 'block' : 'hidden'
          }`}
          suppressHydrationWarning
        />

        {/* ============================================ */}
        {/* BOTTOM BAR (Running)                          */}
        {/* ============================================ */}

        {status === 'started' && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs text-white/50 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="font-semibold text-emerald-300">Live</span>
              <span className="hidden sm:inline opacity-60">
                · Keep this tab open while teaching
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasBook && (
                <button
                  type="button"
                  onClick={openPageLogger}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-100 text-xs font-semibold transition"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Log Pages</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowWhiteboard(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Whiteboard</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* ADVANCED WHITEBOARD                           */}
      {/* ============================================ */}

      {showWhiteboard && <AdvancedWhiteboard onClose={closeWhiteboard} />}

      {/* ============================================ */}
      {/* PAGE LOGGER MODAL                             */}
      {/* ============================================ */}

      {showPageLogger && hasBook && (
        <PageLoggerModal
          assignmentId={assignmentId}
          courseName={courseName}
          totalPages={totalPages}
          pagesCompletedSoFar={pagesDone}
          onClose={closePageLogger}
          onSaved={handlePagesSaved}
        />
      )}
    </>
  );
}

/* ============================================================ */
/* STATUS BADGE                                                 */
/* ============================================================ */

function StatusBadge({ status }: { status: string }) {
  const meta: Record<
    string,
    {
      label: string;
      classes: string;
      dot: string;
      Icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    idle: {
      label: 'Idle',
      classes: 'bg-white/5 border-white/10 text-white/60',
      dot: 'bg-slate-400',
      Icon: Radio,
    },
    loading: {
      label: 'Connecting',
      classes: 'bg-sky-500/10 border-sky-500/20 text-sky-200',
      dot: 'bg-sky-400',
      Icon: Loader2,
    },
    started: {
      label: 'Live',
      classes: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200',
      dot: 'bg-emerald-400',
      Icon: CheckCircle2,
    },
    error: {
      label: 'Error',
      classes: 'bg-rose-500/10 border-rose-500/20 text-rose-200',
      dot: 'bg-rose-400',
      Icon: AlertCircle,
    },
  };

  const m = meta[status] || meta.idle;
  const Icon = m.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${m.classes}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {status === 'started' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${m.dot} ${
            status === 'started' ? 'animate-pulse' : ''
          }`}
        />
      </span>
      {status === 'loading' && <Icon className="h-3 w-3 animate-spin" />}
      {m.label}
    </span>
  );
}