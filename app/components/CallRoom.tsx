
'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react';

import '@livekit/components-styles';

import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/outline';

type Kind = 'audio' | 'video';

type CallStatus =
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'busy'
  | 'cancelled'
  | 'missed'
  | 'ended'
  | 'failed';

type ScreenState =
  | 'starting'
  | 'ringing'
  | 'connecting'
  | 'ready'
  | 'ending'
  | 'ended'
  | 'error';

interface CallData {
  callId: string;
  status: CallStatus;
  kind: Kind;
}

interface CallRoomProps {
  peerId: string;
  peerName: string;
  kind: Kind;
  incoming?: boolean;
  incomingCallId?: string;
}

interface CallStartResponse {
  success: boolean;
  error?: string;
  message?: string;
  call?: {
    callId: string;
    status: CallStatus;
    kind: Kind;
  };
}

interface CallStatusResponse {
  success: boolean;
  error?: string;
  call?: {
    status: CallStatus;
  };
}

interface LiveKitTokenResponse {
  success: boolean;
  error?: string;
  message?: string;
  token?: string;
  wsUrl?: string;
  maxSeconds?: number;
}

interface MediaAvailability {
  microphone: boolean;
  camera: boolean;
}

const TERMINAL_STATUSES: CallStatus[] = [
  'rejected',
  'busy',
  'cancelled',
  'missed',
  'ended',
  'failed',
];

// Check available media devices without keeping their tracks open.
async function checkMediaDevices(
  kind: Kind
): Promise<MediaAvailability> {
  const result: MediaAvailability = {
    microphone: false,
    camera: false,
  };

  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    return result;
  }

  // Check microphone independently.
  try {
    const audioStream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

    result.microphone =
      audioStream.getAudioTracks().length > 0;

    audioStream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (error) {
    console.warn(
      '[CallRoom] Microphone unavailable:',
      error
    );
  }

  // Camera is only needed for video calls.
  if (kind === 'video') {
    try {
      const videoStream =
        await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });

      result.camera =
        videoStream.getVideoTracks().length > 0;

      videoStream.getTracks().forEach((track) => {
        track.stop();
      });
    } catch (error) {
      console.warn(
        '[CallRoom] Camera unavailable:',
        error
      );
    }
  }

  return result;
}

export default function CallRoom({
  peerId,
  peerName,
  kind,
  incoming = false,
  incomingCallId = '',
}: CallRoomProps) {
  const router = useRouter();

  const [state, setState] =
    useState<ScreenState>('starting');

  const [call, setCall] =
    useState<CallData | null>(null);

  const [token, setToken] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [maxSeconds, setMaxSeconds] = useState(0);

  const [error, setError] = useState('');

  const [media, setMedia] =
    useState<MediaAvailability>({
      microphone: false,
      camera: false,
    });

  const [mediaWarning, setMediaWarning] =
    useState('');

  const endingRef = useRef(false);

  const startPromiseRef =
    useRef<Promise<CallData> | null>(null);

  const pollRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const redirectTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const goBack = useCallback(
    (delay = 1000) => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }

      redirectTimerRef.current = setTimeout(() => {
        router.back();
      }, delay);
    },
    [router]
  );

  // Initialize incoming or outgoing call.
  useEffect(() => {
    let active = true;

    const initializeCall = async () => {
      try {
        if (incoming) {
          if (!incomingCallId) {
            throw new Error(
              'Incoming call ID is missing'
            );
          }

          if (!/^[a-f\d]{24}$/i.test(incomingCallId)) {
            throw new Error(
              'Invalid incoming call ID'
            );
          }

          if (!active) return;

          setCall({
            callId: incomingCallId,
            status: 'ringing',
            kind,
          });

          setState('ringing');

          return;
        }

        if (!startPromiseRef.current) {
          startPromiseRef.current = (async () => {
            const response = await fetch(
              '/api/calls/start',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  peerUserId: peerId,
                  kind,
                }),
              }
            );

            const data =
              (await response.json()) as CallStartResponse;

            if (
              !response.ok ||
              !data.success ||
              !data.call?.callId
            ) {
              throw new Error(
                data.error ||
                  data.message ||
                  'Unable to start call'
              );
            }

            return {
              callId: data.call.callId,
              status: data.call.status,
              kind: data.call.kind,
            };
          })();
        }

        const newCall =
          await startPromiseRef.current;

        if (!active) return;

        setCall(newCall);
        setState('ringing');
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to initialize call'
        );

        setState('error');
      }
    };

    void initializeCall();

    return () => {
      active = false;
    };
  }, [incoming, incomingCallId, peerId, kind]);

  // Poll call status.
  useEffect(() => {
    if (!call?.callId || state !== 'ringing') {
      return;
    }

    let active = true;
    let checking = false;

    const checkStatus = async () => {
      if (checking || endingRef.current) return;

      checking = true;

      try {
        const response = await fetch(
          `/api/calls/status?callId=${encodeURIComponent(
            call.callId
          )}`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const data =
          (await response.json()) as CallStatusResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.call
        ) {
          throw new Error(
            data.error || 'Unable to check call'
          );
        }

        if (!active || endingRef.current) return;

        const status = data.call.status;

        if (status === 'accepted') {
          stopPolling();
          setState('connecting');
          return;
        }

        if (
          TERMINAL_STATUSES.includes(
            status as CallStatus
          )
        ) {
          stopPolling();

          endingRef.current = true;

          setState('ended');
          goBack(1500);
        }
      } catch (err) {
        if (active) {
          console.error(
            '[CallRoom] Status check error:',
            err
          );
        }
      } finally {
        checking = false;
      }
    };

    void checkStatus();

    pollRef.current = setInterval(() => {
      void checkStatus();
    }, 1500);

    return () => {
      active = false;
      stopPolling();
    };
  }, [
    call?.callId,
    state,
    stopPolling,
    goBack,
  ]);

  // Obtain LiveKit token and check media devices.
  useEffect(() => {
    if (!call?.callId || state !== 'connecting') {
      return;
    }

    let active = true;

    const connectToLiveKit = async () => {
      try {
        const response = await fetch(
          '/api/livekit/token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              callId: call.callId,
            }),
          }
        );

        const data =
          (await response.json()) as LiveKitTokenResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.token ||
          !data.wsUrl
        ) {
          throw new Error(
            data.error ||
              data.message ||
              'Unable to connect to call'
          );
        }

        if (!active) return;

        setToken(data.token);
        setWsUrl(data.wsUrl);

        setMaxSeconds(
          Number(data.maxSeconds) || 0
        );

        // Check devices before mounting LiveKitRoom.
        const available =
          await checkMediaDevices(kind);

        if (!active) return;

        setMedia(available);

        const warnings: string[] = [];

        if (!available.microphone) {
          warnings.push('Microphone not available');
        }

        if (
          kind === 'video' &&
          !available.camera
        ) {
          warnings.push('Camera not available');
        }

        setMediaWarning(warnings.join(' • '));

        // Continue even if a media device is missing.
        setState('ready');
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : 'LiveKit connection failed'
        );

        console.error(
          '[CallRoom] LiveKit token error:',
          err
        );

        setState('error');
      }
    };

    void connectToLiveKit();

    return () => {
      active = false;
    };
  }, [call?.callId, state, kind]);

  // End call on explicit user action.
  const finishCall = useCallback(async () => {
    if (endingRef.current) return;

    endingRef.current = true;

    stopPolling();

    setState('ending');

    try {
      if (call?.callId) {
        const response = await fetch(
          '/api/calls/end',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            keepalive: true,
            body: JSON.stringify({
              callId: call.callId,
            }),
          }
        );

        if (!response.ok) {
          console.error(
            '[CallRoom] Server could not end call'
          );
        }
      }
    } catch (err) {
      console.error(
        '[CallRoom] End call error:',
        err
      );
    } finally {
      setState('ended');
      goBack(1000);
    }
  }, [
    call?.callId,
    stopPolling,
    goBack,
  ]);

  const handleEnd = useCallback(() => {
    void finishCall();
  }, [finishCall]);

  // Clean up timers.
  useEffect(() => {
    return () => {
      stopPolling();

      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [stopPolling]);

  // Loading screen.
  if (
    state === 'starting' ||
    state === 'ringing' ||
    state === 'connecting' ||
    state === 'ending'
  ) {
    const label =
      state === 'starting'
        ? 'Starting call…'
        : state === 'ringing'
          ? incoming
            ? 'Connecting to incoming call…'
            : 'Calling… Waiting for answer'
          : state === 'connecting'
            ? 'Checking microphone and camera…'
            : 'Ending call…';

    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-slate-950 text-white gap-4 p-5">
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-3xl font-bold shadow-xl">
          {peerName.slice(0, 2).toUpperCase()}
        </div>

        <p className="text-xl font-semibold">
          {peerName}
        </p>

        <p className="text-sm text-slate-400">
          {label}
        </p>

        {state === 'ringing' && (
          <div className="flex gap-1 mt-1">
            {[0, 1, 2].map((item) => (
              <span
                key={item}
                className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
                style={{
                  animationDelay: `${item * 200}ms`,
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleEnd}
          disabled={state === 'ending'}
          className="mt-8 h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
          aria-label="End call"
        >
          <PhoneXMarkIcon className="h-7 w-7" />
        </button>

        <p className="text-xs text-slate-500">
          {incoming ? 'Leave call' : 'Cancel call'}
        </p>
      </div>
    );
  }

  // Error screen.
  if (state === 'error') {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-slate-950 text-white gap-4 p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <PhoneXMarkIcon className="h-8 w-8 text-red-400" />
        </div>

        <p className="text-red-400 text-lg font-semibold">
          Call failed
        </p>

        <p className="text-sm text-slate-400 max-w-sm">
          {error}
        </p>

        <button
          onClick={() => {
            if (call?.callId) {
              void finishCall();
            } else {
              router.back();
            }
          }}
          className="px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600"
        >
          Go back
        </button>
      </div>
    );
  }

  // Ended screen.
  if (state === 'ended') {
    return (
      <div className="h-dvh flex flex-col gap-3 items-center justify-center bg-slate-950 text-white">
        <PhoneXMarkIcon className="h-10 w-10 text-red-400" />

        <p className="text-lg font-semibold">
          Call ended
        </p>
      </div>
    );
  }

  // LiveKit room.
  if (state === 'ready' && token && wsUrl && call) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect
        audio={media.microphone}
        video={
          kind === 'video' && media.camera
        }
        onDisconnected={() => {
          console.warn(
            '[LiveKit] Room disconnected'
          );

          // Do not end the CallSession automatically here.
          // A media/transport error must not end the call.
        }}
        onError={(err) => {
          console.error(
            '[LiveKit] Room error:',
            err
          );

          // Keep the call session alive.
          // Show the error in console for diagnosis.
        }}
        style={{
          height: '100dvh',
        }}
      >
        <RoomAudioRenderer />

        <CallInner
          kind={kind}
          peerName={peerName}
          maxSeconds={maxSeconds}
          microphoneAvailable={media.microphone}
          cameraAvailable={media.camera}
          mediaWarning={mediaWarning}
          onEnd={handleEnd}
        />
      </LiveKitRoom>
    );
  }

  return null;
}

function CallInner({
  kind,
  peerName,
  maxSeconds,
  microphoneAvailable,
  cameraAvailable,
  mediaWarning,
  onEnd,
}: {
  kind: Kind;
  peerName: string;
  maxSeconds: number;
  microphoneAvailable: boolean;
  cameraAvailable: boolean;
  mediaWarning: string;
  onEnd: () => void;
}) {
  const room = useRoomContext();

  const { localParticipant } = useLocalParticipant();

  const [elapsed, setElapsed] = useState(0);

  const [micOn, setMicOn] =
    useState(microphoneAvailable);

  const [camOn, setCamOn] =
    useState(
      kind === 'video' && cameraAvailable
    );

  const [controlError, setControlError] =
    useState('');

  const endedRef = useRef(false);

  // Duration timer.
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // End when call limit is reached.
  useEffect(() => {
    if (
      maxSeconds > 0 &&
      elapsed >= maxSeconds &&
      !endedRef.current
    ) {
      endedRef.current = true;

      onEnd();
      room.disconnect();
    }
  }, [
    elapsed,
    maxSeconds,
    onEnd,
    room,
  ]);

  // Microphone toggle.
  const toggleMic = async () => {
    setControlError('');

    try {
      const next = !micOn;

      if (next && !microphoneAvailable) {
        setControlError(
          'No microphone is available. Check your device and browser permissions.'
        );

        return;
      }

      await localParticipant.setMicrophoneEnabled(
        next
      );

      setMicOn(next);
    } catch (error) {
      console.error(
        '[CallRoom] Microphone error:',
        error
      );

      setControlError(
        'Unable to change microphone settings.'
      );
    }
  };

  // Camera toggle.
  const toggleCam = async () => {
    setControlError('');

    try {
      const next = !camOn;

      if (next && !cameraAvailable) {
        setControlError(
          'No camera is available. Check your device and browser permissions.'
        );

        return;
      }

      await localParticipant.setCameraEnabled(
        next
      );

      setCamOn(next);
    } catch (error) {
      console.error(
        '[CallRoom] Camera error:',
        error
      );

      setControlError(
        'Unable to change camera settings.'
      );
    }
  };

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
      seconds % 60
    ).padStart(2, '0')}`;

  const remaining =
    maxSeconds > 0
      ? Math.max(0, maxSeconds - elapsed)
      : null;

  return (
    <div className="relative h-dvh bg-slate-950">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full text-xs sm:text-sm flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />

        <span className="font-semibold">
          {peerName}
        </span>

        <span className="text-slate-400">•</span>

        <span className="tabular-nums">
          {formatTime(elapsed)}
        </span>

        {remaining !== null && (
          <span className="text-amber-300 font-semibold">
            ({formatTime(remaining)} left)
          </span>
        )}
      </div>

      {kind === 'video' ? (
        <VideoConference />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-white gap-4">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-4xl font-bold">
            {peerName.slice(0, 2).toUpperCase()}
          </div>

          <p className="text-xl font-semibold">
            {peerName}
          </p>

          <p className="text-sm text-slate-400 tabular-nums">
            {formatTime(elapsed)}
          </p>
        </div>
      )}

      {(mediaWarning || controlError) && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md rounded-xl bg-amber-500/15 border border-amber-400/30 px-4 py-3 text-center text-xs text-amber-200">
          {controlError || mediaWarning}
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        <button
          onClick={toggleMic}
          className={`h-14 w-14 rounded-full flex items-center justify-center text-white ${
            micOn
              ? 'bg-white/20 hover:bg-white/30'
              : 'bg-red-600'
          }`}
          aria-label="Toggle microphone"
        >
          <MicrophoneIcon className="h-6 w-6" />
        </button>

        {kind === 'video' && (
          <button
            onClick={toggleCam}
            className={`h-14 w-14 rounded-full flex items-center justify-center text-white ${
              camOn
                ? 'bg-white/20 hover:bg-white/30'
                : 'bg-red-600'
            }`}
            aria-label="Toggle camera"
          >
            {camOn ? (
              <VideoCameraIcon className="h-6 w-6" />
            ) : (
              <VideoCameraSlashIcon className="h-6 w-6" />
            )}
          </button>
        )}

        <button
          onClick={() => {
            if (endedRef.current) return;

            endedRef.current = true;

            onEnd();
            room.disconnect();
          }}
          className="h-14 w-14 rounded-full flex items-center justify-center text-white bg-red-600 hover:bg-red-700"
          aria-label="End call"
        >
          <PhoneXMarkIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
