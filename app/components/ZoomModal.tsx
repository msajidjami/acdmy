'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  XMarkIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

// ============================================================
// TYPES
// ============================================================

type ZoomRole = 'host' | 'participant';

interface ZoomModalProps {
  meetingNumber: string;
  password: string;
  userName: string;
  userEmail: string;
  zoomLink?: string;

  // Teacher = host
  // Student = participant
  role?: ZoomRole;

  onClose: () => void;
}

interface ZoomJoinResponse {
  signature: string;
  zak?: string;
  role?: number;
  userName?: string;
  userEmail?: string;
}

interface ZoomEmbeddedClient {
  init: (options: any) => Promise<any>;

  join: (options: any) => Promise<any>;

  leaveMeeting?: () => Promise<any> | void;

  leave?: () => Promise<any> | void;
}

interface ZoomEmbeddedGlobal {
  createClient: () => ZoomEmbeddedClient;
}

declare global {
  interface Window {
    ZoomMtgEmbedded?: ZoomEmbeddedGlobal;
  }
}

// ============================================================
// ZOOM VERSION
// ============================================================

const ZOOM_VERSION = '6.2.0';

// ============================================================
// LOAD SCRIPT
// ============================================================

function loadScript(
  id: string,
  src: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(
        new Error(
          'Zoom SDK can only be loaded in the browser.'
        )
      );
      return;
    }

    const existing = document.getElementById(id);

    // --------------------------------------------------------
    // Script already exists
    // --------------------------------------------------------

    if (existing) {
      const script =
        existing as HTMLScriptElement;

      if (script.dataset.loaded === 'true') {
        resolve();
        return;
      }

      const handleLoad = () => {
        resolve();
      };

      const handleError = () => {
        reject(
          new Error(
            `Failed to load Zoom dependency: ${src}`
          )
        );
      };

      script.addEventListener(
        'load',
        handleLoad,
        { once: true }
      );

      script.addEventListener(
        'error',
        handleError,
        { once: true }
      );

      return;
    }

    // --------------------------------------------------------
    // Create script
    // --------------------------------------------------------

    const script =
      document.createElement('script');

    script.id = id;
    script.src = src;
    script.async = false;

    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };

    script.onerror = () => {
      reject(
        new Error(
          `Failed to load Zoom dependency: ${src}`
        )
      );
    };

    document.head.appendChild(script);
  });
}

// ============================================================
// LOAD ZOOM EMBEDDED SDK
// ============================================================

async function loadZoomEmbeddedSDK(): Promise<ZoomEmbeddedGlobal> {
  if (typeof window === 'undefined') {
    throw new Error(
      'Zoom SDK can only be loaded in the browser.'
    );
  }

  // ----------------------------------------------------------
  // Already loaded
  // ----------------------------------------------------------

  if (
    window.ZoomMtgEmbedded &&
    typeof window.ZoomMtgEmbedded.createClient ===
      'function'
  ) {
    return window.ZoomMtgEmbedded;
  }

  const base =
    `https://source.zoom.us/${ZOOM_VERSION}`;

  // ----------------------------------------------------------
  // Zoom dependencies
  // ----------------------------------------------------------

  await loadScript(
    'zoom-react',
    `${base}/lib/vendor/react.min.js`
  );

  await loadScript(
    'zoom-react-dom',
    `${base}/lib/vendor/react-dom.min.js`
  );

  await loadScript(
    'zoom-redux',
    `${base}/lib/vendor/redux.min.js`
  );

  await loadScript(
    'zoom-redux-thunk',
    `${base}/lib/vendor/redux-thunk.min.js`
  );

  await loadScript(
    'zoom-lodash',
    `${base}/lib/vendor/lodash.min.js`
  );

  // ----------------------------------------------------------
  // Zoom Embedded SDK
  // ----------------------------------------------------------

  await loadScript(
    'zoom-meeting-embedded-sdk',
    `${base}/zoom-meeting-embedded-${ZOOM_VERSION}.min.js`
  );

  // ----------------------------------------------------------
  // Give browser time to expose global
  // ----------------------------------------------------------

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 100);
  });

  // ----------------------------------------------------------
  // Validate global
  // ----------------------------------------------------------

  if (
    !window.ZoomMtgEmbedded ||
    typeof window.ZoomMtgEmbedded.createClient !==
      'function'
  ) {
    throw new Error(
      'Zoom Embedded SDK loaded, but ZoomMtgEmbedded was not found.'
    );
  }

  return window.ZoomMtgEmbedded;
}

// ============================================================
// LEAVE ZOOM CLIENT SAFELY
// ============================================================

async function leaveZoomClient(
  client: ZoomEmbeddedClient | null
) {
  if (!client) {
    return;
  }

  try {
    if (
      typeof client.leaveMeeting ===
      'function'
    ) {
      await client.leaveMeeting();
      return;
    }

    if (
      typeof client.leave ===
      'function'
    ) {
      await client.leave();
    }
  } catch (error) {
    console.warn(
      'Zoom leave error:',
      error
    );
  }
}

// ============================================================
// COMPONENT
// ============================================================

export default function ZoomModal({
  meetingNumber,
  password,
  userName,
  userEmail,
  zoomLink,
  role = 'participant',
  onClose,
}: ZoomModalProps) {
  // ==========================================================
  // REFS
  // ==========================================================

  const meetingSDKElementRef =
    useRef<HTMLDivElement | null>(null);

  const clientRef =
    useRef<ZoomEmbeddedClient | null>(null);

  const mountedRef =
    useRef(false);

  const startingRef =
    useRef(false);

  // ==========================================================
  // STATE
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // ==========================================================
  // ROLE
  // ==========================================================

  /*
   * Zoom Meeting SDK:
   *
   * 1 = Host
   * 0 = Participant
   */

  const zoomRole =
    role === 'host' ? 1 : 0;

  const isHost =
    role === 'host';

  // ==========================================================
  // GET ZOOM AUTHORIZATION
  // ==========================================================

  const getZoomAuthorization =
    useCallback(
      async (): Promise<ZoomJoinResponse> => {
        const response =
          await fetch(
            '/api/zoom-signature',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              credentials: 'include',

              cache: 'no-store',

              body: JSON.stringify({
                meetingNumber,
                role: zoomRole,
              }),
            }
          );

        let data: any = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        // ----------------------------------------------------
        // API error
        // ----------------------------------------------------

        if (!response.ok) {
          throw new Error(
            data?.error ||
              'Failed to authorize Zoom meeting.'
          );
        }

        // ----------------------------------------------------
        // Signature
        // ----------------------------------------------------

        if (!data?.signature) {
          throw new Error(
            'Zoom signature was not returned by the server.'
          );
        }

        // ----------------------------------------------------
        // Host ZAK
        // ----------------------------------------------------

        if (
          isHost &&
          !data?.zak
        ) {
          throw new Error(
            'Zoom Host authorization failed. The server did not return a Host ZAK.'
          );
        }

        return {
          signature:
            data.signature,

          zak:
            data.zak ||
            undefined,

          role:
            typeof data.role ===
            'number'
              ? data.role
              : zoomRole,

          userName:
            data.userName ||
            undefined,

          userEmail:
            data.userEmail ||
            undefined,
        };
      },
      [
        meetingNumber,
        zoomRole,
        isHost,
      ]
    );

  // ==========================================================
  // INITIALIZE ZOOM
  // ==========================================================

  const initializeZoom =
    useCallback(
      async () => {
        if (
          !mountedRef.current ||
          startingRef.current
        ) {
          return;
        }

        if (
          !meetingSDKElementRef.current
        ) {
          setLoading(false);

          setError(
            'Zoom meeting container was not found.'
          );

          return;
        }

        startingRef.current =
          true;

        try {
          setLoading(true);
          setError(null);

          console.log(
            '================================'
          );

          console.log(
            'Starting Zoom Meeting SDK'
          );

          console.log(
            'Meeting:',
            meetingNumber
          );

          console.log(
            'Role:',
            isHost
              ? 'HOST'
              : 'PARTICIPANT'
          );

          console.log(
            'Zoom SDK role:',
            zoomRole
          );

          console.log(
            '================================'
          );

          // ==================================================
          // 1. LOAD SDK FROM CDN
          // ==================================================

          const ZoomMtgEmbedded =
            await loadZoomEmbeddedSDK();

          if (
            !mountedRef.current
          ) {
            return;
          }

          console.log(
            '✅ Zoom Embedded SDK loaded'
          );

          // ==================================================
          // 2. CREATE CLIENT
          // ==================================================

          const client =
            ZoomMtgEmbedded.createClient();

          if (!client) {
            throw new Error(
              'Zoom Embedded client could not be created.'
            );
          }

          clientRef.current =
            client;

          // ==================================================
          // 3. INITIALIZE CLIENT
          // ==================================================

          await client.init({
            zoomAppRoot:
              meetingSDKElementRef.current,

            language: 'en-US',

            customize: {
              video: {
                isResizable:
                  true,
              },
            },
          });

          if (
            !mountedRef.current
          ) {
            await leaveZoomClient(
              client
            );

            return;
          }

          console.log(
            '✅ Zoom client initialized'
          );

          // ==================================================
          // 4. GET AUTHORIZATION
          // ==================================================

          const authorization =
            await getZoomAuthorization();

          if (
            !mountedRef.current
          ) {
            return;
          }

          console.log(
            'Zoom authorization received:',
            {
              role:
                authorization.role,

              requestedRole:
                zoomRole,

              isHost,

              hasSignature:
                Boolean(
                  authorization.signature
                ),

              hasZAK:
                Boolean(
                  authorization.zak
                ),
            }
          );

          // ==================================================
          // 5. JOIN OPTIONS
          // ==================================================

          const joinOptions: any = {
            signature:
              authorization.signature,

            meetingNumber:
              String(meetingNumber),

            password:
              password || '',

            userName:
              authorization.userName ||
              userName ||
              (isHost
                ? 'Teacher'
                : 'Student'),

            userEmail:
              authorization.userEmail ||
              userEmail ||
              '',
          };

          // --------------------------------------------------
          // Host ZAK only
          // --------------------------------------------------

          if (
            isHost &&
            authorization.zak
          ) {
            joinOptions.zak =
              authorization.zak;
          }

          // ==================================================
          // 6. JOIN
          // ==================================================

          console.log(
            'Joining Zoom meeting:',
            {
              meetingNumber,

              requestedRole:
                zoomRole,

              returnedRole:
                authorization.role,

              isHost,

              hasZAK:
                Boolean(
                  authorization.zak
                ),
            }
          );

          await client.join(
            joinOptions
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          console.log(
            '================================'
          );

          console.log(
            '✅ Zoom meeting joined successfully'
          );

          console.log(
            'Role:',
            isHost
              ? 'HOST'
              : 'PARTICIPANT'
          );

          console.log(
            '================================'
          );

          setLoading(false);
        } catch (err: any) {
          console.error(
            '❌ Zoom initialization error:',
            err
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          let message =
            err?.reason ||
            err?.errorMessage ||
            err?.message ||
            'Unable to start Zoom meeting.';

          if (
            typeof message ===
            'string'
          ) {
            const lower =
              message.toLowerCase();

            if (
              lower.includes(
                'meeting has not started'
              )
            ) {
              message =
                isHost
                  ? 'The meeting has not started yet. Please make sure this Teacher account is authorized as the Host and then try again.'
                  : 'The teacher has not started this class yet. Please wait until the teacher starts the meeting.';
            } else if (
              lower.includes(
                'signature'
              )
            ) {
              message =
                'Zoom authorization failed. Please check the Zoom signature API.';
            } else if (
              lower.includes(
                'zak'
              )
            ) {
              message =
                'Host authorization failed. A valid Zoom Host ZAK is required for the teacher.';
            } else if (
              lower.includes(
                'invalid'
              ) &&
              lower.includes(
                'meeting'
              )
            ) {
              message =
                'The Zoom Meeting ID is invalid or this meeting no longer exists.';
            }
          }

          setLoading(false);
          setError(
            String(message)
          );

          await leaveZoomClient(
            clientRef.current
          );

          clientRef.current =
            null;
        } finally {
          startingRef.current =
            false;
        }
      },
      [
        meetingNumber,
        password,
        userName,
        userEmail,
        getZoomAuthorization,
        isHost,
        zoomRole,
      ]
    );

  // ==========================================================
  // MOUNT
  // ==========================================================

  useEffect(() => {
    mountedRef.current =
      true;

    const timer =
      window.setTimeout(() => {
        initializeZoom();
      }, 100);

    return () => {
      mountedRef.current =
        false;

      window.clearTimeout(
        timer
      );

      void leaveZoomClient(
        clientRef.current
      );

      clientRef.current =
        null;

      startingRef.current =
        false;
    };
  }, [initializeZoom]);

  // ==========================================================
  // ERROR UI
  // ==========================================================

  if (error) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="flex items-center gap-2">

                <VideoCameraIcon className="h-6 w-6 text-red-600" />

                <h3 className="text-xl font-bold text-red-600">
                  Zoom Error
                </h3>

              </div>

              <p className="mt-1 text-sm text-gray-500">
                {isHost
                  ? 'Teacher Host session could not be started.'
                  : 'Student session could not be started.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 transition hover:bg-gray-100"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>

          </div>

          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">

            <p className="break-words text-sm text-red-700">
              {error}
            </p>

          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-3">

            <p className="text-xs text-gray-500">
              Session type
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-800">
              {isHost
                ? 'Teacher — Host'
                : 'Student — Participant'}
            </p>

          </div>

          {zoomLink && (
            <div className="mt-5">

              <a
                href={zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 font-medium text-white transition hover:bg-green-700"
              >
                <VideoCameraIcon className="h-5 w-5" />

                Open in Zoom
              </a>

            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-xl bg-gray-200 py-2.5 font-medium text-gray-800 transition hover:bg-gray-300"
          >
            Close
          </button>

        </div>
      </div>
    );
  }

  // ==========================================================
  // ZOOM UI
  // ==========================================================

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">

      {/* HEADER */}

      <div className="flex h-16 shrink-0 items-center justify-between bg-gray-900 px-5 text-white">

        <div className="flex items-center gap-3">

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              isHost
                ? 'bg-indigo-600'
                : 'bg-green-600'
            }`}
          >
            <VideoCameraIcon className="h-5 w-5" />
          </div>

          <div>

            <h2 className="font-semibold">
              {isHost
                ? 'Live Class — Host'
                : 'Live Class'}
            </h2>

            <p className="text-xs text-gray-400">
              {isHost
                ? 'Teacher Host'
                : 'Student Participant'}
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 transition hover:bg-white/10"
          title="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

      </div>

      {/* ZOOM CONTAINER */}

      <div className="relative min-h-0 flex-1 bg-black">

        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-950">

            <div className="text-center text-white">

              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />

              <p className="mt-4 font-semibold">
                {isHost
                  ? 'Starting Class...'
                  : 'Joining Class...'}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                براہِ کرم انتظار کریں
              </p>

            </div>

          </div>
        )}

        <div
          ref={
            meetingSDKElementRef
          }
          className="h-full w-full"
        />

      </div>

    </div>
  );
}