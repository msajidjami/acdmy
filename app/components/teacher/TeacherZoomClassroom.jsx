'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

// ============================================================
// ZOOM VERSION
// ============================================================

const ZOOM_VERSION = '6.2.0';

// ============================================================
// LOAD SCRIPT
// ============================================================

function loadScript(id, src) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(
        new Error(
          'Zoom SDK can only be loaded in the browser.'
        )
      );
      return;
    }

    const existing =
      document.getElementById(id);

    // --------------------------------------------------------
    // Already exists
    // --------------------------------------------------------

    if (existing) {
      const script =
        existing;

      if (
        script.dataset.loaded ===
        'true'
      ) {
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
      document.createElement(
        'script'
      );

    script.id = id;
    script.src = src;

    /*
     * IMPORTANT:
     * Keep scripts in execution order.
     */
    script.async = false;

    script.onload = () => {
      script.dataset.loaded =
        'true';

      resolve();
    };

    script.onerror = () => {
      reject(
        new Error(
          `Failed to load Zoom dependency: ${src}`
        )
      );
    };

    document.head.appendChild(
      script
    );
  });
}

// ============================================================
// LOAD ZOOM EMBEDDED SDK
// ============================================================

async function loadZoomEmbeddedSDK() {
  if (
    typeof window ===
    'undefined'
  ) {
    throw new Error(
      'Zoom SDK can only be loaded in the browser.'
    );
  }

  // ----------------------------------------------------------
  // Already loaded
  // ----------------------------------------------------------

  if (
    window.ZoomMtgEmbedded &&
    typeof window
      .ZoomMtgEmbedded
      .createClient ===
      'function'
  ) {
    return window.ZoomMtgEmbedded;
  }

  const base =
    `https://source.zoom.us/${ZOOM_VERSION}`;

  // ----------------------------------------------------------
  // React
  // ----------------------------------------------------------

  await loadScript(
    'zoom-react',
    `${base}/lib/vendor/react.min.js`
  );

  // ----------------------------------------------------------
  // React DOM
  // ----------------------------------------------------------

  await loadScript(
    'zoom-react-dom',
    `${base}/lib/vendor/react-dom.min.js`
  );

  // ----------------------------------------------------------
  // Redux
  // ----------------------------------------------------------

  await loadScript(
    'zoom-redux',
    `${base}/lib/vendor/redux.min.js`
  );

  // ----------------------------------------------------------
  // Redux Thunk
  // ----------------------------------------------------------

  await loadScript(
    'zoom-redux-thunk',
    `${base}/lib/vendor/redux-thunk.min.js`
  );

  // ----------------------------------------------------------
  // Lodash
  // ----------------------------------------------------------

  await loadScript(
    'zoom-lodash',
    `${base}/lib/vendor/lodash.min.js`
  );

  // ----------------------------------------------------------
  // Zoom Embedded Meeting SDK
  // ----------------------------------------------------------

  await loadScript(
    'zoom-meeting-embedded-sdk',
    `${base}/zoom-meeting-embedded-${ZOOM_VERSION}.min.js`
  );

  // ----------------------------------------------------------
  // Wait for global object
  // ----------------------------------------------------------

  await new Promise((resolve) => {
    window.setTimeout(
      resolve,
      100
    );
  });

  // ----------------------------------------------------------
  // Validate
  // ----------------------------------------------------------

  if (
    !window.ZoomMtgEmbedded ||
    typeof window
      .ZoomMtgEmbedded
      .createClient !==
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
  client
) {
  if (!client) {
    return;
  }

  try {
    /*
     * Different SDK builds can expose
     * different leave methods.
     */

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

export default function TeacherZoomClassroom({
  assignmentId,
  meetingNumber,
  password,
  teacherName,
  teacherEmail,
  courseName,
  studentName,
}) {
  // ==========================================================
  // REFS
  // ==========================================================

  const meetingRootRef =
    useRef(null);

  const clientRef =
    useRef(null);

  const startingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  // ==========================================================
  // STATE
  // ==========================================================

  const [status, setStatus] =
    useState('idle');

  const [message, setMessage] =
    useState(
      'Click Start Class to open the classroom.'
    );

  // ==========================================================
  // MOUNT / UNMOUNT
  // ==========================================================

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      const client =
        clientRef.current;

      void leaveZoomClient(
        client
      );

      clientRef.current =
        null;

      startingRef.current =
        false;
    };
  }, []);

  // ==========================================================
  // START CLASS
  // ==========================================================

  async function startClass() {
    if (
      startingRef.current
    ) {
      return;
    }

    // --------------------------------------------------------
    // Validate assignment
    // --------------------------------------------------------

    if (!assignmentId) {
      setStatus('error');

      setMessage(
        'Class assignment ID is missing.'
      );

      return;
    }

    // --------------------------------------------------------
    // Validate meeting number
    // --------------------------------------------------------

    if (!meetingNumber) {
      setStatus('error');

      setMessage(
        'Zoom meeting number is missing.'
      );

      return;
    }

    // --------------------------------------------------------
    // Validate teacher email
    // --------------------------------------------------------

    if (!teacherEmail) {
      setStatus('error');

      setMessage(
        'Teacher email is missing.'
      );

      return;
    }

    // --------------------------------------------------------
    // Validate container
    // --------------------------------------------------------

    if (
      !meetingRootRef.current
    ) {
      setStatus('error');

      setMessage(
        'Classroom container is not ready. Please try again.'
      );

      return;
    }

    startingRef.current =
      true;

    setStatus('loading');

    setMessage(
      'Authorizing your teacher Zoom account...'
    );

    try {
      // ======================================================
      // STEP 1
      // GET SIGNATURE + ZAK
      // ======================================================

      const response =
        await fetch(
          '/api/zoom/meeting-signature',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            credentials: 'include',

            cache: 'no-store',

            body: JSON.stringify({
              assignmentId,

              meetingNumber,

              /*
               * Teacher = Host
               */
              role: 1,

              userName:
                teacherName ||
                'Teacher',

              userEmail:
                teacherEmail,
            }),
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          'The Zoom authorization server returned an invalid response.'
        );
      }

      // ------------------------------------------------------
      // API error
      // ------------------------------------------------------

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            'Zoom authorization failed. Please reconnect your Zoom account.'
        );
      }

      // ------------------------------------------------------
      // Signature
      // ------------------------------------------------------

      if (!data?.signature) {
        throw new Error(
          'Zoom signature was not returned by the server.'
        );
      }

      // ------------------------------------------------------
      // ZAK
      // ------------------------------------------------------

      if (!data?.zak) {
        throw new Error(
          'Zoom host authorization token was not returned. Reconnect your Zoom account and try again.'
        );
      }

      // ------------------------------------------------------
      // Verify meeting number
      // ------------------------------------------------------

      if (
        String(
          data.meetingNumber
        ) !==
        String(meetingNumber)
      ) {
        throw new Error(
          'The Zoom meeting number returned by the server does not match this class.'
        );
      }

      if (
        !mountedRef.current
      ) {
        return;
      }

      // ======================================================
      // STEP 2
      // LOAD ZOOM SDK FROM CDN
      // ======================================================

      setMessage(
        'Loading Zoom Meeting SDK...'
      );

      /*
       * IMPORTANT:
       *
       * There is NO:
       *
       * import('@zoom/meetingsdk/embedded')
       *
       * here.
       *
       * This prevents Next.js from trying to bundle
       * the Zoom UMD package during SSR/build.
       */

      const ZoomMtgEmbedded =
        await loadZoomEmbeddedSDK();

      if (
        !mountedRef.current
      ) {
        return;
      }

      // ======================================================
      // STEP 3
      // CREATE CLIENT
      // ======================================================

      setMessage(
        'Opening the Zoom classroom...'
      );

      const client =
        ZoomMtgEmbedded.createClient();

      if (!client) {
        throw new Error(
          'Zoom Embedded client could not be created.'
        );
      }

      clientRef.current =
        client;

      // ======================================================
      // STEP 4
      // INITIALIZE
      // ======================================================

      await client.init({
        zoomAppRoot:
          meetingRootRef.current,

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

      // ======================================================
      // STEP 5
      // JOIN
      // ======================================================

      setMessage(
        'Connecting you to the Zoom classroom...'
      );

      const joinOptions = {
        signature:
          data.signature,

        meetingNumber:
          String(meetingNumber),

        password:
          password || '',

        userName:
          data.userName ||
          teacherName ||
          'Teacher',

        userEmail:
          data.userEmail ||
          teacherEmail,

        /*
         * Teacher is Host.
         */
        zak: data.zak,
      };

      console.log(
        'Joining Zoom teacher classroom:',
        {
          assignmentId,

          meetingNumber:

            String(
              meetingNumber
            ),

          role: 1,

          hasSignature:
            Boolean(
              data.signature
            ),

          hasZAK:
            Boolean(
              data.zak
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

      // ======================================================
      // SUCCESS
      // ======================================================

      setStatus(
        'started'
      );

      setMessage(
        'You are connected to the classroom.'
      );

      console.log(
        '================================'
      );

      console.log(
        '✅ Teacher Zoom classroom started'
      );

      console.log(
        'Assignment:',
        assignmentId
      );

      console.log(
        'Meeting:',
        meetingNumber
      );

      console.log(
        'Role: HOST'
      );

      console.log(
        '================================'
      );
    } catch (error) {
      console.error(
        'Teacher Zoom classroom error:',
        error
      );

      if (
        !mountedRef.current
      ) {
        return;
      }

      let errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to start the Zoom classroom.';

      // ------------------------------------------------------
      // Friendly Zoom messages
      // ------------------------------------------------------

      if (
        typeof errorMessage ===
        'string'
      ) {
        const lower =
          errorMessage.toLowerCase();

        if (
          lower.includes(
            'meeting has not started'
          )
        ) {
          errorMessage =
            'The Zoom meeting has not started yet. Please make sure your teacher Zoom account is authorized as the Host and try again.';
        } else if (
          lower.includes(
            'signature'
          )
        ) {
          errorMessage =
            'Zoom authorization failed. Please check the Zoom signature API.';
        } else if (
          lower.includes(
            'zak'
          )
        ) {
          errorMessage =
            'Zoom Host authorization failed. A valid Host ZAK is required for the teacher.';
        } else if (
          lower.includes(
            'invalid'
          ) &&
          lower.includes(
            'meeting'
          )
        ) {
          errorMessage =
            'The Zoom Meeting ID is invalid or this meeting no longer exists.';
        } else if (
          lower.includes(
            'network'
          ) ||
          lower.includes(
            'failed to fetch'
          )
        ) {
          errorMessage =
            'Could not connect to Zoom. Please check your internet connection and try again.';
        }
      }

      setStatus(
        'error'
      );

      setMessage(
        String(errorMessage)
      );

      // ------------------------------------------------------
      // Cleanup broken client
      // ------------------------------------------------------

      await leaveZoomClient(
        clientRef.current
      );

      clientRef.current =
        null;
    } finally {
      startingRef.current =
        false;
    }
  }

  // ==========================================================
  // LEAVE CLASS
  // ==========================================================

  async function leaveClass() {
    const client =
      clientRef.current;

    await leaveZoomClient(
      client
    );

    clientRef.current =
      null;

    startingRef.current =
      false;

    if (
      !mountedRef.current
    ) {
      return;
    }

    setStatus('idle');

    setMessage(
      'You have left the classroom. Click Start Class to join again.'
    );
  }

  // ==========================================================
  // RETRY
  // ==========================================================

  function retryClass() {
    if (
      !mountedRef.current
    ) {
      return;
    }

    setStatus('idle');

    setMessage(
      'Click Start Class to open the classroom.'
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/10">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Teacher Classroom
          </p>

          <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
            {courseName ||
              'Online Class'}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Student:{' '}
            {studentName ||
              'Student'}
          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          {/* Start */}

          {status !==
            'started' && (
            <button
              type="button"
              onClick={
                startClass
              }
              disabled={
                status ===
                'loading'
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status ===
              'loading'
                ? 'Starting...'
                : 'Start Class'}
            </button>
          )}

          {/* Leave */}

          {status ===
            'started' && (
            <button
              type="button"
              onClick={
                leaveClass
              }
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Leave Class
            </button>
          )}

          {/* Retry */}

          {status ===
            'error' && (
            <button
              type="button"
              onClick={
                retryClass
              }
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Try Again
            </button>
          )}

        </div>

      </div>

      {/* ======================================================
          STATUS MESSAGE
      ====================================================== */}

      {status !==
        'started' && (
        <div
          className={`border-b px-4 py-3 text-sm ${
            status ===
            'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : status ===
                  'loading'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {message}
        </div>
      )}

      {/* ======================================================
          ZOOM MEETING SDK CONTAINER
      ====================================================== */}

      <div
        ref={
          meetingRootRef
        }
        className="min-h-[720px] w-full bg-slate-950"
      />

      {/* ======================================================
          RUNNING STATUS
      ====================================================== */}

      {status ===
        'started' && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          The Zoom classroom is running inside your
          academy website. Keep this browser tab open
          while teaching.
        </div>
      )}

    </section>
  );
}